import "server-only";
import { queryAll, scalar } from "../db";
import type { AdminUserRow } from "../types";

/**
 * Admin-panel accounts (the access allowlist), superadmins first. With `q`,
 * filters by email or id (case-insensitive substring; LIKE is ASCII-insensitive
 * in SQLite).
 */
export async function listAdminUsers(q?: string): Promise<AdminUserRow[]> {
  const term = q?.trim();
  const order = "ORDER BY (role = 'superadmin') DESC, is_active DESC, created_at ASC";
  if (term) {
    const like = `%${term}%`;
    return queryAll<AdminUserRow>(
      `SELECT id, email, name, role, is_active, last_login_at, created_at
       FROM admin_users
       WHERE email LIKE ? OR id LIKE ?
       ${order}`,
      like,
      like,
    );
  }
  return queryAll<AdminUserRow>(
    `SELECT id, email, name, role, is_active, last_login_at, created_at
     FROM admin_users
     ${order}`,
  );
}

/** Count of active superadmins — used to block removing the last one. */
export async function countActiveSuperadmins(): Promise<number> {
  return scalar(
    "SELECT COUNT(*) FROM admin_users WHERE role = 'superadmin' AND is_active = 1",
  );
}
