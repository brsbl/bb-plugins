import { definePluginApp } from "@get-bb/plugin-sdk/app";

import "./styles";
import { installDesktopBridge } from "./bridge";
import { readCompact, toggleDesktop } from "./enabled";
import { NeedsInputBalloon } from "./page/balloon";
import { mountStickyNotes, StickyNoteHeaderButton } from "./page/sticky-notes";
import { Desktop } from "./shell/desktop";
import { ThreadFolderChip } from "./shell/folder-chip";

export default definePluginApp((app) => {
  installDesktopBridge();
  app.slots.homepageSection({
    id: "desktop",
    title: "Desktop",
    component: () => <Desktop />,
  });
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
      </>
    ),
  });
  app.contentScripts.register({ id: "sticky-notes", mount: mountStickyNotes });
});
