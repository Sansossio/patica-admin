// Cloudflare binding + env types available via getCloudflareContext().env.
// Regenerate the binding part with `bun run cf-typegen` after editing
// wrangler.toml. Secrets are added by hand here (they live in .dev.vars / the
// Cloudflare secret store, not wrangler.toml).
import type { D1Database, R2Bucket, KVNamespace } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    // Bindings (wrangler.toml) — the SAME D1 + R2 + KV the API uses.
    DB: D1Database;
    CDN: R2Bucket;
    // Online presence: API writes patica:online:{userId} keys (90s TTL).
    KV_PATICA_USERS: KVNamespace;

    // Vars / secrets.
    ENVIRONMENT?: string;
    AUTH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  }
}

export {};
