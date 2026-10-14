import { createServer } from "node:http";
import { createFakeSlack } from "./fake-slack.js";
const slack = createFakeSlack();
const port = Number(process.argv[2] ?? 47821);
createServer(async (request, response) => {
  const path = new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname;
  if (path === "/_fake/posts") { response.setHeader("content-type", "application/json"); response.end(JSON.stringify(slack.posts)); return; }
  const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(chunk as Buffer);
  const answer = await slack.fetch(`http://127.0.0.1:${port}${path}`, { method: request.method, body: Buffer.concat(chunks).toString("utf8") });
  response.writeHead(answer.status, Object.fromEntries(answer.headers)); response.end(await answer.text());
}).listen(port, "127.0.0.1", () => console.log(`Fake Slack listening on 127.0.0.1:${port}`));
