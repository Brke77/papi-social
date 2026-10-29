"use client";
import Link from "next/link";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { usePapi } from "@/components/provider";
import { Avatar, Empty } from "@/components/ui";
export function Notifications() {
  const { state, userId, act } = usePapi();
  const notices = state!.notifications.filter((n) => n.recipientId === userId);
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">BAĞLANTIDA KAL</div>
        <h1>Bildirimler.</h1>
        <p>Dünyanda olup bitenler.</p>
      </div>
      {notices.length ? (
        <>
          <button
            className="button secondary"
            onClick={() => void act({ type: "read" })}
          >
            Tümünü okundu işaretle
          </button>
          <div className="notification-list">
            {notices.map((n) => {
              const p = state!.profiles.find((p) => p.id === n.actorId),
                Icon =
                  n.type === "like"
                    ? Heart
                    : n.type === "follow"
                      ? UserPlus
                      : MessageCircle;
              return (
                <article
                  key={n.id}
                  className={n.read ? "notification" : "notification unread"}
                >
                  <Avatar profile={p} />
                  <Link
                    href={
                      n.type === "follow"
                        ? `/u/${p?.username}`
                        : `/p/${n.targetId}`
                    }
                    onClick={() => void act({ type: "read", id: n.id })}
                  >
                    <strong>{p?.name}</strong>
                    <p>
                      {n.type === "like"
                        ? "gönderini beğendi."
                        : n.type === "follow"
                          ? "seni takip etmeye başladı."
                          : "gönderine yorum yaptı."}
                    </p>
                    <small>
                      {new Date(n.createdAt).toLocaleDateString("tr")}
                    </small>
                  </Link>
                  <Icon size={19} />
                  {!n.read && (
                    <button
                      className="icon-button"
                      aria-label="Okundu işaretle"
                      onClick={() => void act({ type: "read", id: n.id })}
                    >
                      ●
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <Empty
          title="Şimdilik her şey sakin."
          text="Yeni etkileşimlerin burada görünecek."
        />
      )}
    </>
  );
}
export function Moderation() {
  const { state, userId, act } = usePapi();
  if (state?.profiles.find((p) => p.id === userId)?.role !== "moderator")
    return (
      <Empty
        title="Bu alana erişim yetkin yok."
        text="Moderasyon yalnızca yetkili hesaplara açıktır."
      />
    );
  return (
    <>
      <div className="page-heading">
        <h1>Raporlar.</h1>
        <p>Topluluk moderasyonu</p>
      </div>
      {state.reports.length ? (
        state.reports.map((r) => (
          <article className="panel" key={r.id}>
            <h3>
              {r.reason} · {r.kind === "post" ? "Gönderi" : "Hesap"}
            </h3>
            <p>{r.kind==='post'?state.posts.find(p=>p.id===r.targetId)?.caption||'Gönderi silinmiş veya henüz yüklenmemiş.':state.profiles.find(p=>p.id===r.targetId)?.name||'Hesap bulunamadı.'}</p>
            <small>İçerik kimliği: {r.targetId}</small>
            <small>
              {new Date(r.createdAt).toLocaleString("tr")} · {r.status}
            </small>
            {r.status === "open" && (
              <div className="button-row">
                {r.kind === "post" && (
                  <button
                    className="button danger"
                    onClick={() =>
                      void act({ type: "moderate", id: r.id, hide: true })
                    }
                  >
                    İçeriği gizle
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={() =>
                    void act({ type: "moderate", id: r.id, hide: false })
                  }
                >
                  Sonuçlandır
                </button>
              </div>
            )}
          </article>
        ))
      ) : (
        <Empty title="Açık rapor yok." />
      )}
    </>
  );
}
