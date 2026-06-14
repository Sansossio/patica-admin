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
// A bare 'YYYY-MM-DD' UTC day rendered with weekday; forced to UTC so the label
// matches the day bucket (which is UTC) regardless of the server's local tz.
const dayFmt = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
// Time-of-day rendered in **UTC** so the displayed HH:MM:SS matches the UTC day
// bucket (substr(created_at, 1, 10)) regardless of the runtime tz.
const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
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

/** Format a bare 'YYYY-MM-DD' UTC day as a weekday-prefixed Spanish date. */
export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day ?? "—";
  return dayFmt.format(d);
}

/** Time-of-day "HH:MM:SS" from an ISO-8601 timestamp, rendered in UTC. */
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
