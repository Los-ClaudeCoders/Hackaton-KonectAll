# KonectAll

Red vecinal para ofrecer, encontrar e intercambiar productos y servicios cerca de casa. Incluye mapa, modo emergencia, chat en tiempo real, recomendaciones vecinales, moderación y notificaciones push en la app nativa.

- **Demo web:** https://konectall.netlify.app
- **Repositorio:** https://github.com/Los-ClaudeCoders/Hackaton-KonectAll
- **App nativa:** `pe.konectall.app`
- **Supabase:** proyecto `rtmsgsmwyhahkrkxahog`

## Qué incluye

- **Inicio** con búsqueda por texto, filtro por radio (1/3/5 km), publicaciones cercanas ordenadas por distancia y banner de emergencias.
- **Publicar en 3 toques**: ofrezco, necesito o intercambio; foto comprimida (máx. 5 MB), precio/gratis, urgente, dirección con geocoding y modo emergencia.
- **Mapa** con Leaflet + OpenStreetMap: filtros, pines por tipo/emergencia, ubicación propia y tooltip con detalle.
- **Servicios y productos** e **Intercambios** con segmentos y buscador.
- **Modo emergencia**: pedir/ofrecer ayuda, urgentes cerca y teléfonos 105/116/106/115.
- **Chat real** por publicación: conversaciones, mensajes en tiempo real, badge de no leídos y aviso al recibir.
- **Mi comunidad**: vecinos activos y publicaciones más recomendadas.
- **Perfil**: edición de nombre/teléfono/barrio, edición/eliminación de publicaciones, tutorial y notificaciones.
- **Visto Bueno Vecinal**: recomendaciones por publicación.
- **Moderación**: reportar publicaciones/conversaciones, bloquear vecinos y límites anti-spam.
- **PWA** instalable con service worker (offline del app shell) y caché de datos en localStorage.
- **Push nativo FCM** para mensajes y emergencias.

## Tecnologías usadas

| Área | Herramientas |
|---|---|
| Frontend | Angular 22.2.3, Ionic 9, TypeScript 6, standalone components, signals, SCSS |
| Móvil | Capacitor 8.6 (`app`, `haptics`, `keyboard`, `status-bar`, `push-notifications`), `@capacitor/assets` |
| Backend | Supabase: Postgres, Auth, RLS, Realtime, Storage, Edge Functions (Deno), `pg_net` |
| Base de datos | SQL idempotente en `supabase/` (tablas, políticas, triggers, RPC, bucket) |
| Mapa | Leaflet 1.9.4, tiles OpenStreetMap, geocoding Nominatim |
| PWA | `@angular/service-worker` 22.2.3, `ngsw-config.json`, manifest e íconos |
| Push | FCM HTTP v1 (OAuth con `jose`), Edge Function `aviso-push`, triggers de Postgres |
| Pruebas | Vitest 5 + jsdom (unit), Playwright 1.64 (e2e) |
| Calidad | ESLint 10 (Ionic config), Prettier 3, `angular-eslint`, typecheck de e2e |
| Deploy | Netlify (`netlify.toml`, `_redirects`, HTTPS) |
| CLI | Supabase CLI 3.0 (link, deploy de functions, secrets) |

## Diseño

La interfaz se rediseñó tomando como referencia el mockup original de “Cerca” y manteniendo el azul de marca `#1c5fd6`.

- **Tokens** en `src/theme/variables.scss`: rampa de color, colores por categoría (servicios, intercambios, emergencia, comunidad), superficies, bordes, radios y sombras; variantes para modo oscuro.
- **Tema**: selector claro / oscuro / según el sistema desde el botón del encabezado de Inicio y desde Mi perfil → Apariencia; se guarda en localStorage.
- **Tipografía**: Poppins auto-almacenada en `src/assets/fonts` (woff2 + licencia OFL), con preload en `index.html`.
- **Componentes compartidos** en `src/app/shared/ui`: tarjeta de publicación, avatar con iniciales, estado vacío y esqueleto de carga.
- **Fluidez**: skeletons en listas, stagger de tarjetas y transición fade de páginas (`src/app/shared/animaciones.ts`), respetando `prefers-reduced-motion`.
- **Accesibilidad**: foco visible, contraste en claro/oscuro, objetivos táctiles de Ionic y safe areas en tab bar/footers.

## Estructura

- `src/app/core/`: `SupabaseService`, `AuthService`, `PublicacionesService`, `MensajesService`, `ModeracionService`, `NotificacionesService`, `authGuard`, `UiService`, modelos.
- `src/app/pages/`: inicio, mapa, publicar, detalle, chat, conversación, perfil, comunidad, servicios, intercambios, emergencia, login, bienvenida.
- `src/app/shared/`: distancia/geolocalización, geocoding, teléfono, imágenes, errores, catálogo, conversaciones, contactos.
- `src/app/tabs/`: shell de tabs con badge de no leídos.
- `supabase/`: `schema.sql`, `seed.sql`, `limpieza.sql`, `config.toml` y `functions/aviso-push`.
- `e2e/`: `app.spec.ts` (UI) y `flujo.spec.ts` (dos vecinos).
- `android/` e `ios/`: plataformas Capacitor.
- `assets/logo.png`: fuente de íconos/splash nativos.

## Modelo de datos (Supabase)

| Tabla | Uso |
|---|---|
| `perfiles` | Nombre, barrio y teléfono. El teléfono **no** se expone en listados; se obtiene con el RPC `telefono_de`. |
| `publicaciones` | Tipo, modo, categoría, título, descripción, dirección, foto, precio, urgente, coordenadas y estado. |
| `recomendaciones` | Un “Visto Bueno” por publicación y vecino. |
| `mensajes` | Chat por publicación: emisor, receptor, texto y `leido`. |
| `denuncias` | Reportes con motivo (publicación o mensaje). |
| `bloqueos` | Vecinos bloqueados por usuario. |
| `push_tokens` | Tokens FCM por usuario y plataforma. |

Además: bucket público `fotos`, RLS en todas las tablas, Realtime en `publicaciones`, `recomendaciones` y `mensajes`, RPC `telefono_de(uuid)` y Edge Function `aviso-push` con triggers `pg_net`.

## Puesta en marcha local

Requisitos: Node 22+, npm. En Windows/PowerShell usa `npm.cmd` y `npx.cmd`.

```bash
npm install
npm start        # http://localhost:4200
```

Las claves públicas de Supabase están en `src/environments/environment.ts` y `environment.prod.ts`.

### Configuración de Supabase

1. Ejecuta `supabase/schema.sql` en el SQL Editor (idempotente).
2. Ejecuta `supabase/seed.sql` para los datos demo de Arequipa.
3. **Authentication → Sign In / Providers → Email**: habilita el proveedor y desactiva **Confirm email** para la demo.
4. **Authentication → URL Configuration**:
   - Site URL: `https://konectall.netlify.app`
   - Redirect URLs: `https://konectall.netlify.app/**`, `https://konectall.netlify.app/login`, `http://localhost:4200/**`
5. Limpieza de datos e2e: `supabase/limpieza.sql`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción en `www/` (incluye `ngsw.json`) |
| `npm run lint` | ESLint + typecheck de e2e + Prettier |
| `npm run lint:fix` | ESLint `--fix` + Prettier |
| `npm run test:unit` | Vitest (specs de `src/`) |
| `npm run test:unit:watch` | Vitest en modo watch |
| `npm run test:e2e` | Playwright (auto-inicia el dev server) |
| `npm test` | Unit + e2e |

Contra un sitio desplegado:

```powershell
$env:E2E_BASE_URL='https://konectall.netlify.app'
npx.cmd playwright test e2e/app.spec.ts
```

## Pruebas

- **Unit:** 7 archivos / 15 tests (catálogo, comunidad, conversaciones, errores, teléfono, login y app).
- **E2E:** 15 tests. `app.spec.ts` cubre bienvenida, mapa, búsqueda, rutas, detalle, privacidad y moderación; `flujo.spec.ts` registra dos vecinos y prueba publicar, recomendar, chatear, badge de no leídos, reportar, bloquear y eliminar.
- El flujo autenticado crea **dos usuarios efímeros** por corrida (emails aleatorios) y requiere “Confirm email” desactivado. Los usuarios de Auth quedan en el proyecto; las publicaciones se eliminan al final.

## Despliegue web (Netlify)

- `netlify.toml` define `npm run build` y publica `www` con Node 22.
- `src/_redirects` da el fallback SPA (rutas profundas como `/tabs/inicio` no dan 404).
- El manifest se sirve como `assets/manifest.json` (`application/json`) para que el navegador lo acepte como PWA.
- El service worker se registra solo en producción (`ngsw-worker.js`); en desarrollo está desactivado para evitar cachés.
- Verificado: rutas profundas, `ngsw.json`, `ngsw-worker.js`, manifest e iconos.

## Apps nativas

Plataformas ya generadas con Capacitor (`appId: pe.konectall.app`). Requisitos Android: Android Studio, **SDK 36**, **JDK 21** (Gradle 8.14.3, minSdk 24).

```bash
npm run build
npx cap sync
npx cap open android     # compilar/ejecutar en Android Studio
npx cap open ios         # solo en macOS
```

APK de debug: `android/app/build/outputs/apk/debug/app-debug.apk`.

Íconos y splash se generan desde `assets/logo.png`:

```bash
npx capacitor-assets generate --android --ios
```

## Notificaciones push (Android/FCM)

Flujo: la app registra el token en `push_tokens` → un trigger de Postgres llama (`pg_net`) a la Edge Function → la función envía por FCM HTTP v1.

1. En Firebase: crea el proyecto y una app Android con paquete `pe.konectall.app`.
2. Descarga `google-services.json` y colócalo en `android/app/` (sí puede ir al repo; no es secreto).
3. Genera una clave de servicio (**Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada**) y guárdala **fuera del repo**.
4. Configura el secreto y despliega la función:

```powershell
npx supabase login
npx supabase link --project-ref rtmsgsmwyhahkrkxahog
npx supabase functions deploy aviso-push --use-api --no-verify-jwt
```

Configura el secreto (PowerShell, minificando el JSON para que quepa en una línea):

```powershell
$json = Get-Content -Raw .\ruta\serviceAccount.json | ConvertFrom-Json | ConvertTo-Json -Compress
Set-Content -LiteralPath supabase\.env -Value "FCM_SERVICE_ACCOUNT=$json" -Encoding ASCII -NoNewline
npx supabase secrets set --env-file supabase/.env --yes
Remove-Item supabase\.env
```

También puedes pegar el JSON del service account en el dashboard: Project Settings → Edge Functions → Secrets (recomendado si el comando falla).

5. Prueba la función:

```powershell
$cuerpo = @{ tipo='mensaje'; titulo='Prueba'; cuerpo='Hola' } | ConvertTo-Json
Invoke-RestMethod -Uri 'https://rtmsgsmwyhahkrkxahog.supabase.co/functions/v1/aviso-push' `
  -Method Post -Headers @{ apikey = 'sb_publishable_m1-vpBa4u_kUBkYyBXZcqw_SCg8UzhI' } `
  -ContentType 'application/json' -Body $cuerpo
```

Respuesta esperada: `{"enviados":0,"fallidos":0}` si aún no hay dispositivos, o el conteo real.

El botón **Activar notificaciones** está en Mi perfil y solo aparece en la app nativa. En Android 13+ se pide permiso; para probar usa un dispositivo físico o un emulador **con Google Play**.

> Nota de demo: la función se despliega con `verify_jwt = false` (definido en `supabase/config.toml`). Para producción conviene exigir un JWT o un secreto compartido.

## Privacidad y seguridad

- `perfiles` solo expone `id, nombre, barrio, creado_en` a los clientes; el teléfono se consulta con el RPC `telefono_de(publicacion_id)` al tocar WhatsApp.
- RLS en todas las tablas: cada usuario solo escribe/lee lo suyo (chat, denuncias, bloqueos, tokens).
- Anti-spam: máximo 20 publicaciones/día y 50 mensajes/hora por usuario.
- El service account de Firebase y el archivo `.env` están ignorados por git. El `google-services.json` no es secreto.
- La clave de Supabase del frontend es publicable; nunca se usa una service role key en el cliente.

## Problemas conocidos y soluciones

| Síntoma | Causa / solución |
|---|---|
| “Email logins are disabled” | Habilita el proveedor Email en Authentication → Providers → Email. |
| La función push responde 503 | El secreto `FCM_SERVICE_ACCOUNT` debe ser el JSON del **service account**, no `google-services.json`. |
| La función push responde 500 | Revisa los logs de la función; la versión actual devuelve el error en el JSON. |
| No llega la notificación | Verifica permiso, fila en `push_tokens`, `google-services.json`, secreto y función desplegada. |
| 404 al abrir una ruta directa | Revisa `netlify.toml`/`src/_redirects` (fallback SPA). |
| “SDK location not found” al compilar Android | Abre `android/` en Android Studio una vez para que cree `local.properties`. |
| Warning de Leaflet no ESM | Conocido; no afecta el build. |

## Estado de la demo

- Desplegado en Netlify y verificado con 14 tests de UI contra producción.
- PWA con manifest, service worker y fallback SPA.
- Backend Supabase con datos demo, RLS, chat, moderación y privacidad de teléfonos.
- Push FCM verificado de extremo a extremo (token → función → envío).
- Pendiente: habilitar el proveedor Email, confirmar Site URL/Redirect URLs y compilar/probar el APK en un dispositivo.
