import "server-only";
import { queryAll } from "../db";
import type {
  ActivityDay,
  ActivityTimelineEvent,
  ActivityUserDay,
  ActivityWindow,
  SharedDeviceAccount,
  SharedDeviceRow,
  UserEventTypeCount,
} from "../types";

// ── Caracas timezone offset (single source of truth) ─────────────────────────
// Venezuela is fixed at UTC-4 (America/Caracas) with NO daylight saving, so a
// constant SQLite datetime modifier is exact year-round. Day segmentation is
// done in Caracas-local time, not UTC: a row's calendar day is whatever day it
// was in Caracas when it happened.
const CARACAS_MODIFIER = "-4 hours";

// ── Day-derivation expression (single source of truth) ───────────────────────
// Activity is bucketed by **Caracas-local** calendar day using
// substr(datetime(created_at, '-4 hours'), 1, 10) over the ISO-8601
// 'YYYY-MM-DDT...Z' timestamps: datetime() shifts the stored UTC instant back 4
// hours, then substr() takes the leading 'YYYY-MM-DD'. The resulting day STRING
// is already in Caracas wall-clock terms (consumers must NOT shift it again).
//
// NOTE: this no longer matches the api/ daily-metrics cron (which still buckets
// by UTC). The Activity "active users" numbers are therefore expected to differ
// slightly from daily_metrics at the day boundary; that is intentional. If the
// cron is later switched to Caracas time, keep it aligned with CARACAS_MODIFIER.
const DAY_EXPR = `substr(datetime(created_at, '${CARACAS_MODIFIER}'), 1, 10)`;

// One paginated window is WINDOW_DAYS Caracas-local calendar days wide.
export const WINDOW_DAYS = 7;

// Defensive cap on the raw events pulled for a whole window (used to build the
// level-3 timelines client-side). If a window ever exceeds this, the payload is
// flagged `truncated` so the UI can warn that some timelines are incomplete.
const MAX_WINDOW_EVENTS = 5000;

// ── Anti-fraud per-device dedup (centralized CTE) ─────────────────────────────
// A device_id is OWNED by the user with the EARLIEST activity on that device
// (global, all-time; tie-break by user_id). Events are only counted when they
// either carry no device_id (legacy / some chat events) or belong to that
// device's owner. This makes "usuarios activos" count distinct REAL devices: a
// phone used to sign into several accounts counts only the first account; the
// secondary accounts' events on that shared device are hidden.
//
// Ownership is computed GLOBALLY (all-time, not per-window) so pagination can
// never flip it. We restrict to platform='server' rows everywhere — including
// this ownership computation — because the app client also posts some of the
// same event names with platform ios/android; counting server rows only gives
// accurate, build-independent numbers (the server log fires for ALL builds).
//
// This SQL fragment is shared by the level1/level2/level3 windowed queries so
// the three drilldown levels always agree on who owns each device.
const DEVICE_OWNER_CTE = `device_owner AS (
  SELECT device_id, user_id FROM (
    SELECT device_id,
           user_id,
           ROW_NUMBER() OVER (
             PARTITION BY device_id
             ORDER BY MIN(created_at) ASC, user_id ASC
           ) AS rn
    FROM user_events
    WHERE platform = 'server' AND device_id IS NOT NULL
    GROUP BY device_id, user_id
  )
  WHERE rn = 1
)`;

// WHERE predicate (applied to a `user_events` row aliased as `e`) keeping only
// server-side events that survive the per-device dedup: NULL device_id rows are
// always kept; rows with a device_id are kept only for that device's owner.
const DEDUP_PREDICATE = `e.platform = 'server'
  AND (
    e.device_id IS NULL
    OR e.user_id = (SELECT o.user_id FROM device_owner o WHERE o.device_id = e.device_id)
  )`;

// Caracas offset in milliseconds (UTC-4, fixed). Used only to derive the current
// Caracas calendar day from the absolute "now" instant.
const CARACAS_OFFSET_MS = 4 * 60 * 60 * 1000;

/**
 * Caracas-local "today" as a bare 'YYYY-MM-DD' string. We subtract the fixed -4h
 * offset from the current instant and read the UTC date of the shifted instant,
 * which equals the Caracas wall-clock date. This mirrors the SQL DAY_EXPR
 * (datetime(created_at, '-4 hours')) so the JS window boundaries and the SQL
 * day buckets agree on what "today" is.
 */
function caracasToday(): string {
  return new Date(Date.now() - CARACAS_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Shift a bare 'YYYY-MM-DD' day by `days` (negative = earlier). This is pure
 * calendar arithmetic on the date string and is timezone-independent — adding N
 * days to 'YYYY-MM-DD' gives the same result whether the day is read as UTC or
 * Caracas — so it is reused unchanged for the Caracas-local boundaries.
 */
function shiftDay(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute the [start, end] inclusive Caracas-local day boundaries for a window
 * page. page 0 = the most recent WINDOW_DAYS days (Caracas "today" + the 6 prior
 * Caracas days); page N = the WINDOW_DAYS days immediately before window N-1.
 * The bounds are matched against DAY_EXPR (also Caracas-local) in SQL.
 */
function windowBounds(page: number): { start: string; end: string } {
  const today = caracasToday();
  const end = shiftDay(today, -page * WINDOW_DAYS);
  const start = shiftDay(end, -(WINDOW_DAYS - 1));
  return { start, end };
}

type DayAggRow = {
  day: string;
  active_users: number;
  total_activities: number;
};

type UserDayAggRow = {
  day: string;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  total_activities: number;
  first_at: string;
  last_at: string;
};

type UserDayBreakdownRow = {
  day: string;
  user_id: string;
  event: string;
  count: number;
};

type WindowEventRow = {
  day: string;
  user_id: string;
  id: string;
  event: string;
  platform: string | null;
  app_version: string | null;
  metadata: string;
  created_at: string;
};

/**
 * Load one paginated activity window with EVERYTHING the three drilldown levels
 * need, preloaded, so the client modals open instantly:
 *   - level 1: one row per Caracas-local day (active users + total activities),
 *   - level 2: the active users per day with byType breakdown + first/last,
 *   - level 3: each (day, user) chronological event timeline.
 *
 * All counts are post-dedup and server-platform only. user_events is owned by
 * the api repo; tolerate it not existing yet (return an empty window).
 */
export async function loadActivityWindow(page: number): Promise<ActivityWindow> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 0;
  const { start, end } = windowBounds(safePage);
  const empty: ActivityWindow = {
    page: safePage,
    windowDays: WINDOW_DAYS,
    start,
    end,
    days: [],
    hasOlder: false,
    sharedDevices: [],
    truncated: false,
  };

  try {
    // The window filter: bucket day BETWEEN start AND end (inclusive, Caracas).
    const dayFilter = `${DAY_EXPR.replace(/created_at/g, "e.created_at")} BETWEEN ? AND ?`;

    const [dayAgg, userDayAgg, breakdown, events, older] = await Promise.all([
      // Level 1 — per-day aggregates.
      queryAll<DayAggRow>(
        `WITH ${DEVICE_OWNER_CTE}
         SELECT ${DAY_EXPR.replace(/created_at/g, "e.created_at")} AS day,
           COUNT(DISTINCT e.user_id) AS active_users,
           COUNT(*) AS total_activities
         FROM user_events e
         WHERE ${dayFilter} AND ${DEDUP_PREDICATE}
         GROUP BY day
         ORDER BY day DESC`,
        start,
        end,
      ),
      // Level 2 — per-(day, user) aggregates with first/last + identity.
      queryAll<UserDayAggRow>(
        `WITH ${DEVICE_OWNER_CTE}
         SELECT ${DAY_EXPR.replace(/created_at/g, "e.created_at")} AS day,
           e.user_id AS user_id,
           u.email AS user_email,
           u.name AS user_name,
           COUNT(*) AS total_activities,
           MIN(e.created_at) AS first_at,
           MAX(e.created_at) AS last_at
         FROM user_events e
         LEFT JOIN users u ON u.id = e.user_id
         WHERE ${dayFilter} AND ${DEDUP_PREDICATE}
         GROUP BY day, e.user_id, u.email, u.name
         ORDER BY day DESC, total_activities DESC, last_at DESC`,
        start,
        end,
      ),
      // Level 2 — per-(day, user, event) breakdown for the byType chips.
      queryAll<UserDayBreakdownRow>(
        `WITH ${DEVICE_OWNER_CTE}
         SELECT ${DAY_EXPR.replace(/created_at/g, "e.created_at")} AS day,
           e.user_id AS user_id,
           e.event AS event,
           COUNT(*) AS count
         FROM user_events e
         WHERE ${dayFilter} AND ${DEDUP_PREDICATE}
         GROUP BY day, e.user_id, e.event`,
        start,
        end,
      ),
      // Level 3 — windowed raw events (bounded) to assemble timelines client-side.
      queryAll<WindowEventRow>(
        `WITH ${DEVICE_OWNER_CTE}
         SELECT ${DAY_EXPR.replace(/created_at/g, "e.created_at")} AS day,
           e.user_id AS user_id,
           e.id AS id,
           e.event AS event,
           e.platform AS platform,
           e.app_version AS app_version,
           e.metadata AS metadata,
           e.created_at AS created_at
         FROM user_events e
         WHERE ${dayFilter} AND ${DEDUP_PREDICATE}
         ORDER BY day DESC, e.user_id ASC, e.created_at ASC
         LIMIT ?`,
        start,
        end,
        MAX_WINDOW_EVENTS,
      ),
      // Does any older (pre-window) server event survive dedup? Drives "Semana
      // anterior" enabled/disabled without loading the older window.
      queryAll<{ has_older: number }>(
        `WITH ${DEVICE_OWNER_CTE}
         SELECT EXISTS(
           SELECT 1 FROM user_events e
           WHERE ${DAY_EXPR.replace(/created_at/g, "e.created_at")} < ?
             AND ${DEDUP_PREDICATE}
         ) AS has_older`,
        start,
      ),
    ]);

    // Merge per-(day, user, event) counts into byType maps keyed by `day|user`.
    const byTypeKey = (day: string, userId: string) => `${day}|${userId}`;
    const byTypeMap = new Map<string, UserEventTypeCount[]>();
    for (const row of breakdown) {
      const key = byTypeKey(row.day, row.user_id);
      const list = byTypeMap.get(key) ?? [];
      list.push({ event: row.event, count: row.count });
      byTypeMap.set(key, list);
    }
    for (const list of byTypeMap.values()) list.sort((a, b) => b.count - a.count);

    // Group raw events into per-(day, user) timelines (already time-ordered).
    const eventsMap = new Map<string, ActivityTimelineEvent[]>();
    for (const row of events) {
      const key = byTypeKey(row.day, row.user_id);
      const list = eventsMap.get(key) ?? [];
      list.push({
        id: row.id,
        event: row.event,
        platform: row.platform,
        app_version: row.app_version,
        metadata: row.metadata,
        created_at: row.created_at,
      });
      eventsMap.set(key, list);
    }

    // Build level-2 users grouped by day.
    const usersByDay = new Map<string, ActivityUserDay[]>();
    for (const u of userDayAgg) {
      const key = byTypeKey(u.day, u.user_id);
      const list = usersByDay.get(u.day) ?? [];
      list.push({
        user_id: u.user_id,
        user_email: u.user_email,
        user_name: u.user_name,
        total_activities: u.total_activities,
        first_at: u.first_at,
        last_at: u.last_at,
        byType: byTypeMap.get(key) ?? [],
        events: eventsMap.get(key) ?? [],
      });
      usersByDay.set(u.day, list);
    }

    // Assemble level-1 days (descending) with their expanded users.
    const days: ActivityDay[] = dayAgg.map((d) => ({
      day: d.day,
      active_users: d.active_users,
      total_activities: d.total_activities,
      users: usersByDay.get(d.day) ?? [],
    }));

    return {
      ...empty,
      days,
      hasOlder: (older[0]?.has_older ?? 0) === 1,
      sharedDevices: await listSharedDevices(),
      truncated: events.length >= MAX_WINDOW_EVENTS,
    };
  } catch (err) {
    console.error("admin.activity.window_failed", err);
    return empty;
  }
}

/**
 * Shared devices (transparency): device_ids used by more than one user (over
 * server-platform events, all-time). Returns the owner account first, then the
 * secondary account(s) whose events are filtered out of the Activity view.
 */
export async function listSharedDevices(): Promise<SharedDeviceRow[]> {
  try {
    const rows = await queryAll<{
      device_id: string;
      user_id: string;
      user_email: string | null;
      user_name: string | null;
      first_at: string;
    }>(
      // Per (device, user): first server-event timestamp. We only keep devices
      // used by >1 distinct user. Ownership = earliest first_at (tie-break by
      // user_id) — identical rule to DEVICE_OWNER_CTE.
      `WITH per_device_user AS (
         SELECT device_id, user_id, MIN(created_at) AS first_at
         FROM user_events
         WHERE platform = 'server' AND device_id IS NOT NULL
         GROUP BY device_id, user_id
       ),
       shared AS (
         SELECT device_id FROM per_device_user
         GROUP BY device_id
         HAVING COUNT(DISTINCT user_id) > 1
       )
       SELECT p.device_id AS device_id,
         p.user_id AS user_id,
         u.email AS user_email,
         u.name AS user_name,
         p.first_at AS first_at
       FROM per_device_user p
       JOIN shared s ON s.device_id = p.device_id
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.device_id ASC, p.first_at ASC, p.user_id ASC`,
    );

    const byDevice = new Map<string, SharedDeviceAccount[]>();
    for (const r of rows) {
      const list = byDevice.get(r.device_id) ?? [];
      list.push({
        user_id: r.user_id,
        user_email: r.user_email,
        user_name: r.user_name,
        // Rows are ordered by first_at then user_id, so the first per device is
        // the owner.
        is_owner: list.length === 0,
      });
      byDevice.set(r.device_id, list);
    }

    return Array.from(byDevice.entries()).map(([device_id, accounts]) => ({
      device_id,
      accounts,
    }));
  } catch (err) {
    console.error("admin.activity.shared_devices_failed", err);
    return [];
  }
}
