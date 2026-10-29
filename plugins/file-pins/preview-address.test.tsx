import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewAddress } from "./preview-address.js";

it("keeps addresses compact on keyboard focus and preserves the full accessible value", () => {
  const address = "https://example.com/guides/very/deep/Planning-Notes.html?next=/other";
  const compact = renderToStaticMarkup(<PreviewAddress value={address} focused={false} />);
  const focused = renderToStaticMarkup(<PreviewAddress value={address} focused />);

  expect(compact).toContain('aria-hidden="true">https://exam…/Planning-Notes.html</span>');
  expect(compact).toContain("truncate");
  expect(focused).toContain('aria-hidden="true">https://exam…/Planning-Notes.html</span>');
  expect(focused).toContain(`<span class="sr-only">${address}</span>`);
  expect(focused).toContain(`title="${address}"`);
  expect(focused).not.toContain("overflow-x-auto");
  expect(focused).toContain("truncate");
  expect(focused).toContain("ring-inset ring-ring");
});
