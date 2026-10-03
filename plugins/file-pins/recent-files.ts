import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { getDefaults, Lexer, marked, Tokenizer } from "marked";
import { z } from "zod";

type Event = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["events"]["list"]>>[number];
const inputSchema = z.array(z.object({
  type: z.string(), path: z.string().optional(), text: z.string().optional(),
  mentions: z.array(z.object({ resource: z.object({ kind: z.string(), path: z.string().optional(), entryKind: z.string().optional() }) })).optional(),
}));

// Emphasis never changes a link target, and marked's delimiter matching is
// quadratic on input like "*a *a …", so links are read with it switched off.
class LinkTokenizer extends Tokenizer {
  override emStrong() { return undefined; }
  override del() { return undefined; }
}
const LINK_SYNTAX = /\]\(|\]:|</;
// Link rules stay quadratic on input like "![a](![a](…", so each text and each
// call get a small lexing budget; results are cached per event so polls are free.
const MAX_TEXT = 4_000;
const CALL_BUDGET = 12_000;
const MAX_CACHED = 2_000;
export type LinkCache = Map<string, string[]>;

// Only inspect typed file activity and actual Markdown links. Marked owns the
// Markdown grammar; code blocks, plain prose and tool command strings are not paths.
export function recentPaths(events: Event[], cache: LinkCache = new Map(), scope = ""): string[] {
  const paths: string[] = [];
  let budget = CALL_BUDGET;
  function add(path: string | undefined) {
    if (!path || path.length > 4096 || path.includes("\0") || paths.includes(path) || paths.length >= 40) return;
    paths.push(path);
  }
  function links(text: string, key: string) {
    let found = cache.get(key);
    if (!found) {
      const source = LINK_SYNTAX.test(text) ? text.slice(0, MAX_TEXT) : "";
      if (source.length > budget) return;
      budget -= source.length;
      found = source ? extract(source) : [];
      if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
      cache.set(key, found);
    }
    for (const path of found) add(path);
  }
  function extract(text: string) {
    const found: string[] = [];
    marked.walkTokens(new Lexer({ ...getDefaults(), tokenizer: new LinkTokenizer() }).lex(text), (token) => {
      if (token.type !== "link") return;
      let path = token.href;
      if (path.startsWith("file://")) {
        try {
          const url = new URL(path);
          if (url.hostname && url.hostname !== "localhost") return;
          path = decodeURIComponent(url.pathname);
        } catch { return; }
      } else {
        if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//") || path.startsWith("#")) return;
        try { path = decodeURIComponent(path); } catch { return; }
      }
      found.push(path.replace(/(?::\d+(?::\d+)?|#L\d+(?:-L?\d+)?)$/, ""));
    });
    return found;
  }
  function input(value: unknown, key: string) {
    const parsed = inputSchema.safeParse(value);
    if (!parsed.success) return;
    parsed.data.forEach((part, index) => {
      if (part.type === "text") {
        for (const { resource } of part.mentions ?? []) if (resource.kind === "path" && resource.entryKind === "file") add(resource.path);
        if (part.text) links(part.text, `${key}:${index}`);
      } else if (part.type === "localFile" || part.type === "localImage") add(part.path);
    });
  }
  for (const event of [...events].sort((a, b) => b.seq - a.seq)) {
    const key = `${scope}:${event.seq}`;
    if (event.type === "item/completed") {
      const item = event.data.item;
      if (item.type === "fileChange" && item.status === "completed") {
        for (const change of item.changes) if (change.kind !== "delete") add(change.movePath ?? change.path);
      } else if (item.type === "agentMessage") links(item.text, key);
      else if (item.type === "userMessage") input(item.content, key);
    } else if (event.type === "client/turn/requested" && event.data.initiator === "user") input(event.data.input, key);
    else if (event.type === "client/thread/start" && event.data.initiator === "user") input(event.data.request.params.input, key);
    if (paths.length >= 40) break;
  }
  return paths;
}
