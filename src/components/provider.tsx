"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { DemoRepository } from "@/lib/demo/repository";
import {
  type State,
  type Action,
  type Repository,
  type FeedQuery,
  mode,
  demoId,
  demoModeratorId,
} from "@/lib/model";
import {
  SupabaseRepository,
  getBrowserClient,
} from "@/lib/supabase/repository";
type Context = {
  state: State | null;
  userId: string | null;
  loading: boolean;
  error: string;
  act: (a: Action) => Promise<boolean>;
  login: (role?: "member" | "moderator") => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  upload: (f: File) => Promise<string>;
  reset: () => Promise<void>;
  toast: (s: string) => void;
  loadMore: () => Promise<void>;
  search: (q: FeedQuery) => void;
};
const Store = createContext<Context | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<State | null>(null),
    [userId, setUserId] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const user = useRef<string | null>(null),
    repo = useRef<Repository | null>(null),
    page = useRef(0),
    filter = useRef<FeedQuery>({}),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    sequence = useRef(0);
  const toast = useCallback((s: string) => {
    setMessage(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 4500);
  }, []);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    try {
      if (repo.current) {
        const next = await repo.current.load(0, filter.current);
        if (current !== sequence.current) return;
        setState(next);
        page.current = 0;
        setError("");
        document.documentElement.dataset.theme = next.preferences.theme;
      }
    } catch (e) {
      if (current === sequence.current)
        setError(e instanceof Error ? e.message : "Veri yüklenemedi.");
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    async function init() {
      try {
        if (mode === "demo") {
          const saved = localStorage.getItem("papi-session");
          user.current =
            saved === demoId || saved === demoModeratorId ? saved : null;
          repo.current = new DemoRepository(() => user.current);
        } else {
          const client = getBrowserClient();
          const { data } = await client.auth.getUser();
          user.current = data.user?.id ?? null;
          repo.current = new SupabaseRepository();
        }
        if (alive) {
          setUserId(user.current);
          await refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Başlatılamadı.");
        setLoading(false);
      }
    }
    void init();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);
  useEffect(() => {
    if (mode === "supabase" && repo.current) {
      const params=new URLSearchParams(location.search);
      filter.current = {q:params.get('q')||'',category:params.get('category')||''};
      void refresh();
    }
  }, [pathname, refresh]);
  const search = useCallback(
    (q: FeedQuery) => {
      if (mode !== "supabase") return;
      filter.current = q;
      void refresh();
    },
    [refresh],
  );
  async function act(action: Action) {
    try {
      if (!repo.current) throw new Error("Veri henüz hazır değil.");
      await repo.current.act(action);
      await refresh();
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "İşlem tamamlanamadı.");
      return false;
    }
  }
  const login = (role: "member" | "moderator" = "member") => {
    if (mode !== "demo") return;
    const id = role === "moderator" ? demoModeratorId : demoId;
    localStorage.setItem("papi-session", id);
    user.current = id;
    setUserId(id);
  };
  async function logout() {
    if (mode === "demo") localStorage.removeItem("papi-session");
    else { const {error}=await getBrowserClient().auth.signOut();if(error){toast('Çıkış yapılamadı. Tekrar dene.');return;} }
    user.current = null;
    setUserId(null);
    window.location.replace(new URL("/", window.location.origin).href);
  }
  async function reset() {
    await repo.current?.reset?.();
    await refresh();
    toast("Demo verileri sıfırlandı.");
  }
  async function loadMore() {
    if (mode === "demo") return;
    try {
      const next = await repo.current!.load(
        (page.current + 1) * 24,
        filter.current,
      );
      page.current++;
      setState((old) =>
        old
          ? {
              ...next,
              posts: [
                ...old.posts,
                ...next.posts.filter(
                  (p) => !old.posts.some((o) => o.id === p.id),
                ),
              ],
              profiles: [
                ...next.profiles,
                ...old.profiles.filter(
                  (p) => !next.profiles.some((n) => n.id === p.id),
                ),
              ],
              comments: [
                ...old.comments,
                ...next.comments.filter(
                  (c) => !old.comments.some((o) => o.id === c.id),
                ),
              ],
              likes: [
                ...old.likes,
                ...next.likes.filter(
                  (l) =>
                    !old.likes.some(
                      (o) => o.userId === l.userId && o.targetId === l.targetId,
                    ),
                ),
              ],
            }
          : next,
      );
      if (!next.posts.length) toast("Tüm paylaşımları gördün.");
    } catch {
      toast("Paylaşımlar yüklenemedi. Tekrar deneyebilirsin.");
    }
  }
  return (
    <Store.Provider
      value={{
        state,
        userId,
        loading,
        error,
        act,
        login,
        logout,
        refresh,
        reset,
        toast,
        loadMore,
        search,
        upload: async (f) => {
          if (!repo.current) throw new Error("Henüz hazır değil.");
          return repo.current.upload(f);
        },
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </Store.Provider>
  );
}
export function usePapi() {
  const value = useContext(Store);
  if (!value) throw new Error("Provider gerekli.");
  return value;
}
