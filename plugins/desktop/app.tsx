import { definePluginApp } from "@get-bb/plugin-sdk/app";

import "./app.css";
import { Desktop } from "./desktop";

export default definePluginApp((app) => {
  app.slots.homepageSection({
    id: "desktop",
    title: "Desktop",
    component: () => <Desktop fill={false} />,
  });
  app.slots.navPanel({
    id: "desktop",
    title: "Desktop",
    icon: "Monitor",
    path: "desktop",
    component: () => <Desktop fill />,
  });
});
