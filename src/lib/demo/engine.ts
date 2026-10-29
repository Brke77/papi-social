import { type Action, type State, visiblePosts } from "../model";
import { commentSchema, postSchema, profileSchema } from "../validation";
export function reduceAction(
  input: State,
  action: Action,
  userId: string | null,
): State {
  if (!userId) throw new Error("Bu işlem için giriş yap.");
  const s = structuredClone(input),
    me = s.profiles.find((p) => p.id === userId);
  if (!me) throw new Error("Hesap bulunamadı.");
  const id = () => crypto.randomUUID(),
    date = () => new Date().toISOString();
  const notify = (
    recipientId: string,
    type: "like" | "follow" | "comment",
    targetId: string,
  ) => {
    if (recipientId !== userId && s.preferences.notifications)
      s.notifications.unshift({
        id: id(),
        recipientId,
        actorId: userId,
        type,
        targetId,
        read: false,
        createdAt: date(),
      });
  };
  const post = (pid: string) => {
    const p = visiblePosts(s, userId).find((p) => p.id === pid);
    if (!p) throw new Error("Gönderi bulunamadı.");
    return p;
  };
  switch (action.type) {
    case "post": {
      postSchema.parse(action.post);
      const old = s.posts.find((p) => p.id === action.post.id);
      if (action.post.authorId !== userId || (old && old.authorId !== userId))
        throw new Error("Bu gönderiyi değiştiremezsin.");
      s.posts = old
        ? s.posts.map((p) =>
            p.id === old.id
              ? {
                  ...old,
                  caption: action.post.caption,
                  category: action.post.category,
                  media: action.post.media,
                  tags: action.post.tags,
                }
              : p,
          )
        : [
            {
              ...action.post,
              authorId: userId,
              hidden: false,
              createdAt: date(),
            },
            ...s.posts,
          ];
      break;
    }
    case "deletePost": {
      const p = post(action.id);
      if (p.authorId !== userId) throw new Error("Bu gönderiyi silemezsin.");
      s.posts = s.posts.filter((p) => p.id !== action.id);
      s.comments = s.comments.filter((c) => c.postId !== action.id);
      s.likes = s.likes.filter((l) => l.targetId !== action.id);
      s.bookmarks = s.bookmarks.filter((l) => l.targetId !== action.id);
      break;
    }
    case "like":
    case "bookmark":
    case "follow":
    case "block": {
      const key =
        action.type === "like"
          ? "likes"
          : action.type === "bookmark"
            ? "bookmarks"
            : action.type === "follow"
              ? "follows"
              : "blocks";
      if (key === "likes" || key === "bookmarks") post(action.id);
      else if (
        action.id === userId ||
        !s.profiles.some((p) => p.id === action.id)
      )
        throw new Error("Geçersiz kullanıcı.");
      if (
        key === "follows" &&
        s.blocks.some(
          (b) =>
            (b.userId === userId && b.targetId === action.id) ||
            (b.targetId === userId && b.userId === action.id),
        )
      )
        throw new Error("Engellenen hesap takip edilemez.");
      const exists = s[key].some(
        (r) => r.userId === userId && r.targetId === action.id,
      );
      s[key] = exists
        ? s[key].filter(
            (r) => !(r.userId === userId && r.targetId === action.id),
          )
        : [...s[key], { userId, targetId: action.id }];
      if (!exists && key === "likes")
        notify(post(action.id).authorId, "like", action.id);
      if (!exists && key === "follows") notify(action.id, "follow", userId);
      if (!exists && key === "blocks")
        s.follows = s.follows.filter(
          (r) =>
            !(
              (r.userId === userId && r.targetId === action.id) ||
              (r.userId === action.id && r.targetId === userId)
            ),
        );
      break;
    }
    case "comment": {
      const p = post(action.postId);
      s.comments.push({
        id: id(),
        postId: p.id,
        authorId: userId,
        text: commentSchema.parse(action.text),
        createdAt: date(),
      });
      notify(p.authorId, "comment", p.id);
      break;
    }
    case "deleteComment": {
      const c = s.comments.find((c) => c.id === action.id);
      if (c?.authorId !== userId) throw new Error("Bu yorumu silemezsin.");
      s.comments = s.comments.filter((c) => c.id !== action.id);
      break;
    }
    case "profile": {
      profileSchema.parse(action.profile);
      if (action.profile.id !== userId) throw new Error("Yetkisiz işlem.");
      if (
        s.profiles.some(
          (p) =>
            p.id !== userId &&
            p.username.toLowerCase() === action.profile.username.toLowerCase(),
        )
      )
        throw new Error("Bu kullanıcı adı kullanılıyor.");
      s.profiles = s.profiles.map((p) =>
        p.id === userId
          ? { ...action.profile, role: p.role, createdAt: p.createdAt }
          : p,
      );
      break;
    }
    case "report": {
      if (
        ![
          "Spam",
          "Taciz",
          "Nefret söylemi",
          "Taklit hesap",
          "Uygunsuz içerik",
          "Diğer",
        ].includes(action.reason)
      )
        throw new Error("Bir rapor nedeni seç.");
      if (action.kind === "post") post(action.targetId);
      else if (!s.profiles.some((p) => p.id === action.targetId))
        throw new Error("Hesap bulunamadı.");
      if (
        s.reports.some(
          (r) =>
            r.userId === userId &&
            r.targetId === action.targetId &&
            r.status === "open",
        )
      )
        throw new Error("Bu içerik için açık bir raporun var.");
      s.reports.push({
        id: id(),
        userId,
        targetId: action.targetId,
        kind: action.kind,
        reason: action.reason,
        status: "open",
        createdAt: date(),
      });
      break;
    }
    case "read":
      s.notifications = s.notifications.map((n) =>
        n.recipientId === userId && (!action.id || n.id === action.id)
          ? { ...n, read: true }
          : n,
      );
      break;
    case "preferences":
      s.preferences = action.preferences;
      break;
    case "moderate": {
      if (me.role !== "moderator")
        throw new Error("Moderatör yetkisi gerekli.");
      const r = s.reports.find((r) => r.id === action.id);
      if (!r) throw new Error("Rapor bulunamadı.");
      r.status = "resolved";
      if (action.hide && r.kind === "post") {
        const p = s.posts.find((p) => p.id === r.targetId);
        if (p) p.hidden = true;
      }
      break;
    }
  }
  return s;
}
