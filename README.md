# Patica Admin (`panel.patica.app`)

Panel de administración de Patica. **Next.js 15 (App Router) sobre Cloudflare con
[OpenNext](https://opennext.js.org/cloudflare)**. Habla **directo a la base de
datos D1** (no usa la API, que rechaza tráfico de navegador por CORS). Dark mode.

Funcionalidades: dashboard de estadísticas, gestión de usuarios (ban/unban con
histórico), revisión de reportes, monitoreo de chats (solo lectura, con media),
moderación de perros y logs de auditoría.

## Stack

- Next.js 15 + React 19 + TypeScript (estricto)
- OpenNext Cloudflare adapter (`@opennextjs/cloudflare`) → Worker + assets
- D1 (`patica-db`, binding `DB`) + R2 (`patica-cdn`, binding `CDN`) — **los mismos
  recursos que la API**
- Tailwind v4 (tokens en `@theme`, sin archivo de config)
- Auth: OAuth de Google (code flow) + sesión JWT firmada (`jose`) en cookie
  HttpOnly. Sin dependencias de Auth.js.
- Bun como gestor de paquetes

## Requisitos previos

- **Node 22** para el tooling (igual que el resto del workspace).
- Estar logueado en wrangler en la **misma cuenta de Cloudflare** que es dueña de
  `patica-db` (`database_id 5bdf7eac-14ef-44f8-b8df-56fe3b217d44`) y del bucket
  `patica-cdn`.

## Variables de entorno / secretos

| Var | Dónde | Valor |
|---|---|---|
| `AUTH_SECRET` | `.dev.vars` (dev) · `wrangler secret put` (prod) | aleatorio de 32 bytes hex |
| `GOOGLE_CLIENT_ID` | `.dev.vars` / secret | Web client de Google (`617080362687-54v0...`) |
| `GOOGLE_CLIENT_SECRET` | `.dev.vars` / secret | secret de ese Web client |
| `ENVIRONMENT` | `wrangler.toml` `[vars]` (prod) / `.dev.vars` (dev) | `production` / `development` |

`.dev.vars` ya está creado para desarrollo (y está en `.gitignore`).

### Google Cloud Console (Web OAuth client `617080362687-54v0...`)

- **Authorized JavaScript origins**: `http://localhost:3000`, `https://panel.patica.app` (ya configurados).
- **Authorized redirect URIs** (¡hay que añadirlos!):
  - `http://localhost:3000/api/auth/callback`
  - `https://panel.patica.app/api/auth/callback`

El acceso está restringido a los emails de la tabla `admin_users` (sembrada con
`juliosansossio@gmail.com`).

## Desarrollo

```bash
bun install
bun run dev            # next dev en http://localhost:3000 (bindings vía miniflare)
bun run typecheck      # tsc --noEmit
```

Para que `next dev` tenga datos, aplica las migraciones a la D1 **local** (de
este repo y de la API, ya que comparten base):

```bash
bun run db:migrate:dev                                   # migraciones de admin (user_bans, admin_users, ...)
# y desde ../api:  bun run db:migrate:dev                # migraciones de la API (incl. users.banned_until)
```

### Apuntar a la D1 de PRODUCCIÓN desde local

El binding `DB` tiene `remote = true` en `wrangler.toml`, activado solo cuando se
piden remote bindings. La app sigue corriendo en `localhost:3000` (donde está
autorizado el OAuth), pero la base de datos es la **real de producción**:

```bash
wrangler login          # cuenta de Cloudflare dueña de patica-db (una vez)
bun run dev:prod        # = REMOTE_DB=1 next dev  → DB apunta a producción
```

`bun run dev` (sin `dev:prod`) ignora `remote = true` y usa la D1 local.

> ⚠️ Con `dev:prod` las **escrituras van a producción**: banear/desbanear,
> resolver reportes y desactivar perros afectan datos reales. Para trastear sin
> riesgo, clona prod a local: `wrangler d1 export patica-db --remote --output=/tmp/p.sql`
> y `wrangler d1 execute patica-db --local --file=/tmp/p.sql`, luego `bun run dev`.

## Base de datos (contrato compartido con la API)

El panel escribe en la D1 directamente, así que **todo cambio de esquema debe
reflejarse en ambos repos**:

- `api/` posee la columna `users.banned_until` (enforcement del baneo) →
  `api/migrations/20260608120000_add_user_ban.sql`.
- `admin/` (este repo) posee `admin_users`, `admin_audit_log` y `user_bans`
  (histórico de baneos) → `migrations/20260608123000_admin_users_and_audit_log.sql`.
- `api/` posee también `user_events` (log de actividad de usuario, ingerido por
  `POST /api/events`) → `api/migrations/20260608140000_add_user_events.sql`. El
  panel solo la **lee** (pestaña "Actividad de usuarios" en Logs y en el detalle
  de usuario). Para poblarla, la app debe llamar a `POST /api/events`
  (autenticado) con los eventos importantes — pendiente de cablear en `app/`.
- `api/` posee `daily_metrics` (snapshots diarios `day · metric · value`) →
  `api/migrations/20260608150000_add_daily_metrics.sql`. Un cron diario en `api/`
  (`0 0 * * *`, `services/daily-metrics.ts`) calcula `active_users` =
  `COUNT(DISTINCT user_id)` sobre `user_events` y lo congela (DAU). El panel solo
  lo **lee** (gráfica "Usuarios activos" del dashboard) y sobrescribe el día de
  hoy en vivo. El espejo de solo-lectura para la D1 local del panel está en
  `migrations/20260608150100_add_daily_metrics.sql` (sin backfill).

Ambos `wrangler.toml` apuntan a `patica-db` y wrangler trackea las migraciones por
nombre de archivo (timestamps únicos), así que cada repo aplica solo lo suyo.

```bash
bun run db:migrate     # aplica migraciones de este repo a la D1 remota
```

### Modelo de baneo

`users.banned_until` es la única columna de enforcement:
`NULL`/pasado = no baneado; futuro = baneado; **permanente = centinela
`9999-12-31T23:59:59Z`**. El detalle e histórico (motivo, admin, tipo) vive en
`user_bans`. La API aplica el baneo en `src/middleware/auth.ts` (REST) y en
`src/durable-objects/chat-room.ts` (WebSocket).

## Deploy

```bash
# secretos (una vez)
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

bun run deploy         # opennextjs-cloudflare build && ... deploy
```

El dominio `panel.patica.app` se asocia al Worker `patica-admin` en el dashboard
de Cloudflare (Workers & Pages → Settings → Domains & Routes → Custom Domain),
igual que `patica.app`/`api.patica.app`.

## Git

Repo independiente. **No se commitea ni se pushea automáticamente** — igual que el
resto del workspace, el usuario revisa y commitea a mano. Remote:
`git@github.com:Sansossio/patica-admin.git`.
