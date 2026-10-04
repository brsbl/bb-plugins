import type { Snapshot } from "./contract.js";

export function parsePullRequestUrl(raw: string) {
  let value: URL;
  try { value = new URL(raw.trim()); } catch { throw new Error("Enter a complete HTTPS GitHub pull request URL."); }
  const match = /^\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/pull\/([1-9][0-9]*)\/?$/.exec(value.pathname);
  if (value.protocol !== "https:" || value.hostname !== "github.com" || value.port || value.username || value.password || !match || !Number.isSafeInteger(Number(match[3]))) throw new Error("Use an HTTPS github.com pull request URL without credentials.");
  const owner = match[1]!, repository = match[2]!, number = match[3]!;
  return { owner, repository, number: Number(number), url: `https://github.com/${owner}/${repository}/pull/${number}` };
}
export function originMarkers(body: string): string[] {
  return [...new Set(Array.from(body.matchAll(/^BB-Thread-ID: (thr_[a-zA-Z0-9]+)\s*$/gm), (match) => match[1]!))];
}
/** Pending work never becomes an actionable failure just because GitHub says BLOCKED. */
export function githubNeedsAttention(snapshot: Snapshot): boolean {
  if (snapshot.state === "merged" || snapshot.state === "closed") return false;
  if (snapshot.checks.state === "failing" || snapshot.review === "changes-requested" || snapshot.mergeability === "conflicts") return true;
  return snapshot.mergeability === "blocked" && snapshot.state !== "draft" && !snapshot.queued && snapshot.checks.state !== "pending" && snapshot.checks.state !== "unknown" && snapshot.review !== "required" && snapshot.review !== "unknown";
}
export async function mapConcurrent<T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) { const index = cursor++; if (index >= items.length) break; output[index] = await run(items[index]!); }
  }));
  return output;
}
