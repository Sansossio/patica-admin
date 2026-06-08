import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findActiveAdmin } from "@/lib/auth/admins";
import { getOnlineCount } from "@/lib/queries/stats";

export const dynamic = "force-dynamic";

/** Live online-user count, polled by the dashboard. Admin-gated like the panel. */
export async function GET() {
  const session = await getSession();
  if (!session || !(await findActiveAdmin(session.email))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const count = await getOnlineCount();
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
