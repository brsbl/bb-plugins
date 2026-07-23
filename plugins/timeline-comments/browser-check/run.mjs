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
const address = server.address();
if (address === null || typeof address === "string") {
  throw new Error("Browser check server did not bind a TCP port");
}
const browser = await chromium.launch({ headless: true });
try {
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
    const cluster = markers.find(
      (marker) => marker.querySelector(".bb-comments-marker-count") !== null,
    );
    const clusterIconRect = cluster
      ?.querySelector("svg")
      ?.getBoundingClientRect();
    const clusterCountRect = cluster
      ?.querySelector(".bb-comments-marker-count")
      ?.getBoundingClientRect();
    return {
      usesRightRail: markers.every(
        (marker) => marker.dataset.bbCommentGutter === "right",
      ),
      countIsGutterSide:
        clusterIconRect !== undefined &&
        clusterCountRect !== undefined &&
        clusterCountRect.left >= clusterIconRect.right,
      popoverBounded:
        popoverRect !== undefined &&
        popoverRect.left >= 0 &&
        popoverRect.right <= window.innerWidth,
    };
  });
  if (
    !narrow.usesRightRail ||
    !narrow.countIsGutterSide ||
    !narrow.popoverBounded
  ) {
    throw new Error("Narrow viewport did not retain a bounded right gutter");
  }
  await page.setViewportSize({ width: 900, height: 600 });
  await page.waitForTimeout(100);
  await page
    .locator(
      '.bb-comments-actions-menu > summary[aria-label="Comment actions"]',
    )
    .click();
  await page
    .locator(".bb-comments-actions-menu button", { hasText: "Edit" })
    .click();
  await page.waitForTimeout(50);
  await page.screenshot({ path: screenshot });
} finally {
  await browser.close();
  server.close();
}
console.log(
  `Timeline comments browser check passed. Screenshot: ${screenshot}`,
);
