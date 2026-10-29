import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppView } from "@/components/app-view";
import { Auth } from "@/features/auth";
import { Legal } from "@/features/legal";
type Props = {
  params: Promise<{ route: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
const allowed = [
  "messages", "feed",
  "explore",
  "search",
  "saved",
  "create",
  "u",
  "p",
  "settings",
  "notifications",
  "admin",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "privacy",
  "terms",
  "community-guidelines",
];
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { route } = await params;
  return {
    title:
      route[0] === "u"
        ? `@${route[1]}`
        : (
            {
              feed: "Senin akışın",
              explore: "Keşfet",
              create: "Yeni flex",
              settings: "Ayarlar",
              login: "Giriş yap",
            } as Record<string, string>
          )[route[0]] || "Dünyanı keşfet",
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { route } = await params,
    q = await searchParams;
  if (
    !allowed.includes(route[0]) ||
    (["u", "p"].includes(route[0])
      ? route.length !== 2
      : route[0] === "admin"
        ? route.join("/") !== "admin/reports"
        : route.length !== 1)
  )
    notFound();
  if (
    ["login", "register", "forgot-password", "reset-password"].includes(
      route[0],
    )
  )
    return (
      <Auth
        kind={
          route[0] as
            "login" | "register" | "forgot-password" | "reset-password"
        }
      />
    );
  if (["privacy", "terms", "community-guidelines"].includes(route[0]))
    return <Legal kind={route[0]} />;
  return (
    <AppView
      key={route.join("/")}
      route={route}
      query={q.q}
      category={q.category}
      edit={q.edit}
    />
  );
}

