import { test, expect } from "@playwright/test";
test("chat popup preserves page, draft and messages when minimized", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Demo hesabıyla devam et" }).click();
  await page.goto("/u/miraekin");
  const profileUrl = page.url();
  await page.getByRole("link", { name: "Mesaj gönder", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Mesaj penceresi" }),
  ).toBeVisible();
  expect(page.url()).toBe(profileUrl);
  await page.getByLabel("Mesajın").fill("Kalıcı sohbet testi");
  await page.getByRole("button", { name: "Mesajları küçült" }).click();
  await expect(
    page.getByRole("region", { name: "Mesaj penceresi" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Mesajları aç" }).click();
  await expect(page.getByLabel("Mesajın")).toHaveValue("Kalıcı sohbet testi");
  await page.getByRole("button", { name: "Mesajları büyüt" }).click();
  await expect(page.locator(".chat-dock")).toHaveClass(/expanded/);
  await page.getByRole("button", { name: "Mesaj gönder", exact: true }).click();
  await expect(page.locator(".chat-bubble")).toHaveCount(1);
  await page.setViewportSize({ width: 320, height: 850 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/messages?q=miraekin");
  await expect(page.locator(".chat-bubble")).toContainText(
    "Kalıcı sohbet testi",
  );
  await page.goto("/login");
  await page.getByRole("link", { name: "Yerel moderasyon demosu" }).click();
  await page.goto("/messages?q=miraekin");
  await expect(page.locator(".chat-bubble")).toHaveCount(0);
});
