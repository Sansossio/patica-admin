import "server-only";
import { jwtVerify, createRemoteJWKSet } from "jose";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleIdentity = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string | null;
  picture: string | null;
};

export function buildGoogleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    nonce: opts.nonce,
    prompt: "select_account",
    access_type: "online",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForIdToken(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<string> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`google_token_exchange_failed: ${res.status}`);
  }
  const json = (await res.json()) as { id_token?: string };
  if (!json.id_token) throw new Error("google_token_exchange_no_id_token");
  return json.id_token;
}

export async function verifyGoogleIdToken(
  idToken: string,
  opts: { clientId: string; nonce: string },
): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: opts.clientId,
  });
  // Strict nonce binding (id_token replay/injection defense): always compare,
  // and fail if the claim is absent.
  if (payload.nonce !== opts.nonce) {
    throw new Error("google_id_token_nonce_mismatch");
  }
  if (typeof payload.email !== "string") {
    throw new Error("google_id_token_no_email");
  }
  // Fail closed if email_verified is missing or not strictly true.
  if (payload.email_verified !== true) {
    throw new Error("google_id_token_email_unverified");
  }
  return {
    sub: typeof payload.sub === "string" ? payload.sub : "",
    email: payload.email,
    email_verified: true,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
