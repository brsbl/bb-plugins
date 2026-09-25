import { definePluginApp } from "@get-bb/plugin-sdk/app";

import "./app.css";
import { Desktop, toggleDesktop } from "./desktop";

export default definePluginApp((app) => {
  app.slots.homepageSection({
    id: "desktop",
    title: "Desktop",
    component: () => <Desktop />,
  });
  app.slots.sidebarFooterAction({
    id: "toggle",
    title: "Turn Desktop on or off",
    icon: "AppWindow",
    run: toggleDesktop,
  });
});
