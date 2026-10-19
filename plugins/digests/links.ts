import { getDomain, parse } from "tldts";

import type { Brief, Source } from "./model.js";

/**
 * Task-link checks for brief buttons. A button that opens Gmail is the email button and is
 * never rewritten. Any other button is a task button: it must come from an authenticated
 * sender, stay on that sender's organization, and open a plain page that does nothing on load.
 */

export type KnownService = { name: string; domains: readonly string[]; startUrl: string };
export type TaskLinkSender = { from?: string; signedBy?: string };
export type TaskLinkResult = { ok: true } | { ok: false; reason: string };

/** Sender registrable domain -> the service's own domains and a safe start page. */
export const KNOWN_SERVICES: Readonly<Record<string, KnownService>> = {
  "mercury.com": { name: "Mercury", domains: ["mercury.com"], startUrl: "https://app.mercury.com/" },
  "guardianlife.com": { name: "Guardian", domains: ["guardianlife.com", "guardiananytime.com"], startUrl: "https://www.guardiananytime.com/" },
  "taxact.com": { name: "TaxAct", domains: ["taxact.com"], startUrl: "https://www.taxact.com/" },
};

/** Hosts (and their subdomains) where anyone can publish a page. */
const USER_CONTENT_HOSTS = [
  "sites.google.com", "docs.google.com", "drive.google.com", "forms.gle", "goo.gl", "storage.googleapis.com",
  "notion.site", "github.io", "blogspot.com", "wordpress.com", "s3.amazonaws.com", "cloudfront.net",
  "web.app", "firebaseapp.com", "vercel.app", "netlify.app", "herokuapp.com", "bit.ly", "t.co", "tinyurl.com",
];
/** Query parameters that carry a next hop. */
const REDIRECT_PARAMS = [
  "url", "q", "redirect", "redirect_uri", "next", "continue", "return", "returnto", "dest", "destination", "target", "goto", "r", "u",
];
/** Email service click-tracking domains (and their subdomains). */
const TRACKING_DOMAINS = [
  "sendgrid.net", "list-manage.com", "mcsv.net", "hubspotlinks.com", "hubspotemail.net", "mandrillapp.com",
  "mailgun.org", "sparkpostmail.com", "exacttarget.com", "rs6.net", "awstrack.me",
];
/** First host labels that mark a click-tracking subdomain on any domain. */
const TRACKING_HOST_LABELS = ["click", "clicks", "links", "email", "trk", "track"];
/** Path segment sequences used by click redirectors. */
const TRACKING_PATHS = ["/ls/click", "/wf/click", "/track/click", "/c/", "/e/click", "/click"];
/** Words in a path or query that suggest the page acts as soon as it opens. */
const ACTION_WORDS = [
  "unsubscribe", "opt-out", "optout", "confirm", "verify", "accept", "decline", "approve", "rsvp", "one-click", "oneclick", "magic", "activate",
];
/** Query parameters that carry a credential or signed request. */
const SECRET_PARAMS = ["token", "auth", "otp", "code", "key", "sig", "signature", "jwt", "nonce", "upn"];
/** Words a task button label must not use: they read as confirming something. */
const BANNED_LABEL_WORDS = ["read", "open", "confirm", "approve", "accept", "yes", "done", "paid", "it was me", "unsubscribe", "verify"];

const MAX_QUERY_LENGTH = 256;
const bannedLabel = new RegExp(`\\b(?:${BANNED_LABEL_WORDS.map((word) => word.replace(/ /gu, "\\s+")).join("|")})\\b`, "iu");

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function onHost(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Registrable domain (eTLD+1, private suffixes included), or null for IPs and bare suffixes. */
export function registrableDomain(host: string): string | null {
  const clean = host.trim().toLowerCase().replace(/\.$/u, "");
  if (!clean) return null;
  return getDomain(clean, { allowPrivateDomains: true }) ?? null;
}

/** The email button: any link into Gmail. */
export function isEmailUrl(url: string): boolean {
  return parseUrl(url)?.hostname === "mail.google.com";
}

/** What the renderer shows beside a task button: the registrable domain, and the full host for its title. */
export function linkDomain(url: string): { domain: string; host: string } | null {
  const parsed = parseUrl(url);
  if (!parsed?.hostname) return null;
  const host = parsed.hostname.toLowerCase();
  return { domain: registrableDomain(host) ?? host, host };
}

function senderDomain(from: string | undefined): string | null {
  if (!from) return null;
  const address = from.match(/<([^<>]+)>\s*$/u)?.[1] ?? from;
  const at = address.lastIndexOf("@");
  if (at < 0) return null;
  return registrableDomain(address.slice(at + 1).trim());
}

function knownDomain(domain: string): boolean {
  return Object.values(KNOWN_SERVICES).some((service) => service.domains.includes(domain));
}

function looksLikeUrlOrHost(value: string): boolean {
  if (value.includes("://")) return true;
  const host = value.replace(/^\/+/u, "").split(/[/?#:]/u)[0] ?? "";
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.?$/iu.test(host)) return false;
  const result = parse(host, { allowPrivateDomains: true });
  return result.isIp === true || (!!result.domain && (result.isIcann === true || result.isPrivate === true));
}

/** A decoded path segment or query value that could steer the page to another host. */
function nextHop(value: string): boolean {
  if (value.includes("\\") || value.includes("@")) return true;
  for (const char of value) {
    const code = char.codePointAt(0)!;
    // Control, whitespace and non-ASCII characters can hide a host from simple checks.
    if (code <= 0x20 || code >= 0x7f) return true;
  }
  try {
    return new URL(value, "https://placeholder.invalid/").hostname !== "placeholder.invalid";
  } catch {
    return value !== "" && (value.includes("/") || value.includes("\\"));
  }
}

function decode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/** Checks one task button against every rule; returns the first failure. */
export function checkTaskLink(url: string, label: string, sender: TaskLinkSender): TaskLinkResult {
  const fail = (reason: string): TaskLinkResult => ({ ok: false, reason });
  const parsed = parseUrl(url);
  if (!parsed) return fail("not a valid URL");

  // Plain HTTPS.
  if (parsed.protocol !== "https:") return fail("not HTTPS");
  if (parsed.port) return fail("uses a non-default port");
  if (parsed.username || parsed.password) return fail("carries a username or password");
  // Single-page apps route and act on the fragment, which these checks can't see.
  if (parsed.hash) return fail("has a #fragment");
  const host = parsed.hostname.toLowerCase().replace(/\.$/u, "");
  if (host.startsWith("[") || /^\d+(?:\.\d+){3}$/u.test(host)) return fail("uses an IP address");
  const domain = registrableDomain(host);
  if (!domain) return fail("has no registrable domain");
  if (host.split(".").some((part) => part.startsWith("xn--")) && !knownDomain(domain)) return fail("uses a punycode (xn--) host");

  // Not a tracking redirect.
  if (TRACKING_DOMAINS.some((tracker) => onHost(host, tracker))) return fail("is an email click-tracking link");
  if (TRACKING_HOST_LABELS.includes(host.split(".")[0]!) && host !== domain) return fail("is on a click-tracking subdomain");
  const segments = parsed.pathname.split("/").filter(Boolean).map((segment) => decode(segment));
  if (segments.some((segment) => segment === null)) return fail("has a malformed path");
  const path = `/${(segments as string[]).join("/").toLowerCase()}/`;
  if (TRACKING_PATHS.some((prefix) => path.includes(`${prefix.replace(/\/$/u, "")}/`))) return fail("uses a click-tracking path");

  // No redirect or user content.
  if (USER_CONTENT_HOSTS.some((content) => onHost(host, content))) return fail("is on a host where anyone can publish");
  const params = [...parsed.searchParams.entries()];
  const names = params.map(([name]) => name.toLowerCase());
  if (names.some((name) => REDIRECT_PARAMS.includes(name))) return fail("has a redirect parameter");
  if ((segments as string[]).some((segment) => looksLikeUrlOrHost(segment) || nextHop(segment))
    || params.some(([, value]) => looksLikeUrlOrHost(value) || nextHop(value))) {
    return fail("carries another URL or host");
  }

  // No action on open.
  const query = parsed.search.replace(/^\?/u, "");
  if (query.length > MAX_QUERY_LENGTH) return fail(`has a query longer than ${MAX_QUERY_LENGTH} characters`);
  const actionText = `${path} ${(decode(query) ?? query).toLowerCase()}`;
  const word = ACTION_WORDS.find((candidate) => actionText.includes(candidate));
  if (word) return fail(`acts on open (${word})`);
  if (names.some((name) => SECRET_PARAMS.includes(name) || name.endsWith("_token"))) return fail("carries a token or signed parameter");

  // Label.
  const labelWord = label.match(bannedLabel)?.[0];
  if (labelWord) return fail(`label uses "${labelWord}"`);

  // Authenticated sender from the same organization.
  const fromDomain = senderDomain(sender.from);
  if (!fromDomain) return fail("sender address is unknown");
  const signedDomain = sender.signedBy ? registrableDomain(sender.signedBy) : null;
  if (!signedDomain) return fail("sender is not signed");
  if (signedDomain !== fromDomain) return fail(`sender is signed by ${signedDomain}, not ${fromDomain}`);
  if (domain !== fromDomain && !KNOWN_SERVICES[fromDomain]?.domains.includes(domain)) {
    return fail(`links to ${domain}, not the sender's ${fromDomain}`);
  }
  return { ok: true };
}

type Action = { label: string; url: string };
type Card = { title: string; action?: Action; secondaryAction?: Action; messageId?: string };

function authenticatedService(sender: TaskLinkSender): KnownService | null {
  const fromDomain = senderDomain(sender.from);
  const signedDomain = sender.signedBy ? registrableDomain(sender.signedBy) : null;
  return fromDomain && signedDomain === fromDomain ? KNOWN_SERVICES[fromDomain] ?? null : null;
}

function verifyCard<T extends Card>(card: T, sources: readonly Source[]): T {
  const source = card.messageId ? sources.find((candidate) => candidate.messageId === card.messageId) : undefined;
  const sender: TaskLinkSender = { ...(source?.from ? { from: source.from } : {}), ...(source?.signedBy ? { signedBy: source.signedBy } : {}) };
  let next: T = card;
  // A non-Gmail secondary button is a task button too; drop it when it fails.
  if (next.secondaryAction && !isEmailUrl(next.secondaryAction.url)
    && !checkTaskLink(next.secondaryAction.url, next.secondaryAction.label, sender).ok) {
    next = { ...next };
    delete (next as Card).secondaryAction;
  }
  const action = next.action;
  if (!action) return next;
  // The email button is always labeled Open email, so no Read button survives.
  if (isEmailUrl(action.url)) return action.label === "Open email" ? next : { ...next, action: { label: "Open email", url: action.url } };
  const result = checkTaskLink(action.url, action.label, sender);
  if (result.ok) return next;
  const service = authenticatedService(sender);
  if (service) return { ...next, action: { label: `Go to ${service.name}`, url: service.startUrl } };
  const email = next.secondaryAction;
  if (email && isEmailUrl(email.url)) {
    const fallback: T = { ...next, action: { label: "Open email", url: email.url } };
    delete (fallback as Card).secondaryAction;
    return fallback;
  }
  const host = linkDomain(action.url)?.host ?? "this link";
  throw new Error(`"${card.title}" links to ${host}, which Briefs can't verify (${result.reason}), and has no Gmail link to fall back to. Add the email's Gmail link as secondaryAction, or remove the task link, and publish again.`);
}

/**
 * Applies the task-link rules to items[] and later[]. Each card is checked against the source
 * with the same messageId. A failing link becomes "Go to <Service>" for an authenticated known
 * service, else the card's Gmail secondaryAction relabeled "Open email". Throws when a failing
 * link has no Gmail fallback. Gmail actions keep their URL and are labeled "Open email".
 */
export function verifyTaskLinks(brief: Brief, sources: readonly Source[]): Brief {
  return {
    ...brief,
    items: brief.items.map((item) => verifyCard(item, sources)),
    later: brief.later.map((item) => verifyCard(item, sources)),
  };
}
