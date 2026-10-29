"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  ArrowLeft,
  ArrowRight,
  X,
  ArrowUpRight,
} from "lucide-react";
import { usePapi } from "@/components/provider";
import { categories, type Post } from "@/lib/model";
import { postSchema } from "@/lib/validation";
export function Composer({ edit }: { edit?: string }) {
  const { state, userId, act, upload, toast } = usePapi(),
    router = useRouter();
  const existing = state?.posts.find((p) => p.id === edit);
  const [caption, setCaption] = useState(existing?.caption || ""),
    [category, setCategory] = useState(existing?.category || "Lifestyle"),
    [media, setMedia] = useState<string[]>(existing?.media || []),
    [tags, setTags] = useState(existing?.tags.join(" ") || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (edit && (!existing || existing.authorId !== userId))
    return <p>Bu gönderiyi düzenleme yetkin yok.</p>;
  async function files(list: FileList | null) {
    if (!list) return;
    setBusy(true);
    setError("");
    try {
      if (media.length + list.length > 4)
        throw new Error("En fazla 4 görsel ekleyebilirsin.");
      const results: string[] = [];
      for (const file of Array.from(list)) results.push(await upload(file));
      setMedia((m) => [...m, ...results]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  function move(i: number, delta: number) {
    setMedia((old) => {
      const a = [...old];
      [a[i], a[i + delta]] = [a[i + delta], a[i]];
      return a;
    });
  }
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">MAKE IT YOURS</div>
        <h1>{edit ? "Flex’ini düzenle." : "Dünyanı paylaş."}</h1>
        <p>Büyük ya da küçük. Sana ait her hikâye burada değerli.</p>
      </div>
      <form
        className="panel form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            const data = postSchema.parse({
              caption,
              category,
              media,
              tags: [...new Set(tags.split(/[\s,#]+/).filter(Boolean))],
            });
            const post: Post = {
              ...data,
              id: existing?.id || crypto.randomUUID(),
              authorId: userId!,
              createdAt: existing?.createdAt || new Date().toISOString(),
              hidden: false,
            };
            if (await act({ type: "post", post })) {
              toast("Flex’in yayında. ✨");
              router.push(`/p/${post.id}`);
            }
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Paylaşım oluşturulamadı.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="upload-zone">
          <ImagePlus size={38} />
          <strong>Bir kare, bin hikâye.</strong>
          <span>Fotoğraf seçmek için tıkla</span>
          <small>JPEG, PNG, WebP · Her biri en fazla 10 MB · 4 görsel</small>
          <input
            type="file"
            aria-label="Fotoğraf yükle"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(e) => {
              void files(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {media.length > 0 && (
          <div className="upload-previews">
            {media.map((src, i) => (
              <div key={i}>
                <img src={src} alt={`${i + 1}. görsel önizlemesi`} />
                <div>
                  {i > 0 && (
                    <button
                      type="button"
                      aria-label="Görseli sola taşı"
                      onClick={() => move(i, -1)}
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  {i < media.length - 1 && (
                    <button
                      type="button"
                      aria-label="Görseli sağa taşı"
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Görseli kaldır"
                    onClick={() => setMedia((m) => m.filter((_, n) => n !== i))}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <label>
          Hikâyen
          <textarea
            placeholder="Bu flex’in hikâyesi ne?"
            maxLength={2000}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <small>{caption.length} / 2.000</small>
        </label>
        <label>
          Kategori
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Flex tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="#ownyourflex #details"
          />
          <small>En fazla 10 etiket; boşlukla ayır.</small>
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="button primary" disabled={busy}>
          {busy
            ? "Hazırlanıyor…"
            : edit
              ? "Değişiklikleri kaydet"
              : "Flex’ini paylaş"}
          <ArrowUpRight size={18} />
        </button>
      </form>
    </>
  );
}
