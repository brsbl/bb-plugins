import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { expect, it } from "vitest";
import { PreviewAddress } from "./preview-address.js";

it("renders one header line at rest, on hover, and on keyboard focus", async () => {
  const css = readFileSync(new URL("./dist/app.css", import.meta.url), "utf8");
  const address = "https://example.com/guides/very/deep/Planning-Notes.html?next=/other";
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.setContent(`<style>${css}</style>
        <div style="width:288px" id="default">${renderToStaticMarkup(<PreviewAddress value={address} focused={false} />)}</div>
        <div style="width:288px" id="hover">${renderToStaticMarkup(<PreviewAddress value={address} focused={false} />)}</div>
        <div style="width:288px" id="focused" tabindex="0">${renderToStaticMarkup(<PreviewAddress value={address} focused />)}</div>`);
      await page.hover("#hover");
      await page.focus("#focused");
      for (const state of ["default", "hover", "focused"]) {
        const lines = await page.locator(`#${state} [aria-hidden="true"]`).evaluate((text) => text.getClientRects().length);
        expect(lines, `${state} header at ${width}px`).toBe(1);
      }
      const scrollable = await page.locator("#focused > div").evaluate((header) => header.scrollWidth > header.clientWidth);
      expect(scrollable, `focused address can scroll at ${width}px`).toBe(true);
    }
  } finally {
    await browser.close();
  }
}, 30_000);
