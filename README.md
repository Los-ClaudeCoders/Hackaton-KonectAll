# KonectAll

Red vecinal para ofrecer y encontrar productos, servicios e intercambios cerca de casa. Incluye mapa, modo emergencia, chat entre vecinos, recomendaciones y moderación.

## Stack

- Ionic 9 + Angular 22 (standalone) + Capacitor 8
- Supabase (Auth, Postgres con RLS, Realtime, Storage)
- Leaflet + OpenStreetMap
- PWA con Angular Service Worker

## Inicio rápido

```bash
npm install
npm start        # http://localhost:4200
```

Las claves de Supabase están en `src/environments/environment.ts` y `environment.prod.ts`.

### Backend (Supabase)

1. Ejecutar `supabase/schema.sql` en el SQL Editor (idempotente).
2. Ejecutar `supabase/seed.sql` para los datos demo de Arequipa.
3. Authentication → Sign In / Providers → Email: desactivar **Confirm email**.
4. Authentication → URL Configuration:
   - Site URL: `http://localhost:4200` en desarrollo; tu dominio en producción.
   - Redirect URLs: agrega `https://<tu-dominio>/**`.
5. Para limpiar datos de prueba: `supabase/limpieza.sql`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción en `www/` (incluye `ngsw.json`) |
| `npm run lint` | ESLint + typecheck de e2e + Prettier |
| `npm run lint:fix` | ESLint `--fix` + Prettier |
| `npm run test:unit` | Vitest (specs de `src/`) |
| `npm run test:e2e` | Playwright (auto-inicia el dev server) |

En Windows con PowerShell usa `npm.cmd` / `npx.cmd`.

## Estructura

- `src/app/core/`: Supabase, Auth, publicaciones, mensajes, moderación, UI.
- `src/app/pages/`: páginas standalone (inicio, mapa, publicar, detalle, chat, conversación, perfil, comunidad, servicios, intercambios, emergencia, login, bienvenida).
- `src/app/shared/`: utilidades puras (distancia, geocoding, teléfono, errores, catálogo).
- `src/app/tabs/`: shell de tabs.
- `supabase/`: esquema, seed y limpieza.
- `e2e/`: pruebas Playwright.

## Privacidad de contacto

El teléfono no se envía en los listados: `perfiles` solo expone `id, nombre, barrio, creado_en` a clientes. Al tocar “WhatsApp” se llama al RPC `telefono_de(publicacion_id)`, que devuelve únicamente ese número.

## PWA

El service worker se registra solo en producción (`ngsw-worker.js`). Se desactiva en desarrollo para evitar cachés. Para probar offline, sirve `www/` por HTTPS o localhost (por ejemplo `npx serve www`).

## Despliegue en Netlify

`netlify.toml` ya define build (`npm run build`) y publish (`www`). `src/_redirects` da el fallback SPA. Conecta el repositorio en Netlify y listo.

## Apps nativas

Plataformas Android/iOS ya generadas con Capacitor (`appId: pe.konectall.app`).

```bash
npm run build
npx cap sync
npx cap open android   # requiere Android Studio (SDK 36, JDK 21)
npx cap open ios       # solo en macOS
```

## Notificaciones push (Android/FCM)

1. Crea el proyecto en Firebase y una app Android con paquete `pe.konectall.app`.
2. Descarga `google-services.json` y colócalo en `android/app/`.
3. Genera una clave de servicio (Service accounts → Generate new private key) y guárdala fuera del repo.
4. Despliega la función y configura el secreto:

```bash
npx supabase login
npx supabase link --project-ref rtmsgsmwyhahkrkxahog
npx supabase functions deploy aviso-push
npx supabase secrets set FCM_SERVICE_ACCOUNT="$(cat ruta/al/serviceAccount.json)"
```

El botón “Activar notificaciones” está en Mi perfil (solo en la app instalada).

## Pruebas e2e

`npm run test:e2e` cubre bienvenida, mapa, búsqueda, moderación, chat y un flujo completo entre dos vecinos. El flujo autenticado crea **dos usuarios efímeros** por corrida (emails aleatorios; el registro requiere “Confirm email” desactivado). Contra un sitio desplegado: `E2E_BASE_URL=https://tu-sitio npm run test:e2e`.
