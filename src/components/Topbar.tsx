import Link from "next/link";
import { Avatar } from "./ui";
import { IconLogout } from "./icons";
import type { AdminSession } from "@/lib/auth/session";

export function Topbar({ session }: { session: AdminSession }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Avatar src={session.picture} name={session.name ?? session.email} size={32} />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{session.name ?? "Admin"}</p>
          <p className="text-xs leading-tight text-subtle">{session.email}</p>
        </div>
        <Link
          href="/api/auth/logout"
          prefetch={false}
          title="Cerrar sesión"
          className="ml-2 rounded-(--radius-button) border border-border p-2 text-muted transition hover:border-danger/50 hover:text-danger"
        >
          <IconLogout className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
