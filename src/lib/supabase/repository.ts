import { createBrowserClient } from "@supabase/ssr";
import type { Repository, State, Action, FeedQuery } from "../model";
import { validateImage } from "../validation";
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase yapılandırması eksik. .env.local bilgilerini ekle veya demo modunu seç.",
    );
  return createBrowserClient(url, key);
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || "İşlem tamamlanamadı. Lütfen tekrar dene.");
  return data;
}
export class SupabaseRepository implements Repository {
  load(offset = 0, query: FeedQuery = {}) {
    const params = new URLSearchParams({
      offset: String(offset),
      route: location.pathname,
      ...query,
    });
    const edit = new URLSearchParams(location.search).get("edit");
    if (edit) params.set("edit", edit);
    return request<State>(`/api/data?${params}`);
  }
  async act(action: Action) {
    await request("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
  }
  async upload(file: File) {
    await validateImage(file);
    const form = new FormData();
    form.append("file", file);
    const data = await request<{ url: string }>("/api/upload", {
      method: "POST",
      body: form,
    });
    return data.url;
  }
}
