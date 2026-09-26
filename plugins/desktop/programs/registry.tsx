import type { ComponentType, ReactNode } from "react";
import { PaintApp } from "../apps/paint";
import {
  BuddyListArt,
  CommandPromptArt,
  DetailsArt,
  FolderArt,
  InternetExplorerArt,
  MediaPlayerArt,
  MinesweeperArt,
  NewFolderArt,
  NewThreadArt,
  PaintArt,
  PinballArt,
  RecycleBinArt,
  SolitaireArt,
  ThreadArt,
  ThreadsArt,
} from "../art";
import { findApp } from "../bridge";
import { groupThreads } from "../core";
import { MinesweeperGame } from "../games/minesweeper";
import { PinballGame } from "../games/pinball";
import { SolitaireGame } from "../games/solitaire";
import { stopMic } from "../services/mic";
import { closeInternetExplorer } from "../services/browser";
import { closeCommandPromptSession } from "../services/terminal";
import type { DesktopContextValue } from "../shell/data";
import { WindowFrame, useWindowManager, type DesktopWindow, type Size, type SpecOf, type WindowKind, type WindowSpec } from "../windows";
import { AppIcon, AppWindow } from "./app-window";
import { CommandPromptWindow } from "./command-prompt";
import { InternetExplorerWindow } from "./internet-explorer";
import { MediaPlayerWindow } from "./media-player";
import { PanelWindow } from "./threads/buddy-info";
import { BuddyListWindow, buddyListTitle } from "./threads/buddy-list";
import { FinderWindow, MoreWindow, RecycleBinWindow, ThreadsWindow } from "./threads/explorer";
import { ThreadWindow } from "./threads/instant-message";
import { NewFolderWindow } from "./threads/new-folder";
import { NewThreadWindow } from "./threads/new-thread";
import { ThreadTabWindow, closeThreadTab, threadTabTitle } from "./threads/thread-tab";

type WindowOf<K extends WindowKind> = DesktopWindow & { spec: SpecOf<K> };

/**
 * Everything the desktop knows about one window kind. `title` and `art` label the taskbar button, which cannot read
 * the live title a program shows in its own frame. Each `Window` renders its own `WindowFrame`.
 */
export interface ProgramDefinition<K extends WindowKind> {
  size(spec: SpecOf<K>): Size;
  title(spec: SpecOf<K>, desktop: DesktopContextValue): string;
  art(spec: SpecOf<K>, desktop: DesktopContextValue, size: number): ReactNode;
  Window: ComponentType<{ window: WindowOf<K> }>;
  /** Releases what the window holds. Runs on every close path, including archiving a thread. */
  dispose?(spec: SpecOf<K>): void;
}

function MinesweeperWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  return (
    <WindowFrame window={desktopWindow} title="Minesweeper" icon={<MinesweeperArt size={16} />}>
      <MinesweeperGame />
    </WindowFrame>
  );
}

function SolitaireWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  return (
    <WindowFrame window={desktopWindow} title="Solitaire" icon={<SolitaireArt size={16} />}>
      <SolitaireGame />
    </WindowFrame>
  );
}

function PinballWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const manager = useWindowManager();
  return (
    <WindowFrame window={desktopWindow} title="3D Pinball for Windows - Space Cadet" icon={<PinballArt size={16} />} keepMounted>
      <PinballGame active={!desktopWindow.minimized && manager.focusedId === desktopWindow.id} />
    </WindowFrame>
  );
}

function PaintWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  return (
    <WindowFrame window={desktopWindow} title="untitled - Paint" icon={<PaintArt size={16} />}>
      <PaintApp />
    </WindowFrame>
  );
}

function fixed(width: number, height: number): () => Size {
  return () => ({ width, height });
}

const PROGRAMS: { [K in WindowKind]: ProgramDefinition<K> } = {
  finder: {
    size: fixed(560, 400),
    title: (spec, desktop) => desktop.groupByKey.get(spec.key)?.name ?? "Folder",
    art: (spec, desktop, size) => {
      const group = desktop.groupByKey.get(spec.key);
      return (
        <FolderArt
          kind={group?.kind ?? "section"}
          size={size}
          empty={group !== undefined && groupThreads(group, desktop.visibleThreads).length === 0}
        />
      );
    },
    Window: ({ window }) => <FinderWindow window={window} groupKey={window.spec.key} />,
  },
  thread: {
    size: fixed(620, 640),
    title: (spec, desktop) => desktop.threadById.get(spec.threadId)?.title ?? "Thread",
    art: (_spec, _desktop, size) => <ThreadArt size={size} />,
    Window: ({ window }) => <ThreadWindow window={window} threadId={window.spec.threadId} />,
  },
  panel: {
    size: fixed(320, 560),
    title: (spec, desktop) => `${desktop.threadById.get(spec.threadId)?.title ?? "Thread"} - Buddy Info`,
    art: (_spec, _desktop, size) => <DetailsArt size={size} />,
    Window: ({ window }) => <PanelWindow window={window} threadId={window.spec.threadId} />,
  },
  "buddy-list": {
    size: fixed(280, 560),
    title: (spec, desktop) => buddyListTitle(desktop, spec.threadId),
    art: (_spec, _desktop, size) => <BuddyListArt size={size} />,
    Window: ({ window }) => <BuddyListWindow window={window} threadId={window.spec.threadId} />,
  },
  "thread-tab": {
    size: (spec) => (spec.tab === "browser" ? { width: 880, height: 640 } : { width: 680, height: 420 }),
    title: (spec, desktop) => threadTabTitle(spec.tab, desktop.threadById.get(spec.threadId)?.title ?? "Thread"),
    art: (spec, _desktop, size) =>
      spec.tab === "browser" ? <InternetExplorerArt size={size} /> : <CommandPromptArt size={size} />,
    Window: ({ window }) => (
      <ThreadTabWindow window={window} threadId={window.spec.threadId} tab={window.spec.tab} tabId={window.spec.tabId} />
    ),
    dispose: closeThreadTab,
  },
  threads: {
    size: fixed(460, 560),
    title: () => "My Threads",
    art: (_spec, _desktop, size) => <ThreadsArt size={size} />,
    Window: ThreadsWindow,
  },
  "recycle-bin": {
    size: fixed(460, 560),
    title: () => "Recycle Bin",
    art: (_spec, desktop, size) => <RecycleBinArt size={size} full={desktop.archivedThreads.length > 0} />,
    Window: RecycleBinWindow,
  },
  more: {
    size: fixed(560, 400),
    title: () => "More",
    art: (_spec, desktop, size) => <FolderArt kind="section" size={size} empty={desktop.moreGroups.length === 0} />,
    Window: MoreWindow,
  },
  minesweeper: {
    size: fixed(300, 400),
    title: () => "Minesweeper",
    art: (_spec, _desktop, size) => <MinesweeperArt size={size} />,
    Window: MinesweeperWindow,
  },
  solitaire: {
    size: fixed(720, 540),
    title: () => "Solitaire",
    art: (_spec, _desktop, size) => <SolitaireArt size={size} />,
    Window: SolitaireWindow,
  },
  pinball: {
    size: fixed(640, 560),
    title: () => "3D Pinball for Windows - Space Cadet",
    art: (_spec, _desktop, size) => <PinballArt size={size} />,
    Window: PinballWindow,
  },
  "command-prompt": {
    size: fixed(680, 420),
    title: () => "Command Prompt",
    art: (_spec, _desktop, size) => <CommandPromptArt size={size} />,
    Window: CommandPromptWindow,
    dispose: () => closeCommandPromptSession(),
  },
  paint: {
    size: fixed(780, 580),
    title: () => "untitled - Paint",
    art: (_spec, _desktop, size) => <PaintArt size={size} />,
    Window: PaintWindow,
  },
  "internet-explorer": {
    size: fixed(880, 640),
    title: () => "Internet Explorer",
    art: (_spec, _desktop, size) => <InternetExplorerArt size={size} />,
    Window: InternetExplorerWindow,
    dispose: closeInternetExplorer,
  },
  app: {
    size: (spec) => ({ width: findApp(spec.key)?.width ?? 520, height: findApp(spec.key)?.height ?? 420 }),
    title: (spec) => findApp(spec.key)?.title ?? "Program",
    art: (spec, _desktop, size) => <AppIcon app={findApp(spec.key)} size={size} />,
    Window: ({ window }) => <AppWindow window={window} appKey={window.spec.key} />,
  },
  "new-folder": {
    size: fixed(440, 480),
    title: () => "New folder",
    art: (_spec, _desktop, size) => <NewFolderArt size={size} />,
    Window: NewFolderWindow,
  },
  "new-thread": {
    size: fixed(720, 420),
    title: () => "New thread",
    art: (_spec, _desktop, size) => <NewThreadArt size={size} />,
    Window: ({ window }) => <NewThreadWindow window={window} groupKey={window.spec.groupKey} />,
  },
  "media-player": {
    size: fixed(480, 380),
    title: () => "Media Player",
    art: (_spec, _desktop, size) => <MediaPlayerArt size={size} />,
    Window: MediaPlayerWindow,
    dispose: stopMic,
  },
};

/** The kinds are correlated with their specs, which TypeScript cannot follow through an index, so look up once here. */
function programOf(spec: WindowSpec): ProgramDefinition<WindowKind> {
  return PROGRAMS[spec.kind] as unknown as ProgramDefinition<WindowKind>;
}

export function windowSize(spec: WindowSpec): Size {
  return programOf(spec).size(spec);
}

export function windowTitle(spec: WindowSpec, desktop: DesktopContextValue): string {
  return programOf(spec).title(spec, desktop);
}

export function windowArt(spec: WindowSpec, desktop: DesktopContextValue, size: number): ReactNode {
  return programOf(spec).art(spec, desktop, size);
}

export function disposeWindow(spec: WindowSpec) {
  programOf(spec).dispose?.(spec);
}

export function ProgramWindow({ window }: { window: DesktopWindow }) {
  const { Window } = programOf(window.spec);
  return <Window window={window as WindowOf<WindowKind>} />;
}
