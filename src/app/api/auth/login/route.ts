import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/cf";
import { buildGoogleAuthUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "patica_oauth_state";
const NONCE_COOKIE = "patica_oauth_nonce";
const TEN_MINUTES = 60 * 10;

export async function GET(req: NextRequest) {
  const e = env();
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const authUrl = buildGoogleAuthUrl({
    clientId: e.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
    nonce,
  });

  const res = NextResponse.redirect(authUrl);
  const opts = {
    httpOnly: true,
    secure: e.ENVIRONMENT !== "development",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEN_MINUTES,
  };
  res.cookies.set(STATE_COOKIE, state, opts);
  res.cookies.set(NONCE_COOKIE, nonce, opts);
  return res;
}
