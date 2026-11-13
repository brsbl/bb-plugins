import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { describe, expect, it } from "vitest";

import plugin, { devGmailEndpoints, insertStage, parseTime, parseTokens, placeSection } from "./server";

const stage = (key: string, catchesPluginId?: string) => ({ key, role: catchesPluginId ? "inbox" : "stage", sectionId: `sec_${key}`, ...(catchesPluginId ? { catchesPluginId } : {}) });

describe("Email plugin", () => {
  it("loads with its CLI", async () => {
    const { bb, harness } = createFakePluginHost({ pluginId: "email-inbox" });
    plugin(bb);
    expect(harness.inspection.registrations.cli?.name).toBe("email-inbox");
    expect(harness.inspection.registrations.services.map((service) => service.name)).toEqual(["summary"]);
    await harness.lifecycle.dispose();
  });

  it("only reads a fake Gmail over loopback", () => {
    expect(devGmailEndpoints("http://127.0.0.1:47813")).toEqual({ apiBase: "http://127.0.0.1:47813/gmail/v1", tokenUrl: "http://127.0.0.1:47813/token" });
    expect(devGmailEndpoints("https://evil.example")).toBeUndefined();
    expect(devGmailEndpoints(undefined)).toBeUndefined();
  });

  it("reads its settings", () => {
    expect(parseTime("13:00")).toBe(780);
    expect(parseTime("25:00")).toBeNull();
    expect(parseTokens('{"A@x.test":" t "}')).toEqual({ "a@x.test": "t" });
    expect(parseTokens("")).toEqual({});
    expect(() => parseTokens('{"a":1}')).toThrow(/JSON object/);
  });

  it("puts its stage after Discord's or Calendar's, else first", () => {
    const own = stage("email-inbox", "email-inbox");
    const keys = (stages: { key: string }[]) => stages.map((entry) => entry.key);
    expect(keys(insertStage([stage("calendar", "calendar"), stage("todo")], own))).toEqual(["calendar", "email-inbox", "todo"]);
    expect(keys(insertStage([stage("calendar", "calendar"), stage("discord-inbox", "discord-inbox"), stage("todo")], own))).toEqual(["calendar", "discord-inbox", "email-inbox", "todo"]);
    expect(keys(insertStage([stage("todo")], own))).toEqual(["email-inbox", "todo"]);
  });

  it("puts its section after Discord's or Calendar's, whichever installs first", () => {
    const anchors = ["section:discord", "section:calendar"];
    expect(placeSection(["section:calendar", "pinned", "section:email"], "section:email", anchors)).toEqual(["section:calendar", "section:email", "pinned"]);
    expect(placeSection(["section:calendar", "section:discord", "pinned"], "section:email", anchors)).toEqual(["section:calendar", "section:discord", "section:email", "pinned"]);
    expect(placeSection(["pinned"], "section:email", anchors)).toEqual(["section:email", "pinned"]);
  });
});
