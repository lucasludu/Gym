# Pendientes

> Resumen de lo que falta, actualizado al 01/11/2026.
> El backlog completo y detallado está en `specs/02-tareas.md`.

---

## 1. Lo que tenés que hacer vos

Cosas que no puedo hacer desde acá o que necesitan una decisión tuya.

- [x] **Probar la app en Expo Go** (cierra T0.1)
- [x] **Actualizar Node.js a 22 LTS**
- [x] **Crear el repo en GitHub** → https://github.com/lucasludu/Gym
- [x] **Resolver las ambigüedades de las specs** (ver sección 3)

---

## 2. Fase 0 · Setup ✅ terminada

- [x] T0.2 · Estructura de carpetas
- [x] T0.3 · Tests (Jest + RNTL)
- [x] T0.4 · ESLint + Prettier
- [x] T0.5 · API mock (json-server)
- [x] T0.6 · Variables de entorno
- [x] T0.1 · Crear el proyecto
- [x] T0.7 · Git y CI

---

## 3. Ambigüedades ✅ todas resueltas (01/11/2026)

Las decisiones quedaron en `specs/01-modelo-datos.md` y `specs/02-tareas.md`.

1. **Login mock** (T5.3) → solo por email; la contraseña se valida en formato pero no se guarda ni se compara. La valida el backend real (Fase 9).
2. **Registro** (T5.4) → crea solo el `User`, sin membresía. Nuevo motivo de bloqueo `no_membership` en `canBookClass`.
3. **Entrenamiento en curso** (T5.21 / T5.25) → vive solo en el celular hasta finalizar; recién ahí se envía al servidor.
4. **`inferTrackingType`** (T2.1) → reglas en orden: excepciones → nombre (`time`) → equipamiento con peso (`weight_reps`) → resto (`reps`).
5. **Récords de ejercicios por tiempo** (T1.7) → se agregó `maxSeconds` y se definió `achievedAt`.
6. **Colores de `ClassType`** (T3.1) → 6 acentos fijos: `accentOrange`, `accentBlue`, `accentGreen`, `accentPurple`, `accentPink`, `accentTeal`. El schema los valida.
7. **Nombre de T5.21** → "Iniciar entrenamiento".

---

## 4. Dependencias que faltan instalar

Se instalan cuando llegue la tarea que las usa.

**Ya aprobadas en CLAUDE.md**
- ~~`@tanstack/react-query` → T2.5~~ ✅ instalada
- `zustand` → T5.2
- `react-hook-form` + `@hookform/resolvers` → T5.3

**Nombradas en las tareas (hay que aprobarlas)**
- `expo-secure-store` → T5.2
- `expo-notifications` y `expo-haptics` → T5.24, T6.4
- `react-native-reanimated` → T6.3
- `@shopify/flash-list` → T6.6
- `eas-cli` → T7.3
- Maestro (herramienta aparte, no npm) → T7.1

**Sin definir todavía**
- Librería de gráficos → T5.29
  Opciones compatibles con Expo Go: `victory-native` (Skia) o `react-native-gifted-charts` (SVG).
- Persistencia local → T5.25
  `@react-native-async-storage/async-storage` (con `persist` de Zustand); la ambigüedad 3 confirmó que hace falta. Hay que aprobarla.
- ~~Fechas → T1.2~~ ✅ sin librería (`src/domain/dates.ts`)

---

## 5. Backlog por fase

Fases 1 y 2 terminadas; el resto, sin empezar.

**Fase 1 · Dominio** ✅ terminada
- T1.1 Schemas Zod
- T1.2 Utilidades de fecha
- T1.3 Membresía
- T1.4 Clases
- T1.5 Reglas de reserva
- T1.6 Entrenamientos
- T1.7 1RM y récords
- T1.8 Racha semanal

**Fase 2 · Datos y API** ✅ terminada
- ~~T2.1 Importador de ejercicios (wger)~~ ✅ 904 ejercicios en `mock/db.json`
- ~~T2.2 Seed del mock~~ ✅ `npm run seed`
- ~~T2.3 Cliente HTTP~~ ✅ `src/api/client.ts`
- ~~T2.4 Funciones de API por recurso~~ ✅ `src/api/*.ts`
- ~~T2.5 TanStack Query~~ ✅ `src/hooks/`

**Fase 3 · Design system**
- T3.1 Theme (claro y oscuro)
- T3.2 Componentes base
- T3.3 Estados de pantalla
- T3.4 Imagen de ejercicio

**Fase 4 · Specs de features** (bloquean la Fase 5)
- T4.1 `auth.md`
- T4.2 `home.md`
- T4.3 `reservas.md`
- T4.4 `rutina.md`
- T4.5 `workout-logger.md`
- T4.6 `progreso.md`

**Fase 5 · Features del MVP** (31 tareas)
- Navegación y auth: T5.1 a T5.5
- Home: T5.6 a T5.9
- Reservas: T5.10 a T5.16
- Rutina: T5.17 a T5.20
- Workout logger: T5.21 a T5.26
- Progreso: T5.27 a T5.30
- Perfil: T5.31

**Fase 6 · Pulido** — T6.1 a T6.7
**Fase 7 · Entrega para el portfolio** — T7.1 a T7.4
**Fase 8 · Post-MVP** — T8.1 a T8.5
**Fase 9 · Backend** — T9.1 a T9.11

---

## Próximo paso sugerido

1. Fase 3, empezando por T3.1 (theme claro y oscuro, con los 6 acentos de `ClassType`).
