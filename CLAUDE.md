# CLAUDE.md

Guía para trabajar en este repo. Leela antes de cada tarea.

## Proyecto
App mobile para socios de un gimnasio (proyecto de portfolio). La visión y el alcance están en `specs/00-producto.md`. Etapa actual: **front con API mock**.

## Stack
- React Native + **Expo** (SDK más reciente, compatible con Expo Go)
- **TypeScript** en modo estricto (`strict: true`); nada de `any`
- Navegación: **Expo Router** (rutas por archivos en `app/`)
- Datos del servidor: **TanStack Query**
- Estado de cliente: **Zustand** (solo para estado que no viene de la API)
- Formularios: **React Hook Form + Zod**
- Tests: **Jest** (preset `jest-expo`) + **React Native Testing Library**
- Mock de API: **json-server** (`mock/db.json`)

Antes de agregar una dependencia nueva, preguntá. Solo se usan librerías compatibles con Expo Go, y se instalan con `npx expo install`.

## Estructura
```
app/                  # Pantallas (Expo Router)
src/
  api/                # Funciones de acceso a la API, una por recurso (bookings.ts, classes.ts...)
  hooks/              # Hooks de TanStack Query (useClasses, useBookClass...)
  components/
    ui/               # Componentes base del design system (Button, Card, Text...)
    <feature>/        # Componentes específicos de cada feature
  domain/             # Tipos, schemas Zod y lógica pura (cálculo de PRs, rachas, etc.)
  store/              # Stores de Zustand
  theme/              # Colores, tipografía, espaciados
mock/db.json          # Datos de la API mock
specs/                # Specs del producto y de cada feature
```

### Reglas de arquitectura
- Las pantallas **nunca** llaman a `fetch` directamente: pantalla → hook → `src/api/`.
- La URL base de la API sale de una variable de entorno (`EXPO_PUBLIC_API_URL`). Cambiarla debe bastar para pasar al backend real.
- La lógica de negocio va en `src/domain/` como funciones puras, sin dependencias de React.
- Los tipos se derivan de los schemas Zod (`z.infer`), sin duplicarlos.
- Los colores y espaciados salen de `src/theme/`; no se hardcodean.

## Flujo de trabajo: SDD + TDD
1. **Spec primero.** Cada feature tiene su archivo en `specs/features/` con requisitos y criterios de aceptación. Si falta o es ambigua, frená y preguntá en lugar de suponer.
2. **Tareas chicas.** Dividí la feature en tareas que se puedan completar y testear de forma independiente.
3. **TDD por tarea:**
   - **Rojo:** escribí los tests a partir de los criterios de aceptación. Mostralos y corrélos para confirmar que fallan.
   - **Verde:** implementá el código mínimo para que pasen.
   - **Refactor:** mejorá el código sin romper los tests.
4. **No modifiques un test para que pase**, salvo que esté mal respecto de la spec; en ese caso, explicá por qué.
5. Al terminar cada tarea: `npm test` y `npm run typecheck` sin errores, y un commit.

## Tests
- Lógica de `domain/`: tests unitarios exhaustivos, incluyendo casos borde.
- Componentes: testear comportamiento visible para el usuario (texto, estados, interacciones), no detalles de implementación.
- Buscar elementos por rol, texto o `accessibilityLabel`; usar `testID` solo como último recurso.
- Los tests van junto al archivo: `ClassCard.tsx` → `ClassCard.test.tsx`.
- Excepción: los tests de pantallas van en `__tests__/app/`, porque Expo Router trata todo archivo dentro de `app/` como ruta.

## Convenciones
- Componentes en PascalCase, hooks con prefijo `use`, archivos de lógica en camelCase.
- Componentes funcionales, exportación con nombre (no `default`, salvo las pantallas de `app/`).
- Textos de la interfaz en **español rioplatense**; código, nombres de variables y commits en **inglés**.
- Commits con Conventional Commits: `feat(bookings): add class card component`.
- Todo elemento interactivo tiene `accessibilityLabel` y un área táctil de al menos 44 px.
- Toda pantalla con datos maneja los estados de carga, error y vacío.

## Comandos
```bash
npx expo start          # Levantar la app (escanear el QR con Expo Go)
npm test                # Correr los tests
npm run typecheck       # Chequear tipos (app + scripts/)
npm run mock            # Levantar json-server en el puerto 3000
npm run import:exercises  # Reimportar el catálogo de ejercicios de wger a mock/db.json
npm run seed            # Regenerar los datos del mock relativos a hoy (no toca exercises)
```
Recordatorio: desde el celular, la API mock se accede con la IP local de la PC, no con `localhost`.
