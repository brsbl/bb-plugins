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
