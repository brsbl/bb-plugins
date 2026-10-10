import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import type { Connection } from "./model.js";
import { SIGN_IN_PROBE, type SignInPage } from "./signin.js";
import { accountUrl, expectedAccount } from "./sites.js";

export class ConnectionError extends Error {
  constructor(message: string, readonly status: Connection["status"], readonly recovery: "retry" | "reconnect" | "upgrade", readonly accountName: string | null = null) {
    super(message);
  }
}

export interface BrowserLease {
  hostId: string;
  instanceId: string;
  generation: string;
  threadId: string;
  tabId: string;
  sessionId: string;
  connectionId: string;
}

export async function browserRpc<T>(bb: BbPluginApi, method: string, input: Record<string, string | number | object>, outputSchema: z.ZodType<T>): Promise<T> {
  return bb.sdk.plugins.callRpc({ pluginId: "browser-automation", method, input: JSON.parse(JSON.stringify(input)), outputSchema });
}

export async function closeBrowser(bb: BbPluginApi, lease: BrowserLease): Promise<void> {
  try {
    await browserRpc(bb, "close", { threadId: lease.threadId, sessionId: lease.sessionId }, z.unknown());
  } finally {
    const { hostId, instanceId, generation, threadId, tabId } = lease;
    await bb.sdk.experimental_desktopBrowsers.closeTab({ hostId, instanceId, generation, threadId, tabId });
  }
}

export async function connectionScope(bb: BbPluginApi, connection: Connection, threadId: string) {
  if (!connection.browserHostId) throw new ConnectionError("Choose the computer running your signed-in bb browser in this connection, then Retry.", "unavailable", "retry");
  const { instances } = await bb.sdk.experimental_desktopBrowsers.listInstances({ hostId: connection.browserHostId });
  // Window IDs change when bb restarts. Honor a live selection, otherwise
  // recover only when the configured computer has one unambiguous window.
  const instance = instances.find((entry) => entry.instanceId === connection.desktopInstanceId)
    ?? (instances.length === 1 ? instances[0] : undefined);
  if (!instance) throw new ConnectionError(instances.length === 0
    ? "The bb browser is unavailable. Open bb on your browser computer, then Retry."
    : "Choose the bb browser window for this connection, then Retry.", "unavailable", "retry");
  return { hostId: connection.browserHostId, instanceId: instance.instanceId, generation: instance.generation, threadId };
}

/** Only a fresh tab owned by this issue. Never borrows the user's open tabs. */
export async function openBrowser(bb: BbPluginApi, connection: Connection, threadId: string): Promise<BrowserLease> {
  const scope = await connectionScope(bb, connection, threadId);
  const created = await bb.sdk.experimental_desktopBrowsers.createTab({ ...scope, url: "about:blank", presentation: "hidden" });
  // The older public API returns a profile on every tab and creates a new,
  // empty automation partition. Do not import cookies or bypass its boundary.
  if (Object.hasOwn(created.tab, "profile")) {
    await bb.sdk.experimental_desktopBrowsers.closeTab({ ...scope, tabId: created.tab.tabId });
    throw new ConnectionError("Update bb to 0.45 or later on the desktop and server, then Retry. This version cannot open a fresh tab with your existing sign-in.", "upgrade-required", "upgrade");
  }
  try {
    const opened = await browserRpc(bb, "open", {
      threadId,
      selection: { backend: "desktop", hostId: scope.hostId, instanceId: scope.instanceId, tabId: created.tab.tabId },
    }, z.object({ id: z.string() }).passthrough());
    return { ...scope, tabId: created.tab.tabId, sessionId: opened.id, connectionId: connection.id };
  } catch (error) {
    await bb.sdk.experimental_desktopBrowsers.closeTab({ ...scope, tabId: created.tab.tabId });
    throw error;
  }
}

/** Inspect only the page's sign-in controls; never export cookies or page content. */
export async function checkSignIn(bb: BbPluginApi, connection: Connection, lease: BrowserLease): Promise<string | null> {
  // Sites finish rendering their signed-in shell after the load event and may
  // redirect first. Poll until the page is signed in with a readable account,
  // or a sign-in, authwall or challenge page holds for two reads in a row.
  const script = `const p = await browser.getPage("connection");
await p.goto(${JSON.stringify(accountUrl(connection.url))});
await p.snapshot();
const probe = () => (${SIGN_IN_PROBE})(location, document);
// A redirect can replace the document mid-probe; treat that as not settled.
const read = async () => { try { return await p.evaluate(probe); } catch { return { page: null, accountName: null }; } };
let status = await read();
let previous = null;
for (let attempt = 0; attempt < 40 && !(status.page === "signed-in" && status.accountName) && !(status.page && status.page !== "signed-in" && status.page === previous); attempt++) {
  previous = status.page;
  await new Promise((resolve) => setTimeout(resolve, 500));
  status = await read();
}
console.log("DIGEST_CONNECTION:" + JSON.stringify(status));`;
  const output = await browserRpc(bb, "run", { threadId: lease.threadId, sessionId: lease.sessionId, script, timeoutMs: 45000 }, z.object({ text: z.string(), exitCode: z.number() }).passthrough());
  const marker = output.text.match(/DIGEST_CONNECTION:(\{[^\n]*\})/);
  let status: { page: SignInPage; accountName?: string | null } | undefined;
  try { if (marker) status = z.object({ page: z.enum(["signed-in", "login", "authwall", "challenge"]).nullable(), accountName: z.string().max(160).nullable().optional() }).parse(JSON.parse(marker[1]!)); } catch { /* Invalid probe output is an unavailable connection. */ }
  if (output.exitCode !== 0 || !status) throw new ConnectionError(`Could not check ${connection.name}. Retry when the site is available.`, "unavailable", "retry");
  const expected = expectedAccount(connection.url);
  if (status.page === "login" || status.page === "authwall") {
    const shown = status.page === "login" ? "its sign-in page" : "its sign-in wall";
    throw new ConnectionError(expected
      ? `${connection.name} isn’t signed in as ${expected} (it showed ${shown}). Sign in to ${expected} in the bb browser, then Retry.`
      : `${connection.name} is signed out (it showed ${shown}). Reconnect it in the bb browser, then Retry.`, "signed-out", "reconnect");
  }
  if (status.page === "challenge") throw new ConnectionError(`${connection.name} needs your attention: it showed a security check. Open the connection, complete the check, then Retry.`, "expired", "reconnect");
  if (status.page !== "signed-in") throw new ConnectionError(`Couldn’t confirm ${connection.name} is signed in because the page didn’t finish loading. Retry when the site is available.`, "unavailable", "retry");
  const accountName = status.accountName ?? null;
  // Never read a different account than the connection names.
  if (expected && accountName && accountName.toLowerCase() !== expected) {
    throw new ConnectionError(`Signed in as ${accountName}, expected ${expected}. Switch ${connection.name} to ${expected} in the bb browser, then Retry.`, "expired", "reconnect", accountName);
  }
  return accountName;
}
