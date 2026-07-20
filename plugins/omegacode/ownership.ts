import { resolve, sep } from "node:path";

export type BbRunOwner = {
  threadId: string;
  environmentId: string;
  projectId: string | null;
};

export type ThreadRunScope = {
  threadId: string;
  environmentId: string;
  environmentPath: string | null;
};

export type RunOwnership = {
  owner: BbRunOwner | null;
  workflowFile: string | null;
};

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export function readBbRunOwner(meta: Record<string, unknown>): BbRunOwner | null {
  if (typeof meta.bbContext !== "object" || meta.bbContext === null) return null;
  const context = meta.bbContext as Record<string, unknown>;
  const threadId = stringField(context.threadId);
  const environmentId = stringField(context.environmentId);
  if (!threadId || !environmentId) return null;

  return {
    threadId,
    environmentId,
    projectId: stringField(context.projectId),
  };
}

export function runBelongsToScope(
  run: RunOwnership,
  scope: ThreadRunScope,
): boolean {
  if (run.owner) {
    return (
      run.owner.threadId === scope.threadId &&
      run.owner.environmentId === scope.environmentId
    );
  }

  // Migration fallback for journals created before Omegacode recorded BB context.
  // A workflow file inside this thread's environment is unambiguous; other
  // unowned runs stay out of composer banners.
  if (!scope.environmentPath || !run.workflowFile) return false;
  const environmentRoot = resolve(scope.environmentPath);
  const workflowFile = resolve(run.workflowFile);
  return (
    workflowFile === environmentRoot ||
    workflowFile.startsWith(`${environmentRoot}${sep}`)
  );
}
