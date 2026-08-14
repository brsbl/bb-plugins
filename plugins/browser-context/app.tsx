import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  definePluginApp,
  useComposer,
  useRpc,
  type ExperimentalBrowserInspectionResult,
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

function SelectionIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <path d="m9 8 7 6-3.2.7-1.4 3.1L9 8Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

function DragHandleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1" />
      <circle cx="11" cy="4" r="1" />
      <circle cx="5" cy="8" r="1" />
      <circle cx="11" cy="8" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="11" cy="12" r="1" />
    </svg>
  );
}

function cloneCapture(capture: ExperimentalBrowserInspectionResult) {
  return {
    ...capture,
    element:
      capture.element === null
        ? null
        : {
            ...capture.element,
            classNames: [...capture.element.classNames],
            reactComponentStack:
              capture.element.reactComponentStack === null
                ? null
                : [...capture.element.reactComponentStack],
          },
    region:
      capture.region === null
        ? null
        : {
            elements: capture.region.elements.map((element) => ({
              ...element,
              classNames: [...element.classNames],
            })),
          },
  };
}

function percent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

interface CaptureReviewProps {
  capture: ExperimentalBrowserInspectionResult;
  comment: string;
  error: string | null;
  staging: boolean;
  onAddToPrompt(): void;
  onCancel(): void;
  onCommentChange(comment: string): void;
}

function CaptureReview({
  capture,
  comment,
  error,
  staging,
  onAddToPrompt,
  onCancel,
  onCommentChange,
}: CaptureReviewProps) {
  const [hoveringTarget, setHoveringTarget] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const viewport = capture.page.viewport;
  const rectStyle = {
    left: percent(capture.rect.x, viewport.width),
    top: percent(capture.rect.y, viewport.height),
    width: percent(capture.rect.width, viewport.width),
    height: percent(capture.rect.height, viewport.height),
  };
  const targetLabel =
    capture.kind === "element"
      ? `${capture.element?.tag ?? "element"}${capture.element?.id ? `#${capture.element.id}` : ""}`
      : `${capture.region?.elements.length ?? 0} elements in region`;
  const commentCardClassName =
    capture.rect.x + capture.rect.width / 2 > viewport.width / 2
      ? "bb-browser-context-comment-card bb-browser-context-comment-card-left"
      : "bb-browser-context-comment-card";
  const commentCardStyle: CSSProperties | undefined =
    panelPosition === null
      ? undefined
      : {
          left: `${panelPosition.x}px`,
          right: "auto",
          top: `${panelPosition.y}px`,
        };

  const beginPanelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || staging) return;
    const panel = panelRef.current;
    const review = reviewRef.current;
    if (panel === null || review === null) return;
    const panelRect = panel.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const movePanel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    const review = reviewRef.current;
    if (
      drag === null ||
      drag.pointerId !== event.pointerId ||
      panel === null ||
      review === null
    ) {
      return;
    }
    const reviewRect = review.getBoundingClientRect();
    const inset = 8;
    const maxX = Math.max(inset, reviewRect.width - panel.offsetWidth - inset);
    const maxY = Math.max(inset, reviewRect.height - panel.offsetHeight - inset);
    setPanelPosition({
      x: Math.max(
        inset,
        Math.min(maxX, event.clientX - reviewRect.left - drag.offsetX),
      ),
      y: Math.max(
        inset,
        Math.min(maxY, event.clientY - reviewRect.top - drag.offsetY),
      ),
    });
  };

  const endPanelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId) === true) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  return (
    <section
      ref={reviewRef}
      className="bb-browser-context-review"
      role="region"
      aria-label="Browser context preview"
    >
      <div className="bb-browser-context-canvas">
        <img
          src={capture.screenshot.dataUrl}
          alt={`Captured preview of ${capture.page.title ?? capture.page.url}`}
          draggable={false}
        />
        <button
          type="button"
          className="bb-browser-context-target"
          style={rectStyle}
          aria-label={`Selected ${capture.kind}: ${targetLabel}`}
          onMouseEnter={() => setHoveringTarget(true)}
          onMouseLeave={() => setHoveringTarget(false)}
          onFocus={() => setHoveringTarget(true)}
          onBlur={() => setHoveringTarget(false)}
        >
          <span className="bb-browser-context-target-badge">1</span>
          {hoveringTarget ? (
            <span className="bb-browser-context-target-tooltip">
              <strong>{targetLabel}</strong>
              <span>{comment.trim() || "No comment yet"}</span>
            </span>
          ) : null}
        </button>
      </div>

      <aside
        ref={panelRef}
        className={commentCardClassName}
        style={commentCardStyle}
      >
        <div className="bb-browser-context-comment-toolbar">
          <div
            className="bb-browser-context-comment-heading"
            onPointerDown={beginPanelDrag}
            onPointerMove={movePanel}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
            title="Drag annotation"
          >
            <DragHandleIcon />
            <span className="bb-browser-context-comment-index">1</span>
            <span>
              <strong>
                {capture.kind === "element" ? "Element" : "Region"}
              </strong>
              <small>{targetLabel}</small>
            </span>
          </div>
          <button
            type="button"
            className="bb-browser-context-cancel"
            onClick={onCancel}
            disabled={staging}
            aria-label="Cancel annotation"
            title="Cancel annotation"
          >
            <CloseIcon />
          </button>
        </div>
        <textarea
          id="bb-browser-context-comment"
          aria-label="Comment"
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          placeholder="What should change here?"
          maxLength={4_000}
          autoFocus
        />
        {error !== null ? (
          <p className="bb-browser-context-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="bb-browser-context-review-actions">
          <button
            type="button"
            className="bb-browser-context-primary"
            onClick={onAddToPrompt}
            disabled={staging}
          >
            {staging ? "Adding…" : "Add to prompt"}
          </button>
        </div>
      </aside>
    </section>
  );
}

function BrowserContextAction(props: PluginBrowserActionProps) {
  const rpc = useRpc<typeof rpcContract>();
  const composer = useComposer();
  const addAttachment = composer.experimental_addAttachment;
  const [capture, setCapture] =
    useState<ExperimentalBrowserInspectionResult | null>(null);
  const [comment, setComment] = useState("");
  const [operation, setOperation] = useState<"selecting" | "staging" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const operationRef = useRef<AbortController | null>(null);

  const overlayRoot = props.experimental_overlayRoot ?? null;
  const hasThread = props.threadId !== null && props.projectId !== null;
  const supported =
    props.experimental_inspectionAvailable &&
    addAttachment !== undefined &&
    overlayRoot !== null;
  const canStart = supported && hasThread && props.url.length > 0;
  const disabledReason = !supported
    ? "Browser annotations require a newer BB desktop app."
    : !hasThread
      ? "Open the Browser from a thread to add page context to its composer."
      : props.url.length === 0
        ? "Open a page before selecting context."
        : null;

  const closeReview = () => {
    operationRef.current?.abort();
    operationRef.current = null;
    setOperation(null);
    setCapture(null);
    setComment("");
    setError(null);
    props.experimental_setOverlayOpen(false);
  };

  useEffect(
    () => () => {
      operationRef.current?.abort();
      props.experimental_setOverlayOpen(false);
    },
    [props.experimental_setOverlayOpen],
  );

  useEffect(() => {
    operationRef.current?.abort();
    operationRef.current = null;
    setOperation(null);
    setCapture(null);
    setComment("");
    props.experimental_setOverlayOpen(false);
  }, [props.projectId, props.tabId, props.threadId]);

  const startSelection = async () => {
    if (!canStart) return;
    const controller = new AbortController();
    operationRef.current?.abort();
    operationRef.current = controller;
    setOperation("selecting");
    setCapture(null);
    setComment("");
    setError(null);
    props.experimental_setOverlayOpen(false);
    try {
      const result = await props.experimental_inspectPage(
        { kind: "auto" },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || result === null) return;
      props.experimental_setOverlayOpen(true);
      setCapture(result);
    } catch (selectionError) {
      if (!controller.signal.aborted) setError(errorMessage(selectionError));
    } finally {
      if (operationRef.current === controller) {
        operationRef.current = null;
        setOperation(null);
      }
    }
  };

  const addToPrompt = async () => {
    const stageAttachment = addAttachment;
    if (
      capture === null ||
      stageAttachment === undefined ||
      props.threadId === null ||
      props.projectId === null
    ) {
      return;
    }
    const controller = new AbortController();
    operationRef.current?.abort();
    operationRef.current = controller;
    setOperation("staging");
    setError(null);
    try {
      const prepared = await rpc.call("prepareCapture", {
        threadId: props.threadId,
        projectId: props.projectId,
        comment,
        capture: cloneCapture(capture),
      });
      if (controller.signal.aborted) return;
      for (const attachment of prepared.attachments) {
        stageAttachment(attachment);
      }
      composer.updateText((current) => {
        const prefix = current.trimEnd();
        return prefix.length === 0
          ? prepared.promptText
          : `${prefix}\n\n${prepared.promptText}`;
      });
      composer.focus();
      setCapture(null);
      setComment("");
      props.experimental_setOverlayOpen(false);
    } catch (stageError) {
      if (!controller.signal.aborted) setError(errorMessage(stageError));
    } finally {
      if (operationRef.current === controller) {
        operationRef.current = null;
        setOperation(null);
      }
    }
  };

  const cancelSelection = () => {
    if (capture !== null) {
      closeReview();
      return;
    }
    operationRef.current?.abort();
    operationRef.current = null;
    setOperation(null);
  };

  const label =
    capture !== null
      ? "Close page context preview"
      : operation === "selecting"
        ? "Cancel page selection"
        : "Select page context";
  return (
    <>
      <button
        type="button"
        className="bb-browser-context-action"
        aria-label={label}
        aria-pressed={capture !== null || operation === "selecting"}
        disabled={!canStart && capture === null && operation !== "selecting"}
        title={disabledReason ?? label}
        onClick={() => {
          if (capture !== null || operation === "selecting") {
            cancelSelection();
            return;
          }
          void startSelection();
        }}
      >
        {capture !== null || operation === "selecting" ? (
          <CloseIcon />
        ) : (
          <SelectionIcon />
        )}
      </button>

      {capture !== null && overlayRoot !== null
        ? createPortal(
            <div data-bb-plugin="browser-context">
              <CaptureReview
                capture={capture}
                comment={comment}
                error={error}
                staging={operation === "staging"}
                onAddToPrompt={() => void addToPrompt()}
                onCancel={closeReview}
                onCommentChange={setComment}
              />
            </div>,
            overlayRoot,
          )
        : null}

      {error !== null && capture === null
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
