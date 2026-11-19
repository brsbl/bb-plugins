export const failureScore = (visibleMs, capMs) => Number.isFinite(visibleMs) && visibleMs >= 0 && visibleMs <= capMs ? visibleMs : capMs;
export function resumeMismatch(old, next) {
  return ['label','url','host','pluginRoot','commit','capMs','renderGraceMs','prompts','providers'].find(key => JSON.stringify(old[key]) !== JSON.stringify(next[key]));
}
export function providerSummary(provider, all) {
  const done = all.filter(Boolean), complete = done.length === 20 && all.length === 20;
  const times = done.map(r => r.scoreMs).sort((a,b) => a-b);
  const medianMs = complete ? (times[9]+times[10])/2 : null;
  const p90Ms = complete ? times[Math.ceil(times.length*0.9)-1] : null;
  const liveCards = done.filter(r => r.cardVisible && r.controls?.pass).length;
  const questions = done.reduce((sum,r) => sum + (r.questions?.count || 0), 0);
  const reviews = done.filter(r => r.questions?.needsReview || r.questions === undefined).length;
  const progressShown = done.filter(r => r.progress?.length).length;
  return { provider, complete, completed:done.length, total:20, medianMs, p90Ms, liveCards,
    clarifyingQuestions:questions, questionReviewsNeeded:reviews, progressShown, failures:done.filter(r => !r.pass).length,
    pass:complete && liveCards >= 18 && questions === 0 && reviews === 0 && progressShown === 20 && medianMs <= 180_000 && p90Ms <= 360_000,
    results:done.map(r => ({promptId:r.promptId,model:r.model,scoreMs:r.scoreMs,cardVisible:r.cardVisible,pass:r.pass,error:r.error,agentCompletedAt:r.agentCompletedAt ?? null,terminalObservedAt:r.terminalObservedAt ?? null,renderGraceUsed:r.renderGraceUsed ?? false,renderDelayMs:r.renderDelayMs ?? null,renderGraceRetainedCard:r.renderGraceRetainedCard ?? false})) };
}
