"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { execute, queryFirst } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { countActiveSuperadmins } from "@/lib/queries/admins";
import type { AdminRole, AdminUserRow } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRole(value: unknown): AdminRole {
  return value === "superadmin" ? "superadmin" : "admin";
}

/** Result returned to the create-admin modal (drives inline errors + close). */
export type CreateAdminState = { ok: boolean; error?: string };

/**
 * Add an admin to the access allowlist (or update + reactivate an existing one
 * with the same email — keeps the unique-email index happy and makes "add"
 * idempotent). Superadmin only. Shaped for `useActionState`: returns a result
 * instead of throwing so the modal can show the error and close on success.
 */
export async function createAdmin(
  _prev: CreateAdminState,
  formData: FormData,
): Promise<CreateAdminState> {
  // Outside any try/catch: requireSuperAdmin may redirect() (a control-flow
  // throw that must propagate, not be swallowed into an error state).
  const acting = await requireSuperAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = parseRole(formData.get("role"));

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email inválido." };

  const existing = await queryFirst<{ id: string; role: AdminRole; is_active: number }>(
    "SELECT id, role, is_active FROM admin_users WHERE email = ? COLLATE NOCASE",
    email,
  );

  if (existing) {
    // The form upserts by email, so it can change roles too — block demoting the
    // last active superadmin to admin (would lock everyone out of admin mgmt).
    if (existing.role === "superadmin" && existing.is_active === 1 && role === "admin") {
      const supers = await countActiveSuperadmins();
      if (supers <= 1) {
        return { ok: false, error: "No puedes degradar al último superadmin activo." };
      }
    }
    await execute(
      "UPDATE admin_users SET role = ?, name = COALESCE(?, name), is_active = 1 WHERE id = ?",
      role,
      name,
      existing.id,
    );
  } else {
    await execute(
      "INSERT INTO admin_users (id, email, name, role, is_active) VALUES (?, ?, ?, ?, 1)",
      crypto.randomUUID(),
      email,
      name,
      role,
    );
  }

  await writeAuditLog({
    adminEmail: acting.email,
    action: "admin.create",
    targetType: "admin",
    targetId: email,
    metadata: { email, role, reactivated: Boolean(existing) },
  });

  revalidatePath("/admins");
  return { ok: true };
}

/**
 * Remove an admin from the allowlist (hard delete → access is revoked on the
 * next request). Superadmin only. Guards against self-removal and against
 * deleting the last active superadmin (which would lock everyone out of admin
 * management).
 */
export async function removeAdmin(formData: FormData): Promise<void> {
  const acting = await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("missing_id");

  const target = await queryFirst<AdminUserRow>("SELECT * FROM admin_users WHERE id = ?", id);
  if (!target) throw new Error("admin_not_found");

  if (target.email.toLowerCase() === acting.email.toLowerCase()) {
    throw new Error("cannot_remove_self");
  }

  if (target.role === "superadmin" && target.is_active === 1) {
    const supers = await countActiveSuperadmins();
    if (supers <= 1) throw new Error("cannot_remove_last_superadmin");
  }

  await execute("DELETE FROM admin_users WHERE id = ?", id);

  await writeAuditLog({
    adminEmail: acting.email,
    action: "admin.remove",
    targetType: "admin",
    targetId: target.email,
    metadata: { email: target.email, role: target.role },
  });

  revalidatePath("/admins");
}
