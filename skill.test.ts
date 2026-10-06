import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pluginDirectory = dirname(fileURLToPath(import.meta.url));

describe("timeline comments skill", () => {
  it("ships an agent workflow that reads, addresses, replies to, and resolves comments", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(pluginDirectory, "package.json"), "utf8"),
    );
    const skill = readFileSync(
      resolve(pluginDirectory, "skills/timeline-comments/SKILL.md"),
      "utf8",
    );

    expect(manifest.files).toContain("skills");
    expect(manifest.bb.skills).toEqual(["skills"]);
    expect(skill).toMatch(/^---\nname: timeline-comments\n/u);
    expect(skill).toContain("bb comments list --state open --json");
    expect(skill).toContain("bb comments get <comment-thread-id> --json");
    expect(skill).toContain("bb comments reply <comment-thread-id>");
    expect(skill).toContain("bb comments resolve <comment-thread-id>");
    expect(skill).toContain("bb comments reopen <comment-thread-id>");
    expect(skill).toContain(
      "Do not mark feedback resolved merely because you read it",
    );
  });
});
