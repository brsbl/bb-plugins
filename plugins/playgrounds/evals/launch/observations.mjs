// A terminal agent may finish before the browser mounts/paints its directive.
// This grace never extends the run cap and never reduces the measured latency.
export function renderWindow({ now, capAt, agentCompletedAt, visibleAt, graceMs = 30_000 }) {
  const deadline = agentCompletedAt === null ? capAt : Math.min(capAt, agentCompletedAt + Math.min(30_000, Math.max(0, graceMs)));
  return { done: (visibleAt !== null && visibleAt <= deadline) || now >= deadline, deadline,
    renderGraceUsed: agentCompletedAt !== null && (visibleAt ?? now) > agentCompletedAt,
    renderDelayMs: agentCompletedAt !== null && visibleAt !== null ? Math.max(0, visibleAt - agentCompletedAt) : null };
}

// Keep all observations, not just the final screen: a later tab can hide a
// newly exposed dead control. Stable DOM identities also distinguish twins.
export function unexercisedControls(initial, snapshots) {
  const tested = new Set(initial.map(control => control.index));
  const found = new Map();
  for (const snapshot of snapshots) for (const control of snapshot.controls || []) {
    if (!tested.has(control.index) && !found.has(control.index))
      found.set(control.index, { ...control, exposedAfter: snapshot.inventoryAfter });
  }
  return [...found.values()];
}

export function observeInteractions(actions, listExpression) {
  return actions.flatMap((action, actionIndex) => {
    if (!['click','drag','key','move','scroll','wait'].includes(action[0])) return [action];
    return [action, ['eval', `({inventoryAfter:${JSON.stringify({ actionIndex, kind:action[0] })},controls:${listExpression}})`]];
  });
}
