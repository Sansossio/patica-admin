import { Badge } from "./ui";
import { REPORT_STATUS_LABELS, REPORT_REASON_LABELS } from "@/lib/labels";
import { banInfo } from "@/lib/ban";
import { formatDate } from "@/lib/format";
import type { ReportStatus, ReportReason } from "@/lib/types";

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone = status === "pending" ? "warning" : status === "reviewed" ? "info" : "success";
  return <Badge tone={tone}>{REPORT_STATUS_LABELS[status]}</Badge>;
}

export function ReasonBadge({ reason }: { reason: ReportReason }) {
  const tone = reason === "child_safety" ? "danger" : "neutral";
  return <Badge tone={tone}>{REPORT_REASON_LABELS[reason]}</Badge>;
}

export function BanBadge({ bannedUntil }: { bannedUntil: string | null }) {
  const info = banInfo(bannedUntil);
  if (!info.banned) return null;
  return (
    <Badge tone="danger">
      {info.permanent ? "Baneado" : `Baneado · ${formatDate(info.until)}`}
    </Badge>
  );
}

export function DogActiveBadge({ active }: { active: boolean }) {
  return active ? <Badge tone="success">Activo</Badge> : <Badge tone="neutral">Inactivo</Badge>;
}
