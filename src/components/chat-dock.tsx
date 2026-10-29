"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Maximize2, Minimize2, X, Minus } from "lucide-react";
import { Chat } from "@/features/chat";
import { usePapi } from "./provider";
export function ChatDock() {
  const { state, userId } = usePapi();
  const path = usePathname();
  const [open, setOpen] = useState(path === "/messages"),
    [expanded, setExpanded] = useState(false),
    [username, setUsername] = useState(() =>
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("q") || ""
        : "",
    );
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if(!userId)return;
      const a = (e.target as Element).closest?.("a");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      const url = new URL(a.href, location.origin);
      if (url.origin === location.origin && url.pathname === "/messages") {
        e.preventDefault();
        if(url.searchParams.has('q'))setUsername(url.searchParams.get("q") || "");
        setOpen(true);
      }
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [userId]);
  if (!userId || !state) return null;
  return (
    <div className={"chat-dock" + (expanded ? " expanded" : "")}>
      <section
        hidden={!open}
        className="chat-popup"
        role="region"
        aria-label="Mesaj penceresi"
      >
        <header className="chat-popup-head">
          <strong>
            <MessageCircle size={18} /> Mesajlar
          </strong>
          <div>
            <button
              className="icon-button"
              aria-label={
                expanded ? "Mesajları normal boyuta getir" : "Mesajları büyüt"
              }
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="Mesajları küçült"
              onClick={() => setOpen(false)}
            >
              <Minus size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Mesajları kapat"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <Chat key={username} username={username} active={open} />
      </section>
      {!open && (
        <button
          className="button primary chat-launcher"
          aria-label="Mesajları aç"
          onClick={() => setOpen(true)}
        >
          <MessageCircle size={22} />
          Mesajlar
        </button>
      )}
    </div>
  );
}
