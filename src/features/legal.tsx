import Link from "next/link";
export function Legal({ kind }: { kind: string }) {
  return (
    <div className="legal-page">
      <Link href="/" className="brand">
        PAPI<span>®</span>
      </Link>
      <div className="eyebrow">TOPLULUĞA ÖZEN GÖSTER</div>
      <h1>
        {kind === "privacy"
          ? "Gizlilik."
          : kind === "terms"
            ? "Kullanım koşulları."
            : "Birlikte daha iyiyiz."}
      </h1>
      <div className="panel prose">
        <p className="legal-notice">
          Yerel önizleme taslağı — yayından önce hukuki inceleme gereklidir.
        </p>
        {kind === "privacy" ? (
          <>
            <h2>Bu demo nasıl çalışır?</h2>
            <p>
              Demo hesapları kurgusaldır. Demo paylaşımları, yüklenen görseller,
              profil ve etkileşim bilgileri bu tarayıcının IndexedDB alanında
              saklanır. Demo oturum tercihi localStorage kullanır. İsteğe bağlı
              analiz veya pazarlama çerezleri etkin değildir.
            </p>
            <h2>Verilerini yönet</h2>
            <p>
              Ayarlar → Hesap → Demo verilerini sıfırla seçeneği yerel
              değişikliklerini temizler. Tarayıcı site verilerini silmek de bu
              verileri kaldırır. Aynı cihazı kullanan başka kişiler yerel demo
              verilerine erişebilir.
            </p>
            <h2>Gerçek backend modu</h2>
            <p>
              Yönetici Supabase modunu yapılandırırsa kimlik doğrulama için
              oturum çerezleri ve veritabanı kullanılır; yüklenen içerikler
              yapılandırılan depolamada tutulur. Yayına geçişten önce veri
              sorumlusu kimliği, iletişim kanalı, veri işleme amaçları ve hukuki
              sebepleri, alıcı grupları, yurt dışı aktarım şartları, saklama
              süreleri ve başvuru yöntemi belirlenmelidir.
            </p>
          </>
        ) : kind === "terms" ? (
          <>
            <h2>Kendi hikâyeni paylaş</h2>
            <p>
              Yalnızca paylaşma hakkına sahip olduğun içerikleri yükle.
              Başkalarının kimliğine, özel hayatına ve telif haklarına saygı
              göster. Hesap güvenliği için benzersiz bir parola kullan.
            </p>
            <h2>Yerel ürün testi</h2>
            <p>
              Bu sürüm canlı hizmet olarak sunulmaz. Demo içeriğinin kalıcı
              olarak korunacağına dair bir taahhüt yoktur. İnceleme sırasında
              kişisel veya hassas veri yüklememelisin.
            </p>
            <h2>Yayın öncesi tamamlanacak alanlar</h2>
            <p>
              İşletmeci bilgileri, yaş politikası, hesap kapatma ve itiraz
              süreçleri, uyuşmazlık yöntemi ve hizmet kapsamı insan
              incelemesiyle hazırlanmalıdır.
            </p>
          </>
        ) : (
          <>
            <h2>Tarzın sana ait. Saygı hepimize.</h2>
            <p>
              Ürettiklerini, ilhamını ve tutkularını paylaş. Fiyat etiketleri
              insanın değerini belirlemez. Emek, yaratıcılık ve farklı bakış
              açıları burada yer bulur.
            </p>
            <h2>Alanımızı koru</h2>
            <p>
              Taciz, nefret söylemi, tehdit, kişisel bilgilerin izinsiz
              paylaşılması, taklit hesaplar, spam ve yasa dışı içerikler kabul
              edilmez. Başkasının çalışmasını kendininmiş gibi gösterme.
            </p>
            <h2>Bildir ve engelle</h2>
            <p>
              Gönderi menüsündeki Bildir seçeneğini veya profil üzerindeki
              Engelle düğmesini kullanabilirsin. Raporlar yetkili moderatörlerin
              incelemesine sunulur. Yayına çıkmadan önce itiraz ve telif hakkı
              bildirim süreçleri tanımlanacaktır.
            </p>
          </>
        )}
        <Link href="/feed" className="button secondary">
          PAPI’ye dön
        </Link>
      </div>
    </div>
  );
}
