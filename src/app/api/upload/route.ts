import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { serverClient } from "@/lib/supabase/server";
import { storageAdmin } from "@/lib/supabase/storage-admin";
import { validateImage } from "@/lib/validation";
import { readBoundedBody } from "@/lib/request-body";
export async function POST(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase")
      return NextResponse.json(
        { error: "Backend modu etkin değil." },
        { status: 503 },
      );
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json(
        { error: "Geçersiz istek kaynağı." },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length")) > 10 * 1024 * 1024 + 10000)
      return NextResponse.json({ error: "Dosya çok büyük." }, { status: 413 });
    const c = await serverClient();
    const { data } = await c.auth.getUser();
    if (!data.user)
      return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const limit = await c.rpc("papi_upload_limit");
    if (limit.error)
      return NextResponse.json(
        { error: "Yükleme sınırına ulaştın. Biraz sonra tekrar dene." },
        { status: 429 },
      );
    const bytesIn = await readBoundedBody(req, 10 * 1024 * 1024 + 10000);
    const form = await new Response(bytesIn as BodyInit, {
        headers: { "Content-Type": req.headers.get("content-type") || "" },
      }).formData(),
      file = form.get("file");
    if (!(file instanceof File)) throw new Error("Görsel seç.");
    await validateImage(file);
    const bytes = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize({
        width: 2400,
        height: 2400,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
    const path = `${data.user.id}/${crypto.randomUUID()}.webp`;
    const { error } = await storageAdmin()
      .storage.from("media")
      .upload(path, bytes, { contentType: "image/webp", upsert: false });
    if (error) throw new Error("Yükleme tamamlanamadı.");
    return NextResponse.json({
      url: `/api/media?path=${encodeURIComponent(path)}`,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Görsel yüklenemedi. Geçerli bir JPEG, PNG veya WebP seç ve depolama yapılandırmasını kontrol et.",
      },
      { status: 400 },
    );
  }
}
