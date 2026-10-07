/**
 * The HTTPS URL a favicon may be fetched for: a public domain name with no port or credentials.
 * It uses no Node APIs, so app bundles ask for an icon only when the server would fetch it.
 */
export function iconUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (url.protocol !== "https:" || url.port || url.username || url.password || /^[\d.]+$/.test(host) ||
      host.length > 253 || !host.includes(".") || host.endsWith(".") ||
      /(?:^|\.)(?:localhost|local|internal|home|lan|onion|invalid|test)$/.test(host) ||
      !host.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
    url.hash = "";
    return url;
  } catch { return null; }
}
