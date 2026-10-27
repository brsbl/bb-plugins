import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { expect, it } from "vitest";
import { PreviewAddress } from "./preview-address.js";

it("truncates to one non-scrolling header line at rest, on hover, and on keyboard focus", async () => {
  const css = readFileSync(new URL("./dist/app.css", import.meta.url), "utf8");
  const address = "https://example.com/guides/very/deep/WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.html";
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.setContent(`<style>${css}</style><div data-bb-plugin="file-pins">
        <div style="width:288px" id="default">${renderToStaticMarkup(<PreviewAddress value={address} focused={false} />)}</div>
        <div style="width:288px" id="hover">${renderToStaticMarkup(<PreviewAddress value={address} focused={false} />)}</div>
        <div style="width:288px" id="focused" tabindex="0">${renderToStaticMarkup(<PreviewAddress value={address} focused />)}</div></div>`);
      await page.hover("#hover");
      await page.focus("#focused");
      for (const state of ["default", "hover", "focused"]) {
        const lines = await page.locator(`#${state} [aria-hidden="true"]`).evaluate((text) =>
          new Set(Array.from(text.getClientRects(), (rect) => Math.round(rect.top))).size);
        expect(lines, `${state} header at ${width}px`).toBe(1);
      }
      for (const state of ["default", "hover", "focused"]) {
        const layout = await page.locator(`#${state} > div`).evaluate((header) => {
          const style = getComputedStyle(header);
          return { overflowX: style.overflowX, textOverflow: style.textOverflow, whiteSpace: style.whiteSpace };
        });
        expect(layout, `${state} address at ${width}px`).toEqual({ overflowX: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
      }
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowRight");
      expect(await page.locator("#focused > div").evaluate((header) => header.scrollLeft)).toBe(0);
    }
  } finally {
    await browser.close();
  }
}, 30_000);
