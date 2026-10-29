"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Plus,
  Bookmark,
  Bell,
  Settings,
  Search,
  ArrowUpRight,
  LogOut,
  Shield,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";
import { usePapi } from "./provider";
import { Avatar } from "./ui";
import { mode, visiblePosts } from "@/lib/model";
import type { ReactNode } from "react";
export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    { state, userId, logout, act } = usePapi();
  const me = state?.profiles.find((p) => p.id === userId);
  const links = [
    { href: "/feed", label: "Ana sayfa", icon: Home },
    { href: "/explore", label: "Keşfet", icon: Compass },
    { href: "/saved", label: "Kaydedilenler", icon: Bookmark },
    { href: "/notifications", label: "Bildirimler", icon: Bell },
    {
      href: me ? `/u/${me.username}` : "/login",
      label: "Profilim",
      icon: LayoutGrid,
    },
  ];
  links.push({ href: "/messages", label: "Mesajlar", icon: MessageCircle });
  const tags = state
    ? Object.entries(
        visiblePosts(state, userId)
          .flatMap((p) => p.tags)
          .reduce<Record<string, number>>(
            (a, t) => ({ ...a, [t]: (a[t] || 0) + 1 }),
            {},
          ),
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
    : [];
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        İçeriğe atla
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          PAPI<span>®</span>
        </Link>
        <p className="eyebrow sidebar-caption">YOUR WORLD. YOUR FLEX.</p>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              className={path === href ? "nav-link active" : "nav-link"}
              href={href}
            >
              <Icon size={21} />
              <span>{label}</span>
              {label === "Bildirimler" &&
                state?.notifications.some(
                  (n) => n.recipientId === userId && !n.read,
                ) && <i className="dot" />}
            </Link>
          ))}
        </nav>
        <Link href="/create" className="button primary create-nav">
          <Plus size={20} />
          <span>Yeni bir flex paylaş</span>
        </Link>
        <div className="sidebar-bottom">
          <Link href="/settings" className="nav-link">
            <Settings size={20} />
            <span>Ayarlar</span>
          </Link>
          {me?.role === "moderator" && (
            <Link href="/admin/reports" className="nav-link">
              <Shield size={20} />
              <span>Moderasyon</span>
            </Link>
          )}
          <div className="demo-badge">
            {mode === "demo" ? "● DEMO MODE" : "● PAPI"}
          </div>
          {me ? (
            <div className="account">
              <Avatar profile={me} />
              <Link href={`/u/${me.username}`}>
                <strong>{me.name}</strong>
                <small>@{me.username}</small>
              </Link>
              <button
                aria-label="Çıkış yap"
                className="icon-button"
                onClick={() => void logout()}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="button secondary">
              Giriş yap <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Link href="/messages" aria-label="Mesajlar"><MessageCircle size={21}/></Link>
          <div>
            <span className="live-dot" /> Biraz ilham. Biraz sen.
          </div>
          <Link href="/search" className="search-shortcut">
            <Search size={17} />
            <span>PAPI’de ara</span>
            <kbd>↗</kbd>
          </Link>
          <Link href={me ? `/u/${me.username}` : "/login"}>
            <Avatar profile={me} size={34} />
          </Link>
        </header>
        <div className="columns">
          <main id="main">{children}</main>
          <aside className="rightbar">
            <div className="spotlight">
              <div className="eyebrow">
                <span className="live-dot" /> WEEKLY SPOTLIGHT
              </div>
              <h2>
                İyi bir hikâye,
                <br />
                seninle başlar.
              </h2>
              <p>
                Biriktirdiklerin. Ürettiklerin.
                <br />
                Seni sen yapan her şey.
              </p>
              <Link href="/explore" className="text-link">
                Haftayı keşfet <ArrowUpRight size={18} />
              </Link>
              <span className="spotlight-art">P.</span>
            </div>
            <section className="rail-section">
              <div className="section-label">
                <h3>Radarına al</h3>
                <Link href="/search">
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              {state?.profiles
                .filter(
                  (p) =>
                    p.id !== userId &&
                    !state.blocks.some(
                      (b) => b.userId === userId && b.targetId === p.id,
                    ),
                )
                .slice(1, 4)
                .map((p) => (
                  <div className="suggestion" key={p.id}>
                    <Link href={`/u/${p.username}`}>
                      <Avatar profile={p} />
                    </Link>
                    <Link href={`/u/${p.username}`}>
                      <strong>{p.name}</strong>
                      <small>@{p.username}</small>
                    </Link>
                    <button
                      className="follow-small"
                      aria-label={`${p.name} takip et`}
                      onClick={() => void act({ type: "follow", id: p.id })}
                    >
                      {state.follows.some(
                        (f) => f.userId === userId && f.targetId === p.id,
                      )
                        ? "Takiptesin"
                        : "Takip et"}
                    </button>
                  </div>
                ))}
            </section>
            <section className="rail-section">
              <h3>Şu an konuşulanlar</h3>
              {tags.map(([t, n], i) => (
                <Link
                  className="trend"
                  href={`/search?q=${encodeURIComponent(t)}`}
                  key={t}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <strong>#{t}</strong>
                    <small>{n} paylaşım</small>
                  </div>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </section>
            <footer className="rail-footer">
              <Link href="/privacy">Gizlilik</Link>
              <Link href="/terms">Koşullar</Link>
              <Link href="/community-guidelines">Topluluk</Link>
              <p>
                © {new Date().getFullYear()} PAPI. Kendi dünyan, kendi
                kuralların.
              </p>
              {mode === "demo" && (
                <p>
                  Yerel demo · Gerçek bir online sosyal ağ değildir. Tüm
                  profiller kurgusaldır.
                </p>
              )}
            </footer>
          </aside>
        </div>
      </div>
      <nav className="mobile-nav">
        {[
          links[0],
          links[1],
          { href: "/create", label: "Paylaş", icon: Plus },
          links[3],
          links[4],
        ].map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={label}
            className={path === href ? "active" : ""}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
