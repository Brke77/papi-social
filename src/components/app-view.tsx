"use client";
import Link from "next/link";
import { usePapi } from "./provider";
import { Shell } from "./shell";
import { Empty } from "./ui";
import { Feed } from "@/features/feed";
import { Composer } from "@/features/composer";
import { ProfilePage } from "@/features/profile";
import { Settings } from "@/features/settings";
import { Notifications, Moderation } from "@/features/notifications";
import { PostCard } from "./post-card";
import { visiblePosts } from "@/lib/model";
import { Chat } from "@/features/chat";
export function AppView({
  route,
  query = "",
  category = "",
  edit = "",
}: {
  route: string[];
  query?: string;
  category?: string;
  edit?: string;
}) {
  const { state, userId, loading, error, refresh } = usePapi();
  const name = route[0];
  let content;
  if (loading)
    content = (
      <div className="skeleton" role="status" aria-label="Yükleniyor">
        <div />
        <div />
        <div />
      </div>
    );
  else if (error)
    content = (
      <div className="empty">
        <h2>Bağlantı kurulamadı.</h2>
        <p className="error">{error}</p>
        <button className="button primary" onClick={() => void refresh()}>
          Tekrar dene
        </button>
      </div>
    );
  else if (
    !userId &&
    [
      "create",
      "settings",
      "saved",
      "notifications",
      "admin",
      "messages",
    ].includes(name)
  )
    content = (
      <div className="empty">
        <h2>Dünyaya katıl.</h2>
        <p>Bu alanı kullanmak için giriş yap.</p>
        <Link className="button primary" href="/login">
          Giriş yap
        </Link>
      </div>
    );
  else if (state) {
    if (["feed", "explore", "search", "saved"].includes(name))
      content = (
        <Feed
          kind={name as "feed" | "explore" | "search" | "saved"}
          query={query}
          initialCategory={category}
        />
      );
    else if (name === "messages")
      content = <Chat key={query} username={query} />;
    else if (name === "create") content = <Composer edit={edit} />;
    else if (name === "u") content = <ProfilePage username={route[1]} />;
    else if (name === "settings") content = <Settings />;
    else if (name === "notifications") content = <Notifications />;
    else if (name === "admin") content = <Moderation />;
    else if (name === "p") {
      const post = visiblePosts(state, userId).find((p) => p.id === route[1]);
      content = post ? (
        <>
          <div className="page-heading">
            <div className="eyebrow">BİR HİKÂYENİN DETAYLARI</div>
            <h1>Bir an. Bir flex.</h1>
          </div>
          <PostCard post={post} detail />
          <Link
            className="button secondary"
            href={`/explore?category=${encodeURIComponent(post.category)}`}
          >
            Benzer paylaşımları keşfet
          </Link>
        </>
      ) : (
        <Empty
          title="Gönderi bulunamadı."
          text="Silinmiş, gizlenmiş veya erişime kapalı olabilir."
        />
      );
    }
  }
  return <Shell>{content}</Shell>;
}
