import { describe, expect, it } from "vitest";

import { agentBrand, aimScreenName } from "./screen-names";

const threadIds = Array.from({ length: 200 }, (_, index) => `thr_${index.toString(36).padStart(10, "x")}`);

describe("aimScreenName", () => {
  it("keeps every name a valid AIM screen name that shows the agent", () => {
    for (const providerId of ["claude-code", "codex", "acp-demo", "gemini", "some-very-long-provider-name"]) {
      const brand = agentBrand(providerId).toLowerCase();
      for (const threadId of threadIds) {
        const name = aimScreenName(providerId, threadId);
        expect(name.length).toBeGreaterThanOrEqual(3);
        expect(name.length).toBeLessThanOrEqual(16);
        expect(name).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
        const plain = name.toLowerCase().replace(/0/g, "o").replace(/3/g, "e").replace(/1/g, "i");
        expect(plain).toContain(brand);
      }
    }
  });

  it("is stable per thread and varies across threads", () => {
    expect(aimScreenName("claude-code", "thr_abc")).toBe(aimScreenName("claude-code", "thr_abc"));
    expect(new Set(threadIds.map((threadId) => aimScreenName("claude-code", threadId))).size).toBeGreaterThan(20);
  });

  it("names Claude Code threads after Claude", () => {
    expect(agentBrand("claude-code")).toBe("Claude");
    expect(agentBrand("acp-demo")).toBe("AcpDemo");
  });
});
