"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal, ModalRefreshButton } from "./Modal";
import {
  Card,
  Table,
  THead,
  Th,
  Tr,
  Td,
  Badge,
  EmptyState,
} from "./ui";
import { IconActivity, IconChevronRight } from "./icons";
import { formatDay, formatNumber, formatTime } from "@/lib/format";
import { userEventLabel } from "@/lib/labels";
import type {
  ActivityDay,
  ActivityTimelineEvent,
  ActivityUserDay,
  ActivityWindow,
} from "@/lib/types";

// Render a one-line preview of an event's stringified-JSON metadata.
function metaPreview(metadata: string): string {
  if (!metadata || metadata === "{}") return "";
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  } catch {
    return "";
  }
}

/**
 * Client-side drilldown for the Activity section. Receives the whole preloaded
 * window as props and manages two stacked modals with local state:
 *   - level 1 (days table) is rendered inline by the page;
 *   - clicking a day opens the level-2 modal (users for that day);
 *   - clicking a user opens the stacked level-3 modal (their timeline).
 *
 * router.refresh() in the day modal re-runs the server page and flows fresh
 * props down WHILE the modals stay open (App Router preserves this client
 * state), so the numbers update in place.
 */
export function ActivityExplorer({ window: win }: { window: ActivityWindow }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);

  // Resolve the currently-open day/user from the latest props. After a refresh
  // the objects are new, so we always look them up by id rather than caching.
  const day: ActivityDay | undefined = openDay
    ? win.days.find((d) => d.day === openDay)
    : undefined;
  const user: ActivityUserDay | undefined =
    day && openUser ? day.users.find((u) => u.user_id === openUser) : undefined;

  return (
    <>
      <Card>
        {win.days.length === 0 ? (
          <EmptyState
            icon={<IconActivity className="h-8 w-8" />}
            title="Sin actividad registrada"
            description="No hay eventos del servidor en esta semana."
          />
        ) : (
          <Table>
            <THead>
              <Tr>
                <Th>Día</Th>
                <Th className="text-center">Usuarios activos</Th>
                <Th className="text-center">Actividades</Th>
                <Th className="w-10" />
              </Tr>
            </THead>
            <tbody>
              {win.days.map((d) => (
                <Tr
                  key={d.day}
                  className="cursor-pointer hover:bg-surface-2"
                  onClick={() => {
                    setOpenDay(d.day);
                    setOpenUser(null);
                  }}
                >
                  <Td>
                    <div className="flex items-center gap-2 font-medium">
                      <span className="font-mono text-xs text-subtle">{d.day}</span>
                      <span className="capitalize text-muted">{formatDay(d.day)}</span>
                    </div>
                  </Td>
                  <Td className="text-center text-primary">
                    {formatNumber(d.active_users)}
                  </Td>
                  <Td className="text-center text-muted">
                    {formatNumber(d.total_activities)}
                  </Td>
                  <Td className="text-subtle">
                    <IconChevronRight className="h-4 w-4" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Level 2 — users active on the selected day. */}
      <DayModal
        day={day}
        openDayId={openDay}
        onClose={() => {
          setOpenDay(null);
          setOpenUser(null);
        }}
        onOpenUser={(userId) => setOpenUser(userId)}
      />

      {/* Level 3 — the selected user's event timeline (stacked above level 2). */}
      <UserModal
        day={day}
        user={user}
        open={Boolean(user)}
        onClose={() => setOpenUser(null)}
      />
    </>
  );
}

function DayModal({
  day,
  openDayId,
  onClose,
  onOpenUser,
}: {
  day: ActivityDay | undefined;
  openDayId: string | null;
  onClose: () => void;
  onOpenUser: (userId: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Keep the modal open even if the day momentarily resolves to undefined
  // mid-refresh: gate on the selected id, fall back to an empty users list.
  const open = Boolean(openDayId);
  const users = day?.users ?? [];
  const title = openDayId ? formatDay(openDayId) : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-4xl"
      zIndex="z-50"
      headerExtra={
        <ModalRefreshButton
          pending={isPending}
          onRefresh={() => startTransition(() => router.refresh())}
        />
      }
    >
      <p className="mb-4 -mt-2 text-sm text-muted">
        {formatNumber(users.length)} usuario{users.length === 1 ? "" : "s"} activo
        {users.length === 1 ? "" : "s"} · {openDayId}
      </p>

      {users.length === 0 ? (
        <EmptyState
          icon={<IconActivity className="h-8 w-8" />}
          title="Sin actividad este día"
        />
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Usuario</Th>
              <Th className="text-center">Actividades</Th>
              <Th>Desglose</Th>
              <Th>Primera</Th>
              <Th>Última</Th>
            </Tr>
          </THead>
          <tbody>
            {users.map((u) => (
              <Tr
                key={u.user_id}
                className="cursor-pointer hover:bg-surface-2"
                onClick={() => onOpenUser(u.user_id)}
              >
                <Td>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.user_name ?? "Sin nombre"}</p>
                    <p className="truncate text-xs text-muted">
                      {u.user_email ?? u.user_id.slice(0, 8)}
                    </p>
                  </div>
                </Td>
                <Td className="text-center font-medium text-primary">
                  {formatNumber(u.total_activities)}
                </Td>
                <Td className="max-w-md">
                  <div className="flex flex-wrap gap-1.5">
                    {u.byType.slice(0, 6).map((t) => (
                      <Badge key={t.event} tone="info">
                        {userEventLabel(t.event)} · {formatNumber(t.count)}
                      </Badge>
                    ))}
                    {u.byType.length > 6 && (
                      <Badge tone="neutral">+{u.byType.length - 6}</Badge>
                    )}
                  </div>
                </Td>
                <Td className="text-subtle">{formatTime(u.first_at)}</Td>
                <Td className="text-subtle">{formatTime(u.last_at)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Modal>
  );
}

function UserModal({
  day,
  user,
  open,
  onClose,
}: {
  day: ActivityDay | undefined;
  user: ActivityUserDay | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const events: ActivityTimelineEvent[] = user?.events ?? [];
  const title = user?.user_name ?? user?.user_email ?? "Usuario";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="max-w-3xl"
      zIndex="z-[60]"
      headerExtra={
        user ? (
          <Link
            href={`/users/${user.user_id}`}
            prefetch
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Ver perfil
          </Link>
        ) : undefined
      }
    >
      <p className="mb-4 -mt-2 text-xs text-subtle">
        {day && <span className="capitalize">{formatDay(day.day)}</span>}
        {" · "}
        {formatNumber(events.length)} actividad{events.length === 1 ? "" : "es"}
      </p>

      {events.length === 0 ? (
        <EmptyState
          icon={<IconActivity className="h-8 w-8" />}
          title="Sin actividad este día"
        />
      ) : (
        <Card className="divide-y divide-border/60">
          {events.map((e) => {
            const preview = metaPreview(e.metadata);
            return (
              <div key={e.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                <span className="w-20 shrink-0 font-mono text-xs text-subtle">
                  {formatTime(e.created_at)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{userEventLabel(e.event)}</Badge>
                    {e.platform && (
                      <span className="text-xs text-subtle">
                        {e.platform}
                        {e.app_version ? ` · v${e.app_version}` : ""}
                      </span>
                    )}
                  </div>
                  {preview && (
                    <p className="mt-1 break-words text-xs text-muted">{preview}</p>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </Modal>
  );
}
