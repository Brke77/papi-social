import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next =
    req.nextUrl.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/feed";
  if (code) {
    const c = await serverClient();
    const { error } = await c.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.url));
  }
  return NextResponse.redirect(new URL("/login", req.url));
}
