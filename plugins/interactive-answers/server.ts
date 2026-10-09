import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { answerSchema, documentSchema, htmlAnswerSchema, idSchema, MAX_HTML_LENGTH, parseDocument, threadSchema, type Answer, type HtmlAnswer } from "./model.js";
import { bill, savings, stepper } from "./examples.js";
import { buildWidgetDocument, fallbackTheme, FRAME_HEADERS, FRAME_PATH } from "./widget.js";

export const rpcContract = defineRpcContract({
  get: { input: z.object({ id: idSchema, threadId: threadSchema }).strict(), output: answerSchema },
});
const HTML_GUIDE = [
  "HTML answers: publish {title, html, width?} when an answer needs custom layout, illustration, maps, photos, or step-by-step interaction that native blocks cannot express. html is body markup with inline <style> and <script>; it runs in a sandboxed, opaque-origin frame that auto-sizes to its content inside a rounded bb card. width (320–1200 px) caps the card width; omit it to fill the message.",
  "Look: follow the 'HTML answers' rules in the interactive-answers skill (anatomy, type and ink, space, illustrations, motion, and the pre-publish check). They are what makes an answer look finished rather than like a web page.",
  "Tokens: --ia-ink (headings, labels), --ia-body (paragraphs), --ia-meta (subtitles, captions), --ia-stage and --ia-hairline (surfaces), --ia-radius, --ia-radius-stage, --ia-radius-photo, --ia-ease, plus bb's --background, --foreground, --card, --ring and --font. They follow bb's light and dark themes. Fixed colors are only for depicted things.",
  "Kit classes: .ia-title, .ia-subtitle, .ia-eyebrow, .ia-h, .ia-item-title, .ia-body, .ia-meta, .ia-panel, .ia-stage, .ia-photos, .ia-seg (buttons with aria-pressed), .ia-chip, .ia-btn, .ia-btn-primary, .ia-link, .ia-check (label > input + text + small), .ia-dots (i[aria-current=step]), .ia-reveal (entrance; set --i to stagger).",
  "3D: for rooms, products, or sites, follow the skill's 3D tier (Three.js via import map, MSAA composer with AO and gentle bloom, a shadowed key light plus window area lights, data-driven presets, Poly Haven CC0 models and textures, frosted-glass controls, render on demand). demos/room-3d.html is the reference.",
  "Bridge: window.answer.state is the last value passed to window.answer.save(value) in this browser (or null). Call save after each meaningful change so reloads restore it. window.answer.theme and window.answer.onTheme(callback) report theme changes. http(s) links open in a new bb tab.",
  "Remote images, fonts, scripts, and map tiles load normally; use stable public URLs and credit sources in your prose. The frame has no access to bb, cookies, or the conversation, and inputs are not sent to the agent. Its scripts can reach the network, so never send what the user enters to any server. Respect prefers-reduced-motion and keep controls keyboard accessible.",
].join("\n");
function guide() {
  return { instructions: "Compose a small answer from native controls and blocks. Expressions are numbers, {ref: input_or_earlier_calculation}, or {op, args}. No JavaScript, HTML, remote assets, or actions in documents. Publish a complete document as a JSON string; emit the returned directive once on its own line. Published answers are immutable: publish a new answer for a revision. User input stays in this browser and is not sent to the agent. Use plain text when interaction adds no value.", html: HTML_GUIDE, schema: z.toJSONSchema(documentSchema), examples: { savings, bill, stepper } };
}
export function createStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, ["CREATE TABLE answers (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, document TEXT NOT NULL)", "CREATE INDEX answers_thread ON answers(thread_id)", "ALTER TABLE answers ADD COLUMN kind TEXT NOT NULL DEFAULT 'document'"]);
  const insert = (threadId: string, kind: Answer["kind"], content: string) => {
    const id = randomUUID();
    db.prepare("INSERT INTO answers (id, thread_id, document, kind) VALUES (?, ?, ?, ?)").run(id, threadSchema.parse(threadId), content, kind);
    return { id, directive: `::interactive-answer{id="${id}"}` };
  };
  return {
    publish(threadId: string, json: string) { return insert(threadId, "document", JSON.stringify(parseDocument(json))); },
    publishHtml(threadId: string, widget: HtmlAnswer) { return insert(threadId, "html", JSON.stringify(htmlAnswerSchema.parse(widget))); },
    get(threadId: string, id: string): Answer {
      const row = db.prepare("SELECT document, kind FROM answers WHERE id = ? AND thread_id = ?").get(idSchema.parse(id), threadSchema.parse(threadId)) as { document: string; kind: string } | undefined;
      if (!row) throw new Error("This answer is unavailable. Ask the agent to publish it again in this thread.");
      return row.kind === "html" ? { id, threadId, kind: "html", widget: htmlAnswerSchema.parse(JSON.parse(row.document)) } : { id, threadId, kind: "document", document: parseDocument(row.document) };
    },
    removeThread(threadId: string) { db.prepare("DELETE FROM answers WHERE thread_id = ?").run(threadId); },
  };
}
export default function plugin(bb: BbPluginApi): void {
  const store = createStore(bb);
  bb.rpc.register(rpcContract, { get: ({ id, threadId }) => store.get(threadId, id) });
  // HTML answers load from bb's own address instead of an inline srcdoc frame: hosts such as the
  // mobile app's WebView only allow frame navigations to the bb server, so about:srcdoc stays blank.
  bb.http.route("GET", FRAME_PATH, (c) => {
    try {
      const answer = store.get(String(c.req.query("thread") ?? ""), String(c.req.query("id") ?? ""));
      if (answer.kind !== "html") return new Response("Not an HTML answer", { status: 404 });
      return new Response(buildWidgetDocument({ id: answer.id, html: answer.widget.html, state: null, theme: fallbackTheme }), { headers: FRAME_HEADERS });
    } catch {
      return new Response("This answer is unavailable.", { status: 404 });
    }
  });
  bb.agents.registerTool({
    name: "interactive_answer",
    description: "Create interactive answers in bb: calculators, charts, and tables from native blocks, or custom HTML interfaces such as illustrated step-by-step guides, maps with photos, and visual previews. Call guide first, then publish a document or HTML. Emit the returned directive once on its own line.",
    instructions: "Use Interactive Answers when changing inputs, comparing scenarios, or revealing explanations would make an answer more useful. Read its guide before publishing. Prefer plain text for simple answers. Render the returned directive in your reply, never in a code fence. Controls are local exploration only, not approvals or messages to an agent.",
    parameters: z.object({
      action: z.enum(["guide", "publish"]),
      document: z.string().max(120_000).optional().describe("Native document encoded as JSON"),
      html: z.string().max(MAX_HTML_LENGTH).optional().describe("Body markup for an HTML answer, with inline <style> and <script>"),
      title: z.string().max(160).optional().describe("Accessible title, required with html"),
      width: z.number().int().min(320).max(1200).optional().describe("Optional maximum card width in pixels for an HTML answer"),
    }).strict(),
    execute: (input, ctx) => {
      if (input.action === "guide") return JSON.stringify(guide());
      if (!ctx.threadId) throw new Error("Publish requires a thread.");
      if (input.html !== undefined) return JSON.stringify(store.publishHtml(ctx.threadId, { title: input.title ?? "", html: input.html, ...(input.width === undefined ? {} : { width: input.width }) }));
      if (!input.document) throw new Error("Publish requires a document or html.");
      return JSON.stringify(store.publish(ctx.threadId, input.document));
    },
  });
  bb.agents.configure(() => ({ tools: ["interactive_answer"], skills: ["interactive-answers"] }));
  bb.cli.register(defineCli({
    name: "interactive-answers", summary: "Publish interactive answers in a bb thread",
    commands: {
      guide: cliCommand({ summary: "Print the document schema and examples", run: () => ({ exitCode: 0, stdout: `${JSON.stringify(guide(), null, 2)}\n` }) }),
      example: cliCommand({ summary: "Print an example document", positionals: [{ name: "name", required: true, description: "savings, bill (documents), or stepper (HTML answer)" }], run: ({ positionals }) => {
        if (positionals.name === "stepper") return { exitCode: 0, stdout: `${JSON.stringify(stepper)}\n` };
        const examples = { savings, bill };
        if (!Object.hasOwn(examples, positionals.name)) throw new Error("Choose savings, bill, or stepper.");
        return { exitCode: 0, stdout: `${JSON.stringify(examples[positionals.name as keyof typeof examples])}\n` };
      } }),
      publish: cliCommand({ summary: "Save an answer and print its inline directive", options: { document: { type: "string", stdin: true, description: "Native document JSON on one line; use --document-stdin" }, answer: { type: "string", stdin: true, description: "HTML answer as one-line JSON {title, html, width?}; use --answer-stdin" }, thread: { type: "string", description: "Thread ID; defaults to the current thread" } }, run: ({ options }, ctx) => {
        const threadId = threadSchema.parse(options.thread ?? ctx.threadId);
        if (options.answer !== undefined) return { exitCode: 0, stdout: `${store.publishHtml(threadId, htmlAnswerSchema.parse(JSON.parse(options.answer))).directive}\n` };
        if (options.document === undefined) throw new Error("Pass --document-stdin or --answer-stdin.");
        return { exitCode: 0, stdout: `${store.publish(threadId, options.document).directive}\n` };
      } }),
    },
  }));
  bb.events.on("thread.deleted", ({ thread }) => store.removeThread(thread.id));
}
