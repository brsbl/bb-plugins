/** bb app commands the desktop can trigger; bb only exposes them as keybindings. */
export type AppShortcutCommand = "palette.open" | "thread.search";

interface AppShortcut {
  key: string;
  mod: boolean;
  meta: boolean;
  control: boolean;
  alt: boolean;
  shift: boolean;
}

const DEFAULT_SHORTCUTS: Record<AppShortcutCommand, AppShortcut> = {
  "palette.open": { key: "p", mod: true, meta: false, control: false, alt: false, shift: true },
  "thread.search": { key: "k", mod: true, meta: false, control: false, alt: false, shift: false },
};

function isShortcut(value: unknown): value is AppShortcut {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.key === "string" && ["mod", "meta", "control", "alt", "shift"].every((field) => typeof record[field] === "boolean");
}

async function appShortcut(command: AppShortcutCommand): Promise<AppShortcut> {
  try {
    const response = await fetch("/api/v1/system/config", { credentials: "same-origin" });
    const body: unknown = await response.json();
    const bindings = typeof body === "object" && body !== null ? (body as { keybindings?: unknown }).keybindings : undefined;
    const match = Array.isArray(bindings)
      ? bindings.find((binding: unknown) => (binding as { command?: unknown })?.command === command)
      : undefined;
    const shortcut = (match as { shortcut?: unknown } | undefined)?.shortcut;
    return isShortcut(shortcut) ? shortcut : DEFAULT_SHORTCUTS[command];
  } catch {
    return DEFAULT_SHORTCUTS[command];
  }
}

export async function runAppCommand(command: AppShortcutCommand) {
  const shortcut = await appShortcut(command);
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  const key = shortcut.shift && shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  const init: KeyboardEventInit = {
    key,
    code: /^[a-z]$/i.test(shortcut.key) ? `Key${shortcut.key.toUpperCase()}` : undefined,
    metaKey: shortcut.meta || (shortcut.mod && mac),
    ctrlKey: shortcut.control || (shortcut.mod && !mac),
    altKey: shortcut.alt,
    shiftKey: shortcut.shift,
    bubbles: true,
    cancelable: true,
  };
  (document.activeElement instanceof HTMLElement ? document.activeElement : document.body).blur();
  document.body.dispatchEvent(new KeyboardEvent("keydown", init));
  document.body.dispatchEvent(new KeyboardEvent("keyup", init));
}

/** Client-side navigation within bb, for routes the SDK navigator doesn't cover. */
export function navigateInApp(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
