export function roundHalfEven(value) {
  const floor = Math.floor(value);
  if (value - floor === 0.5) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(value);
}

export function roundToTenth(value) {
  return roundHalfEven(value * 10) / 10;
}

export function percent(numerator, denominator) {
  return denominator ? roundHalfEven((100 * numerator) / denominator) : null;
}

export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
