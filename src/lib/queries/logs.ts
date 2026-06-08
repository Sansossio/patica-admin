import "server-only";
import { queryAll } from "../db";
import type { AdminAuditLogRow, AuditLogRow, UserEventRow } from "../types";

export async function listAdminAudit(opts: {
  page: number;
  pageSize: number;
  action?: string;
}): Promise<{ items: AdminAuditLogRow[]; hasNext: boolean }> {
  const { page, pageSize, action } = opts;
  const where: string[] = [];
  const params: unknown[] = [];
  if (action && action !== "all") {
    where.push("action = ?");
    params.push(action);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;

  const rows = await queryAll<AdminAuditLogRow>(
    `SELECT * FROM admin_audit_log ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );
  return { items: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}

export async function distinctAdminActions(): Promise<string[]> {
  const rows = await queryAll<{ action: string }>(
    "SELECT DISTINCT action FROM admin_audit_log ORDER BY action ASC",
  );
  return rows.map((r) => r.action);
}

export type UserEventView = UserEventRow & {
  user_email: string | null;
  user_name: string | null;
};

export async function listUserEvents(opts: {
  page: number;
  pageSize: number;
  event?: string;
}): Promise<{ items: UserEventView[]; hasNext: boolean }> {
  const { page, pageSize, event } = opts;
  const where: string[] = [];
  const params: unknown[] = [];
  if (event && event !== "all") {
    where.push("e.event = ?");
    params.push(event);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;
  const rows = await queryAll<UserEventView>(
    `SELECT e.*, u.email AS user_email, u.name AS user_name
     FROM user_events e
     LEFT JOIN users u ON u.id = e.user_id
     ${whereSql}
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    ...params,
    pageSize + 1,
    offset,
  );
  return { items: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}

export async function distinctUserEvents(): Promise<string[]> {
  const rows = await queryAll<{ event: string }>(
    "SELECT event, COUNT(*) AS c FROM user_events GROUP BY event ORDER BY c DESC LIMIT 40",
  );
  return rows.map((r) => r.event);
}

export type AppAuditView = AuditLogRow & {
  user_email: string | null;
  user_name: string | null;
};

export async function listAppAudit(opts: {
  page: number;
  pageSize: number;
}): Promise<{ items: AppAuditView[]; hasNext: boolean }> {
  const { page, pageSize } = opts;
  const offset = (page - 1) * pageSize;
  const rows = await queryAll<AppAuditView>(
    `SELECT a.*, u.email AS user_email, u.name AS user_name
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    pageSize + 1,
    offset,
  );
  return { items: rows.slice(0, pageSize), hasNext: rows.length > pageSize };
}
