import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PreviewAddress } from "./preview-address.js";

it("shows the full address visibly while its pin has keyboard focus", () => {
  const address = "https://example.com/guides/very/deep/Planning-Notes.html?next=/other";
  const compact = renderToStaticMarkup(<PreviewAddress value={address} focused={false} />);
  const focused = renderToStaticMarkup(<PreviewAddress value={address} focused />);

  expect(compact).toContain('aria-hidden="true">https://exam…/Planning-Notes.html</span>');
  expect(compact).toContain("truncate");
  expect(focused).toContain(`aria-hidden="true">${address}</span>`);
  expect(focused).toContain("break-all whitespace-normal");
});
