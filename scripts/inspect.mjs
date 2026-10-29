import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chromium" });
const page = await browser.newPage({ viewport: { width: 320, height: 900 } });
await page.goto("http://127.0.0.1:3000/");
console.log(
  await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .map((e) => ({
        tag: e.tagName,
        cls: e.className,
        left: e.getBoundingClientRect().left,
        right: e.getBoundingClientRect().right,
        width: e.getBoundingClientRect().width,
      }))
      .filter((r) => r.right > innerWidth + 1 || r.left < -1),
  ),
);
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto("http://127.0.0.1:3000/feed");
await page.locator(".post-card").first().waitFor();
await page.screenshot({ path: "docs/feed-desktop.png" });
await page.goto("http://127.0.0.1:3000/");
await page.screenshot({ path: "docs/landing-desktop.png" });
await browser.close();
