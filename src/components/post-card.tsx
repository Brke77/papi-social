"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ArrowUpRight,
  MoreHorizontal,
  Send,
  Trash2,
  Flag,
  Pencil,
} from "lucide-react";
import type { Post } from "@/lib/model";
import { usePapi } from "./provider";
import { Avatar, Modal } from "./ui";
export async function shareLink(path: string, toast: (s: string) => void) {
  try {
    const url = new URL(path, window.location.origin).href;
    if (navigator.share)
      await navigator.share({ url, title: "PAPI · Your world. Your flex." });
    else await navigator.clipboard.writeText(url);
    toast("Bağlantı paylaşıldı.");
  } catch (e) {
    if (!(e instanceof DOMException && e.name === "AbortError"))
      toast(
        "Bağlantı kopyalanamadı. Adres çubuğundaki bağlantıyı kullanabilirsin.",
      );
  }
}
export function ReportDialog({
  targetId,
  kind,
  open,
  onClose,
}: {
  targetId: string;
  kind: "post" | "profile";
  open: boolean;
  onClose: () => void;
}) {
  const { act } = usePapi();
  const [reason, setReason] = useState("Spam"),
    [busy, setBusy] = useState(false);
  return (
    <Modal open={open} onClose={onClose} title="İçeriği bildir">
      <p className="muted">
        Topluluğun güvenliği için teşekkürler. Bildirimin incelenecek.
      </p>
      <label>
        Bildirim nedeni
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {[
            "Spam",
            "Taciz",
            "Nefret söylemi",
            "Taklit hesap",
            "Uygunsuz içerik",
            "Diğer",
          ].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <button
        className="button primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          if (await act({ type: "report", targetId, kind, reason })) onClose();
          setBusy(false);
        }}
      >
        Bildirimi gönder
      </button>
    </Modal>
  );
}
export function PostCard({
  post,
  detail = false,
}: {
  post: Post;
  detail?: boolean;
}) {
  const { state, userId, act, toast } = usePapi();
  const [menu, setMenu] = useState(false),
    [report, setReport] = useState(false),
    [remove, setRemove] = useState(false),
    [comment, setComment] = useState(""),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false);
  if (!state) return null;
  const author = state.profiles.find((p) => p.id === post.authorId),
    likes = state.likes.filter((l) => l.targetId === post.id),
    liked = likes.some((l) => l.userId === userId),
    saved = state.bookmarks.some(
      (l) => l.userId === userId && l.targetId === post.id,
    ),
    comments = state.comments.filter((c) => c.postId === post.id);
  const toggle = async (type: "like" | "bookmark") => {
    if (busy) return;
    setBusy(true);
    await act({ type, id: post.id });
    setBusy(false);
  };
  return (
    <article className="post-card">
      <div className="post-header">
        <Link href={`/u/${author?.username}`}>
          <Avatar profile={author} />
        </Link>
        <div className="post-author">
          <Link href={`/u/${author?.username}`}>
            <strong>{author?.name ?? "PAPI üyesi"}</strong>
          </Link>
          <small>
            @{author?.username} <span>·</span>{" "}
            {new Intl.DateTimeFormat("tr", {
              day: "numeric",
              month: "short",
            }).format(new Date(post.createdAt))}
          </small>
        </div>
        <Link
          className="category-label"
          href={`/explore?category=${encodeURIComponent(post.category)}`}
        >
          {post.category}
        </Link>
        <button
          className="icon-button"
          onClick={() => setMenu(!menu)}
          aria-label="Gönderi seçenekleri"
          aria-expanded={menu}
        >
          <MoreHorizontal size={21} />
        </button>
        {menu && (
          <div className="post-menu">
            {post.authorId === userId ? (
              <>
                <Link href={`/create?edit=${post.id}`}>
                  <Pencil size={16} />
                  Düzenle
                </Link>
                <button
                  onClick={() => {
                    setRemove(true);
                    setMenu(false);
                  }}
                >
                  <Trash2 size={16} />
                  Sil
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setReport(true);
                  setMenu(false);
                }}
              >
                <Flag size={16} />
                Bildir
              </button>
            )}
          </div>
        )}
      </div>
      {post.media.length > 0 && (
        <div
          className="post-media"
          onDoubleClick={() => !liked && void toggle("like")}
        >
          <Link href={`/p/${post.id}`} tabIndex={detail ? -1 : 0}>
            <img
              src={post.media[index] || post.media[0]}
              alt={`${post.category} — ${post.caption.slice(0, 90)}`}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/art/scene-0.svg";
              }}
            />
          </Link>
          <span className="media-category">{post.category.toUpperCase()}</span>
          {post.media.length > 1 && (
            <div className="media-dots">
              {post.media.map((_, i) => (
                <button
                  key={i}
                  className={i === index ? "selected" : ""}
                  aria-label={`${i + 1}. görsel`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <div className="post-body">
        <div className="post-actions">
          <button
            aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
            aria-pressed={liked}
            className={liked ? "liked" : ""}
            disabled={busy}
            onClick={() => void toggle("like")}
          >
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
            <span>{post.likeCount ?? likes.length}</span>
          </button>
          <Link href={`/p/${post.id}`} aria-label="Yorumlar">
            <MessageCircle size={22} />
            <span>{post.commentCount ?? comments.length}</span>
          </Link>
          <button
            aria-label="Paylaş"
            onClick={() => void shareLink(`/p/${post.id}`, toast)}
          >
            <ArrowUpRight size={22} />
          </button>
          <button
            className={saved ? "save saved" : "save"}
            aria-label={saved ? "Kaydı kaldır" : "Kaydet"}
            aria-pressed={saved}
            disabled={busy}
            onClick={() => void toggle("bookmark")}
          >
            <Bookmark size={22} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="caption">
          <Link href={`/u/${author?.username}`}>
            <strong>{author?.username}</strong>
          </Link>{" "}
          {post.caption}
        </p>
        <div className="tags">
          {post.tags.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}>
              #{t}
            </Link>
          ))}
        </div>
        {!detail && (post.commentCount ?? comments.length) > 0 && (
          <Link className="comment-link" href={`/p/${post.id}`}>
            {post.commentCount ?? comments.length} yorumu gör
          </Link>
        )}
        {detail && (
          <div className="comments">
            <h3>Konuşmaya katıl</h3>
            {comments.map((c) => {
              const p = state.profiles.find((p) => p.id === c.authorId);
              return (
                <div className="comment" key={c.id}>
                  <Avatar profile={p} size={30} />
                  <div>
                    <strong>{p?.username}</strong>
                    <p>{c.text}</p>
                  </div>
                  {c.authorId === userId && (
                    <button
                      className="icon-button"
                      aria-label="Yorumu sil"
                      onClick={() =>
                        void act({ type: "deleteComment", id: c.id })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
            {userId ? (
              <form
                className="comment-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  if (
                    await act({
                      type: "comment",
                      postId: post.id,
                      text: comment,
                    })
                  )
                    setComment("");
                  setBusy(false);
                }}
              >
                <input
                  aria-label="Yorumun"
                  placeholder="Bir şeyler söyle…"
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  aria-label="Yorum gönder"
                  disabled={busy || !comment.trim()}
                >
                  <Send size={19} />
                </button>
              </form>
            ) : (
              <Link href="/login" className="text-link">
                Yorum yapmak için giriş yap
              </Link>
            )}
          </div>
        )}
      </div>
      <ReportDialog
        targetId={post.id}
        kind="post"
        open={report}
        onClose={() => setReport(false)}
      />
      <Modal
        open={remove}
        onClose={() => setRemove(false)}
        title="Gönderi silinsin mi?"
      >
        <p>Bu işlem geri alınamaz. Gönderi ve yorumları kaldırılacak.</p>
        <button
          className="button danger"
          onClick={async () => {
            await act({ type: "deletePost", id: post.id });
            setRemove(false);
          }}
        >
          Gönderiyi sil
        </button>
      </Modal>
    </article>
  );
}
