import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  post = "33333333-3333-4333-8333-333333333333";
let db: PGlite;
async function asUser(id: string | null, role = "authenticated") {
  await db.exec(
    `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id ?? ""}',false);`,
  );
}
async function action(a: unknown) {
  return db.query("select public.papi_action($1::jsonb)", [JSON.stringify(a)]);
}
describe("PostgreSQL migration, RPC authorization and RLS (Supabase schemas emulated)", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select on storage.objects to anon,authenticated;create function storage.foldername(name text) returns text[] language sql as $$select string_to_array(name,'/')$$;`,
    );
    await db.exec(
      readFileSync("supabase/migrations/001_papi.sql", "utf8").replace(
        "create extension if not exists pgcrypto;",
        "",
      ),
    );
    await db.exec(readFileSync("supabase/migrations/002_media.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/003_counts.sql", "utf8"));
    await db.exec(readFileSync("supabase/migrations/004_chat.sql", "utf8"));
    await db.query("insert into auth.users values ($1,$2),($3,$4)", [
      alice,
      JSON.stringify({ username: "alice", display_name: "Alice Test" }),
      bob,
      JSON.stringify({ username: "bobby", display_name: "Bobby Test" }),
    ]);
  }, 30000);
  afterAll(async () => {
    await db.close();
  });
  it("private chat validates sender, recipient, retries and read ownership", async () => {
    await asUser(alice);
    const id = crypto.randomUUID();
    await db.query("select public.send_direct_message($1,$2,$3)", [
      bob,
      "Merhaba",
      id,
    ]);
    await db.query("select public.send_direct_message($1,$2,$3)", [
      bob,
      "Merhaba",
      id,
    ]);
    expect(
      (await db.query("select * from public.direct_messages")).rows,
    ).toHaveLength(1);
    await expect(
      db.query("select public.send_direct_message($1,$2,$3)", [
        alice,
        "self",
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow();
    await expect(
      db.exec(
        `insert into public.direct_messages(sender_id,recipient_id,body) values('${bob}','${alice}','spoof')`,
      ),
    ).rejects.toThrow();
    await asUser(null, "anon");
    await expect(
      db.exec("select * from public.direct_messages"),
    ).rejects.toThrow();
    await asUser(bob);
    await db.query("select public.read_direct_messages($1)", [alice]);
    expect(
      (
        await db.query<{ read_at: string }>(
          "select read_at from public.direct_messages",
        )
      ).rows[0].read_at,
    ).toBeTruthy();
    await action({ type: "block", id: alice });
    expect(
      (await db.query("select * from public.direct_messages")).rows,
    ).toHaveLength(0);
    await expect(
      db.query("select public.send_direct_message($1,$2,$3)", [
        alice,
        "blocked",
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow();
    await action({ type: "block", id: alice });
  });
  it("allows owned writes through RPC and denies forged owners", async () => {
    await asUser(alice);
    await action({
      type: "post",
      post: {
        id: post,
        authorId: alice,
        caption: "A real post",
        category: "Lifestyle",
        media: [],
        tags: [],
      },
    });
    await asUser(bob);
    await expect(action({ type: "deletePost", id: post })).rejects.toThrow(
      "wrong owner",
    );
    await expect(
      action({
        type: "post",
        post: {
          id: post,
          authorId: bob,
          caption: "Overwrite",
          category: "Lifestyle",
          media: [],
          tags: [],
        },
      }),
    ).rejects.toThrow("wrong owner");
  });
  it("denies direct writes including profile role escalation", async () => {
    await asUser(alice);
    await expect(
      db.exec(
        `update public.profiles set role='moderator' where id='${alice}'`,
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      db.exec(`insert into public.post_likes values('${bob}','${post}')`),
    ).rejects.toThrow("permission denied");
  });
  it("uses private bookmark and notification read policies", async () => {
    await asUser(alice);
    await action({ type: "bookmark", id: post });
    expect(
      (await db.query("select * from public.bookmarks")).rows,
    ).toHaveLength(1);
    await asUser(bob);
    expect(
      (await db.query("select * from public.bookmarks")).rows,
    ).toHaveLength(0);
    await action({ type: "like", id: post });
    expect(
      (await db.query("select * from public.notifications")).rows,
    ).toHaveLength(0);
    await asUser(alice);
    expect(
      (await db.query("select * from public.notifications")).rows,
    ).toHaveLength(1);
  });
  it("requires authentication for RPC", async () => {
    await asUser(null, "anon");
    await expect(action({ type: "like", id: post })).rejects.toThrow(
      "permission denied",
    );
  });
  it("returns complete counts under caller RLS", async () => {
    await asUser(alice);
    const result = await db.query<{
      counts: { posts: Record<string, { likeCount: number }> };
    }>("select public.papi_counts($1::uuid[],$2::uuid[]) as counts", [
      [post],
      [alice, bob],
    ]);
    expect(result.rows[0].counts.posts[post].likeCount).toBe(1);
  });
  it("queues removed media atomically and keeps active references", async () => {
    await asUser(alice);
    const id = crypto.randomUUID();
    const path = `${alice}%2F44444444-4444-4444-8444-444444444444.webp`;
    await action({
      type: "post",
      post: {
        id,
        authorId: alice,
        caption: "With media",
        category: "Sanat",
        media: [`/api/media?path=${path}`],
        tags: [],
      },
    });
    await action({ type: "deletePost", id });
    await db.exec("reset role");
    expect(
      (
        await db.query<{ path: string }>(
          "select path from public.media_deletions",
        )
      ).rows[0].path,
    ).toBe(path.replace("%2F", "/"));
  });
  it("enforces hourly upload allowance", async () => {
    await asUser(alice);
    for (let i = 0; i < 40; i++)
      await db.exec("select public.papi_upload_limit()");
    await expect(db.exec("select public.papi_upload_limit()")).rejects.toThrow(
      "upload limit",
    );
  });
  it("rejects empty comments and nonexistent media ownership", async () => {
    await asUser(bob);
    await expect(
      action({ type: "comment", postId: post, text: " " }),
    ).rejects.toThrow();
    await expect(
      action({
        type: "post",
        post: {
          id: crypto.randomUUID(),
          authorId: bob,
          caption: "Bad media",
          category: "Lifestyle",
          media: [`/api/media?path=${alice}%2Fx.png`],
          tags: [],
        },
      }),
    ).rejects.toThrow("invalid media owner");
  });
  it("blocks post visibility and interactions in both directions", async () => {
    await asUser(bob);
    await action({ type: "block", id: alice });
    expect((await db.query("select * from public.posts")).rows).toHaveLength(0);
    await expect(action({ type: "like", id: post })).rejects.toThrow(
      "post unavailable",
    );
    await expect(action({ type: "follow", id: alice })).rejects.toThrow(
      "invalid relationship",
    );
    await action({ type: "block", id: alice });
    expect((await db.query("select * from public.posts")).rows).toHaveLength(1);
  });
  it("moderation requires database role and writes audit record", async () => {
    await asUser(bob);
    await action({
      type: "report",
      kind: "post",
      targetId: post,
      reason: "Spam",
    });
    const reports = await db.query<{ id: string }>(
      "select id from public.reports",
    );
    await expect(
      action({ type: "moderate", id: reports.rows[0].id, hide: true }),
    ).rejects.toThrow("moderator required");
    await db.exec(
      `reset role;update public.profiles set role='moderator' where id='${bob}';`,
    );
    await asUser(bob);
    await action({ type: "moderate", id: reports.rows[0].id, hide: true });
    expect(
      (await db.query("select * from public.moderation_actions")).rows,
    ).toHaveLength(1);
    await asUser(alice);
    expect((await db.query("select * from public.posts")).rows).toHaveLength(0);
  });
});
