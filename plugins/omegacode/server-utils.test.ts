import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  deriveRunStatus,
  GlobalRunSchema,
  isVisibleRun,
  parseJsonl,
  phaseTitlesFromEvents,
  pruneRunCaches,
  readJsonl,
  resetOmegacodeCachesForTest,
  workflowDetailsFromSource,
} from "./server";

describe("Omegacode journal handling", () => {
  it("keeps only object records from a live JSONL stream", () => {
    expect(
      parseJsonl('{"type":"meta"}\nnull\n[]\n"text"\n{"type":"agent"}\n{'),
    ).toEqual([{ type: "meta" }, { type: "agent" }]);
  });

  it("reuses unchanged journal parses and invalidates changed files", () => {
    resetOmegacodeCachesForTest();
    const directory = mkdtempSync(join(tmpdir(), "omegacode-journal-cache-"));
    const path = join(directory, "events.jsonl");
    try {
      writeFileSync(path, '{"type":"meta"}\n');

      const first = readJsonl(path);
      expect(readJsonl(path)).toBe(first);

      writeFileSync(path, '{"type":"meta"}\n{"type":"agent"}\n');
      const changed = readJsonl(path);
      expect(changed).not.toBe(first);
      expect(changed).toEqual([{ type: "meta" }, { type: "agent" }]);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });

  it("drops parsed JSONL records after a run directory is deleted", () => {
    resetOmegacodeCachesForTest();
    const directory = mkdtempSync(join(tmpdir(), "omegacode-run-prune-"));
    const deletedDirectory = join(directory, "wf_deleted");
    const liveDirectory = join(directory, "wf_live");
    const deletedPath = join(deletedDirectory, "events.jsonl");
    const livePath = join(liveDirectory, "events.jsonl");
    try {
      mkdirSync(deletedDirectory);
      mkdirSync(liveDirectory);
      writeFileSync(deletedPath, '{"type":"agent","index":1}\n');
      writeFileSync(livePath, '{"type":"agent","index":2}\n');
      const deletedRecords = readJsonl(deletedPath);
      const liveRecords = readJsonl(livePath);

      pruneRunCaches(new Set(["wf_live"]), directory);

      expect(readJsonl(deletedPath)).not.toBe(deletedRecords);
      expect(readJsonl(livePath)).toBe(liveRecords);
    } finally {
      rmSync(directory, { recursive: true });
      resetOmegacodeCachesForTest();
    }
  });

  it("shows fresh or actively running journals only", () => {
    expect(isVisibleRun({ heartbeatAgeMs: 29_999, counts: { running: 0 } })).toBe(
      true,
    );
    expect(isVisibleRun({ heartbeatAgeMs: 30_000, counts: { running: 0 } })).toBe(
      false,
    );
    expect(
      isVisibleRun({ heartbeatAgeMs: 299_999, counts: { running: 1 } }),
    ).toBe(true);
    expect(
      isVisibleRun({ heartbeatAgeMs: 300_000, counts: { running: 1 } }),
    ).toBe(false);
    expect(isVisibleRun({ heartbeatAgeMs: null, counts: { running: 1 } })).toBe(
      false,
    );
  });

  it("uses recorded phase order, including phases with no agents", () => {
    expect(
      phaseTitlesFromEvents([
        { type: "phase", index: 2, title: "Synthesize", pending: true },
        { type: "phase", index: 1, title: "Audit", pending: true },
        { type: "agent", index: 1, phaseTitle: "Audit" },
      ]),
    ).toEqual(["Audit", "Synthesize"]);
  });

  it("preserves failed and interrupted terminal run states", () => {
    const counts = {
      total: 1,
      running: 0,
      queued: 0,
      failed: 0,
      cancelled: 0,
    };
    expect(
      deriveRunStatus({ eventStatus: "failed", counts, heartbeatAgeMs: 0 }),
    ).toBe("failed");
    expect(
      deriveRunStatus({
        eventStatus: "interrupted",
        counts,
        heartbeatAgeMs: 0,
      }),
    ).toBe("cancelled");
  });

  it("keeps launch descriptions in the global run contract with workflow-meta fallback", () => {
    expect(
      workflowDetailsFromSource(
        'export const meta = { name: \'release-review\', description: "Don\'t lose the \\"worker\\" context." };',
      ),
    ).toEqual({
      name: "release-review",
      description: 'Don\'t lose the "worker" context.',
    });

    expect(
      GlobalRunSchema.parse({
        runId: "wf_global",
        workflow: "release.workflow.js",
        workflowName: "Release review",
        description: "Review the release before it ships.",
        phases: ["Audit"],
        createdAt: 1,
        status: "running",
        updatedAt: 2,
        heartbeatAgeMs: 3,
        counts: {
          total: 1,
          running: 1,
          queued: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
        agents: [],
        owner: null,
      }),
    ).toMatchObject({
      description: "Review the release before it ships.",
      owner: null,
    });
  });
});
