"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Link as LinkIcon,
  ArrowUpRight,
  Flag,
  ShieldBan,
} from "lucide-react";
import { usePapi } from "@/components/provider";
import { Avatar, Empty, Modal } from "@/components/ui";
import { PostCard, ReportDialog, shareLink } from "@/components/post-card";
import { visiblePosts } from "@/lib/model";
export function ProfilePage({ username }: { username: string }) {
  const { state, userId, act, toast, search } = usePapi(),
    [tab, setTab] = useState("Paylaşımlar"),
    [report, setReport] = useState(false),
    [avatar, setAvatar] = useState(false),
    [relations, setRelations] = useState<"followers" | "following" | null>(
      null,
    );
  useEffect(()=>{search({tab});},[tab,search]);
  if (!state) return null;
  const profile = state.profiles.find((p) => p.username === username);
  if (!profile) return <Empty title="Bu profil bulunamadı." />;
  const own = profile.id === userId,
    followed = state.follows.some(
      (f) => f.userId === userId && f.targetId === profile.id,
    ),
    blocked = state.blocks.some(
      (b) => b.userId === userId && b.targetId === profile.id,
    ),
    all = visiblePosts(state, userId);
  let posts = all.filter((p) => p.authorId === profile.id);
  if (tab === "Medya") posts = posts.filter((p) => p.media.length);
  if (tab === "Beğeniler")
    posts = all.filter((p) =>
      state.likes.some((l) => l.userId === userId && l.targetId === p.id),
    );
  if (tab === "Kaydedilenler")
    posts = all.filter((p) =>
      state.bookmarks.some((l) => l.userId === userId && l.targetId === p.id),
    );
  const followers = state.follows.filter((f) => f.targetId === profile.id),
    following = state.follows.filter((f) => f.userId === profile.id);
  return (
    <>
      <section className="profile-panel">
        <img
          className="profile-cover"
          src={profile.cover || "/art/scene-0.svg"}
          alt="Profil kapak görseli"
        />
        <div className="profile-info">
          <div className="profile-top">
            <button
              className="avatar-button"
              aria-label="Profil fotoğrafını büyüt"
              onClick={() => setAvatar(true)}
            >
              <Avatar profile={profile} size={88} />
            </button>
            <div className="profile-buttons">
              {own ? (
                <Link href="/settings" className="button secondary">
                  Profili düzenle
                </Link>
              ) : (
                <button
                  className="button primary"
                  onClick={() => void act({ type: "follow", id: profile.id })}
                >
                  {followed ? "Takiptesin" : "Takip et"}
                </button>
              )}
              <button
                className="icon-button"
                aria-label="Profili paylaş"
                onClick={() => void shareLink(`/u/${username}`, toast)}
              >
                <ArrowUpRight />
              </button>
            </div>
          </div>
          <h1>{profile.name}</h1>
          <p className="muted">@{profile.username}</p>
          <p className="bio">{profile.bio}</p>
          <div className="profile-meta">
            {profile.location && (
              <span>
                <MapPin size={15} />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon size={15} />
                Web sitesi
              </a>
            )}
            <span>
              {new Date(profile.createdAt).toLocaleDateString("tr", {
                month: "long",
                year: "numeric",
              })}{" "}
              tarihinde katıldı
            </span>
          </div>
          <div className="profile-counts">
            <span>
              <strong>
                {profile.postCount ??
                  all.filter((p) => p.authorId === profile.id).length}
              </strong>{" "}
              paylaşım
            </span>
            <button onClick={() => setRelations("followers")}>
              <strong>{profile.followerCount ?? followers.length}</strong>{" "}
              takipçi
            </button>
            <button onClick={() => setRelations("following")}>
              <strong>{profile.followingCount ?? following.length}</strong>{" "}
              takip edilen
            </button>
          </div>
          {!own && userId && (
            <div className="profile-tools">
              <button onClick={() => setReport(true)}>
                <Flag size={14} />
                Bildir
              </button>
              <button
                onClick={() => void act({ type: "block", id: profile.id })}
              >
                <ShieldBan size={14} />
                {blocked ? "Engeli kaldır" : "Engelle"}
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="feed-tabs">
        {[
          "Paylaşımlar",
          "Medya",
          ...(own ? ["Beğeniler", "Kaydedilenler"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {posts.length ? (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      ) : (
        <Empty
          title={blocked ? "Bu hesabı engelledin." : "Henüz paylaşım yok."}
        />
      )}
      <ReportDialog
        targetId={profile.id}
        kind="profile"
        open={report}
        onClose={() => setReport(false)}
      />
      <Modal
        open={avatar}
        onClose={() => setAvatar(false)}
        title={profile.name}
      >
        <img className="full-avatar" src={profile.avatar} alt={profile.name} />
      </Modal>
      <Modal
        open={!!relations}
        onClose={() => setRelations(null)}
        title={relations === "followers" ? "Takipçiler" : "Takip edilenler"}
      >
        {(relations === "followers" ? followers : following).map((r) => {
          const p = state.profiles.find(
            (p) => p.id === (relations === "followers" ? r.userId : r.targetId),
          );
          return p ? (
            <Link
              className="suggestion"
              onClick={() => setRelations(null)}
              href={`/u/${p.username}`}
              key={p.id}
            >
              <Avatar profile={p} />
              {p.name}
            </Link>
          ) : null;
        })}
        {(relations === "followers" ? followers : following).length === 0 && (
          <p>Henüz kimse yok.</p>
        )}
      </Modal>
    </>
  );
}
