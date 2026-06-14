// DB row shapes (subset) mirrored from the API's D1 schema. The admin panel
// reads/writes patica-db directly, so these must stay in sync with the api repo
// (api/src/types.ts + api/schema-final.sql). All ids are bare UUIDv4 (no
// prefixes); booleans are 0/1; timestamps are ISO-8601 TEXT.

export type AdminRole = "admin" | "superadmin";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  is_active: number;
  last_login_at: string | null;
  created_at: string;
};

export type ProfilePhotoStatus = "approved" | "pending_manual_review" | "rejected";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  photo_url: string | null;
  profile_photo_url: string | null;
  profile_photo_status: ProfilePhotoStatus;
  blocked_until: string | null;
  latitude: number | null;
  longitude: number | null;
  notifications_enabled: number;
  show_last_seen: number;
  app_version: string | null;
  // Account ban: banned while banned_until is in the future (permanent = the
  // far-future sentinel). Detail/history lives in `user_bans`.
  banned_until: string | null;
  created_at: string;
  updated_at: string;
};

export type UserBanAction = "ban" | "unban";

export type UserBanRow = {
  id: string;
  user_id: string;
  action: UserBanAction;
  banned_until: string | null;
  reason: string | null;
  admin_email: string;
  created_at: string;
};

export type DogRow = {
  id: string;
  owner_id: string;
  name: string | null;
  sex: "male" | "female" | null;
  description: string | null;
  age_years: number | null;
  size: "small" | "medium" | "large" | null;
  neutered: "yes" | "no" | "prefer_not_to_say" | null;
  image_url: string;
  image_urls: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type ReportReason =
  | "inappropriate_photos"
  | "harassment"
  | "child_safety"
  | "spam"
  | "fake_profile"
  | "scam"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved";

export type ReportRow = {
  id: string;
  reporter_user_id: string;
  reported_dog_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  dog_a_id: string;
  dog_b_id: string;
  last_message_at: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_dog_id: string;
  sender_user_id: string;
  reply_to_message_id: string | null;
  text: string;
  read_at: string | null;
  created_at: string;
};

export type BlockRow = {
  id: string;
  blocker_user_id: string;
  blocked_user_id: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  metadata: string;
  created_at: string;
};

export type UserEventRow = {
  id: string;
  user_id: string;
  event: string;
  platform: string | null;
  app_version: string | null;
  metadata: string;
  // Captured from the X-Device-Id header for new server-side events; NULL for
  // older rows and some chat events. Used for the per-device anti-fraud dedup.
  device_id: string | null;
  created_at: string;
};

// ── Activity (live aggregation over user_events) ─────────────────────────────
// These are query view shapes (not physical tables). The "day" is a UTC calendar
// day 'YYYY-MM-DD' derived with substr(created_at, 1, 10) — see
// src/lib/queries/activity.ts for the single source of truth on day derivation.

// Level 1: one row per day with activity.
export type DayActivityRow = {
  day: string; // 'YYYY-MM-DD' (UTC)
  active_users: number; // COUNT(DISTINCT user_id)
  total_activities: number; // COUNT(*)
};

// A single (event type → count) entry within a user's day.
export type UserEventTypeCount = {
  event: string;
  count: number;
};

// Level 2: a user active on a given day, with their per-event-type breakdown.
export type UserDayActivityRow = {
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  total_activities: number;
  first_at: string; // ISO-8601 (UTC) — first activity of the day
  last_at: string; // ISO-8601 (UTC) — last activity of the day
  byType: UserEventTypeCount[];
};

// ── Preloaded activity window (passed to the client ActivityExplorer) ─────────
// The /activity page loads one WINDOW_DAYS-wide UTC window and ships ALL three
// drilldown levels at once so the modals open with no extra round-trip.

// A single timeline entry (level 3) within a (day, user) bucket.
export type ActivityTimelineEvent = {
  id: string;
  event: string;
  platform: string | null;
  app_version: string | null;
  // Device that produced the event (X-Device-Id header); NULL for legacy /
  // some chat events. Surfaced in the timeline column for anti-fraud review.
  device_id: string | null;
  // Request origin captured server-side (NULL for legacy events): client IP and
  // 2-letter ISO country code. Surfaced in the timeline for anti-fraud review.
  ip: string | null;
  country: string | null;
  metadata: string;
  created_at: string; // ISO-8601 (UTC)
};

// A user active on a given day, plus their full per-day timeline (level 2 + 3).
export type ActivityUserDay = UserDayActivityRow & {
  events: ActivityTimelineEvent[];
};

// A single UTC day with its active users fully expanded (level 1 + 2 + 3).
export type ActivityDay = DayActivityRow & {
  users: ActivityUserDay[];
};

// One shared device: the owner account plus the secondary account(s) whose
// events on that shared device are hidden from the Activity view.
export type SharedDeviceAccount = {
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  is_owner: boolean;
};

export type SharedDeviceRow = {
  device_id: string;
  accounts: SharedDeviceAccount[];
};

// The full preloaded payload for one paginated window.
export type ActivityWindow = {
  page: number; // 0 = most recent WINDOW_DAYS
  windowDays: number; // WINDOW_DAYS (7)
  start: string; // 'YYYY-MM-DD' (UTC) — oldest day in the window
  end: string; // 'YYYY-MM-DD' (UTC) — newest day in the window (most recent)
  days: ActivityDay[]; // descending by day
  hasOlder: boolean; // true when older windows still have events
  sharedDevices: SharedDeviceRow[]; // accounts omitted by per-device dedup
  truncated: boolean; // true if the events query hit its defensive LIMIT
};

export type AdminAuditLogRow = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: string;
  created_at: string;
};

export type StatsRow = {
  id: string;
  total_users: number;
  total_dogs: number;
  total_conversations: number;
  total_messages: number;
  total_messages_read: number;
  total_discover_scrolls: number;
  total_dog_profile_views: number;
  total_blocks: number;
  total_reports: number;
  total_dog_likes: number;
  updated_at: string;
};

// Pre-aggregated daily metric snapshots. Written by the api/ cron
// (services/daily-metrics.ts); the panel only reads them. api/ owns this table.
export type DailyMetricRow = {
  day: string; // 'YYYY-MM-DD' (UTC)
  metric: string; // e.g. 'active_users'
  value: number;
  updated_at: string;
};
