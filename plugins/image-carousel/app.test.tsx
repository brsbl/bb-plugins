// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, beforeAll, expect, it } from "vitest";
import type { Carousel } from "./model.js";

beforeAll(() => { URL.createObjectURL ??= () => "blob:image"; });
afterEach(cleanup);
const image = (sha: string) => ({ sha256: sha.repeat(64), mimeType: "image/png" as const, name: `${sha}.png` });
const pairs: Carousel = { id: "ic_abcdefabcdef", threadId: "thr_1", kind: "before-after", title: "Switcher changes", createdAt: "2026-10-10T00:00:00Z", slides: [
  { title: "Search", description: "Type to find a workspace.", before: image("a"), after: image("b") },
  { title: "Icons", description: "Colored tiles.", before: image("c"), after: image("d") },
] };

async function setup(carousel: Carousel) {
  const app = await loadPluginApp(() => import("./app.js"));
  renderSlot(app.messageDirectives[0]!, { attributes: { id: carousel.id }, source: `::image-carousel{id="${carousel.id}"}`, message: { id: "msg_1", threadId: "thr_1", turnId: null, projectId: null }, openWorkspaceFile: null }, {
    rpc: { get: () => carousel, image: () => ({ mimeType: "image/png", data: btoa("png") }) },
  });
  await screen.findByRole("region", { name: carousel.title });
}

it("advances the before and after images together and stops at each end", async () => {
  await setup(pairs);
  const previous = screen.getByRole("button", { name: "Previous slide" });
  const next = screen.getByRole("button", { name: "Next slide" });
  expect(previous.getAttribute("aria-disabled")).toBe("true");
  expect(await screen.findByAltText("Before: Search")).toBeTruthy();
  expect(await screen.findByAltText("After: Search")).toBeTruthy();
  expect(screen.getByText("1 / 2")).toBeTruthy();
  fireEvent.click(next);
  expect(await screen.findByAltText("Before: Icons")).toBeTruthy();
  expect(await screen.findByAltText("After: Icons")).toBeTruthy();
  expect(screen.getByText("Colored tiles.")).toBeTruthy();
  expect(screen.getByText("2 / 2")).toBeTruthy();
  expect(next.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(next);
  expect(screen.getByText("2 / 2")).toBeTruthy();
  fireEvent.keyDown(next, { key: "ArrowLeft" });
  await waitFor(() => expect(screen.getByText("1 / 2")).toBeTruthy());
});

it("shows a research slide with its source host", async () => {
  await setup({ id: "ic_abcdefabcdef", threadId: "thr_1", kind: "research", createdAt: "2026-10-10T00:00:00Z", slides: [
    { title: "Product A", description: "Search first.", image: image("e"), source: "https://example.com/app" },
  ] });
  expect(await screen.findByAltText("Product A")).toBeTruthy();
  expect(screen.getByRole("link", { name: /example\.com/ }).getAttribute("href")).toBe("https://example.com/app");
  expect(screen.getByRole("button", { name: "Next slide" }).getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "View full size: Product A" }));
  expect(screen.getByRole("dialog", { name: "Product A" })).toBeTruthy();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("keeps the image set, captions, and keyboard navigation in the expanded viewer", async () => {
  await setup(pairs);
  fireEvent.click(await screen.findByRole("button", { name: "View full size: After: Search" }));
  const dialog = screen.getByRole("dialog");
  const { within } = await import("@testing-library/react");
  expect(within(dialog).getByText("2 of 4")).toBeTruthy();
  expect(within(dialog).getByText("Type to find a workspace.")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Next image" }));
  expect(await within(dialog).findByAltText("Before: Icons")).toBeTruthy();
  expect(within(dialog).getByText("3 of 4")).toBeTruthy();
  fireEvent.keyDown(dialog, { key: "ArrowRight" });
  expect(await within(dialog).findByAltText("After: Icons")).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: "Next image" }).getAttribute("aria-disabled")).toBe("true");
  fireEvent.keyDown(dialog, { key: "ArrowLeft" });
  expect(await within(dialog).findByAltText("Before: Icons")).toBeTruthy();
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("2 / 2")).toBeTruthy();
});
