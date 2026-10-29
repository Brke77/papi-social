import { describe, it, expect } from "vitest";
import { seed } from "../src/lib/seed";
import { reduceAction } from "../src/lib/demo/engine";
import { visiblePosts, rankPosts } from "../src/lib/model";
import { validateImage, profileSchema } from "../src/lib/validation";
describe("demo social invariants", () => {
  it("has diverse usable seed data", () => {
    const s = seed();
    expect(s.profiles).toHaveLength(12);
    expect(s.posts).toHaveLength(36);
    expect(new Set(s.posts.map((p) => p.category)).size).toBe(14);
  });
  it("rejects unauthenticated writes", () =>
    expect(() =>
      reduceAction(seed(), { type: "like", id: "post-1" }, null),
    ).toThrow());
  it("toggles likes without duplicate counts", () => {
    const s = seed(),
      before = s.likes.length;
    const liked = reduceAction(s, { type: "like", id: "post-1" }, "demo-0");
    expect(liked.likes).toHaveLength(before + 1);
    expect(
      reduceAction(liked, { type: "like", id: "post-1" }, "demo-0").likes,
    ).toHaveLength(before);
    expect(s.likes).toHaveLength(before);
  });
  it("prevents self-follow", () =>
    expect(() =>
      reduceAction(seed(), { type: "follow", id: "demo-0" }, "demo-0"),
    ).toThrow());
  it("prevents changing another author post", () => {
    const s = seed();
    expect(() =>
      reduceAction(
        s,
        { type: "post", post: { ...s.posts[1], caption: "stolen" } },
        "demo-0",
      ),
    ).toThrow();
    expect(() =>
      reduceAction(s, { type: "deletePost", id: "post-1" }, "demo-0"),
    ).toThrow();
  });
  it("validates empty and overlong comments", () => {
    expect(() =>
      reduceAction(
        seed(),
        { type: "comment", postId: "post-0", text: " " },
        "demo-0",
      ),
    ).toThrow();
    expect(() =>
      reduceAction(
        seed(),
        { type: "comment", postId: "post-0", text: "x".repeat(501) },
        "demo-0",
      ),
    ).toThrow();
  });
  it("allows own comment deletion only", () => {
    const s = reduceAction(
      seed(),
      { type: "comment", postId: "post-1", text: "Yeni yorum" },
      "demo-0",
    );
    const id = s.comments.at(-1)!.id;
    expect(() =>
      reduceAction(s, { type: "deleteComment", id }, "demo-1"),
    ).toThrow();
    expect(
      reduceAction(s, { type: "deleteComment", id }, "demo-0").comments.some(
        (c) => c.id === id,
      ),
    ).toBe(false);
  });
  it("blocks both directions and removes follow relations", () => {
    const s = reduceAction(seed(), { type: "block", id: "demo-1" }, "demo-0");
    expect(visiblePosts(s, "demo-0").some((p) => p.authorId === "demo-1")).toBe(
      false,
    );
    expect(visiblePosts(s, "demo-1").some((p) => p.authorId === "demo-0")).toBe(
      false,
    );
    expect(() =>
      reduceAction(s, { type: "follow", id: "demo-1" }, "demo-0"),
    ).toThrow();
  });
  it("keeps stable IDs and refuses profile role escalation", () => {
    const s = seed(),
      profile = {
        ...s.profiles[0],
        username: "newname",
        role: "moderator" as const,
      };
    const next = reduceAction(s, { type: "profile", profile }, "demo-0");
    expect(next.profiles[0].role).toBe("member");
    expect(next.posts[0].authorId).toBe("demo-0");
  });
  it("rejects duplicate usernames and unsafe website links", () => {
    const s = seed();
    expect(() =>
      reduceAction(
        s,
        {
          type: "profile",
          profile: { ...s.profiles[0], username: s.profiles[1].username },
        },
        "demo-0",
      ),
    ).toThrow();
    expect(
      profileSchema.safeParse({
        ...s.profiles[0],
        website: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it("denies member moderation and records moderator resolution", () => {
    let s = reduceAction(
      seed(),
      { type: "report", kind: "post", targetId: "post-1", reason: "Spam" },
      "demo-0",
    );
    const id = s.reports[0].id;
    expect(() =>
      reduceAction(s, { type: "moderate", id, hide: true }, "demo-0"),
    ).toThrow();
    s.profiles[0].role = "moderator";
    s = reduceAction(s, { type: "moderate", id, hide: true }, "demo-0");
    expect(s.posts[1].hidden).toBe(true);
    expect(s.reports[0].status).toBe("resolved");
  });
  it("keeps read state private to recipient", () => {
    const s = reduceAction(seed(), { type: "read" }, "demo-1");
    expect(s.notifications[0].read).toBe(false);
    expect(
      reduceAction(s, { type: "read" }, "demo-0").notifications[0].read,
    ).toBe(true);
  });
  it("rejects duplicate open reports", () => {
    const action = {
      type: "report" as const,
      kind: "post" as const,
      targetId: "post-1",
      reason: "Spam",
    };
    expect(() =>
      reduceAction(reduceAction(seed(), action, "demo-0"), action, "demo-0"),
    ).toThrow();
  });
  it("ranks without modifying input", () => {
    const s = seed(),
      original = s.posts.map((p) => p.id);
    expect(rankPosts(s.posts, s)).toHaveLength(36);
    expect(s.posts.map((p) => p.id)).toEqual(original);
  });
  it("rejects forged and oversized image files", async () => {
    await expect(
      validateImage(new File(["fake"], "bad.png", { type: "image/png" })),
    ).rejects.toThrow();
    await expect(
      validateImage(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
          type: "image/png",
        }),
      ),
    ).rejects.toThrow();
  });
});
