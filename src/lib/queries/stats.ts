import "server-only";
import { scalar, queryAll, queryFirst } from "../db";
import { env } from "../cf";
import { cdnUrl } from "../cdn";
import type { StatsRow } from "../types";

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

export type Overview = {
  users: number;
  dogs: number;
  dogsActive: number;
  conversations: number;
  messages: number;
  reportsPending: number;
  reportsTotal: number;
  blocks: number;
  dogLikes: number;
  bannedUsers: number;
};

/** Live aggregations straight off D1 (authoritative; the `stats` counters can drift). */
export async function getOverview(): Promise<Overview> {
  const [
    users,
    dogs,
    dogsActive,
    conversations,
    messages,
    reportsPending,
    reportsTotal,
    blocks,
    dogLikes,
    bannedUsers,
  ] = await Promise.all([
    scalar("SELECT COUNT(*) FROM users"),
    scalar("SELECT COUNT(*) FROM dogs"),
    scalar("SELECT COUNT(*) FROM dogs WHERE is_active = 1"),
    scalar("SELECT COUNT(*) FROM conversations"),
    scalar("SELECT COUNT(*) FROM messages"),
    scalar("SELECT COUNT(*) FROM reports WHERE status = 'pending'"),
    scalar("SELECT COUNT(*) FROM reports"),
    scalar("SELECT COUNT(*) FROM blocks"),
    scalar("SELECT COUNT(*) FROM dog_likes"),
    scalar(`SELECT COUNT(*) FROM users WHERE banned_until > ${NOW}`),
  ]);
  return {
    users,
    dogs,
    dogsActive,
    conversations,
    messages,
    reportsPending,
    reportsTotal,
    blocks,
    dogLikes,
    bannedUsers,
  };
}

export async function countSince(
  table: "users" | "dogs" | "messages" | "conversations",
  days: number,
): Promise<number> {
  return scalar(
    `SELECT COUNT(*) FROM ${table} WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%SZ','now', ?)`,
    `-${days} days`,
  );
}

export type DayCount = { day: string; count: number };

export async function seriesPerDay(
  table: "users" | "dogs" | "messages" | "conversations" | "dog_likes",
  days: number,
): Promise<DayCount[]> {
  return queryAll<DayCount>(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
     FROM ${table}
     WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%SZ','now', ?)
     GROUP BY day ORDER BY day ASC`,
    `-${days} days`,
  );
}

/**
 * Daily active users for the trailing window. Reads the frozen snapshots the
 * api cron writes to `daily_metrics` (metric = 'active_users'), then overrides
 * today with a live count (the cron only finalizes past days, so today's bar
 * would otherwise lag a day). The live override is best-effort: `user_events`
 * may be absent from the panel's local D1, so a failure just leaves the stored
 * value. Returns a sparse series — densify with `fillSeries`.
 */
export async function getDailyActiveUsers(days: number): Promise<DayCount[]> {
  let rows: DayCount[];
  try {
    rows = await queryAll<DayCount>(
      `SELECT day, value AS count
       FROM daily_metrics
       WHERE metric = 'active_users'
         AND day >= substr(strftime('%Y-%m-%dT%H:%M:%SZ','now', ?), 1, 10)
       ORDER BY day ASC`,
      `-${days} days`,
    );
  } catch (err) {
    console.error("admin.dau.read_failed", err);
    return [];
  }

  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const todayKey = new Date().toISOString().slice(0, 10);
  try {
    const liveToday = await scalar(
      `SELECT COUNT(DISTINCT user_id) FROM user_events WHERE created_at >= ?`,
      `${todayKey}T00:00:00Z`,
    );
    byDay.set(todayKey, liveToday);
  } catch {
    // user_events may not exist locally — keep whatever the snapshot had.
  }

  return [...byDay.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

/** Densify a sparse day series into a contiguous trailing window (zero-filled). */
export function fillSeries(rows: DayCount[], days: number): DayCount[] {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  const out: DayCount[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, count: map.get(key) ?? 0 });
  }
  return out;
}

export async function getStatsRow(): Promise<StatsRow | null> {
  return queryFirst<StatsRow>("SELECT * FROM stats WHERE id = 'global'");
}

/**
 * Count currently-online users. The API writes a KV key `patica:online:{userId}`
 * with a 90s TTL on each chat WebSocket heartbeat (KV_PATICA_USERS namespace),
 * so the live key count is the online user count. Returns 0 if KV is
 * unavailable (e.g. local dev without the remote binding).
 */
export async function getOnlineCount(): Promise<number> {
  try {
    const kv = env().KV_PATICA_USERS;
    if (!kv) return 0;
    let count = 0;
    let cursor: string | undefined;
    do {
      const res = await kv.list({ prefix: "patica:online:", cursor, limit: 1000 });
      count += res.keys.length;
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
    return count;
  } catch (err) {
    console.error("admin.online_count.failed", err);
    return 0;
  }
}

export type TopDog = {
  id: string;
  name: string | null;
  owner_name: string | null;
  image_key: string;
  like_count: number;
};

export async function getTopLikedDogs(limit = 5): Promise<(TopDog & { image_url: string | null })[]> {
  const rows = await queryAll<TopDog>(
    `SELECT d.id, d.name, u.name AS owner_name, d.image_url AS image_key,
            COUNT(dl.user_id) AS like_count
     FROM dogs d
     JOIN users u ON u.id = d.owner_id
     LEFT JOIN dog_likes dl ON dl.dog_id = d.id
     WHERE d.is_active = 1
     GROUP BY d.id
     HAVING like_count > 0
     ORDER BY like_count DESC, d.created_at DESC
     LIMIT ?`,
    limit,
  );
  return rows.map((r) => ({ ...r, image_url: cdnUrl(r.image_key) }));
}
