"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { usePapi } from "@/components/provider";
import { Avatar } from "@/components/ui";
import {
  listMessages,
  readMessages,
  sendMessage,
  type Message,
} from "@/lib/chat";
import { mode } from "@/lib/model";
export function Chat({ username }: { username: string }) {
  const { state, userId, toast } = usePapi();
  const [peer, setPeer] = useState(
      state?.profiles.find((p) => p.username === username)?.id || "",
    ),
    [rows, setRows] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [older, setOlder] = useState(true),
    [filter, setFilter] = useState("");
  const request = useRef(0),
    bottom = useRef<HTMLDivElement>(null),
    retry = useRef<{ body: string; id: string } | null>(null);
  const people = state!.profiles.filter(
    (p) =>
      p.id !== userId &&
      !state!.blocks.some(
        (b) =>
          (b.userId === userId && b.targetId === p.id) ||
          (b.targetId === userId && b.userId === p.id),
      ),
  );
  const selected = people.find((p) => p.id === peer);
  const load = useCallback(async () => {
    if (!userId || !peer) return;
    const seq = ++request.current;
    try {
      const next = await listMessages(userId, peer);
      if (seq !== request.current) return;
      setRows((old) => {
        const merged = [
          ...old.filter((m) => m.sender_id === peer || m.recipient_id === peer),
          ...next,
        ];
        return [...new Map(merged.map((m) => [m.id, m])).values()].sort(
          (a, b) => a.created_at.localeCompare(b.created_at),
        );
      });
      await readMessages(userId, peer);
      setError("");
    } catch (e) {
      if (seq === request.current)
        setError(e instanceof Error ? e.message : "Mesajlar yüklenemedi.");
    }
  }, [userId, peer]);
  useEffect(() => {
    const initial = setTimeout(()=>void load(),0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
      // Sequence counter cancels stale requests; it is not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      request.current++;
    };
  }, [load]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [rows.length]);
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">BAĞLANTI KUR</div>
        <h1>Mesajlar.</h1>
        <p>
          {mode === "demo"
            ? "Yerel demo: mesajlar bu tarayıcıda saklanır. Gerçek kişilere iletilmez."
            : "Birebir konuşmaların yalnızca katılımcılara açıktır."}
        </p>
      </div>
      <div className="chat-layout">
        <aside className="chat-people">
          <input
            aria-label="Mesajlaşılacak kullanıcı ara"
            placeholder="Birini bul…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {people
            .filter((p) =>
              `${p.name} ${p.username}`
                .toLocaleLowerCase("tr")
                .includes(filter.toLocaleLowerCase("tr")),
            )
            .map((p) => (
              <button
                className={peer === p.id ? "selected" : ""}
                key={p.id}
                onClick={() => {
                  request.current++;
                  setRows([]);
                  setOlder(true);
                  setDraft("");
                  retry.current = null;
                  setPeer(p.id);
                }}
              >
                <Avatar profile={p} size={33} />
                <span>
                  {p.name}
                  <small>@{p.username}</small>
                </span>
              </button>
            ))}
        </aside>
        <section className="chat-thread" aria-label="Konuşma">
          {selected ? (
            <>
              <header>
                <Avatar profile={selected} size={35} />
                <strong>{selected.name}</strong>
              </header>
              <div className="chat-history" role="log" aria-live="polite">
                {older && (
                  <button
                    className="text-link"
                    onClick={async () => {
                      try {
                        const next = await listMessages(
                          userId!,
                          peer,
                          rows[0]?.created_at,
                        );
                        setRows((old) => [
                          ...next.filter(
                            (m) => !old.some((o) => o.id === m.id),
                          ),
                          ...old,
                        ]);
                        setOlder(next.length === 50);
                      } catch {
                        toast("Eski mesajlar yüklenemedi.");
                      }
                    }}
                  >
                    Önceki mesajlar
                  </button>
                )}
                {!rows.length && (
                  <p className="muted">Bir merhaba ile başla.</p>
                )}
                {rows.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.sender_id === userId
                        ? "chat-bubble mine"
                        : "chat-bubble"
                    }
                  >
                    <p>{m.body}</p>
                    <small>
                      {new Date(m.created_at).toLocaleTimeString("tr", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {m.sender_id === userId &&
                        (m.read_at ? " · Okundu" : " · Gönderildi")}
                    </small>
                  </div>
                ))}
                <div ref={bottom} />
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                  <button onClick={() => void load()}> Tekrar dene</button>
                </p>
              )}
              <form
                className="chat-compose"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (busy || !draft.trim()) return;
                  setBusy(true);
                  try {
                    if (
                      state!.blocks.some(
                        (b) => b.userId === userId && b.targetId === peer,
                      )
                    )
                      throw new Error("Engellenen hesaba mesaj gönderemezsin.");
                    const body = draft.trim();
                    const id =
                      retry.current?.body === body
                        ? retry.current.id
                        : crypto.randomUUID();
                    retry.current = { body, id };
                    await sendMessage(userId!, peer, body, id);
                    setDraft("");
                    retry.current = null;
                    await load();
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Gönderilemedi.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <textarea
                  aria-label="Mesajın"
                  placeholder="Bir mesaj yaz…"
                  maxLength={2000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  className="button primary"
                  aria-label="Mesaj gönder"
                  disabled={busy || !draft.trim()}
                >
                  <Send size={19} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty">
              <MessageCircle size={40} />
              <h2>Konuşmaya başla.</h2>
              <p>Soldan bir kullanıcı seç.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
