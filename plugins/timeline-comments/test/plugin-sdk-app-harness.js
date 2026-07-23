// src/testing/app.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from "react";
import { act, render } from "@testing-library/react";

// src/internal/composer-view.ts
function isComposerDraftEmpty(text, attachmentCount) {
  return text.trim().length === 0 && attachmentCount === 0;
}

// src/internal/composer-customization-validation.ts
var PLUGIN_SLOT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
var PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
function requireSlotId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_SLOT_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "id" must match ${String(PLUGIN_SLOT_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireMessageDirectiveId(kind, value) {
  if (typeof value !== "string" || !PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN.test(value)) {
    throw new Error(
      `${kind}: "id" must match ${String(PLUGIN_MESSAGE_DIRECTIVE_ID_PATTERN)}, got ${JSON.stringify(value)}`
    );
  }
  return value;
}
function requireNonEmptyString(kind, field, value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${kind}: "${field}" must be a non-empty string`);
  }
  return value;
}
function requireOptionalString(kind, field, value) {
  if (value !== void 0 && typeof value !== "string") {
    throw new Error(`${kind}: "${field}" must be a string when set`);
  }
  return value;
}
function requireComponent(kind, value) {
  if (typeof value !== "function") {
    throw new Error(`${kind}: "component" must be a React component function`);
  }
  return value;
}
function requireFunction(kind, field, value) {
  if (typeof value !== "function") {
    throw new Error(`${kind}: "${field}" must be a function`);
  }
  return value;
}
function requireUniqueId(kind, seen, id) {
  if (seen.has(id)) {
    throw new Error(`${kind}: duplicate id "${id}"`);
  }
  seen.add(id);
}
function parseContributionArray(kind, value, onRejected, parse) {
  if (value === void 0) return void 0;
  if (!Array.isArray(value)) {
    onRejected(`${kind}: must be an array when set`);
    return void 0;
  }
  const seenIds = /* @__PURE__ */ new Set();
  const parsed = [];
  for (const [index, entry] of value.entries()) {
    const entryKind = `${kind}[${index}]`;
    try {
      const parsedEntry = parse(entryKind, entry);
      requireUniqueId(entryKind, seenIds, parsedEntry.id);
      parsed.push(parsedEntry);
    } catch (error) {
      onRejected(error instanceof Error ? error.message : String(error));
    }
  }
  return parsed;
}
function parseRegions(kind, registration, onRejected) {
  const actions = parseContributionArray(`${kind}.actions`, registration.actions, onRejected, (entryKind, value) => {
    const entry = value;
    return {
      id: requireSlotId(entryKind, entry?.id),
      component: requireComponent(entryKind, entry?.component)
    };
  });
  const banners = parseContributionArray(`${kind}.banners`, registration.banners, onRejected, (entryKind, value) => {
    const entry = value;
    const id = requireSlotId(entryKind, entry?.id);
    const chrome = entry?.chrome;
    if (chrome !== void 0 && chrome !== "card" && chrome !== "bare") {
      throw new Error(
        `${entryKind}: "chrome" must be "card" or "bare" when set`
      );
    }
    return {
      id,
      ...chrome !== void 0 ? { chrome } : {},
      component: requireComponent(entryKind, entry?.component)
    };
  });
  const plusMenu = parseContributionArray(
    `${kind}.plusMenu`,
    registration.plusMenu,
    onRejected,
    (entryKind, value) => {
      const entry = value;
      const id = requireSlotId(entryKind, entry?.id);
      const icon = requireOptionalString(entryKind, "icon", entry?.icon);
      const description = requireOptionalString(
        entryKind,
        "description",
        entry?.description
      );
      const disabled = entry?.disabled;
      if (disabled !== void 0 && typeof disabled !== "boolean" && typeof disabled !== "function") {
        throw new Error(
          `${entryKind}: "disabled" must be a boolean or function when set`
        );
      }
      return {
        id,
        label: requireNonEmptyString(entryKind, "label", entry?.label),
        ...icon !== void 0 ? { icon } : {},
        ...description !== void 0 ? { description } : {},
        ...disabled !== void 0 ? {
          disabled
        } : {},
        run: requireFunction(entryKind, "run", entry?.run)
      };
    }
  );
  let richText;
  if (registration.richText !== void 0) {
    const raw = registration.richText;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      onRejected(`${kind}.richText: must be an object when set`);
    } else {
      const effects = parseContributionArray(
        `${kind}.richText.effects`,
        raw.effects,
        onRejected,
        (entryKind, value) => {
          const entry = value;
          return {
            id: requireSlotId(entryKind, entry?.id),
            match: requireFunction(entryKind, "match", entry?.match),
            className: requireNonEmptyString(
              entryKind,
              "className",
              entry?.className
            )
          };
        }
      );
      const onDraftChange = raw.onDraftChange;
      if (onDraftChange !== void 0 && typeof onDraftChange !== "function") {
        onRejected(
          `${kind}.richText: "onDraftChange" must be a function when set`
        );
      }
      richText = {
        ...effects !== void 0 ? { effects } : {},
        ...typeof onDraftChange === "function" ? {
          onDraftChange
        } : {}
      };
    }
  }
  return {
    ...actions !== void 0 ? { actions } : {},
    ...banners !== void 0 ? { banners } : {},
    ...plusMenu !== void 0 ? { plusMenu } : {},
    ...richText !== void 0 ? { richText } : {}
  };
}
function collectComposerCustomization(registration, seenIds, onRejected) {
  const kind = "composer.customize";
  try {
    const raw = registration;
    const id = requireSlotId(kind, raw?.id);
    const scopes = raw?.scopes;
    if (scopes !== void 0) {
      if (!Array.isArray(scopes)) {
        throw new Error(`${kind}: "scopes" must be an array when set`);
      }
      for (const scope of scopes) {
        if (scope !== "thread" && scope !== "queued-message" && scope !== "side-chat" && scope !== "new-thread") {
          throw new Error(
            `${kind}: invalid scope kind ${JSON.stringify(scope)}`
          );
        }
      }
    }
    requireUniqueId(kind, seenIds, id);
    return {
      id,
      ...scopes !== void 0 ? { scopes: [...scopes] } : {},
      ...parseRegions(`${kind}(${id})`, raw ?? {}, onRejected)
    };
  } catch (error) {
    onRejected(error instanceof Error ? error.message : String(error));
    return null;
  }
}

// src/testing/app.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function SlotLifecycleGuard({
  children,
  onUnmount
}) {
  useEffect(() => () => onUnmount(), [onUnmount]);
  return children;
}
var SlotEnvContext = createContext(null);
function useSlotEnv(hook) {
  const env = useContext(SlotEnvContext);
  if (!env) {
    throw new Error(
      `${hook}() needs the test slot environment \u2014 mount the component via renderSlot(...) from @bb/plugin-sdk/testing/app`
    );
  }
  return env;
}
function definePluginApp(setup) {
  if (typeof setup !== "function") {
    throw new Error("definePluginApp expects a setup function");
  }
  return Object.freeze({ __bbPluginApp: true, setup });
}
function isPluginAppDefinition(value) {
  return typeof value === "object" && value !== null && value.__bbPluginApp === true && typeof value.setup === "function";
}
function TestThreadChat({
  threadId,
  variant = "full",
  layout = "contained",
  focusRequest,
  className,
  leadingContent,
  messageActions
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-testid": "bb-thread-chat",
      "data-thread-id": threadId,
      "data-variant": variant,
      "data-layout": layout,
      "data-focus-request": focusRequest ?? 0,
      "data-message-actions": (messageActions ?? []).map((action) => action.id).join(" "),
      className,
      children: [
        leadingContent === void 0 ? null : /* @__PURE__ */ jsx("div", { "data-testid": "bb-thread-chat-leading-content", children: leadingContent }),
        "ThreadChat stub (",
        threadId,
        ")",
        (messageActions ?? []).map((action) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "data-testid": `bb-thread-chat-action-${action.id}`,
            "data-roles": action.roles === void 0 ? "" : action.roles.join(" "),
            onClick: () => {
              void action.run({
                id: "test-message",
                threadId,
                role: action.roles?.[0] ?? "assistant",
                text: "test message text",
                sourceSeqEnd: 1
              });
            },
            children: action.title
          },
          action.id
        ))
      ]
    }
  );
}
function TestMarkdown({ content, className }) {
  return /* @__PURE__ */ jsx("div", { "data-testid": "bb-markdown", className, children: content });
}
var testPluginSdkApp = {
  definePluginApp,
  useRpc() {
    return useSlotEnv("useRpc").rpcClient;
  },
  useRealtime(channel, handler) {
    const env = useSlotEnv("useRealtime");
    const handlerRef = useRef(handler);
    useEffect(() => {
      handlerRef.current = handler;
    });
    useEffect(() => {
      const listener = (payload) => handlerRef.current(payload);
      let listeners = env.realtimeHandlers.get(channel);
      if (!listeners) {
        listeners = /* @__PURE__ */ new Set();
        env.realtimeHandlers.set(channel, listeners);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, [env, channel]);
  },
  useRealtimeConnectionState() {
    const connection = useSlotEnv(
      "useRealtimeConnectionState"
    ).realtimeConnection;
    return useSyncExternalStore(
      connection.subscribe,
      connection.getSnapshot,
      connection.getSnapshot
    );
  },
  useSettings() {
    return useSlotEnv("useSettings").settingsState;
  },
  useBbContext() {
    return useSlotEnv("useBbContext").bbContext;
  },
  useBbNavigate() {
    return useSlotEnv("useBbNavigate").navigate;
  },
  useComposer() {
    const composer = useSlotEnv("useComposer").composer;
    const version = useSyncExternalStore(
      composer.subscribe,
      composer.getVersionSnapshot,
      composer.getVersionSnapshot
    );
    return useMemo(
      () => ({
        ...composer.api,
        scope: composer.getScope(),
        text: composer.getText()
      }),
      [composer, version]
    );
  },
  experimental_ThreadChat: TestThreadChat,
  experimental_Markdown: TestMarkdown,
  useComposerView() {
    const composer = useSlotEnv("useComposerView").composer;
    const version = useSyncExternalStore(
      composer.subscribe,
      composer.getVersionSnapshot,
      composer.getVersionSnapshot
    );
    return useMemo(() => {
      const text = composer.getText();
      const attachmentCount = composer.getAttachmentCount();
      return {
        scope: composer.getScope(),
        layout: "expanded",
        draft: {
          text,
          isEmpty: isComposerDraftEmpty(text, attachmentCount),
          attachmentCount
        },
        run: { isRunning: false, isSubmitting: false }
      };
    }, [composer, version]);
  }
};
function installTestPluginRuntime() {
  const host = globalThis;
  host.__bbPluginRuntime = {
    ...host.__bbPluginRuntime,
    pluginSdkApp: testPluginSdkApp
  };
}
function collectRegistrations(definition) {
  const captured = {
    homepageSections: [],
    settingsSections: [],
    navPanels: [],
    threadPanelActions: [],
    composerCustomizations: [],
    pendingInteractions: [],
    sidebarFooterActions: [],
    fileOpeners: [],
    messageDirectives: [],
    messageActions: [],
    contentScripts: []
  };
  const seenIds = {
    homepageSection: /* @__PURE__ */ new Set(),
    settingsSection: /* @__PURE__ */ new Set(),
    navPanel: /* @__PURE__ */ new Set(),
    threadPanelAction: /* @__PURE__ */ new Set(),
    composerCustomization: /* @__PURE__ */ new Set(),
    pendingInteraction: /* @__PURE__ */ new Set(),
    sidebarFooterAction: /* @__PURE__ */ new Set(),
    fileOpener: /* @__PURE__ */ new Set(),
    messageDirective: /* @__PURE__ */ new Set(),
    messageAction: /* @__PURE__ */ new Set(),
    contentScript: /* @__PURE__ */ new Set()
  };
  definition.setup({
    slots: {
      homepageSection(registration) {
        const kind = "slots.homepageSection";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.homepageSection, id);
        captured.homepageSections.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          component: requireComponent(kind, registration.component)
        });
      },
      settingsSection(registration) {
        const kind = "slots.settingsSection";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.settingsSection, id);
        const title = requireOptionalString(kind, "title", registration.title);
        const description = requireOptionalString(
          kind,
          "description",
          registration.description
        );
        captured.settingsSections.push({
          id,
          ...title !== void 0 ? { title } : {},
          ...description !== void 0 ? { description } : {},
          component: requireComponent(kind, registration.component)
        });
      },
      navPanel(registration) {
        const kind = "slots.navPanel";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.navPanel, id);
        const path = requireNonEmptyString(kind, "path", registration.path);
        if (!PLUGIN_SLOT_ID_PATTERN.test(path)) {
          throw new Error(
            `${kind}: "path" must match ${String(PLUGIN_SLOT_ID_PATTERN)} (it becomes a URL segment), got ${JSON.stringify(path)}`
          );
        }
        if (registration.headerContent !== void 0 && typeof registration.headerContent !== "function") {
          throw new Error(
            `${kind}: "headerContent" must be a React component function when set`
          );
        }
        captured.navPanels.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          icon: requireNonEmptyString(kind, "icon", registration.icon),
          path,
          component: requireComponent(kind, registration.component),
          ...registration.headerContent !== void 0 ? { headerContent: registration.headerContent } : {}
        });
      },
      threadPanelAction(registration) {
        const kind = "slots.threadPanelAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.threadPanelAction, id);
        if (registration.run !== void 0 && typeof registration.run !== "function") {
          throw new Error(`${kind}: "run" must be a function when set`);
        }
        if (registration.layout !== void 0 && registration.layout !== "padded" && registration.layout !== "flush") {
          throw new Error(`${kind}: "layout" must be "padded" or "flush"`);
        }
        captured.threadPanelActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          ...registration.icon !== void 0 ? { icon: requireNonEmptyString(kind, "icon", registration.icon) } : {},
          component: requireComponent(kind, registration.component),
          ...registration.layout !== void 0 ? { layout: registration.layout } : {},
          ...registration.run !== void 0 ? { run: registration.run } : {}
        });
      },
      pendingInteraction(registration) {
        const kind = "slots.pendingInteraction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.pendingInteraction, id);
        captured.pendingInteractions.push({
          id,
          component: requireComponent(kind, registration.component)
        });
      },
      sidebarFooterAction(registration) {
        const kind = "slots.sidebarFooterAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.sidebarFooterAction, id);
        if (typeof registration.run !== "function") {
          throw new Error(`${kind}: "run" must be a function`);
        }
        captured.sidebarFooterActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          icon: requireNonEmptyString(kind, "icon", registration.icon),
          run: registration.run
        });
      },
      fileOpener(registration) {
        const kind = "slots.fileOpener";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.fileOpener, id);
        const rawExtensions = registration?.extensions;
        if (!Array.isArray(rawExtensions) || rawExtensions.length === 0) {
          throw new Error(
            `${kind}: "extensions" must be a non-empty array of lowercase extensions without the dot`
          );
        }
        const extensions = rawExtensions.map((extension) => {
          if (typeof extension !== "string" || !/^[a-z0-9]+$/.test(extension)) {
            throw new Error(
              `${kind}: extensions must be lowercase alphanumerics without the dot, got ${JSON.stringify(extension)}`
            );
          }
          return extension;
        });
        captured.fileOpeners.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          extensions,
          component: requireComponent(kind, registration.component)
        });
      },
      messageDirective(registration) {
        const kind = "slots.messageDirective";
        const id = requireMessageDirectiveId(kind, registration?.id);
        requireUniqueId(kind, seenIds.messageDirective, id);
        captured.messageDirectives.push({
          id,
          component: requireComponent(kind, registration.component)
        });
      },
      experimental_messageAction(registration) {
        const kind = "slots.experimental_messageAction";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.messageAction, id);
        if (typeof registration.run !== "function") {
          throw new Error(`${kind}: "run" must be a function`);
        }
        const rawPlacements = registration.placements;
        let placements;
        if (rawPlacements !== void 0) {
          if (!Array.isArray(rawPlacements) || rawPlacements.length === 0) {
            throw new Error(
              `${kind}: "placements" must be a non-empty array when set`
            );
          }
          placements = [];
          for (const placement of rawPlacements) {
            if (placement !== "action-bar" && placement !== "selection-menu") {
              throw new Error(
                `${kind}: "placements" entries must be "action-bar" or "selection-menu"`
              );
            }
            if (placements.includes(placement)) {
              throw new Error(
                `${kind}: "placements" must not contain duplicates`
              );
            }
            placements.push(placement);
          }
        }
        captured.messageActions.push({
          id,
          title: requireNonEmptyString(kind, "title", registration.title),
          ...registration.icon !== void 0 ? { icon: requireNonEmptyString(kind, "icon", registration.icon) } : {},
          ...placements !== void 0 ? { placements } : {},
          run: registration.run
        });
      }
    },
    composer: {
      customize(registration) {
        const customization = collectComposerCustomization(
          registration,
          seenIds.composerCustomization,
          (reason) => console.warn(reason)
        );
        if (customization !== null) {
          captured.composerCustomizations.push(customization);
        }
      }
    },
    experimental_contentScripts: {
      register(registration) {
        const kind = "experimental_contentScripts.register";
        const id = requireSlotId(kind, registration?.id);
        requireUniqueId(kind, seenIds.contentScript, id);
        if (typeof registration.mount !== "function") {
          throw new Error(`${kind}: "mount" must be a function`);
        }
        captured.contentScripts.push({ id, mount: registration.mount });
      }
    }
  });
  return captured;
}
async function loadPluginApp(source) {
  installTestPluginRuntime();
  const resolved = typeof source === "function" ? await source() : source;
  const definition = isPluginAppDefinition(resolved) ? resolved : resolved.default;
  if (!isPluginAppDefinition(definition)) {
    throw new Error(
      "the bundle's default export is not definePluginApp(...) from @bb/plugin-sdk/app"
    );
  }
  return collectRegistrations(definition);
}
async function mountPluginContentScripts(app, options) {
  const controller = new AbortController();
  const generation = options.generation ?? 1;
  const mounted = [];
  const rpcCalls = [];
  const navigateCalls = [];
  const realtimeHandlers = /* @__PURE__ */ new Map();
  const connectionStateHandlers = /* @__PURE__ */ new Set();
  let connectionState = options.realtimeConnectionState ?? "connected";
  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    for (const script of [...mounted].reverse()) {
      if (script.dispose === null) continue;
      try {
        await script.dispose();
      } catch (error) {
        console.warn(
          `[plugin:${options.pluginId}] content script "${script.id}" cleanup failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  };
  try {
    for (const registration of app.contentScripts) {
      const rpc = {
        async call(method, input) {
          rpcCalls.push({ method, input: input ?? null });
          const handler = options.rpc?.[method];
          if (handler === void 0) {
            throw new Error(`No content-script RPC handler for "${method}"`);
          }
          return handler(input ?? null);
        }
      };
      const result = await registration.mount({
        pluginId: options.pluginId,
        generation,
        signal: controller.signal,
        rpc,
        realtime: {
          subscribe(channel, handler) {
            const handlers = realtimeHandlers.get(channel) ?? /* @__PURE__ */ new Set();
            handlers.add(handler);
            realtimeHandlers.set(channel, handlers);
            let active = true;
            const unsubscribe = () => {
              if (!active) return;
              active = false;
              handlers.delete(handler);
              if (handlers.size === 0) realtimeHandlers.delete(channel);
            };
            controller.signal.addEventListener("abort", unsubscribe, {
              once: true
            });
            return unsubscribe;
          },
          getConnectionState: () => connectionState,
          subscribeConnectionState(handler) {
            connectionStateHandlers.add(handler);
            let active = true;
            const unsubscribe = () => {
              if (!active) return;
              active = false;
              connectionStateHandlers.delete(handler);
            };
            controller.signal.addEventListener("abort", unsubscribe, {
              once: true
            });
            return unsubscribe;
          }
        },
        navigate: {
          toCompose(navigateOptions) {
            navigateCalls.push({
              method: "toCompose",
              ...navigateOptions !== void 0 ? { options: navigateOptions } : {}
            });
          }
        }
      });
      if (result !== void 0 && typeof result !== "function") {
        throw new Error(
          `content script "${registration.id}" mount must return a cleanup function, a promise of one, or nothing`
        );
      }
      mounted.push({ id: registration.id, dispose: result ?? null });
    }
  } catch (error) {
    await dispose();
    throw error;
  }
  return {
    inspection: {
      get mountedIds() {
        return mounted.map(({ id }) => id);
      },
      signal: controller.signal,
      get disposed() {
        return disposed;
      },
      rpcCalls,
      navigateCalls
    },
    behavior: {
      publishRealtime(channel, payload) {
        for (const handler of realtimeHandlers.get(channel) ?? []) {
          handler(payload);
        }
      },
      setRealtimeConnectionState(state) {
        connectionState = state;
        for (const handler of connectionStateHandlers) handler(state);
      }
    },
    lifecycle: { dispose }
  };
}
function strictJsonRoundTrip(value, label) {
  const ancestors = /* @__PURE__ */ new Set();
  function visit(current, path) {
    if (current === null || typeof current === "string" || typeof current === "boolean") {
      return;
    }
    if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        throw new Error(`${label} at ${path} contains a non-finite number`);
      }
      return;
    }
    if (typeof current !== "object") {
      throw new Error(`${label} at ${path} is not a JSON value`);
    }
    if (ancestors.has(current)) {
      throw new Error(`${label} at ${path} is cyclic`);
    }
    ancestors.add(current);
    try {
      if (Array.isArray(current)) {
        current.forEach((item, index) => visit(item, `${path}[${index}]`));
        return;
      }
      const prototype = Object.getPrototypeOf(current);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new Error(`${label} at ${path} must be a plain JSON object`);
      }
      if (Reflect.ownKeys(current).some((key) => typeof key === "symbol")) {
        throw new Error(`${label} at ${path} contains a symbol key`);
      }
      for (const [key, child] of Object.entries(current)) {
        visit(child, `${path}.${key}`);
      }
    } finally {
      ancestors.delete(current);
    }
  }
  visit(value, "$");
  return JSON.parse(JSON.stringify(value));
}
function renderSlot(registration, props, options = {}) {
  const rpcCalls = [];
  const rpcHandlers = options.rpc ?? {};
  const rpcClient = {
    async call(method, input) {
      const normalizedInput = input === void 0 ? null : strictJsonRoundTrip(input, `rpc "${method}" input`);
      rpcCalls.push({ method, input: normalizedInput });
      const handler = rpcHandlers[method];
      if (!handler) {
        throw new Error(
          `no rpc handler for "${method}" \u2014 add it to renderSlot options.rpc`
        );
      }
      const result2 = await handler(normalizedInput);
      return strictJsonRoundTrip(result2, `rpc "${method}" result`);
    }
  };
  const realtimeHandlers = /* @__PURE__ */ new Map();
  let realtimeConnectionState = options.realtimeConnectionState ?? "connected";
  const realtimeConnectionListeners = /* @__PURE__ */ new Set();
  const realtimeConnection = {
    getSnapshot: () => realtimeConnectionState,
    subscribe(listener) {
      realtimeConnectionListeners.add(listener);
      return () => realtimeConnectionListeners.delete(listener);
    },
    setState(state) {
      if (state === realtimeConnectionState) return;
      realtimeConnectionState = state;
      for (const listener of realtimeConnectionListeners) listener();
    }
  };
  const navigateCalls = [];
  const navigate = {
    toThread(threadId2) {
      navigateCalls.push({ method: "toThread", threadId: threadId2 });
    },
    toProject(projectId2) {
      navigateCalls.push({ method: "toProject", projectId: projectId2 });
    },
    toPluginPanel(path, panelOptions) {
      navigateCalls.push({
        method: "toPluginPanel",
        path,
        ...panelOptions !== void 0 ? { options: panelOptions } : {}
      });
    },
    toCompose(composeOptions) {
      navigateCalls.push({
        method: "toCompose",
        ...composeOptions !== void 0 ? { options: composeOptions } : {}
      });
    },
    experimental_openThreadPanel(panelOptions) {
      navigateCalls.push({
        method: "experimental_openThreadPanel",
        options: panelOptions
      });
      return options.openThreadPanel?.(panelOptions) ?? false;
    }
  };
  const projectId = options.context?.projectId ?? null;
  const threadId = options.context?.threadId ?? null;
  let composerScope = options.composer?.scope ?? (threadId !== null ? { kind: "thread", threadId } : { kind: "new-thread", projectId });
  let composerText = options.composer?.text ?? "";
  const composerAttachmentCount = options.composer?.attachmentCount ?? 0;
  let composerVersion = 0;
  const composerListeners = /* @__PURE__ */ new Set();
  const notifyComposerListeners = () => {
    composerVersion += 1;
    for (const listener of composerListeners) listener();
  };
  const commitComposerText = (next) => {
    if (next === composerText) return;
    composerText = next;
    notifyComposerListeners();
  };
  const composerLog = {
    get text() {
      return composerText;
    },
    get scope() {
      return composerScope;
    },
    get attachmentCount() {
      return composerAttachmentCount;
    },
    textEffect: null,
    textEffectCalls: [],
    inputLocked: false,
    inputLockCalls: [],
    threadRowStatus: null,
    threadRowStatusCalls: [],
    quotes: [],
    mentions: [],
    focusCount: 0
  };
  const composerOwnership = { active: true };
  const composer = {
    getAttachmentCount: () => composerAttachmentCount,
    getScope: () => composerScope,
    getText: () => composerText,
    getVersionSnapshot: () => composerVersion,
    subscribe(listener) {
      composerListeners.add(listener);
      return () => composerListeners.delete(listener);
    },
    api: {
      setText(next) {
        commitComposerText(next);
      },
      updateText(updater) {
        commitComposerText(updater(composerText));
      },
      clear() {
        commitComposerText("");
      },
      setTextEffect(effect) {
        if (!composerOwnership.active) return;
        composerLog.textEffect = effect;
        composerLog.textEffectCalls.push(effect);
      },
      setInputLock(locked) {
        if (!composerOwnership.active) return;
        composerLog.inputLocked = locked;
        composerLog.inputLockCalls.push(locked);
      },
      setThreadRowStatus(status) {
        if (!composerOwnership.active || composerScope.kind === "new-thread") {
          return;
        }
        composerLog.threadRowStatus = status;
        composerLog.threadRowStatusCalls.push(status);
      },
      addQuote(text) {
        const trimmed = text.replace(/\r\n|\r/gu, "\n").trim();
        if (trimmed !== "") {
          const block = trimmed.split("\n").map((line) => line.length > 0 ? `> ${line}` : ">").join("\n");
          commitComposerText(
            composerText === "" ? `${block}
` : `${composerText}
${block}
`
          );
          composerLog.quotes.push(text);
        }
        composerLog.focusCount += 1;
      },
      insertMention(mention) {
        const label = mention.label.trim() || mention.id;
        const separator = composerText.length === 0 || /\s$/u.test(composerText) ? "" : " ";
        commitComposerText(`${composerText}${separator}${label} `);
        composerLog.mentions.push(mention);
        composerLog.focusCount += 1;
      },
      focus() {
        composerLog.focusCount += 1;
      }
    }
  };
  const env = {
    rpcClient,
    rpcCalls,
    realtimeHandlers,
    realtimeConnection,
    settingsState: { values: options.settings, isLoading: false },
    bbContext: { projectId, threadId },
    navigate,
    navigateCalls,
    composer,
    composerLog
  };
  const releaseComposerOwnership = () => {
    if (!composerOwnership.active) return;
    composerOwnership.active = false;
    composerLog.textEffect = null;
    composerLog.inputLocked = false;
    composerLog.threadRowStatus = null;
  };
  const renderSlotTree = (ui) => /* @__PURE__ */ jsx(SlotEnvContext.Provider, { value: env, children: /* @__PURE__ */ jsx(SlotLifecycleGuard, { onUnmount: releaseComposerOwnership, children: ui }) });
  const Component = registration.component;
  const element = renderSlotTree(/* @__PURE__ */ jsx(Component, { ...props }));
  const result = render(element);
  const rerenderSlot = (ui) => {
    result.rerender(renderSlotTree(ui));
  };
  const emitRealtime = async (channel, payload) => {
    const normalized = payload === void 0 ? null : strictJsonRoundTrip(payload, `realtime "${channel}" payload`);
    const listeners = realtimeHandlers.get(channel);
    await act(async () => {
      for (const listener of [...listeners ?? []]) {
        listener(normalized);
      }
    });
  };
  const setRealtimeConnectionState = async (state) => {
    await act(async () => realtimeConnection.setState(state));
  };
  const setComposerText = async (text) => {
    await act(async () => commitComposerText(text));
  };
  const setComposerScope = async (scope) => {
    await act(async () => {
      composerScope = scope;
      notifyComposerListeners();
    });
  };
  const unmountSlot = () => {
    if (!composerOwnership.active) return;
    result.unmount();
  };
  return {
    ...result,
    rerender: rerenderSlot,
    unmount: unmountSlot,
    rpcCalls,
    emitRealtime,
    setRealtimeConnectionState,
    setComposerText,
    setComposerScope,
    navigateCalls,
    composer: composerLog,
    behavior: {
      emitRealtime,
      setRealtimeConnectionState,
      setComposerText,
      setComposerScope
    },
    inspection: { rpcCalls, navigateCalls, composer: composerLog },
    lifecycle: { rerender: rerenderSlot, unmount: unmountSlot }
  };
}
export {
  installTestPluginRuntime,
  loadPluginApp,
  mountPluginContentScripts,
  renderSlot
};
