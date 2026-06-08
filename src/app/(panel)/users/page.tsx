import Link from "next/link";
import { Suspense } from "react";
import { listUsers, type UserFilter } from "@/lib/queries/users";
import {
  PageHeader,
  Card,
  Table,
  THead,
  Th,
  Tr,
  Td,
  Avatar,
  SearchInput,
  Pagination,
  EmptyState,
  cn,
} from "@/components/ui";
import { TableSkeleton } from "@/components/Skeleton";
import { BanBadge } from "@/components/badges";
import { formatDate, formatNumber } from "@/lib/format";
import { cdnUrl } from "@/lib/cdn";
import { IconUsers } from "@/components/icons";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filter: UserFilter = sp.filter === "banned" ? "banned" : "all";
  const q = sp.q ?? "";

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas"
        actions={<SearchInput placeholder="Email, nombre o ID" />}
      />

      <div className="mb-4 flex gap-2">
        <FilterTab href="/users" active={filter === "all"}>
          Todos
        </FilterTab>
        <FilterTab href="/users?filter=banned" active={filter === "banned"}>
          Baneados
        </FilterTab>
      </div>

      <Card>
        <Suspense key={`${q}|${filter}|${page}`} fallback={<TableSkeleton rows={8} cols={5} />}>
          <UsersTable q={q} filter={filter} page={page} />
        </Suspense>
      </Card>
    </>
  );
}

async function UsersTable({
  q,
  filter,
  page,
}: {
  q: string;
  filter: UserFilter;
  page: number;
}) {
  const { items, hasNext } = await listUsers({ q, filter, page, pageSize: PAGE_SIZE });

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter !== "all") params.set("filter", filter);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/users${s ? `?${s}` : ""}`;
  };

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon={<IconUsers className="h-8 w-8" />}
          title={q ? "Sin resultados" : "Sin usuarios"}
        />
        <Pagination page={page} hasNext={hasNext} build={buildHref} />
      </>
    );
  }

  return (
    <>
      <Table>
        <THead>
          <Tr>
            <Th>Usuario</Th>
            <Th className="text-center">Perros</Th>
            <Th className="text-center">Reportes</Th>
            <Th>Alta</Th>
            <Th>Estado</Th>
          </Tr>
        </THead>
        <tbody>
          {items.map((u) => (
            <Tr key={u.id} className="hover:bg-surface-2">
              <Td>
                <Link href={`/users/${u.id}`} prefetch className="flex items-center gap-3">
                  <Avatar
                    src={u.profile_photo_url ? cdnUrl(u.profile_photo_url) : u.photo_url}
                    name={u.name}
                    size={36}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name ?? "Sin nombre"}</p>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                </Link>
              </Td>
              <Td className="text-center text-muted">{formatNumber(u.dogs_count)}</Td>
              <Td className="text-center">
                {u.reports_against > 0 ? (
                  <span className="text-warning">{formatNumber(u.reports_against)}</span>
                ) : (
                  <span className="text-subtle">0</span>
                )}
              </Td>
              <Td className="text-muted">{formatDate(u.created_at)}</Td>
              <Td>
                <BanBadge bannedUntil={u.banned_until} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} hasNext={hasNext} build={buildHref} />
    </>
  );
}

function FilterTab({
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
