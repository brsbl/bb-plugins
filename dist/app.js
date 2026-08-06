// bb-plugin-runtime-shim:react
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.react == null) {
  throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.react;
var {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cache,
  cacheSignal,
  captureOwnerStack,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_useCacheRefresh,
  use,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version
} = mod;

// bb-plugin-runtime-shim:@bb/plugin-sdk/app
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.pluginSdkApp == null) {
  throw new Error('Cannot load "@bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.pluginSdkApp;
var {
  Markdown,
  ThreadChat,
  definePluginApp,
  useBbContext,
  useBbNavigate,
  useComposer,
  useComposerView,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSettings
} = mod2;

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod3 = runtime3.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod3;

// app.tsx
function MossThreadFolders({ threadId }) {
  const rpc = useRpc();
  const connectionState = useRealtimeConnectionState();
  const previousConnectionState = useRef(connectionState);
  const hasConnected = useRef(connectionState !== "connecting");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await rpc.call("openThread", { threadId });
      setData(await rpc.call("listFolders"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read Moss folders.");
    } finally {
      setIsLoading(false);
    }
  }, [rpc, threadId]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("folders-changed", () => {
    void load();
  });
  useEffect(() => {
    const previous = previousConnectionState.current;
    previousConnectionState.current = connectionState;
    if (connectionState !== "connected" || previous === "connected") return;
    if (hasConnected.current) void load();
    hasConnected.current = true;
  }, [connectionState, load]);
  return /* @__PURE__ */ jsx("main", { className: "h-full overflow-y-auto p-4 md:p-5", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-3xl space-y-4", children: [
    /* @__PURE__ */ jsx("section", { className: "rounded-lg border border-border bg-card p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-foreground", children: "Default Moss workspace" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 truncate font-mono text-xs text-muted-foreground", children: data?.root ?? "~/Moss/Notes/bb Threads" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50",
          disabled: isLoading,
          onClick: () => void load(),
          children: "Refresh"
        }
      )
    ] }) }),
    error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "rounded-lg border border-destructive/40 p-4 text-sm text-destructive", children: error }) : isLoading && data === null ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-muted-foreground", children: "Reading Moss folders\u2026" }) : data && data.folders.active.length === 0 && data.folders.archived.length === 0 && data.folders.deleted.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-sm text-muted-foreground", children: "No bb thread folders yet." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: data && Object.entries(data.folders).map(
      ([state, folders]) => folders.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xs font-medium uppercase tracking-wide text-muted-foreground", children: state }),
        /* @__PURE__ */ jsx("ul", { "aria-label": `${state} bb thread folders`, className: "space-y-2", children: folders.map((folder) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("div", { className: "rounded-lg border border-border bg-card p-4", children: /* @__PURE__ */ jsx("span", { className: "block font-mono text-sm text-foreground", children: folder }) }) }, folder)) })
      ] }, state) : null
    ) })
  ] }) });
}
var app_default = definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "moss-notes",
    title: "Moss Notes",
    icon: "Folder",
    layout: "padded",
    component: MossThreadFolders
  });
});
export {
  app_default as default
};
