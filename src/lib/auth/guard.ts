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
