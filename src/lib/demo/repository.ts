import { openDB } from "idb";
import { type Repository, type State, type Action } from "../model";
import { seed } from "../seed";
import { reduceAction } from "./engine";
import { validateImage } from "../validation";
const db = () =>
  openDB("papi-demo-v1", 1, {
    upgrade(db) {
      db.createObjectStore("data");
    },
  });
export class DemoRepository implements Repository {
  constructor(private user: () => string | null) {}
  async load(): Promise<State> {
    const d = await db();
    let state = (await d.get("data", "state")) as State | undefined;
    if (!state) {
      state = seed();
      await d.put("data", state, "state");
    }
    return state;
  }
  async act(action: Action) {
    const d = await db();
    const tx = d.transaction("data", "readwrite");
    const old = (await tx.store.get("state")) as State;
    const next = reduceAction(old ?? seed(), action, this.user());
    await tx.store.put(next, "state");
    await tx.done;
  }
  async upload(file: File) {
    await validateImage(file);
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error("Görsel çözümlenemedi. Geçerli bir fotoğraf seç.");
    }
    if (bitmap.width * bitmap.height > 40_000_000) {
      bitmap.close();
      throw new Error("Görsel en fazla 40 megapiksel olabilir.");
    }
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      throw new Error("Görsel hazırlanamadı.");
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Görsel hazırlanamadı."))),
        "image/webp",
        0.85,
      ),
    );
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Görsel okunamadı."));
      reader.readAsDataURL(blob);
    });
  }
  async reset() {
    const d = await db();
    await d.put("data", seed(), "state");
  }
}
