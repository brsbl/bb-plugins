export interface DesktopAppRegistration {
  pluginId: string;
  id: string;
  title: string;
  description?: string;
  icon?: string;
  width?: number;
  height?: number;
}

export interface DesktopAppWindow {
  windowId: string;
  element: HTMLElement;
}

export interface DesktopBridge {
  version: 1;
  registerApp(app: DesktopAppRegistration): () => void;
  openApp(pluginId: string, id: string): boolean;
  windows(pluginId: string, id: string): readonly DesktopAppWindow[];
  subscribe(listener: () => void): () => void;
}

export interface DesktopApp extends DesktopAppRegistration {
  key: string;
}

declare global {
  interface Window {
    bbDesktop?: DesktopBridge;
  }
}

const NAME = /^[A-Za-z0-9_-]{1,64}$/;

export function appKey(pluginId: string, id: string): string {
  return `${pluginId}/${id}`;
}

function validate(app: unknown): DesktopApp | null {
  if (typeof app !== "object" || app === null) return null;
  const record = app as Record<string, unknown>;
  const text = (field: string, max: number) =>
    typeof record[field] === "string" && (record[field] as string).trim() !== "" && (record[field] as string).length <= max
      ? (record[field] as string).trim()
      : undefined;
  const size = (field: string) =>
    typeof record[field] === "number" && Number.isFinite(record[field]) ? Math.min(2000, Math.max(240, record[field] as number)) : undefined;
  const pluginId = text("pluginId", 64);
  const id = text("id", 64);
  const title = text("title", 80);
  if (pluginId === undefined || id === undefined || title === undefined || !NAME.test(pluginId) || !NAME.test(id)) return null;
  const icon = text("icon", 100_000);
  return {
    key: appKey(pluginId, id),
    pluginId,
    id,
    title,
    description: text("description", 120),
    icon: icon !== undefined && /^(\/|data:image\/|https?:\/\/)/.test(icon) ? icon : undefined,
    width: size("width"),
    height: size("height"),
  };
}

let apps: readonly DesktopApp[] = [];
const containers = new Map<string, { key: string; element: HTMLElement }>();
const windowSnapshots = new Map<string, readonly DesktopAppWindow[]>();
const listeners = new Set<() => void>();
let opener: ((key: string) => void) | null = null;

function emit() {
  windowSnapshots.clear();
  for (const listener of listeners) listener();
}

export function subscribeApps(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function registeredApps(): readonly DesktopApp[] {
  return apps;
}

export function findApp(key: string): DesktopApp | undefined {
  return apps.find((app) => app.key === key);
}

export function setAppOpener(open: ((key: string) => void) | null) {
  opener = open;
}

export function attachAppWindow(windowId: string, key: string, element: HTMLElement): () => void {
  containers.set(windowId, { key, element });
  emit();
  return () => {
    if (containers.get(windowId)?.element === element) containers.delete(windowId);
    emit();
  };
}

const bridge: DesktopBridge = {
  version: 1,
  registerApp(input) {
    const app = validate(input);
    if (app === null) {
      console.warn("[desktop] ignored an invalid desktop app registration", input);
      return () => undefined;
    }
    apps = [...apps.filter((candidate) => candidate.key !== app.key), app];
    emit();
    return () => {
      if (apps.includes(app)) {
        apps = apps.filter((candidate) => candidate !== app);
        emit();
      }
    };
  },
  openApp(pluginId, id) {
    const key = appKey(pluginId, id);
    if (opener === null || findApp(key) === undefined) return false;
    opener(key);
    return true;
  },
  windows(pluginId, id) {
    const key = appKey(pluginId, id);
    const cached = windowSnapshots.get(key);
    if (cached !== undefined) return cached;
    const snapshot = [...containers.entries()]
      .filter(([, value]) => value.key === key)
      .map(([windowId, value]) => ({ windowId, element: value.element }));
    windowSnapshots.set(key, snapshot);
    return snapshot;
  },
  subscribe: subscribeApps,
};

export function installDesktopBridge(): () => void {
  window.bbDesktop = bridge;
  window.dispatchEvent(new Event("bb-desktop:ready"));
  return () => {
    if (window.bbDesktop === bridge) delete window.bbDesktop;
  };
}
