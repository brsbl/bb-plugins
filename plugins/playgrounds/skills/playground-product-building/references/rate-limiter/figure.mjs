// Token-bucket rate limiter. One pure model: simulate() replays 30 seconds of
// traffic through the bucket; the card animates, charts and advises from it.

export const meta = {
  title: 'Token bucket',
  width: 540,
  components: ['product-building/flow'],
};

export const SECONDS = 30;
export const DT = 0.05;
export const API_RATE = 60;
export const LIMITS = { capacity: [10, 300, 10], refill: [5, 100, 5] };
export const TRAFFIC = {
  steady: { label: 'Steady', base: 30, burst: 0, every: 10, first: 10 },
  bursty: { label: 'Bursty', base: 20, burst: 120, every: 10, first: 10 },
  spiky: { label: 'Spiky', base: 12, burst: 200, every: 6, first: 4 },
};
export const initial = { capacity: 80, refill: 35, traffic: 'bursty' };

const snap = (value, [min, max, step]) => Math.min(max, Math.max(min, Math.round((Number(value) - min) / step) * step + min));
export function normalize(state) {
  const s = state && typeof state === 'object' ? state : {};
  return {
    capacity: snap(s.capacity ?? initial.capacity, LIMITS.capacity) || initial.capacity,
    refill: snap(s.refill ?? initial.refill, LIMITS.refill) || initial.refill,
    traffic: Object.hasOwn(TRAFFIC, s.traffic) ? s.traffic : initial.traffic,
  };
}

export function arrivalsAt(traffic, t) {
  const p = TRAFFIC[traffic];
  let rate = p.base;
  if (p.burst && t >= p.first && ((t - p.first) % p.every) < 0.5) rate += p.burst / 0.5;
  return rate;
}

export function simulate(inputs) {
  const { capacity, refill, traffic } = normalize(inputs);
  const steps = [];
  let tokens = capacity, carry = 0, accepted = 0, rejected = 0, firstReject = null;
  const perSecond = Array.from({ length: SECONDS }, (_, i) => ({ t: i, accepted: 0, rejected: 0 }));
  for (let i = 0; i < SECONDS / DT; i++) {
    const t = i * DT;
    tokens = Math.min(capacity, tokens + refill * DT);
    carry += arrivalsAt(traffic, t) * DT;
    const arrivals = Math.floor(carry);
    carry -= arrivals;
    const ok = Math.min(arrivals, Math.floor(tokens));
    tokens -= ok;
    const lost = arrivals - ok;
    accepted += ok; rejected += lost;
    if (lost && firstReject === null) firstReject = t;
    const second = perSecond[Math.min(SECONDS - 1, Math.floor(t))];
    second.accepted += ok; second.rejected += lost;
    steps.push({ t, tokens, arrivals, accepted: ok, rejected: lost });
  }
  return { steps, perSecond, accepted, rejected, firstReject, capacity, refill, traffic };
}

// The smallest bucket that loses nothing at this refill rate, or null when the
// refill rate is below average demand and every bucket eventually runs dry.
export function advise(inputs) {
  const s = normalize(inputs);
  const p = TRAFFIC[s.traffic];
  const average = p.base + (p.burst ? p.burst / p.every : 0);
  if (s.refill < average) return { capacity: null, average };
  for (let capacity = LIMITS.capacity[0]; capacity <= LIMITS.capacity[1]; capacity += LIMITS.capacity[2]) {
    if (simulate({ ...s, capacity }).rejected === 0) return { capacity, average };
  }
  return { capacity: null, average };
}
