# Feature · Autenticación

Tareas: T5.1 (navegación), T5.2 (sesión), T5.3 (login), T5.4 (registro), T5.5 (logout).
Modelo: `User` en [`01-modelo-datos.md`](../01-modelo-datos.md#user).

## Objetivo
Que el socio entre a la app con su cuenta, o se cree una, y que la sesión se mantenga al cerrar y volver a abrir la app. En esta etapa el login es **mock**: se busca el usuario por email y la contraseña solo se valida en formato. Al pasar al backend real (Fase 9) solo cambian la capa `src/api/` y lo que se guarda en la sesión; las pantallas no.

## Pantallas y navegación
| Ruta | Grupo | Contenido |
|---|---|---|
| `/(auth)/login` | `(auth)` | Formulario de login, link a registro, botón de cuenta demo |
| `/(auth)/register` | `(auth)` | Formulario de registro, link a login |
| `/(tabs)/…` | `(tabs)` | Inicio, Clases, Rutina, Progreso, Perfil (el logout está en Perfil) |

- **Rutas protegidas:** sin sesión, cualquier ruta de `(tabs)` redirige a `/login`. Con sesión, las rutas de `(auth)` redirigen a `/(tabs)` (Inicio).
- **Arranque:** mientras se lee la sesión guardada se mantiene la splash screen; no se muestra el login ni un parpadeo de pantalla equivocada.
- El link "Crear cuenta" del login y "Ya tengo cuenta" del registro reemplazan la pantalla (no se apilan una sobre otra).

## Sesión (T5.2)
- Store de Zustand con `userId: string | null` y el estado `hydrated` (si ya se leyó lo guardado).
- Se persiste **solo el `userId`** con `expo-secure-store` (dependencia a aprobar en T5.2). No se guardan contraseña, email ni datos del perfil: el `User` se pide a la API con TanStack Query (`getUser`).
- Al abrir la app con sesión guardada:
  - si `getUser` responde → se entra directo a Inicio;
  - si responde **404** (el usuario ya no existe) → se cierra la sesión y se va a login;
  - si falla por **red, timeout o 5xx** → la sesión se mantiene y la pantalla muestra su `ErrorState` con reintentar. No se cierra la sesión por estar sin conexión.
- Si lo guardado está corrupto o no se puede leer → se trata como sin sesión.
- Backend real (Fase 9): en lugar del `userId` se guardará el token; el resto del flujo se mantiene.

## Login (T5.3)
### Campos
| Campo | Reglas (Zod) | Mensaje |
|---|---|---|
| Email | obligatorio; formato email; se normaliza con `trim` y minúsculas | "Ingresá tu email" / "Ingresá un email válido" |
| Contraseña | obligatoria | "Ingresá tu contraseña" |

- Email con `keyboardType="email-address"`, sin autocorrección ni mayúscula automática; contraseña oculta, con botón para mostrarla/ocultarla (`IconButton` con `accessibilityLabel` "Mostrar contraseña" / "Ocultar contraseña").
- "Siguiente" en el teclado pasa del email a la contraseña; "Listo" en la contraseña envía.
- En el login **no** se exigen las reglas de largo del registro: un usuario no debería quedar trabado si las reglas cambian.

### Comportamiento
- Los errores de validación se muestran al intentar enviar y, desde ahí, se actualizan al escribir. Al enviar con errores se enfoca el primer campo inválido.
- Mientras se envía, el botón "Ingresar" muestra loading y no se puede volver a tocar.
- Mock: `findUserByEmail(email)`; la contraseña **no** se envía ni se guarda.
- Email no encontrado → mensaje **genérico** sobre el formulario: "Email o contraseña incorrectos." No revela si el email está registrado. Se conserva lo escrito.
- Error de red / timeout / servidor → mensaje sobre el formulario con el texto de `getErrorMessage` (por ejemplo "No pudimos conectarnos…") y se puede volver a intentar. Se conserva lo escrito.
- Éxito → se guarda la sesión y se va a Inicio.

### Cuenta demo
- Botón secundario "Probar con la cuenta demo" que completa el email de la socia demo (`sofia.martinez@example.com`, `user-1` del seed, que tiene todos los casos de prueba) y una contraseña válida, y envía.
- Solo se muestra si `EXPO_PUBLIC_DEMO_LOGIN` es `"true"`. Por defecto está oculto; en `.env.example` queda en `"true"` para la etapa mock.

## Registro (T5.4)
### Campos
| Campo | Reglas (Zod) | Mensaje |
|---|---|---|
| Nombre | obligatorio; 1–50 caracteres después de `trim` | "Ingresá tu nombre" / "Máximo 50 caracteres" |
| Apellido | obligatorio; 1–50 caracteres después de `trim` | "Ingresá tu apellido" / "Máximo 50 caracteres" |
| Email | obligatorio; formato email; `trim` y minúsculas | "Ingresá tu email" / "Ingresá un email válido" |
| Contraseña | mínimo 8 caracteres, al menos una letra y un número | "Usá al menos 8 caracteres, con letras y números" |
| Repetir contraseña | igual a la contraseña | "Las contraseñas no coinciden" |

- La regla de la contraseña se muestra como `hint` del campo antes de que haya error.
- Las dos contraseñas tienen el botón mostrar/ocultar.
- El schema del formulario vive en `src/domain/` (función pura, testeada) y deriva sus campos de `userSchema` donde coinciden (nombre, apellido, email), sin duplicar reglas.

### Comportamiento
- Validación, foco en el primer error, loading y errores de red: igual que en el login.
- Antes de crear se verifica con `findUserByEmail` que el email no exista (json-server no valida unicidad). Si existe → error en el campo email: "Ya existe una cuenta con ese email." con un link "Ingresar" que lleva al login con el email precargado.
  - Esto sí revela que el email está registrado; es inevitable en un registro y se acepta.
- `createUser` crea solo el `User`: sin membresía, `weeklyGoal` 3, `avatarUrl` null. La contraseña no se envía.
- Éxito → se inicia la sesión con el usuario nuevo y se va a Inicio, que muestra "Sin membresía activa" (ver `home.md`).

## Logout (T5.5)
- Botón "Cerrar sesión" en Perfil (variante `danger`).
- Pide confirmación: "¿Cerrar sesión?" con "Cancelar" y "Cerrar sesión".
  - Si hay un entrenamiento en curso, el mensaje lo avisa: "Tenés un entrenamiento en curso. Si cerrás sesión, se va a perder."
- Al confirmar se borran **todos los datos locales del socio**: la sesión en `expo-secure-store`, el entrenamiento en curso, el resto de los stores persistidos y la caché de TanStack Query (`queryClient.clear()`). Después se va a login.
- No queda ningún dato del socio anterior en el celular para el siguiente que entre.

## Estados
| Pantalla | Carga | Error | Vacío |
|---|---|---|---|
| Arranque | splash hasta leer la sesión | sesión ilegible → login | — |
| Login | botón "Ingresar" en loading | mensaje sobre el formulario (credenciales o red) | — |
| Registro | botón "Crear cuenta" en loading | email duplicado en el campo; red sobre el formulario | — |
| Logout | — (es local) | — | — |

## Accesibilidad
- Cada campo usa `Input` (label visible = nombre accesible; el error se anuncia).
- El mensaje de error sobre el formulario se anuncia al lector de pantalla (`accessibilityLiveRegion="polite"`, rol `alert`).
- Títulos de pantalla como encabezado ("Ingresá a tu cuenta", "Creá tu cuenta").
- Todo el formulario se puede completar con el teclado abierto: la pantalla se desplaza para que el campo enfocado y el botón queden visibles.

## Criterios de aceptación

### Navegación y sesión
1. **Dado** que no hay sesión guardada, **cuando** abro la app, **entonces** veo el login.
2. **Dado** que hay una sesión guardada de un usuario que existe, **cuando** abro la app, **entonces** entro directo a Inicio sin ver el login.
3. **Dado** que hay una sesión guardada de un usuario que ya no existe (404), **cuando** abro la app, **entonces** se borra la sesión y veo el login.
4. **Dado** que hay una sesión guardada y no hay conexión, **cuando** abro la app, **entonces** la sesión se mantiene y veo el estado de error con "Reintentar".
5. **Dado** que no tengo sesión, **cuando** intento abrir una ruta de `(tabs)`, **entonces** me redirige al login.
6. **Dado** que tengo sesión, **cuando** intento abrir el login o el registro, **entonces** me redirige a Inicio.

### Login
7. **Dado** el login vacío, **cuando** toco "Ingresar", **entonces** veo "Ingresá tu email" e "Ingresá tu contraseña", el foco va al email y no se llama a la API.
8. **Dado** un email con formato inválido, **cuando** toco "Ingresar", **entonces** veo "Ingresá un email válido".
9. **Dado** `" Sofia.Martinez@Example.com "` y una contraseña, **cuando** toco "Ingresar", **entonces** se busca `sofia.martinez@example.com` y entro a Inicio.
10. **Dado** un email que no existe, **cuando** toco "Ingresar", **entonces** veo "Email o contraseña incorrectos.", sigo en el login y lo escrito se conserva.
11. **Dado** que no hay conexión, **cuando** toco "Ingresar", **entonces** veo "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo." y puedo reintentar.
12. **Dado** que el login se está enviando, **cuando** toco "Ingresar" de nuevo, **entonces** no se hace una segunda llamada.
13. **Dado** que la contraseña está oculta, **cuando** toco "Mostrar contraseña", **entonces** se ve el texto y el botón pasa a "Ocultar contraseña".
14. **Dado** `EXPO_PUBLIC_DEMO_LOGIN="true"`, **cuando** toco "Probar con la cuenta demo", **entonces** entro como Sofía Martínez. **Dado** que la variable no es `"true"`, **entonces** el botón no aparece.

### Registro
15. **Dado** el registro vacío, **cuando** toco "Crear cuenta", **entonces** veo el error de cada campo obligatorio y el foco va al nombre.
16. **Dado** una contraseña de 7 caracteres, o sin números, o sin letras, **cuando** toco "Crear cuenta", **entonces** veo "Usá al menos 8 caracteres, con letras y números".
17. **Dado** que "Repetir contraseña" no coincide, **cuando** toco "Crear cuenta", **entonces** veo "Las contraseñas no coinciden" en ese campo.
18. **Dado** un email ya registrado, **cuando** toco "Crear cuenta", **entonces** veo "Ya existe una cuenta con ese email." en el campo email, no se crea ningún usuario, y "Ingresar" me lleva al login con el email precargado.
19. **Dado** datos válidos y un email nuevo, **cuando** toco "Crear cuenta", **entonces** se crea un `User` sin membresía con `weeklyGoal` 3, se inicia la sesión y veo Inicio con "Sin membresía activa".
20. **Dado** un nombre con espacios alrededor, **cuando** me registro, **entonces** se guarda sin esos espacios.

### Logout
21. **Dado** que tengo sesión, **cuando** toco "Cerrar sesión" y confirmo, **entonces** veo el login y al reabrir la app sigo sin sesión.
22. **Dado** el diálogo de confirmación, **cuando** toco "Cancelar", **entonces** sigo en Perfil con la sesión intacta.
23. **Dado** un entrenamiento en curso, **cuando** toco "Cerrar sesión", **entonces** el diálogo avisa que se va a perder; si confirmo, se borra.
24. **Dado** que cerré sesión, **cuando** entra otro socio en el mismo celular, **entonces** no ve ningún dato del anterior (ni en caché ni en los stores).

## Casos borde
- Email con mayúsculas o espacios: se normaliza en login y registro (criterio 9).
- Doble toque en "Ingresar" o "Crear cuenta": una sola llamada (criterio 12).
- Dos registros simultáneos con el mismo email: json-server los aceptaría; se acepta en el mock y lo resuelve la unicidad del backend real.
- Volver atrás (botón de Android) desde Inicio después del login: no vuelve al login; sale de la app.
- Usuario borrado del mock mientras tenía sesión: criterio 3.

## Fuera de alcance (MVP)
- Recuperar contraseña, verificación de email, login con Google/Apple, biometría.
- Editar email o contraseña desde el perfil.
- Expiración de sesión (no hay token en el mock).
