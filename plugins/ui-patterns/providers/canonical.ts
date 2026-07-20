import { createHash } from "node:crypto";

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalValue(item)]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}
