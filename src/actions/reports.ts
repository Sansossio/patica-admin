"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { execute } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import type { ReportStatus } from "@/lib/types";
import type { AuditAction } from "@/lib/audit";

const STATUS_ACTION: Record<ReportStatus, AuditAction> = {
  pending: "report.reopen",
  reviewed: "report.review",
  resolved: "report.resolve",
};

export async function setReportStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "") as ReportStatus;
  if (!reportId) throw new Error("missing_report_id");
  if (!["pending", "reviewed", "resolved"].includes(status)) throw new Error("bad_status");

  await execute("UPDATE reports SET status = ? WHERE id = ?", status, reportId);
  await writeAuditLog({
    adminEmail: admin.email,
    action: STATUS_ACTION[status],
    targetType: "report",
    targetId: reportId,
    metadata: { status },
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}
