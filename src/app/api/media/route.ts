import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "";
  if (!/^[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(path))
    return new NextResponse(null, { status: 400 });
  try {
    const c = await serverClient();
    const { data, error } = await c.storage
      .from("media")
      .createSignedUrl(path, 60);
    if (error || !data) return new NextResponse(null, { status: 404 });
    return NextResponse.redirect(data.signedUrl, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
