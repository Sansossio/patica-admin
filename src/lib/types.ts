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
  created_at: string;
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
