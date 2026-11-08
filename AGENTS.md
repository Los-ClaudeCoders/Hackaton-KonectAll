# AGENTS.md

KonectAll: Ionic 9 + Angular 22 standalone (Capacitor 8) para una red vecinal de servicios. UI, rutas, métodos y campos de BD están en español. Backend: Supabase hosted (proyecto `rtmsgsmwyhahkrkxahog`). El esquema y el seed viven en `supabase/`.

## Commands

- Dev server: `npm.cmd start` (http://localhost:4200)
- Build: `npm.cmd run build` -> `www/` (incluye `ngsw.json`/`ngsw-worker.js`)
- Lint: `npm.cmd run lint` = `ng lint --max-warnings 0` -> typecheck e2e -> prettier check
- Autofix: `npm.cmd run lint:fix`
- Unit: `npm.cmd run test:unit`; watch: `npm.cmd run test:unit:watch`
- Un spec: `npx.cmd ng test --no-watch --include app/shared/errores.util.spec.ts` (ruta relativa a `src/`)
- E2E: `npm.cmd run test:e2e` (Playwright auto-inicia el dev server; navegadores con `npx.cmd playwright install`)
- E2E contra un sitio: `E2E_BASE_URL=https://... npm.cmd run test:e2e`
- Nativo: `npm.cmd run build` -> `npx.cmd cap sync` -> `npx.cmd cap open android`
- En PowerShell usa `npm.cmd`/`npx.cmd`.

## Baseline (verificado)

- Build, lint y tests verdes.
- `test:unit`: 7 archivos / 15 tests.
- `test:e2e`: 15 tests (14 de UI + flujo autenticado). El flujo crea 2 usuarios efímeros por corrida, requiere "Confirm email" desactivado y deja usuarios huérfanos.
- El build emite un warning conocido: Leaflet no es ESM.

## Architecture

- Bootstrap `src/main.ts`; rutas lazy en `src/app/app.routes.ts`. Todo standalone.
- `core/`: `SupabaseService`, `AuthService` (signals), `PublicacionesService` (signals + Realtime + caché localStorage), `MensajesService` (chat, no leídos, Realtime), `ModeracionService` (denuncias/bloqueos), `NotificacionesService` (push nativo FCM), `authGuard`, `UiService`, `models.ts`.
- `pages/`: inicio, mapa (Leaflet en `ionViewDidEnter`), publicar (crear/editar, foto comprimida, geocoding), detalle, chat, conversación, perfil, comunidad, servicios, intercambios, emergencia, login, bienvenida.
- `shared/`: distancia/geolocalización (fallback Arequipa), `geocodificar` (Nominatim), `telefono`, `errores`, catálogo, contactos WhatsApp, conversaciones.
- Tablas: `perfiles`, `publicaciones`, `recomendaciones`, `mensajes`, `denuncias`, `bloqueos`, `push_tokens`; RPC `telefono_de`; Storage bucket `fotos`; Edge Function `supabase/functions/aviso-push` + triggers `pg_net`.
- Realtime: `publicaciones`, `recomendaciones`, `mensajes`. Canales por página se detienen al salir.
- Despliegue: `netlify.toml` (build + SPA fallback) y `src/_redirects`. Nativo: `assets/logo.png` es la fuente de `@capacitor/assets`.
- Push solo en nativo: `google-services.json` va en `android/app/`; el service account FCM vive en un secreto de Supabase, nunca en el repo.

## Conventions and gotchas

- `perfiles` tiene SELECT por columnas: solo `id, nombre, barrio, creado_en`. El teléfono se obtiene con `telefono_de`. No vuelvas a pedir `perfiles(telefono)` en un select.
- El service worker (`provideServiceWorker`) se activa solo en producción y fuera de Capacitor; en dev está desactivado (`serviceWorker: false`).
- `src/global.scss` fuerza `pointer-events: none` en `ion-router-outlet` y `auto` en `.ion-page`; sin eso, el outlet intercepta toques del contenido en Chromium.
- `authGuard` agrega `?redirect=` al login; el login respeta destinos internos.
- Las plataformas `android/` e `ios/` se versionan; sus `.gitignore` internos excluyen el bundle web copiado y builds.
- ESLint: imports en grupos alfabéticos, `import type`, tipos de retorno explícitos, `!==` en templates. Prettier formatea solo `**/*.{ts,html}` (SCSS no).
- No traducir identificadores, campos ni textos de UI.
- Presupuestos: estilos de componente warning 2 KB / error 4 KB.
- `src/test-setup.ts` polyfills `window.matchMedia` para jsdom.
- Las migraciones las ejecuta el usuario en el SQL Editor; no hay credenciales de service role/DDL en el repo.
- `pyproject.toml`, `uv.lock` y `src/konectall/` son un stub Python ajeno al app.
