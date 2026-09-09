export function parseArgs(argv, defaults = {}) {
  const values = { ...defaults };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) fail(`Missing value for --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

export function fail(message) {
  process.stderr.write(`error: ${message}\n`);
  process.exit(1);
}

export function requireArg(args, key, usage) {
  if (!args[key]) fail(`Missing --${key}. Usage: ${usage}`);
  return args[key];
}

export function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) fail(`${label} must be a positive integer, got ${value}`);
  return number;
}

export function log(message) {
  process.stdout.write(`${message}\n`);
}
