import { parseEnv } from "node:util";
import { cliCommand, defineCli, PluginCliError, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { AdsError, authUrl, callbackCode, createGoogleClient, createPkce, customerId, devEndpoints, type Credentials } from "./google.js";
import { conversionActions, inventories, report, type Level } from "./reports.js";
import { decisionCard, proposalSchema, rpcContract } from "./contract.js";

const json = { type: "boolean" as const, description: "Output JSON (also the default)" };
const limit = { type: "integer" as const, min: 1, max: 1000, default: 500, description: "Maximum output rows (1–1000); truncation is explicit" };
const dateOptions = { json, limit,
  from: { type: "string" as const, description: "Inclusive start date YYYY-MM-DD" },
  to: { type: "string" as const, description: "Inclusive end date YYYY-MM-DD" },
  "last-7-days": { type: "boolean" as const, description: "Seven completed days in the Ads account time zone" },
  "campaign-id": { type: "string" as const, description: "Restrict to one campaign" },
  "conversion-actions": { type: "string" as const, description: "Comma-separated download conversion-action resource names; overrides settings" },
};
function output(value: unknown) {
  const stdout = JSON.stringify(value);
  if (Buffer.byteLength(stdout) > 900_000) throw new AdsError("too_large", "Output exceeds the limit. Reduce --limit or narrow the report.");
  return { exitCode: 0, stdout };
}
async function guard(run: () => Promise<unknown>) {
  try { return output(await run()); }
  catch (e) { throw new PluginCliError(e instanceof AdsError ? e.message : e instanceof z.ZodError ? "Invalid input. Check the command help and proposal schema." : "Google Ads could not complete the request.", { code: e instanceof AdsError ? e.code : "failed" }); }
}
export default function plugin(bb: BbPluginApi): void {
  const settings = bb.settings.define({
    developerToken: { type: "string", label: "Developer token", secret: true },
    loginCustomerId: { type: "string", label: "Manager login customer ID (optional)", secret: true },
    customerId: { type: "string", label: "Advertising customer ID", secret: true },
    clientId: { type: "string", label: "Google OAuth client ID", description: "Desktop app client with the Google Ads API enabled", secret: true },
    clientSecret: { type: "string", label: "Google OAuth client secret", secret: true },
    refreshToken: { type: "string", label: "Google refresh token", description: "Set by Connect", secret: true },
    downloadConversionActions: { type: "string", label: "Download-button conversion actions", description: "Comma-separated resource names from bb google-ads conversion-actions --json", secret: true },
  });
  const credentials = async (): Promise<Credentials> => {
    const values = await settings.get();
    return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() || undefined : undefined]));
  };
  const urls = devEndpoints(process.env.BB_GOOGLE_ADS_FAKE_URL);
  const client = createGoogleClient(credentials, (...args) => globalThis.fetch(...args), urls);
  let pending: ReturnType<typeof createPkce> | undefined;
  let connectionRevision = 0;
  settings.onChange(() => { client.clear(); pending = undefined; connectionRevision++; });
  bb.onDispose(() => { client.clear(); pending = undefined; connectionRevision++; });
  const status = async () => {
    const c = await credentials();
    return { configured: !!(c.developerToken && c.clientId && c.clientSecret), connected: !!c.refreshToken, customerSelected: !!c.customerId, downloadsSelected: !!c.downloadConversionActions, readOnly: true as const };
  };
  bb.rpc.register(rpcContract, {
    status,
    async connectStart() {
      const c = await credentials();
      if (!c.clientId || !c.clientSecret || !c.developerToken) throw new AdsError("configuration", "Save the developer token and OAuth client in Google Ads settings first.");
      connectionRevision++;
      pending = createPkce();
      return { authUrl: authUrl(c.clientId, pending, urls) };
    },
    async connectFinish({ redirectUrl }) {
      const attempt = pending;
      if (!attempt) throw new AdsError("oauth", "Connect again to start a new sign-in.");
      const code = callbackCode(redirectUrl, attempt);
      pending = undefined;
      const revision = connectionRevision;
      const refreshToken = await client.exchange(code, attempt.verifier);
      if (revision !== connectionRevision) throw new AdsError("oauth", "Connection settings changed. Connect again.");
      await settings.experimental_set({ refreshToken });
      return status();
    },
    async disconnect() { connectionRevision++; pending = undefined; client.clear(); await settings.experimental_set({ refreshToken: null }); return status(); },
  });
  const listCommands = Object.fromEntries(Object.entries(inventories).filter(([name]) => name !== "accounts").map(([name, query]) => [name, cliCommand({
    summary: name === "ads" ? "List ads with RSA headlines, descriptions, pinning and final URLs" : `List ${name}`,
    options: { json, limit },
    run: ({ options }, ctx) => guard(async () => {
      const rows = await client.search(customerId((await credentials()).customerId), `${query} LIMIT ${options.limit + 1}`, ctx.signal);
      return { rows: rows.slice(0, options.limit), truncated: rows.length > options.limit };
    }),
  })]));
  bb.cli.register(defineCli({ name: "google-ads", summary: "Read Google Ads and prepare manual decisions; never change an account", commands: {
    ...listCommands,
    status: cliCommand({ summary: "Show connection readiness without secrets", options: { json }, run: () => guard(status) }),
    connect: cliCommand({ summary: "Open the secure Google sign-in page in bb", options: { json }, run: () => guard(async () => ({ ...(await status()), path: "/plugins/google-ads/google-ads", next: "Open Google Ads in bb. Save credentials through secret settings or bb's secrets flow, then Connect Google Ads. Paste the returned address only in that form, never in chat." })) }),
    configure: cliCommand({ summary: "Import credentials from a secrets-flow dotenv file on the invoking host", options: {
      json, "env-file": { type: "string", required: true, description: "Absolute path written by bb secret request" },
      machine: { type: "string", description: "Host ID (required outside a thread)" },
    }, run: ({ options }, ctx) => guard(async () => {
      if (!options["env-file"].startsWith("/")) throw new AdsError("input", "Use an absolute --env-file path.");
      let hostId = options.machine;
      if (!hostId && ctx.threadId) {
        const thread = await bb.sdk.threads.get({ threadId: ctx.threadId });
        if (thread.environmentId) hostId = (await bb.sdk.environments.get({ environmentId: thread.environmentId })).hostId ?? undefined;
      }
      if (!hostId) throw new AdsError("input", "Specify --machine with the host ID containing the secret file.");
      const file = await bb.sdk.files.read({ path: options["env-file"], hostId });
      if (file.contentEncoding === "base64" || Buffer.byteLength(file.content) > 16_384) throw new AdsError("input", "Use a small UTF-8 dotenv file from bb secret request.");
      const env = parseEnv(file.content);
      const fields = { GOOGLE_ADS_DEVELOPER_TOKEN: "developerToken", GOOGLE_ADS_CLIENT_ID: "clientId", GOOGLE_ADS_CLIENT_SECRET: "clientSecret", GOOGLE_ADS_CUSTOMER_ID: "customerId", GOOGLE_ADS_LOGIN_CUSTOMER_ID: "loginCustomerId", GOOGLE_ADS_DOWNLOAD_ACTIONS: "downloadConversionActions" } as const;
      const values: Record<string, string> = {};
      for (const [key, field] of Object.entries(fields)) if (env[key]?.trim()) values[field] = env[key].trim();
      if (!Object.keys(values).length) throw new AdsError("input", "No Google Ads settings found in the file.");
      if (values.customerId) customerId(values.customerId);
      if (values.loginCustomerId) customerId(values.loginCustomerId);
      if (values.downloadConversionActions) conversionActions(values.downloadConversionActions);
      await settings.experimental_set(values);
      return { saved: Object.keys(values), next: "Connect Google Ads in bb. Remove the temporary dotenv file after import." };
    }) }),
    accounts: cliCommand({ summary: "List directly accessible accounts, or manager clients with --manager", options: { json, limit, manager: { type: "boolean", description: "List clients under the configured login customer ID" } },
      run: ({ options }, ctx) => guard(async () => {
        if (!options.manager) return client.accounts(ctx.signal);
        const rows = await client.search(customerId((await credentials()).loginCustomerId), `${inventories.accounts} LIMIT ${options.limit + 1}`, ctx.signal);
        return { rows: rows.slice(0, options.limit), truncated: rows.length > options.limit, note: "Manager client hierarchy; use an advertising customer ID for reports." };
      }) }),
    report: cliCommand({ summary: "Read traffic, cost and download-button conversions", options: { ...dateOptions, by: { type: "enum", values: ["campaign", "ad-group", "ad", "keyword"], default: "campaign", description: "Report grouping" } },
      run: ({ options }, ctx) => guard(async () => report(client, await credentials(), { level: options.by as Level, from: options.from, to: options.to, last7Days: options["last-7-days"], campaignId: options["campaign-id"], actions: options["conversion-actions"], limit: options.limit }, ctx.signal)) }),
    "search-terms": cliCommand({ summary: "Read reported search terms with traffic, cost and download conversions", options: dateOptions,
      run: ({ options }, ctx) => guard(async () => report(client, await credentials(), { level: "search-term", from: options.from, to: options.to, last7Days: options["last-7-days"], campaignId: options["campaign-id"], actions: options["conversion-actions"], limit: options.limit }, ctx.signal)) }),
    propose: cliCommand({ summary: "Create an Inline Decisions card; approval means a manual change by brsbl", positionals: [{ name: "id", required: true, description: "Unique card ID in this thread" }], options: {
      json, proposal: { type: "string", required: true, stdin: true, description: "JSON brief: title, what, whyNow, options (2+), recommendation, next. Prefer --proposal-stdin" },
    }, run: ({ options, positionals }, ctx) => guard(async () => {
      if (!ctx.threadId) throw new AdsError("thread", "Run propose from the thread that should own the decision.");
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(positionals.id)) throw new AdsError("input", "Use a short card ID with letters, digits, underscores or hyphens.");
      let raw: unknown; try { raw = JSON.parse(options.proposal); } catch { throw new AdsError("input", "Proposal must be JSON."); }
      const content = decisionCard(proposalSchema.parse(raw));
      try { await bb.sdk.plugins.callRpc({ pluginId: "inline-action-cards", method: "create", input: { threadId: ctx.threadId, id: positionals.id, content }, outputSchema: z.object({ id: z.string() }).passthrough(), signal: ctx.signal }); }
      catch { throw new AdsError("decision", "Could not create the card. Install the current Inline Decisions plugin and use a new card ID if this one already exists."); }
      return { directive: `::action{id="${positionals.id}"}`, applied: false, next: "Emit the directive. Approval records a manual decision only; brsbl makes the change in Google Ads." };
    }) }),
  } }));
}
