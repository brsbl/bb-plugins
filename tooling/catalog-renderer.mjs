const START_MARKER = "<!-- plugin-catalog:start -->";
const END_MARKER = "<!-- plugin-catalog:end -->";

function normalizedText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

export function markdownTableText(value) {
  return normalizedText(value).replace(/\|/g, "\\|");
}

function markdownInlineText(value) {
  return normalizedText(value).replace(/([\\`*_[\]<>#|])/g, "\\$1");
}

export function renderCatalogIndex(catalog) {
  return catalog.plugins
    .map((entry) => {
      const name = markdownInlineText(entry.name);
      const purpose = normalizedText(entry.purpose);
      const screenshot = entry.screenshot
        ? `![${name} in bb](${entry.source}/${entry.screenshot})`
        : "_No visual surface._";
      const install = `bb plugin install git:https://github.com/brsbl/bb-plugins.git@${entry.installRef} --yes`;
      return [
        `### ${name}`,
        purpose,
        screenshot,
        `[Source](${entry.source}) · [README](${entry.source}/README.md)`,
        `Install: \`${install}\``,
      ].join("\n\n");
    })
    .join("\n\n");
}

export function renderCatalogBlock(catalog) {
  return `${START_MARKER}\n${renderCatalogIndex(catalog)}\n${END_MARKER}`;
}

export function replaceCatalogBlock(markdown, catalog) {
  const start = markdown.indexOf(START_MARKER);
  const end = markdown.indexOf(END_MARKER, start);
  if (start < 0 || end < 0) {
    throw new Error("README.md is missing the canonical plugin catalog markers");
  }
  return `${markdown.slice(0, start)}${renderCatalogBlock(catalog)}${markdown.slice(end + END_MARKER.length)}`;
}
