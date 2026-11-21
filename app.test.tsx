// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("./editor-panel", () => ({
  EditorStatus: () => null,
  MossEditorFrame: () => <div>Editable note</div>,
}));

beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  window.localStorage.clear();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openNote(canOpenInMoss: boolean | undefined = false) {
  const app = await loadPluginApp(() => import("./app"));
  let adopted = false;
  const read = vi.fn(() => ({
    moss: true, hostId: "host-test", path: "/home/user/Moss/Notes/Plan/Plan.md",
    markdown: "# Plan", layout: null, noteId: adopted ? "note-1" : null,
    modifiedMs: 1, version: "unchanged-markdown", canOpenInMoss,
    frameUrl: "/viewer", htmlFrameUrl: "/html", assetRoute: "/assets",
    editor: adopted ? { noteId: "note-1", frameUrl: "/editor", htmlFrameUrl: "/html" } : null,
  }));
  const slot = renderSlot(app.fileOpeners[0]!, {
    path: "/home/user/Moss/Notes/Plan/Plan.md",
    source: { kind: "host", threadId: null, projectId: null, environmentId: null }, Original: () => null,
  }, { rpc: {
    read, watchNote: () => ({ version: "unchanged-markdown" }),
    editorKept: () => ({ receipt: null, receiptVersion: null, draft: null }),
  } });
  await waitFor(() => expect(slot.container.querySelector("iframe")).not.toBeNull());
  return { slot, read, adopt: () => { adopted = true; } };
}

it("explains an unadopted note without offering a broken Moss action on Linux", async () => {
  const { slot } = await openNote();
  expect(slot.getByText("Read-only until opened once in Moss on your Mac." )).toBeTruthy();
  expect(slot.queryByRole("button", { name: /Open in Moss/ })).toBeNull();
  expect(slot.queryByText("Editable note")).toBeNull();
});

it("makes Open in Moss the visible primary action when the host can open it", async () => {
  const { slot } = await openNote(true);
  expect(slot.getByText("Open once in Moss to edit and comment here.")).toBeTruthy();
  expect(slot.getByRole("button", { name: "Open in Moss" }).textContent).toContain("Open in Moss");
});

it.each(["focus", "visibilitychange"])("adopts a note on %s even when its Markdown version has not changed", async (event) => {
  const { slot, adopt } = await openNote();
  adopt();
  await act(async () => { fireEvent(event === "focus" ? window : document, new Event(event)); });
  await waitFor(() => expect(slot.getByText("Editable note")).toBeTruthy());
  expect(slot.queryByText("Read-only until opened once in Moss on your Mac.")).toBeNull();
});
