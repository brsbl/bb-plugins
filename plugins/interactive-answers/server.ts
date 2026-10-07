import { randomUUID } from "node:crypto";
import { cliCommand, defineCli, defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { answerSchema, documentSchema, idSchema, parseDocument, threadSchema, type Answer } from "./model.js";
import { bill, savings } from "./examples.js";
import { visualExamples } from "./visual-examples.js";

export const rpcContract = defineRpcContract({
  get: { input: z.object({ id: idSchema, threadId: threadSchema }).strict(), output: answerSchema },
});
function guide() {
  return { instructions: "Compose a small answer from native controls and blocks. Expressions are numbers, {ref: input_or_earlier_calculation}, or {op, args}. No JavaScript, HTML, remote assets, or actions. Publish a complete document as a JSON string; emit the returned directive once on its own line. Published answers are immutable: publish a new answer for a revision. User input stays in this browser and is not sent to the agent. Use plain text when interaction adds no value.", schema: z.toJSONSchema(documentSchema), examples: { savings, bill } };
}
export function createStore(bb: BbPluginApi) {
  const db = bb.storage.database();
  bb.storage.migrate(db, ["CREATE TABLE answers (id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, document TEXT NOT NULL)", "CREATE INDEX answers_thread ON answers(thread_id)"]);
  return {
    publish(threadId: string, json: string) {
      threadSchema.parse(threadId);
      const document = parseDocument(json);
      const id = randomUUID();
      db.prepare("INSERT INTO answers VALUES (?, ?, ?)").run(id, threadId, JSON.stringify(document));
      return { id, directive: `::interactive-answer{id="${id}"}` };
    },
    get(threadId: string, id: string): Answer {
      const row = db.prepare("SELECT document FROM answers WHERE id = ? AND thread_id = ?").get(idSchema.parse(id), threadSchema.parse(threadId)) as { document: string } | undefined;
      if (!row) throw new Error("This answer is unavailable. Ask the agent to publish it again in this thread.");
      return { id, threadId, document: parseDocument(row.document) };
    },
    removeThread(threadId: string) { db.prepare("DELETE FROM answers WHERE thread_id = ?").run(threadId); },
  };
}
export default function plugin(bb: BbPluginApi): void {
  const store = createStore(bb);
  bb.rpc.register(rpcContract, { get: ({ id, threadId }) => store.get(threadId, id) });
  bb.agents.registerTool({
    name: "interactive_answer",
    description: "Create native interactive answers in bb: calculators, charts, tables, interactive vector diagrams, and explorable explanations. Call guide for the schema and examples, then publish a document. Emit the returned directive once on its own line.",
    instructions: "Use Interactive Answers when changing inputs, comparing scenarios, or revealing explanations would make an answer more useful. Read its guide before publishing. Prefer plain text for simple answers. Render the returned directive in your reply, never in a code fence. Controls are local exploration only, not approvals or messages to an agent.",
    parameters: z.object({ action: z.enum(["guide", "publish"]), document: z.string().max(120_000).optional().describe("Complete document encoded as JSON, required for publish") }).strict(),
    execute: (input, ctx) => {
      if (input.action === "guide") return JSON.stringify(guide());
      if (!ctx.threadId || !input.document) throw new Error("Publish requires a thread and a document.");
      return JSON.stringify(store.publish(ctx.threadId, input.document));
    },
  });
  bb.agents.configure(() => ({ tools: ["interactive_answer"], skills: ["interactive-answers"] }));
  bb.cli.register(defineCli({
    name: "interactive-answers", summary: "Publish interactive answers in a bb thread",
    commands: {
      guide: cliCommand({ summary: "Print the document schema and examples", run: () => ({ exitCode: 0, stdout: `${JSON.stringify(guide(), null, 2)}\n` }) }),
      example: cliCommand({ summary: "Print an example document", positionals: [{ name: "name", required: true, description: "savings, bill, bike, city, room, origami, or garden" }], run: ({ positionals }) => {
        const examples = { savings, bill, ...visualExamples };
        if (!Object.hasOwn(examples, positionals.name)) throw new Error("Choose savings, bill, bike, city, room, origami, or garden.");
        return { exitCode: 0, stdout: `${JSON.stringify(examples[positionals.name as keyof typeof examples])}\n` };
      } }),
      publish: cliCommand({ summary: "Save an answer and print its inline directive", options: { document: { type: "string", required: true, stdin: true, description: "Document JSON; use --document-stdin" }, thread: { type: "string", description: "Thread ID; defaults to the current thread" } }, run: ({ options }, ctx) => ({ exitCode: 0, stdout: `${store.publish(threadSchema.parse(options.thread ?? ctx.threadId), options.document).directive}\n` }) }),
    },
  }));
  bb.events.on("thread.deleted", ({ thread }) => store.removeThread(thread.id));
}
