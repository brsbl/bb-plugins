// Original Playgrounds example. SI units internally; distances are entered in cm.
export const DEFAULTS = Object.freeze({ leftMass: 1, leftDistance: 20, rightMass: 1, rightDistance: 20 });
export const LIMITS = Object.freeze({ leftMass: [0.1, 2, 0.1], rightMass: [0.1, 2, 0.1], leftDistance: [5, 40, 1], rightDistance: [5, 40, 1] });
export const STOP = 12 * Math.PI / 180;
export const GRAVITY = 9.81;
export const EXPERIMENTS = Object.freeze([
  { label: "Double the mass, halve the arm", hint: "Two kilograms at 20 cm balance one kilogram at 40 cm. Equal products give equal turning effects.", state: { leftMass: 2, leftDistance: 20, rightMass: 1, rightDistance: 40 } },
  { label: "Move the lighter mass inward", hint: "Moving the right mass to 30 cm reduces its turning effect. The left end drops even though neither mass changed.", state: { leftMass: 2, leftDistance: 20, rightMass: 1, rightDistance: 30 } },
  { label: "Same mass, different reach", hint: "The masses match, but the longer left arm produces twice the torque. Distance matters as much as mass.", state: { leftMass: 1, leftDistance: 30, rightMass: 1, rightDistance: 15 } },
]);

export function normalize(input, base = DEFAULTS) {
  const result = { ...base };
  for (const [key, [min, max, step]] of Object.entries(LIMITS)) {
    const value = input?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      result[key] = Number((Math.round((Math.min(max, Math.max(min, value)) - min) / step) * step + min).toFixed(4));
    }
  }
  return result;
}

export function measure(state, angle = 0) {
  const left = state.leftMass * GRAVITY * state.leftDistance / 100 * Math.cos(angle);
  const right = state.rightMass * GRAVITY * state.rightDistance / 100 * Math.cos(angle);
  const net = left - right;
  return { left, right, net, balanced: Math.abs(net) < 1e-8, balanceDistance: state.leftMass * state.leftDistance / state.rightMass };
}

// A uniform 0.5 kg, 1 m beam pivoted at its centre. Positive angle lifts the
// right end. Gravity, linear rotational damping, and inelastic ±12° stops.
export function advance(state, motion, elapsed) {
  let angle = motion.angle, velocity = motion.velocity;
  const duration = Math.max(0, Math.min(0.05, elapsed));
  const steps = Math.max(1, Math.ceil(duration * 240));
  const dt = duration / steps;
  const inertia = 0.5 / 12 + state.leftMass * (state.leftDistance / 100) ** 2 + state.rightMass * (state.rightDistance / 100) ** 2;
  for (let i = 0; i < steps; i++) {
    velocity += (measure(state, angle).net - 0.8 * velocity) / inertia * dt;
    angle += velocity * dt;
    if (Math.abs(angle) >= STOP) { angle = Math.sign(angle) * STOP; if (angle * velocity > 0) velocity = 0; }
  }
  return { angle, velocity };
}
