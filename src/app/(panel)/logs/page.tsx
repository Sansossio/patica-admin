import Link from "next/link";
import {
  listAdminAudit,
  listAppAudit,
  listUserEvents,
  type AppAuditView,
  type UserEventView,
} from "@/lib/queries/logs";
import type { AdminAuditLogRow } from "@/lib/types";
import {
  PageHeader,
  Card,
  Table,
  THead,
  Th,
  Tr,
  Td,
  Pagination,
  EmptyState,
  Badge,
  cn,
} from "@/components/ui";
import { IconList } from "@/components/icons";
import { adminActionLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

function metaSummary(metadata: string): string {
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof obj.reason === "string" && obj.reason) parts.push(obj.reason);
    if (typeof obj.duration === "string" && obj.duration) {
      parts.push(obj.duration === "permanent" ? "permanente" : `${obj.duration} días`);
    }
    if (typeof obj.status === "string") parts.push(obj.status);
    return parts.join(" · ");
  } catch {
    return "";
  }
}

function metaPreview(metadata: string): string {
  if (!metadata || metadata === "{}") return "";
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    return Object.entries(obj)
      .slice(0, 4)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join(" · ");
  } catch {
    return "";
  }
}

function targetHref(type: string | null, targetId: string | null): string | null {
  if (!targetId) return null;
  if (type === "user") return `/users/${targetId}`;
  if (type === "report") return `/reports/${targetId}`;
  if (type === "dog") return `/dogs?q=${targetId}`;
  return null;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "app" ? "app" : sp.tab === "user" ? "user" : "panel";
  const page = Math.max(1, Number(sp.page) || 1);

  const panel = tab === "panel" ? await listAdminAudit({ page, pageSize: PAGE_SIZE }) : null;
  const user = tab === "user" ? await listUserEvents({ page, pageSize: PAGE_SIZE }) : null;
  const app = tab === "app" ? await listAppAudit({ page, pageSize: PAGE_SIZE }) : null;
  const hasNext = panel?.hasNext ?? user?.hasNext ?? app?.hasNext ?? false;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (tab !== "panel") params.set("tab", tab);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/logs${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Logs" subtitle="Auditoría de acciones" />

      <div className="mb-4 flex gap-2">
        <TabLink href="/logs" active={tab === "panel"}>
          Acciones del panel
        </TabLink>
        <TabLink href="/logs?tab=user" active={tab === "user"}>
          Actividad de usuarios
        </TabLink>
        <TabLink href="/logs?tab=app" active={tab === "app"}>
          Eventos de la app
        </TabLink>
      </div>

      <Card>
        {panel && <PanelLog items={panel.items} />}
        {user && <UserEventLog items={user.items} />}
        {app && <AppLog items={app.items} />}
        <Pagination page={page} hasNext={hasNext} build={buildHref} />
      </Card>
    </>
  );
}

function PanelLog({ items }: { items: AdminAuditLogRow[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<IconList className="h-8 w-8" />} title="Sin acciones registradas" />;
  }
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Acción</Th>
          <Th>Detalle</Th>
          <Th>Objetivo</Th>
          <Th>Admin</Th>
          <Th>Fecha</Th>
        </Tr>
      </THead>
      <tbody>
        {items.map((a) => {
          const href = targetHref(a.target_type, a.target_id);
          const summary = metaSummary(a.metadata);
          return (
            <Tr key={a.id}>
              <Td>
                <Badge tone={a.action === "user.ban" ? "danger" : "neutral"}>
                  {adminActionLabel(a.action)}
                </Badge>
              </Td>
              <Td className="max-w-xs">
                <span className="block truncate text-muted">{summary || "—"}</span>
              </Td>
              <Td className="text-muted">
                {href ? (
                  <Link href={href} className="font-mono text-xs hover:text-primary">
                    {a.target_type}:{(a.target_id ?? "").slice(0, 8)}
                  </Link>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Td>
              <Td className="text-muted">{a.admin_email}</Td>
              <Td className="text-subtle">{formatDateTime(a.created_at)}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function AppLog({ items }: { items: AppAuditView[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<IconList className="h-8 w-8" />} title="Sin eventos" />;
  }
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Acción</Th>
          <Th>Usuario</Th>
          <Th>Fecha</Th>
        </Tr>
      </THead>
      <tbody>
        {items.map((a) => (
          <Tr key={a.id}>
            <Td className="font-mono text-xs">{a.action}</Td>
            <Td className="text-muted">
              {a.user_id ? (
                <Link href={`/users/${a.user_id}`} className="hover:text-primary">
                  {a.user_email ?? a.user_name ?? a.user_id.slice(0, 8)}
                </Link>
              ) : (
                <span className="text-subtle">—</span>
              )}
            </Td>
            <Td className="text-subtle">{formatDateTime(a.created_at)}</Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

function UserEventLog({ items }: { items: UserEventView[] }) {
  if (items.length === 0) {
    return <EmptyState icon={<IconList className="h-8 w-8" />} title="Sin eventos de usuarios" />;
  }
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Evento</Th>
          <Th>Usuario</Th>
          <Th>Plataforma</Th>
          <Th>Detalle</Th>
          <Th>Fecha</Th>
        </Tr>
      </THead>
      <tbody>
        {items.map((e) => {
          const preview = metaPreview(e.metadata);
          return (
            <Tr key={e.id}>
              <Td>
                <Badge tone="info">{e.event}</Badge>
              </Td>
              <Td className="text-muted">
                <Link href={`/users/${e.user_id}`} className="hover:text-primary">
                  {e.user_email ?? e.user_name ?? e.user_id.slice(0, 8)}
                </Link>
              </Td>
              <Td className="text-subtle">
                {e.platform ?? "—"}
                {e.app_version ? ` · v${e.app_version}` : ""}
              </Td>
              <Td className="max-w-xs">
                <span className="block truncate text-muted">{preview || "—"}</span>
              </Td>
              <Td className="text-subtle">{formatDateTime(e.created_at)}</Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "rounded-(--radius-button) border px-3 py-1.5 text-sm transition",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border text-muted hover:text-text",
      )}
    >
      {children}
    </Link>
  );
}
