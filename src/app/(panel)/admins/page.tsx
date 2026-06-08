import { Suspense } from "react";
import { requireSuperAdmin } from "@/lib/auth/guard";
import { listAdminUsers, countActiveSuperadmins } from "@/lib/queries/admins";
import {
  PageHeader,
  Card,
  Table,
  THead,
  Th,
  Tr,
  Td,
  Badge,
  EmptyState,
  SearchInput,
} from "@/components/ui";
import { TableSkeleton } from "@/components/Skeleton";
import { AdminCreateModal, AdminDeleteButton } from "@/components/AdminControls";
import { IconShield } from "@/components/icons";
import { adminRoleLabel } from "@/lib/labels";
import { formatDate, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireSuperAdmin();
  const sp = await searchParams;
  const q = sp.q ?? "";

  return (
    <>
      <PageHeader
        title="Administradores"
        subtitle="Quién puede acceder al panel · solo superadmins gestionan esta lista"
        actions={
          <>
            <SearchInput placeholder="Email o ID" />
            <AdminCreateModal />
          </>
        }
      />

      <Card>
        <Suspense key={q} fallback={<TableSkeleton rows={4} cols={6} />}>
          <AdminsTable q={q} meEmail={session.email} />
        </Suspense>
      </Card>
    </>
  );
}

async function AdminsTable({ q, meEmail }: { q: string; meEmail: string }) {
  const [admins, activeSupers] = await Promise.all([
    listAdminUsers(q),
    countActiveSuperadmins(),
  ]);
  const me = meEmail.toLowerCase();

  if (admins.length === 0) {
    return (
      <EmptyState
        icon={<IconShield className="h-8 w-8" />}
        title={q ? "Sin resultados" : "Sin administradores"}
        description={q ? `No hay admins que coincidan con "${q}".` : undefined}
      />
    );
  }

  return (
    <Table>
      <THead>
        <Tr>
          <Th>Email</Th>
          <Th>Nombre</Th>
          <Th>Rol</Th>
          <Th>Estado</Th>
          <Th>Último acceso</Th>
          <Th>Alta</Th>
          <Th className="text-right">Acciones</Th>
        </Tr>
      </THead>
      <tbody>
        {admins.map((a) => {
          const isSelf = a.email.toLowerCase() === me;
          const isLastSuper = a.role === "superadmin" && a.is_active === 1 && activeSupers <= 1;
          const disabledReason = isSelf
            ? "No puedes eliminar tu propia cuenta"
            : isLastSuper
              ? "Es el último superadmin activo"
              : undefined;

          return (
            <Tr key={a.id} className="hover:bg-surface-2">
              <Td>
                <span className="font-medium">{a.email}</span>
                {isSelf && <span className="ml-2 text-xs text-subtle">(tú)</span>}
              </Td>
              <Td className="text-muted">{a.name ?? "—"}</Td>
              <Td>
                <Badge tone={a.role === "superadmin" ? "primary" : "neutral"}>
                  {adminRoleLabel(a.role)}
                </Badge>
              </Td>
              <Td>
                {a.is_active ? (
                  <Badge tone="success">Activo</Badge>
                ) : (
                  <Badge tone="warning">Inactivo</Badge>
                )}
              </Td>
              <Td className="text-muted">
                {a.last_login_at ? timeAgo(a.last_login_at) : "Nunca"}
              </Td>
              <Td className="text-muted">{formatDate(a.created_at)}</Td>
              <Td className="text-right">
                <div className="flex justify-end">
                  <AdminDeleteButton id={a.id} email={a.email} disabledReason={disabledReason} />
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
