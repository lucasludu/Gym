# 02 · Tareas

> Backlog completo del proyecto, en orden de ejecución. Cada tarea es chica, se implementa con TDD (ver `CLAUDE.md`) y termina con `npm test` y `npx tsc --noEmit` en verde y un commit.
>
> **Cómo usarlo con Claude Code:** pedile una tarea por vez, por ejemplo: *"Hacé la tarea T1.3 de specs/02-tareas.md"*. Al terminarla, marcala con `[x]`.
>
> **Leyenda:** `→` depende de · 📄 spec de referencia · ✅ criterio de terminado

---

## Fase 0 · Setup del proyecto

- [x] **T0.1 · Crear el proyecto**
  `npx create-expo-app@latest`, TypeScript en modo estricto, borrar el contenido de ejemplo del template.
  ✅ La app abre en Expo Go con una pantalla vacía.

- [x] **T0.2 · Estructura de carpetas** → T0.1
  Crear `src/{api,hooks,components/ui,domain,store,theme}`, `mock/`, `scripts/`, con alias de imports (`@/`).
  📄 `CLAUDE.md` · ✅ Un import con `@/` compila.

- [x] **T0.3 · Tests** → T0.1
  Jest con preset `jest-expo` + React Native Testing Library. Un test de ejemplo.
  ✅ `npm test` corre y pasa.

- [x] **T0.4 · Calidad de código** → T0.1
  ESLint + Prettier con configuración de Expo. Scripts `lint` y `format`.
  ✅ `npm run lint` sin errores.

- [x] **T0.5 · API mock** → T0.2
  Instalar json-server, crear `mock/db.json` vacío con todas las colecciones, script `npm run mock` en el puerto 3000.
  ✅ `GET /exercises` responde `[]`.

- [x] **T0.6 · Variables de entorno** → T0.2
  `EXPO_PUBLIC_API_URL` en `.env` (con `.env.example` versionado), módulo `src/api/config.ts` que la lee.
  ✅ Cambiar la variable cambia la URL usada.

- [x] **T0.7 · Git y CI**
  Repo en GitHub, `.gitignore`, GitHub Actions que corre lint, tests y chequeo de tipos en cada push.
  ✅ El badge de CI está en verde.

---

## Fase 1 · Dominio (lógica pura)

📄 `specs/01-modelo-datos.md` · Todo en `src/domain/`, sin React, con tests exhaustivos.

- [x] **T1.1 · Schemas Zod** → T0.3
  Un schema por entidad con su tipo derivado (`z.infer`). Incluye enums y validaciones de rangos.
  ✅ Tests de datos válidos e inválidos por entidad.

- [x] **T1.2 · Utilidades de fecha** → T1.1
  Inicio y fin de semana (lunes a domingo), diferencia en días, todo con zona `America/Argentina/Buenos_Aires`. La fecha actual siempre se recibe por parámetro.
  ✅ Tests con casos de cambio de semana y de mes.

- [x] **T1.3 · Membresía** → T1.2
  `getMembershipStatus` y `getDaysLeft`.
  ✅ Tests de `active`, `expiring` (límite de 5 días inclusive) y `expired`.

- [ ] **T1.4 · Clases** → T1.2
  `getSpotsLeft`, `isFull`, `hasStarted`.
  ✅ Tests de casos borde (cupo 0, sobrecupo, clase empezando justo ahora).

- [ ] **T1.5 · Reglas de reserva** → T1.3, T1.4
  `canBookClass(...)` que devuelve `{ ok: true }` o `{ ok: false, reason: BookingBlockReason }`, y `canCancelBooking(...)` (límite de 2 horas).
  ✅ Un test por cada una de las 7 reglas y por cada motivo de bloqueo.

- [ ] **T1.6 · Entrenamientos** → T1.1
  `getWorkoutDuration`, `getTotalVolume` (solo series completadas).
  ✅ Tests con sesiones en curso, vacías y con series sin completar.

- [ ] **T1.7 · 1RM y récords** → T1.6
  `estimate1Rm` (Epley, rango 1–12 reps, redondeo a 0,5 kg), `getPersonalRecords`, `isNewRecord` (empate no cuenta).
  ✅ Tests de la fórmula, límites del rango y empates.

- [ ] **T1.8 · Racha semanal** → T1.2, T1.6
  `getWeeklyStreak` según las reglas del modelo.
  ✅ Tests: racha cortada, semana actual en curso, semana actual cumplida, varias actividades el mismo día.

---

## Fase 2 · Datos y capa de API

- [ ] **T2.1 · Importador de ejercicios (wger)** → T1.1
  `scripts/import-exercises.ts` con funciones puras de mapeo (`mapWgerExercise`, `inferTrackingType`, `pickMainImage`, `stripHtml`) testeadas con fixtures.
  📄 sección "Fuente de datos de ejercicios" · ✅ Tests sin red en verde y `mock/db.json` con ejercicios reales.

- [ ] **T2.2 · Seed del mock** → T2.1
  `mock/seed.ts` que genera usuarios, planes, membresías, entrenadores, tipos de clase, clases de las próximas 2 semanas (relativas a hoy), reservas, una rutina y un historial de entrenamientos de 8 semanas.
  ✅ Cubre todos los casos borde listados en la sección "API mock".

- [ ] **T2.3 · Cliente HTTP** → T0.6, T1.1
  `src/api/client.ts`: wrapper de `fetch` con URL base, timeout, manejo de errores tipado y validación de respuestas con Zod.
  ✅ Tests con `fetch` mockeado: éxito, error HTTP, timeout, respuesta inválida.

- [ ] **T2.4 · Funciones de API por recurso** → T2.3
  `classes.ts`, `bookings.ts`, `memberships.ts`, `routines.ts`, `exercises.ts`, `workouts.ts`, `users.ts`.
  ✅ Cada función testeada con `fetch` mockeado.

- [ ] **T2.5 · TanStack Query** → T2.4
  `QueryClientProvider`, claves de query centralizadas (`queryKeys.ts`), hooks base (`useClassSessions`, `useMyBookings`, `useMembership`, `useRoutine`, `useExercises`, `useWorkoutHistory`).
  ✅ Tests de hooks con un `QueryClient` de prueba.

---

## Fase 3 · Design system

- [ ] **T3.1 · Theme** → T0.2
  Colores (claro y oscuro), tipografía, espaciados, radios, sombras. Hook `useTheme`.
  ✅ Tokens tipados; cambiar el esquema del sistema cambia el tema.

- [ ] **T3.2 · Componentes base** → T3.1
  `Text`, `Button` (variantes y estado loading/disabled), `Card`, `Badge`, `Input`, `IconButton`.
  ✅ Tests de comportamiento y `accessibilityLabel`; área táctil ≥ 44 px.

- [ ] **T3.3 · Estados de pantalla** → T3.2
  `LoadingSkeleton`, `ErrorState` (con botón reintentar), `EmptyState`.
  ✅ Tests de cada estado.

- [ ] **T3.4 · Imagen de ejercicio** → T3.2
  `ExerciseImage` con `expo-image`, placeholder por `muscleGroup` cuando no hay imagen, y componente `ImageAttribution`.
  ✅ Tests con y sin `imageUrl`.

---

## Fase 4 · Specs de features

Escribir cada spec **antes** de implementar la feature. Formato: objetivo, pantallas, requisitos, criterios de aceptación (Dado / Cuando / Entonces), estados de carga/error/vacío y casos borde.

- [ ] **T4.1** · `specs/features/auth.md`
- [ ] **T4.2** · `specs/features/home.md`
- [ ] **T4.3** · `specs/features/reservas.md`
- [ ] **T4.4** · `specs/features/rutina.md`
- [ ] **T4.5** · `specs/features/workout-logger.md`
- [ ] **T4.6** · `specs/features/progreso.md`

---

## Fase 5 · Features del MVP

### Navegación y auth · 📄 `features/auth.md`
- [ ] **T5.1 · Navegación** → T3.2
  Grupo `(auth)` y grupo `(tabs)` con Inicio, Clases, Rutina, Progreso y Perfil.
- [ ] **T5.2 · Sesión** → T5.1, T4.1
  Store de sesión (Zustand) persistida con `expo-secure-store`; rutas protegidas.
- [ ] **T5.3 · Login** → T5.2
  Formulario con React Hook Form + Zod, login mock contra `users`, errores de validación y de credenciales.
- [ ] **T5.4 · Registro** → T5.3
- [ ] **T5.5 · Logout** desde Perfil → T5.2

### Home · 📄 `features/home.md`
- [ ] **T5.6 · Tarjeta de membresía** (estado, días restantes, aviso si está por vencer) → T1.3, T2.5, T4.2
- [ ] **T5.7 · Próxima clase reservada** con acceso directo al detalle → T2.5
- [ ] **T5.8 · Racha semanal y progreso hacia el objetivo** → T1.8
- [ ] **T5.9 · Acceso rápido** "Empezar entrenamiento de hoy" → T5.6

### Reservas · 📄 `features/reservas.md`
- [ ] **T5.10 · Selector de semana y día** → T4.3
- [ ] **T5.11 · `ClassCard`** con estados disponible / lleno / reservado / empezada → T1.4
- [ ] **T5.12 · Lista de clases del día** con filtros por tipo → T5.10, T5.11
- [ ] **T5.13 · Detalle de clase** (descripción, entrenador, cupos, intensidad) → T5.12
- [ ] **T5.14 · Reservar** con actualización optimista y motivo de bloqueo visible → T1.5
- [ ] **T5.15 · Cancelar** con confirmación y límite de 2 horas → T1.5
- [ ] **T5.16 · Mis reservas** (próximas e historial) → T5.14

### Rutina · 📄 `features/rutina.md`
- [ ] **T5.17 · Vista de la rutina** con los días y su resumen → T4.4
- [ ] **T5.18 · Detalle del día** con ejercicios, series, reps, peso sugerido y descanso → T5.17
- [ ] **T5.19 · Detalle del ejercicio** con imagen, instrucciones y atribución → T3.4
- [ ] **T5.20 · Estado vacío** si no tiene rutina asignada → T3.3

### Workout logger · 📄 `features/workout-logger.md`
- [ ] **T5.21 · Iniciar sesión** desde un día de la rutina o libre (solo una en curso) → T4.5
- [ ] **T5.22 · Registrar series** precargando el peso de la vez anterior; completar con 1 toque → T5.21
- [ ] **T5.23 · Agregar y quitar series y ejercicios** → T5.22
- [ ] **T5.24 · Timer de descanso** con notificación local y haptics al terminar → T5.22
- [ ] **T5.25 · Persistir la sesión en curso** para no perderla si se cierra la app → T5.21
- [ ] **T5.26 · Finalizar** con resumen (duración, volumen, récords nuevos); descartar si está vacía → T1.7

### Progreso · 📄 `features/progreso.md`
- [ ] **T5.27 · Historial de entrenamientos** con detalle de cada sesión → T4.6
- [ ] **T5.28 · Récords personales** por ejercicio → T1.7
- [ ] **T5.29 · Gráfico por ejercicio** (1RM estimado y peso máximo en el tiempo) → T5.28
- [ ] **T5.30 · Celebración de récord nuevo** al finalizar un entrenamiento → T5.26

### Perfil
- [ ] **T5.31 · Perfil** con datos del usuario, plan, objetivo semanal editable y pantalla "Acerca de" con la atribución a wger → T5.5

---

## Fase 6 · Pulido

- [ ] **T6.1 · Modo oscuro** revisado en todas las pantallas
- [ ] **T6.2 · Accesibilidad**: lector de pantalla, contraste, tamaños de fuente dinámicos
- [ ] **T6.3 · Animaciones** con Reanimated (transiciones, feedback al reservar y al completar series)
- [ ] **T6.4 · Haptics** en acciones clave
- [ ] **T6.5 · Revisión de estados** de carga, error y vacío en todas las pantallas
- [ ] **T6.6 · Performance**: listas con `FlashList` si hace falta, imágenes cacheadas
- [ ] **T6.7 · Ícono y splash screen**

---

## Fase 7 · Entrega para el portfolio

- [ ] **T7.1 · Tests E2E** con Maestro de los flujos principales (login, reservar, registrar entrenamiento) — opcional
- [ ] **T7.2 · README** con capturas, GIF de la app, stack, arquitectura, decisiones, cómo correrlo y créditos
- [ ] **T7.3 · Build instalable** con EAS Build (APK de Android) y link en el README
- [ ] **T7.4 · Demo pública** con el mock hosteado (por ejemplo, json-server en un servicio gratuito) para que el APK funcione sin tu PC

---

## Fase 8 · Post-MVP

- [ ] **T8.1** · QR de acceso al gimnasio
- [ ] **T8.2** · Medidas corporales y fotos de progreso
- [ ] **T8.3** · Recordatorios locales (clase próxima, cuota por vencer)
- [ ] **T8.4** · Biblioteca de ejercicios con búsqueda y filtros
- [ ] **T8.5** · Modo offline (caché persistente de queries y cola de mutaciones)

---

## Fase 9 · Backend (resumen)

Se detallará en `specs/03-backend.md` al llegar a esta fase.

- [ ] **T9.1** · Spec del backend y contrato de API (OpenAPI), compatible con lo que ya consume el front
- [ ] **T9.2** · Setup: NestJS + PostgreSQL + Prisma + Docker Compose + tests
- [ ] **T9.3** · Auth con JWT y roles (socio, entrenador, admin)
- [ ] **T9.4** · CRUD de clases, rutinas y ejercicios; importador de wger reutilizado
- [ ] **T9.5** · Reservas con todas las reglas del lado del servidor y control de concurrencia en el cupo
- [ ] **T9.6** · Registro de entrenamientos y endpoints de progreso
- [ ] **T9.7** · Conectar el front: cambiar `EXPO_PUBLIC_API_URL`, auth real con tokens
- [ ] **T9.8** · Push notifications (development build + Expo Push)
- [ ] **T9.9** · Pagos de cuota con Mercado Pago en modo sandbox
- [ ] **T9.10** · Deploy del backend y la base de datos
- [ ] **T9.11** · Panel web para entrenador y admin
