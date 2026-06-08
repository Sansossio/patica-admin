import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default Cloudflare adapter config. No incremental cache / queue / tag cache
// is wired — the panel renders dynamically from D1 on every request, so there
// is nothing to cache. Add an R2/KV incremental cache here later if needed.
export default {
  ...defineCloudflareConfig(),
  // OpenNext compiles the Next.js app by running the package manager's `build`
  // script. Our `build` script IS `opennextjs-cloudflare build`, so without
  // this override the adapter would invoke itself recursively (infinite loop).
  // Point the Next.js compile step at the raw `next build`.
  buildCommand: "bun run build:next",
};
