import { z } from "zod";
import { categories } from "./model";
export const captionSchema = z
  .string()
  .trim()
  .max(2000, "Açıklama en fazla 2.000 karakter olabilir.");
export const profileSchema = z.object({
  username: z
    .string()
    .regex(
      /^[a-z0-9_]{3,24}$/,
      "Kullanıcı adı 3–24 küçük harf, rakam veya alt çizgi içermeli.",
    ),
  name: z.string().trim().min(2).max(60),
  bio: z.string().max(240),
  location: z.string().max(80),
  website: z
    .string()
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Bağlantı https:// veya http:// ile başlamalı.",
    )
    .refine((v) => {
      try {
        return !v || !!new URL(v);
      } catch {
        return false;
      }
    }, "Geçerli bir bağlantı yaz."),
});
export const postSchema = z
  .object({
    caption: captionSchema,
    category: z.enum(categories),
    media: z.array(z.string()).max(4),
    tags: z.array(z.string().max(40)).max(10),
  })
  .refine(
    (p) => p.caption.length >= 3 || p.media.length > 0,
    "En az 3 karakter metin veya bir görsel ekle.",
  );
export const commentSchema = z
  .string()
  .trim()
  .min(1, "Boş yorum gönderilemez.")
  .max(500, "Yorum en fazla 500 karakter olabilir.");
export async function validateImage(file: File) {
  if (file.size > 10 * 1024 * 1024)
    throw new Error("Görsel en fazla 10 MB olabilir.");
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = b[0] === 255 && b[1] === 216 && b[2] === 255;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v);
  const webp =
    String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  if (!(
    (jpeg && file.type === "image/jpeg") ||
    (png && file.type === "image/png") ||
    (webp && file.type === "image/webp")
  ))
    throw new Error("Gerçek bir JPEG, PNG veya WebP görseli seç.");
}
