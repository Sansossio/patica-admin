import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "../cf";
import type { AdminRole } from "../types";

export const SESSION_COOKIE = "patica_admin_session";
const ALG = "HS256";
const ISSUER = "patica-admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (1 month)

export type AdminSession = {
  email: string;
  name: string | null;
  picture: string | null;
  role: AdminRole;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env().AUTH_SECRET);
}

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({
    email: session.email,
    name: session.name,
    picture: session.picture,
    role: session.role,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setSubject(session.email)
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER });
    if (typeof payload.email !== "string") return null;
    return {
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
      role: payload.role === "superadmin" ? "superadmin" : "admin",
    };
  } catch {
    return null;
  }
}

/** Read + verify the current session from the request cookies (or null). */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Persistent session cookie options. `secure` is derived from the actual
 * request protocol (pass `origin.startsWith("https")`) rather than an env var,
 * so a Secure cookie is never set over plain HTTP (which the browser would
 * silently drop → "logged out on reload"). maxAge makes it survive reloads.
 */
export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
