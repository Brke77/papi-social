import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { actionSchema } from "@/lib/supabase/action-schema";
import { cleanupMedia } from "@/lib/supabase/cleanup";
import type { Post, State, Profile } from "@/lib/model";
import { readBoundedBody } from "@/lib/request-body";
export async function GET(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase")
      return NextResponse.json(
        { error: "Backend modu etkin değil." },
        { status: 503 },
      );
    const c = await serverClient(),
      params = req.nextUrl.searchParams,
      offset = Math.max(0, Math.min(100000, Number(params.get("offset")) || 0));
    const { data: auth } = await c.auth.getUser();
    const route = params.get("route") || "/feed",
      query = (params.get("q") || "")
        .slice(0, 100)
        .replace(/[%_,().]/g, " ")
        .trim();
    const [baseProfiles, follows, bookmarks, blocks, notices, reports, prefs] =
      await Promise.all([
        c.from("profiles").select("*").limit(60),
        c.from("follows").select("*").limit(2000),
        c.from("bookmarks").select("*").limit(1000),
        c.from("blocks").select("*").limit(1000),
        c
          .from("notifications")
          .select("*")
          .order("createdAt", { ascending: false })
          .limit(100),
        c.from("reports").select("*").limit(100),
        auth.user
          ? c
              .from("user_settings")
              .select("*")
              .eq("userId", auth.user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
    if (
      [baseProfiles, follows, bookmarks, blocks, notices, reports, prefs].some(
        (r) => r.error,
      )
    )
      throw new Error("Query failed");
    const routeUser = route.startsWith("/u/")
      ? decodeURIComponent(route.split("/")[2])
      : null;
    const extraProfiles = await c
      .from("profiles")
      .select("*")
      .or(
        [
          auth.user ? `id.eq.${auth.user.id}` : "",
          routeUser && /^[a-z0-9_]{3,24}$/.test(routeUser)
            ? `username.eq.${routeUser}`
            : "",
          query ? `name.ilike.%${query}%,username.ilike.%${query}%` : "",
        ]
          .filter(Boolean)
          .join(",") || "username.eq.__none__",
      )
      .limit(60);
    if (extraProfiles.error) throw extraProfiles.error;
    let profiles: Profile[] = [
      ...(baseProfiles.data || []),
      ...(extraProfiles.data || []),
    ].filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i);
    let request = c
      .from("posts")
      .select("*")
      .order("createdAt", { ascending: false });
    const postId = route.startsWith("/p/")
      ? route.split("/")[2]
      : params.get("edit");
    if (postId && /^[a-f0-9-]{36}$/i.test(postId))
      request = request.eq("id", postId);
    if(route==='/admin/reports')request=request.in('id',(reports.data||[]).filter(r=>r.kind==='post').map(r=>r.targetId));
    if(params.get('tab')==='Bu hafta')request=request.gte('createdAt',new Date(Date.now()-7*86400000).toISOString());
    if (routeUser) {
      const p = profiles.find((p) => p.username === routeUser);
      if(p?.id===auth.user?.id&&params.get('tab')==='Kaydedilenler')request=request.in('id',(bookmarks.data||[]).map(b=>b.targetId));
      else if(p?.id===auth.user?.id&&params.get('tab')==='Beğeniler'){
        const ownLikes=await c.from('post_likes').select('targetId').eq('userId',auth.user!.id).limit(1000);
        if(ownLikes.error)throw ownLikes.error;
        request=request.in('id',(ownLikes.data||[]).map(l=>l.targetId));
      } else request = request.eq(
        "authorId",
        p?.id || "00000000-0000-0000-0000-000000000000",
      );
    }
    if (route === "/saved")
      request = request.in(
        "id",
        (bookmarks.data || []).map((b) => b.targetId),
      );
    if (params.get("tab") === "Takip ettiklerin")
      request = request.in(
        "authorId",
        (follows.data || [])
          .filter((f) => f.userId === auth.user?.id)
          .map((f) => f.targetId),
      );
    if (params.get("category"))
      request = request.eq("category", params.get("category"));
    if (query) {
      const authors = profiles
        .filter((p) =>
          `${p.name} ${p.username}`.toLowerCase().includes(query.toLowerCase()),
        )
        .map((p) => p.id);
      request = request.or(
        `caption.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}${authors.length ? `,authorId.in.(${authors.join(",")})` : ""}`,
      );
    }
    const posts = await request.range(offset, offset + 23);
    if (posts.error) throw posts.error;
    const ids = (posts.data as Post[]).map((p) => p.id);
    const [comments, likes] = await Promise.all([
      c.from("comments").select("*").in("postId", ids).limit(500),
      c.from("post_likes").select("*").in("targetId", ids).eq('userId',auth.user?.id||'00000000-0000-0000-0000-000000000000'),
    ]);
    if (comments.error || likes.error) throw new Error("Query failed");
    const authors = [
      ...new Set([
        ...(posts.data || []).map((p) => p.authorId),
        ...(comments.data || []).map((p) => p.authorId),
        ...(notices.data || []).map((n) => n.actorId),
        ...(follows.data || []).flatMap((f) => [f.userId, f.targetId]),
      ]),
    ].filter((id) => !profiles.some((p) => p.id === id));
    if (authors.length) {
      const missing = await c.from("profiles").select("*").in("id", authors);
      if (missing.error) throw missing.error;
      profiles = [...profiles, ...(missing.data || [])];
    }
    const counts = await c.rpc("papi_counts", {
      post_ids: ids,
      profile_ids: profiles.map((p) => p.id),
    });
    if (counts.error) throw counts.error;
    const state: State = {
      posts: (posts.data || []).map((p) => ({
        ...p,
        ...counts.data.posts[p.id],
      })),
      profiles: profiles.map((p) => ({ ...p, ...counts.data.profiles[p.id] })),
      comments: comments.data || [],
      likes: likes.data || [],
      follows: follows.data || [],
      bookmarks: bookmarks.data || [],
      blocks: blocks.data || [],
      notifications: notices.data || [],
      reports: reports.data || [],
      preferences: prefs.data
        ? { theme: prefs.data.theme, notifications: prefs.data.notifications }
        : { theme: "dark", notifications: true },
    };
    return NextResponse.json(state, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Veriler yüklenemedi. Backend bağlantısını ve migration kurulumunu kontrol et.",
      },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_DATA_MODE !== "supabase")
      return NextResponse.json(
        { error: "Backend modu etkin değil." },
        { status: 503 },
      );
    if (req.headers.get("origin") !== req.nextUrl.origin)
      return NextResponse.json(
        { error: "Geçersiz istek kaynağı." },
        { status: 403 },
      );
    if (Number(req.headers.get("content-length")) > 20000)
      return NextResponse.json({ error: "İstek çok büyük." }, { status: 413 });
    const c = await serverClient();
    const { data } = await c.auth.getUser();
    if (!data.user)
      return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    const parsed = actionSchema.safeParse(
      JSON.parse(new TextDecoder().decode(await readBoundedBody(req, 20000))),
    );
    if (!parsed.success)
      return NextResponse.json(
        {
          error:
            "Geçersiz alanlar. Karakter sınırlarını ve görselleri kontrol et.",
        },
        { status: 400 },
      );
    const { error } = await c.rpc("papi_action", { a: parsed.data });
    if (error)
      return NextResponse.json(
        {
          error:
            "İşlem reddedildi. Yetkini, bilgilerini ve işlem sıklığını kontrol et.",
        },
        { status: 400 },
      );
    if (["post", "deletePost", "profile"].includes(parsed.data.type))
      await cleanupMedia(data.user.id).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "İşlem tamamlanamadı." },
      { status: 500 },
    );
  }
}
