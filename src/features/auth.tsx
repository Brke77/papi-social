"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { usePapi } from "@/components/provider";
import { mode } from "@/lib/model";
import { getBrowserClient } from "@/lib/supabase/repository";
export function Auth({
  kind,
}: {
  kind: "login" | "register" | "forgot-password" | "reset-password";
}) {
  const { login } = usePapi();
  const [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const register = kind === "register",
    reset = kind === "reset-password",
    forgot = kind === "forgot-password";
  return (
    <div className="auth-page">
      <Link className="brand" href="/">
        PAPI<span>®</span>
      </Link>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">YOUR WORLD. YOUR FLEX.</div>
          <h1>
            Kendi dünyan.
            <br />
            <em>Kendi izin.</em>
          </h1>
          <p>
            Sevdiğin şeyleri paylaş.
            <br />
            Senin gibi düşünen insanları bul.
          </p>
          <img src="/art/scene-1.svg" alt="PAPI özgün tasarım kompozisyonu" />
        </section>
        <section className="auth-form panel">
          <div className="eyebrow">PAPI’YE HOŞ GELDİN</div>
          <h2>
            {register
              ? "Hikâyen burada başlasın."
              : forgot
                ? "Şifreni yenile."
                : reset
                  ? "Yeni şifren."
                  : "Kaldığın yerden."}
          </h2>
          <p className="muted">
            {mode === "demo"
              ? "Yerel demo için hesap oluşturmana gerek yok."
              : "Dünyanı paylaşmaya hazırsın."}
          </p>
          {mode === "supabase" ? (
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                setNotice("");
                try {
                  const f = new FormData(e.currentTarget),
                    c = getBrowserClient(),
                    email = String(f.get("email") || ""),
                    password = String(f.get("password") || "");
                  if (register && password !== f.get("confirm"))
                    throw new Error("Şifreler eşleşmiyor.");
                  if (register && !f.get("terms"))
                    throw new Error("Koşulları kabul etmelisin.");
                  const result = reset
                    ? await c.auth.updateUser({ password })
                    : forgot
                      ? await c.auth.resetPasswordForEmail(email, {
                          redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
                        })
                      : register
                        ? await c.auth.signUp({
                            email,
                            password,
                            options: {
                              data: {
                                username: f.get("username"),
                                display_name: f.get("name"),
                              },
                              emailRedirectTo: `${location.origin}/auth/callback`,
                            },
                          })
                        : await c.auth.signInWithPassword({ email, password });
                  if (result.error)
                    throw new Error(
                      "İşlem tamamlanamadı. Bilgilerini kontrol edip tekrar dene.",
                    );
                  if (forgot || register)
                    setNotice(
                      "E-posta adresini kontrol et. Uygunsa bir doğrulama bağlantısı gönderildi.",
                    );
                  else
                    window.location.replace(
                      new URL("/feed", window.location.origin).href,
                    );
                } catch (e) {
                  setError(e instanceof Error ? e.message : "İşlem başarısız.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {!reset && (
                <label>
                  E-posta
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                  />
                </label>
              )}
              {register && (
                <>
                  <label>
                    Kullanıcı adı
                    <input
                      name="username"
                      required
                      pattern="[a-z0-9_]{3,24}"
                      minLength={3}
                      maxLength={24}
                      autoComplete="username"
                    />
                  </label>
                  <label>
                    Görünen ad
                    <input name="name" required minLength={2} maxLength={60} />
                  </label>
                </>
              )}
              {!forgot && (
                <label>
                  Şifre
                  <div className="password-field">
                    <input
                      type={show ? "text" : "password"}
                      name="password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete={
                        register || reset ? "new-password" : "current-password"
                      }
                    />
                    <button
                      type="button"
                      aria-label="Şifreyi göster veya gizle"
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              )}
              {register && (
                <>
                  <label>
                    Şifre tekrar
                    <input
                      type="password"
                      name="confirm"
                      required
                      minLength={12}
                    />
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" name="terms" required />
                    <span>
                      <Link href="/terms">Kullanım koşullarını</Link> okudum.
                    </span>
                  </label>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {notice && <p role="status">{notice}</p>}
              <button className="button primary" disabled={busy}>
                {busy
                  ? "Bekle…"
                  : register
                    ? "Hesap oluştur"
                    : forgot
                      ? "Sıfırlama bağlantısı gönder"
                      : reset
                        ? "Şifreyi kaydet"
                        : "Giriş yap"}
              </button>
            </form>
          ) : (
            <>
              <div className="demo-note">
                <strong>Demo Mode</strong>
                <p>
                  12 kurgusal profil ve keşfedilmeyi bekleyen bir dünya.
                  İşlemler bu tarayıcıda saklanır; gerçek parola kullanılmaz.
                </p>
              </div>
              <Link
                href="/feed"
                className="button primary"
                onClick={() => login()}
              >
                Demo hesabıyla devam et <ArrowUpRight size={18} />
              </Link>
              <Link
                className="button secondary moderator-demo"
                href="/admin/reports"
                onClick={() => login("moderator")}
              >
                Yerel moderasyon demosu
              </Link>
            </>
          )}
          <div className="auth-links">
            <Link href={register ? "/login" : "/register"}>
              {register ? "Zaten hesabın var mı? Giriş yap" : "Aramıza katıl"}
            </Link>
            <Link href="/forgot-password">Şifremi unuttum</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
