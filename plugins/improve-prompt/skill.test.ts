import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pluginDirectory = dirname(fileURLToPath(import.meta.url));

describe("Prompt Improver skills", () => {
  it("ships prompt shaping and Fable target guidance together", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(pluginDirectory, "package.json"), "utf8"),
    );
    const fableSkill = readFileSync(
      resolve(
        pluginDirectory,
        "skills/fable-5-1-prompting/SKILL.md",
      ),
      "utf8",
    );
    const promptShaperSkill = readFileSync(
      resolve(pluginDirectory, "skills/prompt-shaper/SKILL.md"),
      "utf8",
    );
    const fableReference = readFileSync(
      resolve(
        pluginDirectory,
        "skills/fable-5-1-prompting/references/prompting-claude-fable-5-1.md",
      ),
      "utf8",
    );

    expect(manifest.files).toContain("skills");
    expect(manifest.bb.skills).toEqual(["skills"]);
    expect(fableSkill).toMatch(/^---\nname: fable-5-1-prompting\n/u);
    expect(fableSkill).toContain("Any model may use this mode.");
    expect(fableSkill).toContain(
      "Apply the guidance to the prompt you produce, not to your own tool use",
    );
    expect(fableSkill).not.toContain(
      "Any other model must not load, read, or apply this skill.",
    );
    expect(promptShaperSkill).toMatch(/^---\nname: prompt-shaper\n/u);
    expect(fableReference).toContain(
      "Reference copy for the fable-5-1-prompting skill",
    );
  });
});
