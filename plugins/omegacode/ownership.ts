export type BbRunOwner = {
  threadId: string;
  environmentId: string;
  projectId: string | null;
};

export type ThreadRunScope = {
  threadId: string;
  environmentId: string;
};

export type RunOwnership = {
  owner: BbRunOwner | null;
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
  return (
    run.owner !== null &&
    run.owner.threadId === scope.threadId &&
    run.owner.environmentId === scope.environmentId
  );
}

/**
 * Infer the one exact owner scope represented by journals for a thread.
 * Thread ids are globally unique in bb, while the environment id carried by
 * each journal keeps the final selection fail-closed if the corpus disagrees.
 */
export function inferThreadRunScope(
  runs: readonly RunOwnership[],
  threadId: string,
): ThreadRunScope | null {
  const environmentIds = new Set<string>();
  for (const run of runs) {
    if (run.owner?.threadId === threadId) {
      environmentIds.add(run.owner.environmentId);
    }
  }
  if (environmentIds.size !== 1) return null;
  const environmentId = environmentIds.values().next().value;
  return environmentId ? { threadId, environmentId } : null;
}
