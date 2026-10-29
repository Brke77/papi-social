export const categories = [
  "Streetwear",
  "Sneakers",
  "Otomobil",
  "Saat & Aksesuar",
  "Setup",
  "Teknoloji",
  "Seyahat",
  "Fotoğraf",
  "Koleksiyon",
  "Fitness",
  "Sanat",
  "Başarılar",
  "Lifestyle",
  "Diğer",
] as const;
export type Profile = {
  id: string;
  username: string;
  name: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  cover: string;
  role: "member" | "moderator";
  createdAt: string;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
};
export type Post = {
  id: string;
  authorId: string;
  caption: string;
  category: string;
  media: string[];
  tags: string[];
  createdAt: string;
  hidden: boolean;
  likeCount?: number;
  commentCount?: number;
};
export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
};
export type Relation = { userId: string; targetId: string };
export type Notice = {
  id: string;
  recipientId: string;
  actorId: string;
  type: "like" | "comment" | "follow";
  targetId: string;
  read: boolean;
  createdAt: string;
};
export type Report = {
  id: string;
  userId: string;
  targetId: string;
  kind: "post" | "profile";
  reason: string;
  status: "open" | "resolved";
  createdAt: string;
};
export type Preferences = { theme: "dark" | "light"; notifications: boolean };
export type State = {
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  likes: Relation[];
  follows: Relation[];
  bookmarks: Relation[];
  blocks: Relation[];
  notifications: Notice[];
  reports: Report[];
  preferences: Preferences;
};
export type Action =
  | { type: "post"; post: Post }
  | { type: "deletePost"; id: string }
  | { type: "like" | "bookmark" | "follow" | "block"; id: string }
  | { type: "comment"; postId: string; text: string }
  | { type: "deleteComment"; id: string }
  | { type: "profile"; profile: Profile }
  | {
      type: "report";
      targetId: string;
      kind: "post" | "profile";
      reason: string;
    }
  | { type: "read"; id?: string }
  | { type: "preferences"; preferences: Preferences }
  | { type: "moderate"; id: string; hide: boolean };
export type FeedQuery = { q?: string; category?: string; tab?: string };
export interface Repository {
  load(offset?: number, query?: FeedQuery): Promise<State>;
  act(action: Action): Promise<void>;
  upload(file: File): Promise<string>;
  reset?(): Promise<void>;
}
export const mode =
  process.env.NEXT_PUBLIC_DATA_MODE === "supabase" ? "supabase" : "demo";
export const demoId = "demo-0";
export const demoModeratorId = "demo-11";
export function visiblePosts(state: State, userId: string | null) {
  return state.posts.filter(
    (p) =>
      !p.hidden &&
      !state.blocks.some(
        (b) =>
          (b.userId === userId && b.targetId === p.authorId) ||
          (b.targetId === userId && b.userId === p.authorId),
      ),
  );
}
export function rankPosts(
  posts: Post[],
  state: State,
  now = Date.now(),
  userId: string | null = null,
) {
  return [...posts].sort((a, b) => score(b) - score(a));
  function score(p: Post) {
    const hours = Math.max(0, (now - Date.parse(p.createdAt)) / 3600000);
    return (
      24 / (hours + 2) +
      Math.log1p(
        p.likeCount ?? state.likes.filter((l) => l.targetId === p.id).length,
      ) *
        2 +
      Math.log1p(
        p.commentCount ??
          state.comments.filter((c) => c.postId === p.id).length,
      ) +
      (state.follows.some(
        (f) => f.userId === userId && f.targetId === p.authorId,
      )
        ? 1.5
        : 0)
    );
  }
}
