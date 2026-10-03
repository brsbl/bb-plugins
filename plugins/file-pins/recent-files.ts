import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { marked } from "marked";
import { z } from "zod";

type Event = Awaited<ReturnType<BbPluginApi["sdk"]["threads"]["events"]["list"]>>[number];
const inputSchema = z.array(z.object({
  type: z.string(), path: z.string().optional(), text: z.string().optional(),
  mentions: z.array(z.object({ resource: z.object({ kind: z.string(), path: z.string().optional(), entryKind: z.string().optional() }) })).optional(),
}));

// Only inspect typed file activity and actual Markdown links. Marked owns the
// Markdown grammar; code blocks, plain prose and tool command strings are not paths.
export function recentPaths(events: Event[]): string[] {
  const paths: string[] = [];
  let textBudget = 200_000;
  function add(path: string | undefined) {
    if (!path || path.length > 4096 || path.includes("\0") || paths.includes(path) || paths.length >= 40) return;
    paths.push(path);
  }
  function links(text: string) {
    if (text.length > 40_000 || text.length > textBudget) return;
    textBudget -= text.length;
    marked.walkTokens(marked.lexer(text), (token) => {
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
      add(path.replace(/(?::\d+(?::\d+)?|#L\d+(?:-L?\d+)?)$/, ""));
    });
  }
  function input(value: unknown) {
    const parsed = inputSchema.safeParse(value);
    if (!parsed.success) return;
    for (const part of parsed.data) {
      if (part.type === "text") {
        for (const { resource } of part.mentions ?? []) if (resource.kind === "path" && resource.entryKind === "file") add(resource.path);
        if (part.text) links(part.text);
      } else if (part.type === "localFile" || part.type === "localImage") add(part.path);
    }
  }
  for (const event of [...events].sort((a, b) => b.seq - a.seq)) {
    if (event.type === "item/completed") {
      const item = event.data.item;
      if (item.type === "fileChange" && item.status === "completed") {
        for (const change of item.changes) if (change.kind !== "delete") add(change.movePath ?? change.path);
      } else if (item.type === "agentMessage") links(item.text);
      else if (item.type === "userMessage") input(item.content);
    } else if (event.type === "client/turn/requested" && event.data.initiator === "user") input(event.data.input);
    else if (event.type === "client/thread/start" && event.data.initiator === "user") input(event.data.request.params.input);
    if (paths.length >= 40) break;
  }
  return paths;
}
