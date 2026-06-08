import "server-only";
import { queryFirst, execute } from "../db";
import type { AdminUserRow } from "../types";

/** Look up an active admin by email (case-insensitive). */
export async function findActiveAdmin(email: string): Promise<AdminUserRow | null> {
  return queryFirst<AdminUserRow>(
    "SELECT * FROM admin_users WHERE email = ? COLLATE NOCASE AND is_active = 1",
    email,
  );
}

export async function touchAdminLogin(email: string): Promise<void> {
  await execute(
    "UPDATE admin_users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE email = ? COLLATE NOCASE",
    email,
  );
}
