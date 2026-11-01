# Feature · Home (Inicio)

Tareas: T5.6 (membresía), T5.7 (próxima clase), T5.8 (racha), T5.9 (acceso rápido).
Modelo: `Membership`, `Plan`, `Booking`, `ClassSession`, `Routine`, `RoutineDay`, `WorkoutSession` y `WeeklyStreak` en [`01-modelo-datos.md`](../01-modelo-datos.md).

## Objetivo
Que el socio vea de un vistazo, al abrir la app, lo que necesita para hoy: si su cuota está al día, cuándo es su próxima clase, cómo viene con su objetivo semanal y qué le toca entrenar. Es la primera pestaña de `(tabs)`.

## Pantalla
Ruta `/(tabs)/index`. Arriba, un saludo como encabezado: "Hola, {firstName}". Debajo, en este orden:

1. **Entrenamiento en curso** (solo si hay uno; ver T5.9).
2. **Membresía** (T5.6).
3. **Entrenamiento de hoy** (T5.9; no se muestra si hay uno en curso).
4. **Próxima clase** (T5.7).
5. **Racha semanal** (T5.8).

- La pantalla se desplaza y tiene **pull to refresh**, que vuelve a pedir todos los datos.
- **Cada tarjeta carga y falla por separado**: si falla una, las demás se muestran igual. Cada tarjeta tiene su skeleton, su error con "Reintentar" (que reintenta solo esa tarjeta) y su estado vacío.
- Toda fecha y hora se calcula en hora de Buenos Aires con funciones de `src/domain/`, que reciben `now`/`today`.

## Membresía (T5.6)
Datos: `useMembership(userId)` → `{ membership, plan } | null`; estado y días con `getMembershipStatus` y `getDaysLeft`.

| Caso | Título | Detalle | Badge |
|---|---|---|---|
| Sin membresía | "Sin membresía activa" | "Acercate a recepción para dar de alta tu plan. Mientras tanto no podés reservar clases." | — |
| `active` | nombre del plan | "Vence el {d de mmmm}" | "Activa" (`success`) |
| `expiring`, faltan 2–5 días | nombre del plan | "Vence en {n} días, el {d de mmmm}. Renovala en recepción." | "Por vencer" (`warning`) |
| `expiring`, falta 1 día | nombre del plan | "Vence mañana. Renovala en recepción." | "Por vencer" (`warning`) |
| `expiring`, 0 días | nombre del plan | "Vence hoy. Renovala en recepción." | "Por vencer" (`warning`) |
| `expired` | nombre del plan | "Venció el {d de mmmm}. Renovala en recepción para volver a reservar." | "Vencida" (`danger`) |

- Si el plan tiene límite semanal, se agrega una línea: "{weeklyClassLimit} clases por semana". Sin límite: "Clases sin límite".
- Las fechas se muestran como "12 de noviembre" (sin año si es el año actual; con año si no: "3 de enero de 2027").
- La tarjeta no es interactiva (no hay pagos en el MVP).
- Sin membresía o con la cuota vencida **solo se bloquean las reservas** (`canBookClass`); entrenar desde la app sigue disponible.

## Próxima clase (T5.7)
Datos: `useMyBookings(userId)` y las clases de esas reservas.

- **Cuál es:** la reserva `confirmed` cuya clase **todavía no terminó** (`startsAt + durationMinutes > now`), la de `startsAt` más temprano. Las canceladas y las `attended` no cuentan.
- **Qué muestra:** tipo de clase con su color de acento (`ClassType.color`), día y hora, duración y entrenador.
  - Día: "Hoy", "Mañana" o el día de la semana con fecha ("Jueves 12/11"), seguido de la hora: "Hoy · 19:00".
  - Si ya empezó: badge "En curso" (`primary`).
  - Si todavía se puede cancelar (`canCancelBooking`) y empieza hoy: "Podés cancelar hasta las {HH:mm}" (2 horas antes).
- La tarjeta es un botón que lleva al detalle de la clase (T5.13). `accessibilityLabel`: "Próxima clase: {tipo}, {día y hora}, con {entrenador}".
- **Vacío:** "No tenés clases reservadas" con la acción "Ver clases", que lleva a la pestaña Clases.

## Racha semanal (T5.8)
Datos: `useWorkoutHistory(userId)`, `useMyBookings(userId)` y `user.weeklyGoal`; cálculo con `getWeeklyStreak` y `getActiveDaysInWeek`.

- **Racha:** "{n} semanas seguidas" ("1 semana seguida"; con 0: "Empezá tu racha esta semana").
- **Progreso de la semana actual:** "{activos} de {weeklyGoal} días esta semana" con una barra de progreso (tope en 100 %) y los 7 días de lunes a domingo marcando los que tuvieron actividad. El día de hoy se distingue.
  - La barra tiene `accessibilityRole="progressbar"` y su valor (`accessibilityValue` con `min`, `max` y `now`).
  - Cada día se describe para el lector de pantalla ("Lunes, con actividad"), sin depender solo del color.
- **Semana cumplida:** "¡Objetivo cumplido esta semana!" (con `success`).
- Cuenta como actividad lo mismo que en el modelo: un entrenamiento finalizado o una clase `attended`, una vez por día.
- La tarjeta no es interactiva; el objetivo semanal se edita en Perfil (T5.31).
- No tiene estado vacío: sin actividad muestra 0 días y "Empezá tu racha esta semana".

## Entrenamiento de hoy y acceso rápido (T5.9)
Datos: `useRoutine(userId)` → `{ routine, days, exercises } | null`, `useWorkoutHistory(userId)` y el store local del entrenamiento en curso.

### Qué día toca: `getNextRoutineDay`
Función pura nueva en `src/domain/` (con tests unitarios):

- Recibe los días de la rutina activa y las sesiones finalizadas del socio.
- Busca la sesión **más reciente** (`startedAt`) cuyo `routineDayId` sea uno de esos días. Los entrenamientos libres y los de otras rutinas no cuentan.
- Devuelve el día siguiente por `order`; después del último, vuelve al primero.
- Si no hay ninguna sesión de esa rutina, devuelve el de menor `order`.
- Si la rutina no tiene días, devuelve `null`.
- Los días se ordenan por `order` aunque vengan desordenados, y el resultado no depende del orden de las sesiones.

### Qué muestra
- **Con entrenamiento en curso** (en el celular): tarjeta destacada "Entrenamiento en curso" con el nombre del día (o "Entrenamiento libre"), el tiempo transcurrido y el botón "Continuar", que lleva al logger. En ese caso no se muestra "Entrenamiento de hoy".
- **Con rutina:** "Entrenamiento de hoy", el nombre del día, la cantidad de ejercicios ("4 ejercicios"), el botón primario "Empezar" (inicia el entrenamiento de ese día, T5.21) y el botón secundario "Elegir otro día" (lleva a la pestaña Rutina).
- **Sin rutina activa** (estado vacío): "Todavía no tenés rutina" y "Pedile una a tu entrenador. Mientras tanto podés entrenar libre.", con la acción "Entrenamiento libre".
- **Rutina sin días:** igual que sin rutina.
- Sin membresía o con la cuota vencida, el acceso rápido funciona igual (solo se bloquean las reservas).

## Estados
| Tarjeta | Carga | Error | Vacío |
|---|---|---|---|
| Saludo | sin nombre: "Hola" | sin nombre: "Hola" | — |
| Membresía | skeleton de 1 fila | `ErrorState` compacto con "Reintentar" | "Sin membresía activa" |
| Entrenamiento de hoy | skeleton de 1 fila | `ErrorState` compacto | "Todavía no tenés rutina" |
| Próxima clase | skeleton de 1 fila | `ErrorState` compacto | "No tenés clases reservadas" |
| Racha | skeleton de 1 fila | `ErrorState` compacto | 0 días (no hay vacío) |

- "Compacto": el mismo mensaje y botón de `ErrorState`, dentro de la tarjeta y sin ocupar toda la pantalla. Si `ErrorState` no lo permite, se le agrega una variante en T5.6.
- El pull to refresh no muestra los skeletons: los datos viejos quedan visibles mientras se actualizan.
- La tarjeta de entrenamiento en curso viene del celular: no tiene carga ni error.

## Accesibilidad
- El saludo es el encabezado de la pantalla; el título de cada tarjeta también es encabezado.
- Los estados nunca dependen solo del color: los badges tienen texto y los días de la racha se describen.
- Las tarjetas que son botones tienen `accessibilityLabel` con toda la información.

## Criterios de aceptación

### Membresía
1. **Dado** un socio sin membresía, **cuando** abro Inicio, **entonces** veo "Sin membresía activa" y que no puedo reservar.
2. **Dado** una membresía que vence en 10 días, **cuando** abro Inicio, **entonces** veo el nombre del plan, "Activa" y la fecha de vencimiento.
3. **Dado** una membresía que vence en 3 días, **entonces** veo "Por vencer" y "Vence en 3 días".
4. **Dado** una membresía que vence mañana, **entonces** veo "Vence mañana"; si vence hoy, "Vence hoy".
5. **Dado** una membresía que venció ayer, **entonces** veo "Vencida" y la fecha en que venció.
6. **Dado** un plan sin límite semanal, **entonces** veo "Clases sin límite"; con límite 3, "3 clases por semana".

### Próxima clase
7. **Dado** dos reservas confirmadas futuras, **cuando** abro Inicio, **entonces** veo la más próxima.
8. **Dado** una reserva confirmada de una clase que empezó hace 30 minutos y dura 60, **entonces** la veo con "En curso".
9. **Dado** que la única reserva es de una clase que ya terminó, o está cancelada, **entonces** veo "No tenés clases reservadas" y "Ver clases".
10. **Dado** una clase hoy a las 19:00, **entonces** veo "Hoy · 19:00" y "Podés cancelar hasta las 17:00"; a las 17:30 ya no aparece el aviso.
11. **Dado** la tarjeta de próxima clase, **cuando** la toco, **entonces** voy al detalle de esa clase.

### Racha
12. **Dado** objetivo 3 y 2 días con actividad esta semana, **entonces** veo "2 de 3 días esta semana" y la barra a dos tercios.
13. **Dado** 4 días con actividad y objetivo 3, **entonces** la barra queda al 100 % y veo "¡Objetivo cumplido esta semana!".
14. **Dado** un entrenamiento y una clase `attended` el mismo día, **entonces** cuenta como 1 día.
15. **Dado** el historial del seed (`user-1`), **entonces** veo "4 semanas seguidas" (si la semana actual todavía no se cumplió).
16. **Dado** un socio sin actividad, **entonces** veo "Empezá tu racha esta semana" y "0 de {objetivo} días".

### Entrenamiento de hoy
17. **Dado** una rutina A-B-C y que el último entrenamiento de esa rutina fue B, **entonces** veo "Entrenamiento de hoy: C".
18. **Dado** que el último fue C, **entonces** veo A.
19. **Dado** que nunca entrené con esa rutina (aunque tenga entrenamientos libres), **entonces** veo el día de menor orden.
20. **Dado** "Entrenamiento de hoy", **cuando** toco "Empezar", **entonces** se inicia un entrenamiento de ese día y voy al logger.
21. **Dado** un entrenamiento en curso, **cuando** abro Inicio, **entonces** veo "Entrenamiento en curso" con "Continuar" y no veo "Entrenamiento de hoy".
22. **Dado** un socio sin rutina activa, **entonces** veo "Todavía no tenés rutina" y puedo empezar un entrenamiento libre.
23. **Dado** un socio con la cuota vencida y rutina, **entonces** puedo tocar "Empezar" igual.

### Pantalla
24. **Dado** que falla la carga de la membresía, **entonces** su tarjeta muestra el error con "Reintentar" y las otras tarjetas se muestran normalmente.
25. **Dado** que toco "Reintentar" en una tarjeta, **entonces** solo se vuelve a pedir lo de esa tarjeta.
26. **Dado** Inicio cargado, **cuando** hago pull to refresh, **entonces** se vuelven a pedir los datos sin que desaparezca lo que veo.

## Casos borde
- **Medianoche:** "Hoy"/"Mañana", los días de la membresía y la semana de la racha usan la fecha de Buenos Aires, no la del dispositivo ni UTC.
- **Domingo a la noche → lunes:** la racha pasa a la semana nueva; la semana anterior se evalúa completa.
- **Clase que dura más allá de medianoche:** sigue siendo la próxima mientras no termine.
- **Reserva de una clase que ya no existe (404):** se ignora para elegir la próxima clase.
- **Rutina modificada:** si el día del último entrenamiento ya no está en la rutina, se toma como si no hubiera entrenado con ella (día de menor orden).
- **Membresía que vence el mismo día en que se abre la app:** "Vence hoy" (todavía vigente).
- **Socio recién registrado:** sin membresía, sin rutina, sin reservas y sin actividad; se ven los cuatro estados vacíos sin errores.

## Fuera de alcance (MVP)
- Pagar o renovar la cuota desde la app.
- Estimación de la duración del entrenamiento.
- Notificaciones de cuota por vencer o de clase próxima (post-MVP).
