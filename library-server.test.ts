import { createFakePluginHost, makePluginAgentConfigurationContext, makeThreadResponse } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import { NOTE_MENTIONS, PICTURE_MENTIONS, type PictureSummary, type StickyNote } from "./library";
import plugin from "./server";

/** A 2 × 1 red PNG. */
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DAwMDAAAIAAgFPXL9zAAAAAElFTkSuQmCC";

function note(id: string, overrides: Partial<StickyNote> = {}): StickyNote {
  return { id, text: `${id} title\nbody`, side: "right", x: 16, y: 72, width: 360, height: 260, tone: 0, updatedAt: 10, ...overrides };
}

async function setup() {
  const uploads: Array<{ projectId: string; filename?: string }> = [];
  const host = createFakePluginHost({
    pluginId: "desktop",
    agentSkillIds: ["desktop", "desktop-apps"],
    sdk: {
      threadSections: { list: async () => [] },
      projects: {
        list: async () => [],
        attachments: {
          upload: async (args: { projectId: string; filename?: string }) => {
            uploads.push(args);
            return { type: "localImage", name: args.filename ?? "x.png", path: `attachments/${uploads.length}.png`, sizeBytes: 10 };
          },
        },
      },
      hosts: { list: async () => [] },
      threads: {
        list: async () => [],
        get: async ({ threadId }: { threadId: string }) => makeThreadResponse({ id: threadId, projectId: "proj_from_thread" }),
      },
    } as never,
  });
  await plugin(host.bb);
  const { behavior, inspection } = host.harness;
  const mention = (id: string) => inspection.registrations.mentionProviders.find((provider) => provider.id === id)!;
  return { behavior, inspection, uploads, mention };
}

describe("note pads on the server", () => {
  it("moves a browser's notes over once and keeps the newest edit of each", async () => {
    const { behavior } = await setup();
    expect(await behavior.callRpc("importNotes", { notes: [note("a"), note("b")] })).toEqual({ imported: 2 });
    expect(await behavior.callRpc("importNotes", { notes: [note("a", { text: "older copy" })] })).toEqual({ imported: 0 });

    const stale = (await behavior.callRpc("saveNote", { note: note("a", { text: "stale", updatedAt: 5 }) })) as { note: StickyNote };
    expect(stale.note.text).toBe("a title\nbody");
    const fresh = (await behavior.callRpc("saveNote", { note: note("a", { text: "fresh", updatedAt: 20 }) })) as { note: StickyNote };
    expect(fresh.note.text).toBe("fresh");

    await behavior.callRpc("deleteNote", { id: "b" });
    const { notes } = (await behavior.callRpc("listNotes", null)) as { notes: StickyNote[] };
    expect(notes.map((entry) => [entry.id, entry.text])).toEqual([["a", "fresh"]]);
  });

  it("hands a mentioned note pad's text to the agent", async () => {
    const { behavior, mention } = await setup();
    await behavior.callRpc("importNotes", { notes: [note("plan", { text: "Launch plan\nShip Friday" }), note("empty", { text: "" })] });
    const items = await mention(NOTE_MENTIONS).search({ trigger: "@", query: "launch", projectId: null, threadId: null });
    expect(items).toEqual([{ id: "plan", title: "Launch plan", subtitle: "Note pad" }]);
    const resolved = await mention(NOTE_MENTIONS).resolve("plan");
    expect(resolved.context).toContain("Ship Friday");
    expect(resolved.context).toContain("desktop_note_write with id plan");
    await expect(Promise.resolve().then(() => mention(NOTE_MENTIONS).resolve("missing"))).rejects.toThrow("deleted");
  });
});

describe("Paint pictures on the server", () => {
  it("attaches a mentioned picture to the message's project as an image", async () => {
    const { behavior, mention, uploads } = await setup();
    const saved = (await behavior.callRpc("savePicture", { id: null, name: "Wireframe", width: 2, height: 1, pngBase64: PNG })) as PictureSummary;

    const [item] = await mention(PICTURE_MENTIONS).search({ trigger: "@", query: "wire", projectId: null, threadId: "thr_9" });
    expect(item).toMatchObject({ id: `${saved.id}@thr_9`, title: "Wireframe" });

    const resolved = await mention(PICTURE_MENTIONS).resolve(item!.id);
    expect(resolved.experimental_images).toEqual([{ type: "localImage", path: "attachments/1.png" }]);
    expect(uploads).toMatchObject([{ projectId: "proj_from_thread", filename: "Wireframe.png" }]);

    // The same picture to the same project is uploaded once; another project gets its own copy.
    await mention(PICTURE_MENTIONS).resolve(item!.id);
    await mention(PICTURE_MENTIONS).resolve(`${saved.id}@proj_other`);
    expect(uploads.map((upload) => upload.projectId)).toEqual(["proj_from_thread", "proj_other"]);
  });

  it("attaches a new thread's picture to the project its box has selected when the message is sent", async () => {
    const { behavior, mention, uploads } = await setup();
    const saved = (await behavior.callRpc("savePicture", { id: null, name: "Plan", width: 2, height: 1, pngBase64: PNG })) as PictureSummary;
    await behavior.callRpc("setComposerProject", { token: "ntc_box", projectId: "proj_first" });
    // The user switches projects after adding the picture; the attachment follows the switch.
    await behavior.callRpc("setComposerProject", { token: "ntc_box", projectId: "proj_second" });
    await mention(PICTURE_MENTIONS).resolve(`${saved.id}@ntc_box`);
    // A box the server no longer knows (it restarted) sends to the personal project, where "No project" files threads.
    await mention(PICTURE_MENTIONS).resolve(`${saved.id}@ntc_forgotten`);
    expect(uploads.map((upload) => upload.projectId)).toEqual(["proj_second", "proj_personal"]);
  });

  it("opens, renames and deletes saved pictures", async () => {
    const { behavior } = await setup();
    const saved = (await behavior.callRpc("savePicture", { id: null, name: "One", width: 2, height: 1, pngBase64: PNG })) as PictureSummary;
    await behavior.callRpc("savePicture", { id: saved.id, name: "Renamed", width: 2, height: 1, pngBase64: PNG });
    expect(await behavior.callRpc("getPicture", { id: saved.id })).toMatchObject({ name: "Renamed", mimeType: "image/png", dataBase64: PNG });
    await behavior.callRpc("deletePicture", { id: saved.id });
    expect(await behavior.callRpc("listPictures", null)).toEqual({ pictures: [] });
  });
});

describe("agent tools", () => {
  it("gives every thread the tools and keeps the plugin's skills", async () => {
    const { behavior } = await setup();
    const selection = await behavior.resolveAgentConfiguration(makePluginAgentConfigurationContext());
    expect(selection.tools.map((tool) => tool.name).sort()).toEqual([
      "desktop_library_list",
      "desktop_note_read",
      "desktop_note_write",
      "desktop_picture_create",
      "desktop_picture_view",
    ]);
    expect(selection.skills.sort()).toEqual(["desktop", "desktop-apps"]);
  });

  it("reads, writes and appends to note pads", async () => {
    const { behavior } = await setup();
    const created = String(await behavior.callAgentTool("desktop_note_write", { text: "Agent todo\n- one" }));
    const id = /note pad (\S+) /u.exec(created)?.[1];
    expect(id).toBeDefined();
    await behavior.callAgentTool("desktop_note_write", { id, text: "- two", append: true });
    expect(await behavior.callAgentTool("desktop_note_read", { id })).toBe("Agent todo\n- one\n- two");
    const { notes } = (await behavior.callRpc("listNotes", null)) as { notes: StickyNote[] };
    expect(notes[0]).toMatchObject({ id, saved: true, hidden: false });
    expect(await behavior.callAgentTool("desktop_note_read", { id: "nope" })).toMatchObject({ isError: true });
  });

  it("draws an SVG picture for Paint and shows saved pictures as images", async () => {
    const { behavior } = await setup();
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#fc0"/></svg>';
    const created = String(await behavior.callAgentTool("desktop_picture_create", { name: "Mockup", svg }));
    expect(created).toContain("320 × 200");
    const { pictures } = (await behavior.callRpc("listPictures", null)) as { pictures: PictureSummary[] };
    expect(pictures).toMatchObject([{ name: "Mockup", format: "svg", width: 320, height: 200 }]);
    expect(String(await behavior.callAgentTool("desktop_picture_view", { id: pictures[0]!.id }))).toContain("<rect");

    expect(await behavior.callAgentTool("desktop_picture_create", { name: "Bad", svg: "<div/>" })).toMatchObject({ isError: true });
    expect(
      await behavior.callAgentTool("desktop_picture_create", { name: "Bad", svg: '<svg onload="alert(1)"></svg>' }),
    ).toMatchObject({ isError: true });

    const png = (await behavior.callRpc("savePicture", { id: null, name: "Photo", width: 2, height: 1, pngBase64: PNG })) as PictureSummary;
    expect(await behavior.callAgentTool("desktop_picture_view", { id: png.id })).toEqual({
      content: [
        { type: "text", text: 'Paint picture "Photo", 2 × 1 pixels.' },
        { type: "image", data: PNG, mimeType: "image/png" },
      ],
    });
    expect(String(await behavior.callAgentTool("desktop_library_list", {}))).toContain("Photo");
  });
});
