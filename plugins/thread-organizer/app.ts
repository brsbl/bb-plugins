import {
  definePluginApp,
  type PluginAppContentScripts,
} from "@bb/plugin-sdk/app";

import { mountInboxSectionCollapser } from "./sidebar-controller.js";

interface ContentScriptCompatibleApp {
  readonly contentScripts?: PluginAppContentScripts;
  readonly experimental_contentScripts?: PluginAppContentScripts;
}

export default definePluginApp((app: ContentScriptCompatibleApp) => {
  const contentScripts =
    app.contentScripts ?? app.experimental_contentScripts;
  if (contentScripts === undefined) {
    throw new Error("BB does not expose the content scripts plugin API");
  }
  contentScripts.register({
    id: "collapse-unpinned-destination",
    mount: ({ signal }) => mountInboxSectionCollapser({ signal }),
  });
});
