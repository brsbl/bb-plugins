// Share with Agent's shared names, for the panel and the server alike.

/** The mention provider Share with Agent's composer pills resolve through. */
export const SHARE_PROVIDER = "moss-note";
/** The most selected text Share with Agent sends; the agent can read the rest from the note. */
export const MAX_SHARED_SELECTION = 20_000;

/** The composer pill for a shared note: its title, and the start of the selection when there is one. */
export function shareLabel(title: string, selection: string | null, excerpt = 32): string {
  if (selection === null) return title;
  const words = selection.replace(/\s+/g, " ");
  return `${title}: “${words.length > excerpt ? `${words.slice(0, excerpt - 1).trimEnd()}…` : words}”`;
}
