const numberFmt = new Intl.NumberFormat("es-ES");
const compactFmt = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
const dateTimeFmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" });
// ── Timezone asymmetry between formatDay and formatTime (READ THIS) ───────────
// Activity is now segmented by Caracas-local day (UTC-4) in SQL via DAY_EXPR
// (substr(datetime(created_at, '-4 hours'), 1, 10)). That has two consequences
// that pull formatDay and formatTime in OPPOSITE directions:
//
// • formatDay receives a bare 'YYYY-MM-DD' STRING that is ALREADY shifted to
//   Caracas by DAY_EXPR. It is a plain calendar date, not an instant, so it must
//   be rendered in UTC. Using timeZone: "America/Caracas" here would subtract
//   another 4 hours from the already-shifted midnight and roll the label back to
//   the PREVIOUS day (double-shift). So this stays UTC on purpose.
const dayFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
// • formatTime receives the RAW UTC created_at instant (an absolute timestamp).
//   To show the Caracas wall-clock HH:MM:SS that matches the Caracas day bucket,
//   it must be rendered in America/Caracas (Intl does the -4h shift correctly).
const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Caracas",
});

export function formatNumber(n: number | null | undefined): string {
  return numberFmt.format(n ?? 0);
}

export function compactNumber(n: number | null | undefined): string {
  const v = n ?? 0;
  return v >= 1000 ? compactFmt.format(v) : numberFmt.format(v);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFmt.format(d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

/**
 * Format a bare 'YYYY-MM-DD' day (ALREADY Caracas-shifted by DAY_EXPR) as a
 * weekday-prefixed Spanish date. Rendered in UTC on purpose — see the timeZone
 * asymmetry note above: the string is a plain calendar date, not an instant.
 */
export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day ?? "—";
  return dayFmt.format(d);
}

/**
 * Time-of-day "HH:MM:SS" from a raw UTC ISO-8601 timestamp, rendered as Caracas
 * wall-clock (UTC-4) so it matches the Caracas day bucket — see the asymmetry
 * note above.
 */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return timeFmt.format(d);
}

/** Compact relative time in Spanish: "hace 3 h", "hace 2 d", "ahora". */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "ahora";
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  const months = Math.round(days / 30);
  if (months < 12) return `hace ${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.round(months / 12);
  return `hace ${years} año${years === 1 ? "" : "s"}`;
}

export function initialsOf(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const out = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return out || fallback;
}
