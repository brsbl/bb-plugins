// A staged rollout watched by an error-rate gate. simulate() plays the plan hour
// by hour: exposure steps up after each bake, the measured error rate is noisy in
// small cohorts, and two hourly windows over the threshold trigger a rollback.

export const meta = { title: 'Staged rollout', width: 540 };

export const USERS = 200_000;
export const BASE_ERROR = 0.4;
export const BUG_ERROR = 1.3;
export const PLANS = {
  cautious: { label: '1 → 5 → 25 → 100%', stages: [1, 5, 25, 100] },
  standard: { label: '5 → 50 → 100%', stages: [5, 50, 100] },
  fast: { label: '25 → 100%', stages: [25, 100] },
};
export const RELEASES = { healthy: 'Healthy', regression: 'Has a bug' };
export const LIMITS = { bake: [1, 12, 1], threshold: [0.5, 2.5, 0.1] };
export const initial = { plan: 'standard', bake: 4, threshold: 1.2, release: 'regression' };

const snap = (v, [min, max, step]) => Number(Math.min(max, Math.max(min, Math.round((Number(v) - min) / step) * step + min)).toFixed(2));
export function normalize(input) {
  const s = input && typeof input === 'object' ? input : {};
  return {
    plan: Object.hasOwn(PLANS, s.plan) ? s.plan : initial.plan,
    bake: snap(s.bake ?? initial.bake, LIMITS.bake),
    threshold: snap(s.threshold ?? initial.threshold, LIMITS.threshold),
    release: Object.hasOwn(RELEASES, s.release) ? s.release : initial.release,
  };
}

function noise(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function simulate(input) {
  const s = normalize(input);
  const stages = PLANS[s.plan].stages;
  const hours = stages.length * s.bake + 6;
  const random = noise(42);
  const trueRate = s.release === 'regression' ? BUG_ERROR : BASE_ERROR;
  const points = [];
  let over = 0, rolledBackAt = null, fullAt = null, exposedUserHours = 0;
  for (let h = 0; h <= hours; h++) {
    const stage = Math.min(stages.length - 1, Math.floor(h / s.bake));
    const exposure = rolledBackAt !== null ? 0 : stages[stage];
    if (exposure === 100 && fullAt === null) fullAt = h;
    const sample = USERS * exposure / 100 * 0.5;
    const spread = sample > 0 ? Math.sqrt(trueRate * (100 - trueRate) / sample) * 1.6 : 0;
    const gauss = Math.sqrt(-2 * Math.log(random() || 1e-9)) * Math.cos(2 * Math.PI * random());
    const measured = exposure ? Math.max(0, trueRate + spread * gauss) : null;
    if (measured !== null && rolledBackAt === null) {
      over = measured >= s.threshold ? over + 1 : 0;
      if (over >= 2) rolledBackAt = h + 1;
    }
    if (s.release === 'regression') exposedUserHours += USERS * exposure / 100;
    points.push({ h, exposure, measured, stage });
  }
  const end = rolledBackAt === null ? hours : Math.min(hours, rolledBackAt + 3);
  return { ...s, stages, hours: end, points: points.slice(0, end + 1), rolledBackAt, fullAt: rolledBackAt === null ? fullAt : null, exposedUserHours, trueRate };
}

export function verdict(run) {
  if (run.release === 'healthy') {
    return run.rolledBackAt !== null
      ? { tone: 'bad', label: `False rollback at ${run.rolledBackAt} h`, detail: 'noise in a small cohort crossed the gate' }
      : { tone: 'good', label: `100% in ${run.fullAt} h`, detail: 'no false alarms' };
  }
  if (run.rolledBackAt === null) return { tone: 'bad', label: 'Bug shipped to everyone', detail: 'the gate never fired' };
  const at = run.points[Math.max(0, run.rolledBackAt - 1)].exposure;
  return { tone: at <= 5 ? 'good' : 'warn', label: `Caught at ${at}%`, detail: `${Math.round(run.exposedUserHours / 1000)}k user-hours saw errors`, at };
}
