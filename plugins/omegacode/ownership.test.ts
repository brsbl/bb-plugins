import { describe, expect, it } from "vitest";
import {
  inferThreadRunScope,
  readBbRunOwner,
  runBelongsToScope,
} from "./ownership";

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

  it("infers the exact journal-owned thread and environment pair", () => {
    expect(
      inferThreadRunScope(
        [
          {
            owner: {
              threadId: "thr_current",
              environmentId: "env_current",
              projectId: "proj_current",
            },
          },
          {
            owner: {
              threadId: "thr_other",
              environmentId: "env_other",
              projectId: "proj_other",
            },
          },
        ],
        "thr_current",
      ),
    ).toEqual({ threadId: "thr_current", environmentId: "env_current" });
  });

  it("fails closed when journals disagree about a thread's environment", () => {
    expect(
      inferThreadRunScope(
        [
          {
            owner: {
              threadId: "thr_current",
              environmentId: "env_first",
              projectId: null,
            },
          },
          {
            owner: {
              threadId: "thr_current",
              environmentId: "env_second",
              projectId: null,
            },
          },
        ],
        "thr_current",
      ),
    ).toBeNull();
  });
});
