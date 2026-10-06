import { describe, expect, it } from "vitest";
import { previewTarget } from "./open-target.js";

const mac = "host_mac";
const linux = "host_linux";

describe("previewTarget", () => {
  it("keeps a pin on the thread's host as is", () => {
    expect(previewTarget({ hostId: linux, path: "/srv/app/main.ts" }, linux)).toEqual({ kind: "host", hostId: linux, path: "/srv/app/main.ts" });
    expect(previewTarget({ hostId: mac, path: "/Users/me/Moss/Notes/A/A.md" }, mac)).toEqual({ kind: "host", hostId: mac, path: "/Users/me/Moss/Notes/A/A.md" });
  });

  it("opens Markdown from another machine through the thread's host, like a chat link", () => {
    expect(previewTarget({ hostId: mac, path: "/Users/me/Moss/Notes/A/A.md" }, linux)).toEqual({ kind: "host", hostId: linux, path: "/Users/me/Moss/Notes/A/A.md" });
    expect(previewTarget({ hostId: mac, path: "/Users/me/notes/B.MARKDOWN" }, linux)).toEqual({ kind: "host", hostId: linux, path: "/Users/me/notes/B.MARKDOWN" });
  });

  it("has no preview for other files from another machine", () => {
    expect(previewTarget({ hostId: mac, path: "/Users/me/photo.png" }, linux)).toBeNull();
    expect(previewTarget({ hostId: mac, path: "/Users/me/readme.md.bak" }, linux)).toBeNull();
  });

  it("has no preview when the thread has no environment", () => {
    expect(previewTarget({ hostId: mac, path: "/Users/me/Moss/Notes/A/A.md" }, null)).toBeNull();
  });
});
