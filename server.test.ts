import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  loadDoctrine,
  searchDoctrine,
} from "./server";

describe("design doctrine corpus", () => {
  it("loads and types the canonical repository", async () => {
    const library = await loadDoctrine(process.cwd());

    expect(library.rules).toHaveLength(33);
    expect(library.status_counts).toEqual({
      active: 20,
      candidate: 13,
    });
    expect(library.taxonomy.roots.map((root) => root.id)).toContain(
      "interaction",
    );
    expect(
      library.rules.every((rule) => rule.canonical_path.endsWith(".json")),
    ).toBe(true);
  });

  it("searches all typed rule fields with AND semantics", async () => {
    const library = await loadDoctrine(process.cwd());
    const results = searchDoctrine(library.rules, "compact utilities");

    expect(results.map((rule) => rule.id)).toContain("ddr_001");
  });

  it("keeps candidate rules out of operative search by default", async () => {
    const library = await loadDoctrine(process.cwd());
    const operative = searchDoctrine(library.rules, "explicit click");
    const historical = searchDoctrine(
      library.rules,
      "explicit click",
      true,
    );

    expect(operative.map((rule) => rule.id)).not.toContain("ddr_011");
    expect(historical.map((rule) => rule.id)).toContain("ddr_011");
  });

  it("publishes evidence without private bb locators", async () => {
    const library = await loadDoctrine(process.cwd());
    const published = library.rules.flatMap((rule) =>
      rule.evidence.filter(
        (evidence) => evidence.source.type === "published_summary",
      ),
    );

    expect(published).toHaveLength(63);
    for (const evidence of published) {
      expect(evidence.source.thread_id).toMatch(/^published-context-\d{3}$/);
      expect(evidence.source.project_id).toMatch(/^published-scope-\d{3}$/);
      expect(evidence.source.source_keys).toEqual(
        expect.arrayContaining([expect.stringMatching(/^published-signal-\d{3}$/)]),
      );
      expect(evidence.episode_id).toMatch(/^external:published:episode-\d{3}$/);
      expect(evidence.content_sha256).toBe(
        `sha256:${createHash("sha256").update(evidence.summary).digest("hex")}`,
      );
    }
  });
});
