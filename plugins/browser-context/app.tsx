import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  definePluginApp,
  useComposer,
  useRpc,
  type PluginAppSlots,
  type PluginBrowserActionProps,
} from "@bb/plugin-sdk/app";

import type { rpcContract } from "./server.js";
import "./app.css";

interface BrowserContextCompatibleSlots {
  experimental_browserAction?: PluginAppSlots["experimental_browserAction"];
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Browser Context could not complete that request.";
}

function CrosshairIcon({ busy = false }: { busy?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={busy ? "bb-browser-context-spin" : undefined}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="M10 10h4v4h-4z" />
    </svg>
  );
}

function BrowserContextAction(props: PluginBrowserActionProps) {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const addAttachment = composer.experimental_addAttachment;
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectionRef = useRef<AbortController | null>(null);

  const hasThread = props.threadId !== null && props.projectId !== null;
  const supported =
    props.experimental_inspectionAvailable && addAttachment !== undefined;
  const canStart = supported && hasThread && props.url.length > 0;
  const disabledReason = !supported
    ? "Browser page inspection requires a newer BB desktop app."
    : !hasThread
      ? "Open the Browser from a thread to add page context to its composer."
      : props.url.length === 0
        ? "Open a page before selecting context."
        : null;

  useEffect(
    () => () => {
      selectionRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    selectionRef.current?.abort();
    selectionRef.current = null;
    setSelecting(false);
  }, [props.projectId, props.tabId, props.threadId]);

  const startSelection = async () => {
    const stageAttachment = addAttachment;
    if (stageAttachment === undefined || !canStart) return;
    const controller = new AbortController();
    selectionRef.current?.abort();
    selectionRef.current = controller;
    setSelecting(true);
    setError(null);
    try {
      const result = await props.experimental_inspectPage(
        { kind: "auto" },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || result === null) return;
      if (props.threadId === null || props.projectId === null) return;
      const prepared = await rpc.call("prepareCapture", {
        threadId: props.threadId,
        projectId: props.projectId,
        capture: {
          ...result,
          element:
            result.element === null
              ? null
              : {
                  ...result.element,
                  classNames: [...result.element.classNames],
                  reactComponentStack:
                    result.element.reactComponentStack === null
                      ? null
                      : [...result.element.reactComponentStack],
                },
          region:
            result.region === null
              ? null
              : {
                  elements: result.region.elements.map((element) => ({
                    ...element,
                    classNames: [...element.classNames],
                  })),
                },
        },
      });
      if (controller.signal.aborted) return;
      for (const attachment of prepared.attachments) {
        stageAttachment(attachment);
      }
      composer.focus();
    } catch (selectionError) {
      if (!controller.signal.aborted) setError(errorMessage(selectionError));
    } finally {
      if (selectionRef.current === controller) {
        selectionRef.current = null;
        setSelecting(false);
      }
    }
  };

  const cancelSelection = () => {
    selectionRef.current?.abort();
    selectionRef.current = null;
    setSelecting(false);
  };

  const label = selecting ? "Cancel page selection" : "Select page context";
  return (
    <>
      <button
        type="button"
        className="bb-browser-context-action"
        aria-label={label}
        aria-pressed={selecting}
        disabled={!canStart && !selecting}
        title={disabledReason ?? label}
        onClick={() => {
          if (selecting) {
            cancelSelection();
            return;
          }
          void startSelection();
        }}
      >
        <CrosshairIcon busy={selecting} />
      </button>

      {error !== null
        ? createPortal(
            <div data-bb-plugin="browser-context">
              <span className="bb-browser-context-status" role="status">
                {error}
              </span>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function registerBrowserContextApp(
  slots: BrowserContextCompatibleSlots,
) {
  slots.experimental_browserAction?.({
    id: "capture",
    title: "Select page context",
    icon: "Scan",
    component: BrowserContextAction,
  });
}

export default definePluginApp((app) => {
  registerBrowserContextApp(app.slots);
});
