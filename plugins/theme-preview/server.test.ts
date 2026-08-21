import { describe, expect, it } from "vitest";
import { buildCatalog, classifySelector, parseThemeSwatches } from "./server";

describe("classifySelector", () => {
  it("accepts the mode roots and rejects element-scoped blocks", () => {
    expect(classifySelector(":root, .light")).toBe("light");
    expect(classifySelector(":root:not(.dark)")).toBe("light");
    expect(classifySelector(".dark")).toBe("dark");
    expect(classifySelector(".dark .fixed.bg-sidebar")).toBeNull();
    expect(classifySelector("code:not(pre code)")).toBeNull();
  });
});

describe("parseThemeSwatches", () => {
  const css = `
    :root, .light { --canvas: #f4f4f4; --sidebar: #e4e4e4; --card: #fff; --primary: #0a0a0a;
                    --file-accent: #405663; --foreground: #0a0a0a; --font-sans: Helvetica; --font-mono: Courier; }
    .dark { --canvas: #1a1a1a; --sidebar: #0a0a0a; --card: #212121; --primary: #ffffff;
            --file-accent: #9db6c6; --foreground: #cecbc4; }
    :root:not(.dark) { --primary: #2e6f95; }
    .dark .fixed.bg-sidebar { --sidebar: #070707; }
  `;

  it("resolves each mode with later declarations winning", () => {
    const { light, dark } = parseThemeSwatches(css);
    expect(light?.primary).toBe("#2e6f95");
    expect(light?.canvas).toBe("#f4f4f4");
    expect(dark?.primary).toBe("#ffffff");
    // the element-scoped override describes one surface, not the palette
    expect(dark?.sidebar).toBe("#0a0a0a");
  });

  it("falls back across token candidates and inherits fonts only where declared", () => {
    const { light, dark } = parseThemeSwatches(css);
    expect(light?.fontSans).toBe("Helvetica");
    expect(dark?.fontSans).toBeNull();
    expect(parseThemeSwatches(":root { --background: #fff; }").light?.canvas).toBe("#fff");
  });

  it("returns null for a mode the CSS never declares", () => {
    expect(parseThemeSwatches(":root { --canvas: #fff; }").dark).toBeNull();
  });
});

describe("comments", () => {
  it("does not let a commented selector swallow the block after it", () => {
    const css = `/* .dark .fixed.bg-sidebar { --sidebar: #000; } */ :root { --canvas: #f4f4f4; }`;
    expect(parseThemeSwatches(css).light?.canvas).toBe("#f4f4f4");
  });
});

describe("buildCatalog", () => {
  it("lists custom and plugin themes, keeps an unlisted active id, and attaches swatches", async () => {
    const out = await buildCatalog(
      {
        active: { themeId: "default" },
        custom: ["endless"],
        plugins: [{ id: "plugin:endless:endless-color", name: "Endless Color" }],
      },
      async (id) => (id === "endless" ? ":root { --canvas: #f4f4f4; }" : null),
    );
    expect(out.activeThemeId).toBe("default");
    expect(out.themes.map((t) => t.id).slice(0, 3)).toEqual(["endless", "plugin:endless:endless-color", "default"]);
    // bundled palettes carry swatches extracted from bb's source
    const nord = out.themes.find((t) => t.id === "nord");
    expect(nord?.dark?.primary).toBe("#88c0d0");
    expect(nord?.light?.canvas).toBe("#eceff4");
    expect(out.themes[0].light?.canvas).toBe("#f4f4f4");
    expect(out.themes[1].light).toBeNull();
    expect(out.revision).toBe(0);
  });
});
