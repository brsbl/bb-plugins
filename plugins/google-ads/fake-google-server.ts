// Run only for an isolated development app. No real credentials or account data.
import { createServer } from "node:http";
import { fakeResponse } from "./fake-google.js";
const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/auth") {
    const redirect = new URL(url.searchParams.get("redirect_uri")!);
    redirect.searchParams.set("state", url.searchParams.get("state")!); redirect.searchParams.set("code", "fake-code");
    res.writeHead(200, { "content-type": "text/html" });
    res.end(`<h1>Mock Google sign-in</h1><p>Synthetic data only. Paste this address into Google Ads in bb:</p><code>${redirect.href.replaceAll('&','&amp;')}</code>`); return;
  }
  try {
    let body = ""; for await (const chunk of req) body += chunk;
    const result = fakeResponse(url.pathname, url.pathname === "/token" ? {} : JSON.parse(body || "{}"));
    res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(result));
  } catch { res.writeHead(400); res.end('{}'); }
});
server.listen(Number(process.env.PORT ?? 53684), "127.0.0.1");
