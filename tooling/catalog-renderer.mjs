const START_MARKER = "<!-- plugin-catalog:start -->";
const END_MARKER = "<!-- plugin-catalog:end -->";

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function markdownTableText(value) {
  return String(value).replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
}

export function renderCatalogTable(catalog) {
  const lines = [
    "| Plugin | Purpose and when to use it | Surfaces and visual | Install and source | CI and maintenance |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const entry of catalog.plugins) {
    const screenshot = entry.screenshot
      ? ` [Screenshot](${entry.source}/${entry.screenshot})`
      : "";
    const name = markdownTableText(entry.name);
    const purpose = markdownTableText(entry.purpose);
    const whenToUse = markdownTableText(entry.whenToUse);
    const surfaces = entry.surfaces.map(markdownTableText).join("; ");
    const visual = markdownTableText(entry.visual);
    const maintenance = markdownTableText(titleCase(entry.maintenance));
    lines.push(
      `| **${name}** | ${purpose} ${whenToUse} | ${surfaces}. ${visual}.${screenshot} | \`bb plugin install git:https://github.com/brsbl/bb-plugins.git@${entry.installRef} --yes\` · [Source](${entry.source}) | [CI](https://github.com/brsbl/bb-plugins/actions/workflows/ci.yml) · ${maintenance} |`,
    );
  }
  return lines.join("\n");
}

export function renderCatalogBlock(catalog) {
  return `${START_MARKER}\n${renderCatalogTable(catalog)}\n${END_MARKER}`;
}

export function replaceCatalogBlock(markdown, catalog) {
  const start = markdown.indexOf(START_MARKER);
  const end = markdown.indexOf(END_MARKER, start);
  if (start < 0 || end < 0) {
    throw new Error("README.md is missing the canonical plugin catalog markers");
  }
  return `${markdown.slice(0, start)}${renderCatalogBlock(catalog)}${markdown.slice(end + END_MARKER.length)}`;
}
