/** Isolated development fixture. Never uses or accepts real Google credentials. */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const messages = new Map<string, unknown>();
const drafts = new Map<string, unknown>();
const original = { id: "message-fixture", threadId: "thread-fixture", labelIds: ["INBOX", "UNREAD"], snippet: "Could we meet next week?", payload: { mimeType: "text/plain", headers: [{ name: "From", value: "sender@example.test" }, { name: "To", value: "owner@example.test" }, { name: "Subject", value: "Meeting next week" }, { name: "Message-ID", value: "<original@example.test>" }], body: { data: Buffer.from("Could we meet next week?").toString("base64url") } } };
messages.set(original.id, original);
createServer(async (req, res) => {
  const url = new URL(req.url!, "http://127.0.0.1"), path = url.pathname;
  const reply = (body: unknown, code = 200) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (path === "/auth") {
    const redirect = new URL(url.searchParams.get("redirect_uri")!); redirect.searchParams.set("state", url.searchParams.get("state")!); redirect.searchParams.set("code", "fixture-code");
    res.writeHead(200, { "content-type": "text/html" }); res.end(`<h1>Fake Google consent</h1><p>Fixture account: owner@example.test</p><p>Copy this simulated redirect into Gmail Connect:</p><input style="width:95%" value="${redirect.href.replace(/&/g, "&amp;")}">`); return;
  }
  if (path === "/token") { reply({ access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600 }); return; }
  if (path.endsWith("/profile")) { reply({ emailAddress: "owner@example.test" }); return; }
  if (path.endsWith("/messages") && req.method === "GET") { reply({ messages: [...messages.keys()].map((id) => ({ id, threadId: "thread-fixture" })) }); return; }
  if (path.includes("/threads/")) { reply({ id: "thread-fixture", messages: [...messages.values()] }); return; }
  if (path.includes("/messages/") && req.method === "GET") { const message = messages.get(path.split("/").at(-1)!); reply(message ?? {}, message ? 200 : 404); return; }
  if (req.method === "POST" || req.method === "PUT") {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (path.endsWith("/send")) { const id = `sent-${randomUUID()}`; messages.set(id, { id, threadId: "thread-fixture", labelIds: ["SENT"], raw: data.raw }); reply({ id, threadId: "thread-fixture" }); return; }
    if (path.includes("/drafts")) { const id = req.method === "PUT" ? path.split("/").at(-1)! : `draft-${randomUUID()}`; drafts.set(id, data.message); reply({ id, message: { id: `message-${id}`, threadId: "thread-fixture" } }); return; }
  }
  reply({ error: "Unknown fixture route" }, 404);
}).listen(53684, "127.0.0.1", () => process.stdout.write("Fake Gmail ready on 127.0.0.1:53684\n"));
