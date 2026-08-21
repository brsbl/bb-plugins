import { watch, type FSWatcher } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

const swatchSchema = z
  .object({
    canvas: z.string().nullable(),
    sidebar: z.string().nullable(),
    card: z.string().nullable(),
    primary: z.string().nullable(),
    accent: z.string().nullable(),
    foreground: z.string().nullable(),
    fontSans: z.string().nullable(),
    fontMono: z.string().nullable(),
  })
  .strict();

const themeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    light: swatchSchema.nullable(),
    dark: swatchSchema.nullable(),
  })
  .strict();

const catalogSchema = z
  .object({
    activeThemeId: z.string().nullable(),
    themes: z.array(themeSchema),
    /** Bumps whenever the active theme's CSS changes on disk. */
    revision: z.number(),
  })
  .strict();

export const rpcContract = defineRpcContract({
  themeCatalog: { input: z.object({}).strict(), output: catalogSchema },
  setTheme: { input: z.object({ themeId: z.string().min(1) }).strict(), output: catalogSchema },
});

export type ThemeSwatch = z.infer<typeof swatchSchema>;

const SWATCH_TOKENS: ReadonlyArray<[keyof ThemeSwatch, readonly string[]]> = [
  ["canvas", ["canvas", "background"]],
  ["sidebar", ["sidebar"]],
  ["card", ["card"]],
  ["primary", ["primary"]],
  ["accent", ["file-accent", "timeline-accent", "ring"]],
  ["foreground", ["foreground"]],
  ["fontSans", ["font-sans"]],
  ["fontMono", ["font-mono"]],
];

/**
 * Which mode a top-level block contributes to. Element-scoped blocks (for
 * example `.dark .fixed.bg-sidebar`) are skipped: their values are true, but
 * they describe one surface rather than the palette a chip should advertise.
 */
export function classifySelector(selector: string): "light" | "dark" | null {
  const parts = selector
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return null;
  let sawLight = false;
  let sawDark = false;
  for (const part of parts) {
    if (/\s/.test(part.replace(/:not\([^)]*\)/g, ""))) return null; // descendant selector
    if (part === ":root" || part === ".light" || part === ":root:not(.dark)" || part === "html:not(.dark)") sawLight = true;
    else if (part === ".dark" || part === ":root.dark" || part === "html.dark") sawDark = true;
    else return null;
  }
  if (sawDark && !sawLight) return "dark";
  if (sawLight && !sawDark) return "light";
  return null;
}

/**
 * Pull the palette a theme advertises out of its CSS. Later declarations win,
 * which is how the cascade resolves them, so a variant's override block beats
 * the base it was built on.
 */
export function parseThemeSwatches(css: string): { light: ThemeSwatch | null; dark: ThemeSwatch | null } {
  const declarations: { light: Map<string, string>; dark: Map<string, string> } = {
    light: new Map(),
    dark: new Map(),
  };
  // Comments first: a block comment that mentions a selector would otherwise be
  // captured as part of the next selector and disqualify the whole block.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = source.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const block of blocks) {
    const mode = classifySelector(block[1]);
    if (!mode) continue;
    for (const declaration of block[2].matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g)) {
      declarations[mode].set(declaration[1], declaration[2].trim());
    }
  }
  const build = (source: Map<string, string>): ThemeSwatch | null => {
    if (source.size === 0) return null;
    const swatch = {} as ThemeSwatch;
    for (const [key, candidates] of SWATCH_TOKENS) {
      swatch[key] = candidates.map((token) => source.get(token)).find((value) => value !== undefined) ?? null;
    }
    return swatch;
  };
  return { light: build(declarations.light), dark: build(declarations.dark) };
}

async function readCustomThemeCss(directory: string, id: string): Promise<string | null> {
  for (const candidate of [resolve(directory, id, "theme.css"), resolve(directory, `${id}.css`)]) {
    try {
      return await readFile(candidate, "utf8");
    } catch {
      // try the next layout
    }
  }
  return null;
}

/**
 * bb's bundled palettes, with swatches extracted from bb's own source
 * (apps/app/src/components/ui/theme.css and lib/themes/*.ts at bb@c942421a4):
 * each builtin's overrides overlaid on the base theme, var() references
 * inlined. color-mix() strings are kept verbatim — the browser resolves them.
 */
export const BUILTIN_THEMES: ReadonlyArray<{ id: string; name: string }> = [
  { id: "default", name: "Default" },
  { id: "nord", name: "Nord" },
  { id: "dracula", name: "Dracula" },
  { id: "solarized", name: "Solarized" },
  { id: "gruvbox", name: "Gruvbox" },
  { id: "catppuccin", name: "Catppuccin" },
];

export const BUILTIN_SWATCHES: Record<string, { light: ThemeSwatch; dark: ThemeSwatch }> = {
  "default": {
    "light": {
      "canvas": "oklch(1 0 0)",
      "sidebar": "color-mix(in oklch, oklch(0.3211 0 0) 2.2%, oklch(1 0 0))",
      "card": "oklch(1 0 0)",
      "primary": "oklch(0.27 0 0)",
      "accent": "oklch(0.55 0.1 250)",
      "foreground": "oklch(0.3211 0 0)",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "oklch(0.195 0 0)",
      "sidebar": "color-mix(in oklch, oklch(0.81 0 0) 4.3%, oklch(0.195 0 0))",
      "card": "oklch(0.195 0 0)",
      "primary": "oklch(0.82 0 0)",
      "accent": "oklch(0.72 0.09 250)",
      "foreground": "oklch(0.81 0 0)",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  },
  "nord": {
    "light": {
      "canvas": "#eceff4",
      "sidebar": "color-mix(in oklch, #2e3440 2.2%, #eceff4)",
      "card": "#eceff4",
      "primary": "#5e81ac",
      "accent": "#5e81ac",
      "foreground": "#2e3440",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "#2e3440",
      "sidebar": "color-mix(in oklch, #d8dee9 4.3%, #2e3440)",
      "card": "#2e3440",
      "primary": "#88c0d0",
      "accent": "#88c0d0",
      "foreground": "#d8dee9",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  },
  "dracula": {
    "light": {
      "canvas": "#f8f8f2",
      "sidebar": "color-mix(in oklch, #282a36 2.2%, #f8f8f2)",
      "card": "#f8f8f2",
      "primary": "#7d5bbe",
      "accent": "#1f6f8b",
      "foreground": "#282a36",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "#282a36",
      "sidebar": "color-mix(in oklch, #f8f8f2 4.3%, #282a36)",
      "card": "#282a36",
      "primary": "#bd93f9",
      "accent": "#8be9fd",
      "foreground": "#f8f8f2",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  },
  "solarized": {
    "light": {
      "canvas": "#fdf6e3",
      "sidebar": "color-mix(in oklch, #073642 2.2%, #fdf6e3)",
      "card": "#fdf6e3",
      "primary": "#268bd2",
      "accent": "#268bd2",
      "foreground": "#073642",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "#002b36",
      "sidebar": "color-mix(in oklch, #93a1a1 4.3%, #002b36)",
      "card": "#002b36",
      "primary": "#268bd2",
      "accent": "#2aa198",
      "foreground": "#93a1a1",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  },
  "gruvbox": {
    "light": {
      "canvas": "#fbf1c7",
      "sidebar": "color-mix(in oklch, #3c3836 2.2%, #fbf1c7)",
      "card": "#fbf1c7",
      "primary": "#076678",
      "accent": "#076678",
      "foreground": "#3c3836",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "#282828",
      "sidebar": "color-mix(in oklch, #ebdbb2 4.3%, #282828)",
      "card": "#282828",
      "primary": "#83a598",
      "accent": "#83a598",
      "foreground": "#ebdbb2",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  },
  "catppuccin": {
    "light": {
      "canvas": "#eff1f5",
      "sidebar": "color-mix(in oklch, #4c4f69 2.2%, #eff1f5)",
      "card": "#eff1f5",
      "primary": "#8839ef",
      "accent": "#1e66f5",
      "foreground": "#4c4f69",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    },
    "dark": {
      "canvas": "#1e1e2e",
      "sidebar": "color-mix(in oklch, #cdd6f4 4.3%, #1e1e2e)",
      "card": "#1e1e2e",
      "primary": "#cba6f7",
      "accent": "#89b4fa",
      "foreground": "#cdd6f4",
      "fontSans": "\"Inter Variable\", Inter, sans-serif",
      "fontMono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"
    }
  }
};

/** Flatten `sdk.theme.catalog()` into a selectable list with palette previews. */
export async function buildCatalog(
  result: unknown,
  readCss: (id: string) => Promise<string | null>,
): Promise<z.infer<typeof catalogSchema>> {
  const c = (result ?? {}) as Record<string, unknown>;
  const active = c.active as Record<string, unknown> | undefined;
  const activeThemeId = typeof active?.themeId === "string" ? active.themeId : null;

  const entries: Array<{ id: string; name: string }> = [];
  for (const id of Array.isArray(c.custom) ? c.custom : []) {
    if (typeof id === "string") entries.push({ id, name: id });
  }
  for (const plugin of Array.isArray(c.plugins) ? c.plugins : []) {
    const entry = plugin as Record<string, unknown>;
    if (typeof entry.id === "string") {
      entries.push({ id: entry.id, name: typeof entry.name === "string" ? entry.name : entry.id });
    }
  }
  for (const builtin of BUILTIN_THEMES) {
    if (!entries.some((entry) => entry.id === builtin.id)) entries.push(builtin);
  }
  // Anything active but unknown (a newer builtin, say) still has to be listed.
  if (activeThemeId && !entries.some((entry) => entry.id === activeThemeId)) {
    entries.unshift({ id: activeThemeId, name: activeThemeId });
  }

  const themes = await Promise.all(
    entries.map(async (entry) => {
      const css = await readCss(entry.id);
      const swatches = css ? parseThemeSwatches(css) : (BUILTIN_SWATCHES[entry.id] ?? { light: null, dark: null });
      return { ...entry, light: swatches.light, dark: swatches.dark };
    }),
  );
  return { activeThemeId, themes, revision: 0 };
}

/**
 * A plugin theme id is `plugin:<pluginId>:<themeId>`; its CSS lives in the
 * plugin's install dir at the path the manifest's `bb.themes[]` entry names.
 */
async function readPluginThemeCss(
  bb: BbPluginApi,
  themeId: string,
  rootDirs: Map<string, string>,
): Promise<string | null> {
  const m = /^plugin:([^:]+):(.+)$/.exec(themeId);
  if (!m) return null;
  const [, pluginId, localId] = m;
  const rootDir = rootDirs.get(pluginId);
  if (!rootDir) return null;
  try {
    const manifest = JSON.parse(await readFile(resolve(rootDir, "package.json"), "utf8")) as {
      bb?: { themes?: Array<{ id?: string; css?: string }> };
    };
    const entry = manifest.bb?.themes?.find((theme) => theme.id === localId);
    if (!entry?.css) return null;
    return await readFile(resolve(rootDir, entry.css), "utf8");
  } catch (error) {
    bb.log.warn(`theme-preview: could not read ${themeId}: ${String(error)}`);
    return null;
  }
}

export default async function plugin(bb: BbPluginApi) {
  // Live-reload support. bb reads a custom theme's CSS from disk on demand and
  // never watches the file, so an agent editing `<dataDir>/theme/<id>/theme.css`
  // in one split leaves every open window painted with the previous version.
  // The background watcher below handles custom-theme edits immediately. Each
  // catalog poll also stats the active custom or plugin theme as a fallback;
  // when it has changed we re-set the same palette, which makes bb re-read the
  // CSS and push it to every client.
  let lastStamp: string | null = null;
  let revision = 0;

  const activeThemePath = async (themeId: string, dir: string | null, rootDirs: Map<string, string>) => {
    const pluginMatch = /^plugin:([^:]+):(.+)$/.exec(themeId);
    if (pluginMatch) {
      const rootDir = rootDirs.get(pluginMatch[1]);
      if (!rootDir) return null;
      try {
        const manifest = JSON.parse(await readFile(resolve(rootDir, "package.json"), "utf8")) as {
          bb?: { themes?: Array<{ id?: string; css?: string }> };
        };
        const entry = manifest.bb?.themes?.find((theme) => theme.id === pluginMatch[2]);
        return entry?.css ? resolve(rootDir, entry.css) : null;
      } catch {
        return null;
      }
    }
    if (!dir) return null;
    for (const candidate of [resolve(dir, themeId, "theme.css"), resolve(dir, `${themeId}.css`)]) {
      try {
        await stat(candidate);
        return candidate;
      } catch {
        // try the next layout
      }
    }
    return null;
  };

  const catalog = async () => {
    const raw = (await bb.sdk.theme.catalog()) as { dir?: unknown };
    const dir = typeof raw?.dir === "string" ? raw.dir : null;
    const rootDirs = new Map<string, string>();
    try {
      const listed = (await bb.sdk.plugins.list()) as { plugins?: Array<{ id?: string; rootDir?: string }> };
      for (const entry of listed.plugins ?? []) {
        if (typeof entry.id === "string" && typeof entry.rootDir === "string") rootDirs.set(entry.id, entry.rootDir);
      }
    } catch (error) {
      bb.log.warn(`theme-preview: plugin list unavailable: ${String(error)}`);
    }
    const built = await buildCatalog(raw, async (id) =>
      id.startsWith("plugin:") ? readPluginThemeCss(bb, id, rootDirs) : dir ? readCustomThemeCss(dir, id) : null,
    );

    if (built.activeThemeId) {
      const path = await activeThemePath(built.activeThemeId, dir, rootDirs);
      if (path) {
        try {
          const info = await stat(path);
          const stamp = `${path}:${info.mtimeMs}:${info.size}`;
          if (lastStamp !== null && stamp !== lastStamp) {
            revision += 1;
            await bb.sdk.theme.set(built.activeThemeId);
            bb.log.info(`theme-preview: ${built.activeThemeId} changed on disk — re-applied (rev ${revision})`);
          }
          lastStamp = stamp;
        } catch (error) {
          bb.log.warn(`theme-preview: could not stat ${path}: ${String(error)}`);
        }
      }
    }
    return { ...built, revision };
  };

  // Instant path. Watch the custom-theme directory (new themes, edits) and push
  // a signal to every open panel; the panel refetches on the signal, so a new
  // theme shows up in the dropdown and an edited one repaints within the
  // watcher's latency instead of the next poll. The poll stays as a slow
  // fallback for filesystems where watching is unreliable.
  bb.background.service("theme-watch", {
    async start(signal) {
      const raw = (await bb.sdk.theme.catalog()) as { dir?: unknown };
      const dir = typeof raw?.dir === "string" ? raw.dir : null;
      if (!dir) return;
      let watcher: FSWatcher | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const onChange = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            const next = await catalog(); // re-applies the active theme if its file changed
            bb.realtime.publish("theme-preview:changed", { revision: next.revision, at: Date.now() });
          } catch (error) {
            bb.log.warn(`theme-preview: watch refresh failed: ${String(error)}`);
          }
        }, 120);
      };
      try {
        watcher = watch(dir, { recursive: true }, onChange);
        watcher.on("error", (error) => bb.log.warn(`theme-preview: watcher error: ${String(error)}`));
        bb.log.info(`theme-preview: watching ${dir}`);
      } catch (error) {
        bb.log.warn(`theme-preview: cannot watch ${dir}: ${String(error)}`);
        return;
      }
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      if (timer) clearTimeout(timer);
      watcher?.close();
    },
  });

  bb.rpc.register(rpcContract, {
    async themeCatalog() {
      return catalog();
    },
    async setTheme({ themeId }) {
      await bb.sdk.theme.set(themeId);
      return catalog();
    },
  });

  bb.log.info("theme-preview ready");
}
