import { createServer } from "node:http";
import { createFakeGoogle } from "./fake-google.js";

// Dev QA only: serves the in-memory fake of Google Calendar over loopback HTTP. Start bb with
// BB_CONTENT_CALENDAR_FAKE_GOOGLE=http://127.0.0.1:<port>; opening the auth URL redirects straight
// to the loopback address you paste back, as if you had approved access in Google.
const port = Number(process.argv[2] ?? 47811);
const google = createFakeGoogle();

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (request.method === "GET" && url.pathname === "/o/oauth2/v2/auth") {
    response.writeHead(302, { location: google.authorize(url.toString()) }).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks).toString("utf8");
  // Edits "she" makes in Google Calendar: GET /_fake/events, POST /_fake/{rename,drag,delete} with { id, summary | date }.
  if (url.pathname.startsWith("/_fake/")) {
    const input = body ? JSON.parse(body) as { id: string; summary?: string; date?: string } : { id: "" };
    const action = url.pathname.slice("/_fake/".length);
    if (action === "rename") google.rename(input.id, input.summary ?? "");
    else if (action === "drag") google.drag(input.id, input.date ?? "");
    else if (action === "delete") google.deleteEvent(input.id);
    else if (action !== "events") { response.writeHead(404).end(); return; }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(google.list()));
    return;
  }
  const target = new URL(`${google.endpoints.apiBase.replace(/\/calendar\/v3$/, "")}${url.pathname}${url.search}`);
  const tokenTarget = url.pathname === "/token" ? google.endpoints.tokenUrl : target.toString();
  const headers = Object.fromEntries(Object.entries(request.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const answer = await google.fetch(tokenTarget, { method: request.method, headers, ...(body ? { body } : {}) });
  response.writeHead(answer.status, { "content-type": answer.headers.get("content-type") ?? "application/json" });
  response.end(await answer.text());
}).listen(port, "127.0.0.1", () => console.log(`fake Google Calendar on http://127.0.0.1:${port}`));
