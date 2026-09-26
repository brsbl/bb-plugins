import { describe, expect, it } from "vitest";
import { DEFAULT_QUICK_LAUNCH } from "../core";
import { LAUNCHER_IDS, appLauncherId } from "./launcher-ids";

describe("Quick Launch ids", () => {
  it("keeps every shipped id", () => {
    expect(LAUNCHER_IDS).toEqual([
      "show-desktop",
      "new-thread",
      "new-folder",
      "threads",
      "recycle-bin",
      "media-player",
      "minesweeper",
      "solitaire",
      "pinball",
      "command-prompt",
      "paint",
      "sticky-note",
      "internet-explorer",
      "search",
      "run",
      "plugins",
      "skills",
    ]);
  });

  it("covers the default Quick Launch", () => {
    for (const id of DEFAULT_QUICK_LAUNCH) expect(LAUNCHER_IDS).toContain(id);
  });

  it("names third-party programs by app key", () => {
    expect(appLauncherId("ambient:mixer")).toBe("app:ambient:mixer");
  });
});
