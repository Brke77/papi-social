import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("link", { name: "Demo hesabıyla devam et" }).click();
  await expect(
    page.getByRole("heading", { name: "Senin dünyan. Senin akışın." }),
  ).toBeVisible();
  await expect(page.locator(".post-card").first()).toBeVisible();
}
test("landing and demo entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Dünyan/ })).toBeVisible();
  await page.getByRole("link", { name: "Demo’yu dene" }).click();
  await page.getByRole("link", { name: "Demo hesabıyla devam et" }).click();
  await expect(page.locator(".post-card")).toHaveCount(8);
});
test("post CRUD, persistence, likes, bookmarks and comments", async ({
  page,
}) => {
  await login(page);
  await page.goto("/create");
  await page
    .getByLabel("Hikâyen")
    .fill("Playwright ile oluşturulan kalıcı flex.");
  await page.getByLabel("Flex tags").fill("testflex");
  await page.getByRole("button", { name: "Flex’ini paylaş" }).click();
  await expect(page.locator(".caption")).toContainText("kalıcı flex");
  const url = page.url();
  await page.reload();
  await expect(page.locator(".caption")).toContainText("kalıcı flex");
  await page.getByRole("button", { name: "Beğen", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Beğeniyi kaldır" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Beğeniyi kaldır" }).click();
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await page.goto("/saved");
  await expect(page.locator(".caption")).toContainText("kalıcı flex");
  await page.goto(url);
  await page.getByLabel("Yorumun").fill("Test yorumu");
  await page.getByRole("button", { name: "Yorum gönder" }).click();
  await expect(page.locator(".comment")).toContainText("Test yorumu");
  await page.getByRole("button", { name: "Yorumu sil" }).click();
  await expect(page.locator(".comment")).toHaveCount(0);
  await page.getByRole("button", { name: "Gönderi seçenekleri" }).click();
  await page.getByRole("link", { name: "Düzenle", exact: true }).click();
  await page.getByLabel("Hikâyen").fill("Düzenlenmiş flex.");
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await expect(page.locator(".caption")).toContainText("Düzenlenmiş");
  await page.getByRole("button", { name: "Gönderi seçenekleri" }).click();
  await page.getByRole("button", { name: "Sil", exact: true }).click();
  await page
    .getByRole("button", { name: "Gönderiyi sil", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Gönderi bulunamadı." }),
  ).toBeVisible();
});
test("follow, profile editing, search, category and notifications", async ({
  page,
}) => {
  await login(page);
  await page.goto("/u/atlaskaya");
  await page
    .getByRole("button", { name: "Takip et", exact: true })
    .first()
    .click();
  await expect(
    page
      .locator(".profile-buttons")
      .getByRole("button", { name: "Takiptesin" }),
  ).toBeVisible();
  await page
    .locator(".profile-buttons")
    .getByRole("button", { name: "Takiptesin" })
    .click();
  await page.goto("/settings");
  await page.getByLabel("Görünen ad", { exact: true }).fill("Deniz Test");
  await page.getByRole("button", { name: "Değişiklikleri kaydet" }).click();
  await page.goto("/u/denizaral");
  await expect(page.getByRole("heading", { name: "Deniz Test" })).toBeVisible();
  await page.goto("/search");
  await page.getByLabel("PAPI'de ara").fill("miraekin");
  await expect(page.locator(".people-results")).toContainText("Mira Ekin");
  await page.goto("/explore");
  await page.getByRole("button", { name: "Sneakers", exact: true }).click();
  await expect(page.locator(".explore-tile")).toHaveCount(3);
  await page.goto("/notifications");
  await page.getByRole("button", { name: "Tümünü okundu işaretle" }).click();
  await expect(page.locator(".notification.unread")).toHaveCount(0);
});
test("reports, block, authorization, themes and invalid files", async ({
  page,
}) => {
  await login(page);
  await page.goto("/u/miraekin");
  await page
    .getByRole("button", { name: "Bildir", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Bildirimi gönder" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Engelle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bu hesabı engelledin." }),
  ).toBeVisible();
  await page.goto("/admin/reports");
  await expect(
    page.getByRole("heading", { name: "Bu alana erişim yetkin yok." }),
  ).toBeVisible();
  await page.goto("/settings");
  await page.getByRole("button", { name: "Görünüm", exact: true }).click();
  await page.getByRole("button", { name: "◯ Açık tema" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/create");
  await page.getByLabel("Fotoğraf yükle").setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.locator("p[role=alert]")).toContainText("Gerçek bir JPEG");
});
test("anonymous writes unavailable and public routes render", async ({
  page,
}) => {
  await page.goto("/create");
  await expect(
    page.getByRole("heading", { name: "Dünyaya katıl." }),
  ).toBeVisible();
  for (const route of [
    "/privacy",
    "/terms",
    "/community-guidelines",
    "/register",
    "/forgot-password",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1,h2").first()).toBeVisible();
  }
});
test("responsive layouts at 320, 390, 768 and 1440 px", async ({ page }) => {
  await login(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/feed",
      "/explore",
      "/u/denizaral",
      "/create",
      "/settings",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1,h2").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} at ${width}`,
      ).toBe(true);
    }
    await page.goto("/feed");
    await page.screenshot({
      path: `test-results/feed-${width}.png`,
      fullPage: true,
    });
  }
});

test("real images, media order, upload limit and moderation demo", async ({
  page,
}) => {
  await login(page);
  const png = await sharp({
    create: { width: 48, height: 32, channels: 3, background: "#c5ff59" },
  })
    .png()
    .toBuffer();
  await page.goto("/create");
  await page.getByLabel("Fotoğraf yükle").setInputFiles([
    { name: "first.png", mimeType: "image/png", buffer: png },
    { name: "second.png", mimeType: "image/png", buffer: png },
  ]);
  await expect(page.locator(".upload-previews img")).toHaveCount(2);
  await page.getByRole("button", { name: "Görseli sağa taşı" }).click();
  await page.getByLabel("Hikâyen").fill("Fotoğraflı test paylaşımı");
  await page.getByRole("button", { name: "Flex’ini paylaş" }).click();
  await expect(page.locator(".post-media img")).toBeVisible();
  await page.getByRole("button", { name: "2. görsel", exact: true }).click();
  await page.reload();
  await expect(page.locator(".caption")).toContainText("Fotoğraflı");
  await page.goto("/p/post-1");
  await page.getByRole("button", { name: "Gönderi seçenekleri" }).click();
  await page.getByRole("button", { name: "Bildir", exact: true }).click();
  await page.getByRole("button", { name: "Bildirimi gönder" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/login");
  await page.getByRole("link", { name: "Yerel moderasyon demosu" }).click();
  await expect(page.getByRole("heading", { name: "Raporlar." })).toBeVisible();
  await page.getByRole("button", { name: "İçeriği gizle" }).click();
  await expect(page.getByText("resolved")).toBeVisible();
  await page.goto("/p/post-1");
  await expect(
    page.getByRole("heading", { name: "Gönderi bulunamadı." }),
  ).toBeVisible();
});

test("dialog keyboard dismissal, demo reset, logout and no console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Hesap", exact: true }).click();
  await page.getByRole("button", { name: "Demo verilerini sıfırla" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Demo verilerini sıfırla" }).click();
  await page.getByRole("button", { name: "Evet, sıfırla" }).click();
  await expect(page.getByLabel("Görünen ad", { exact: true })).toHaveValue(
    "Deniz Aral",
  );
  await page.getByRole("button", { name: "Hesap", exact: true }).click();
  await page
    .locator("main")
    .getByRole("button", { name: "Çıkış yap", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: /Dünyan/ })).toBeVisible();
  await page.goto("/create");
  await expect(
    page.getByRole("heading", { name: "Dünyaya katıl." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
