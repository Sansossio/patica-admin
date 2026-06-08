"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { execute } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { PERMANENT_BAN_UNTIL } from "@/lib/ban";

const SET_NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

function isoNoMs(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Ban a user. Sets users.banned_until (the single enforcement column) and
 * appends a 'ban' row to user_bans (history). `duration`: "permanent" or a
 * number of days.
 */
export async function banUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const duration = String(formData.get("duration") ?? "permanent");
  if (!userId) throw new Error("missing_user_id");

  let appliedUntil: string; // users.banned_until
  let historyUntil: string | null; // user_bans.banned_until (null = permanent)

  if (duration === "permanent") {
    appliedUntil = PERMANENT_BAN_UNTIL;
    historyUntil = null;
  } else {
    const days = Number(duration);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
    appliedUntil = isoNoMs(new Date(Date.now() + safeDays * 86_400_000));
    historyUntil = appliedUntil;
  }

  await execute(
    `UPDATE users SET banned_until = ?, updated_at = ${SET_NOW} WHERE id = ?`,
    appliedUntil,
    userId,
  );
  await execute(
    `INSERT INTO user_bans (id, user_id, action, banned_until, reason, admin_email)
     VALUES (?, ?, 'ban', ?, ?, ?)`,
    crypto.randomUUID(),
    userId,
    historyUntil,
    reason,
    admin.email,
  );
  await writeAuditLog({
    adminEmail: admin.email,
    action: "user.ban",
    targetType: "user",
    targetId: userId,
    metadata: { reason, duration, banned_until: appliedUntil },
  });

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  // Ban controls are also rendered on report detail pages.
  revalidatePath("/reports", "layout");
}

export async function unbanUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) throw new Error("missing_user_id");

  await execute(`UPDATE users SET banned_until = NULL, updated_at = ${SET_NOW} WHERE id = ?`, userId);
  await execute(
    `INSERT INTO user_bans (id, user_id, action, banned_until, reason, admin_email)
     VALUES (?, ?, 'unban', NULL, NULL, ?)`,
    crypto.randomUUID(),
    userId,
    admin.email,
  );
  await writeAuditLog({
    adminEmail: admin.email,
    action: "user.unban",
    targetType: "user",
    targetId: userId,
  });

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  // Ban controls are also rendered on report detail pages.
  revalidatePath("/reports", "layout");
}
