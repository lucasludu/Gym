# Feature · Workout logger

Tareas: T5.21 (iniciar), T5.22 (registrar series), T5.23 (agregar y quitar), T5.24 (timer de descanso), T5.25 (persistir el entrenamiento en curso), T5.26 (finalizar).
Modelo: `WorkoutSession` y `WorkoutSet` (con sus reglas), `RoutineDay`, `RoutineExercise`, `Exercise` y los récords (`getPersonalRecords`, `isNewRecord`) en [`01-modelo-datos.md`](../01-modelo-datos.md). El envío al servidor ya existe: `saveWorkout` (`src/api/workouts.ts`).

## Objetivo
Registrar lo que realmente se hizo en la sala (peso, repeticiones o tiempo de cada serie) con el celular en la mano y entre series: pocos toques, números grandes, el peso de la vez anterior ya cargado y un timer de descanso que avisa solo. Tiene que funcionar sin conexión y no perder nada si se cierra la app.

## Dependencias
Aprobadas para esta feature; cada una se instala con `npx expo install` en la tarea que la usa:
- `@react-native-async-storage/async-storage` → T5.25 (con `persist` de Zustand).
- `expo-notifications` y `expo-haptics` → T5.24.

## Pantallas
- **Logger** (`/workout`): pantalla completa fuera de las pestañas (sin tab bar), con el entrenamiento en curso. Se cierra con "Minimizar" (vuelve a donde estaba; el entrenamiento sigue en curso).
- **Agregar ejercicio** (`/workout/add-exercise`): buscador del catálogo, como modal.
- **Resumen** (`/workout/summary`): después de finalizar.
- El detalle del ejercicio (`/exercises/[id]`, de Rutina) se abre al tocar el nombre de un ejercicio en el logger.

## El entrenamiento en curso
Vive **solo en el celular**, en un store de Zustand (`src/store/`); no viene de la API. La lógica (crear, completar serie, agregar, quitar, armar lo que se envía) son funciones puras en `src/domain/`.

Forma (local, no es un schema de la API):
- `userId`, `routineDayId` (`null` si es libre), `name` (nombre del día o "Entrenamiento libre"), `startedAt`.
- `exercises`: lista ordenada de `{ key, exerciseId, restSeconds, routineExerciseId | null, sets }`.
- `sets`: lista ordenada de `{ key, weightKg, reps, seconds, completedAt | null }`. El `order` de cada serie es su posición (1, 2, 3…), recalculado al quitar series.
- `rest`: `{ endsAt, totalSeconds } | null` (el timer).

Solo puede haber **uno** en curso por usuario.

## Iniciar (T5.21)
- **Desde un día de la rutina** ("Empezar" en Inicio o en el detalle del día): un ejercicio por cada `RoutineExercise` del día, en su `order`, con `targetSets` series y su `restSeconds`. Nombre: el del día.
- **Libre** ("Entrenamiento libre" en Inicio o en Rutina): sin ejercicios. Descanso por defecto: 90 s.
- `startedAt` = ahora. Se abre el logger.
- **Ya hay uno en curso**: diálogo "Ya tenés un entrenamiento en curso" / "{nombre}, empezado a las {HH:mm}." con "Continuar el actual" (abre el logger con ese) y "Descartar y empezar" (destructive; descarta el actual y empieza el nuevo). Cancelar el diálogo no cambia nada.
- Funciona sin membresía o con la membresía vencida.
- Funciona sin conexión si la rutina y el historial ya están cargados; si no, "Empezar" espera esos datos (spinner) y, si fallan, se empieza igual sin precarga del historial (solo con lo planificado).

## Registrar series (T5.22)
Pantalla del logger:
- Arriba: nombre del entrenamiento, **tiempo transcurrido** ("12:34", desde `startedAt`, se actualiza cada segundo; desde 1 hora, "1:02:34"), y los botones "Minimizar" y "Finalizar".
- Una sección por ejercicio: miniatura, nombre (botón que abre el detalle del ejercicio), lo planificado si viene de la rutina ("4 × 8-10 · 60 kg", mismos textos que en Rutina) y una fila por serie.
- **Fila de serie**, según `trackingType`:

  | trackingType | Campos |
  |---|---|
  | `weight_reps` | "kg" y "reps" |
  | `reps` | "reps" |
  | `time` | "seg" |

  Cada fila tiene: número de serie, la columna **"Anterior"** (lo que se hizo en esa serie la última vez: "60 × 8", "12", "45 s"; "—" si no hay), los campos y el botón **"Completar"**.
- **Precarga** (los campos vienen llenos; se pueden editar):
  - **Peso**: el de la serie del mismo número en la última sesión finalizada con series completadas de ese ejercicio; si esa vez hubo menos series, el de la última. Sin historial: `targetWeightKg` de la rutina. Sin nada: vacío.
  - **Reps**: las del objetivo de la rutina (el mínimo del rango: "8-10" → 8). AMRAP o libre: las de la vez anterior, o vacío.
  - **Segundos**: `targetSeconds`, o los de la vez anterior, o vacío.
  - Lo que se edita en una serie no cambia las otras, salvo la serie siguiente aún sin completar: si cambio el peso de la serie 1, la 2 en adelante (sin completar y sin editar) toman ese peso.
- **Completar con un toque**: marca la serie como hecha (`completedAt` = ahora), la fila se marca como completada (texto "Hecha" además del color) y arranca el timer de descanso (T5.24). Tocar de nuevo la deshace (`completedAt` = `null`) y no cambia el timer.
- **Validación al completar** (si falla, no se completa y el campo muestra el error):
  - Peso: número ≥ 0, con coma o punto, a lo sumo 1 decimal ("Usá un número como 60 o 62,5"). Requerido en `weight_reps` ("Ingresá el peso").
  - Reps: entero > 0 ("Ingresá las repeticiones"). Requerido en `weight_reps` y `reps`.
  - Segundos: entero > 0 ("Ingresá los segundos"). Requerido en `time`.
  - Máximos razonables para evitar errores de tipeo: peso ≤ 500, reps ≤ 100, segundos ≤ 3600 ("Revisá el valor").
- Teclado numérico (`decimal-pad` para el peso, `number-pad` para el resto). Los números de los campos son grandes (al menos `subtitle`).
- Se puede editar una serie ya completada; sigue completada.

## Agregar y quitar (T5.23)
- **Agregar serie** (botón al final de cada ejercicio): agrega una fila al final, con los valores de la última serie del ejercicio (sin completar).
- **Quitar serie**: botón por fila ("Quitar serie 3"). Si es la única del ejercicio, no se puede quitar (el botón no aparece; se quita el ejercicio). Sin confirmación: si estaba completada, aparece "Serie quitada" con "Deshacer" durante 5 segundos.
- **Agregar ejercicio** (botón al final del entrenamiento): abre el buscador:
  - busca por nombre (sin distinguir mayúsculas ni tildes: "press banca" encuentra "Press de banca"), filtra por grupo muscular (chips, uno a la vez) y muestra miniatura, nombre y grupo;
  - el catálogo sale de la API (ya cargado si se puede: funciona sin conexión si está en caché);
  - al elegir uno se agrega al final con 1 serie, precargada con su historial, y 90 s de descanso; el buscador se cierra;
  - un ejercicio puede estar dos veces;
  - sin resultados: "No encontramos ejercicios con \"{búsqueda}\"".
- **Quitar ejercicio** (menú del ejercicio, "Quitar ejercicio"): si tiene series completadas, pide confirmación "¿Quitar {nombre}?" / "Se van a borrar {n} series completadas." con "Volver" y "Quitar" (destructive); si no, se quita directo.
- Reordenar ejercicios queda fuera del MVP.

## Timer de descanso (T5.24)
- **Arranca solo al completar una serie**, con el `restSeconds` de ese ejercicio (90 s en libre o en ejercicios agregados; con 0, no arranca). Si ya había uno corriendo, se reinicia con el nuevo.
- Se muestra en una **barra fija abajo** del logger: "Descanso 1:23", una barra de progreso y los botones "−15 s", "+15 s" y "Omitir". −15 s nunca baja de 0 (si llega a 0, termina).
- Se calcula con `endsAt` (instante de fin), no contando segundos: sigue bien si la app pasa a segundo plano o se cierra y se vuelve a abrir.
- **Al terminar**:
  - con la app abierta: vibración (`expo-haptics`, tipo éxito), la barra muestra "¡A la próxima serie!" 3 segundos y desaparece;
  - con la app en segundo plano o la pantalla bloqueada: **notificación local** programada al arrancar el timer (`expo-notifications`): "Terminó el descanso" / "Seguí con {ejercicio}.". Tocarla abre el logger.
  - Cambiar el tiempo (±15 s) reprograma la notificación; "Omitir", completar otra serie, finalizar o descartar la cancelan.
- **Permiso de notificaciones**: se pide la primera vez que arranca un timer. Si se niega, el timer funciona igual sin notificación y no se vuelve a pedir (se puede activar desde los ajustes del sistema).
- El timer también se ve en la tarjeta "Entrenamiento en curso" de Inicio ("Descanso 1:23").
- Accesibilidad: la barra es una región con `accessibilityLabel` "Descanso, quedan 1 minuto 23 segundos"; se anuncia el inicio y el fin, no cada segundo.

## Persistir el entrenamiento en curso (T5.25)
- El store del entrenamiento se persiste con `persist` de Zustand en AsyncStorage, con una clave por usuario. Cada cambio se guarda.
- Al abrir la app con sesión, si hay un entrenamiento en curso de ese usuario, se restaura (con el timer, si no terminó).
- **Inicio**: tarjeta destacada "Entrenamiento en curso" arriba de todo, con el nombre, el tiempo transcurrido, el descanso si hay, y el botón "Continuar" que abre el logger. En ese caso no se muestra "Entrenamiento de hoy" (criterio 21 de `home.md`).
- **Cerrar sesión** con un entrenamiento en curso: el aviso de `getSignOutConfirmation(true)` y, al confirmar, se borra el entrenamiento guardado de ese usuario y se cancela su notificación (`useSignOut`).
- Un valor guardado corrupto o de una versión vieja se descarta sin romper la app (como si no hubiera entrenamiento).
- **Entrenamiento muy viejo**: si empezó hace más de 12 horas, al abrir el logger o Inicio se pregunta "¿Seguís entrenando?" / "Empezaste {nombre} el {día} a las {HH:mm}." con "Finalizar" (va al flujo de finalizar, con `finishedAt` = ahora) y "Descartar".

## Finalizar (T5.26)
- "Finalizar" en el logger:
  - **Sin series completadas**: diálogo "No completaste ninguna serie" / "El entrenamiento no se va a guardar." con "Seguir entrenando" y "Descartar" (destructive). Descartar borra el entrenamiento local sin llamar a la API y vuelve a donde estaba.
  - **Con series sin completar**: diálogo "Tenés {n} series sin completar" / "No se van a guardar." con "Seguir entrenando" y "Finalizar igual".
  - **Todas completadas**: finaliza directo.
- Al finalizar: `finishedAt` = ahora, se arma el `NewWorkout` con **solo las series completadas** (los ejercicios sin series completadas no se envían) y se llama a `saveWorkout`. El botón muestra el spinner; no se puede finalizar dos veces.
- **Si falla** (sin conexión o error del servidor): el entrenamiento sigue en curso y guardado en el celular, con `finishedAt` fijado; se muestra "No pudimos guardar tu entrenamiento. Está a salvo en el celular; intentá de nuevo cuando tengas conexión." con "Reintentar". Reintentar usa el mismo `finishedAt` (la duración no crece mientras tanto). Hasta que se guarde, el logger muestra "Pendiente de guardar" y no se pueden completar series nuevas (se puede descartar).
- **Si sale bien**: se borra el entrenamiento local, se invalidan el historial y la racha (Inicio, Progreso, "Te toca hoy", "Última vez") y se abre el **resumen**.
- **Descartar** en cualquier momento (menú del logger, "Descartar entrenamiento"): confirmación "¿Descartar el entrenamiento?" / "Se va a borrar todo lo que registraste." con "Volver" y "Descartar" (destructive).

### Resumen
- "¡Buen entrenamiento!" y el nombre.
- Duración ("52 min"; desde 1 hora, "1 h 05 min"), volumen total ("4.250 kg", solo series con peso y reps; si no hay, no se muestra), series completadas ("18 series") y ejercicios ("5 ejercicios").
- **Récords nuevos**: por cada ejercicio, si alguna serie completada supera el récord que tenía **antes** de este entrenamiento (`isNewRecord` contra `getPersonalRecords` del historial previo): "Sentadilla con barra · nuevo récord: 100 kg" (o "1RM estimado 112,5 kg", "15 reps", "60 s", según la métrica). Sin récords nuevos, la sección no se muestra. La primera vez que se hace un ejercicio no es récord.
- Botón "Listo": vuelve a Inicio.

## Estados
| Lugar | Carga | Error | Vacío |
|---|---|---|---|
| Logger | — (local) | — | Libre sin ejercicios: "Agregá tu primer ejercicio" con el botón "Agregar ejercicio" |
| Columna "Anterior" | "—" mientras carga | "—" | "—" |
| Agregar ejercicio | skeleton de 6 filas | `ErrorState` con "Reintentar" | "No encontramos ejercicios con \"{búsqueda}\"" |
| Guardar | spinner en "Finalizar" | mensaje con "Reintentar" (ver arriba) | — |

## Accesibilidad
- Cada campo tiene label con la serie y el ejercicio: "Peso de la serie 2 de Sentadilla con barra, en kilos".
- "Completar" tiene `accessibilityLabel` "Completar serie 2" y estado `checked`; al completar se anuncia "Serie 2 hecha. Descanso de 1 minuto 30 segundos".
- El tiempo transcurrido no se anuncia cada segundo.
- Los diálogos destructivos usan el estilo destructive y el botón seguro es el de cancelar.
- Áreas táctiles de al menos 44 px, también en "−15 s", "+15 s" y "Quitar serie".

## Criterios de aceptación

### Iniciar
1. **Dado** el día A de la rutina con 3 ejercicios de 4, 3 y 3 series, **cuando** toco "Empezar", **entonces** se abre el logger con esos ejercicios en orden y 4, 3 y 3 filas.
2. **Dado** "Entrenamiento libre", **cuando** lo toco, **entonces** se abre el logger vacío con "Agregá tu primer ejercicio".
3. **Dado** un entrenamiento en curso, **cuando** toco "Empezar" en otro día, **entonces** veo "Ya tenés un entrenamiento en curso"; "Continuar el actual" abre el que tenía y "Descartar y empezar" empieza el nuevo.
4. **Dado** una membresía vencida, **entonces** puedo empezar igual.

### Registrar
5. **Dado** que la última vez hice 60 kg × 8 y 62,5 kg × 6, **cuando** empiezo el mismo ejercicio con 3 series, **entonces** el peso viene en 60, 62,5 y 62,5, y la columna "Anterior" dice "60 × 8", "62,5 × 6" y "—".
6. **Dado** un ejercicio que nunca hice con 60 kg sugeridos y "8-10", **entonces** las series vienen con 60 kg y 8 reps.
7. **Dado** una serie con datos válidos, **cuando** toco "Completar", **entonces** queda "Hecha" y arranca el descanso.
8. **Dado** una serie sin peso en un ejercicio de peso, **cuando** toco "Completar", **entonces** no se completa y veo "Ingresá el peso".
9. **Dado** "62.5" o "62,5", **entonces** se toma como 62,5 kg; "62,55" muestra el error.
10. **Dado** una serie completada, **cuando** toco "Completar" otra vez, **entonces** vuelve a sin completar.
11. **Dado** que cambio el peso de la serie 1 a 65, **entonces** las series siguientes sin completar ni editar pasan a 65.

### Agregar y quitar
12. **Dado** un ejercicio, **cuando** toco "Agregar serie", **entonces** aparece una fila nueva con los valores de la última.
13. **Dado** una serie completada, **cuando** la quito, **entonces** desaparece y puedo "Deshacer" durante 5 segundos.
14. **Dado** el buscador, **cuando** escribo "press banca", **entonces** encuentro "Press de banca"; al elegirlo se agrega al final con 1 serie.
15. **Dado** un ejercicio con series completadas, **cuando** toco "Quitar ejercicio", **entonces** me pide confirmación.

### Timer
16. **Dado** un ejercicio con 90 s de descanso, **cuando** completo una serie, **entonces** veo "Descanso 1:30" bajando.
17. **Dado** el timer corriendo, **cuando** toco "+15 s", **entonces** suma 15 segundos; "Omitir" lo cierra.
18. **Dado** el timer corriendo, **cuando** paso la app a segundo plano y termina, **entonces** recibo la notificación "Terminó el descanso".
19. **Dado** que termina con la app abierta, **entonces** vibra y veo "¡A la próxima serie!".
20. **Dado** que negué el permiso de notificaciones, **entonces** el timer funciona igual.
21. **Dado** el timer corriendo, **cuando** cierro y vuelvo a abrir la app, **entonces** sigue con el tiempo correcto.

### Persistir
22. **Dado** un entrenamiento con 2 series completadas, **cuando** cierro la app y la vuelvo a abrir, **entonces** está igual, con las 2 series.
23. **Dado** un entrenamiento en curso, **cuando** abro Inicio, **entonces** veo "Entrenamiento en curso" con "Continuar" y no "Entrenamiento de hoy".
24. **Dado** un entrenamiento en curso, **cuando** cierro sesión y confirmo el aviso, **entonces** se borra; si entra otro usuario, no lo ve.
25. **Dado** un entrenamiento empezado hace 13 horas, **cuando** abro la app, **entonces** me pregunta "¿Seguís entrenando?".

### Finalizar
26. **Dado** que no completé ninguna serie, **cuando** toco "Finalizar", **entonces** puedo descartarlo y no se llama a la API.
27. **Dado** 2 series sin completar, **cuando** finalizo, **entonces** me avisa y solo se envían las completadas.
28. **Dado** que no hay conexión al finalizar, **entonces** el entrenamiento queda guardado en el celular, veo "Reintentar" y, al reintentar con conexión, se guarda con la duración original.
29. **Dado** que se guardó, **entonces** veo el resumen con duración, volumen, series y ejercicios, y "Listo" me lleva a Inicio.
30. **Dado** que hice 100 kg en sentadilla y mi récord anterior era 95 kg, **entonces** el resumen muestra "nuevo récord: 100 kg"; si igualé el récord, no.
31. **Dado** que se guardó un entrenamiento del día A, **cuando** vuelvo a Inicio, **entonces** "Entrenamiento de hoy" pasa al día B y la racha suma el día.

## Casos borde
- **Medianoche:** un entrenamiento que empieza a las 23:30 y termina a las 00:40 cuenta para el día de `startedAt` (racha y "Última vez").
- **Cambio de hora del celular:** el tiempo transcurrido y el timer usan instantes (`startedAt`, `endsAt`); si el reloj cambia, se recalculan sin valores negativos (mínimo 0).
- **Rutina cambiada durante el entrenamiento:** el entrenamiento en curso no cambia (se armó al empezar).
- **Ejercicio del catálogo borrado** con un entrenamiento en curso: se muestra con "Ejercicio no disponible" y se puede quitar; si se intenta guardar y el servidor lo rechaza, se ve el error de guardar.
- **Usuario cambiado:** el entrenamiento guardado de otro usuario nunca se muestra (la clave es por usuario).
- **Doble toque en "Completar"** o en "Finalizar": no duplica series ni envíos.
- **Peso 0** (solo la barra contada como 0) es válido.

## Fuera de alcance (MVP)
- Reordenar ejercicios o series.
- Superseries, series de calentamiento o drop sets marcados como tales.
- Plantillas propias o guardar un libre como rutina.
- Editar o borrar un entrenamiento ya guardado.
- Calculadora de discos, conversión a libras.
- Notas por serie (sí hay `notes` de la sesión en el modelo, pero no se cargan en el MVP).
