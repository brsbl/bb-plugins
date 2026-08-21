import { describe, expect, it } from "vitest";
import { normalizeCatalog } from "./server";

describe("normalizeCatalog", () => {
  it("flattens custom + plugin themes and keeps an unlisted active id", () => {
    const out = normalizeCatalog({
      active: { themeId: "default" },
      custom: ["mine"],
      plugins: [{ id: "plugin:endless:endless", name: "Endless", pluginId: "endless" }],
    });
    expect(out.activeThemeId).toBe("default");
    expect(out.themes.map((t) => t.id)).toEqual(["default", "mine", "plugin:endless:endless"]);
  });
});
