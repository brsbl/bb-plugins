import { definePluginApp } from "@bb/plugin-sdk/app";

import { mountInboxSectionCollapser } from "./sidebar-controller.js";

export default definePluginApp((app) => {
  app.experimental_contentScripts.register({
    id: "collapse-unpinned-destination",
    mount: ({ signal }) => mountInboxSectionCollapser({ signal }),
  });
});
