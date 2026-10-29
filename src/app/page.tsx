import Link from "next/link";
import { ArrowUpRight, ArrowDown, Globe, Layers, Sparkles } from "lucide-react";
export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          PAPI<span>®</span>
        </Link>
        <div>
          <Link href="/explore">Keşfet</Link>
          <Link href="/community-guidelines">Topluluk</Link>
          <Link href="/login" className="button secondary">
            Giriş yap <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> THE WORLD IS YOUR CANVAS
            </div>
            <h1>
              Dünyan
              <br />
              görülmeye
              <br />
              <em>değer.</em>
              <span className="hero-star">✳</span>
            </h1>
            <p>
              Sevdiğin şeyleri paylaş. Kendi insanlarını bul.
              <br />
              Her anın sana ait bir flex olsun.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/login">
                Demo’yu dene <ArrowUpRight size={20} />
              </Link>
              <Link className="button text" href="/explore">
                PAPI’yi keşfet <ArrowUpRight size={18} />
              </Link>
            </div>
            <div className="hero-proof">
              <div>
                {[0, 1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`/art/avatar-${i}.svg`}
                    alt="Kurgusal demo profil"
                  />
                ))}
              </div>
              <p>
                Farklı dünyalar. Ortak bir tutku.
                <small>Yaratıcılığın yeni buluşma noktası.</small>
              </p>
            </div>
          </div>
          <div className="hero-collage">
            <div className="hero-card card-back">
              <img
                src="/art/scene-3.svg"
                alt="Özgün mimari ve seyahat illüstrasyonu"
              />
              <span>GO SOMEWHERE NEW ↗</span>
            </div>
            <div className="hero-card card-front">
              <div>
                <img src="/art/avatar-1.svg" alt="Demo avatar" />
                <strong>miraekin</strong>
                <span>✳</span>
              </div>
              <img
                src="/art/scene-0.svg"
                alt="Lime renkli sneaker, özgün PAPI illüstrasyonu"
              />
              <footer>
                <strong>Every detail matters.</strong>
                <span>#ownyourflex</span>
              </footer>
            </div>
            <div className="floating-label">✦ MADE OF WHAT YOU LOVE.</div>
            <div className="collage-index">001 — THE PAPI EDIT</div>
          </div>
        </section>
        <div className="marquee">
          <span>STYLE</span>✳<span>CULTURE</span>✳<span>CREATIVITY</span>✳
          <span>YOUR WORLD</span>✳<span>NO LIMITS</span>
        </div>
        <section className="landing-section">
          <div className="section-intro">
            <div>
              <div className="eyebrow">
                PAHALI OLMAK ZORUNDA DEĞİL. SANA AİT OLSUN.
              </div>
              <h2>
                Bir tutkudan
                <br />
                bir dünyaya.
              </h2>
            </div>
            <p>
              Kurduğun masa. Yakaladığın kare.
              <br />
              İlk koleksiyonun. Son başarın.
              <br />
              Hikâyeni anlatmanın tek bir yolu yok.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: Globe,
                title: "Kendi insanlarını bul.",
                text: "Ortak tutkular etrafında yeni bakış açıları keşfet.",
              },
              {
                icon: Layers,
                title: "İlhamını biriktir.",
                text: "Sevdiğin detayları kaydet. Kendi seçkini oluştur.",
              },
              {
                icon: Sparkles,
                title: "İzini bırak.",
                text: "Ürettiklerini paylaş. Kendi hikâyenin merkezinde ol.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="landing-gallery">
            {[1, 2, 4].map((n, i) => (
              <Link href={`/p/post-${n}`} key={n}>
                <img
                  src={`/art/scene-${n}.svg`}
                  alt={
                    [
                      "Kişisel çalışma alanı illüstrasyonu",
                      "Otomobil illüstrasyonu",
                      "Sanat kompozisyonu",
                    ][i]
                  }
                />
                <span>
                  {["THE SETUP", "AFTER HOURS", "CREATE SOMETHING"][i]}
                  <ArrowUpRight />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="landing-cta">
          <ArrowDown />
          <p className="eyebrow">SIRADAKİ HİKÂYE SENİN.</p>
          <h2>
            Own your <em>flex.</em>
          </h2>
          <Link href="/register" className="button primary">
            PAPI’ye katıl <ArrowUpRight size={20} />
          </Link>
          <small>Önce keşfet. Demo için hesap gerekmez.</small>
        </section>
      </main>
      <footer className="landing-footer">
        <Link href="/" className="brand">
          PAPI<span>®</span>
        </Link>
        <p>Your world. Your flex.</p>
        <div>
          <Link href="/privacy">Gizlilik</Link>
          <Link href="/terms">Koşullar</Link>
          <Link href="/community-guidelines">Topluluk</Link>
        </div>
        <small>Yerel demo · Kurgusal profiller · Özgün illüstrasyonlar</small>
      </footer>
    </div>
  );
}
