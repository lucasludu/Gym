# Feature · Reservas (Clases)

Tareas: T5.10 (selector de semana y día), T5.11 (`ClassCard`), T5.12 (lista del día con filtros), T5.13 (detalle), T5.14 (reservar), T5.15 (cancelar), T5.16 (mis reservas).
Modelo: `ClassType`, `Trainer`, `ClassSession`, `Booking`, `Membership` y `Plan`, con las **reglas de reserva 1 a 7** y `BookingBlockReason`, en [`01-modelo-datos.md`](../01-modelo-datos.md). Las reglas ya están implementadas en `src/domain/bookingRules.ts` (`canBookClass`, `canCancelBooking`, `cancelBooking`).

## Objetivo
Que el socio sepa si hay lugar en una clase sin ir ni preguntar, y que reserve o cancele en pocos toques. Si no puede reservar, que entienda por qué.

## Pantallas
- **Pestaña Clases** (`/(tabs)/classes`): arriba, un control segmentado **"Calendario" | "Mis reservas"**. Empieza en "Calendario".
- **Detalle de clase** (`/classes/[id]`): se abre desde una `ClassCard`, desde "Mis reservas" y desde la tarjeta "Próxima clase" de Inicio (reemplaza el acceso provisorio a la pestaña Clases).

## Calendario

### Selector de semana y día (T5.10)
- Se puede ver **la semana actual y la siguiente** (lunes a domingo), nada más. Dos botones: "Semana anterior" / "Semana siguiente"; el que no corresponde está deshabilitado. Título: "Esta semana" o "Semana que viene", con el rango ("2 al 8 de noviembre"; si cruza de mes, "30 de noviembre al 6 de diciembre").
- Debajo, una tira de 7 días con el nombre corto y el número ("Lun 2"). Hoy se marca con texto ("Hoy"), no solo con color. El día elegido tiene estado `selected`.
- Al abrir la pestaña se elige **hoy**. Al pasar a la semana siguiente se elige su lunes; al volver a la actual, hoy.
- Los **días pasados** de la semana actual se pueden elegir (para ver qué hubo) pero sus clases se muestran como empezadas.
- Toda fecha se calcula en hora de Buenos Aires con funciones puras de `src/domain/` que reciben `now`.

### Lista de clases del día (T5.12)
- Las clases del día elegido, **ordenadas por `startsAt`** (empate: por nombre del tipo). Dos clases a la misma hora (dos salas) se muestran las dos.
- **Filtro por tipo**: chips con los tipos de clase ("Todas" + uno por tipo). Se puede elegir **un solo tipo** a la vez; "Todas" quita el filtro. El filtro se mantiene al cambiar de día o de semana.
- Datos: las sesiones de la semana visible (un pedido por semana, `startsAt` entre lunes 00:00 y el lunes siguiente), con su tipo y entrenador, más las reservas del socio y su membresía para calcular el estado de cada clase.

### ClassCard (T5.11)
Muestra: hora de inicio y fin ("19:00 – 20:00"), nombre del tipo con su color de acento (`ClassType.color`), entrenador, intensidad ("Intensidad baja/media/alta") y el estado:

| Estado | Cuándo | Se ve |
|---|---|---|
| Reservada | el socio tiene una reserva `confirmed` | badge "Reservada" (`primary`) |
| Empezada | `hasStarted` (incluye clases terminadas) | badge "Empezada" (`neutral`), tarjeta atenuada |
| Llena | `isFull` y no está reservada | badge "Llena" (`danger`) |
| Disponible | el resto | "{n} lugares" (más de 3); "Últimos {n} lugares" (2 o 3, `warning`); "Último lugar" (1, `warning`) |

- Prioridad si aplican varios: Reservada > Empezada > Llena > Disponible.
- Toda la tarjeta es un botón que abre el detalle, con `accessibilityLabel` completo: "Spinning, 19:00 a 20:00, con Camila Rodríguez, 4 lugares".
- La tarjeta no reserva: reservar y cancelar se hacen en el detalle.

## Detalle de clase (T5.13)
- Nombre del tipo, día y hora ("Jueves 5/11 · 19:00 – 20:00"), duración, entrenador, intensidad, descripción del tipo y cupos ("4 de 12 lugares libres").
- Abajo, la acción principal según el estado (ver T5.14 y T5.15).
- Estados: carga (skeleton), error (`ErrorState` con "Reintentar") y **no encontrada** (404): "Esta clase ya no existe" con el botón "Volver a clases".

## Reservar (T5.14)
- Si `canBookClass` da `ok`, el botón primario **"Reservar"**. Un toque reserva, sin diálogo previo.
- **Actualización optimista**: apenas se toca, la clase pasa a "Reservada", los cupos bajan en 1 (json-server no actualiza `bookedCount`, ver modelo de datos) y el botón pasa a "Cancelar reserva". Si el servidor falla, se revierte todo y se muestra "No pudimos reservar. Intentá de nuevo."
- Al confirmar el servidor, un aviso **"Reservaste {tipo}, {día} {hora}"** visible y anunciado por el lector de pantalla (región en vivo), que se va solo a los 4 segundos.
- Mientras se reserva, el botón muestra el spinner y no se puede tocar de nuevo (sin reservas dobles).
- La reserva creada: `status: "confirmed"`, `createdAt: now`, `cancelledAt: null`.
- Al reservar o cancelar se invalidan las reservas del socio (y con ellas "Próxima clase" y la racha de Inicio) y las sesiones de esa semana.

### Motivo de bloqueo
Si `canBookClass` bloquea, en lugar de "Reservar" se muestra un botón deshabilitado con el motivo y, debajo, la explicación. Un solo motivo, con la prioridad del modelo de datos.

| Motivo | Botón | Explicación |
|---|---|---|
| `no_membership` | "No podés reservar" | "No tenés una membresía activa. Acercate a recepción para dar de alta tu plan." |
| `membership_expired` | "No podés reservar" | "Tu membresía venció el {d de mmmm}. Renovala en recepción para volver a reservar." |
| `class_started` | "Clase empezada" | "Esta clase ya empezó." |
| `class_full` | "Clase llena" | "No quedan lugares. Probá con otro horario." |
| `already_booked` | — | (no se muestra: la clase está reservada y se ve "Cancelar reserva") |
| `schedule_overlap` | "Se superpone" | "Ya tenés reservada {tipo} a las {hora}, en el mismo horario." |
| `weekly_limit_reached` | "Límite semanal alcanzado" | "Tu plan permite {n} clases por semana y ya las reservaste. Cancelá una para reservar esta." |

- No hay lista de espera.
- Si el servidor rechaza la reserva por una regla (en el backend real, por ejemplo, la clase se llenó recién), se revierte la actualización optimista, se vuelve a pedir la clase y se muestra el motivo que corresponda.

## Cancelar (T5.15)
- Si la reserva está `confirmed` y `canCancelBooking` da `true`: botón **"Cancelar reserva"** (`danger`, secundario). Abre una confirmación:
  - Título: "¿Cancelar la reserva?"
  - Mensaje: "{tipo}, {día} {hora}. Vas a liberar tu lugar."
  - Botones: "Volver" (cancel) y "Cancelar reserva" (destructive).
- Al confirmar: PATCH con `cancelBooking` (`status: "cancelled"`, `cancelledAt: now`), con actualización optimista (la clase vuelve a disponible y los cupos suben en 1). Si falla, se revierte y se muestra "No pudimos cancelar. Intentá de nuevo."
- Al confirmar el servidor, aviso "Cancelaste tu reserva de {tipo}".
- **Pasado el límite** (menos de 2 horas antes del inicio): no hay botón; se lee "Ya no podés cancelar: el límite es 2 horas antes de la clase."
- Después de cancelar se puede volver a reservar la misma clase (si sigue habiendo lugar y se cumplen las reglas).

## Mis reservas (T5.16)
Segmento "Mis reservas" de la pestaña Clases, con dos secciones:

- **Próximas**: reservas `confirmed` de clases que no terminaron, de la más cercana a la más lejana. Cada fila: tipo, día y hora ("Hoy · 19:00", "Jueves 5/11 · 19:00"), entrenador y "En curso" si empezó. Tocar abre el detalle.
- **Historial**: el resto (`attended`, `no_show`, `cancelled` y `confirmed` de clases que ya terminaron), de la más reciente a la más vieja, con un badge: "Asististe" (`success`), "No asististe" (`danger`), "Cancelada" (`neutral`), "Finalizada" (`neutral`, para `confirmed` ya terminada).
- Se muestran las últimas 20 del historial (sin paginación en el MVP).
- Las reservas de clases que ya no existen se omiten.

## Estados
| Lugar | Carga | Error | Vacío |
|---|---|---|---|
| Lista del día | skeleton de 3 filas | `ErrorState` con "Reintentar" | "No hay clases este día" (o "No hay clases de {tipo} este día" con filtro, con el botón "Ver todas") |
| Detalle | skeleton | `ErrorState` con "Reintentar" | "Esta clase ya no existe" |
| Próximas | skeleton de 2 filas | `ErrorState` con "Reintentar" | "No tenés clases reservadas" con el botón "Ver calendario" |
| Historial | (con Próximas) | (con Próximas) | "Todavía no fuiste a ninguna clase" |

- La lista del día y "Mis reservas" tienen **pull to refresh**, que no muestra los skeletons.
- Si falla la membresía o las reservas pero cargan las clases, la lista se muestra igual; las tarjetas no muestran "Reservada" y en el detalle el botón de reservar espera esos datos (o muestra su error).

## Accesibilidad
- El control segmentado y los chips de filtro usan rol `tab`/`button` con estado `selected`.
- Los botones de semana y los días tienen `accessibilityLabel` completo: "Martes 3 de noviembre, hoy".
- Los estados de cupo y reserva siempre tienen texto, no solo color.
- Los avisos de reservar/cancelar y los errores se anuncian con región en vivo.
- Todos los elementos interactivos tienen al menos 44 px de área táctil.

## Criterios de aceptación

### Selector y lista
1. **Dado** que abro la pestaña Clases, **entonces** veo "Esta semana", el día de hoy elegido y sus clases ordenadas por hora.
2. **Dado** la semana actual, **cuando** toco "Semana siguiente", **entonces** veo "Semana que viene" con su lunes elegido, y "Semana siguiente" queda deshabilitado.
3. **Dado** la semana siguiente, **cuando** toco "Semana anterior", **entonces** vuelvo a la semana actual con hoy elegido.
4. **Dado** un día con dos clases a las 19:00, **entonces** veo las dos.
5. **Dado** que elijo el filtro "Yoga", **entonces** solo veo las clases de yoga, también al cambiar de día.
6. **Dado** un día sin clases del tipo filtrado, **entonces** veo "No hay clases de Yoga este día" y "Ver todas" quita el filtro.
7. **Dado** que falla la carga de las clases, **entonces** veo el error con "Reintentar".

### ClassCard
8. **Dado** una clase con 4 lugares libres, **entonces** veo "4 lugares"; con 2, "Últimos 2 lugares"; con 1, "Último lugar".
9. **Dado** una clase sin lugares que no reservé, **entonces** veo "Llena".
10. **Dado** una clase que reservé, **entonces** veo "Reservada" aunque esté llena.
11. **Dado** una clase que ya empezó, **entonces** veo "Empezada".
12. **Dado** una `ClassCard`, **cuando** la toco, **entonces** voy al detalle de esa clase.

### Detalle
13. **Dado** el detalle, **entonces** veo tipo, día y hora, duración, entrenador, intensidad, descripción y "4 de 12 lugares libres".
14. **Dado** una clase que ya no existe, **entonces** veo "Esta clase ya no existe" y "Volver a clases".
15. **Dado** la tarjeta "Próxima clase" de Inicio, **cuando** la toco, **entonces** voy al detalle de esa clase.

### Reservar
16. **Dado** una clase disponible y que puedo reservar, **cuando** toco "Reservar", **entonces** la veo "Reservada" y con un lugar menos al instante, y después el aviso "Reservaste Spinning, jueves 19:00".
17. **Dado** que el servidor falla al reservar, **entonces** la clase vuelve a disponible, con sus cupos, y veo "No pudimos reservar. Intentá de nuevo."
18. **Dado** que estoy reservando, **cuando** toco "Reservar" otra vez, **entonces** no se hace una segunda reserva.
19. **Dado** que no tengo membresía, **entonces** veo "No podés reservar" deshabilitado y la explicación.
20. **Dado** que mi membresía venció, **entonces** veo la fecha en que venció y "Renovala en recepción".
21. **Dado** una reserva confirmada que se superpone en horario, **entonces** veo "Se superpone" y qué clase tengo a esa hora.
22. **Dado** un plan de 3 clases por semana con 3 reservas esa semana, **entonces** veo "Límite semanal alcanzado"; la semana siguiente puedo reservar.
23. **Dado** una clase llena, **entonces** veo "Clase llena" deshabilitado.
24. **Dado** que reservé una clase, **cuando** vuelvo a Inicio, **entonces** "Próxima clase" ya la tiene en cuenta.

### Cancelar
25. **Dado** una clase reservada que empieza en más de 2 horas, **cuando** toco "Cancelar reserva" y confirmo, **entonces** vuelve a disponible con un lugar más y veo "Cancelaste tu reserva de Spinning".
26. **Dado** el diálogo de cancelar, **cuando** toco "Volver", **entonces** la reserva sigue igual.
27. **Dado** una clase reservada que empieza en 1 hora 59 minutos, **entonces** no veo "Cancelar reserva" y leo que el límite es 2 horas antes. A exactamente 2 horas todavía puedo cancelar.
28. **Dado** que el servidor falla al cancelar, **entonces** la reserva sigue y veo "No pudimos cancelar. Intentá de nuevo."
29. **Dado** que cancelé una reserva, **entonces** puedo volver a reservar esa clase.

### Mis reservas
30. **Dado** dos reservas próximas, **entonces** las veo en "Próximas", la más cercana primero.
31. **Dado** reservas `attended`, `no_show` y `cancelled`, **entonces** las veo en "Historial" con "Asististe", "No asististe" y "Cancelada", la más reciente primero.
32. **Dado** una reserva confirmada de una clase que terminó, **entonces** está en el historial como "Finalizada".
33. **Dado** que no tengo reservas, **entonces** veo "No tenés clases reservadas" y "Ver calendario" me lleva al calendario.

## Casos borde
- **Medianoche y semana:** "hoy", la semana y el día de cada clase usan la fecha de Buenos Aires. El domingo a la noche, "Semana que viene" es la que empieza el lunes siguiente.
- **Clase que cruza la medianoche:** se lista en el día en que empieza.
- **La clase empieza mientras miro el detalle:** con `useNow` el botón pasa a "Clase empezada" sin recargar.
- **El límite de cancelación pasa mientras miro el detalle:** el botón "Cancelar reserva" desaparece.
- **Cupo con la actualización optimista:** los lugares nunca se muestran menores que 0 ni mayores que `capacity`.
- **Reservar y cancelar seguidos:** al cancelar una reserva recién creada se usa el id que devolvió el servidor; mientras no lo tenga, "Cancelar reserva" espera (spinner).
- **Límite semanal:** cuentan `confirmed` + `attended` de la semana de la clase (no la actual). Las `cancelled` y `no_show` no cuentan.
- **Superposición:** una clase que termina justo cuando empieza otra no se superpone.
- **Sin membresía:** el calendario se ve igual; solo se bloquea reservar.

## Fuera de alcance (MVP)
- Lista de espera para clases llenas.
- Ver más allá de la semana siguiente.
- Filtrar por entrenador o por horario; elegir varios tipos a la vez.
- Recordatorios y notificaciones de clase.
- Paginación del historial.
- Marcar asistencia (lo hace el gimnasio; `attended`/`no_show` vienen del servidor).
