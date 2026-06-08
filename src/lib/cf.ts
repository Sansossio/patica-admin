import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

/**
 * Cloudflare bindings + env, available inside any request-scoped server code
 * (server components, server actions, route handlers). Populated by miniflare
 * in `next dev` and by the Worker runtime in production.
 */
export function env(): CloudflareEnv {
  return getCloudflareContext().env;
}

export function db(): D1Database {
  return getCloudflareContext().env.DB;
}

export function r2(): R2Bucket {
  return getCloudflareContext().env.CDN;
}
