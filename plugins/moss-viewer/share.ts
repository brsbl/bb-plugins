// Share with Agent's shared names, for the panel and the server alike.
import type { MossSelection } from "./vendor/moss-editor.contract.js";

/** The mention provider Share with Agent's composer pills resolve through. */
export const SHARE_PROVIDER = "moss-note";
/** The most selected markdown Share with Agent sends; the agent can read the rest from the note. */
export const MAX_SHARED_SELECTION = 20_000;
const MAX_HEADINGS = 20;
const MAX_HEADING = 200;

/** What Share with Agent keeps of a selection: its markdown and where it is in the note's file. */
export interface SharedSelection {
  markdown: string;
  /** 1-based, inclusive lines in the note's file. */
  lines: { start: number; end: number };
  /** The headings over the selection, outermost first. */
  headings: string[];
  /** The markdown was cut at MAX_SHARED_SELECTION characters. */
  truncated: boolean;
}

/** The part of Moss's selection the agent gets, capped; null when nothing is selected. */
export function sharedSelection(selection: MossSelection | null): SharedSelection | null {
  if (selection === null) return null;
  const markdown = selection.markdown.trim() === "" ? selection.text.trim() : selection.markdown.replace(/\n+$/, "");
  if (markdown === "") return null;
  const truncated = markdown.length > MAX_SHARED_SELECTION;
  return {
    markdown: truncated ? markdown.slice(0, MAX_SHARED_SELECTION) : markdown,
    lines: { start: selection.lines.start, end: Math.max(selection.lines.start, selection.lines.end) },
    headings: selection.headings.slice(0, MAX_HEADINGS).map((heading) => heading.slice(0, MAX_HEADING)),
    truncated,
  };
}

/** The composer pill for a shared note: its title, and the start of the selection when there is one. */
export function shareLabel(title: string, selection: string | null, excerpt = 32): string {
  if (selection === null) return title;
  const words = selection.trim().replace(/\s+/g, " ");
  if (words === "") return title;
  return `${title}: “${words.length > excerpt ? `${words.slice(0, excerpt - 1).trimEnd()}…` : words}”`;
}
