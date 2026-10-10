/** What a connection's page showed: a signed-in shell, a sign-in page, LinkedIn's sign-in wall, a security check, or nothing definite yet. */
export type SignInPage = "signed-in" | "login" | "authwall" | "challenge" | null;

/**
 * Runs inside the site's tab as `(location, document) => { page, accountName }`.
 * Plain JavaScript so tests execute the exact source the browser runs. It reads
 * only the URL and the account controls; never cookies or page content.
 * The final URL decides first, so a login, authwall or checkpoint page is never
 * mistaken for a signed-in one.
 */
export const SIGN_IN_PROBE = String.raw`(location, document) => {
  const host = location.hostname;
  const path = location.pathname;
  const google = host === "mail.google.com" || host === "accounts.google.com";
  const x = /(^|\.)(x|twitter)\.com$/.test(host);
  const linkedin = /(^|\.)linkedin\.com$/.test(host);
  const has = (selector) => !!document.querySelector(selector);
  // Google's /challenge/pwd and LinkedIn's other /checkpoint/ pages are ordinary sign-in steps.
  const urlPage = host === "accounts.google.com" ? (/\/challenge\/(?!pwd)/.test(path) ? "challenge" : "login")
    : linkedin && /^\/checkpoint\/challenge/.test(path) ? "challenge"
    : linkedin && /^\/checkpoint\//.test(path) ? "login"
    : linkedin && /^\/authwall/.test(path) ? "authwall"
    : x && /^\/account\/access/.test(path) ? "challenge"
    : /^\/(login|uas\/login|i\/flow\/login|signup|i\/flow\/signup)(\/|$)/.test(path) ? "login"
    : null;
  const signedIn = google ? has('[role="navigation"], [gh="cm"]') || /@[^ ]+ - Gmail$/.test(document.title)
    : x ? has('[data-testid="SideNav_AccountSwitcher_Button"], [data-testid="AppTabBar_Profile_Link"]')
    : linkedin ? has('.global-nav__me, header a[href*="/messaging/"], header [aria-label$=" Me"]')
    : false;
  const page = urlPage ?? (signedIn ? "signed-in"
    : has('input[type="password"], [data-testid="loginButton"]') ? "login" : null);
  let accountName = "";
  if (page === "signed-in" && google) {
    const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const control = document.querySelector('[aria-label^="Google Account:"]');
    accountName = ((control?.getAttribute("aria-label") ?? "").match(email) ?? document.title.match(email))?.[0] ?? "";
  } else if (page === "signed-in" && x) {
    const handle = document.querySelector('[data-testid="AppTabBar_Profile_Link"]')?.getAttribute("href")?.match(/^\/([A-Za-z0-9_]{1,15})$/)?.[1];
    accountName = handle ? "@" + handle
      : (document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')?.textContent ?? "").match(/@[A-Za-z0-9_]{1,15}/)?.[0] ?? "";
  } else if (page === "signed-in" && linkedin) {
    const me = document.querySelector('header [aria-label$=" Me"]')?.getAttribute("aria-label")?.slice(0, -3);
    accountName = me || document.querySelector('.global-nav__me img')?.getAttribute("alt") || "";
  }
  return { page, accountName: accountName.trim().slice(0, 160) || null };
}`;
