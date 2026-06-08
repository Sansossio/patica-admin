import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cf";
import { exchangeCodeForIdToken, verifyGoogleIdToken } from "@/lib/auth/google";
import { findActiveAdmin, touchAdminLogin } from "@/lib/auth/admins";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "patica_oauth_state";
const NONCE_COOKIE = "patica_oauth_nonce";

function fail(origin: string, reason: string) {
  const res = NextResponse.redirect(`${origin}/login?error=${reason}`);
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(NONCE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const e = env();
  const origin = req.nextUrl.origin;
  const params = req.nextUrl.searchParams;

  if (params.get("error")) return fail(origin, "google");

  const code = params.get("code");
  const state = params.get("state");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;
  const nonce = req.cookies.get(NONCE_COOKIE)?.value;

  // CSRF: the state we set must round-trip unchanged, and the nonce must be
  // present (it is bound to the id_token below — treat a missing one as a hard
  // failure, like state).
  if (!code || !state || !cookieState || state !== cookieState || !nonce) {
    return fail(origin, "state");
  }

  try {
    const redirectUri = `${origin}/api/auth/callback`;
    const idToken = await exchangeCodeForIdToken({
      code,
      clientId: e.GOOGLE_CLIENT_ID,
      clientSecret: e.GOOGLE_CLIENT_SECRET,
      redirectUri,
    });
    const identity = await verifyGoogleIdToken(idToken, {
      clientId: e.GOOGLE_CLIENT_ID,
      nonce,
    });

    const admin = await findActiveAdmin(identity.email);
    if (!admin) return fail(origin, "forbidden");

    const token = await createSessionToken({
      email: admin.email,
      name: identity.name ?? admin.name,
      picture: identity.picture,
      role: admin.role,
    });

    await touchAdminLogin(admin.email);
    await writeAuditLog({
      adminEmail: admin.email,
      action: "auth.login",
      targetType: "admin",
      targetId: admin.email,
    });

    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(NONCE_COOKIE);
    return res;
  } catch (err) {
    console.error("admin.auth.callback_failed", err);
    return fail(origin, "exchange");
  }
}
