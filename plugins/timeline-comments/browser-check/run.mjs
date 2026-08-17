import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";

const output = mkdtempSync(join(tmpdir(), "bb-timeline-comments-browser-"));
await build({
  entryPoints: [new URL("./harness.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  outfile: join(output, "harness.js"),
  external: ["@bb/plugin-sdk/app"],
  loader: { ".css": "css" },
});
copyFileSync(
  new URL("./harness.html", import.meta.url),
  join(output, "harness.html"),
);

const screenshot =
  process.env.BB_TIMELINE_COMMENTS_SCREENSHOT ?? join(output, "screenshot.png");
const server = createServer((request, response) => {
  const file = (request.url ?? "/").replace(/^\//u, "") || "harness.html";
  if (!["harness.html", "harness.js", "harness.css"].includes(file)) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader(
    "content-type",
    file.endsWith(".html")
      ? "text/html"
      : file.endsWith(".js")
        ? "text/javascript"
        : "text/css",
  );
  response.end(readFileSync(join(output, file)));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Browser check server did not bind a TCP port");
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BB_CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.BB_CHROME_EXECUTABLE_PATH }
      : {}),
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  await page.goto(`http://127.0.0.1:${address.port}/harness.html`);
  await page.waitForFunction(
    () => document.body.dataset.testStatus !== "running",
    undefined,
    { timeout: 5_000 },
  );
  const status = await page.locator("body").getAttribute("data-test-status");
  const result = await page.locator("#result").textContent();
  if (status !== "passed") throw new Error(result ?? "Unknown browser failure");
  await page.setViewportSize({ width: 480, height: 600 });
  await page.waitForTimeout(100);
  const narrow = await page.evaluate(() => {
    const markers = [...document.querySelectorAll(".bb-comments-marker")];
    const popover = document.querySelector(".bb-comments-thread");
    const popoverRect = popover?.getBoundingClientRect();
    return {
      markerCount: markers.length,
      popoverHidden: popoverRect === undefined,
    };
  });
  if (narrow.markerCount !== 0 || !narrow.popoverHidden) {
    throw new Error(
      `Narrow viewport did not hide gutter comments cleanly: ${JSON.stringify(narrow)}`,
    );
  }
  await page.setViewportSize({ width: 900, height: 600 });
  const restoredMarker = page.locator(".bb-comments-marker").first();
  await restoredMarker.waitFor({ state: "visible" });
  await restoredMarker.click();
  await page.waitForFunction(
    () =>
      document.querySelector(".bb-comments-cluster") !== null ||
      document.querySelector(".bb-comments-thread") !== null,
  );
  const restoredCluster = page.locator(
    '.bb-comments-cluster[aria-label="Comment threads"]',
  );
  if (await restoredCluster.isVisible()) {
    await restoredCluster.locator(".bb-comments-cluster-row").first().click();
  }
  await page.locator(".bb-comments-thread").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const scroller = document.querySelector(".bb-comments-thread-comments");
    if (!(scroller instanceof HTMLElement)) return false;
    const viewport = scroller.getBoundingClientRect();
    return [
      ...scroller.querySelectorAll(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      ),
    ].some((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
    });
  });
  const openedActions = await page.evaluate(() => {
    const scroller = document.querySelector(".bb-comments-thread-comments");
    if (!(scroller instanceof HTMLElement)) return false;
    const viewport = scroller.getBoundingClientRect();
    const trigger = [
      ...scroller.querySelectorAll(
        '.bb-comments-actions-menu > button[aria-label="Comment actions"]',
      ),
    ].find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      return rect.top >= viewport.top && rect.bottom <= viewport.bottom;
    });
    if (!(trigger instanceof HTMLButtonElement)) return false;
    trigger.click();
    return true;
  });
  if (!openedActions) {
    throw new Error("Responsive re-entry did not restore a visible comment action");
  }
  await page.locator(".bb-comments-actions-popover").waitFor({ state: "visible" });
  const startedEdit = await page.evaluate(() => {
    const edit = [...document.querySelectorAll(".bb-comments-actions-popover button")]
      .find((button) => button.textContent?.trim() === "Edit");
    if (!(edit instanceof HTMLButtonElement)) return false;
    edit.click();
    return true;
  });
  if (!startedEdit) throw new Error("Responsive re-entry did not restore editing");
  await page
    .locator('[data-comment-editing="true"]')
    .waitFor({ state: "visible" });
  await page.waitForTimeout(50);
  const focusedEditInput = await page
    .locator('[data-comment-editing="true"] textarea')
    .evaluate((textarea) => {
      const style = getComputedStyle(textarea);
      return {
        active: document.activeElement === textarea,
        outlineStyle: style.outlineStyle,
      };
    });
  if (!focusedEditInput.active || focusedEditInput.outlineStyle !== "auto") {
    throw new Error(
      `Edit input did not keep the browser-native focus outline: ${JSON.stringify(focusedEditInput)}`,
    );
  }
  await page.screenshot({ path: screenshot });
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(
  `Timeline comments browser check passed. Screenshot: ${screenshot}`,
);
