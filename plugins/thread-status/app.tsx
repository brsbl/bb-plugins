import { definePluginApp } from "@get-bb/plugin-sdk/app";

import { mountSidebarPills } from "./sidebar-pills.js";
import "./app.css";

export default definePluginApp((app) => {
  app.contentScripts.register({ id: "sidebar-pills", mount: mountSidebarPills });
});
