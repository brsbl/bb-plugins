import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createHash } from "node:crypto";

const run = promisify(execFile);
const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(
  await readFile(resolve(packageRoot, "providers/upstreams.json"), "utf8"),
);
const temporaryRoot = await mkdtemp(resolve(tmpdir(), "atlas-upstreams-"));

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalValue(item)]),
    );
  }
  return value;
}

function sha256Canonical(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalValue(value)))
    .digest("hex");
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function plainText(value) {
  return decodeEntities(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/[`*_]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function guidanceText(value) {
  const lines = value
    .replace(/<li[^>]*>/g, "\n• ")
    .replace(/<\/(?:li|p|ul|ol|div)>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[`*_]/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/•\n/g, "• ");
  return decodeEntities(lines);
}

function headingId(value) {
  return plainText(value)
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueBy(items, keyFor) {
  const result = [];
  const seen = new Set();
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};
  const result = {};
  let parent = null;
  for (const line of match[1].split(/\r?\n/)) {
    const nested = line.match(/^\s{2}([a-zA-Z][\w-]*):\s*(.*)$/);
    if (nested?.[1] && parent) {
      result[parent][nested[1]] = unquote(nested[2] ?? "");
      continue;
    }
    const top = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
    if (!top?.[1]) continue;
    if (!top[2]?.trim()) {
      parent = top[1];
      result[parent] = {};
    } else {
      parent = null;
      result[top[1]] = unquote(top[2]);
    }
  }
  return result;
}

function markdownSections(source, canonicalUrl) {
  return uniqueBy(
    [...source.matchAll(/^##\s+(.+)$/gm)].map((match) => {
      const title = plainText(match[1] ?? "");
      const nativeId = headingId(title);
      return {
        nativeId,
        title,
        url: `${canonicalUrl}#${nativeId}`,
        content: null,
      };
    }),
    ({ nativeId }) => nativeId,
  );
}

function markdownExampleHeadings(source, canonicalUrl) {
  const examples = [];
  let inExamples = false;
  for (const line of source.split(/\r?\n/)) {
    const second = line.match(/^##\s+(.+)$/);
    if (second) {
      inExamples = headingId(second[1] ?? "") === "examples";
      continue;
    }
    const third = line.match(/^###\s+(.+)$/);
    if (!inExamples || !third?.[1]) continue;
    const title = plainText(third[1]);
    const nativeId = headingId(title);
    examples.push({ nativeId, title, url: `${canonicalUrl}#${nativeId}` });
  }
  return uniqueBy(examples, ({ nativeId }) => nativeId);
}

function markdownRelationships(source, currentSlug, routePrefix, origin) {
  const relationships = [];
  const escapedPrefix = routePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const route = new RegExp(`^${escapedPrefix}([^/#)]+)`);
  for (const match of source.matchAll(/\[([^\]]+)]\((\/[^\s)#]+)(?:#[^)]+)?\)/g)) {
    const path = match[2] ?? "";
    const target = path.match(route)?.[1];
    if (!target || target === currentSlug) continue;
    relationships.push({
      kind: "related-to",
      label: plainText(match[1] ?? target),
      targetTitle: plainText(match[1] ?? target),
      targetUrl: new URL(path, origin).href,
    });
  }
  return uniqueBy(relationships, ({ kind, targetUrl }) => `${kind}:${targetUrl}`);
}

function codeLink(definition, sourcePath) {
  return `${definition.source.repository}/blob/${definition.source.revision}/${sourcePath}`;
}

function summary(text, canonicalUrl) {
  const normalized = plainText(text ?? "");
  return normalized ? { text: normalized, url: canonicalUrl } : null;
}

async function extractRepository(definition) {
  const repositoryUrl = new URL(definition.source.repository);
  const [owner, repository] = repositoryUrl.pathname
    .replace(/^\//, "")
    .replace(/\.git$/, "")
    .split("/");
  if (!owner || !repository || repositoryUrl.hostname !== "github.com") {
    throw new Error(`Unsupported repository ${definition.source.repository}`);
  }
  const archive = resolve(temporaryRoot, `${definition.id}.tar.gz`);
  const root = resolve(temporaryRoot, definition.id);
  const response = await fetch(
    `https://codeload.github.com/${owner}/${repository}/tar.gz/${definition.source.revision}`,
  );
  if (!response.ok) {
    throw new Error(`Unable to download ${definition.id}: ${response.status}`);
  }
  await writeFile(archive, new Uint8Array(await response.arrayBuffer()));
  await run("mkdir", ["-p", root]);
  await run("tar", ["-xzf", archive, "-C", root, "--strip-components=1"]);
  return root;
}

function componentPreviews(source, canonicalUrl) {
  const previews = [];
  let currentHeadingId = null;
  const tokens =
    /^(#{2,4})\s+(.+)$|<ComponentPreview\b([\s\S]*?)\/>/gm;
  for (const match of source.matchAll(tokens)) {
    if (match[1] && match[2]) {
      currentHeadingId = headingId(match[2]);
      continue;
    }
    const attributes = match[3] ?? "";
    const nativeId = attributes.match(/\bname="([^"]+)"/)?.[1];
    if (!nativeId || !currentHeadingId) continue;
    const title =
      attributes.match(/\bdescription="([^"]+)"/)?.[1] ??
      nativeId.replace(/-/g, " ");
    previews.push({
      nativeId,
      title: plainText(title),
      url: `${canonicalUrl}#${currentHeadingId}`,
    });
  }
  return uniqueBy(previews, ({ nativeId }) => nativeId);
}

function assistantPreviews(source, canonicalUrl) {
  const previews = [];
  let currentHeadingId = null;
  const tokens =
    /^(#{2,4})\s+(.+)$|<Tabs\s+items=\{\["Preview",\s*"Code"\]\}>([\s\S]*?)<\/Tabs>/gm;
  for (const match of source.matchAll(tokens)) {
    if (match[1] && match[2]) {
      currentHeadingId = headingId(match[2]);
      continue;
    }
    const componentName = match[3]?.match(
      /<Tab>\s*<([A-Z][A-Za-z0-9_.]*)\b/,
    )?.[1];
    if (!componentName || !currentHeadingId) continue;
    previews.push({
      nativeId: headingId(componentName),
      title: componentName.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
      url: `${canonicalUrl}#${currentHeadingId}`,
    });
  }
  return uniqueBy(previews, ({ nativeId }) => nativeId);
}

async function shadcnRecords(definition, root) {
  const docsRoot = resolve(root, "apps/v4/content/docs/components/base");
  const meta = JSON.parse(await readFile(resolve(docsRoot, "meta.json"), "utf8"));
  const records = [];
  for (const nativeId of meta.pages) {
    if (typeof nativeId !== "string" || nativeId.startsWith("---")) continue;
    const sourcePath = `apps/v4/content/docs/components/base/${nativeId}.mdx`;
    const source = await readFile(resolve(root, sourcePath), "utf8").catch(
      (error) => {
        if (error?.code === "ENOENT") return null;
        throw error;
      },
    );
    if (!source) continue;
    const metadata = frontmatter(source);
    if (metadata.base !== "base") {
      throw new Error(`shadcn/ui record ${nativeId} is not the approved Base UI flavor.`);
    }
    const canonicalUrl = `https://ui.shadcn.com/docs/components/base/${nativeId}`;
    const relationships = markdownRelationships(
      source,
      nativeId,
      "/docs/components/base/",
      "https://ui.shadcn.com",
    );
    if (metadata.links?.doc) {
      relationships.unshift({
        kind: "implementation-of",
        label: "base: base",
        targetTitle: String(metadata.title),
        targetUrl: String(metadata.links.doc),
      });
    }
    records.push({
      nativeId,
      name: String(metadata.title),
      aliases: [],
      summary: summary(metadata.description, canonicalUrl),
      kind: "component",
      canonicalUrl,
      sections: markdownSections(source, canonicalUrl),
      links: [
        { kind: "docs", label: null, url: canonicalUrl },
        { kind: "code", label: null, url: codeLink(definition, sourcePath) },
      ],
      examples: componentPreviews(source, canonicalUrl),
      relationships: uniqueBy(
        relationships,
        ({ kind, targetUrl }) => `${kind}:${targetUrl}`,
      ),
      sourcePath,
    });
  }
  return records;
}

async function baseUiRecords(definition, root) {
  const componentsRoot = resolve(
    root,
    "docs/src/app/(docs)/react/components",
  );
  const directories = (await readdir(componentsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const records = [];
  for (const nativeId of directories) {
    const sourcePath = `docs/src/app/(docs)/react/components/${nativeId}/page.mdx`;
    let source;
    try {
      source = await readFile(resolve(root, sourcePath), "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const name = plainText(source.match(/^#\s+(.+)$/m)?.[1] ?? nativeId);
    const canonicalUrl = `https://base-ui.com/react/components/${nativeId}`;
    records.push({
      nativeId,
      name,
      aliases: [],
      summary: summary(
        source.match(/<Subtitle>([\s\S]*?)<\/Subtitle>/)?.[1],
        canonicalUrl,
      ),
      kind: "primitive",
      canonicalUrl,
      sections: markdownSections(source, canonicalUrl),
      links: [
        { kind: "docs", label: null, url: canonicalUrl },
        { kind: "code", label: null, url: codeLink(definition, sourcePath) },
      ],
      examples: markdownExampleHeadings(source, canonicalUrl),
      relationships: markdownRelationships(
        source,
        nativeId,
        "/react/components/",
        "https://base-ui.com",
      ),
      sourcePath,
    });
  }
  return records;
}

async function assistantUiRecords(definition, root) {
  const guideRoot = resolve(root, "apps/docs/content/docs/primitives");
  const referenceRoot = resolve(
    root,
    "apps/docs/content/docs/(reference)/api-reference/primitives",
  );
  const guideMeta = JSON.parse(await readFile(resolve(guideRoot, "meta.json"), "utf8"));
  const referenceMeta = JSON.parse(
    await readFile(resolve(referenceRoot, "meta.json"), "utf8"),
  );
  const nativeIds = [...new Set([...guideMeta.pages, ...referenceMeta.pages])]
    .filter((item) => item !== "index" && item !== "composition")
    .sort();
  const records = [];
  for (const nativeId of nativeIds) {
    const guidePath = `apps/docs/content/docs/primitives/${nativeId}.mdx`;
    const referencePath = `apps/docs/content/docs/(reference)/api-reference/primitives/${nativeId}.mdx`;
    const guide = await readFile(resolve(root, guidePath), "utf8").catch(() => null);
    const reference = await readFile(resolve(root, referencePath), "utf8").catch(() => null);
    const primary = guide ?? reference;
    if (!primary) continue;
    const primaryPath = guide ? guidePath : referencePath;
    const metadata = frontmatter(primary);
    const referenceMetadata = reference ? frontmatter(reference) : {};
    const canonicalUrl = guide
      ? `https://www.assistant-ui.com/docs/primitives/${nativeId}`
      : `https://www.assistant-ui.com/docs/api-reference/primitives/${nativeId}`;
    const apiUrl = `https://www.assistant-ui.com/docs/api-reference/primitives/${nativeId}`;
    const sections = [
      ...markdownSections(guide ?? "", canonicalUrl),
      ...markdownSections(reference ?? "", apiUrl).map((section) => ({
        ...section,
        nativeId: `api-reference:${section.nativeId}`,
      })),
    ];
    const relationships = [
      ...markdownRelationships(
        guide ?? "",
        nativeId,
        "/docs/primitives/",
        "https://www.assistant-ui.com",
      ),
      ...markdownRelationships(
        reference ?? "",
        nativeId,
        "/docs/api-reference/primitives/",
        "https://www.assistant-ui.com",
      ),
    ];
    records.push({
      nativeId,
      name: String(metadata.title ?? referenceMetadata.title ?? nativeId),
      aliases:
        referenceMetadata.title && referenceMetadata.title !== metadata.title
          ? [String(referenceMetadata.title)]
          : [],
      summary: summary(
        metadata.description ?? referenceMetadata.description,
        canonicalUrl,
      ),
      kind: "primitive",
      canonicalUrl,
      sections,
      links: uniqueBy(
        [
          { kind: "docs", label: null, url: canonicalUrl },
          ...(reference ? [{ kind: "docs", label: "API reference", url: apiUrl }] : []),
          { kind: "code", label: null, url: codeLink(definition, primaryPath) },
        ],
        ({ kind, url }) => `${kind}:${url}`,
      ),
      examples: assistantPreviews(guide ?? "", canonicalUrl),
      relationships: uniqueBy(
        relationships,
        ({ kind, targetUrl }) => `${kind}:${targetUrl}`,
      ),
      sourcePath: primaryPath,
    });
  }
  return records;
}

function htmlSections(source, canonicalUrl) {
  const sections = [];
  for (const match of source.matchAll(/<section\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const nativeId = match[1];
    const body = match[2] ?? "";
    const title = plainText(body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? "");
    if (!nativeId || !title) continue;
    const isAdditiveAccessibilitySection =
      nativeId === "keyboard_interaction" ||
      nativeId === "roles_states_properties";
    sections.push({
      nativeId,
      title,
      url: `${canonicalUrl}#${nativeId}`,
      content: isAdditiveAccessibilitySection
        ? guidanceText(body.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, ""))
        : null,
    });
  }
  return uniqueBy(sections, ({ nativeId }) => nativeId);
}

function apgExamples(source, canonicalUrl) {
  const examplesSection = source.match(/<section\s+id="examples"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
  const examples = [];
  for (const match of examplesSection.matchAll(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = match[1];
    const title = plainText(match[2] ?? "");
    if (!href || !title || !href.includes("examples/")) continue;
    const url = new URL(href, canonicalUrl).href;
    examples.push({ nativeId: basename(new URL(url).pathname, ".html"), title, url });
  }
  return uniqueBy(examples, ({ url }) => url);
}

function apgRelationships(source, currentSlug) {
  const relationships = [];
  for (const match of source.matchAll(/<a\s+href="\.\.\/([^/]+)\/[^"#]*-pattern\.html"[^>]*>([\s\S]*?)<\/a>/g)) {
    const target = match[1];
    if (!target || target === currentSlug) continue;
    const label = plainText(match[2] ?? target).replace(/\s+Pattern$/, "");
    relationships.push({
      kind: "related-to",
      label,
      targetTitle: label,
      targetUrl: `https://www.w3.org/WAI/ARIA/apg/patterns/${target}/`,
    });
  }
  return uniqueBy(relationships, ({ targetUrl }) => targetUrl);
}

async function ariaApgRecords(definition, root) {
  const patternsRoot = resolve(root, "content/patterns");
  const directories = (await readdir(patternsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const records = [];
  for (const nativeId of directories) {
    const directory = resolve(patternsRoot, nativeId);
    const patternFile = (await readdir(directory)).find((file) => file.endsWith("-pattern.html"));
    if (!patternFile) continue;
    const sourcePath = `content/patterns/${nativeId}/${patternFile}`;
    const source = await readFile(resolve(root, sourcePath), "utf8");
    const canonicalUrl = `https://www.w3.org/WAI/ARIA/apg/patterns/${nativeId}/`;
    const name = plainText(source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? nativeId)
      .replace(/\s+Pattern$/, "");
    const about = source.match(/<section\s+id="about"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? "";
    const firstParagraph = about.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1];
    records.push({
      nativeId,
      name,
      aliases: [],
      summary: summary(firstParagraph, `${canonicalUrl}#about`),
      kind: "pattern",
      canonicalUrl,
      sections: htmlSections(source, canonicalUrl),
      links: [
        { kind: "docs", label: null, url: canonicalUrl },
        { kind: "code", label: null, url: codeLink(definition, sourcePath) },
      ],
      examples: apgExamples(source, canonicalUrl),
      relationships: apgRelationships(source, nativeId),
      sourcePath,
    });
  }
  return records;
}

const extractors = {
  "shadcn-ui": shadcnRecords,
  "base-ui": baseUiRecords,
  "assistant-ui": assistantUiRecords,
  "aria-apg": ariaApgRecords,
};

try {
  const inputs = {};
  for (const definition of manifest.providers) {
    const extract = extractors[definition.id];
    if (!extract) throw new Error(`No source extractor for ${definition.id}`);
    const root = await extractRepository(definition);
    const records = (await extract(definition, root)).sort(
      (left, right) => left.nativeId.localeCompare(right.nativeId),
    );
    if (!records.length) throw new Error(`${definition.id} produced no records.`);
    const input = { schemaVersion: "1", revision: definition.source.revision, records };
    inputs[definition.id] = input;
    await writeFile(
      resolve(packageRoot, definition.source.inputPath),
      `${JSON.stringify(input, null, 2)}\n`,
    );
  }
  await writeFile(
    resolve(packageRoot, "providers/providers.lock.json"),
    `${JSON.stringify(
      {
        schemaVersion: "2",
        inputs: Object.fromEntries(
          Object.entries(inputs)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([id, input]) => [id, sha256Canonical(input)]),
        ),
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
