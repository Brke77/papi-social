import "server-only";
import { createClient } from "@supabase/supabase-js";
export function storageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error(
      "Güvenli medya yükleme için sunucu depolama anahtarı yapılandırılmalı.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
