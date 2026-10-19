import { describe, expect, it } from 'vitest';
// Eval helpers are executable Node ESM, intentionally outside the shipped TS bundle.
// @ts-expect-error no declaration needed for eval-only JavaScript
import { failureScore, providerSummary, resumeMismatch } from './metrics.mjs';
const success = (scoreMs = 120_000) => ({ scoreMs, cardVisible:true, controls:{pass:true}, questions:{count:0,needsReview:false}, progress:[{text:'Building'}], pass:true });
describe('launch gate accounting', () => {
  it('penalizes absent and out-of-cap cards instead of making early failures fast', () => {
    expect(failureScore(null,900_000)).toBe(900_000);
    expect(failureScore(undefined,900_000)).toBe(900_000);
    expect(failureScore(-1,900_000)).toBe(900_000);
    expect(failureScore(910_000,900_000)).toBe(900_000);
    expect(failureScore(150_000,900_000)).toBe(150_000);
  });
  it('uses all twenty including capped failures for median and nearest-rank p90', () => {
    const rows = Array.from({length:20},(_,i) => success((i+1)*30_000));
    rows[19] = {...success(900_000),cardVisible:false,controls:{pass:false},pass:false};
    const summary = providerSummary('codex',rows);
    expect(summary.medianMs).toBe(315_000);
    expect(summary.p90Ms).toBe(540_000);
    expect(summary.liveCards).toBe(19);
    expect(summary.pass).toBe(false);
  });
  it('does not publish launch percentiles from a cherry-picked subset', () => {
    const summary = providerSummary('codex',[success(),...Array(19).fill(null)]);
    expect(summary.medianMs).toBeNull();
    expect(summary.p90Ms).toBeNull();
    expect(summary.complete).toBe(false);
    expect(summary.pass).toBe(false);
  });
  it('requires question review and progress as well as live controls', () => {
    const rows = Array.from({length:20},() => success());
    expect(providerSummary('codex',rows).pass).toBe(true);
    rows[0].questions.needsReview = true;
    expect(providerSummary('codex',rows).pass).toBe(false);
    rows[0].questions.needsReview = false;
    rows[0].progress = [];
    expect(providerSummary('codex',rows).pass).toBe(false);
  });
  it('prevents resume from mixing revisions, caps, providers, or prompts', () => {
    const first = {label:'baseline',url:'http://localhost:4000',host:'h',pluginRoot:'/p',commit:'abc',capMs:900_000,prompts:['one'],providers:['codex']};
    expect(resumeMismatch(first,{...first})).toBeUndefined();
    for (const [key,value] of [['commit','def'],['capMs',60_000],['prompts',['two']],['providers',['claude-code']]])
      expect(resumeMismatch(first,{...first,[String(key)]:value})).toBe(key);
  });
});
