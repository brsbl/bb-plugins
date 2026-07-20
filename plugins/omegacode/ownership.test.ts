import { describe, expect, it } from "vitest";
import { readBbRunOwner, runBelongsToScope } from "./ownership";

const scope = {
  threadId: "thr_current",
  environmentId: "env_current",
};

describe("Omegacode run ownership", () => {
  it("reads ownership recorded by the Omegacode runner", () => {
    expect(
      readBbRunOwner({
        bbContext: {
          threadId: "thr_current",
          environmentId: "env_current",
          projectId: "proj_current",
        },
      }),
    ).toEqual({
      threadId: "thr_current",
      environmentId: "env_current",
      projectId: "proj_current",
    });
  });

  it("keeps runs isolated by both thread and environment", () => {
    expect(
      runBelongsToScope(
        {
          owner: {
            threadId: "thr_current",
            environmentId: "env_current",
            projectId: null,
          },
        },
        scope,
      ),
    ).toBe(true);

    expect(
      runBelongsToScope(
        {
          owner: {
            threadId: "thr_other",
            environmentId: "env_current",
            projectId: null,
          },
        },
        scope,
      ),
    ).toBe(false);
  });

  it("hides journals that do not record an owning thread", () => {
    expect(runBelongsToScope({ owner: null }, scope)).toBe(false);
  });
});
