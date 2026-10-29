# Teknik kararlar

- Next.js 16 App Router; React 19; TypeScript strict. Kurulu güncel kararlı sürümler resmi kurulum belgeleri ve resmi paket kayıtları üzerinden kontrol edildi (29.10.2026). Turbopack Windows alt süreç hatası verdiği için `--webpack` seçildi.
- Tailwind CSS v4 ile özel CSS tasarım sistemi; Geist yerel font. Bu küçük MVP’de ayrı animasyon, form ve bileşen kütüphaneleri yerine CSS/native form/ Radix dialog kullanıldı.
- Demo için IndexedDB: büyük görseller localStorage’a konmaz, demo parola saklamaz. İki provider ortak repository tipini kullanır.
- Hosted mutasyonlar Supabase SSR cookie istemcisi ve `auth.uid()` doğrulayan PostgreSQL RPC üzerinden. Tablo yazma izinleri kapalı, okuma RLS ile sınırlı. Service key yalnızca sunucu media depolama işinde; asla tarayıcıya aktarılmaz.
- Fotoğraf özgün tür kontrolünden sonra decode edilir, metadata’sı temizlenir ve 2400 px WebP’ye kodlanır. Bucket private; erişim RLS imzalı kısa süreli URL üretir.
- V1 akış sıralaması güncellik, etkileşim ve takip sinyallerinden oluşur; anlaşılır ve küçük kapsamdadır.
- Hukuki metinler taslak. KVKK için veri sorumlusu, amaç, hukuki sebep, saklama ve veri sahibi başvuru akışı belirlenmeden yayına çıkılmamalıdır.

Resmî başvuru kaynakları: [Next.js kurulum ve proxy](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Storage erişimi](https://supabase.com/docs/guides/storage/security/access-control), [OWASP dosya yükleme](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/).
