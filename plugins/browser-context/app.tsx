import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { CursorMagicSelection03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function cloneCapture(capture: ExperimentalBrowserInspectionResult) {
  const cloneLocator = (locator: { selectors: readonly string[] }) => ({
    selectors: [...locator.selectors],
  });
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
            commonAncestor:
              capture.region.commonAncestor === null
                ? null
                : {
                    ...capture.region.commonAncestor,
                    absoluteLocator: cloneLocator(
                      capture.region.commonAncestor.absoluteLocator,
                    ),
                  },
            targets: capture.region.targets.map((target) => ({
              absoluteLocator: cloneLocator(target.absoluteLocator),
              relativeLocator: cloneLocator(target.relativeLocator),
              text: target.text,
              rect: { ...target.rect },
              ...(target.accessibility === undefined
                ? {}
                : {
                    accessibility: {
                      ...target.accessibility,
                      attributes: { ...target.accessibility.attributes },
                    },
                  }),
              ...(target.react === undefined
                ? {}
                : {
                    react: {
                      componentStack: [...target.react.componentStack],
                      ...(target.react.source === undefined
                        ? {}
                        : { source: { ...target.react.source } }),
                    },
                  }),
            })),
            groups: capture.region.groups.map((group) => ({
              absoluteLocator: cloneLocator(group.absoluteLocator),
              relativeLocator: cloneLocator(group.relativeLocator),
              count: group.count,
              rect: { ...group.rect },
            })),
            omittedTargetCount: capture.region.omittedTargetCount,
            omittedGroupCount: capture.region.omittedGroupCount,
            scanTruncated: capture.region.scanTruncated,
          },
  };
}

function percent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.max(0, Math.min(100, (value / total) * 100))}%`;
}

interface PendingAnnotation {
  id: number;
  capture: ExperimentalBrowserInspectionResult;
  comment: string;
}

function captureTargetLabel(
  capture: ExperimentalBrowserInspectionResult,
): string {
  const regionTargetCount =
    capture.region === null
      ? 0
      : capture.region.targets.length + capture.region.omittedTargetCount;
  if (capture.kind === "element") {
    return `${capture.element?.tag ?? "element"}${capture.element?.id ? `#${capture.element.id}` : ""}`;
  }
  if (regionTargetCount === 0) return "empty region";
  return `${regionTargetCount} target${regionTargetCount === 1 ? "" : "s"} in region`;
}

function sharesPreview(
  left: ExperimentalBrowserInspectionResult,
  right: ExperimentalBrowserInspectionResult,
): boolean {
  return (
    left.page.url === right.page.url &&
    left.page.viewport.width === right.page.viewport.width &&
    left.page.viewport.height === right.page.viewport.height &&
    left.page.scroll.x === right.page.scroll.x &&
    left.page.scroll.y === right.page.scroll.y
  );
}

interface CaptureReviewProps {
  annotations: readonly PendingAnnotation[];
  activeId: number;
  error: string | null;
  staging: boolean;
  onAddToPrompt(): void;
  onCancel(): void;
  onCommentChange(id: number, comment: string): void;
  onRemove(id: number): void;
  onSelect(id: number): void;
  onSelectAnother(): void;
}

function CaptureReview({
  annotations,
  activeId,
  error,
  staging,
  onAddToPrompt,
  onCancel,
  onCommentChange,
  onRemove,
  onSelect,
  onSelectAnother,
}: CaptureReviewProps) {
  const [hoveringTargetId, setHoveringTargetId] = useState<number | null>(null);
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
  const activeIndex = Math.max(
    0,
    annotations.findIndex((annotation) => annotation.id === activeId),
  );
  const active = annotations[activeIndex] ?? annotations[0]!;
  const capture = active.capture;
  const viewport = capture.page.viewport;
  const targetLabel = captureTargetLabel(capture);
  const previewAnnotations = annotations.filter((annotation) =>
    sharesPreview(annotation.capture, capture),
  );
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
    const maxY = Math.max(
      inset,
      reviewRect.height - panel.offsetHeight - inset,
    );
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
        {previewAnnotations.map((annotation) => {
          const annotationIndex = annotations.indexOf(annotation);
          const annotationLabel = captureTargetLabel(annotation.capture);
          const isActive = annotation.id === active.id;
          const rectStyle = {
            left: percent(annotation.capture.rect.x, viewport.width),
            top: percent(annotation.capture.rect.y, viewport.height),
            width: percent(annotation.capture.rect.width, viewport.width),
            height: percent(annotation.capture.rect.height, viewport.height),
          };
          return (
            <button
              key={annotation.id}
              type="button"
              className="bb-browser-context-target"
              data-active={isActive ? "true" : "false"}
              style={rectStyle}
              aria-label={`Selection ${annotationIndex + 1}: ${annotationLabel}`}
              onClick={() => onSelect(annotation.id)}
              onMouseEnter={() => {
                setHoveringTargetId(annotation.id);
                onSelect(annotation.id);
              }}
              onMouseLeave={() => setHoveringTargetId(null)}
              onFocus={() => {
                setHoveringTargetId(annotation.id);
                onSelect(annotation.id);
              }}
              onBlur={() => setHoveringTargetId(null)}
            >
              <span className="bb-browser-context-target-badge">
                {annotationIndex + 1}
              </span>
              {hoveringTargetId === annotation.id ? (
                <span className="bb-browser-context-target-tooltip">
                  <strong>{annotationLabel}</strong>
                  <span>{annotation.comment.trim() || "No comment yet"}</span>
                </span>
              ) : null}
            </button>
          );
        })}
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
            <span className="bb-browser-context-comment-index">
              {activeIndex + 1}
            </span>
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
        {annotations.length > 1 ? (
          <ol
            className="bb-browser-context-selection-list"
            aria-label="Selections"
          >
            {annotations.map((annotation, index) => {
              const label = captureTargetLabel(annotation.capture);
              const selected = annotation.id === active.id;
              return (
                <li
                  key={annotation.id}
                  data-active={selected ? "true" : "false"}
                >
                  <button
                    type="button"
                    className="bb-browser-context-selection-row"
                    aria-label={`Edit selection ${index + 1}: ${label}`}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onSelect(annotation.id)}
                    onMouseEnter={() => onSelect(annotation.id)}
                    onFocus={() => onSelect(annotation.id)}
                  >
                    <span className="bb-browser-context-comment-index">
                      {index + 1}
                    </span>
                    <span>
                      <strong>{label}</strong>
                      <small>
                        {annotation.comment.trim() || "No comment yet"}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="bb-browser-context-remove"
                    aria-label={`Remove selection ${index + 1}`}
                    title="Remove selection"
                    disabled={staging}
                    onClick={() => onRemove(annotation.id)}
                  >
                    <RemoveIcon />
                  </button>
                </li>
              );
            })}
          </ol>
        ) : null}
        <textarea
          id="bb-browser-context-comment"
          aria-label={`Comment for selection ${activeIndex + 1}`}
          value={active.comment}
          onChange={(event) => onCommentChange(active.id, event.target.value)}
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
            className="bb-browser-context-secondary"
            onClick={onSelectAnother}
            disabled={staging}
          >
            <PlusIcon />
            Select another
          </button>
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
  const [annotations, setAnnotations] = useState<PendingAnnotation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [operation, setOperation] = useState<"selecting" | "staging" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const operationRef = useRef<AbortController | null>(null);
  const annotationsRef = useRef<PendingAnnotation[]>([]);
  const nextIdRef = useRef(1);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const overlayRoot = props.experimental_overlayRoot ?? null;
  const hasThread = props.threadId !== null && props.projectId !== null;
  const supported =
    props.experimental_inspectionAvailable && overlayRoot !== null;
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
    annotationsRef.current = [];
    setAnnotations([]);
    setActiveId(null);
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
    annotationsRef.current = [];
    setAnnotations([]);
    setActiveId(null);
    props.experimental_setOverlayOpen(false);
  }, [props.projectId, props.tabId, props.threadId]);

  const startSelection = async () => {
    if (!canStart) return;
    const controller = new AbortController();
    operationRef.current?.abort();
    operationRef.current = controller;
    setOperation("selecting");
    setError(null);
    props.experimental_setOverlayOpen(false);
    try {
      const result = await props.experimental_inspectPage(
        { kind: "auto" },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || result === null) {
        if (annotationsRef.current.length > 0) {
          props.experimental_setOverlayOpen(true);
        }
        return;
      }
      const annotation: PendingAnnotation = {
        id: nextIdRef.current++,
        capture: result,
        comment: "",
      };
      setAnnotations((current) => {
        const next = [...current, annotation];
        annotationsRef.current = next;
        return next;
      });
      setActiveId(annotation.id);
      props.experimental_setOverlayOpen(true);
    } catch (selectionError) {
      if (!controller.signal.aborted) {
        setError(errorMessage(selectionError));
        if (annotationsRef.current.length > 0) {
          props.experimental_setOverlayOpen(true);
        }
      }
    } finally {
      if (operationRef.current === controller) {
        operationRef.current = null;
        setOperation(null);
      }
    }
  };

  const addToPrompt = async () => {
    const pending = annotationsRef.current;
    if (
      pending.length === 0 ||
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
      const prepared = await rpc.call("createCaptureMentions", {
        threadId: props.threadId,
        projectId: props.projectId,
        annotations: pending.map((annotation) => ({
          comment: annotation.comment,
          capture: cloneCapture(annotation.capture),
        })),
      });
      if (controller.signal.aborted) return;
      composer.updateText((current) => {
        if (current.length === 0 || current.endsWith("\n\n")) return current;
        return current.endsWith("\n") ? `${current}\n` : `${current}\n\n`;
      });
      prepared.mentions.forEach((mention, index) => {
        composer.insertMention({
          provider: "captures",
          id: mention.id,
          label: mention.label,
          preview: mention.preview,
          experimental_inspectable: true,
        });
        const comment = pending[index]?.comment.trim() ?? "";
        composer.updateText(
          (current) =>
            `${current}${comment}${index === prepared.mentions.length - 1 ? "" : "\n"}`,
        );
      });
      composer.focus();
      closeReview();
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
    if (annotationsRef.current.length > 0 && operation !== "selecting") {
      closeReview();
      return;
    }
    operationRef.current?.abort();
    operationRef.current = null;
    setOperation(null);
    if (annotationsRef.current.length > 0) {
      props.experimental_setOverlayOpen(true);
    }
  };

  const updateComment = (id: number, comment: string) => {
    setAnnotations((current) => {
      const next = current.map((annotation) =>
        annotation.id === id ? { ...annotation, comment } : annotation,
      );
      annotationsRef.current = next;
      return next;
    });
  };

  const removeAnnotation = (id: number) => {
    setAnnotations((current) => {
      const index = current.findIndex((annotation) => annotation.id === id);
      const next = current.filter((annotation) => annotation.id !== id);
      annotationsRef.current = next;
      if (next.length === 0) {
        queueMicrotask(closeReview);
      } else if (id === activeId) {
        setActiveId(next[Math.min(index, next.length - 1)]!.id);
      }
      return next;
    });
  };

  const label =
    annotations.length > 0 && operation !== "selecting"
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
        aria-pressed={annotations.length > 0 || operation === "selecting"}
        disabled={
          !canStart && annotations.length === 0 && operation !== "selecting"
        }
        title={disabledReason ?? label}
        onClick={() => {
          if (annotations.length > 0 || operation === "selecting") {
            cancelSelection();
            return;
          }
          void startSelection();
        }}
      >
        {annotations.length > 0 || operation === "selecting" ? (
          <CloseIcon />
        ) : (
          <HugeiconsIcon
            icon={CursorMagicSelection03Icon}
            aria-hidden="true"
            data-icon="CursorMagicSelection03"
          />
        )}
      </button>

      {annotations.length > 0 &&
      activeId !== null &&
      operation !== "selecting" &&
      overlayRoot !== null
        ? createPortal(
            <div data-bb-plugin="browser-context">
              <CaptureReview
                annotations={annotations}
                activeId={activeId}
                error={error}
                staging={operation === "staging"}
                onAddToPrompt={() => void addToPrompt()}
                onCancel={closeReview}
                onCommentChange={updateComment}
                onRemove={removeAnnotation}
                onSelect={setActiveId}
                onSelectAnother={() => void startSelection()}
              />
            </div>,
            overlayRoot,
          )
        : null}

      {error !== null && annotations.length === 0
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
