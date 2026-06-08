import Link from "next/link";
import {
  getOverview,
  seriesPerDay,
  fillSeries,
  countSince,
  getTopLikedDogs,
  getOnlineCount,
  getDailyActiveUsers,
  type DayCount,
} from "@/lib/queries/stats";
import { listReports } from "@/lib/queries/reports";
import { listAdminAudit } from "@/lib/queries/logs";
import { StatCard, Card, PageHeader, EmptyState, Avatar } from "@/components/ui";
import { ActivityChart, type ChartUnit } from "@/components/ActivityChart";
import { OnlineCount } from "@/components/OnlineCount";
import { ReasonBadge } from "@/components/badges";
import { IconHeart, IconFlag } from "@/components/icons";
import { formatNumber, timeAgo } from "@/lib/format";
import { adminActionLabel } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    overview,
    online,
    dau,
    signups,
    dogsNew,
    msgs,
    convos,
    likes,
    new1,
    new7,
    new30,
    topDogs,
    pending,
    audit,
  ] = await Promise.all([
    getOverview(),
    getOnlineCount(),
    getDailyActiveUsers(14),
    seriesPerDay("users", 14),
    seriesPerDay("dogs", 14),
    seriesPerDay("messages", 14),
    seriesPerDay("conversations", 14),
    seriesPerDay("dog_likes", 14),
    countSince("users", 1),
    countSince("users", 7),
    countSince("users", 30),
    getTopLikedDogs(5),
    listReports({ status: "pending", page: 1, pageSize: 5 }),
    listAdminAudit({ page: 1, pageSize: 6 }),
  ]);

  const sum = (s: { count: number }[]) => s.reduce((a, b) => a + b.count, 0);

  const charts: { title: string; data: DayCount[]; unit: ChartUnit; avg?: boolean }[] = [
    { title: "Usuarios activos", data: fillSeries(dau, 14), unit: { one: "usuario activo", many: "usuarios activos" }, avg: true },
    { title: "Altas de usuarios", data: fillSeries(signups, 14), unit: { one: "usuario", many: "usuarios" } },
    { title: "Perros nuevos", data: fillSeries(dogsNew, 14), unit: { one: "perro", many: "perros" } },
    { title: "Mensajes", data: fillSeries(msgs, 14), unit: { one: "mensaje", many: "mensajes" } },
    { title: "Conversaciones", data: fillSeries(convos, 14), unit: { one: "conversación", many: "conversaciones" } },
    { title: "Likes", data: fillSeries(likes, 14), unit: { one: "like", many: "likes" } },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Resumen general de Patica" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="En línea ahora" value={<OnlineCount initial={online} />} accent />
        <StatCard
          label="Usuarios"
          value={formatNumber(overview.users)}
          hint={`+${formatNumber(new1)} hoy · +${formatNumber(new7)} 7d · +${formatNumber(new30)} 30d`}
        />
        <StatCard
          label="Perros activos"
          value={formatNumber(overview.dogsActive)}
          hint={`${formatNumber(overview.dogs)} en total`}
        />
        <StatCard label="Conversaciones" value={formatNumber(overview.conversations)} />
        <StatCard label="Mensajes" value={formatNumber(overview.messages)} />
        <StatCard label="Likes" value={formatNumber(overview.dogLikes)} />
        <StatCard
          label="Reportes pendientes"
          value={formatNumber(overview.reportsPending)}
          accent={overview.reportsPending > 0}
          hint={`${formatNumber(overview.reportsTotal)} en total`}
        />
        <StatCard
          label="Cuentas baneadas"
          value={formatNumber(overview.bannedUsers)}
          hint={`${formatNumber(overview.blocks)} bloqueos entre usuarios`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {charts.map((c) => {
          const headline = c.avg ? Math.round(sum(c.data) / c.data.length) : sum(c.data);
          return (
            <Card key={c.title} className="p-5">
              <p className="text-sm text-muted">{c.title} · 14 días</p>
              <p className="mt-1 text-2xl font-bold">
                {formatNumber(headline)}
                {c.avg && (
                  <span className="ml-1 text-xs font-normal text-subtle">/día prom.</span>
                )}
              </p>
              <div className="mt-3">
                <ActivityChart data={c.data} unit={c.unit} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Pending reports */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Reportes pendientes</h2>
            <Link href="/reports" prefetch className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {pending.items.length === 0 ? (
            <EmptyState icon={<IconFlag className="h-8 w-8" />} title="Sin reportes pendientes" />
          ) : (
            <ul className="divide-y divide-border/60">
              {pending.items.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/reports/${r.id}`}
                    prefetch
                    className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2"
                  >
                    <Avatar src={r.dog_image_url} name={r.dog_name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {r.dog_name ?? "Perro sin nombre"}
                      </p>
                      <p className="truncate text-xs text-muted">{r.owner_name ?? r.owner_email}</p>
                    </div>
                    <ReasonBadge reason={r.reason} />
                    <span className="hidden text-xs text-subtle sm:inline">
                      {timeAgo(r.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Side: top dogs + recent admin activity */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <IconHeart className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Perros más queridos</h2>
            </div>
            {topDogs.length === 0 ? (
              <EmptyState title="Aún sin likes" />
            ) : (
              <ul className="divide-y divide-border/60">
                {topDogs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar src={d.image_url} name={d.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name ?? "Sin nombre"}</p>
                      <p className="truncate text-xs text-muted">{d.owner_name ?? "—"}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-primary">
                      <IconHeart className="h-3.5 w-3.5" /> {formatNumber(d.like_count)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Actividad del panel</h2>
            </div>
            {audit.items.length === 0 ? (
              <EmptyState title="Sin actividad" />
            ) : (
              <ul className="divide-y divide-border/60">
                {audit.items.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <p className="text-sm">{adminActionLabel(a.action)}</p>
                    <p className="text-xs text-subtle">
                      {a.admin_email} · {timeAgo(a.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
