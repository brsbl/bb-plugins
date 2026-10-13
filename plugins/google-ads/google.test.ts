import { afterEach, describe, expect, it, vi } from "vitest";
import { createGoogleClient, createPkce, authUrl, callbackCode, MAX_ROWS, REDIRECT_URI } from "./google.js";
import { fakeCredentials, fakeFetch } from "./fake-google.js";
import { conversionActions, range, report } from "./reports.js";

afterEach(() => vi.useRealTimers());
describe("read-only transport", () => {
  it("refreshes OAuth and sends only authorized read endpoints with manager headers", async () => {
    const fetcher = vi.fn(fakeFetch);
    const client = createGoogleClient(async () => fakeCredentials, fetcher);
    await client.accounts();
    await client.search(fakeCredentials.customerId, "SELECT campaign.id FROM campaign");
    const calls = fetcher.mock.calls;
    expect(calls.map(([url]) => new URL(String(url)).pathname)).toEqual(["/token", "/v25/customers:listAccessibleCustomers", "/v25/customers/0000000001/googleAds:search"]);
    expect(calls[1][1]?.headers).not.toHaveProperty("login-customer-id");
    expect(calls[2][1]?.headers).toHaveProperty("login-customer-id", fakeCredentials.loginCustomerId);
    await expect(client.search(fakeCredentials.customerId, "MUTATE campaign")).rejects.toThrow("SELECT");
    expect(calls[0][1]?.body).toContain("grant_type=refresh_token");
    expect(calls[2][1]?.redirect).toBe("error");
  });
  it("follows pagination and refuses truncated/repeating reports", async () => {
    const fetcher = vi.fn(async (url, init) => String(url).endsWith("/token") ? fakeFetch(url, init) : Response.json(JSON.parse(String(init?.body)).pageToken ? { results: [{ second: true }] } : { results: [{ first: true }], nextPageToken: "next" })) as typeof fetch;
    const client = createGoogleClient(async () => fakeCredentials, fetcher);
    expect(await client.search(fakeCredentials.customerId, "SELECT campaign.id FROM campaign")).toHaveLength(2);
    const repeat = createGoogleClient(async () => fakeCredentials, async (url, init) => String(url).endsWith("/token") ? fakeFetch(url, init) : Response.json({ results: [], nextPageToken: "same" }));
    await expect(repeat.search(fakeCredentials.customerId, "SELECT campaign.id FROM campaign")).rejects.toThrow("no partial");
    const huge = createGoogleClient(async () => fakeCredentials, async (url, init) => String(url).endsWith("/token") ? fakeFetch(url, init) : Response.json({ results: Array(MAX_ROWS + 1).fill({}) }));
    await expect(huge.search(fakeCredentials.customerId, "SELECT campaign.id FROM campaign")).rejects.toThrow("read limit");
  });
  it("retries one 401, redacts remote failures, and clears cached credentials", async () => {
    let reads = 0, tokens = 0;
    const client = createGoogleClient(async () => fakeCredentials, async (url, init) => {
      if (String(url).endsWith("/token")) { tokens++; return fakeFetch(url, init); }
      if (++reads === 1) return Response.json({ secret: "DO-NOT-EXPOSE" }, { status: 401 });
      return fakeFetch(url, init);
    });
    await client.accounts(); expect(tokens).toBe(2); client.clear(); await client.accounts(); expect(tokens).toBe(3);
    for (const status of [400, 403, 429, 500]) {
      const bad = createGoogleClient(async () => fakeCredentials, async () => Response.json({ error: "DO-NOT-EXPOSE" }, { status }));
      await expect(bad.accounts()).rejects.toThrow(`HTTP ${status}`);
      await expect(bad.accounts()).rejects.not.toThrow("DO-NOT-EXPOSE");
    }
  });
});
describe("OAuth", () => {
  it("uses offline PKCE and strictly binds the callback, state and expiry", () => {
    const p = createPkce(), url = new URL(authUrl("fake-client", p));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("access_type")).toBe("offline");
    const callback = `${REDIRECT_URI}?state=${p.state}&code=fake-code`;
    expect(callbackCode(callback, p)).toBe("fake-code");
    expect(() => callbackCode(`${REDIRECT_URI}?code=fake-code`, p)).toThrow();
    expect(() => callbackCode(callback.replace("127.0.0.1", "evil.example"), p)).toThrow();
    expect(() => callbackCode(callback, { ...p, expiresAt: 0 })).toThrow();
  });
});
describe("weekly reads", () => {
  it("resolves completed days in the account timezone, including DST", () => {
    expect(range({ last7Days: true }, "America/Los_Angeles", new Date("2026-03-09T01:00:00Z"))).toEqual({ from: "2026-03-01", to: "2026-03-07" });
    expect(() => range({ from: "2026-02-30", to: "2026-03-01" }, "UTC")).toThrow();
    expect(() => range({ last7Days: true, from: "2026-01-01" }, "UTC")).toThrow();
    expect(() => conversionActions("3' OR 1=1")).toThrow();
  });
  it.each(["campaign", "ad-group", "ad", "keyword", "search-term"] as const)("joins only selected conversions at %s level without duplicating cost", async level => {
    const fetcher = vi.fn(fakeFetch), client = createGoogleClient(async () => fakeCredentials, fetcher);
    const result = await report(client, fakeCredentials, { level, last7Days: true, limit: 100 });
    expect(result.rows[0].metrics).toMatchObject({ clicks: 40, impressions: 1000, cost: 20, averageCpc: .5, ctr: .04, conversions: 4 });
    const queries = fetcher.mock.calls.filter(([, init]) => String(init?.body).includes('"query"')).map(([, init]) => JSON.parse(String(init?.body)).query);
    const conversionQuery = queries.find(q => q.includes("metrics.all_conversions"));
    expect(conversionQuery).toContain("segments.conversion_action IN ('customers/0000000001/conversionActions/3')");
    expect(conversionQuery).not.toContain("metrics.clicks");
    expect(conversionQuery).not.toContain("metrics.cost_micros");
  });
  it("does not guess which goal is a download", async () => {
    const client = createGoogleClient(async () => fakeCredentials, fakeFetch);
    const result = await report(client, { ...fakeCredentials, downloadConversionActions: undefined }, { level: "ad", last7Days: true, limit: 100 });
    expect(result.rows[0].metrics.conversions).toBeNull(); expect(result.warnings).toHaveLength(1);
  });
  it("retains conversion-only entities, aggregates actions, and reports output truncation", async () => {
    const client = createGoogleClient(async () => fakeCredentials, async (url, init) => {
      const q = String(init?.body);
      if (q.includes("metrics.all_conversions")) return Response.json({ results: [
        { campaign: { id: "10" }, metrics: { allConversions: 1.5 } }, { campaign: { id: "10" }, metrics: { allConversions: 2 } },
        { campaign: { id: "11" }, metrics: { allConversions: 3 } },
      ] });
      return fakeFetch(url, init);
    });
    const full = await report(client, fakeCredentials, { level: "campaign", last7Days: true, limit: 100 });
    expect(full.rows[0].metrics.conversions).toBe(3.5);
    expect(full.rows[1].metrics).toMatchObject({ clicks: 0, cost: 0, conversions: 3, ctr: null, averageCpc: null });
    const short = await report(client, fakeCredentials, { level: "campaign", last7Days: true, limit: 1 });
    expect(short).toMatchObject({ truncated: true, totalRows: 2 });
  });
});
