import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportDetail } from "@/lib/queries/reports";
import { Card, EmptyState, Badge } from "@/components/ui";
import { ReportStatusBadge, ReasonBadge, BanBadge, DogActiveBadge } from "@/components/badges";
import { ReportStatusControls } from "@/components/ReportStatusControls";
import { UserBanControls } from "@/components/UserBanControls";
import { DogActiveToggle } from "@/components/DogActiveToggle";
import { IconChevronLeft } from "@/components/icons";
import { REPORT_REASON_LABELS } from "@/lib/labels";
import { formatDateTime, formatDate } from "@/lib/format";
import { banInfo } from "@/lib/ban";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getReportDetail(id);
  if (!detail) notFound();

  const { report, dog, owner, reporter, otherReports } = detail;
  const ownerBan = banInfo(owner?.banned_until ?? null);

  return (
    <>
      <Link
        href="/reports"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-text"
      >
        <IconChevronLeft className="h-4 w-4" /> Reportes
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ReasonBadge reason={report.reason} />
                <ReportStatusBadge status={report.status} />
              </div>
              <span className="text-xs text-subtle">{formatDateTime(report.created_at)}</span>
            </div>
            <h1 className="text-lg font-bold">{REPORT_REASON_LABELS[report.reason]}</h1>
            {report.details && <p className="mt-2 text-sm text-muted">{report.details}</p>}

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
                Acciones
              </p>
              <ReportStatusControls reportId={report.id} status={report.status} />
            </div>
          </Card>

          {/* Reported dog */}
          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
              Perro reportado
            </p>
            {!dog ? (
              <EmptyState title="El perro ya no existe" />
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{dog.name ?? "Sin nombre"}</h2>
                    <DogActiveBadge active={dog.is_active === 1} />
                  </div>
                  <DogActiveToggle dogId={dog.id} active={dog.is_active === 1} />
                </div>
                {dog.gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {dog.gallery.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={dog.name ?? ""}
                        className="aspect-square w-full rounded-(--radius-button) bg-surface-2 object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-subtle">Sin fotos</p>
                )}
                {dog.description && <p className="mt-3 text-sm text-muted">{dog.description}</p>}
              </>
            )}
          </Card>

          {/* Other reports on same dog */}
          {otherReports.length > 0 && (
            <Card className="p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                Otros reportes sobre este perro ({otherReports.length})
              </p>
              <div className="space-y-2">
                {otherReports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reports/${r.id}`}
                    className="flex items-center gap-2 rounded-(--radius-button) border border-border px-3 py-2 text-sm transition hover:border-primary/50"
                  >
                    <ReasonBadge reason={r.reason} />
                    <ReportStatusBadge status={r.status} />
                    <span className="ml-auto text-xs text-subtle">{formatDate(r.created_at)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: owner + reporter */}
        <div className="space-y-4">
          <Card className="p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">Dueño</p>
            {owner ? (
              <>
                <div className="flex items-center gap-2">
                  <Link href={`/users/${owner.id}`} className="font-medium hover:text-primary">
                    {owner.name ?? "Sin nombre"}
                  </Link>
                  <BanBadge bannedUntil={owner.banned_until} />
                </div>
                <p className="mt-0.5 text-sm text-muted">{owner.email}</p>
                <div className="mt-4">
                  <UserBanControls userId={owner.id} banned={ownerBan.banned} />
                </div>
              </>
            ) : (
              <p className="text-sm text-subtle">Desconocido</p>
            )}
          </Card>

          <Card className="p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
              Reportado por
            </p>
            {reporter ? (
              <Link href={`/users/${reporter.id}`} className="block">
                <p className="font-medium hover:text-primary">{reporter.name ?? "Sin nombre"}</p>
                <p className="text-sm text-muted">{reporter.email}</p>
              </Link>
            ) : (
              <p className="text-sm text-subtle">Desconocido</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
