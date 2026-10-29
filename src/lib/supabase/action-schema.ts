import { z } from "zod";
import { postSchema, profileSchema, commentSchema } from "../validation";
const id = z.string().uuid();
const media = z
  .string()
  .regex(/^\/api\/media\?path=[a-f0-9-]+%2F[a-f0-9-]+\.(jpg|png|webp)$/i);
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("post"),
    post: postSchema.and(
      z.object({
        id,
        authorId: id,
        media: z.array(media).max(4),
        createdAt: z.string(),
        hidden: z.boolean(),
      }),
    ),
  }),
  z.object({ type: z.literal("deletePost"), id }),
  ...(["like", "bookmark", "follow", "block", "deleteComment"] as const).map(
    (type) => z.object({ type: z.literal(type), id }),
  ),
  z.object({ type: z.literal("comment"), postId: id, text: commentSchema }),
  z.object({
    type: z.literal("profile"),
    profile: profileSchema.extend({
      id,
      avatar: z.union([media, z.literal("")]),
      cover: z.union([media, z.literal("")]),
      role: z.enum(["member", "moderator"]),
      createdAt: z.string(),
    }),
  }),
  z.object({
    type: z.literal("report"),
    targetId: id,
    kind: z.enum(["post", "profile"]),
    reason: z.enum([
      "Spam",
      "Taciz",
      "Nefret söylemi",
      "Taklit hesap",
      "Uygunsuz içerik",
      "Diğer",
    ]),
  }),
  z.object({ type: z.literal("read"), id: id.optional() }),
  z.object({
    type: z.literal("preferences"),
    preferences: z.object({
      theme: z.enum(["dark", "light"]),
      notifications: z.boolean(),
    }),
  }),
  z.object({ type: z.literal("moderate"), id, hide: z.boolean() }),
]);
