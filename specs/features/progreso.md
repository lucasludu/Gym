# Feature · Progreso

Tareas: T5.27 (historial con detalle de cada sesión), T5.28 (récords personales), T5.29 (gráfico por ejercicio), T5.30 (celebración de récord nuevo).
Modelo: `WorkoutSession`, `WorkoutSet`, `Exercise`, `RoutineDay` y la sección **Progreso (todo derivado)** (1RM estimado, `PersonalRecord`, nuevo récord) en [`01-modelo-datos.md`](../01-modelo-datos.md). Ya existen `estimate1Rm`, `getPersonalRecords`, `isNewRecord`, `getWorkoutDuration` y `getTotalVolume` en `src/domain/`, y `useWorkoutHistory` (sesiones y series del socio).

## Objetivo
Que el socio vea que está mejorando: qué entrenó, cuánto levanta en cada ejercicio y cómo evolucionó. Todo se calcula en el celular a partir del historial; no hay colecciones de progreso.

## Dependencias
Aprobada para esta feature; se instala con `npx expo install` en T5.29:
- `react-native-gifted-charts`, con sus peers `react-native-svg` y `expo-linear-gradient`.

## Pantallas
- **Pestaña Progreso** (`/(tabs)/progress`): resumen del mes y, debajo, un control segmentado **"Historial" | "Récords"**. Empieza en "Historial".
- **Detalle de entrenamiento** (`/progress/workouts/[id]`).
- **Progreso del ejercicio** (`/progress/exercises/[id]`): récords y gráfico de un ejercicio.

Datos: `useWorkoutHistory(userId)` (todas las sesiones finalizadas y sus series), el catálogo de ejercicios que aparecen en ellas y los días de rutina (para los nombres). Todas las fechas en hora de Buenos Aires, con funciones puras que reciben `now`.

## Resumen del mes
Tres números del **mes calendario actual** (del 1 a hoy), con el nombre del mes ("Noviembre"):
- **Entrenamientos**: sesiones finalizadas con `startedAt` en el mes.
- **Días activos**: días distintos con un entrenamiento o una clase `attended` (la misma regla que la racha).
- **Volumen**: suma de `getTotalVolume` de esas sesiones ("12.450 kg"; con más de 100.000, "124 t").
- Debajo, la comparación con el mes anterior **a la misma altura** (del 1 al mismo día): "+2 entrenamientos que el mes pasado", "Igual que el mes pasado", "−1 entrenamiento que el mes pasado". Sin entrenamientos el mes anterior, no se muestra.
- Si el mes no tiene actividad: los tres en 0 y "Todavía no entrenaste este mes".

## Historial (T5.27)
- Lista de entrenamientos finalizados, **del más reciente al más viejo**, agrupados por semana: "Esta semana", "Semana pasada" y después "{d de mmmm} al {d de mmmm}".
- Cada fila: nombre (el del día de la rutina, o "Entrenamiento libre"; si el día ya no existe, "Entrenamiento de rutina"), fecha ("Hoy", "Ayer", "Jueves 29/10"), duración, cantidad de ejercicios y volumen ("52 min · 5 ejercicios · 4.250 kg"). Si tiene un récord nuevo (ver "Récord en el historial"), un badge "Récord" (`primary`).
- Tocar una fila abre el detalle. `accessibilityLabel` con todo: "Día A – Tren inferior, jueves 29 de octubre, 52 minutos, 5 ejercicios, 4250 kilos de volumen, con récord".
- Se muestran las primeras 20 semanas con actividad; el botón "Ver más" suma otras 20 (todo ya está cargado: paginación local).

### Detalle de entrenamiento
- Nombre, fecha y hora de inicio y fin ("Jueves 29/10 · 18:05 a 18:57"), duración, volumen y series completadas.
- Las **notas** de la sesión, si hay.
- Un bloque por ejercicio, en el orden de la primera serie completada (`completedAt`): nombre (botón que abre el progreso del ejercicio), y sus series completadas en orden: "1. 60 kg × 8", "2. 62,5 kg × 6"; con `reps`, "1. 12 reps"; con `time`, "1. 45 s". La serie que fue récord en ese momento lleva el badge "Récord".
- Solo se muestran series completadas (en el servidor no hay otras, pero si llegara alguna se ignora).
- No se puede editar ni borrar (fuera del MVP).
- Sesión inexistente (404 o borrada): "Este entrenamiento ya no existe" con "Volver".

### Récord en el historial
Una serie fue **récord en su momento** si `isNewRecord` da `true` comparándola con los récords calculados con **todas las series completadas antes de ella** (por `completedAt`). Así el historial muestra dónde se batió cada récord, aunque después se haya superado. Es una función pura nueva en `src/domain/personalRecord.ts` (por ejemplo, `getRecordSetIds(sets)`), con tests de empates y de la primera vez.

## Récords (T5.28)
- Una fila por ejercicio con al menos una serie completada (`getPersonalRecords`), **ordenadas por el récord más reciente** (`achievedAt`).
- Búsqueda por nombre (sin distinguir mayúsculas ni tildes) y filtro por grupo muscular (chips, uno a la vez), como en el buscador del logger.
- Cada fila: miniatura, nombre, la **métrica principal** y la fecha:

  | Datos del ejercicio | Métrica principal | Ejemplo |
  |---|---|---|
  | con 1RM estimado | "1RM est. {kg} kg" y, debajo, "Máx. {kg} kg" | "1RM est. 112,5 kg · Máx. 100 kg" |
  | con peso pero sin 1RM (reps > 12) | "Máx. {kg} kg" | "Máx. 40 kg" |
  | solo reps | "{n} reps" | "15 reps" |
  | solo tiempo | "{seg} s" (desde 60 s, "1 min 30 s") | "1 min 30 s" |

  Fecha: "Logrado el {d de mmmm}" (con año si no es el actual).
- Tocar una fila abre el progreso del ejercicio.
- Sin récords: "Todavía no tenés récords" / "Completá series en tus entrenamientos y acá vas a ver tus mejores marcas."
- Sin resultados de búsqueda: "No encontramos ejercicios con \"{búsqueda}\"".

## Progreso del ejercicio (T5.29)
- Imagen (`ExerciseImage` mediana), nombre y grupo muscular.
- Los récords del ejercicio (todas las métricas que tenga: 1RM estimado, peso máximo, reps máximas, tiempo máximo), cada uno con su fecha.
- **Gráfico de línea** (`react-native-gifted-charts`) con **un punto por sesión** en la que se hizo el ejercicio:
  - ejercicios `weight_reps`: dos series seleccionables con un control segmentado, **"1RM estimado"** (el mejor 1RM de la sesión) y **"Peso máximo"** (el mayor peso de la sesión). Empieza en "1RM estimado"; si ninguna sesión tiene 1RM (todas con más de 12 reps), solo "Peso máximo";
  - `reps`: las reps máximas de la sesión; `time`: los segundos máximos.
  - Rango: **"3 meses" | "6 meses" | "Todo"** (empieza en "3 meses"). Si el rango elegido tiene menos de 2 puntos y "Todo" tiene más, se sugiere "Ver todo".
  - Eje X con fechas cortas ("29/10"); eje Y en kg, reps o segundos, empezando cerca del mínimo (no en 0) para que se vea el cambio.
  - Tocar un punto muestra el valor y la fecha ("100 kg · 29/10").
  - Color: `primary` del tema (claro y oscuro); la línea y los puntos tienen el contraste de los tokens.
  - **Menos de 2 puntos**: en lugar del gráfico, "Hacé este ejercicio en al menos 2 entrenamientos para ver tu progreso."
- Los datos del gráfico salen de una función pura (`getExerciseProgress(sessions, sets, exerciseId, metric, range, now)` → `{ date, value }[]`), con tests; el componente solo dibuja.
- **Accesibilidad del gráfico**: el gráfico tiene `accessibilityLabel` con el resumen ("1RM estimado de los últimos 3 meses: de 95 a 112,5 kilos, 8 entrenamientos") y, debajo, un botón "Ver como tabla" que muestra los mismos puntos en una lista (fecha y valor). El gráfico no es la única forma de ver los datos.
- Debajo: las **últimas 5 sesiones** con el ejercicio (fecha y series, con el formato de "Última vez" de Rutina), cada una abre su detalle de entrenamiento.
- Ejercicio inexistente: "Este ejercicio ya no existe" con "Volver". Ejercicio sin historial (se abrió desde otro lado): "Todavía no hiciste este ejercicio."

## Celebración de récord nuevo (T5.30)
En el **resumen al finalizar** (T5.26, `workout-logger.md`), cuando hay al menos un récord nuevo:
- Arriba del resumen, un bloque destacado: ícono de trofeo, "¡Nuevo récord!" (o "¡{n} récords nuevos!") y la lista de récords con el valor anterior: "Sentadilla con barra · 100 kg (antes 95 kg)".
- Vibración de éxito (`expo-haptics`, ya aprobada en T4.5) una vez al aparecer.
- Una animación corta de entrada (escala y opacidad, menos de 1 segundo) con `Animated` de React Native. Si el sistema tiene **reducir movimiento** activado, aparece sin animación (como `LoadingSkeleton`).
- Se anuncia al lector de pantalla: "Nuevo récord: Sentadilla con barra, 100 kilos".
- Sin récords nuevos, no hay celebración (el resumen queda como está).
- La primera vez que se hace un ejercicio no es récord (regla del modelo), así que no se celebra.

## Estados
| Lugar | Carga | Error | Vacío |
|---|---|---|---|
| Resumen del mes | skeleton de 1 fila | `ErrorState` compacto | ceros y "Todavía no entrenaste este mes" |
| Historial | skeleton de 4 filas | `ErrorState` con "Reintentar" | "Todavía no registraste entrenamientos" con el botón "Ir a mi rutina" |
| Récords | skeleton de 4 filas | `ErrorState` con "Reintentar" | "Todavía no tenés récords" |
| Detalle de entrenamiento | skeleton | `ErrorState` con "Reintentar" | "Este entrenamiento ya no existe" |
| Progreso del ejercicio | skeleton | `ErrorState` con "Reintentar" | "Todavía no hiciste este ejercicio." |

- La pestaña tiene pull to refresh (sin skeletons). Al guardar un entrenamiento (T5.26) se invalida el historial, así que todo se actualiza solo.
- Si el catálogo de ejercicios falla pero el historial carga, las filas muestran "Ejercicio" como nombre y el placeholder de imagen; no es un error de pantalla.

## Accesibilidad
- Los números del resumen se leen con su unidad ("12450 kilos de volumen").
- El control segmentado usa rol `tab` con estado `selected`; los chips, estado `selected`.
- "Récord" siempre es texto (badge), no solo color.
- Gráfico: resumen en `accessibilityLabel` y alternativa en tabla (ver arriba).

## Criterios de aceptación

### Resumen
1. **Dado** 5 entrenamientos este mes y 3 el mes pasado hasta el mismo día, **entonces** veo "5 entrenamientos" y "+2 entrenamientos que el mes pasado".
2. **Dado** un entrenamiento y una clase `attended` el mismo día, **entonces** cuentan como 1 día activo.
3. **Dado** que no entrené este mes, **entonces** veo ceros y "Todavía no entrenaste este mes".

### Historial
4. **Dado** entrenamientos de esta semana y de la anterior, **entonces** los veo agrupados en "Esta semana" y "Semana pasada", del más reciente al más viejo.
5. **Dado** un entrenamiento del día A, **entonces** su fila dice "Día A – Tren inferior" con duración, ejercicios y volumen; uno libre dice "Entrenamiento libre".
6. **Dado** un entrenamiento en el que batí un récord, **entonces** su fila tiene "Récord", aunque después lo haya superado.
7. **Dado** una fila, **cuando** la toco, **entonces** veo el detalle con cada ejercicio y sus series en orden.
8. **Dado** más de 20 semanas con actividad, **cuando** toco "Ver más", **entonces** aparecen las siguientes.
9. **Dado** que no tengo entrenamientos, **entonces** veo "Todavía no registraste entrenamientos" e "Ir a mi rutina" me lleva a la pestaña Rutina.

### Récords
10. **Dado** una sentadilla con mejor serie 100 kg × 5, **entonces** veo "1RM est. 116,5 kg · Máx. 100 kg" y la fecha (Epley: 100 × (1 + 5/30) = 116,67, redondeado a 0,5).
11. **Dado** una plancha de 90 s como máximo, **entonces** veo "1 min 30 s".
12. **Dado** que busco "sentadilla", **entonces** solo veo los ejercicios que la contienen.
13. **Dado** el filtro "Piernas", **entonces** solo veo ejercicios de piernas.
14. **Dado** que no tengo series completadas, **entonces** veo "Todavía no tenés récords".

### Progreso del ejercicio
15. **Dado** un ejercicio hecho en 8 sesiones en los últimos 3 meses, **entonces** veo el gráfico de 1RM estimado con 8 puntos.
16. **Dado** el gráfico, **cuando** elijo "Peso máximo", **entonces** veo el mayor peso de cada sesión.
17. **Dado** un ejercicio hecho en una sola sesión, **entonces** veo "Hacé este ejercicio en al menos 2 entrenamientos para ver tu progreso."
18. **Dado** el gráfico, **cuando** toco "Ver como tabla", **entonces** veo las mismas fechas y valores en una lista.
19. **Dado** "3 meses" con 1 punto y "Todo" con 6, **entonces** veo la sugerencia "Ver todo".

### Celebración
20. **Dado** que finalicé con 100 kg en sentadilla y mi récord era 95 kg, **entonces** el resumen muestra "¡Nuevo récord!" con "100 kg (antes 95 kg)".
21. **Dado** dos récords nuevos, **entonces** veo "¡2 récords nuevos!" y los dos.
22. **Dado** que igualé mi récord, o hice el ejercicio por primera vez, **entonces** no hay celebración.
23. **Dado** reducir movimiento activado, **entonces** la celebración aparece sin animación.

## Casos borde
- **Entrenamiento que cruza la medianoche:** cuenta para el día y el mes de `startedAt`.
- **Fin de mes:** el 31 compara con "del 1 al 31" del mes anterior, que puede tener 30 días (se toma hasta su último día).
- **Empates de récord:** la primera serie en lograrlo es la que tiene el badge (regla del modelo).
- **Ejercicio que cambió de `trackingType`** en el catálogo: se calculan las métricas con los datos de cada serie (peso, reps o segundos), sin suponer el tipo.
- **Varias series con el mismo valor en una sesión:** un solo punto por sesión, con el mejor valor.
- **Mismo ejercicio dos veces en un entrenamiento:** en el detalle, un solo bloque con todas sus series en orden de `completedAt`.
- **Historial grande** (cientos de sesiones): los cálculos son funciones puras sobre los datos ya cargados, memorizadas por pantalla; la lista usa `FlatList` (FlashList queda para T6.6).

## Fuera de alcance (MVP)
- Editar o borrar entrenamientos.
- Medidas corporales, peso corporal o fotos de progreso.
- Comparar ejercicios entre sí o con otros socios.
- Exportar o compartir el progreso.
- Objetivos por ejercicio ("llegar a 100 kg").
