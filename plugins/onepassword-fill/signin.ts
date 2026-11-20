import { getDomain } from "tldts";
import { z } from "zod";
import type { FillField, TokenResult, VaultItem, VaultReader } from "./vault.js";

export const FILL_CODES = [
  "ok",
  "fills_disabled",
  "token_missing",
  "token_unsafe",
  "vault_unavailable",
  "vault_not_found",
  "item_not_found",
  "item_ambiguous",
  "field_missing",
  "page_not_found",
  "origin_mismatch",
  "browser_unavailable",
  "caller_not_allowed",
  "session_unavailable",
  "navigated",
  "element_not_found",
  "element_not_fillable",
  "fill_failed",
] as const;
export type SignInCode = (typeof FILL_CODES)[number];

const browserCodes = new Set<SignInCode>([
  "ok",
  "caller_not_allowed",
  "session_unavailable",
  "page_not_found",
  "origin_mismatch",
  "navigated",
  "element_not_found",
  "element_not_fillable",
  "fill_failed",
]);

export const HINTS: Record<Exclude<SignInCode, "ok">, string> = {
  fills_disabled:
    "Agent Sign-in is switched off. Ask the user to turn on “Let agents fill sign-ins” in Settings → Agent Sign-in.",
  token_missing:
    "No 1Password service account token is set up. Ask the user to finish the Agent Sign-in setup; never ask for the token in chat.",
  token_unsafe:
    "The token file must be a private file (mode 0600) owned by the bb user. Ask the user to recreate it with `bb secret request`.",
  vault_unavailable:
    "1Password could not be reached or rejected the service account. Try again later or ask the user to check the service account.",
  vault_not_found:
    "The service account cannot see the configured vault. Ask the user to grant it read access to that vault.",
  item_not_found:
    "No login with that name is in the vault. Ask the user to add it with the site's sign-in URL; never ask for the password or code.",
  item_ambiguous:
    "More than one login has that name. Ask the user to rename one of them.",
  field_missing:
    "The login has no such field. For otp, ask the user to save the site's authenticator secret in the item's one-time password field.",
  page_not_found:
    "No page with that name in the session. Navigate the named page to the sign-in form first.",
  origin_mismatch:
    "The page is not on HTTPS at a website saved on the login. Check the address; do not fill on other sites.",
  browser_unavailable:
    "This bb does not support private fills yet. Update bb.",
  caller_not_allowed: "Browser Automation refused the caller.",
  session_unavailable:
    "The browser session stopped or expired. Open a new session and sign in again.",
  navigated: "The page navigated during the fill. Take a snapshot and retry.",
  element_not_found:
    "No element matches that selector on the page. Take a snapshot and pass a CSS selector for the field.",
  element_not_fillable:
    "That element is not an enabled text or password field.",
  fill_failed: "The fill failed. Take a snapshot and retry once.",
};

export function siteOf(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:\/\//iu.test(url) ? url : `https://${url}`);
  } catch {
    return null;
  }
  if (!parsed.hostname) return null;
  const host = parsed.hostname.toLowerCase();
  return getDomain(host, { allowPrivateDomains: true }) ?? host;
}

/** The HTTPS origin to bind the fill to, when the page is on one of the item's sites. */
export function boundOrigin(pageUrl: string, websites: readonly string[]): string | null {
  let page: URL;
  try {
    page = new URL(pageUrl);
  } catch {
    return null;
  }
  if (page.protocol !== "https:") return null;
  const site = siteOf(page.href);
  if (site === null) return null;
  return websites.some((website) => siteOf(website) === site) ? page.origin : null;
}

const pagesOutput = z.object({ text: z.string(), exitCode: z.number() }).loose();
const pageListing = z.array(
  z.object({ name: z.string().nullable(), url: z.string() }).loose(),
);
const fillOutput = z.object({ code: z.string() }).loose();

export interface BrowserRpc {
  call(method: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface AuditEntry {
  threadId: string;
  item: string;
  field: FillField;
  origin: string | null;
  result: SignInCode;
}

export interface SignInDeps {
  enabled(): Promise<boolean>;
  vaultName(): Promise<string>;
  token(): Promise<TokenResult>;
  open(token: string): Promise<VaultReader>;
  browser: BrowserRpc;
  audit(entry: AuditEntry): void;
  now(): number;
  sleep(ms: number): Promise<void>;
}

export interface SignInRequest {
  threadId: string;
  sessionId: string;
  page: string;
  selector: string;
  item: string;
  field: FillField;
}

async function pageUrl(browser: BrowserRpc, request: SignInRequest): Promise<string | null> {
  const result = pagesOutput.safeParse(
    await browser.call("pages", { threadId: request.threadId, sessionId: request.sessionId }),
  );
  if (!result.success || result.data.exitCode !== 0) return null;
  let listing: unknown;
  try {
    listing = JSON.parse(result.data.text);
  } catch {
    return null;
  }
  const pages = pageListing.safeParse(listing);
  if (!pages.success) return null;
  return pages.data.find((entry) => entry.name === request.page)?.url ?? null;
}

function single(items: VaultItem[], title: string): VaultItem | SignInCode {
  const matches = items.filter((item) => item.title === title);
  if (matches.length === 0) return "item_not_found";
  if (matches.length > 1) return "item_ambiguous";
  return matches[0]!;
}

const totpPeriodMs = 30_000;
const totpMinimumRemainingMs = 5_000;

/**
 * Types one field of one login from the configured vault into a Browser
 * Automation page. The value stays in this function: it is handed to
 * Browser Automation's plugin-only fill RPC and never returned, logged, or
 * stored. Every outcome is a fixed code.
 */
export async function signIn(deps: SignInDeps, request: SignInRequest): Promise<SignInCode> {
  let origin: string | null = null;
  const finish = (result: SignInCode) => {
    deps.audit({
      threadId: request.threadId,
      item: request.item,
      field: request.field,
      origin,
      result,
    });
    return result;
  };
  try {
    if (!(await deps.enabled())) return finish("fills_disabled");
    let url: string | null;
    try {
      url = await pageUrl(deps.browser, request);
    } catch {
      return finish("session_unavailable");
    }
    if (url === null) return finish("page_not_found");
    try {
      origin = new URL(url).origin;
    } catch {
      return finish("origin_mismatch");
    }
    const token = await deps.token();
    if (!token.ok) return finish(token.code);
    const vaultName = await deps.vaultName();
    let reader: VaultReader;
    let vaultId: string;
    let item: VaultItem | SignInCode;
    try {
      reader = await deps.open(token.token);
      const vaults = (await reader.vaults()).filter((vault) => vault.title === vaultName);
      if (vaults.length !== 1) return finish("vault_not_found");
      vaultId = vaults[0]!.id;
      item = single(await reader.items(vaultId), request.item);
    } catch {
      return finish("vault_unavailable");
    }
    if (typeof item === "string") return finish(item);
    const expectedOrigin = boundOrigin(url, item.websites);
    if (expectedOrigin === null) return finish("origin_mismatch");
    if (request.field === "otp") {
      const remaining = totpPeriodMs - (deps.now() % totpPeriodMs);
      if (remaining < totpMinimumRemainingMs) await deps.sleep(remaining + 250);
    }
    let value: string | null;
    try {
      value = await reader.field(vaultId, item.id, request.field);
    } catch {
      return finish("vault_unavailable");
    }
    if (!value) return finish("field_missing");
    let filled: unknown;
    try {
      filled = await deps.browser.call("experimental_fill", {
        threadId: request.threadId,
        sessionId: request.sessionId,
        page: request.page,
        selector: request.selector,
        value,
        expectedOrigin,
      });
    } catch {
      return finish("browser_unavailable");
    }
    const code = fillOutput.safeParse(filled);
    if (!code.success || !browserCodes.has(code.data.code as SignInCode))
      return finish("fill_failed");
    return finish(code.data.code as SignInCode);
  } catch {
    return finish("fill_failed");
  }
}
