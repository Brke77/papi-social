import { test, expect } from "@playwright/test";
test("chat sends once, persists, and works on mobile", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Demo hesabıyla devam et" }).click();
  await page.goto("/messages?q=miraekin");
  await expect(page.getByRole("heading", { name: "Mesajlar." })).toBeVisible();
  await page.getByLabel("Mesajın").fill("Kalıcı sohbet testi");
  await page.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  await expect(page.locator(".chat-bubble")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".chat-bubble")).toContainText(
    "Kalıcı sohbet testi",
  );
  await page.setViewportSize({ width: 320, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/login");
  await page.getByRole("link", { name: "Yerel moderasyon demosu" }).click();
  await page.goto("/messages?q=miraekin");
  await expect(page.locator(".chat-bubble")).toHaveCount(0);
});
