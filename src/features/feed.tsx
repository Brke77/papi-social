"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Plus,
  ImagePlus,
} from "lucide-react";
import { usePapi } from "@/components/provider";
import { Avatar, Empty } from "@/components/ui";
import { PostCard } from "@/components/post-card";
import { categories, visiblePosts, rankPosts, mode } from "@/lib/model";
export function Feed({
  kind = "feed",
  query = "",
  initialCategory = "",
}: {
  kind?: "feed" | "explore" | "search" | "saved";
  query?: string;
  initialCategory?: string;
}) {
  const { state, userId, loadMore, search: searchRemote } = usePapi(),
    [tab, setTab] = useState("Sana özel"),
    [category, setCategory] = useState(initialCategory),
    [search, setSearch] = useState(query),
    [debounced, setDebounced] = useState(query),
    [count, setCount] = useState(8),
    [busy, setBusy] = useState(false),
    [now] = useState(() => Date.now());
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setCount(8);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    searchRemote({ q: debounced, category, tab });
  }, [debounced, category, tab, searchRemote]);
  if (!state) return null;
  const me = state.profiles.find((p) => p.id === userId);
  let posts = visiblePosts(state, userId);
  if (kind === "saved")
    posts = posts.filter((p) =>
      state.bookmarks.some((b) => b.userId === userId && b.targetId === p.id),
    );
  if (tab === "Takip ettiklerin")
    posts = posts.filter((p) =>
      state.follows.some(
        (f) => f.userId === userId && f.targetId === p.authorId,
      ),
    );
  if (category) posts = posts.filter((p) => p.category === category);
  const q = debounced.toLocaleLowerCase("tr").replace(/^#/, "");
  if (q)
    posts = posts.filter((p) =>
      [
        p.caption,
        p.category,
        ...p.tags,
        state.profiles.find((u) => u.id === p.authorId)?.username,
      ]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(q),
    );
  posts =
    tab === "En yeni" || tab === "Takip ettiklerin"
      ? [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : rankPosts(posts, state, now, userId);
  if (tab === "Bu hafta")
    posts = posts.filter(
      (p) => Date.parse(p.createdAt) >= now - 7 * 86400000,
    );
  const people = q
    ? state.profiles.filter(
        (p) =>
          `${p.name} ${p.username}`.toLocaleLowerCase("tr").includes(q) &&
          !state.blocks.some((b) => b.userId === userId && b.targetId === p.id),
      )
    : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {kind === "feed"
              ? "THE DAILY EDIT"
              : kind === "saved"
                ? "SANA AİT BİR SEÇKİ"
                : "FIND YOUR NEXT OBSESSION"}
          </div>
          <h1>
            {kind === "feed"
              ? "Senin dünyan."
              : kind === "explore"
                ? "Keşfet."
                : kind === "saved"
                  ? "Kaydettiklerin."
                  : "İlhamı bul."}
            <span className="accent">
              {kind === "feed" ? " Senin akışın." : ""}
            </span>
          </h1>
          <p>
            {kind === "feed"
              ? "İlham veren insanlar, paylaşmaya değer anlar."
              : kind === "saved"
                ? "Dönüp tekrar bakmak isteyeceğin her şey."
                : "Tarzları, tutkuları ve yeni perspektifleri keşfet."}
          </p>
        </div>
        <span className="heading-symbol">✳</span>
      </div>
      {kind === "feed" && (
        <>
          <div className="creator-strip">
            {state.profiles.slice(0, 8).map((p, i) => (
              <Link href={i === 0 ? "/create" : `/u/${p.username}`} key={p.id}>
                <div className={i === 0 ? "creator-ring own" : "creator-ring"}>
                  <Avatar profile={p} size={57} />
                  {i === 0 && (
                    <span>
                      <Plus size={13} />
                    </span>
                  )}
                </div>
                <small>
                  {i === 0 ? "Senin flex’in" : p.name.split(" ")[0]}
                </small>
              </Link>
            ))}
          </div>
          <Link href="/create" className="composer-shortcut">
            <Avatar profile={me} />
            <span>Bugün dünyanda neler var?</span>
            <ImagePlus size={21} />
            <b>
              Paylaş <ArrowUpRight size={16} />
            </b>
          </Link>
        </>
      )}
      {(kind === "search" || kind === "explore") && (
        <div className="search-field">
          <Search size={21} />
          <input
            aria-label="PAPI'de ara"
            placeholder="İnsan, paylaşım, etiket veya kategori ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      {kind !== "saved" && (
        <>
          <div className="feed-tabs">
            {(kind === "feed"
              ? ["Sana özel", "Takip ettiklerin"]
              : ["Öne çıkanlar", "Bu hafta", "En yeni"]
            ).map((t) => (
              <button
                className={
                  tab === t || (tab === "Sana özel" && t === "Öne çıkanlar")
                    ? "selected"
                    : ""
                }
                key={t}
                onClick={() => {
                  setTab(t);
                  setCount(8);
                }}
              >
                {t}
              </button>
            ))}
            <SlidersHorizontal size={17} />
          </div>
          <div className="category-list">
            {["", ...categories].map((c) => (
              <button
                key={c}
                className={category === c ? "selected" : ""}
                onClick={() => {
                  setCategory(c);
                  setCount(8);
                }}
              >
                {c || "Tümü"}
              </button>
            ))}
          </div>
        </>
      )}
      {people.length > 0 && (
        <section className="people-results">
          <h3>İnsanlar</h3>
          {people.map((p) => (
            <Link href={`/u/${p.username}`} key={p.id}>
              <Avatar profile={p} />
              <div>
                <strong>{p.name}</strong>
                <small>@{p.username}</small>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          ))}
        </section>
      )}
      {posts.length === 0 ? (
        <Empty
          title={
            kind === "saved"
              ? "İlk ilhamını kaydet."
              : "Henüz eşleşen paylaşım yok."
          }
          text="Filtreleri değiştirebilir veya yeni insanları keşfedebilirsin."
        />
      ) : kind === "explore" ? (
        <div className="explore-grid">
          {posts.slice(0, count).map((p) => (
            <Link href={`/p/${p.id}`} className="explore-tile" key={p.id}>
              <img
                src={p.media[0] || "/art/scene-0.svg"}
                alt={p.caption}
                loading="lazy"
              />
              <span>
                {p.category}
                <strong>{p.caption}</strong>
              </span>
              <ArrowUpRight size={24} />
            </Link>
          ))}
        </div>
      ) : (
        posts.slice(0, count).map((p) => <PostCard key={p.id} post={p} />)
      )}
      {(posts.length > count || mode === "supabase") && (
        <button
          className="button secondary load-more"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              if (mode === "supabase") await loadMore();
              setCount((c) => c + 8);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Yükleniyor…" : "Daha fazla keşfet"}
        </button>
      )}
    </>
  );
}
