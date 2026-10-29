# PAPI — Your world. Your flex.

Türkçe, koyu/açık temalı, mobil uyumlu sosyal ağ MVP’si. Bu proje yalnızca yerel geliştirme için hazırlandı; yayınlanmadı, domain bağlanmadı, GitHub’a gönderilmedi.

## Başlat

Node.js **22+** gerekir (bu ortamda 24.15.0 ile doğrulandı).

```powershell
npm install
npm run dev
```

[http://127.0.0.1:3000](http://127.0.0.1:3000) → **Demo’yu dene** → **Demo hesabıyla devam et**.

Üretim derlemesini yerelde çalıştırmak için:

```powershell
npm run build
npm start
```

Windows kısıtlı çalışma ortamında Turbopack alt süreç hatası görüldüğünden komutlar Next.js’in Webpack seçeneğini kullanır. İşlevsel gereksinimler için ayrı bir uygulama/fork yoktur.

## Neler var?

- Açılış, giriş/kayıt ve parola yenileme ekranları.
- Ana akış: Sana özel / Takip ettiklerin, kategori filtreleri, sayfalama.
- Keşfet: görsel grid, yeni içerikler ve son yedi gün filtresi.
- Kullanıcı, paylaşım, kategori ve hashtag araması; 250 ms debounce.
- Profil, takip/takibi bırakma, takipçi listeleri; kendi beğeni/kayıt sekmeleri.
- Metin veya en fazla dört fotoğrafla gönderi; önizleme, sıralama, düzenleme, onaylı silme.
- Beğen/beğeniyi kaldır, kaydet/kaldır, yorum ekle ve kendi yorumunu sil.
- Paylaşım bağlantısı kopyalama veya desteklenen cihazda native share.
- Bildirimler, tekli/toplu okundu işaretleme, bildirim tercihi.
- Profil adı, kullanıcı adı, bio, konum, web sitesi, avatar ve kapak düzenleme.
- Tema kalıcılığı, kullanıcı engelleme, gönderi/hesap raporlama.
- Moderasyon: raporları inceleme, gönderi gizleme ve sonuçlandırma.
- Gizlilik, kullanım koşulları ve topluluk kuralları **taslakları**.

## Demo modu

Varsayılan `NEXT_PUBLIC_DATA_MODE=demo`. Hiçbir hesap veya API anahtarı gerekmez. 12 kurgusal profil ve 36 örnek gönderi bulunur; tüm görseller bu proje için üretilmiş SVG illüstrasyonlardır. Gerçek kişiler veya markalar taklit edilmez.

Veriler `papi-demo-v1` IndexedDB veritabanında saklanır. Fotoğraflar yeniden kodlanmış WebP olarak IndexedDB’de tutulur, **localStorage’a büyük görsel yazılmaz**. localStorage yalnızca demo hesap seçimini tutar. Parola kullanılmaz ve saklanmaz. Bu, gerçek online sosyal ağ veya güvenli kimlik doğrulama değildir; aynı tarayıcıdaki kullanıcılar veriyi inceleyebilir/değiştirebilir.

Normal demo hesabı Deniz Aral’dır. `/login` → **Yerel moderasyon demosu** İpek Tan hesabıyla yerel rapor ekranını açar. Bu geçiş sadece demo sağlayıcısında vardır; Supabase modunda sunulmaz. Üye hesabıyla rapor oluşturup moderasyon demosuyla inceleyebilirsin.

Sıfırlama: **Ayarlar → Hesap → Demo verilerini sıfırla**. Açılan onay penceresinden sonra bu tarayıcıdaki değişiklikler silinir. Site verilerini tarayıcıdan temizlemek de aynı sonucu sağlar.

## Teknoloji ve mimari

Doğrulanan kurulum: Next.js 16.4.3, React 19.3.1, TypeScript 5.9.3, Tailwind CSS 4.3.3, Supabase JS 2.118.0, Supabase SSR 0.8.0, Vitest 5.0.5 ve Playwright 1.64.1. Kesin bağımlılık ağacı `package-lock.json` dosyasındadır; tekrarlanabilir kurulum için `npm ci` kullanılabilir.

- `src/app`: App Router sayfaları, metadata, sunucu Route Handler’ları.
- `src/components`: kabuk, kartlar, Radix dialog, avatar ve veri sağlayıcısı.
- `src/features`: akış, profil, composer, ayarlar, auth, bildirim ve moderasyon ekranları.
- `src/lib/model.ts`: ortak tipler, görünürlük ve açıklanabilir akış sıralaması.
- `src/lib/demo`: IndexedDB deposu ve UI’dan bağımsız yetki/iş mantığı.
- `src/lib/supabase`: SSR/browser istemcileri, gerçek repository, şema doğrulama, medya temizliği.
- `supabase/migrations`: schema/RLS, medya limiti/temizlik kuyruğu, gerçek sayaçlar.
- `tests`: iş mantığı ve PGlite PostgreSQL yetkilendirme testleri.
- `e2e`: Playwright ile gerçek tarayıcı akışları.

Landing ve hukuki sayfalar Server Component’tir. Sosyal işlemler Client Component’lerden tipli `Repository` sözleşmesine gider. Demo işlemleri atomik IndexedDB transaction’ı kullanır; gerçek işlemler kimliği doğrulanan Route Handler ve atomik PostgreSQL RPC üzerinden yapılır. UI başarılı işlemden sonra veriyi yeniden okur; başarısız optimistic state bırakılmaz.

Geist fontu npm paketiyle yerel sunulur. İkonlar Lucide; erişilebilir dialog/focus/Escape davranışı Radix ile sağlanır. Formlar native HTML ve Zod kullanır. Bu ölçekte React Hook Form, Motion veya ek bir shadcn katmanı zorunlu görülmediğinden gereksiz bağımlılık olarak eklenmedi. CSS hareketleri reduced-motion tercihine uyar.

Akış puanı: güncellik + logaritmik beğeni/yorum + takip ilişkisi. Para, eşya fiyatı veya kullanıcı serveti kullanılmaz. Backend sayfa boyutu 24’tür; demo arayüzünde sekizer içerik gösterilir. Gerçek sayaçlar tam yetkili satırlar üzerinden SQL ile hesaplanır, örnek popülerlik sayıları eklenmez.

## Supabase kurulumu

**Gerçek Supabase hesabına bağlanılmadı.** Aşağıdaki entegrasyon kodu ve migration’lar hazır; gerçek Auth e-postası, oturum, Storage ve ağ hata senaryoları yapılandırılan projede ayrıca doğrulanmalıdır.

1. Kendi Supabase geliştirme projenizi oluşturun. Bu çalışma bunu sizin adınıza yapmadı.
2. SQL Editor’da sırayla `001_papi.sql`, `002_media.sql`, `003_counts.sql` dosyalarını uygulayın. Bunlar yeni/boş proje için tek seferlik migration’lardır. Mevcut production veritabanına körlemesine uygulamayın.
3. `.env.example` dosyasını `.env.local` olarak kopyalayın; alanları kendi projenizden doldurun:

```env
NEXT_PUBLIC_APP_NAME=PAPI
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
```

`SUPABASE_SECRET_KEY` yalnızca sunucuda, doğrulanmış medya yükleme/temizleme için kullanılır. `NEXT_PUBLIC_` öneki eklemeyin. Normal sosyal veri işlemleri kullanıcı oturumuyla yapılır; bu anahtar veri yetkilendirmesini atlamak için kullanılmaz. Gerçek sırlar Git’e eklenmemelidir; `.env*` ignore edilir, yalnızca `.env.example` izlenir.

4. Supabase Auth ayarlarında e-posta/parola girişini ve e-posta doğrulamayı etkinleştirin; Site URL’yi yerel adres yapın. Redirect allowlist’e `http://127.0.0.1:3000/auth/callback` ve parola yenilemede kullanılan `http://127.0.0.1:3000/auth/callback?next=/reset-password` adreslerini ekleyin. `localhost` kullanacaksanız onun karşılıklarını da ekleyin.
5. Auth parola politikasını en az 12 karakter olacak şekilde yapılandırın. SMTP gönderimini ve Auth rate limit/CAPTCHA ihtiyaçlarını yayından önce gerçek ortamda test edin.
6. Migration özel `media` bucket’ını, 10 MB ve JPEG/PNG/WebP sınırlarını oluşturur. **Bucket’ı public yapmayın.** İstemcilerin doğrudan yükleme izni yoktur; sunucu dosyayı açıp yeniden kodladıktan sonra yükler.
7. Sunucuyu yeniden başlatın, iki ayrı test hesabı oluşturun. İlk kayıt tetikleyicisi UUID tabanlı profili açar. Demo içerikleri gerçek veritabanına aktarılmaz.
8. Moderatör ataması yalnızca güvenilir SQL Editor/admin üzerinden: `update public.profiles set role='moderator' where id='TEST_USER_UUID';`. Role alanı kayıt metadata’sından veya profil formundan alınmaz.

## Güvenlik ve medya

- Tüm istemciye açık tablolarda RLS. Doğrudan INSERT/UPDATE/DELETE yetkileri kapalıdır. Mutasyonlar dar kapsamlı, `auth.uid()` ve sahiplik kontrolü yapan `papi_action` RPC’sinden geçer.
- Bookmark, bildirim ve ayarlar yalnızca sahibi tarafından okunur. Raporları gönderen veya moderatör okuyabilir. Engellenen hesapların içerikleri iki yönlü filtrelenir.
- Rol yükseltme, başka hesap adına yazma, başka kullanıcı postunu silme reddedilir. Gerçek moderasyon ayrıca audit tablosuna yazılır.
- Aynı kullanıcı için atomik toggle ve dakikada 60 mutasyon limiti; saatte 40 medya yükleme limiti.
- Route Handler’larda origin kontrolü, Zod doğrulama, byte bazlı gövde sınırı. Kullanıcı girdileri React tarafından metin olarak render edilir; raw HTML kullanılmaz.
- Görsellerde boyut, MIME, magic bytes, gerçek decode kontrolü; 40 MP üst sınırı; metadata temizleme ve en fazla 2400 px WebP yeniden kodlama.
- Sahiplik klasörü ve rastgele dosya adı. Özel dosyalar RLS sonrası 60 saniyelik signed URL ile açılır. Daha önce verilmiş URL bu kısa süre dolana kadar kullanılabilir.
- Gönderi/profil görseli değiştiğinde veya silindiğinde kalıcı `media_deletions` kuyruğu oluşur. İlgili API işlemi temizliği dener; başarısız silmeler kuyrukta kalır. Yayında periyodik temizlik işi kurulmalıdır.
- İptal edilmiş formdaki, hiçbir kayda bağlanmamış yüklemelerin zaman aşımıyla temizliği için `scripts/cleanup-storage.mjs` bulunur. Varsayılan **dry run**’dır; aşağıdaki bakım komutları sadece sizin kararınızla çalıştırılır.

```powershell
node --env-file=.env.local scripts/cleanup-storage.mjs
node --env-file=.env.local scripts/cleanup-storage.mjs --apply
```

## Doğrulama

```powershell
npm run typecheck
npm run lint
npm run test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit
```

PGlite testleri gerçek PostgreSQL motorunda migration’ları çalıştırır; `auth.uid()`, Auth ve Storage şemaları test içinde emüle edilir. Supabase bulut entegrasyonu test edilmiş sayılmaz. Son sonuçlar ve sınırlar: [docs/verification.md](docs/verification.md).

Ekran görüntüleri: [masaüstü akış](docs/feed-desktop.png), [açılış](docs/landing-desktop.png). Playwright mobil görüntüleri `test-results/feed-*.png` altında oluşturur.

## Bilinen sınırlar / yayın öncesi

- Gerçek Supabase Auth/Storage/SSR ve e-posta akışları proje anahtarları olmadan uçtan uca doğrulanmadı.
- Sayfalama offset tabanlıdır; çok hızlı değişen büyük akışlarda cursor’a geçilmelidir. Global öneri yerine getirilen sayfa üzerinde açıklanabilir sıralama yapılır.
- Destek listeleri sınırlıdır: öneri profilleri 60, ilişkiler 2.000, kaydedilenler/engeller 1.000, bildirim/rapor 100, bir sayfada yorum 500. Toplam sayaçlar bu sınırlardan bağımsızdır. Büyük ölçek öncesi bu listelere cursor sayfalama ekleyin.
- Realtime push yoktur; bildirimler sayfa/veri yenilendiğinde gelir. E-posta bildirimleri sunulmaz.
- Beğeniler profil sekmesi arayüzde hesap sahibine gösterilir; beğeni etkileşimi veritabanında public gönderi etkileşimi olarak okunabilir. Özel hesap özelliği sunulmaz.
- Hesap silme ve KVKK başvuru kanalı henüz işletmeciye bağlanmadı; demo reset gerçek hesap silme yerine geçmez.
- Tam WCAG denetimi ve Lighthouse/Core Web Vitals ölçümü yapılmadı; skor/uyum sertifikası iddia edilmez.
- Hukuki sayfalar taslaktır. Veri sorumlusu, yaş sınırı, saklama süreleri, aktarım şartları, telif talepleri, itiraz/rapor SLA ve iletişim adresleri insan incelemesiyle tamamlanmalı.
- Canlıya çıkmadan önce bağımsız güvenlik incelemesi, yedekleme/geri yükleme testi, CSP, altyapı IP oran sınırı ve kötüye kullanım izleme ayarlanmalı.
- İzinli gerçek domain, HTTPS, Auth redirect allowlist, gerçek canonical/Open Graph ve sitemap ayarları yayın aşamasında hazırlanmalı. Yerel sürüm bilerek `noindex` kullanır.

## V2

Cursor sayfalama, sunucuda tam metin arama ve kişiselleştirme; Realtime bildirimleri; erişilebilirlik denetimi; hesap veri dışa aktarma/silme başvuru süreçleri; moderasyon itirazları ve medya işleme kuyruğu. Video, DM, canlı yayın veya ödeme sistemi bu sürüme eklenmedi.

Teknik araştırma ve kararlar: [docs/decisions.md](docs/decisions.md). Görsellerin kaynakları: [docs/assets.md](docs/assets.md).

## Birebir mesajlaşma (29 Ekim güncellemesi)

`/messages` sayfası ve profil üzerindeki **Mesaj gönder** bağlantısı eklendi. Metin mesajı sınırı 2.000 karakterdir. Eski mesajlar 50 kayıtlık sayfalarla yüklenir; açık konuşma görünürken dört saniyede bir yenilenir. Katılımcı mesajları okuduğunda okundu durumu güncellenir. Başarısız gönderim metni korur; aynı gönderimin yeniden denenmesi aynı UUID ile çift kaydı önler.

Supabase projelerinde `supabase/migrations/004_chat.sql` migration'ını da uygulayın. Tablo yalnızca katılımcılara okuma izni verir, yazma dar kapsamlı RPC üzerinden yapılır. Engelleme iki yönlü kontrol edilir. Gönderim limiti kullanıcı başına dakikada 30 mesajdır. Mesaj içeriği React metni olarak gösterilir. Bu sürüm uçtan uca şifreleme veya dosya gönderme sunmaz.

Demo mesajları ayrı IndexedDB deposundadır; demo sıfırlaması mesajları da temizler. Gerçek kişiler arasında farklı cihazlardan konuşmak için çalışan Supabase projesi gerekir. Demo yayını bunu sağlamaz.

Araştırma: [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). V1 için ek Realtime publication gerektirmeyen periyodik sorgulama seçildi. Geçerli oturumun RLS kuralları her sorguda uygulanır.
