import "server-only";
import { execute } from "./db";

export type AuditAction =
  | "auth.login"
  | "user.ban"
  | "user.unban"
  | "report.review"
  | "report.resolve"
  | "report.reopen"
  | "dog.deactivate"
  | "dog.activate"
  | "admin.create"
  | "admin.remove";

/** Append a privileged action to admin_audit_log. Never throws into callers. */
export async function writeAuditLog(entry: {
  adminEmail: string;
  action: AuditAction;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await execute(
      `INSERT INTO admin_audit_log (id, admin_email, action, target_type, target_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      entry.adminEmail,
      entry.action,
      entry.targetType ?? null,
      entry.targetId ?? null,
      JSON.stringify(entry.metadata ?? {}),
    );
  } catch (err) {
    console.error("admin.audit_log.write_failed", err);
  }
}
