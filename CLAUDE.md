# CLAUDE.md — patica-admin

Panel de administración de Patica (`panel.patica.app`). Cuarto repo del workspace,
hermano de `api/`, `app/`, `landing/`.

**Idioma**: responder al usuario en español; código, identificadores y comentarios
en inglés; texto de UI en español.

**Git (CRÍTICO)**: NUNCA crear commits ni pushear. Trabajar en `main`, dejar los
cambios en el working tree; el usuario commitea a mano.

## Qué es

Next.js 15 (App Router) + React 19 + TS estricto, desplegado en Cloudflare con
**OpenNext** (`@opennextjs/cloudflare`). **No llama a la API**: lee/escribe la D1
`patica-db` y el R2 `patica-cdn` directamente (mismos recursos que `api/`). Dark
mode, naranja de marca `#FF8C42`, tipografía Inter.

## Arquitectura

- **Bindings** (`wrangler.toml`): `DB` (D1 `patica-db`), `CDN` (R2 `patica-cdn`).
  Se acceden vía `getCloudflareContext().env` (helpers en `src/lib/cf.ts`). En
  `next dev` los provee miniflare + `.dev.vars` (`initOpenNextCloudflareForDev()`
  en `next.config.ts`).
- **Auth** (`src/lib/auth/*` + `src/app/api/auth/*`): OAuth de Google (code flow,
  state+nonce) → verifica el id_token contra el JWKS de Google → comprueba el email
  contra la tabla `admin_users` → crea una sesión JWT (`jose`, HS256, cookie
  HttpOnly `patica_admin_session`). `requireAdmin()` (`guard.ts`) protege el layout
  `(panel)` y re-verifica el allowlist en cada request. No se usa Auth.js.
- **Datos** (`src/lib/db.ts` + `src/lib/queries/*`): helpers `queryAll/queryFirst/
  scalar/execute`. Las estadísticas se calculan con agregaciones en vivo sobre D1
  (los contadores de la tabla `stats` pueden desviarse). Tipos de fila en
  `src/lib/types.ts` (espejo de `api/src/types.ts` — mantener en sync).
- **Mutaciones** (`src/actions/*`, server actions): `banUser/unbanUser`,
  `setReportStatus`, `setDogActive`. Cada una llama `requireAdmin()`, escribe en
  D1, registra en `admin_audit_log` (`src/lib/audit.ts`) y hace `revalidatePath`.
- **UI**: `src/components/ui.tsx` (primitivas server-safe), `icons.tsx`, badges,
  Sidebar/Topbar; componentes interactivos marcados `"use client"`
  (`SubmitButton`, `UserBanControls`). Tokens de tema en `src/app/globals.css`.
- **Rutas**: `(panel)` (layout con guard) → `/` dashboard, `/users[/[id]]`,
  `/reports[/[id]]`, `/chats[/[id]]`, `/dogs`, `/logs`, `/admins`
  (solo-superadmin: alta/baja de `admin_users`, gateada con `requireSuperAdmin()`).
  `/login` y `/api/auth/*` públicas. Todas las páginas del panel son
  `dynamic = "force-dynamic"` (leen D1 por request; nada de SSG).
- **CDN/imágenes**: la D1 guarda solo R2 keys; mostrar con `cdnUrl()`
  (`src/lib/cdn.ts`) → `https://cdn.patica.app/<key>`. Se usa `<img>` plano
  (`images.unoptimized`), no `next/image`.

## Base de datos (contrato compartido)

Cambios de esquema deben ir en ambos repos (ver README). `api/` posee
`users.banned_until`; `admin/` posee `admin_users`, `admin_audit_log`, `user_bans`.
IDs de entidades = UUID sin prefijo. Booleans 0/1, timestamps ISO-8601 TEXT.

Baneo: `users.banned_until` (NULL/pasado = no baneado, futuro = baneado,
permanente = centinela `9999-12-31T23:59:59Z`); detalle e histórico en `user_bans`.
Helpers en `src/lib/ban.ts`. La API lo aplica en su middleware y en el DO de chat.

## Comandos

```bash
bun install
bun run dev          # next dev (localhost:3000)
bun run typecheck    # tsc --noEmit (debe pasar limpio)
bun run db:migrate:dev   # migraciones a D1 local
bun run db:migrate       # migraciones a D1 remota
bun run preview      # build OpenNext + wrangler preview
bun run deploy       # build OpenNext + deploy
```

Tooling requiere **Node 22**.
