import { definePluginApp } from "@get-bb/plugin-sdk/app";
import { PlacesMap } from "./map";
import "./app.css";

export default definePluginApp((app) => {
  app.slots.threadPanelAction({ id: "map", title: "Saved Places", icon: "saved-places/map", layout: "flush", component: PlacesMap });
  app.slots.navPanel({ id: "map", title: "Saved Places", icon: "saved-places/map", path: "map", component: PlacesMap });
});
