import type { Metadata } from "next";
import { Provider } from "@/components/provider";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "PAPI — Your world. Your flex.", template: "%s · PAPI" },
  description:
    "Tutkularını paylaş, kendi insanlarını keşfet. PAPI yerel sosyal ağ önizlemesi.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
