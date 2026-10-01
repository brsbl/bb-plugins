import { definePluginApp } from "@get-bb/plugin-sdk/app";

import "./app.css";
import { installDesktopBridge } from "./bridge";
import { installMicRelease, readCompact, toggleDesktop } from "./enabled";
import { NeedsInputBalloon } from "./page/balloon";
import { LibraryBridge } from "./page/library-bridge";
import { mountStickyNotes, StickyNoteHeaderButton } from "./page/sticky-notes";
import { DesktopSettings } from "./settings";
import { Desktop } from "./shell/desktop";
import { ThreadFolderChip } from "./shell/folder-chip";

export default definePluginApp((app) => {
  installDesktopBridge();
  installMicRelease();
  app.slots.homepageSection({
    id: "desktop",
    title: "Desktop",
    component: () => (
      <>
        <Desktop />
        <LibraryBridge />
      </>
    ),
  });
  app.slots.settingsSection({ id: "desktop", component: DesktopSettings });
  app.slots.sidebarFooterAction({
    id: "toggle",
    title: "Desktop",
    icon: "AppWindow",
    run: ({ openSettings }) => (readCompact() ? openSettings() : toggleDesktop()),
  });
  app.slots.experimental_threadHeaderAction({
    id: "sticky-note",
    title: "Note pads",
    component: ({ threadId, isCompactViewport }) => (
      <>
        {isCompactViewport ? null : <ThreadFolderChip threadId={threadId} />}
        <StickyNoteHeaderButton isCompactViewport={isCompactViewport} />
        <NeedsInputBalloon />
        <LibraryBridge />
      </>
    ),
  });
  app.contentScripts.register({ id: "sticky-notes", mount: mountStickyNotes });
});
