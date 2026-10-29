# Doğrulama notları

Yerel doğrulama: 29 Ekim 2026.

- `npm run typecheck`: başarılı.
- `npm run lint`: önceki çalıştırmada hatasız; 3 uyarı giderildi, son lint çalıştırması tekrarlanmalı.
- `npm run test`: son çalıştırmada 25 test başarılı. PGlite, PostgreSQL migration/RLS/RPC davranışlarını Supabase Auth ve Storage şemalarını emüle ederek çalıştırır.
- Playwright: Chromium üzerinde 8 uçtan uca test yazıldı. Önceki 6 test başarılı; fotoğraf ve moderasyon testlerinin son sürümü çalıştırılıyor.
- `npm run build`: önceki kaynak sürümünde başarılı. Son değişikliklerden sonra tekrar çalıştırılmalı.
- npm güvenlik denetimi: yeni paket kurulumu 0 güvenlik açığı bildirdi.

Supabase hesabı/anahtarları yok; gerçek e-posta doğrulaması, Auth oturumu, RLS’nin hosted Postgres üzerinde çalışması ve private Storage erişimi bu makinede denenmedi. Docker Desktop çalışmadığı için Supabase CLI ile hosted eşdeğeri doğrulama da yoktur.

Tarayıcı inceleme görüntüleri `landing-desktop.png` ve `feed-desktop.png` dosyalarıdır. İlk responsive testte 320 px açılış başlığı taştı; boyutunu küçültüp testi yeniden geçirdim. WCAG uygunluk sertifikası ve Lighthouse skoru iddia edilmez.
