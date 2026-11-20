import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";

export type FillField = "username" | "password" | "otp";

export interface VaultItem {
  id: string;
  title: string;
  websites: string[];
}

/** The only operations the plugin needs; all of them read. */
export interface VaultReader {
  vaults(): Promise<Array<{ id: string; title: string }>>;
  items(vaultId: string): Promise<VaultItem[]>;
  field(vaultId: string, itemId: string, field: FillField): Promise<string | null>;
}

export type TokenResult =
  | { ok: true; token: string }
  | { ok: false; code: "token_missing" | "token_unsafe" };

export function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}

/**
 * Reads OP_SERVICE_ACCOUNT_TOKEN from the dotenv file `bb secret request`
 * wrote, at call time. The file must be a regular file owned by this user and
 * unreadable by anyone else. The token is never placed in process.env.
 */
export async function readServiceAccountToken(path: string): Promise<TokenResult> {
  const file = expandHome(path);
  if (!isAbsolute(file)) return { ok: false, code: "token_missing" };
  let details;
  try {
    details = await stat(file);
  } catch {
    return { ok: false, code: "token_missing" };
  }
  if (
    !details.isFile() ||
    (details.mode & 0o077) !== 0 ||
    (typeof process.getuid === "function" && details.uid !== process.getuid())
  )
    return { ok: false, code: "token_unsafe" };
  let content: string;
  try {
    content = await readFile(file, "utf8");
  } catch {
    return { ok: false, code: "token_missing" };
  }
  for (const line of content.split(/\r?\n/u)) {
    const match = /^\s*(?:export\s+)?OP_SERVICE_ACCOUNT_TOKEN\s*=\s*(.*)$/u.exec(line);
    if (!match) continue;
    const raw = match[1]!.trim();
    const quote = raw[0];
    const token =
      quote === "'" || quote === '"'
        ? raw.slice(1, raw.indexOf(quote, 1) === -1 ? 1 : raw.indexOf(quote, 1))
        : raw.split(/\s+#/u)[0]!.trim();
    return token ? { ok: true, token } : { ok: false, code: "token_missing" };
  }
  return { ok: false, code: "token_missing" };
}

function websiteList(websites: Array<{ url: string }>): string[] {
  return websites.map((website) => website.url).filter(Boolean);
}

/** The official 1Password SDK, loaded on first use and authenticated per call. */
export async function openOnePassword(token: string, version: string): Promise<VaultReader> {
  const sdk = await import("@1password/sdk");
  const client = await sdk.createClient({
    auth: token,
    integrationName: "bb Agent Sign-in",
    integrationVersion: version,
  });
  return {
    async vaults() {
      return (await client.vaults.list()).map(({ id, title }) => ({ id, title }));
    },
    async items(vaultId) {
      return (await client.items.list(vaultId))
        .filter(
          (item) =>
            item.state === sdk.ItemState.Active &&
            (item.category === sdk.ItemCategory.Login ||
              item.category === sdk.ItemCategory.Password),
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          websites: websiteList(item.websites),
        }));
    },
    async field(vaultId, itemId, field) {
      const item = await client.items.get(vaultId, itemId);
      if (field === "otp") {
        for (const entry of item.fields)
          if (
            entry.fieldType === sdk.ItemFieldType.Totp &&
            entry.details?.type === "Otp"
          )
            return entry.details.content.code ?? null;
        return null;
      }
      const builtIn = item.fields.find((entry) => entry.id === field && !entry.sectionId);
      const titled = item.fields.find(
        (entry) => entry.title.trim().toLowerCase() === field,
      );
      return (builtIn ?? titled)?.value || null;
    },
  };
}
