import "server-only";
import { queryAll, queryFirst, scalar } from "../db";
import type { UserRow, DogRow, ReportRow, UserBanRow, UserEventRow } from "../types";

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

export type UserListItem = UserRow & {
  dogs_count: number;
  reports_against: number;
};

export type UserFilter = "all" | "banned";

export async function listUsers(opts: {
  q?: string;
  filter?: UserFilter;
  page: number;
  pageSize: number;
}): Promise<{ items: UserListItem[]; hasNext: boolean }> {
  const { q, filter = "all", page, pageSize } = opts;
  const where: string[] = [];
  const params: unknown[] = [];

  const term = q?.trim();
  if (term) {
    where.push("(u.email LIKE ? OR u.name LIKE ? OR u.id = ?)");
    params.push(`%${term}%`, `%${term}%`, term);
  }
  if (filter === "banned") {
    where.push(`u.banned_until > ${NOW}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await queryAll<UserListItem>(
    `SELECT u.*,
       (SELECT COUNT(*) FROM dogs d WHERE d.owner_id = u.id AND d.is_active = 1) AS dogs_count,
       (SELECT COUNT(*) FROM reports r JOIN dogs d2 ON d2.id = r.reported_dog_id WHERE d2.owner_id = u.id) AS reports_against
     FROM users u
     ${whereSql}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );

  return { items: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}

export type UserDetail = {
  user: UserRow;
  dogs: DogRow[];
  reportsAgainst: (ReportRow & { dog_name: string | null })[];
  banHistory: UserBanRow[];
  events: UserEventRow[];
  messageCount: number;
  conversationCount: number;
  reportsMade: number;
  blocksMade: number;
  blocksReceived: number;
};

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const user = await queryFirst<UserRow>("SELECT * FROM users WHERE id = ?", id);
  if (!user) return null;

  const [
    dogs,
    reportsAgainst,
    banHistory,
    events,
    messageCount,
    conversationCount,
    reportsMade,
    blocksMade,
    blocksReceived,
  ] = await Promise.all([
    queryAll<DogRow>("SELECT * FROM dogs WHERE owner_id = ? ORDER BY created_at DESC", id),
    queryAll<ReportRow & { dog_name: string | null }>(
      `SELECT r.*, d.name AS dog_name
       FROM reports r JOIN dogs d ON d.id = r.reported_dog_id
       WHERE d.owner_id = ? ORDER BY r.created_at DESC`,
      id,
    ),
    queryAll<UserBanRow>(
      "SELECT * FROM user_bans WHERE user_id = ? ORDER BY created_at DESC",
      id,
    ),
    queryAll<UserEventRow>(
      "SELECT * FROM user_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 25",
      id,
    ),
    scalar("SELECT COUNT(*) FROM messages WHERE sender_user_id = ?", id),
    scalar(
      `SELECT COUNT(DISTINCT c.id) FROM conversations c
       JOIN dogs d ON (d.id = c.dog_a_id OR d.id = c.dog_b_id)
       WHERE d.owner_id = ?`,
      id,
    ),
    scalar("SELECT COUNT(*) FROM reports WHERE reporter_user_id = ?", id),
    scalar("SELECT COUNT(*) FROM blocks WHERE blocker_user_id = ?", id),
    scalar("SELECT COUNT(*) FROM blocks WHERE blocked_user_id = ?", id),
  ]);

  return {
    user,
    dogs,
    reportsAgainst,
    banHistory,
    events,
    messageCount,
    conversationCount,
    reportsMade,
    blocksMade,
    blocksReceived,
  };
}
