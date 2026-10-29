"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/model";
export function Avatar({
  profile,
  size = 40,
}: {
  profile?: Profile;
  size?: number;
}) {
  return (
    <img
      className="avatar"
      width={size}
      height={size}
      src={profile?.avatar || "/art/avatar-0.svg"}
      alt={profile?.name || "Profil"}
      onError={(e) => {
        e.currentTarget.src = "/art/avatar-0.svg";
      }}
    />
  );
}
export function Empty({
  title = "Burada henüz bir şey yok.",
  text = "Yeni dünyaları keşfetmek için akışa göz at.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <span className="empty-mark">P.</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link href="/explore" className="button secondary">
        Keşfe çık <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal" aria-describedby={undefined}>
          <div className="modal-head">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Kapat">
              <X />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
