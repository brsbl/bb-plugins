/** Small shared card renderer, vendored in file-pins too: neither plugin requires the other. */
export type CardTone = "muted" | "success" | "danger" | "warning" | "merged" | "working";
export interface HoverCardContent {
  kind: "thread" | "section" | "pull-request" | "issue" | "link";
  title: string;
  identifier?: string;
  state?: { label: string; tone?: CardTone };
  facts?: Array<string | Node>;
  meta?: Array<string | Node>;
  content?: Node[];
  notice?: string;
}
const colors: Record<CardTone, string> = {
  muted: "var(--muted-foreground)", success: "var(--success, currentColor)", danger: "var(--destructive, currentColor)",
  warning: "var(--warning-text, currentColor)", merged: "var(--pr-merged, currentColor)", working: "var(--foreground)",
};
function node(tag: string, text?: string, css = ""): HTMLElement {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  el.style.cssText = css;
  return el;
}
function typeIcon(kind: HoverCardContent["kind"]): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.6"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round"); svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "width:16px;height:16px;flex:none;margin-top:1px";
  const paths: Record<HoverCardContent["kind"], string> = {
    "pull-request": "M6 9v12M13 6h3a2 2 0 0 1 2 2v7M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M21 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    issue: "M12 8v5m0 3v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    thread: "M21 11a8 8 0 0 1-8 8H5l-3 3V11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8M7 9h10M7 13h7",
    section: "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    link: "m10 13 4-4m-6 7-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 2 1-1a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0",
  };
  const path = document.createElementNS(ns, "path"); path.setAttribute("d", paths[kind]); svg.append(path); return svg;
}
export function relativeTime(value: number | string, now = Date.now()): string {
  const time = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(time)) return "Activity unavailable";
  const minutes = Math.max(0, Math.floor((now - time) / 60_000));
  return minutes < 1 ? "Updated just now" : minutes < 60 ? `Updated ${minutes}m ago` : minutes < 1440 ? `Updated ${Math.floor(minutes / 60)}h ago` : `Updated ${Math.floor(minutes / 1440)}d ago`;
}
export function renderHoverCard(container: HTMLElement, data: HoverCardContent): void {
  const body = node("div", undefined, "display:flex;flex-direction:column;gap:10px;min-width:0;font-size:12px;line-height:1.45;color:var(--foreground)");
  body.dataset.hoverKind = data.kind;
  const header = node("header", undefined, "display:flex;align-items:flex-start;gap:8px;min-width:0");
  const heading = node("div", undefined, "min-width:0;flex:1");
  const title = node("h3", data.title, "font-size:12px;font-weight:600;line-height:1.45;margin:0;overflow-wrap:anywhere");
  heading.append(title);
  if (data.identifier) heading.append(node("div", data.identifier, "font-size:11px;color:var(--muted-foreground);overflow-wrap:anywhere"));
  header.append(typeIcon(data.kind), heading);
  if (data.state) {
    const badge = node("span", data.state.label, `flex:none;max-width:45%;font-size:10px;line-height:1.4;border-radius:5px;padding:2px 5px;overflow-wrap:anywhere;background:color-mix(in srgb,currentColor 8%,transparent);color:${colors[data.state.tone ?? "muted"]}`);
    badge.dataset.cardState = data.state.label; header.append(badge);
  }
  body.append(header);
  for (const [name, values] of [["facts", data.facts], ["meta", data.meta]] as const) {
    if (!values?.length) continue;
    const row = node("div", undefined, `display:flex;flex-wrap:wrap;align-items:center;gap:5px 10px;min-width:0;overflow-wrap:anywhere;${name === "meta" ? "font-size:11px;color:var(--muted-foreground);border-top:1px solid var(--border);padding-top:8px" : ""}`);
    row.dataset.cardRow = name;
    for (const value of values) row.append(typeof value === "string" ? node("span", value) : value);
    body.append(row);
  }
  if (data.content) body.append(...data.content);
  if (data.notice) { const notice=node("p",data.notice,"font-size:11px;color:var(--muted-foreground);margin:0"); notice.setAttribute("role","status");body.append(notice); }
  container.replaceChildren(body);
}
