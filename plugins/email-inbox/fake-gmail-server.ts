import { createServer } from "node:http";
import { createFakeGmail, type FakeMailInput } from "./fake-gmail.ts";

// Dev QA only: serves the in-memory fake of Gmail over loopback HTTP. Start bb with
// BB_EMAIL_FAKE_GMAIL=http://127.0.0.1:<port> and save `fake-refresh-<address>` as each account's refresh token.
// Then change mail the way it would arrive:
//   POST /_fake/put    { account, message: { from, subject, text?, html?, messageId?, attachments?, unread? } }
//   POST /_fake/sent   { account, to }
//   POST /_fake/revoke { account }
//   GET  /_fake/state  → every message's labels and every request the plugin made
const port = Number(process.argv[2] ?? 47813);
const base = `http://127.0.0.1:${port}`;
const gmail = createFakeGmail(base);
for (const address of (process.argv[3] ?? "a@example.com").split(",")) gmail.addAccount(address);

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", base);
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks).toString("utf8");
  if (url.pathname.startsWith("/_fake/")) {
    const input = (body ? JSON.parse(body) : {}) as { account?: string; message?: FakeMailInput; to?: string };
    const action = url.pathname.slice("/_fake/".length);
    if (action === "put" && input.account && input.message) gmail.put(input.account, input.message);
    else if (action === "sent" && input.account && input.to) gmail.sent(input.account, input.to);
    else if (action === "revoke" && input.account) gmail.revoke(input.account);
    else if (action !== "state") { response.writeHead(400).end(); return; }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ labels: gmail.labels(), requests: gmail.requests() }));
    return;
  }
  const headers = Object.fromEntries(Object.entries(request.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const answer = await gmail.fetch(url.toString(), { method: request.method, headers, ...(body ? { body } : {}) });
  response.writeHead(answer.status, { "content-type": "application/json" }).end(await answer.text());
}).listen(port, "127.0.0.1", () => console.log(`fake Gmail on ${base}`));
