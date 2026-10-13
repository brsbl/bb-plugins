// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { SIGN_IN_PROBE } from "./signin";

const probe = new Function(`return ${SIGN_IN_PROBE}`)() as (location: Location, document: Document) => { page: string | null; accountName: string | null };
const check = (url: string, body = "", title = "") => {
  document.title = title;
  document.body.innerHTML = body;
  // The probe reads only hostname and pathname, so a parsed URL stands in for the tab's location.
  return probe(new URL(url) as unknown as Location, document);
};

// Markup mirrors what each site rendered in bb's browser in October 2026.
const linkedInFeed = `<header><nav><a href="https://www.linkedin.com/messaging/">Messaging</a></nav>
  <div aria-label="Ada Example Me" role="button">Me</div></header><main>Feed</main>`;
const xHome = `<nav aria-label="Primary"><a data-testid="AppTabBar_Profile_Link" href="/example_handle" aria-label="Profile">Profile</a></nav>
  <button data-testid="SideNav_AccountSwitcher_Button" aria-label="Account menu">ada@example_handle</button>`;

describe("sign-in probe", () => {
  it.each([
    ["LinkedIn feed", "https://www.linkedin.com/feed/", linkedInFeed, "Feed | LinkedIn", { page: "signed-in", accountName: "Ada Example" }],
    ["LinkedIn classic nav", "https://www.linkedin.com/feed/", `<div class="global-nav__me"><img alt="Ada Lovelace"></div>`, "Feed | LinkedIn", { page: "signed-in", accountName: "Ada Lovelace" }],
    ["LinkedIn sign-in", "https://www.linkedin.com/login?session_redirect=%2Ffeed%2F", `<input type="password">`, "LinkedIn Login", { page: "login", accountName: null }],
    ["LinkedIn guest home", "https://www.linkedin.com/", `<form><input type="password"></form>`, "LinkedIn", { page: "login", accountName: null }],
    ["LinkedIn authwall", "https://www.linkedin.com/authwall?trk=feed", "<main>Join LinkedIn</main>", "Sign Up | LinkedIn", { page: "authwall", accountName: null }],
    ["LinkedIn welcome back", "https://www.linkedin.com/checkpoint/rm/sign-in-another-account", `<input type="password">`, "LinkedIn", { page: "login", accountName: null }],
    ["LinkedIn checkpoint", "https://www.linkedin.com/checkpoint/challenge/AgE", linkedInFeed, "Security Verification | LinkedIn", { page: "challenge", accountName: null }],
    ["X home", "https://x.com/home", xHome, "(6) Home / X", { page: "signed-in", accountName: "@example_handle" }],
    ["X account switcher only", "https://x.com/home", `<button data-testid="SideNav_AccountSwitcher_Button" aria-label="Account menu">Ada@ada_l</button>`, "Home / X", { page: "signed-in", accountName: "@ada_l" }],
    ["X sign-in flow", "https://x.com/i/flow/login?redirect_after_login=%2Fhome", `<input name="text">`, "Log in to X / X", { page: "login", accountName: null }],
    ["X logged-out landing", "https://x.com/", `<a data-testid="loginButton" href="/login">Sign in</a>`, "X. It’s what’s happening / X", { page: "login", accountName: null }],
    ["X locked account", "https://x.com/account/access", xHome, "X", { page: "challenge", accountName: null }],
    ["Gmail inbox", "https://mail.google.com/mail/?authuser=me@example.com", `<div role="navigation"></div><a aria-label="Google Account: Me (me@example.com)"></a>`, "Inbox - me@example.com - Gmail", { page: "signed-in", accountName: "me@example.com" }],
    ["Google password step", "https://accounts.google.com/v3/signin/challenge/pwd", `<input type="password">`, "Gmail", { page: "login", accountName: null }],
    ["Google two-step verification", "https://accounts.google.com/v3/signin/challenge/totp", "", "Gmail", { page: "challenge", accountName: null }],
    ["X still rendering", "https://x.com/home", `<div id="react-root"></div>`, "X", { page: null, accountName: null }],
  ])("reads %s", (_name, url, body, title, expected) => {
    expect(check(url, body, title)).toEqual(expected);
  });
});
