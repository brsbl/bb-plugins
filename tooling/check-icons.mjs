import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readPluginWorkspaces } from "./plugin-workspaces.mjs";

// bb's Icon renders any name it does not know as the Zap glyph, so a typo or a
// name newer than the installed bb silently becomes a lightning bolt. Zap and
// its look-alikes are banned outright.
const BANNED = /^(?:Zap|Flash|Bolt|Lightning|Thunder)/u;
const BANNED_IMPORT = /\b(?:Zap|Flash\w*|Bolt\w*|Lightning\w*|Thunder\w*)Icon\b|\{[^}]*\bZap\b[^}]*\}\s*from\s*["']lucide-react["']/u;
const NAMESPACED = /^[a-z0-9-]+\/[a-z0-9][a-z0-9-]*$/u;
const ICON_LIKE = /^[A-Z][A-Za-z0-9]*$/u;
const SOURCE = /\.(?:ts|tsx|mts)$/u;
const SKIPPED_DIRS = new Set(["node_modules", "dist", "vendor", "assets", "docs"]);

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function sourceFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name) && !entry.name.startsWith(".")) files.push(...await sourceFiles(join(dir, entry.name)));
    } else if (SOURCE.test(entry.name) && !/\.(?:test|stories)\.tsx?$/u.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(join(dir, entry.name));
    }
  }
  return files;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

/** Icon names in the positions bb or a plugin Icon reads them from. */
export function iconReferences(text) {
  const found = [];
  // JSX props: name="X", fallback="X", icon="X", or string literals inside name={...}.
  for (const match of text.matchAll(/(?<![-\w])(name|fallback|icon)=(?:"([^"]*)"|\{([^{}]*)\})/gu)) {
    const values = match[2] !== undefined ? [match[2]] : [...match[3].matchAll(/["'`]([^"'`$]*)["'`]/gu)].map((item) => item[1]);
    for (const value of values) found.push({ value, index: match.index, jsx: true });
  }
  // Object properties handed to bb surfaces: { icon: "X" }, { fallbackIcon: "X" }.
  for (const match of text.matchAll(/(?<![-\w])(?:icon|fallbackIcon|PLUGIN_ICON)\s*[:=]\s*["'`]([^"'`$]*)["'`]/gu)) {
    found.push({ value: match[1], index: match.index, jsx: false });
  }
  return found.filter(({ value }) => ICON_LIKE.test(value) || NAMESPACED.test(value));
}

function localIconMap(text) {
  if (!text || /experimental_Icon/u.test(text)) return [];
  return [...text.matchAll(/^\s+([A-Z][A-Za-z0-9]*): [A-Za-z0-9]+Icon,$/gmu)].map((match) => match[1]);
}

export async function checkIcons(root = defaultRoot) {
  const { names } = JSON.parse(await readFile(resolve(root, "tooling/bb-icon-names.json"), "utf8"));
  const builtin = new Set(names.filter((name) => !BANNED.test(name)));
  const problems = [];
  for (const { directory, manifest } of await readPluginWorkspaces(root)) {
    const id = manifest.name.replace(/^bb-plugin-/u, "");
    const branding = manifest.bb?.branding ?? {};
    const declared = new Set(Object.keys(branding.experimental_icons ?? {}).map((name) => `${id}/${name}`));
    const known = (name) => builtin.has(name) || declared.has(name);
    const where = relative(root, join(directory, "package.json"));
    // bb's plugin UI shows Zap for a plugin without a branding icon.
    if (typeof branding.icon !== "string" || !branding.icon) problems.push(`${where}: bb.branding.icon is missing`);
    else if (!branding.icon.startsWith("./") && !known(branding.icon)) problems.push(`${where}: bb.branding.icon "${branding.icon}" is not a bb icon`);

    const local = new Set(localIconMap(await readFile(join(directory, "components/ui/icon.tsx"), "utf8").catch(() => "")));
    for (const file of await sourceFiles(directory)) {
      const text = await readFile(file, "utf8");
      const path = relative(root, file);
      const banned = BANNED_IMPORT.exec(text);
      if (banned) problems.push(`${path}:${lineOf(text, banned.index)}: lightning-bolt icon import ${JSON.stringify(banned[0])}`);
      if (path.endsWith("components/ui/icon.tsx")) continue;
      for (const { value, index, jsx } of iconReferences(text)) {
        const at = `${path}:${lineOf(text, index)}`;
        if (BANNED.test(value)) problems.push(`${at}: "${value}" is a lightning-bolt icon`);
        else if (!known(value) && !(jsx && local.has(value))) problems.push(`${at}: "${value}" is not a bb icon, so bb would render Zap`);
      }
    }
  }
  return problems;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const problems = await checkIcons();
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log("icon check passed");
}
