import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";

export const rpcContract = defineRpcContract({
  themeCatalog: {
    input: z.object({}).strict(),
    output: z.object({
      activeThemeId: z.string().nullable(),
      themes: z.array(z.object({ id: z.string(), name: z.string() }).strict()),
    }).strict(),
  },
  setTheme: {
    input: z.object({ themeId: z.string().min(1) }).strict(),
    output: z.object({
      activeThemeId: z.string().nullable(),
      themes: z.array(z.object({ id: z.string(), name: z.string() }).strict()),
    }).strict(),
  },
});

/** Normalize `sdk.theme.catalog()` into a flat, selectable list. */
export function normalizeCatalog(result: unknown): {
  activeThemeId: string | null;
  themes: Array<{ id: string; name: string }>;
} {
  const c = (result ?? {}) as Record<string, unknown>;
  const active = c.active as Record<string, unknown> | undefined;
  const activeThemeId = typeof active?.themeId === "string" ? active.themeId : null;
  const themes: Array<{ id: string; name: string }> = [];
  for (const id of Array.isArray(c.custom) ? c.custom : []) {
    if (typeof id === "string") themes.push({ id, name: id });
  }
  for (const p of Array.isArray(c.plugins) ? c.plugins : []) {
    const entry = p as Record<string, unknown>;
    if (typeof entry.id === "string") {
      themes.push({ id: entry.id, name: typeof entry.name === "string" ? entry.name : entry.id });
    }
  }
  // The active id may be a builtin not present in custom/plugins; keep it listed.
  if (activeThemeId && !themes.some((t) => t.id === activeThemeId)) {
    themes.unshift({ id: activeThemeId, name: activeThemeId });
  }
  return { activeThemeId, themes };
}

export default async function plugin(bb: BbPluginApi) {
  bb.rpc.register(rpcContract, {
    async themeCatalog() {
      return normalizeCatalog(await bb.sdk.theme.catalog());
    },
    async setTheme({ themeId }) {
      await bb.sdk.theme.set(themeId);
      return normalizeCatalog(await bb.sdk.theme.catalog());
    },
  });

  bb.log.info("theme-preview ready");
}
