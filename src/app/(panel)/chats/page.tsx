import Link from "next/link";
import { Suspense } from "react";
import { listConversations } from "@/lib/queries/chats";
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
  SearchInput,
} from "@/components/ui";
import { TableSkeleton } from "@/components/Skeleton";
import { formatDateTime, formatNumber } from "@/lib/format";
import { IconChat } from "@/components/icons";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q ?? "";

  return (
    <>
      <PageHeader
        title="Chats"
        subtitle="Monitoreo de conversaciones (solo lectura)"
        actions={<SearchInput placeholder="Perro o dueño" />}
      />

      <Card>
        <Suspense key={`${q}|${page}`} fallback={<TableSkeleton rows={8} cols={4} />}>
          <ChatsTable q={q} page={page} />
        </Suspense>
      </Card>
    </>
  );
}

async function ChatsTable({ q, page }: { q: string; page: number }) {
  const { items, hasNext } = await listConversations({ q, page, pageSize: PAGE_SIZE });

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/chats${s ? `?${s}` : ""}`;
  };

  if (items.length === 0) {
    return (
      <>
        <EmptyState
          icon={<IconChat className="h-8 w-8" />}
          title={q ? "Sin resultados" : "Sin conversaciones"}
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
            <Th>Participantes</Th>
            <Th>Último mensaje</Th>
            <Th className="text-center">Mensajes</Th>
            <Th>Actividad</Th>
          </Tr>
        </THead>
        <tbody>
          {items.map((c) => (
            <Tr key={c.id} className="hover:bg-surface-2">
              <Td>
                <Link href={`/chats/${c.id}`} prefetch className="block">
                  <p className="font-medium">
                    {c.a_dog_name ?? "?"} <span className="text-subtle">·</span>{" "}
                    {c.b_dog_name ?? "?"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {c.a_owner_name ?? "—"} · {c.b_owner_name ?? "—"}
                  </p>
                </Link>
              </Td>
              <Td className="max-w-xs">
                <span className="block truncate text-muted">{c.last_text ?? "—"}</span>
              </Td>
              <Td className="text-center text-muted">{formatNumber(c.message_count)}</Td>
              <Td className="text-muted">
                {formatDateTime(c.last_message_at ?? c.created_at)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} hasNext={hasNext} build={buildHref} />
    </>
  );
}
