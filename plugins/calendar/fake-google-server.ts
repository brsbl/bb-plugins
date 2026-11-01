import { createServer } from "node:http";
import type { GoogleEvent } from "./events.js";
import { createFakeGoogle } from "./fake-google.js";

// Dev QA only: serves the in-memory fake of Google Calendar over loopback HTTP. Start bb with
// BB_CALENDAR_FAKE_GOOGLE=http://127.0.0.1:<port>, then change events the way someone would in Google Calendar:
//   POST /_fake/put    { calendarId, event }
//   POST /_fake/move   { calendarId, id, start }
//   POST /_fake/cancel { calendarId, id }
//   POST /_fake/remove { calendarId, id }
//   GET  /_fake/events
const port = Number(process.argv[2] ?? 47812);
const base = `http://127.0.0.1:${port}`;
const google = createFakeGoogle(base);
for (const calendarId of (process.argv[3] ?? "primary").split(",")) google.addCalendar(calendarId);

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", base);
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks).toString("utf8");
  if (url.pathname.startsWith("/_fake/")) {
    const input = (body ? JSON.parse(body) : {}) as { calendarId?: string; id?: string; start?: string; event?: GoogleEvent };
    const calendarId = input.calendarId ?? "primary";
    const action = url.pathname.slice("/_fake/".length);
    if (action === "put" && input.event) google.put(calendarId, input.event);
    else if (action === "move" && input.id && input.start) google.move(calendarId, input.id, input.start);
    else if (action === "cancel" && input.id) google.cancel(calendarId, input.id);
    else if (action === "remove" && input.id) google.remove(calendarId, input.id);
    else if (action !== "events") { response.writeHead(400).end(); return; }
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(google.list()));
    return;
  }
  const headers = Object.fromEntries(Object.entries(request.headers).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const answer = await google.fetch(url.toString(), { method: request.method, headers, ...(body ? { body } : {}) });
  response.writeHead(answer.status, { "content-type": "application/json" }).end(await answer.text());
}).listen(port, "127.0.0.1", () => console.log(`fake Google Calendar on ${base}`));
