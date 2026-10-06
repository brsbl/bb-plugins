import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import type { Connection } from "./model.js";
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
  // Sites finish rendering their signed-in shell after the load event, and an
  // account-specific Gmail URL redirects first. Poll for a definite answer.
  const script = `const p = await browser.getPage("connection");
await p.goto(${JSON.stringify(accountUrl(connection.url))});
await p.snapshot();
const probe = () => {
  const host = location.hostname;
  const path = location.pathname;
  const signedOut = host === "accounts.google.com" || /\\/(login|checkpoint|uas\\/login|i\\/flow\\/login)/.test(path) || !!document.querySelector('input[type="password"]');
  const signedIn = host === "mail.google.com" ? !!document.querySelector('[role="navigation"], [gh="cm"]') || /@[^ ]+ - Gmail$/.test(document.title)
    : /(^|\\.)x.com$/.test(host) ? !!document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')
    : /(^|\\.)linkedin.com$/.test(host) ? !!document.querySelector('.global-nav__me, .global-nav__primary-link-me-menu-trigger') : false;
  const accountControl = host === "mail.google.com" ? document.querySelector('[aria-label^="Google Account:"]')
    : /(^|\\.)x.com$/.test(host) ? document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')
    : document.querySelector('.global-nav__me img');
  const accountText = accountControl?.getAttribute("aria-label") || accountControl?.getAttribute("alt") || accountControl?.textContent || "";
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/i;
  const accountName = host === "mail.google.com" ? (accountText.match(email) ?? document.title.match(email))?.[0]
    : /(^|\\.)x.com$/.test(host) ? accountText.match(/@[A-Za-z0-9_]+/)?.[0] : accountText;
  return { signedIn, signedOut, accountName: accountName?.trim().slice(0, 160) || null };
};
// A redirect can replace the document mid-probe; treat that as not settled.
const read = async () => { try { return await p.evaluate(probe); } catch { return { signedIn: false, signedOut: false, accountName: null }; } };
let status = await read();
for (let attempt = 0; attempt < 30 && !status.signedOut && !(status.signedIn && status.accountName); attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  status = await read();
}
console.log("DIGEST_CONNECTION:" + JSON.stringify(status));`;
  const output = await browserRpc(bb, "run", { threadId: lease.threadId, sessionId: lease.sessionId, script, timeoutMs: 45000 }, z.object({ text: z.string(), exitCode: z.number() }).passthrough());
  const marker = output.text.match(/DIGEST_CONNECTION:(\{[^\n]*\})/);
  let status: { signedIn: boolean; signedOut: boolean; accountName?: string | null } | undefined;
  try { if (marker) status = z.object({ signedIn: z.boolean(), signedOut: z.boolean(), accountName: z.string().max(160).nullable().optional() }).parse(JSON.parse(marker[1]!)); } catch { /* Invalid probe output is an unavailable connection. */ }
  if (output.exitCode !== 0 || !status) throw new ConnectionError(`Could not check ${connection.name}. Retry when the site is available.`, "unavailable", "retry");
  const expected = expectedAccount(connection.url);
  if (status.signedOut) throw new ConnectionError(expected
    ? `${connection.name} isn’t signed in as ${expected}. Sign in to ${expected} in the bb browser, then Retry.`
    : `${connection.name} is signed out. Reconnect it in the bb browser, then Retry.`, "signed-out", "reconnect");
  if (!status.signedIn) throw new ConnectionError(`${connection.name} needs your attention. Open the connection to complete any sign-in or browser challenge, then Retry.`, "expired", "reconnect");
  const accountName = status.accountName ?? null;
  // Never read a different account than the connection names.
  if (expected && accountName && accountName.toLowerCase() !== expected) {
    throw new ConnectionError(`Signed in as ${accountName}, expected ${expected}. Switch ${connection.name} to ${expected} in the bb browser, then Retry.`, "expired", "reconnect", accountName);
  }
  return accountName;
}
