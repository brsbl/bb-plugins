import { expect, it, vi } from "vitest";
import { PreviewProviders, ProviderRateLimited, type ProviderRead } from "./preview-providers.js";

const reply = (body: unknown, contentType = "application/json; charset=utf-8") =>
  vi.fn<ProviderRead>(async (url) => ({ url, body: Buffer.from(JSON.stringify(body)), contentType }));
const question = (extra: object = {}) => ({ items: [{ title: "Why is &quot;x&quot; &lt; y?", score: 1, answer_count: 12 }], quota_remaining: 299, ...extra });

it("reads npm package, scoped and exact-version links from the fixed registry endpoint", async () => {
  const providers = new PreviewProviders();
  const read = reply({ name: "react", version: "19.1.0", description: "  React is a\nlibrary.  " });
  expect(await providers.get(new URL("https://www.npmjs.com/package/react?activeTab=readme"), read)).toEqual({
    title: "react", description: "v19.1.0 · React is a library.", site: "npm", image: null,
  });
  await providers.get(new URL("https://npmjs.com/package/@types/node"), read);
  await providers.get(new URL("https://www.npmjs.com/package/%40types/node/v/22.0.0-beta.1"), read);
  await providers.get(new URL("https://www.npmjs.com/package/react/v/18.3.1"), read);
  expect(read.mock.calls.map(([url]) => url.href)).toEqual([
    "https://registry.npmjs.org/react/latest",
    "https://registry.npmjs.org/@types%2Fnode/latest",
    "https://registry.npmjs.org/@types%2Fnode/22.0.0-beta.1",
    "https://registry.npmjs.org/react/18.3.1",
  ]);
  expect(await providers.get(new URL("https://www.npmjs.com/package/left-pad"), reply({ name: "left-pad", version: "1.3.0" })))
    .toEqual({ title: "left-pad", description: "v1.3.0", site: "npm", image: null });
});

it("reads Stack Overflow full and short question links with decoded titles", async () => {
  const providers = new PreviewProviders();
  const read = reply(question());
  expect(await providers.get(new URL("https://stackoverflow.com/questions/11227809/why-is-x"), read)).toEqual({
    title: 'Why is "x" < y?', description: "1 vote · 12 answers", site: "Stack Overflow", image: null,
  });
  await providers.get(new URL("https://www.stackoverflow.com/q/11227809/123"), read);
  expect(read.mock.calls.map(([url]) => url.href)).toEqual([
    "https://api.stackexchange.com/2.3/questions/11227809?site=stackoverflow",
    "https://api.stackexchange.com/2.3/questions/11227809?site=stackoverflow",
  ]);
  expect(await providers.get(new URL("https://stackoverflow.com/q/1"), reply({ items: [], quota_remaining: 10 }))).toBeNull();
});

it("returns null without reading for links no provider owns or malformed IDs", async () => {
  const providers = new PreviewProviders();
  const read = reply({});
  for (const href of [
    "https://example.com/package/react",
    "http://www.npmjs.com/package/react",
    "https://www.npmjs.com:8443/package/react",
    "https://user:pass@www.npmjs.com/package/react",
    "https://registry.npmjs.org/react",
    "https://www.npmjs.com/search?q=react",
    "https://www.npmjs.com/package/",
    "https://www.npmjs.com/package/..",
    "https://www.npmjs.com/package/re%2Fact",
    "https://www.npmjs.com/package/%E0%A4%A",
    "https://www.npmjs.com/package/@types",
    "https://www.npmjs.com/package/react/v/latest",
    "https://www.npmjs.com/package/react/v/1.0.0/extra",
    "https://www.npmjs.com/package/react/versions",
    "https://stackoverflow.com/questions/tagged/javascript",
    "https://stackoverflow.com/questions/0",
    "https://stackoverflow.com/questions/12345678901",
    "https://stackoverflow.com/users/1/someone",
    "https://meta.stackoverflow.com/questions/1",
  ]) expect(await providers.get(new URL(href), read), href).toBeNull();
  expect(read).not.toHaveBeenCalled();
});

it("propagates transport failures and rejects non-JSON or malformed answers", async () => {
  const providers = new PreviewProviders();
  const url = new URL("https://www.npmjs.com/package/react");
  await expect(providers.get(url, async () => { throw new Error("403"); })).rejects.toThrow("403");
  await expect(providers.get(url, reply({ name: "react", version: "1.0.0" }, "text/html"))).rejects.toThrow();
  await expect(providers.get(url, reply({ name: "react" }))).rejects.toThrow();
  await expect(providers.get(url, reply({ name: "react" }))).rejects.not.toBeInstanceOf(ProviderRateLimited);
});

it("honors Stack Exchange backoff across different questions and leaves npm unaffected", async () => {
  let now = Date.UTC(2026, 9, 12, 12);
  const providers = new PreviewProviders(() => now);
  expect(await providers.get(new URL("https://stackoverflow.com/q/1"), reply(question({ backoff: 10 })))).not.toBeNull();
  const read = reply(question());
  const paused = providers.get(new URL("https://stackoverflow.com/questions/2"), read);
  await expect(paused).rejects.toBeInstanceOf(ProviderRateLimited);
  await expect(paused).rejects.toMatchObject({ retryAt: now + 10_000 });
  expect(await providers.get(new URL("https://www.npmjs.com/package/react"), reply({ name: "react", version: "1.0.0" }))).not.toBeNull();
  now += 9_999;
  await expect(providers.get(new URL("https://stackoverflow.com/q/3"), read)).rejects.toBeInstanceOf(ProviderRateLimited);
  expect(read).not.toHaveBeenCalled();
  now += 1;
  expect(await providers.get(new URL("https://stackoverflow.com/q/3"), read)).not.toBeNull();
  expect(read).toHaveBeenCalledTimes(1);
});

it("pauses Stack Exchange until the next UTC day once the quota is spent", async () => {
  let now = Date.UTC(2026, 9, 12, 23, 30);
  const providers = new PreviewProviders(() => now);
  expect(await providers.get(new URL("https://stackoverflow.com/q/1"), reply(question({ quota_remaining: 0 })))).not.toBeNull();
  const read = reply(question());
  await expect(providers.get(new URL("https://stackoverflow.com/q/2"), read)).rejects.toMatchObject({ retryAt: Date.UTC(2026, 9, 13) });
  now = Date.UTC(2026, 9, 13) - 1;
  await expect(providers.get(new URL("https://stackoverflow.com/q/2"), read)).rejects.toBeInstanceOf(ProviderRateLimited);
  now = Date.UTC(2026, 9, 13);
  expect(await providers.get(new URL("https://stackoverflow.com/q/2"), read)).not.toBeNull();
  expect(read).toHaveBeenCalledTimes(1);
});

it("keeps the longer of a backoff and a quota pause", async () => {
  const now = Date.UTC(2026, 9, 12, 23, 59, 50);
  const providers = new PreviewProviders(() => now);
  await providers.get(new URL("https://stackoverflow.com/q/1"), reply(question({ quota_remaining: 0, backoff: 60 })));
  await expect(providers.get(new URL("https://stackoverflow.com/q/2"), reply(question()))).rejects.toMatchObject({ retryAt: now + 60_000 });
});
