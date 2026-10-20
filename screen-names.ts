const MAX_LENGTH = 16;

const BRANDS: Record<string, string> = {
  "claude-code": "Claude",
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  "gemini-cli": "Gemini",
  cursor: "Cursor",
  "cursor-agent": "Cursor",
  opencode: "OpenCode",
  copilot: "Copilot",
  amp: "Amp",
};

interface Dice {
  year: string;
  digits: string;
  digit: string;
}

type Template = (name: string, dice: Dice) => string;

const TEMPLATES: Template[] = [
  (name) => `xX${name}Xx`,
  (name) => `xXx${name}xXx`,
  (name) => `xoxo${name}xoxo`,
  (name, dice) => `${name}${dice.year}`,
  (name, dice) => `sk8r${name}${dice.year}`,
  (name, dice) => `lil${name}${dice.digits}`,
  (name) => `${name}4lyfe`,
  (name, dice) => `${name}4eva${dice.year}`,
  (name, dice) => `${name}b0i${dice.year}`,
  (name, dice) => `${name}babii${dice.year}`,
  (name, dice) => `${name}Angel${dice.year}`,
  (name, dice) => `${name}lvr${dice.digit}`,
  (name, dice) => `Mr${name}${dice.year}`,
  (name) => `${name}rulz`,
  (name, dice) => `${alternatingCaps(name)}${dice.year}`,
  (name, dice) => `${leet(name)}${dice.year}`,
];

function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    result ^= value.charCodeAt(i);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function alternatingCaps(name: string): string {
  return [...name].map((char, index) => (index % 2 === 0 ? char.toUpperCase() : char.toLowerCase())).join("");
}

function leet(name: string): string {
  return name[0]! + name.slice(1).replace(/o/g, "0").replace(/e/g, "3").replace(/i/g, "1");
}

export function agentBrand(providerId: string): string {
  const known = BRANDS[providerId.toLowerCase()];
  if (known !== undefined) return known;
  const parts = providerId.split(/[^A-Za-z0-9]+/).filter((part) => /^[A-Za-z]/.test(part));
  const capitalized = parts.map((part) => part[0]!.toUpperCase() + part.slice(1));
  const joined = capitalized.join("");
  if (joined === "") return "Agent";
  return joined.length <= 10 ? joined : capitalized[0]!.slice(0, 10);
}

export function aimScreenName(providerId: string, threadId: string): string {
  const name = agentBrand(providerId);
  const seed = hash(`${providerId}:${threadId}`);
  const dice: Dice = {
    year: String(86 + ((seed >>> 8) % 10)),
    digits: String(100 + ((seed >>> 12) % 900)),
    digit: String(1 + ((seed >>> 20) % 9)),
  };
  const candidates = TEMPLATES.map((template) => template(name, dice)).filter((candidate) => candidate.length <= MAX_LENGTH);
  return candidates.length === 0 ? name.slice(0, MAX_LENGTH) : candidates[seed % candidates.length]!;
}
