import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail } from "@/lib/queries/users";
import { Card, EmptyState, Avatar, Badge } from "@/components/ui";
import { BanBadge, ReportStatusBadge, ReasonBadge, DogActiveBadge } from "@/components/badges";
import { UserBanControls } from "@/components/UserBanControls";
import { RemoteImage } from "@/components/RemoteImage";
import { IconChevronLeft, IconChat } from "@/components/icons";
import { cdnUrl } from "@/lib/cdn";
import { banInfo } from "@/lib/ban";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const { user, dogs, reportsAgainst, banHistory, conversations, events } = detail;
  const ban = banInfo(user.banned_until);
  const avatarSrc = user.profile_photo_url ? cdnUrl(user.profile_photo_url) : user.photo_url;
  const lastBanReason = banHistory.find((b) => b.action === "ban")?.reason ?? null;

  const stats: { label: string; value: number }[] = [
    { label: "Perros", value: dogs.length },
    { label: "Conversaciones", value: detail.conversationCount },
    { label: "Mensajes", value: detail.messageCount },
    { label: "Reportes hechos", value: detail.reportsMade },
    { label: "Reportes recibidos", value: reportsAgainst.length },
    { label: "Bloqueos", value: detail.blocksMade },
  ];

  return (
    <>
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-text"
      >
        <IconChevronLeft className="h-4 w-4" /> Usuarios
      </Link>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={avatarSrc} name={user.name} size={64} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name ?? "Sin nombre"}</h1>
                <BanBadge bannedUntil={user.banned_until} />
              </div>
              <p className="text-sm text-muted">{user.email}</p>
              <p className="mt-1 text-xs text-subtle">
                Alta {formatDate(user.created_at)} · ID {user.id}
                {user.app_version ? ` · v${user.app_version}` : ""}
              </p>
            </div>
          </div>
          <UserBanControls userId={user.id} banned={ban.banned} />
        </div>

        {ban.banned && (
          <div className="mt-4 rounded-(--radius-button) border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Cuenta {ban.permanent ? "baneada permanentemente" : `baneada hasta ${formatDateTime(ban.until)}`}
            {lastBanReason ? ` · ${lastBanReason}` : ""}
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{formatNumber(s.value)}</p>
          </Card>
        ))}
      </div>

      {/* Dogs */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">Perros</h2>
        {dogs.length === 0 ? (
          <Card>
            <EmptyState title="Sin perros" />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {dogs.map((d) => (
              <Card key={d.id} className="overflow-hidden">
                <RemoteImage
                  src={cdnUrl(d.image_url)}
                  alt={d.name ?? ""}
                  className="aspect-square w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="truncate text-sm font-medium">{d.name ?? "Sin nombre"}</p>
                  <DogActiveBadge active={d.is_active === 1} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">
          Conversaciones
        </h2>
        {conversations.length === 0 ? (
          <Card>
            <EmptyState title="Sin conversaciones" />
          </Card>
        ) : (
          <Card className="divide-y divide-border/60">
            {conversations.map((c) => {
              const mineIsA = c.a_owner_id === user.id;
              const myDog = mineIsA ? c.a_dog_name : c.b_dog_name;
              const otherDog = mineIsA ? c.b_dog_name : c.a_dog_name;
              return (
                <Link
                  key={c.id}
                  href={`/chats/${c.id}`}
                  prefetch
                  className="flex items-center gap-3 px-5 py-3 text-sm transition hover:bg-surface-2"
                >
                  <IconChat className="h-4 w-4 text-subtle" />
                  <span className="min-w-0 flex-1 truncate">
                    {myDog ?? "?"} <span className="text-subtle">↔</span> {otherDog ?? "?"}
                  </span>
                  <span className="text-xs text-subtle">{formatNumber(c.message_count)} msj</span>
                  <span className="hidden text-xs text-subtle sm:inline">
                    {formatDate(c.last_message_at ?? c.created_at)}
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </div>

      {/* Reports against */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">
          Reportes recibidos
        </h2>
        {reportsAgainst.length === 0 ? (
          <Card>
            <EmptyState title="Sin reportes" />
          </Card>
        ) : (
          <Card className="divide-y divide-border/60">
            {reportsAgainst.map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{r.dog_name ?? "Perro"}</span>
                <ReasonBadge reason={r.reason} />
                <ReportStatusBadge status={r.status} />
                <span className="hidden text-xs text-subtle sm:inline">{formatDate(r.created_at)}</span>
              </Link>
            ))}
          </Card>
        )}
      </div>

      {/* Recent activity */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">
            Actividad reciente
          </h2>
          <Link href="/logs?tab=user" className="text-xs text-primary hover:underline">
            Ver todos los eventos
          </Link>
        </div>
        {events.length === 0 ? (
          <Card>
            <EmptyState title="Sin eventos registrados" />
          </Card>
        ) : (
          <Card className="divide-y divide-border/60">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <Badge tone="info">{e.event}</Badge>
                <span className="min-w-0 flex-1 truncate text-subtle">
                  {e.platform ?? ""}
                  {e.app_version ? ` · v${e.app_version}` : ""}
                </span>
                <span className="text-xs text-subtle">{formatDateTime(e.created_at)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Ban history */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-subtle">
          Histórico de moderación
        </h2>
        {banHistory.length === 0 ? (
          <Card>
            <EmptyState title="Sin acciones de moderación" />
          </Card>
        ) : (
          <Card className="divide-y divide-border/60">
            {banHistory.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <Badge tone={b.action === "ban" ? "danger" : "success"}>
                  {b.action === "ban" ? "Baneo" : "Desbaneo"}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-muted">
                  {b.reason ?? (b.action === "ban" ? "Sin motivo" : "—")}
                  {b.action === "ban" && (b.banned_until ? ` · hasta ${formatDate(b.banned_until)}` : " · permanente")}
                </span>
                <span className="hidden text-xs text-subtle md:inline">{b.admin_email}</span>
                <span className="text-xs text-subtle">{formatDate(b.created_at)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
