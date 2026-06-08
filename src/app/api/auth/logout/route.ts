import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(`${req.nextUrl.origin}/login`);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export const POST = GET;
