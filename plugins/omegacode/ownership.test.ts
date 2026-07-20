import { describe, expect, it } from "vitest";
import { readBbRunOwner, runBelongsToScope } from "./ownership";

const scope = {
  threadId: "thr_current",
  environmentId: "env_current",
  environmentPath: "/work/current",
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
          workflowFile: "/elsewhere/workflow.js",
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
          workflowFile: "/work/current/workflow.js",
        },
        scope,
      ),
    ).toBe(false);
  });

  it("uses the workflow path only for pre-ownership journals", () => {
    expect(
      runBelongsToScope(
        { owner: null, workflowFile: "/work/current/.omegacode/a.workflow.js" },
        scope,
      ),
    ).toBe(true);
    expect(
      runBelongsToScope(
        { owner: null, workflowFile: "/work/current-other/a.workflow.js" },
        scope,
      ),
    ).toBe(false);
  });
});
