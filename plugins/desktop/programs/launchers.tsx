import type { ReactNode } from "react";
import { useBbNavigate } from "@get-bb/plugin-sdk/app";
import { InternetExplorerArt, NotePadArt, PluginsArt, RunArt, SearchArt, ShowDesktopArt, SkillsArt } from "../art";
import { addStickyNote } from "../page/sticky-notes";
import { BROWSER_HOME, nativeBrowser } from "../services/browser";
import { navigateInApp, runAppCommand } from "../shell/commands";
import { useDesktop } from "../shell/data";
import { useWindowManager, type WindowManager, type WindowSpec } from "../windows";
import { AppIcon, useDesktopApps } from "./app-window";
import { LAUNCHER_IDS, LAUNCHER_LABELS, appLauncherId, type LauncherId } from "./launcher-ids";
import { windowArt } from "./registry";

/** Something a person can start from the Start menu or Quick Launch. */
export interface Launcher {
  id: string;
  label: string;
  /** The Start menu's second line; empty for entries in its right column. */
  detail: string;
  art: (size: number) => ReactNode;
  /** Quick Launch draws window icons a little smaller than command icons. */
  quickSize: number;
  run: () => void;
}

export interface LauncherCatalog {
  /** Programs other plugins registered, in registration order. */
  apps: Launcher[];
  launcher: (id: LauncherId) => Launcher;
  /** Everything Quick Launch can show, in the order its menu lists them. */
  quickLaunch: Launcher[];
}

let hiddenByShowDesktop: string[] = [];

/** Minimizes every open window, or restores the ones it minimized last time. */
function showDesktop(manager: WindowManager) {
  const open = manager.windows.filter((window) => !window.minimized);
  if (open.length > 0) {
    hiddenByShowDesktop = open.map((window) => window.id);
    for (const window of open) manager.minimize(window.id, true);
    return;
  }
  for (const id of hiddenByShowDesktop) manager.minimize(id, false);
  hiddenByShowDesktop = [];
}

export function useOpenInternetExplorer(): () => void {
  const navigate = useBbNavigate() as ReturnType<typeof useBbNavigate> & { openUrl?: (url: string) => boolean };
  const manager = useWindowManager();
  return () => {
    if (nativeBrowser() !== null) {
      manager.open({ kind: "internet-explorer" });
      return;
    }
    if (navigate.openUrl?.(BROWSER_HOME) === true) return;
    window.open(BROWSER_HOME, "_blank", "noopener");
  };
}

export function useLaunchers(): LauncherCatalog {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const openInternetExplorer = useOpenInternetExplorer();
  const apps = useDesktopApps().map(
    (app): Launcher => ({
      id: appLauncherId(app.key),
      label: app.title,
      detail: app.description ?? "",
      art: (size) => <AppIcon app={app} size={size} />,
      quickSize: 20,
      run: () => manager.open({ kind: "app", key: app.key }),
    }),
  );
  const program = (spec: WindowSpec, detail = ""): Omit<Launcher, "id" | "label"> => ({
    detail,
    art: (size) => windowArt(spec, desktop, size),
    quickSize: 18,
    run: () => manager.open(spec),
  });
  const command = (art: (size: number) => ReactNode, run: () => void): Omit<Launcher, "id" | "label"> => ({
    detail: "",
    art,
    quickSize: 20,
    run,
  });
  const builtIn: Record<LauncherId, Omit<Launcher, "id" | "label">> = {
    "show-desktop": command((size) => <ShowDesktopArt size={size} />, () => showDesktop(manager)),
    "new-thread": program({ kind: "new-thread", groupKey: null }, "Start a conversation"),
    "new-folder": program({ kind: "new-folder" }, "Group threads on the desktop"),
    threads: program({ kind: "threads" }),
    "recycle-bin": program({ kind: "recycle-bin" }),
    "media-player": program({ kind: "media-player" }, "Visualize your microphone"),
    minesweeper: program({ kind: "minesweeper" }),
    solitaire: program({ kind: "solitaire" }),
    pinball: program({ kind: "pinball" }),
    "command-prompt": program({ kind: "command-prompt" }),
    paint: program({ kind: "paint" }),
    "sticky-note": {
      detail: "Pin a note in the margin",
      art: (size) => <NotePadArt size={size} />,
      quickSize: 18,
      run: () => addStickyNote(),
    },
    "internet-explorer": {
      detail: "Browse the web in bb",
      art: (size) => <InternetExplorerArt size={size} />,
      quickSize: 20,
      run: openInternetExplorer,
    },
    search: command((size) => <SearchArt size={size} />, () => void runAppCommand("thread.search")),
    run: command((size) => <RunArt size={size} />, () => void runAppCommand("palette.open")),
    plugins: command((size) => <PluginsArt size={size} />, () => navigateInApp("/plugins")),
    skills: command((size) => <SkillsArt size={size} />, () => navigateInApp("/skills")),
  };
  const launcher = (id: LauncherId): Launcher => ({ id, label: LAUNCHER_LABELS[id], ...builtIn[id] });
  return { apps, launcher, quickLaunch: [...apps, ...LAUNCHER_IDS.map(launcher)] };
}
