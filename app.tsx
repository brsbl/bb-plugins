import { definePluginApp } from "@get-bb/plugin-sdk/app";

import { AmbientOverlay } from "./overlay.js";
import { AmbientControls } from "./panel.js";

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: "ambient", component: AmbientOverlay });
  app.experimental_sidebarFooter.register({
    kind: "disclosure",
    id: "controls",
    label: "Ambient",
    icon: "ambient/ambient",
    component: AmbientControls,
  });
});
