import { openDB } from "idb";
import { mode } from "./model";
import { getBrowserClient } from "./supabase/repository";
export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
export function chatError(error: { code?: string; message?: string }) {
  if (["PGRST202", "PGRST205", "42P01", "42883"].includes(error.code || ""))
    return "Mesajlaşma kurulumu eksik. Lütfen site yöneticisine bildir.";
  if (error.message?.includes("rate limited"))
    return "Çok hızlı mesaj gönderiyorsun. Bir dakika bekleyip tekrar dene.";
  if (error.message?.includes("invalid recipient"))
    return "Bu hesaba mesaj gönderilemiyor. Engelleme durumunu kontrol et.";
  if (["PGRST301", "42501"].includes(error.code || ""))
    return "Mesajlaşmak için tekrar giriş yap.";
  return "Mesaj sunucusuna ulaşılamadı. Bağlantını kontrol edip tekrar dene.";
}
const db = () =>
  openDB("papi-chat-v1", 1, {
    upgrade(d) {
      d.createObjectStore("messages", { keyPath: "id" });
    },
  });
export async function listMessages(
  userId: string,
  peerId?: string,
  before?: string,
): Promise<Message[]> {
  if (mode === "demo") {
    const rows = (await (await db()).getAll("messages")) as Message[];
    return rows
      .filter(
        (m) =>
          (m.sender_id === userId || m.recipient_id === userId) &&
          (!peerId || m.sender_id === peerId || m.recipient_id === peerId) &&
          (!before || m.created_at < before),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .reverse();
  }
  let q = getBrowserClient()
    .from("direct_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (peerId) q = q.or(`sender_id.eq.${peerId},recipient_id.eq.${peerId}`);
  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) throw new Error(chatError(error));
  return (data || []).reverse();
}
export async function sendMessage(
  userId: string,
  recipientId: string,
  body: string,
  id: string,
) {
  body = body.trim();
  if (!body || body.length > 2000)
    throw new Error("Mesaj 1–2.000 karakter olmalı.");
  if (userId === recipientId) throw new Error("Başka bir kullanıcı seç.");
  if (mode === "demo") {
    const d = await db();
    await d.put("messages", {
      id,
      sender_id: userId,
      recipient_id: recipientId,
      body,
      created_at: new Date().toISOString(),
      read_at: null,
    });
    return;
  }
  const { error } = await getBrowserClient().rpc("send_direct_message", {
    recipient: recipientId,
    message_body: body,
    message_id: id,
  });
  if (error) throw new Error(chatError(error));
}
export async function readMessages(userId: string, peerId: string) {
  if (mode === "demo") {
    const d = await db(),
      tx = d.transaction("messages", "readwrite");
    for (const m of (await tx.store.getAll()) as Message[])
      if (m.recipient_id === userId && m.sender_id === peerId && !m.read_at)
        await tx.store.put({ ...m, read_at: new Date().toISOString() });
    await tx.done;
    return;
  }
  const { error } = await getBrowserClient().rpc("read_direct_messages", {
    peer: peerId,
  });
  if (error) throw new Error(chatError(error));
}
