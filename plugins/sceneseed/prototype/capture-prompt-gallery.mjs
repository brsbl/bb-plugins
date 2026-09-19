import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

const dataPath = fileURLToPath(
  new URL("./generated/prompt-gallery-scenes.json", import.meta.url),
);
const screenshotDirectory = fileURLToPath(
  new URL("../docs/prompt-gallery/", import.meta.url),
);
const reportPath = fileURLToPath(
  new URL("../docs/prompt-gallery/capture-report.json", import.meta.url),
);
const gallery = JSON.parse(await readFile(dataPath, "utf8"));
const galleryOnly = process.argv.includes("--gallery-only");
const chromePath = process.env.SCENESEED_CHROME_PATH;
if (!chromePath) {
  throw new Error(
    "Set SCENESEED_CHROME_PATH to the Chrome for Testing executable.",
  );
}
const origin = process.env.SCENESEED_GALLERY_ORIGIN ?? "http://127.0.0.1:61000";
const viewport = { width: 1440, height: 900 };

if (gallery.count !== 50 || gallery.entries.length !== 50) {
  throw new Error(
    `Expected 50 compiled prompt entries, received ${gallery.entries.length}.`,
  );
}
if (gallery.failures.length > 0) {
  throw new Error(`Generation already reported ${gallery.failures.length} failures.`);
}

await mkdir(screenshotDirectory, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const browserVersion = await browser.version();
const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
const runtimeErrors = [];
let activePromptId = "startup";
page.on("console", (message) => {
  if (message.type() === "error") {
    runtimeErrors.push({ promptId: activePromptId, type: "console", text: message.text() });
  }
});
page.on("pageerror", (error) => {
  runtimeErrors.push({ promptId: activePromptId, type: "pageerror", text: error.message });
});

const captures = [];
const failures = [];

if (galleryOnly) {
  try {
    const previous = JSON.parse(await readFile(reportPath, "utf8"));
    captures.push(...previous.captures);
  } catch {
    failures.push({
      id: "gallery",
      message: "Gallery-only verification requires an existing capture report.",
    });
  }
}

for (const entry of galleryOnly ? [] : gallery.entries) {
  activePromptId = entry.id;
  const filename = `${String(entry.index).padStart(2, "0")}-${entry.id}.png`;
  const outputPath = `${screenshotDirectory}${filename}`;
  try {
    const url = `${origin}/?story=diorama--prompt-gallery--capture&prompt-id=${encodeURIComponent(entry.id)}&theme=light&mode=preview`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForFunction(
      (promptId) => {
        const root = document.querySelector(`[data-prompt-id="${promptId}"]`);
        return root?.getAttribute("data-gallery-ready") === "true";
      },
      entry.id,
      { timeout: 20_000 },
    );
    const state = await page.evaluate((promptId) => {
      const root = document.querySelector(`[data-prompt-id="${promptId}"]`);
      const canvas = root?.querySelector("canvas");
      return {
        promptId: root?.getAttribute("data-prompt-id") ?? null,
        renderStatus: root?.getAttribute("data-render-status") ?? null,
        canvasWidth: canvas?.width ?? 0,
        canvasHeight: canvas?.height ?? 0,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    }, entry.id);
    if (
      state.promptId !== entry.id ||
      state.renderStatus !== "ready" ||
      state.canvasWidth < 1 ||
      state.canvasHeight < 1 ||
      state.bodyScrollWidth > state.viewportWidth
    ) {
      throw new Error(`Invalid rendered state: ${JSON.stringify(state)}`);
    }
    await page.screenshot({ path: outputPath, type: "png", fullPage: false });
    const imageStats = await stat(outputPath);
    if (imageStats.size < 10_000) {
      throw new Error(`Screenshot is unexpectedly small (${imageStats.size} bytes).`);
    }
    captures.push({
      id: entry.id,
      index: entry.index,
      category: entry.category,
      filename,
      bytes: imageStats.size,
      vertices: entry.scene.stats.vertices,
      objects: entry.scene.stats.objects,
      state,
    });
  } catch (error) {
    failures.push({
      id: entry.id,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

activePromptId = "gallery";
let galleryCheck = null;
try {
  await page.goto(`${origin}/?story=diorama--prompt-gallery--gallery&theme=light&mode=preview`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await page.waitForSelector('[data-gallery-ready="true"]', { timeout: 20_000 });
  await page.waitForFunction(
    () => {
      const images = Array.from(document.querySelectorAll(".prompt-gallery-grid img"));
      return (
        images.length === 50 &&
        images.every(
          (image) => image.complete && image.naturalWidth === 1440 && image.naturalHeight === 900,
        )
      );
    },
    undefined,
    { timeout: 30_000 },
  );
  galleryCheck = await page.evaluate(() => ({
    cards: document.querySelectorAll(".prompt-gallery-grid article").length,
    images: document.querySelectorAll(".prompt-gallery-grid img").length,
    categories: Array.from(
      document.querySelectorAll(".prompt-gallery-index > section > header h2"),
    ).map((node) => node.textContent),
    bodyScrollWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  if (
    galleryCheck.cards !== 50 ||
    galleryCheck.images !== 50 ||
    galleryCheck.categories.length !== 3 ||
    galleryCheck.bodyScrollWidth > galleryCheck.viewportWidth
  ) {
    failures.push({ id: "gallery", message: `Invalid gallery: ${JSON.stringify(galleryCheck)}` });
  }
} catch (error) {
  failures.push({
    id: "gallery",
    message: error instanceof Error ? error.message : String(error),
  });
}

await browser.close();
const report = {
  origin,
  browser: `Chrome for Testing ${browserVersion}`,
  viewport,
  expected: 50,
  captured: captures.length,
  captures,
  gallery: galleryCheck,
  runtimeErrors,
  failures,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      reportPath,
      captured: captures.length,
      gallery: galleryCheck,
      runtimeErrors: runtimeErrors.length,
      failures,
    },
    null,
    2,
  ),
);
if (captures.length !== 50 || runtimeErrors.length > 0 || failures.length > 0) {
  process.exitCode = 1;
}
