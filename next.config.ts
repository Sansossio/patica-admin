import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // We render against live D1 data; no static optimization to worry about.
  eslint: { ignoreDuringBuilds: true },
  // R2/CDN images are served directly from cdn.patica.app; skip the Next Image
  // Optimization API (which would need a custom loader on Workers).
  images: { unoptimized: true },
};

// Populates getCloudflareContext() (D1 `DB`, R2 `CDN`, env/secrets) during
// `next dev` via miniflare + .dev.vars. No-op in production.
//
// REMOTE_DB=1 enables remote bindings: any binding marked `remote = true` in
// wrangler.toml (the D1 `DB`) connects to the REAL production database while
// the app still runs locally on :3000. Use `bun run dev:prod`. Default dev
// (REMOTE_DB unset) stays fully local — no remote proxy, no Cloudflare auth.
initOpenNextCloudflareForDev({ remoteBindings: process.env.REMOTE_DB === "1" });

export default nextConfig;
