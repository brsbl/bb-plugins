import { definePluginApp } from "@get-bb/plugin-sdk/app";

import "./app.css";
import { Desktop } from "./desktop";
import { toggleDesktop } from "./enabled";
import { mountStickyNotes, StickyNoteHeaderButton } from "./sticky-notes";

export default definePluginApp((app) => {
  app.slots.homepageSection({
    id: "desktop",
    title: "Desktop",
    component: () => <Desktop />,
  });
  app.slots.sidebarFooterAction({
    id: "toggle",
    title: "Desktop",
    icon: "AppWindow",
    run: toggleDesktop,
  });
  app.slots.experimental_threadHeaderAction({
    id: "sticky-note",
    title: "Sticky notes",
    component: StickyNoteHeaderButton,
  });
  app.contentScripts.register({ id: "sticky-notes", mount: mountStickyNotes });
});
