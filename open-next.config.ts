import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default Cloudflare adapter config. No incremental cache / queue / tag cache
// is wired — the panel renders dynamically from D1 on every request, so there
// is nothing to cache. Add an R2/KV incremental cache here later if needed.
export default defineCloudflareConfig();
