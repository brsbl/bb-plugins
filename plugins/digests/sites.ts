/** Site metadata only. Sign-ins stay in bb's browser. */
export const SITES = [
  { id: "gmail", name: "Gmail", url: "https://mail.google.com/mail/u/0/" },
  { id: "x", name: "X", url: "https://x.com/home" },
  { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/feed/" },
] as const;

/** The Google account a Gmail URL names with /mail/u/<email>/ or authuser=<email>. A numeric index names no account. */
export function expectedAccount(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "mail.google.com") return null;
    const value = parsed.searchParams.get("authuser") ?? decodeURIComponent(parsed.pathname.match(/^\/mail\/u\/([^/]+)/u)?.[1] ?? "");
    return /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/u.test(value) ? value.toLowerCase() : null;
  } catch { return null; }
}

/** Gmail serves an error page for /mail/u/<email>/ in some sessions; authuser selects the same account and keeps #fragments. */
export function accountUrl(url: string, fragment = ""): string {
  const account = expectedAccount(url);
  return account ? `https://mail.google.com/mail/?authuser=${account}${fragment}` : url;
}
