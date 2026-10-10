// One unit of travel is the closed-to-open distance. Mass is normalized to 1.
export const initialState = Object.freeze({ stiffness: 180, damping: 18, target: 1 });
export const LIMITS = Object.freeze({ stiffness: [40, 400, 10], damping: [1, 60, 1] });
export const TRAVEL = Object.freeze({ min: -0.4, max: 1.4 });
export const PRESETS = Object.freeze({
  gentle: { label: 'Gentle', stiffness: 90, damping: 20, hint: 'A soft, slightly overdamped spring takes its time arriving. Open and close the drawer to feel the delay.' },
  crisp: { label: 'Crisp', stiffness: 360, damping: 36, hint: 'A stiffer spring with almost critical damping reaches its destination quickly with very little overshoot.' },
  bouncy: { label: 'Bouncy', stiffness: 140, damping: 8, hint: 'Less damping lets the drawer pass its destination. Close it while it is opening: its velocity continues before it turns around.' },
});

export function normalizeState(input, base = initialState) {
  const result = { ...initialState };
  for (const source of [base, input]) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    for (const [key, [min, max, step]] of Object.entries(LIMITS)) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        result[key] = min + Math.round((Math.min(max, Math.max(min, value)) - min) / step) * step;
      }
    }
    if (typeof source.target === 'number' && Number.isFinite(source.target)) {
      result.target = Math.min(1, Math.max(0, source.target));
    }
  }
  return result;
}

export function atRest(state = initialState) {
  return { position: normalizeState(state).target, velocity: 0 };
}

export function measure(state, motion = atRest(state)) {
  const inputs = normalizeState(state);
  const dampingRatio = inputs.damping / (2 * Math.sqrt(inputs.stiffness));
  return {
    dampingRatio,
    regime: dampingRatio < 0.995 ? 'Underdamped' : dampingRatio > 1.005 ? 'Overdamped' : 'Near critical',
    idealOvershoot: dampingRatio < 1 ? Math.exp(-Math.PI * dampingRatio / Math.sqrt(1 - dampingRatio ** 2)) : 0,
    acceleration: inputs.stiffness * (inputs.target - motion.position) - inputs.damping * motion.velocity,
    settled: Math.abs(inputs.target - motion.position) < 0.0003 && Math.abs(motion.velocity) < 0.0025,
  };
}

// Semi-implicit Euler in steps no larger than 1/240 s. Long gaps are discarded;
// returning to the tab resumes the experiment instead of jumping forward.
export function advance(state, motion, elapsed) {
  const inputs = normalizeState(state);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let position = typeof motion?.position === 'number' && Number.isFinite(motion.position) ? clamp(motion.position, TRAVEL.min, TRAVEL.max) : inputs.target;
  let velocity = typeof motion?.velocity === 'number' && Number.isFinite(motion.velocity) ? clamp(motion.velocity, -20, 20) : 0;
  const duration = typeof elapsed === 'number' && Number.isFinite(elapsed) ? clamp(elapsed, 0, 0.05) : 0;
  const steps = Math.max(1, Math.ceil(duration * 240));
  const dt = duration / steps;
  for (let index = 0; index < steps; index++) {
    velocity += (inputs.stiffness * (inputs.target - position) - inputs.damping * velocity) * dt;
    position += velocity * dt;
    if (position <= TRAVEL.min) { position = TRAVEL.min; velocity = Math.max(0, velocity); }
    if (position >= TRAVEL.max) { position = TRAVEL.max; velocity = Math.min(0, velocity); }
  }
  const result = { position, velocity };
  return measure(inputs, result).settled ? { position: inputs.target, velocity: 0 } : result;
}
