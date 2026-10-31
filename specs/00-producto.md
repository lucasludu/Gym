# 00 · Producto

> Spec de alto nivel. Define el qué y el para quién. Las specs de cada feature (`specs/features/*.md`) bajan esto a requisitos concretos.

## Visión

App mobile para **socios de un gimnasio**: reservar clases, seguir la rutina asignada, registrar entrenamientos y ver el progreso, todo desde el celular.

Es un proyecto de portfolio. Se prioriza la **calidad del código, la arquitectura y la experiencia de uso** por sobre la cantidad de features.

## Usuario principal

**Socio del gimnasio**
- Entrena entre 2 y 5 veces por semana.
- Va a clases grupales (funcional, spinning, yoga) y/o a la sala de musculación.
- Usa la app en el gimnasio, con una mano y entre series, así que necesita acciones rápidas y textos grandes.

Fuera de alcance por ahora: entrenador y admin (se harán como panel web junto con el backend).

## Problemas que resuelve

1. No saber si hay lugar en una clase sin ir o preguntar.
2. Rutinas en papel o en fotos del celular, difíciles de seguir.
3. No recordar cuánto peso se levantó la vez anterior.
4. No ver el progreso a lo largo del tiempo.

## Alcance del MVP

| # | Feature | Descripción breve | Spec |
|---|---------|-------------------|------|
| 1 | Autenticación | Login y registro (mock en esta etapa) | `features/auth.md` |
| 2 | Home | Estado de cuota, próxima clase, racha semanal | `features/home.md` |
| 3 | Reservas | Calendario semanal de clases con cupo; reservar y cancelar | `features/reservas.md` |
| 4 | Rutina | Ver la rutina asignada por día | `features/rutina.md` |
| 5 | Workout logger | Registrar series reales (peso/reps) con timer de descanso | `features/workout-logger.md` |
| 6 | Progreso | Historial, récords personales y gráficos por ejercicio | `features/progreso.md` |

### Post-MVP (en orden de prioridad)
- QR de acceso al gimnasio
- Perfil con medidas corporales
- Notificaciones (recordatorio de clase, cuota por vencer)
- Biblioteca de ejercicios
- Modo offline

## Fuera de alcance
- Pagos reales (en la etapa de backend se usará Mercado Pago en sandbox)
- Chat entre socios o con el entrenador
- Planes de nutrición
- Integración con wearables

## Principios de producto
- **Rápido entre series:** registrar una serie debe llevar 1 o 2 toques.
- **Claro de un vistazo:** el estado (cupo, cuota, próxima clase) se entiende sin leer mucho.
- **Feedback inmediato:** toda acción muestra resultado (loading, éxito o error).
- **Accesible:** contraste adecuado, áreas táctiles de al menos 44 px, soporte para lector de pantalla.

## Etapas del proyecto
1. **Front con API mock** (esta etapa): todas las pantallas consumen una capa `api/` que hoy devuelve datos simulados.
2. **Backend:** API real con auth, roles y control de cupos. El front solo cambia la URL base.
3. **Panel web** para entrenador y admin.

## Criterios de éxito (portfolio)
- La app se puede instalar y probar (Expo Go o APK) sin clonar el repo.
- Cada feature tiene spec, tests y commits atómicos.
- El README explica la arquitectura y las decisiones tomadas.
