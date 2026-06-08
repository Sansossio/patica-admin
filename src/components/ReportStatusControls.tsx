import { setReportStatus } from "@/actions/reports";
import { SubmitButton } from "./SubmitButton";
import type { ReportStatus } from "@/lib/types";

function Action({
  reportId,
  status,
  variant,
  label,
}: {
  reportId: string;
  status: ReportStatus;
  variant: "primary" | "success" | "ghost";
  label: string;
}) {
  return (
    <form action={setReportStatus}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant}>{label}</SubmitButton>
    </form>
  );
}

export function ReportStatusControls({
  reportId,
  status,
}: {
  reportId: string;
  status: ReportStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "reviewed" && status !== "resolved" && (
        <Action reportId={reportId} status="reviewed" variant="primary" label="Marcar revisado" />
      )}
      {status !== "resolved" && (
        <Action reportId={reportId} status="resolved" variant="success" label="Resolver" />
      )}
      {status !== "pending" && (
        <Action reportId={reportId} status="pending" variant="ghost" label="Reabrir" />
      )}
    </div>
  );
}
