import { z } from "zod";
import { githubPreview, githubReference, type GitHubPreview } from "./github-preview.js";
import { decode } from "./preview-metadata.js";

export type ProviderPreview = { title: string; description: string; site: string; image: null; github?: GitHubPreview };
export type ProviderRead = (url: URL) => Promise<{ url: URL; body: Buffer; contentType: string }>;

/** A provider API asked for a pause; no request should be sent before `retryAt` (epoch ms). */
export class ProviderRateLimited extends Error {
  constructor(readonly retryAt: number) { super("The provider API asked for a pause"); }
}

const NPM_PART = /^[a-z0-9][a-z0-9._~-]{0,213}$/i;
const SEMVER = /^\d{1,9}\.\d{1,9}\.\d{1,9}(?:-[0-9a-z.-]{1,64})?(?:\+[0-9a-z.-]{1,64})?$/i;
const QUESTION_ID = /^[1-9]\d{0,9}$/;

const npmSchema = z.object({ name: z.string(), version: z.string(), description: z.string().optional() });
const stackSchema = z.object({
  items: z.array(z.object({ title: z.string(), score: z.number().int(), answer_count: z.number().int() })),
  quota_remaining: z.number().int().optional(),
  backoff: z.number().int().optional(),
});

const text = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);
const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;
const segment = (value: string) => { try { return decodeURIComponent(value); } catch { return null; } };

function publicHttps(url: URL, hosts: RegExp): boolean {
  return url.protocol === "https:" && hosts.test(url.hostname) && !url.port && !url.username && !url.password;
}

/** The registry version endpoint for an npm package page, or null when the URL is not one. */
export function npmEndpoint(url: URL): URL | null {
  if (!publicHttps(url, /^(?:www\.)?npmjs\.com$/i)) return null;
  const parts = url.pathname.split("/").filter(Boolean).map(segment);
  if (parts[0] !== "package" || parts.some((part) => part === null)) return null;
  const scoped = parts[1]?.startsWith("@");
  const scope = scoped ? parts[1]!.slice(1) : null;
  const name = parts[scoped ? 2 : 1];
  const rest = parts.slice(scoped ? 3 : 2);
  if (!name || !NPM_PART.test(name) || (scope !== null && !NPM_PART.test(scope))) return null;
  let version = "latest";
  if (rest.length) {
    if (rest.length !== 2 || rest[0] !== "v" || !SEMVER.test(rest[1]!)) return null;
    version = rest[1]!;
  }
  const id = scope === null ? encodeURIComponent(name) : `@${encodeURIComponent(scope)}%2F${encodeURIComponent(name)}`;
  return new URL(`https://registry.npmjs.org/${id}/${encodeURIComponent(version)}`);
}

/** The Stack Overflow question ID in a full or short question link, or null. */
export function stackOverflowQuestion(url: URL): string | null {
  if (!publicHttps(url, /^(?:www\.)?stackoverflow\.com$/i)) return null;
  const [kind, id] = url.pathname.split("/").filter(Boolean);
  return (kind === "questions" || kind === "q") && QUESTION_ID.test(id ?? "") ? id! : null;
}

function json(page: { body: Buffer; contentType: string }): unknown {
  if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(page.contentType)) throw new Error(`Provider answered ${page.contentType || "without a content type"}`);
  return JSON.parse(page.body.toString("utf8"));
}

/**
 * Metadata from fixed provider APIs for links whose pages refuse generic fetches.
 * Resolves null when the URL belongs to no provider (or names nothing), throws `ProviderRateLimited` while paused,
 * and lets transport failures propagate.
 */
export class PreviewProviders {
  private stackPausedUntil = 0;
  private githubPausedUntil = 0;
  constructor(private readonly now: () => number = Date.now) {}

  async get(url: URL, read: ProviderRead): Promise<ProviderPreview | null> {
    const github = githubReference(url.href);
    if (github) {
      if (this.now() < this.githubPausedUntil) throw new ProviderRateLimited(this.githubPausedUntil);
      return githubPreview(github, async (target) => {
        if (this.now() < this.githubPausedUntil) throw new ProviderRateLimited(this.githubPausedUntil);
        try { return await read(target); }
        catch (error) {
          const detail = error as { status?: number; retryAt?: number };
          if (detail?.status === 403 || detail?.status === 429) {
            this.githubPausedUntil = Math.max(this.githubPausedUntil, detail.retryAt ?? this.now() + 10 * 60_000);
            throw new ProviderRateLimited(this.githubPausedUntil);
          }
          throw error;
        }
      });
    }
    const npm = npmEndpoint(url);
    if (npm) {
      const pkg = npmSchema.parse(json(await read(npm)));
      const description = text(pkg.description ?? "", 380);
      return { title: text(pkg.name, 240), description: text(`v${pkg.version}${description ? ` · ${description}` : ""}`, 400), site: "npm", image: null };
    }
    const question = stackOverflowQuestion(url);
    if (question) return this.stackOverflow(question, read);
    return null;
  }

  private async stackOverflow(id: string, read: ProviderRead): Promise<ProviderPreview | null> {
    if (this.now() < this.stackPausedUntil) throw new ProviderRateLimited(this.stackPausedUntil);
    const answer = stackSchema.parse(json(await read(new URL(`https://api.stackexchange.com/2.3/questions/${id}?site=stackoverflow`))));
    const now = this.now();
    // `backoff` applies to every later request to the API, and a spent quota resets at the next UTC midnight.
    if (answer.backoff && answer.backoff > 0) this.stackPausedUntil = Math.max(this.stackPausedUntil, now + answer.backoff * 1000);
    if (answer.quota_remaining !== undefined && answer.quota_remaining <= 0) {
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      this.stackPausedUntil = Math.max(this.stackPausedUntil, midnight.getTime());
    }
    const item = answer.items[0];
    if (!item) return null;
    return {
      title: decode(item.title).slice(0, 240),
      description: `${count(item.score, "vote")} · ${count(item.answer_count, "answer")}`,
      site: "Stack Overflow",
      image: null,
    };
  }
}
