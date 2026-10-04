import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { DEFAULT_INSTRUCTIONS } from "./instructions";

const pluginDirectory = dirname(fileURLToPath(import.meta.url));

describe("Prompt Improver skills", () => {
  it("ships prompt shaping and Fable target guidance together", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(pluginDirectory, "package.json"), "utf8"),
    );
    const fableSkill = readFileSync(
      resolve(
        pluginDirectory,
        "skills/fable-5-1-target-prompting/SKILL.md",
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
        "skills/fable-5-1-target-prompting/references/prompting-claude-fable-5-1.md",
      ),
      "utf8",
    );

    expect(manifest.files).toContain("skills");
    expect(manifest.bb.skills).toEqual(["skills"]);
    expect(fableSkill).toMatch(/^---\nname: fable-5-1-target-prompting\n/u);
    expect(fableSkill).toContain("Any helper model may use it.");
    expect(fableSkill).toContain(
      "Apply the guidance to the prompt you produce, not to your own tool use",
    );
    expect(fableSkill).not.toContain(
      "Any other model must not load, read, or apply this skill.",
    );
    expect(promptShaperSkill).toMatch(/^---\nname: prompt-shaper\n/u);
    expect(fableReference).toContain(
      "Reference copy for the fable-5-1-target-prompting skill",
    );
  });

  it("keeps the default rewrite instructions in step with the bundled skill", () => {
    const skill = readFileSync(
      resolve(pluginDirectory, "skills/prompt-shaper/SKILL.md"),
      "utf8",
    );
    const guidance = skill.split(/^## Output$/mu)[0] ?? "";
    const sections = [...guidance.matchAll(/^## (.+)$/gmu)].map(
      ([, heading]) => heading,
    );
    const tableLabels = [...guidance.matchAll(/^\| ([^|]+?) \|/gmu)]
      .map(([, label]) => label)
      .filter((label) => label !== "Role" && label !== "Situation" && !/^-+$/u.test(label));
    const completionTerms = [...guidance.matchAll(/^- `([^`]+)` →/gmu)].map(
      ([, term]) => term,
    );

    expect(sections.length).toBeGreaterThan(0);
    expect(tableLabels.length).toBeGreaterThan(0);
    expect(completionTerms.length).toBeGreaterThan(0);
    for (const heading of sections) {
      expect(DEFAULT_INSTRUCTIONS).toContain(heading);
    }
    for (const label of tableLabels) {
      expect(DEFAULT_INSTRUCTIONS).toContain(label);
    }
    for (const term of completionTerms) {
      expect(DEFAULT_INSTRUCTIONS).toContain(`"${term}"`);
    }
  });
});
