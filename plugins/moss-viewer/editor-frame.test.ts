import { expect, it, vi } from "vitest";
import { closeEditor, statusLabel } from "./editor-frame.js";
import type * as Moss from "./vendor/moss-editor.contract.js";

const draft = (markdown: string): Moss.MossDraft => ({
  noteId: "6f1c2a8e-3b4d-4e5f-8a9b-0c1d2e3f4a5b",
  baseVersion: "v",
  companions: [],
  files: { markdown, comments: null, layout: null },
  intents: { frontmatterMetaUpdates: {}, commentColors: {} },
  at: 1,
});

function handle(results: Moss.MossUnmountResult[]) {
  const unmount = vi.fn(async () => results.shift()!);
  return { handle: { unmount } as unknown as Moss.MossEditorHandle, unmount };
}

it("names each save state once, marking the ones that need the user without relying on color", () => {
  expect(statusLabel("clean")).toEqual({ label: "Saved", icon: "Check", attention: false });
  expect(statusLabel("saving")).toMatchObject({ label: "Saving…", attention: false });
  expect(statusLabel("dirty")).toMatchObject({ label: "Edited", attention: false });
  expect(statusLabel("conflict")).toEqual({ label: "Changed in Moss", icon: "AlertTriangle", attention: true });
  expect(statusLabel("error")).toMatchObject({ label: "Not saved", attention: true });
  expect(statusLabel("removed")).toMatchObject({ attention: true });
  for (const quiet of ["loading", "notLoaded", "unmounted", null] as const) expect(statusLabel(quiet)).toBeNull();
});

it("keeps the final save's receipt when an editor closes cleanly", async () => {
  const saved = vi.fn();
  const unsaved = vi.fn(async () => undefined);
  const { handle: closing, unmount } = handle([{ kind: "unmounted", flush: { kind: "saved", version: "v2", receipt: draft("# Saved\n") } }]);
  await closeEditor(closing, { saved, unsaved });
  expect(saved).toHaveBeenCalledWith(draft("# Saved\n"), "v2");
  expect(unsaved).not.toHaveBeenCalled();
  expect(unmount).toHaveBeenCalledTimes(1);
});

it("keeps edits the final save could not write as a draft before the editor goes", async () => {
  const order: string[] = [];
  const unsaved = vi.fn(async (kept: Moss.MossDraft) => void order.push(`kept ${kept.files.markdown}`));
  const { handle: closing, unmount } = handle([
    { kind: "kept", flush: { kind: "conflict", draft: draft("# Mine\n"), preserved: [] } },
    { kind: "unmounted", flush: { kind: "conflict", draft: draft("# Mine\n"), preserved: [] } },
  ]);
  unmount.mockImplementation(async (options?: Moss.MossUnmountOptions) => {
    order.push(options?.discardUnsaved ? "discard" : "flush");
    return order.length === 1
      ? { kind: "kept", flush: { kind: "conflict", draft: draft("# Mine\n"), preserved: [] } }
      : { kind: "unmounted", flush: { kind: "conflict", draft: draft("# Mine\n"), preserved: [] } };
  });
  await closeEditor(closing, { saved: vi.fn(), unsaved });
  expect(order).toEqual(["flush", "kept # Mine\n", "discard"]);
});
