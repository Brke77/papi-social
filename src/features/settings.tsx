"use client";
import { useState } from "react";
import { usePapi } from "@/components/provider";
import { Modal, Avatar } from "@/components/ui";
import { mode } from "@/lib/model";
import { profileSchema } from "@/lib/validation";
import { getBrowserClient } from "@/lib/supabase/repository";
export function Settings() {
  const { state, userId, act, upload, reset, logout, toast } = usePapi();
  const me = state!.profiles.find((p) => p.id === userId)!;
  const [profile, setProfile] = useState(me),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false),
    [tab, setTab] = useState("Profil");
  async function photo(file: File | undefined, field: "avatar" | "cover") {
    if (!file) return;
    setBusy(true);
    try {
      const url = await upload(file);
      setProfile((p) => ({ ...p, [field]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görsel yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">KENDİ ALANIN</div>
        <h1>Ayarlar.</h1>
        <p>PAPI deneyimini kendine göre şekillendir.</p>
      </div>
      <div className="feed-tabs">
        {["Profil", "Görünüm", "Bildirimler", "Gizlilik", "Hesap"].map((t) => (
          <button
            className={tab === t ? "selected" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="panel form-stack">
        {tab === "Profil" && (
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              try {
                profileSchema.parse(profile);
                if (await act({ type: "profile", profile }))
                  toast("Profilin güncellendi.");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Bilgileri kontrol et.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Avatar profile={profile} size={72} />
            <label>
              Profil fotoğrafı
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void photo(e.target.files?.[0], "avatar")}
              />
            </label>
            <label>
              Kapak görseli
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void photo(e.target.files?.[0], "cover")}
              />
            </label>
            {(
              [
                ["name", "Görünen ad"],
                ["username", "Kullanıcı adı"],
                ["bio", "Biyografi"],
                ["location", "Konum"],
                ["website", "Web sitesi"],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  value={profile[field]}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, [field]: e.target.value }))
                  }
                  maxLength={
                    field === "bio" ? 240 : field === "website" ? 200 : 80
                  }
                />
              </label>
            ))}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
            </button>
          </form>
        )}
        {tab === "Görünüm" && (
          <>
            <h2>Senin renklerin.</h2>
            <p className="muted">Tema tercihin bu cihazda korunur.</p>
            <div className="theme-options">
              {(["dark", "light"] as const).map((theme) => (
                <button
                  key={theme}
                  className={
                    state!.preferences.theme === theme ? "selected" : ""
                  }
                  onClick={() =>
                    void act({
                      type: "preferences",
                      preferences: { ...state!.preferences, theme },
                    })
                  }
                >
                  {theme === "dark" ? "◐ Koyu tema" : "◯ Açık tema"}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === "Bildirimler" && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={state!.preferences.notifications}
              onChange={(e) =>
                void act({
                  type: "preferences",
                  preferences: {
                    ...state!.preferences,
                    notifications: e.target.checked,
                  },
                })
              }
            />
            Yeni etkileşim bildirimleri
          </label>
        )}
        {tab === "Gizlilik" && (
          <>
            <h2>Engellenen hesaplar</h2>
            {state!.blocks
              .filter((b) => b.userId === userId)
              .map((b) => (
                <div className="suggestion" key={b.targetId}>
                  <span>
                    {state!.profiles.find((p) => p.id === b.targetId)?.name}
                  </span>
                  <button
                    className="button secondary"
                    onClick={() => void act({ type: "block", id: b.targetId })}
                  >
                    Engeli kaldır
                  </button>
                </div>
              ))}
            {!state!.blocks.some((b) => b.userId === userId) && (
              <p className="muted">Engellediğin bir hesap yok.</p>
            )}
            <p>
              Kaydedilenlerin ve beğeni sekmen yalnızca sana gösterilir.
              Profilin ve paylaşımların herkese açıktır.
            </p>
          </>
        )}
        {tab === "Hesap" && (
          <>
            <h2>Hesabını yönet</h2>
            {mode === "demo" ? (
              <>
                <p className="muted">
                  Demo hesabı yerel ürün testi içindir. Gerçek parola saklanmaz.
                  Demo sıfırlama bu tarayıcıdaki tüm değişikliklerini siler.
                </p>
                <button
                  className="button secondary"
                  onClick={() => setConfirm(true)}
                >
                  Demo verilerini sıfırla
                </button>
              </>
            ) : (
              <>
                <p className="muted">
                  Şifreni değiştirmek için e-posta adresine sıfırlama bağlantısı
                  gönderebilirsin.
                </p>
                <button
                  className="button secondary"
                  onClick={async () => {
                    const c = getBrowserClient();
                    const { data } = await c.auth.getUser();
                    if (data.user?.email) {
                      const { error } = await c.auth.resetPasswordForEmail(
                        data.user.email,
                        {
                          redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
                        },
                      );
                      toast(
                        error
                          ? "E-posta gönderilemedi."
                          : "Sıfırlama e-postası gönderildi.",
                      );
                    }
                  }}
                >
                  Şifre sıfırlama e-postası gönder
                </button>
              </>
            )}
            <button className="button danger" onClick={() => void logout()}>
              Çıkış yap
            </button>
          </>
        )}
      </section>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Demo sıfırlansın mı?"
      >
        <p>
          Bu tarayıcıdaki paylaşımlar, yorumlar ve profil değişiklikleri
          silinecek.
        </p>
        <button
          className="button danger"
          onClick={async () => {
            await reset();
            setConfirm(false);
            window.location.reload();
          }}
        >
          Evet, sıfırla
        </button>
      </Modal>
    </>
  );
}
