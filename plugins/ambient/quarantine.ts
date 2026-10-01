// Scenes that reset or stalled the GPU this session. They are not drawn again until the user
// picks a scene, so a bad shader can't wedge the GPU on every reload.

const QUARANTINE_KEY = "bb-ambient:quarantine";
const MAX_QUARANTINED = 20;

function sourceKey(source: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(index), 0x01000193);
  }
  return `${(hash >>> 0).toString(16)}:${source.length}`;
}

function readQuarantine(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(QUARANTINE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function isQuarantined(source: string): boolean {
  return readQuarantine().includes(sourceKey(source));
}

export function quarantine(source: string): void {
  const key = sourceKey(source);
  const keys = readQuarantine().filter((entry) => entry !== key);
  try {
    window.sessionStorage.setItem(QUARANTINE_KEY, JSON.stringify([...keys, key].slice(-MAX_QUARANTINED)));
  } catch {}
}

export function clearQuarantine(): void {
  try {
    window.sessionStorage.removeItem(QUARANTINE_KEY);
  } catch {}
}
