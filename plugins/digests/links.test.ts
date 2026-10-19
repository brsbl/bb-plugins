import { describe, expect, it } from "vitest";

import { checkTaskLink, isEmailUrl, linkDomain, registrableDomain, verifyTaskLinks } from "./links.js";
import { BriefSchema, type Source } from "./model.js";

const mercury = { from: "Mercury <notifications@mercury.com>", signedBy: "mercury.com" };
const task = "https://app.mercury.com/transactions?receipt=missing";
const label = "Upload receipt in Mercury";
const gmail = "https://mail.google.com/mail/u/0/#inbox/msg_1";

function reason(url: string, text = label, sender: { from?: string; signedBy?: string } = mercury): string | null {
  const result = checkTaskLink(url, text, sender);
  return result.ok ? null : result.reason;
}

describe("registrableDomain and helpers", () => {
  it("reduces hosts to their registrable domain, including private suffixes", () => {
    expect(registrableDomain("app.mercury.com")).toBe("mercury.com");
    expect(registrableDomain("www.example.co.uk")).toBe("example.co.uk");
    expect(registrableDomain("someone.github.io")).toBe("someone.github.io");
    expect(registrableDomain("10.0.0.1")).toBeNull();
  });

  it("recognizes Gmail links and the domain to show beside a task button", () => {
    expect(isEmailUrl(gmail)).toBe(true);
    expect(isEmailUrl(task)).toBe(false);
    expect(isEmailUrl("not a url")).toBe(false);
    expect(linkDomain(task)).toEqual({ domain: "mercury.com", host: "app.mercury.com" });
    expect(linkDomain("nope")).toBeNull();
  });
});

describe("checkTaskLink", () => {
  it("passes a plain link to the authenticated sender's own service", () => {
    expect(reason(task)).toBeNull();
    expect(reason("https://www.guardiananytime.com/claims", "Review claim in Guardian", { from: "alerts@guardianlife.com", signedBy: "guardianlife.com" })).toBeNull();
  });

  it("requires an authenticated sender", () => {
    expect(reason(task, label, { from: "notifications@mercury.com" })).toMatch(/not signed/u);
    expect(reason(task, label, { from: "notifications@mercury.com", signedBy: "mercury-billing.com" })).toMatch(/signed by mercury-billing\.com/u);
    expect(reason(task, label, { signedBy: "mercury.com" })).toMatch(/sender address/u);
    expect(reason(task, label, { from: "notifications@mail.mercury.com", signedBy: "bounce.mercury.com" })).toBeNull();
  });

  it("requires the link to stay on the sender's organization", () => {
    expect(reason("https://app.mercurybank-help.com/transactions")).toMatch(/not the sender's mercury\.com/u);
    expect(reason("https://www.taxact.com/", "Go to TaxAct")).toMatch(/not the sender's/u);
  });

  it("rejects redirects and user content", () => {
    expect(reason("https://www.google.com/url?q=https://app.mercury.com/", label, { from: "x@google.com", signedBy: "google.com" })).toMatch(/redirect/u);
    expect(reason("https://sites.google.com/view/mercury", label, { from: "x@google.com", signedBy: "google.com" })).toMatch(/anyone can publish/u);
    expect(reason("https://app.mercury.com/out/evil.example.com/login")).toMatch(/another URL or host/u);
    expect(reason("https://app.mercury.com/go?to=https%3A%2F%2Fevil.example")).toMatch(/another URL or host/u);
    expect(reason("https://app.mercury.com/transactions?next=%2Fhome")).toMatch(/redirect/u);
  });

  it("requires plain HTTPS on a normal host", () => {
    expect(reason("http://app.mercury.com/transactions")).toMatch(/HTTPS/u);
    expect(reason("https://app.mercury.com:8443/transactions")).toMatch(/port/u);
    expect(reason("https://me:secret@app.mercury.com/transactions")).toMatch(/username/u);
    expect(reason("https://192.168.1.10/transactions")).toMatch(/IP address/u);
    expect(reason("https://[::1]/transactions")).toMatch(/IP address/u);
    expect(reason("https://app.xn--mrcury-3of.com/transactions", label, { from: "billing@xn--mrcury-3of.com", signedBy: "xn--mrcury-3of.com" })).toMatch(/punycode/u);
  });

  it("rejects email click-tracking redirects", () => {
    expect(reason("https://u123.ct.sendgrid.net/ls/click?id=abc")).toMatch(/click-tracking/u);
    expect(reason("https://click.mercury.com/transactions")).toMatch(/click-tracking subdomain/u);
    expect(reason("https://app.mercury.com/ls/click/abc")).toMatch(/click-tracking path/u);
    expect(reason("https://app.mercury.com/clicked-items")).toBeNull();
  });

  it("rejects links that act when opened", () => {
    expect(reason("https://app.mercury.com/unsubscribe")).toMatch(/acts on open \(unsubscribe\)/u);
    expect(reason("https://app.mercury.com/transactions?token=abc")).toMatch(/token/u);
    expect(reason("https://app.mercury.com/transactions?session_token=abc")).toMatch(/token/u);
    expect(reason("https://app.mercury.com/transactions?Sig=abc")).toMatch(/signed parameter/u);
    expect(reason(`https://app.mercury.com/transactions?note=${"a".repeat(260)}`)).toMatch(/longer than 256/u);
  });

  it("rejects labels that read as confirming something", () => {
    for (const text of ["Open in Mercury", "Mark paid", "It was me", "Yes, that's right", "VERIFY"]) {
      expect(reason(task, text)).toMatch(/label uses/u);
    }
    expect(reason(task, "Reopen ticket")).toBeNull();
  });
});

describe("verifyTaskLinks", () => {
  const source = (messageId: string, sender: { from?: string; signedBy?: string }): Source => ({ connectionId: "gmail", messageId, ...sender });
  const brief = (items: unknown[], later: unknown[] = []) => BriefSchema.parse({ heading: "Needs you", items, later });

  it("keeps a passing task link and its label", () => {
    const input = brief([{ title: "Missing receipt", text: "$42 at Cafe.", messageId: "m1", action: { label, url: task }, secondaryAction: { label: "Open email", url: gmail } }]);
    expect(verifyTaskLinks(input, [source("m1", mercury)]).items[0]).toMatchObject({ action: { label, url: task }, secondaryAction: { label: "Open email", url: gmail } });
  });

  it("falls back to Open email when the sender isn't authenticated", () => {
    const input = brief([{ title: "Missing receipt", text: "", messageId: "m1", action: { label, url: task }, secondaryAction: { label: "View email", url: gmail } }]);
    const [item] = verifyTaskLinks(input, [source("m1", { from: "notifications@mercury.com" })]).items;
    expect(item!.action).toEqual({ label: "Open email", url: gmail });
    expect(item!.secondaryAction).toBeUndefined();
  });

  it("sends an authenticated known service to its start page", () => {
    const input = brief([{ title: "Missing receipt", text: "", messageId: "m1", action: { label, url: "https://app.mercury.com/unsubscribe" }, secondaryAction: { label: "Open email", url: gmail } }]);
    expect(verifyTaskLinks(input, [source("m1", mercury)]).items[0]).toMatchObject({
      action: { label: "Go to Mercury", url: "https://app.mercury.com/" }, secondaryAction: { label: "Open email", url: gmail },
    });
  });

  it("checks later items and leaves Gmail actions untouched", () => {
    const input = brief([{ title: "Reply to Ada", text: "", messageId: "m2", action: { label: "Open email", url: gmail } }], [
      { title: "Pay the bill", messageId: "m3", action: { label: "Pay bill", url: "https://pay.example.com/bill?token=x" }, secondaryAction: { label: "Open email", url: gmail } },
    ]);
    const result = verifyTaskLinks(input, [source("m2", {}), source("m3", { from: "bills@example.com", signedBy: "example.com" })]);
    expect(result.items[0]!.action).toEqual({ label: "Open email", url: gmail });
    expect(result.later[0]).toEqual({ title: "Pay the bill", messageId: "m3", action: { label: "Open email", url: gmail } });
  });

  it("rejects a failing task link with no Gmail fallback", () => {
    const input = brief([{ title: "Missing receipt", text: "", messageId: "m1", action: { label, url: "https://u1.ct.sendgrid.net/ls/click?upn=x" } }]);
    expect(() => verifyTaskLinks(input, [source("m1", { from: "x@example.com" })])).toThrow(/"Missing receipt" links to u1\.ct\.sendgrid\.net.*no Gmail link/u);
  });
});
