import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readServiceAccountToken } from "./vault.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tokenFile(content: string, mode = 0o600) {
  const dir = await mkdtemp(join(tmpdir(), "onepassword-fill-"));
  dirs.push(dir);
  const path = join(dir, "token.env");
  await writeFile(path, content);
  await chmod(path, mode);
  return path;
}

describe("readServiceAccountToken", () => {
  it.each([
    ["OP_SERVICE_ACCOUNT_TOKEN='ops_fake'\n"],
    ['export OP_SERVICE_ACCOUNT_TOKEN = "ops_fake" # set by bb secret\n'],
    ["OTHER=1\nOP_SERVICE_ACCOUNT_TOKEN=ops_fake\n"],
  ])("reads %j", async (content) => {
    expect(await readServiceAccountToken(await tokenFile(content))).toEqual({ ok: true, token: "ops_fake" });
  });

  it("refuses a file other users can read", async () => {
    expect(await readServiceAccountToken(await tokenFile("OP_SERVICE_ACCOUNT_TOKEN=ops_fake\n", 0o644))).toEqual({
      ok: false,
      code: "token_unsafe",
    });
  });

  it("reports a missing file or assignment", async () => {
    expect(await readServiceAccountToken("/nonexistent/token.env")).toEqual({ ok: false, code: "token_missing" });
    expect(await readServiceAccountToken(await tokenFile("OTHER=1\n"))).toEqual({ ok: false, code: "token_missing" });
    expect(await readServiceAccountToken("relative.env")).toEqual({ ok: false, code: "token_missing" });
  });

  it("never copies the token into the process environment", async () => {
    await readServiceAccountToken(await tokenFile("OP_SERVICE_ACCOUNT_TOKEN=ops_fake\n"));
    expect(JSON.stringify(process.env)).not.toContain("ops_fake");
  });
});
