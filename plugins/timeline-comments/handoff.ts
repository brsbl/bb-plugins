const SOURCE_CODE_POINT_LIMIT = 800;

function truncateSource(source: string): string {
  const points = Array.from(source.trim());
  if (points.length <= SOURCE_CODE_POINT_LIMIT) return points.join("");
  return `${points.slice(0, SOURCE_CODE_POINT_LIMIT - 1).join("")}…`;
}

/** Keep the authored comment primary while carrying its selected source. */
export function createIndividualHandoffPrompt(
  body: string,
  source: string,
): string {
  const excerpt = truncateSource(source);
  if (excerpt === "") return body;
  const quote = excerpt
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `${body}\n\nContext from the timeline:\n${quote}`;
}
