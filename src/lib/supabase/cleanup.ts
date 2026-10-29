import "server-only";
import { storageAdmin } from "./storage-admin";
export async function cleanupMedia(ownerId: string) {
  if (!process.env.SUPABASE_SECRET_KEY) return;
  const admin = storageAdmin();
  const { data, error } = await admin
    .from("media_deletions")
    .select("path")
    .eq("owner_id", ownerId)
    .limit(30);
  if (error || !data?.length) return;
  for (const { path } of data) {
    const url = `/api/media?path=${encodeURIComponent(path)}`;
    const [posts, profiles] = await Promise.all([
      admin.from("posts").select("id").contains("media", [url]).limit(1),
      admin
        .from("profiles")
        .select("id")
        .or(`avatar.eq.${url},cover.eq.${url}`)
        .limit(1),
    ]);
    if (
      posts.error ||
      profiles.error ||
      posts.data.length ||
      profiles.data.length
    )
      continue;
    const removed = await admin.storage.from("media").remove([path]);
    if (!removed.error)
      await admin.from("media_deletions").delete().eq("path", path);
  }
}
