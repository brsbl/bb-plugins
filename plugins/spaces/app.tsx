import { definePluginApp } from "@get-bb/plugin-sdk/app";

import { MoreController } from "./components/more-controller";
import { SpacePanel } from "./components/space-panel";
import { PANEL_ACTION_ID } from "./shared";

export default definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: PANEL_ACTION_ID,
    title: "Space",
    icon: "Layers",
    component: SpacePanel,
    layout: "flush",
  });
  app.slots.experimental_appOverlay({
    id: "more-controller",
    component: MoreController,
  });
});
