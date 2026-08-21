/**
 * Finding color literals in a string.
 *
 * Deliberately permissive about *syntax* and strict about *boundaries*: the
 * browser is the final judge of whether a match is a real color (the content
 * script gates every hit through `CSS.supports`), so the job here is to find
 * candidates without swallowing their neighbours — `#include`, `PR #1234567`,
 * or a `my-rgb(...)` identifier must not read as color.
 */

export interface ColorMatch {
  /** Index of the first character of the literal. */
  start: number;
  /** Index one past the last character. */
  end: number;
  /** The literal exactly as it appears in the text. */
  value: string;
}

/** Only these hex lengths are colors; 5 and 7 digits are something else. */
const HEX_LENGTHS = new Set([3, 4, 6, 8]);

/**
 * Function forms, including one level of nesting so `rgb(var(--x) / 50%)` and
 * `color-mix(in oklch, var(--a), var(--b))` survive.
 */
const FUNCTION_NAMES = [
  "rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color", "color-mix",
];

const PATTERN = new RegExp(
  [
    "#[0-9a-fA-F]+",
    `(?:${FUNCTION_NAMES.join("|")})\\(` + "[^()]*(?:\\([^()]*\\)[^()]*)*" + "\\)",
  ].join("|"),
  "gi",
);

/** A literal may not begin in the middle of a word. */
const isWordish = (char: string | undefined): boolean =>
  char !== undefined && /[\w#$@-]/.test(char);

export function findColorMatches(text: string): ColorMatch[] {
  const out: ColorMatch[] = [];
  PATTERN.lastIndex = 0;
  for (let m = PATTERN.exec(text); m !== null; m = PATTERN.exec(text)) {
    const value = m[0];
    const start = m.index;
    if (isWordish(text[start - 1])) continue;

    if (value.startsWith("#")) {
      // `#f4f4f4;` is fine, `#f4f4f4f` is not a color — the run of hex digits
      // has to be exactly one of the valid lengths on its own.
      const digits = value.length - 1;
      if (!HEX_LENGTHS.has(digits)) continue;
      if (/[\w-]/.test(text[start + value.length] ?? "")) continue;
    }

    out.push({ start, end: start + value.length, value });
  }
  return out;
}
