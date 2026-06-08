"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";
import {
  IconDashboard,
  IconUsers,
  IconFlag,
  IconChat,
  IconPaw,
  IconList,
  IconShield,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: IconDashboard, exact: true },
  { href: "/users", label: "Usuarios", Icon: IconUsers },
  { href: "/reports", label: "Reportes", Icon: IconFlag },
  { href: "/chats", label: "Chats", Icon: IconChat },
  { href: "/dogs", label: "Perros", Icon: IconPaw },
  { href: "/logs", label: "Logs", Icon: IconList },
];

// Superadmin-only entry (managing the access allowlist).
const ADMINS_ITEM: NavItem = { href: "/admins", label: "Administradores", Icon: IconShield };

export function Sidebar({ role }: { role?: AdminRole }) {
  const pathname = usePathname();
  const items = role === "superadmin" ? [...NAV, ADMINS_ITEM] : NAV;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-elevated md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-lg">
          🐾
        </span>
        <span className="text-sm font-bold tracking-tight">Patica Admin</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              className={cn(
                "flex items-center gap-3 rounded-(--radius-button) px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-subtle">
        panel.patica.app
      </div>
    </aside>
  );
}
