import Link from "next/link";
import { loadActivityWindow } from "@/lib/queries/activity";
import { ActivityExplorer } from "@/components/ActivityExplorer";
import { RefreshButton } from "@/components/RefreshButton";
import { PageHeader, Card, Badge } from "@/components/ui";
import { formatDay } from "@/lib/format";
import type { ActivityWindow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number.parseInt(pageParam ?? "0", 10) || 0);

  // Load one preloaded 7-day UTC window: all three drilldown levels at once, so
  // the explorer's modals open with no extra round-trip.
  const win = await loadActivityWindow(page);

  return (
    <>
      <PageHeader
        title="Actividad"
        // Server-side log only (platform="server"): fires for ALL builds, so the
        // numbers are build-independent and not double-counted by the app client.
        subtitle="Actividad registrada en el servidor · por día (hora Caracas)"
        // RefreshButton is a client component; rendering it inside the
        // (server-rendered) PageHeader actions is fine — it ships its own island.
        actions={<RefreshButton />}
      />

      {/* Window range + weekly pagination. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="capitalize">{formatDay(win.start)}</span>
          {" — "}
          <span className="capitalize">{formatDay(win.end)}</span>
        </p>
        <div className="flex gap-2">
          <WeekLink href={`/activity?page=${page - 1}`} disabled={page <= 0}>
            Semana siguiente
          </WeekLink>
          <WeekLink href={`/activity?page=${page + 1}`} disabled={!win.hasOlder}>
            Semana anterior
          </WeekLink>
        </div>
      </div>

      {win.truncated && (
        <p className="mb-3 text-xs text-warning">
          Demasiados eventos esta semana: algunas líneas de tiempo pueden estar
          incompletas.
        </p>
      )}

      <ActivityExplorer window={win} />

      <SharedDevicesCard window={win} />
    </>
  );
}

function WeekLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-(--radius-button) border border-border px-3 py-1.5 text-sm text-subtle opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      prefetch
      className="rounded-(--radius-button) border border-border px-3 py-1.5 text-sm text-text transition hover:border-primary/60 hover:text-primary"
    >
      {children}
    </Link>
  );
}

// Transparency: surface the accounts hidden by the per-device dedup so it's
// provable that the anti-fraud rule is working and to spot shared phones.
function SharedDevicesCard({ window: win }: { window: ActivityWindow }) {
  if (win.sharedDevices.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle">
        Cuentas omitidas por dispositivo compartido
      </h2>
      <Card className="divide-y divide-border/60">
        {win.sharedDevices.map((dev) => (
          <div key={dev.device_id} className="px-5 py-3 text-sm">
            <p className="mb-2 font-mono text-xs text-subtle">{dev.device_id}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
              {dev.accounts.map((a) => (
                <div key={a.user_id} className="flex items-center gap-2 min-w-0">
                  {a.is_owner ? (
                    <Badge tone="success">Titular</Badge>
                  ) : (
                    <Badge tone="warning">Omitida</Badge>
                  )}
                  <Link
                    href={`/users/${a.user_id}`}
                    prefetch
                    className="min-w-0 truncate hover:text-primary"
                  >
                    <span className="font-medium">{a.user_name ?? "Sin nombre"}</span>
                    <span className="ml-1.5 text-xs text-muted">
                      {a.user_email ?? a.user_id.slice(0, 8)}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
