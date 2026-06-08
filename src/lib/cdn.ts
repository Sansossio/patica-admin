const CDN_BASE = "https://cdn.patica.app";

/**
 * The DB stores only R2 keys; downloads go straight to the CDN custom domain
 * (mirrors withCdnUrl() in the API). Returns null for empty keys.
 */
export function cdnUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  return `${CDN_BASE}/${key.replace(/^\/+/, "")}`;
}

/** First key out of a JSON-stringified array column (e.g. dogs.image_urls). */
export function firstKeyOf(jsonArray: string | null | undefined): string | null {
  if (!jsonArray) return null;
  try {
    const arr = JSON.parse(jsonArray) as unknown;
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") return arr[0];
  } catch {
    /* not JSON */
  }
  return null;
}
