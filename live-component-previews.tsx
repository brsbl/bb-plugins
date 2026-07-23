import {
  Component,
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import type { SourceRecord } from "./providers/source-browser-v2.js";
import { PREVIEW_CSS } from "./generated/preview-css.js";
import {
  loadShadcnDemo,
  shadcnDemoIds,
} from "./shadcn-demo-previews.js";
import { PreviewFrameProvider } from "./preview-frame-context.js";

interface EagerLivePreviewDefinition {
  sourceRecordId: string;
  runtimeLabel: string;
  delivery: "eager";
  component: ComponentType;
}

interface DeferredLivePreviewDefinition {
  sourceRecordId: string;
  runtimeLabel: string;
  delivery: "deferred";
  loadComponent: () => Promise<ComponentType>;
}

export type LivePreviewDefinition =
  | EagerLivePreviewDefinition
  | DeferredLivePreviewDefinition;

class PreviewErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          This upstream component failed to render. The rest of the library viewer is still available.
        </div>
      );
    }
    return this.props.children;
  }
}

function PreviewRenderer({
  definition,
}: {
  definition: LivePreviewDefinition;
}) {
  const [loadedComponent, setLoadedComponent] = useState<ComponentType | null>(
    definition.delivery === "eager" ? definition.component : null,
  );
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (definition.delivery === "eager") {
      setLoadedComponent(() => definition.component);
      setLoadFailed(false);
      return;
    }

    let active = true;
    setLoadedComponent(null);
    setLoadFailed(false);
    void definition.loadComponent().then(
      (component) => {
        if (active) setLoadedComponent(() => component);
      },
      () => {
        if (active) setLoadFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [definition]);

  if (loadFailed) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        This upstream component could not be loaded. The rest of the library viewer is still available.
      </div>
    );
  }

  const Preview =
    definition.delivery === "eager"
      ? definition.component
      : loadedComponent;
  return Preview ? (
    <Preview />
  ) : (
    <div className="grid min-h-72 place-items-center rounded-lg border border-border text-sm text-muted-foreground">
      Loading upstream component…
    </div>
  );
}

const shadcnPreviewDefinitions: readonly DeferredLivePreviewDefinition[] =
  shadcnDemoIds.map((sourceId) => ({
    sourceRecordId: `shadcn-ui:${sourceId}`,
    runtimeLabel: "shadcn/ui registry · d28738b",
    delivery: "deferred",
    loadComponent: () => loadShadcnDemo(sourceId),
  }));

export const livePreviewDefinitions = Object.freeze([
  ...shadcnPreviewDefinitions,
  {
    sourceRecordId: "assistant-ui:composer",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantComposerPreview,
  },
  {
    sourceRecordId: "assistant-ui:action-bar",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantActionBarPreview,
  },
  {
    sourceRecordId: "assistant-ui:message",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantMessagePreview,
  },
  {
    sourceRecordId: "assistant-ui:thread",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantThreadPreview,
  },
  {
    sourceRecordId: "assistant-ui:action-bar-more",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantActionBarMorePreview,
  },
  {
    sourceRecordId: "assistant-ui:assistant-if",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantIfPreview,
  },
  {
    sourceRecordId: "assistant-ui:assistant-modal",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantModalPreview,
  },
  {
    sourceRecordId: "assistant-ui:branch-picker",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantBranchPickerPreview,
  },
  {
    sourceRecordId: "assistant-ui:error",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantErrorPreview,
  },
  {
    sourceRecordId: "assistant-ui:message-part",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantMessagePartPreview,
  },
  {
    sourceRecordId: "assistant-ui:attachment",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantAttachmentPreview,
  },
  {
    sourceRecordId: "assistant-ui:chain-of-thought",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantChainOfThoughtPreview,
  },
  {
    sourceRecordId: "assistant-ui:suggestion",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantSuggestionPreview,
  },
  {
    sourceRecordId: "assistant-ui:thread-list",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantThreadListPreview,
  },
  {
    sourceRecordId: "assistant-ui:thread-list-item",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantThreadListPreview,
  },
  {
    sourceRecordId: "assistant-ui:thread-list-item-more",
    runtimeLabel: "@assistant-ui/react 0.14.27",
    delivery: "deferred",
    loadComponent: async () =>
      (await import("./assistant-ui-previews.js")).AssistantThreadListPreview,
  },
] as const satisfies readonly LivePreviewDefinition[]);

const previewBySourceRecordId = new Map<string, LivePreviewDefinition>(
  livePreviewDefinitions.map((preview) => [preview.sourceRecordId, preview]),
);

export const livePreviewSourceIds = Object.freeze(
  livePreviewDefinitions.map(({ sourceRecordId }) => sourceRecordId),
);

const galleryPreviewProviderIds = new Set(["assistant-ui", "shadcn-ui"]);

export const galleryPreviewSourceIds = Object.freeze(
  livePreviewSourceIds.filter((sourceRecordId) =>
    galleryPreviewProviderIds.has(sourceRecordId.split(":")[0] ?? ""),
  ),
);

export function hasLivePreview(sourceRecordId: string) {
  return previewBySourceRecordId.has(sourceRecordId);
}

export function hasGalleryPreview(sourceRecordId: string) {
  return (
    galleryPreviewProviderIds.has(sourceRecordId.split(":")[0] ?? "") &&
    previewBySourceRecordId.has(sourceRecordId)
  );
}

export function livePreviewsForRecords(records: readonly SourceRecord[]) {
  return records.flatMap((record) => {
    const preview = previewBySourceRecordId.get(record.id);
    return preview ? [{ record, preview }] : [];
  });
}

export function galleryPreviewsForRecords(records: readonly SourceRecord[]) {
  return records.flatMap((record) => {
    const preview = hasGalleryPreview(record.id)
      ? previewBySourceRecordId.get(record.id)
      : undefined;
    return preview ? [{ record, preview }] : [];
  });
}

const previewFrameMountKey = "__bbUiPatternsMountPreview";

type PreviewFrameMount = (
  documentBody: HTMLElement,
  sourceRecordId: string,
) => () => void;

const mountPreviewFrame: PreviewFrameMount = (documentBody, sourceRecordId) => {
  const definition = previewBySourceRecordId.get(sourceRecordId);
  if (!definition) {
    throw new Error(`No live preview is registered for ${sourceRecordId}`);
  }

  const frameDocument = documentBody.ownerDocument;
  const style = frameDocument.createElement("style");
  style.dataset.uiPatternsPreviewStyles = "";
  style.textContent = PREVIEW_CSS;
  frameDocument.head.append(style);

  frameDocument.documentElement.classList.add("style-nova");
  documentBody.classList.add("style-nova");
  documentBody.dataset.sourceRecordId = sourceRecordId;
  documentBody.innerHTML = "";

  const container = frameDocument.createElement("div");
  container.id = "ui-patterns-preview-root";
  documentBody.append(container);

  const root = createRoot(container);
  root.render(
    <PreviewFrameProvider container={documentBody}>
      <PreviewErrorBoundary>
        <PreviewRenderer definition={definition} />
      </PreviewErrorBoundary>
    </PreviewFrameProvider>,
  );

  return () => {
    queueMicrotask(() => {
      root.unmount();
      style.remove();
      container.remove();
    });
  };
};

if (typeof window !== "undefined") {
  Reflect.set(globalThis, previewFrameMountKey, mountPreviewFrame);
}

export function LiveComponentPreview({
  definition,
}: {
  definition: LivePreviewDefinition;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const teardownRef = useRef<(() => void) | null>(null);
  const themeObserverRef = useRef<MutationObserver | null>(null);
  const [frameFailed, setFrameFailed] = useState(false);
  const [frameReady, setFrameReady] = useState(false);

  const teardown = useCallback(() => {
    themeObserverRef.current?.disconnect();
    themeObserverRef.current = null;
    teardownRef.current?.();
    teardownRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const handleFrameLoad = useCallback(() => {
    teardown();
    setFrameFailed(false);
    setFrameReady(false);

    const frame = iframeRef.current;
    if (!frame) {
      setFrameFailed(true);
      return;
    }

    try {
      const frameWindow = frame.contentWindow;
      const frameDocument = frame.contentDocument;
      const pluginRuntime = Reflect.get(globalThis, "__bbPluginRuntime");
      if (!frameWindow || !frameDocument || !pluginRuntime) {
        setFrameFailed(true);
        return;
      }

      Reflect.set(frameWindow, "__bbPluginRuntime", pluginRuntime);

      const syncTheme = () => {
        const dark = document.documentElement.classList.contains("dark");
        frameDocument.documentElement.classList.toggle("dark", dark);
        frameDocument.documentElement.style.colorScheme = dark ? "dark" : "light";
      };
      syncTheme();
      const themeObserver = new MutationObserver(syncTheme);
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "style"],
      });
      themeObserverRef.current = themeObserver;

      const script = frameDocument.createElement("script");
      script.type = "module";
      script.src = import.meta.url;
      script.addEventListener("load", () => {
        try {
          const mount = Reflect.get(frameWindow, previewFrameMountKey);
          if (typeof mount !== "function") {
            setFrameFailed(true);
            return;
          }
          teardownRef.current = (mount as PreviewFrameMount)(
            frameDocument.body,
            definition.sourceRecordId,
          );
          setFrameReady(true);
        } catch {
          setFrameReady(false);
          setFrameFailed(true);
        }
      });
      script.addEventListener("error", () => {
        setFrameReady(false);
        setFrameFailed(true);
      });
      frameDocument.head.append(script);
    } catch {
      setFrameReady(false);
      setFrameFailed(true);
    }
  }, [definition.sourceRecordId, teardown]);

  return (
    <div
      className="grid gap-2"
      data-live-component-preview=""
      data-source-record-id={definition.sourceRecordId}
      data-preview-size="detail"
    >
      {frameFailed ? (
        <div
          className="grid min-h-80 place-items-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
        >
          This approved-source preview could not start. The rest of the library viewer is still available.
        </div>
      ) : (
        <div className="relative">
          <iframe
            ref={iframeRef}
            title={`${definition.sourceRecordId} interactive preview`}
            loading="eager"
            className="h-[clamp(22rem,58vh,40rem)] w-full rounded-xl border border-border bg-background"
            srcDoc="<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><base target='_blank'></head><body></body></html>"
            onLoad={handleFrameLoad}
          />
          {!frameReady ? (
            <div
              className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl border border-border bg-background text-sm text-muted-foreground"
              role="status"
            >
              Loading upstream component…
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
