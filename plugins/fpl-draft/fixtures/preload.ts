/** QA only: load with NODE_OPTIONS=--import=<bundled preload.mjs> in a fresh bb. */
import { fakeFetch } from "./api";

const originalFetch = globalThis.fetch;
const fixtureFetch = fakeFetch({ urls: [] });
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (new URL(url).hostname === "draft.premierleague.com") {
    const response = await fixtureFetch(url, { headers: {}, signal: new AbortController().signal });
    return new Response(JSON.stringify(await response.json()), { status: response.status, headers: { "content-type": "application/json" } });
  }
  return originalFetch(input, init);
};
