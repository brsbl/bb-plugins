import { describe, expect, it } from "vitest";
import {
  accountServerRows,
  desktopServerRows,
  detectSwitcherMode,
  serverListFailure,
} from "./servers.js";

const account = {
  selfHandle: "work",
  servers: [
    { handle: "zeta", name: "Zeta", live: true, url: "https://zeta.getbb.app" },
    {
      handle: "alpha",
      name: "default",
      live: false,
      url: "https://alpha.getbb.app",
    },
    { handle: "work", name: "Work", live: true, url: "https://work.getbb.app" },
  ],
};

describe("accountServerRows", () => {
  it("names servers by handle, current first, then by name", () => {
    expect(
      accountServerRows(account).map((row) => [
        row.name,
        row.current,
        row.detail,
      ]),
    ).toEqual([
      ["work", true, "work.getbb.app"],
      ["alpha", false, "alpha.getbb.app"],
      ["zeta", false, "zeta.getbb.app"],
    ]);
  });
});

describe("desktopServerRows", () => {
  it("hides the inactive built-in server and names account servers by handle", () => {
    const rows = desktopServerRows(
      [
        { id: "builtin", name: "This Mac", active: false },
        { id: "connect:alpha", name: "default", active: false },
        { id: "connect:work", name: "work", active: true },
      ],
      account,
    );
    expect(
      rows?.map((row) => [row.id, row.name, row.live, row.current]),
    ).toEqual([
      ["connect:work", "work", true, true],
      ["connect:alpha", "alpha", false, false],
    ]);
  });

  it("merges a custom getbb.app URL with the same account server", () => {
    const rows = desktopServerRows(
      [
        { id: "connect:alpha", name: "default", active: false },
        { id: "custom:1", name: "work.getbb.app", active: true },
        { id: "custom:2", name: "alpha.getbb.app", active: false },
        { id: "custom:3", name: "other.getbb.app", active: false },
        { id: "custom:4", name: "example.com:8080", active: false },
      ],
      account,
    );
    expect(
      rows?.map((row) => [row.id, row.name, row.detail, row.live, row.current]),
    ).toEqual([
      ["custom:1", "work", "work.getbb.app", true, true],
      ["connect:alpha", "alpha", "alpha.getbb.app", false, false],
      ["custom:4", "example.com:8080", "Custom server", null, false],
      ["custom:3", "other", "other.getbb.app", null, false],
    ]);
  });

  it("keeps the built-in server when it is the active one", () => {
    const rows = desktopServerRows(
      [{ id: "builtin", name: "This Mac", active: true }],
      null,
    );
    expect(rows?.map((row) => [row.name, row.current])).toEqual([
      ["This Mac", true],
    ]);
  });

  it("rejects malformed choices", () => {
    expect(desktopServerRows([{ id: "a", name: "Local" }], null)).toBeNull();
    expect(desktopServerRows("nope", null)).toBeNull();
  });
});

describe("serverListFailure", () => {
  it("treats connect's not_paired error as signed out", () => {
    expect(serverListFailure(new Error("HTTP 500: not_paired"))).toEqual({
      status: "signed_out",
    });
  });

  it("reports other failures with the HTTP prefix stripped", () => {
    expect(
      serverListFailure(new Error('HTTP 404: Plugin "connect" not found')),
    ).toEqual({ status: "error", message: 'Plugin "connect" not found' });
  });

  it("truncates long messages", () => {
    const failure = serverListFailure(
      new Error(`HTTP 500: ${"x".repeat(500)}`),
    );
    expect(failure.status === "error" && failure.message.length).toBe(200);
  });
});

describe("detectSwitcherMode", () => {
  it("prefers the desktop server API", () => {
    const selected: string[] = [];
    const mode = detectSwitcherMode({
      ReactNativeWebView: {},
      bbDesktop: {
        getServerChoices: async () => [],
        onServerChoicesChange: () => () => {},
        selectServer(id: string) {
          selected.push(id);
        },
      },
    });
    expect(mode.kind).toBe("desktop");
    if (mode.kind === "desktop") mode.api.selectServer("srv");
    expect(selected).toEqual(["srv"]);
  });

  it("falls back to read-only inside the mobile shell, else web", () => {
    expect(detectSwitcherMode({ ReactNativeWebView: {} }).kind).toBe(
      "mobile-shell",
    );
    expect(detectSwitcherMode({ bbDesktop: { selectServer() {} } }).kind).toBe(
      "web",
    );
  });
});
