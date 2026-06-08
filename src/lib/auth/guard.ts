import "server-only";
import { redirect } from "next/navigation";
import { getSession, type AdminSession } from "./session";
import { findActiveAdmin } from "./admins";

/**
 * Gate a server component / server action behind admin auth. Re-checks the
 * allowlist on every request (cheap, indexed) so revoking access in the
 * admin_users table takes effect immediately, even with a valid cookie.
 * Redirects to /login when not authenticated/authorized; otherwise returns
 * the session.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await findActiveAdmin(session.email);
  if (!admin) redirect("/login?error=forbidden");

  return session;
}

/**
 * Gate behind the superadmin role. Like `requireAdmin`, but re-reads the role
 * from `admin_users` (authoritative — the session JWT role can be stale after a
 * promotion/demotion) and bounces non-superadmins back to the dashboard.
 * Returns the session with its role corrected to the live DB value.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await findActiveAdmin(session.email);
  if (!admin) redirect("/login?error=forbidden");
  if (admin.role !== "superadmin") redirect("/?error=forbidden");

  return { ...session, role: admin.role };
}
