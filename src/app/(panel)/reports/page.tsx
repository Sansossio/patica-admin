import Link from "next/link";
import { listReports, countReportsByStatus } from "@/lib/queries/reports";
import {
  PageHeader,
  Card,
  Table,
  THead,
  Th,
  Tr,
  Td,
  Avatar,
  Pagination,
  EmptyState,
  cn,
} from "@/components/ui";
import { ReportStatusBadge, ReasonBadge, BanBadge } from "@/components/badges";
import { formatDate, formatNumber } from "@/lib/format";
import { IconFlag } from "@/components/icons";
import type { ReportStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

const TABS: { key: ReportStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "reviewed", label: "Revisados" },
  { key: "resolved", label: "Resueltos" },
  { key: "all", label: "Todos" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = (["pending", "reviewed", "resolved", "all"].includes(sp.status ?? "")
    ? sp.status
    : "pending") as ReportStatus | "all";

  const [{ items, hasNext }, counts] = await Promise.all([
    listReports({ status, page, pageSize: PAGE_SIZE }),
    countReportsByStatus(),
  ]);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (status !== "pending") params.set("status", status);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/reports${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Reportes" subtitle="Revisión de denuncias de perfiles" />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "pending" ? "/reports" : `/reports?status=${t.key}`}
            prefetch
            className={cn(
              "rounded-(--radius-button) border px-3 py-1.5 text-sm transition",
              status === t.key
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border text-muted hover:text-text",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-subtle">{formatNumber(counts[t.key])}</span>
          </Link>
        ))}
      </div>

      <Card>
        {items.length === 0 ? (
          <EmptyState icon={<IconFlag className="h-8 w-8" />} title="Sin reportes" />
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Perro reportado</Th>
                <Th>Dueño</Th>
                <Th>Motivo</Th>
                <Th>Fecha</Th>
                <Th>Estado</Th>
              </Tr>
            </THead>
            <tbody>
              {items.map((r) => (
                <Tr key={r.id} className="hover:bg-surface-2">
                  <Td>
                    <Link href={`/reports/${r.id}`} prefetch className="flex items-center gap-3">
                      <Avatar src={r.dog_image_url} name={r.dog_name} size={36} />
                      <span className="truncate font-medium">{r.dog_name ?? "Sin nombre"}</span>
                    </Link>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-muted">{r.owner_name ?? r.owner_email}</span>
                      <BanBadge bannedUntil={r.owner_banned_until} />
                    </div>
                  </Td>
                  <Td>
                    <ReasonBadge reason={r.reason} />
                  </Td>
                  <Td className="text-muted">{formatDate(r.created_at)}</Td>
                  <Td>
                    <ReportStatusBadge status={r.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} hasNext={hasNext} build={buildHref} />
      </Card>
    </>
  );
}
