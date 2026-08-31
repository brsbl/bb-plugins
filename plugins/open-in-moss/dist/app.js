// bb-plugin-runtime-shim:@get-bb/plugin-sdk/app
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.pluginSdkApp == null) {
  throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.pluginSdkApp;
var {
  Markdown,
  ThreadChat,
  definePluginApp,
  experimental_NewThreadComposer,
  experimental_useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest,
  experimental_useSidebarThreadSplit,
  experimental_useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useComposer,
  useComposerView,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSettings
} = mod;

// bb-plugin-runtime-shim:sonner
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.sonner == null) {
  throw new Error('Cannot load "sonner": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.sonner;
var {
  Toaster,
  toast,
  useSonner
} = mod2;

// app.tsx
var MARKDOWN_EXTENSION = /\.(?:md|markdown)$/iu;
var fallbackEvents = /* @__PURE__ */ new WeakSet();
function markdownFileLinkFromClick(event) {
  if (event.button !== 0 || event.defaultPrevented) {
    return null;
  }
  const anchor = event.composedPath().find(
    (target) => target instanceof HTMLAnchorElement
  );
  if (!anchor) return null;
  let url;
  try {
    url = new URL(anchor.href);
  } catch {
    return null;
  }
  if (url.protocol !== "file:" || url.hostname !== "" || url.search !== "") {
    return null;
  }
  let filePath;
  try {
    filePath = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (!filePath.startsWith("/") || !MARKDOWN_EXTENSION.test(filePath)) {
    return null;
  }
  return { anchor, path: filePath };
}
function openInBb(anchor) {
  if (!anchor.isConnected) return false;
  const fallbackEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    button: 0
  });
  fallbackEvents.add(fallbackEvent);
  return !anchor.dispatchEvent(fallbackEvent);
}
async function requestMossOpen(pluginId, link) {
  try {
    const response = await fetch(
      `/api/v1/plugins/${encodeURIComponent(pluginId)}/http/open`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: link.path })
      }
    );
    if (!response.ok) throw new Error("Moss did not accept the file");
  } catch {
    const openedInBb = openInBb(link.anchor);
    toast.error("Moss couldn\u2019t open this file", {
      description: openedInBb ? "It was opened in bb instead." : "Right-click the link to choose another app."
    });
  }
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "open-markdown-links",
    mount({ pluginId }) {
      const handleClick = (event) => {
        if (fallbackEvents.has(event)) return;
        const link = markdownFileLinkFromClick(event);
        if (link === null) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void requestMossOpen(pluginId, link);
      };
      document.addEventListener("click", handleClick, true);
      return () => document.removeEventListener("click", handleClick, true);
    }
  });
});
export {
  app_default as default
};
