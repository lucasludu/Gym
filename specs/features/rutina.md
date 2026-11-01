# Feature · Rutina

Tareas: T5.17 (vista de la rutina), T5.18 (detalle del día), T5.19 (detalle del ejercicio), T5.20 (estado vacío).
Modelo: `Routine`, `RoutineDay`, `RoutineExercise`, `Exercise`, `Trainer`, `WorkoutSession` y `WorkoutSet`, con las **reglas de imagen**, en [`01-modelo-datos.md`](../01-modelo-datos.md). La rotación del día que toca es `getNextRoutineDay` (`src/domain/routineRotation.ts`), la misma de Inicio.

## Objetivo
Reemplazar la rutina en papel o en fotos: que el socio vea qué le toca cada día, con series, repeticiones, peso y descanso, y sepa cómo se hace cada ejercicio. Solo lectura: la rutina la arma el entrenador.

## Pantallas
- **Pestaña Rutina** (`/(tabs)/routine`): la rutina activa y la lista de sus días.
- **Detalle del día** (`/routine/[dayId]`): los ejercicios del día y "Empezar".
- **Detalle del ejercicio** (`/exercises/[id]`, con el parámetro opcional `routineExerciseId`): se abre desde el detalle del día. Más adelante también desde el logger (T5.21).

Las tres pantallas con datos manejan carga, error (`ErrorState` con "Reintentar") y vacío.

## Vista de la rutina (T5.17)
Datos: `useRoutine(userId)` (rutina activa, días y ejercicios planificados), el catálogo de ejercicios de esos días (para los grupos musculares), el entrenador y el historial (`useWorkoutHistory`) para la rotación.

- Encabezado: nombre de la rutina ("Hipertrofia – Bloque 1"), "Armada por {nombre} {apellido}" y la vigencia: "Desde el {d de mmmm}" si `endDate` es `null`, "Hasta el {d de mmmm}" si tiene. Si el entrenador no se puede cargar, se omite esa línea (no es un error de la pantalla).
- Debajo, **una tarjeta por día**, ordenadas por `order`. Cada tarjeta:
  - nombre del día ("Día A – Tren inferior");
  - "{n} ejercicios" ("1 ejercicio");
  - los grupos musculares del día, sin repetir, en el orden de aparición, con su nombre en español ("Piernas · Core"); como máximo 3, y "+{n}" si hay más;
  - el badge **"Te toca hoy"** (`primary`) en el día que devuelve `getNextRoutineDay` (solo uno).
- Tocar una tarjeta abre el detalle del día. `accessibilityLabel`: "Día A – Tren inferior, 5 ejercicios, Piernas y Core, te toca hoy".
- Pull to refresh.

## Detalle del día (T5.18)
- Título: el nombre del día; debajo, "{n} ejercicios" y, si corresponde, "Te toca hoy".
- Lista de ejercicios **ordenada por `order`**. Cada fila:
  - miniatura (`ExerciseImage` chica) y nombre del ejercicio;
  - lo planificado según `trackingType`:

    | trackingType | Texto | Ejemplo |
    |---|---|---|
    | `weight_reps` con peso | "{series} × {reps} · {peso} kg" | "4 × 8-10 · 60 kg" |
    | `weight_reps` sin peso | "{series} × {reps} · peso libre" | "3 × 12 · peso libre" |
    | `reps` | "{series} × {reps}" | "3 × AMRAP" |
    | `time` | "{series} × {segundos} s" (desde 60 s, "1 min", "1 min 30 s") | "3 × 45 s" |

  - el descanso: "Descanso {tiempo}" con el mismo formato de tiempo ("Descanso 1 min 30 s"; con 0, "Sin descanso");
  - las notas del entrenador, si hay, en texto secundario.
  - Peso con coma decimal y sin ceros de más: "22,5 kg", "60 kg".
- Cada fila es un botón que abre el detalle del ejercicio. `accessibilityLabel`: "Sentadilla con barra, 4 series de 8 a 10 repeticiones con 60 kilos, descanso 1 minuto 30 segundos". Para AMRAP: "al máximo de repeticiones".
- Abajo, el botón primario **"Empezar"** (`accessibilityLabel` "Empezar {nombre del día}"): inicia un entrenamiento de ese día (T5.21). Hasta que exista el logger, lleva a la pestaña Rutina, igual que en Inicio. Funciona aunque la membresía esté vencida.
- Si el ejercicio planificado no está en el catálogo (se borró), la fila muestra "Ejercicio no disponible", con lo planificado, y no es tocable.
- Un día sin ejercicios: "Este día todavía no tiene ejercicios" y no se muestra "Empezar".
- Un `dayId` que no es de la rutina activa (404 o rutina cambiada): "Este día ya no está en tu rutina" con el botón "Ver mi rutina".

## Detalle del ejercicio (T5.19)
- `ExerciseImage` grande y, debajo, la **atribución** según las reglas de imagen.
- Nombre (encabezado), grupo muscular y equipamiento en español ("Piernas · Barra").
- **"Cómo se hace"**: las instrucciones en texto plano. Sin instrucciones: "Todavía no hay instrucciones para este ejercicio."
- **"En tu rutina"** (solo si se abrió desde un día, con `routineExerciseId`): lo planificado, el descanso y las notas, con los mismos textos del detalle del día.
- **"Última vez"**: la sesión finalizada más reciente que tenga series **completadas** de este ejercicio (de cualquier día o entrenamiento libre):
  - fecha corta ("28/10"; "Hoy" o "Ayer" si corresponde);
  - las series completadas en orden. Si todas son iguales, agrupadas: "3 × 8 · 60 kg"; si no, separadas por coma: "60 kg × 8, 62,5 kg × 6, 62,5 kg × 5". Con `reps`: "12, 10, 8"; con `time`: "45 s, 40 s".
  - Sin historial: "Todavía no hiciste este ejercicio."
  - Si falla el historial, esta sección muestra su error compacto con "Reintentar" y el resto de la pantalla se ve igual.
  - Los récords y los gráficos quedan para Progreso.
- Ejercicio inexistente (404): "Este ejercicio ya no existe" con el botón "Volver".

## Estado vacío (T5.20)
- **Sin rutina activa** (o una rutina sin días): ícono, "Todavía no tenés rutina" y "Pedile una a tu entrenador. Mientras tanto podés entrenar libre.", con el botón "Entrenamiento libre", que inicia un entrenamiento libre (T5.21). Mismos textos que en Inicio. Hasta que exista el logger el botón se muestra pero no hace nada (queda anotado en T5.21).
- Con membresía vencida la rutina se ve igual: solo se bloquean las reservas.

## Estados
| Pantalla | Carga | Error | Vacío |
|---|---|---|---|
| Rutina | skeleton de 3 filas | `ErrorState` con "Reintentar" | "Todavía no tenés rutina" |
| Detalle del día | skeleton de 4 filas | `ErrorState` con "Reintentar" | "Este día todavía no tiene ejercicios" / "Este día ya no está en tu rutina" |
| Detalle del ejercicio | skeleton | `ErrorState` con "Reintentar" | "Este ejercicio ya no existe" |
| "Última vez" | skeleton de 1 fila | `ErrorState` compacto | "Todavía no hiciste este ejercicio." |

- Si falla el historial en la pestaña Rutina, la lista se muestra igual, sin "Te toca hoy".

## Accesibilidad
- El nombre de la rutina, del día y del ejercicio son encabezados; también "Cómo se hace", "En tu rutina" y "Última vez".
- Las cantidades se leen completas (series, repeticiones, kilos, minutos y segundos), no con "×" ni abreviaturas.
- "Te toca hoy" es texto, no solo color.
- Las imágenes siguen las reglas de accesibilidad del modelo ("Imagen de {name}" o "{name}, sin imagen ({grupo})").

## Criterios de aceptación

### Vista de la rutina
1. **Dado** una rutina activa con 3 días, **cuando** abro la pestaña Rutina, **entonces** veo su nombre, quién la armó, la vigencia y los 3 días en orden.
2. **Dado** un día con 5 ejercicios de piernas y uno de core, **entonces** su tarjeta dice "6 ejercicios" y "Piernas · Core".
3. **Dado** que el último entrenamiento de la rutina fue el día A, **entonces** el día B tiene "Te toca hoy" y ningún otro.
4. **Dado** que nunca entrené con la rutina, **entonces** "Te toca hoy" está en el primer día.
5. **Dado** una tarjeta de día, **cuando** la toco, **entonces** voy al detalle de ese día.
6. **Dado** que falla la carga de la rutina, **entonces** veo el error con "Reintentar".

### Detalle del día
7. **Dado** un ejercicio de 4 series de 8-10 con 60 kg, **entonces** veo "4 × 8-10 · 60 kg".
8. **Dado** un ejercicio sin peso sugerido, **entonces** veo "peso libre"; uno por tiempo de 45 s, "3 × 45 s"; uno AMRAP, "3 × AMRAP".
9. **Dado** un descanso de 90 segundos, **entonces** veo "Descanso 1 min 30 s".
10. **Dado** un ejercicio con notas del entrenador, **entonces** las veo debajo.
11. **Dado** el detalle de un día, **cuando** toco "Empezar", **entonces** se inicia un entrenamiento de ese día (T5.21).
12. **Dado** un ejercicio planificado que ya no está en el catálogo, **entonces** veo "Ejercicio no disponible" con lo planificado.
13. **Dado** un día que ya no está en la rutina, **entonces** veo "Este día ya no está en tu rutina" y "Ver mi rutina".
14. **Dado** una fila de ejercicio, **cuando** la toco, **entonces** voy a su detalle con lo planificado.

### Detalle del ejercicio
15. **Dado** un ejercicio con imagen, autor y licencia, **entonces** veo la imagen y "Imagen: {autor} · {licencia}".
16. **Dado** un ejercicio sin imagen, **entonces** veo el placeholder con su grupo muscular.
17. **Dado** un ejercicio sin instrucciones, **entonces** veo "Todavía no hay instrucciones para este ejercicio."
18. **Dado** que lo abrí desde un día, **entonces** veo "En tu rutina" con lo planificado; si no, no veo esa sección.
19. **Dado** que la última vez hice 3 series de 8 con 60 kg, **entonces** veo "Última vez" con la fecha y "3 × 8 · 60 kg".
20. **Dado** que la última vez hice 60 kg × 8, 62,5 kg × 6, **entonces** veo las series separadas.
21. **Dado** que solo tengo series no completadas de ese ejercicio, o ninguna, **entonces** veo "Todavía no hiciste este ejercicio."
22. **Dado** que falla el historial, **entonces** "Última vez" muestra su error y el resto del ejercicio se ve.

### Estado vacío
23. **Dado** un socio sin rutina activa, **entonces** veo "Todavía no tenés rutina" y "Entrenamiento libre".
24. **Dado** una rutina sin días, **entonces** veo el mismo estado vacío.
25. **Dado** un socio con la membresía vencida, **entonces** veo su rutina igual.

## Casos borde
- **Rutina con `endDate` pasado pero `isActive: true`:** se muestra igual (manda `isActive`, que lo decide el servidor), con "Hasta el {fecha}".
- **Días con `order` salteado** (1, 3, 4): se respeta el orden, sin renumerar.
- **Mismo ejercicio dos veces en un día:** se muestran las dos filas, cada una con lo suyo.
- **"Última vez" el mismo día que hoy:** "Hoy". La fecha es la de Buenos Aires de `startedAt`.
- **Peso 0** en `weight_reps` (ej. barra sola contada como 0): "0 kg", no "peso libre".
- **Rutina cambiada por el entrenador:** el pull to refresh trae la nueva; un detalle de día viejo muestra "Este día ya no está en tu rutina".

## Fuera de alcance (MVP)
- Editar la rutina o armar una propia.
- Ver rutinas anteriores.
- Buscar o explorar el catálogo de ejercicios completo.
- Videos de ejercicios.
- Récords y gráficos por ejercicio (van en Progreso).
