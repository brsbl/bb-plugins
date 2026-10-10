import { afterEach, describe, expect, it, vi } from "vitest";
import { closeEditor, createTypingGate, statusLabel } from "./editor-frame.js";
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

it("stays quiet while edits save, and speaks when the user may need to act or a save runs long", () => {
  for (const quiet of ["clean", "dirty", "saving", "loading", "notLoaded", "unmounted", null] as const) {
    expect(statusLabel(quiet, { slow: false })).toBeNull();
  }
  expect(statusLabel("saving", { slow: true })).toEqual({ label: "Saving…", icon: "Clock", attention: false });
  expect(statusLabel("conflict", { slow: false })).toEqual({ label: "Changed in Moss", icon: "AlertTriangle", attention: true });
  expect(statusLabel("error", { slow: false })).toEqual({ label: "Not saved", icon: "AlertTriangle", attention: true });
  expect(statusLabel("removed", { slow: false })).toEqual({ label: "Not saved", icon: "AlertTriangle", attention: true });
  expect(statusLabel("clean", { slow: true })).toBeNull();
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

describe("createTypingGate", () => {
  afterEach(() => vi.useRealTimers());

  it("holds a change from disk while the user types, and applies the latest once they pause", () => {
    vi.useFakeTimers();
    let clock = 0;
    let focused = true;
    const gate = createTypingGate({ focused: () => focused, unsaved: () => false, now: () => clock, idleMs: 1_500 });
    const applied: string[] = [];

    gate.offer(() => applied.push("idle"));
    expect(applied).toEqual(["idle"]);

    gate.input();
    gate.offer(() => applied.push("first"));
    gate.offer(() => applied.push("second"));
    clock = 1_000;
    vi.advanceTimersByTime(1_000);
    expect(applied).toEqual(["idle"]);
    clock = 1_600;
    vi.advanceTimersByTime(600);
    expect(applied).toEqual(["idle", "second"]);

    // Leaving the editor applies what it held at once.
    gate.input();
    gate.offer(() => applied.push("on blur"));
    focused = false;
    gate.flush();
    expect(applied).toEqual(["idle", "second", "on blur"]);
  });

  it("holds while edits are unsaved, and not when the editor is not focused", () => {
    vi.useFakeTimers();
    let unsaved = true;
    let focused = true;
    const gate = createTypingGate({ focused: () => focused, unsaved: () => unsaved, now: () => 10_000 });
    const applied: string[] = [];
    gate.offer(() => applied.push("held"));
    vi.advanceTimersByTime(5_000);
    expect(applied).toEqual([]);
    unsaved = false;
    vi.advanceTimersByTime(1_000);
    expect(applied).toEqual(["held"]);

    unsaved = true;
    focused = false;
    gate.offer(() => applied.push("unfocused"));
    expect(applied).toEqual(["held", "unfocused"]);
    gate.dispose();
  });
});
