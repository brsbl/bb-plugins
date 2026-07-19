import * as React from "react";
import { createPortal } from "react-dom";

import { Button, IconButton } from "./controls.js";
import { Cluster, cx, Heading, Stack, Text } from "./foundation.js";
import { AtlasIcon } from "./icons.js";

interface StageContextValue {
  portalNode: HTMLDivElement | null;
  stageNode: HTMLDivElement | null;
  inert: boolean;
}

const StageContext = React.createContext<StageContextValue | null>(null);

export interface PreviewStageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  inert?: boolean;
  height?: string;
}

export function PreviewStage({
  label,
  inert = false,
  height,
  className,
  style,
  children,
  ...props
}: PreviewStageProps) {
  const [stageNode, setStageNode] = React.useState<HTMLDivElement | null>(null);
  const [portalNode, setPortalNode] = React.useState<HTMLDivElement | null>(null);
  const value = React.useMemo(
    () => ({ stageNode, portalNode, inert }),
    [stageNode, portalNode, inert],
  );
  const stageStyle = {
    ...style,
    ...(height ? { "--atlas-stage-height": height } : null),
  } as React.CSSProperties;

  return (
    <StageContext.Provider value={value}>
      <div
        ref={setStageNode}
        className={cx("atlas-preview-stage", className)}
        style={stageStyle}
        role="group"
        aria-label={label}
        data-preview-inert={inert || undefined}
        inert={inert || undefined}
        {...props}
      >
        <div className="atlas-preview-stage__canvas">{children}</div>
        <div
          ref={setPortalNode}
          className="atlas-preview-stage__portals"
          data-atlas-stage-portals=""
        />
      </div>
    </StageContext.Provider>
  );
}

export function usePreviewStage(): StageContextValue {
  const context = React.useContext(StageContext);
  if (!context) {
    throw new Error(
      "Atlas overlays must be rendered inside PreviewStage so portals stay stage-local.",
    );
  }
  return context;
}

export interface StagePortalProps {
  children: React.ReactNode;
}

export function StagePortal({ children }: StagePortalProps) {
  const { portalNode } = usePreviewStage();
  return portalNode ? createPortal(children, portalNode) : null;
}

function focusableElements(node: HTMLElement): HTMLElement[] {
  return Array.from(
    node.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("hidden"));
}

export interface StageDialogProps {
  open: boolean;
  id?: string;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  closeLabel?: string;
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
  variant?: "dialog" | "drawer" | "sheet";
  className?: string;
  initialFocusId?: string;
}

export function StageDialog({
  open,
  id,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel = "Close dialog",
  dismissible = true,
  role = "dialog",
  variant = "dialog",
  className,
  initialFocusId,
}: StageDialogProps) {
  const { inert } = usePreviewStage();
  const titleId = React.useId();
  const descriptionId = React.useId();
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open || inert || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const ownerDocument = dialog.ownerDocument;
    const previouslyFocused = ownerDocument.activeElement as HTMLElement | null;
    const initialTarget = initialFocusId
      ? ownerDocument.getElementById(initialFocusId) ?? focusableElements(dialog)[0] ?? dialog
      : focusableElements(dialog)[0] ?? dialog;
    initialTarget.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [inert, initialFocusId, open]);

  if (!open) return null;

  const dismiss = () => {
    if (dismissible) onOpenChange(false);
  };

  return (
    <StagePortal>
      <div
        className="atlas-overlay-scrim"
        data-variant={variant}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss();
        }}
      >
        <div
          ref={dialogRef}
          id={id}
          className={cx("atlas-dialog", className)}
          data-variant={variant}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape" && dismissible) {
              event.preventDefault();
              onOpenChange(false);
              return;
            }
            if (event.key !== "Tab" || !dialogRef.current) return;
            const focusable = focusableElements(dialogRef.current);
            if (focusable.length === 0) {
              event.preventDefault();
              dialogRef.current.focus();
              return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && event.target === first) {
              event.preventDefault();
              last.focus();
            } else if (!event.shiftKey && event.target === last) {
              event.preventDefault();
              first.focus();
            }
          }}
        >
          <header className="atlas-dialog__header">
            <Stack gap="xs">
              <Heading id={titleId} level={2} size="md">
                {title}
              </Heading>
              {description ? (
                <Text id={descriptionId} tone="muted">
                  {description}
                </Text>
              ) : null}
            </Stack>
            {dismissible ? (
              <IconButton
                label={closeLabel}
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <AtlasIcon name="X" size="xs" />
              </IconButton>
            ) : null}
          </header>
          {children ? <div className="atlas-dialog__body">{children}</div> : null}
          {footer ? (
            <footer className="atlas-dialog__footer">{footer}</footer>
          ) : null}
        </div>
      </div>
    </StagePortal>
  );
}

export interface StagePopoverProps {
  open: boolean;
  id?: string;
  label: string;
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  placement?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  role?: "dialog" | "menu" | "tooltip" | "listbox";
  className?: string;
}

export function StagePopover({
  open,
  id,
  label,
  children,
  onOpenChange,
  placement = "bottom-end",
  role = "dialog",
  className,
}: StagePopoverProps) {
  const { inert } = usePreviewStage();
  const popoverRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!open || inert || role === "tooltip" || !popoverRef.current) return;
    const popover = popoverRef.current;
    const ownerDocument = popover.ownerDocument;
    const previouslyFocused = ownerDocument.activeElement as HTMLElement | null;
    const initialTarget = focusableElements(popover)[0] ?? popover;
    initialTarget.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [inert, open, role]);

  React.useEffect(() => {
    if (!open || inert || !onOpenChange || !popoverRef.current) return;
    const popover = popoverRef.current;
    const ownerDocument = popover.ownerDocument;
    const dismissFromOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !popover.contains(event.target)) {
        onOpenChange(false);
      }
    };
    ownerDocument.addEventListener("pointerdown", dismissFromOutside);
    return () => ownerDocument.removeEventListener("pointerdown", dismissFromOutside);
  }, [inert, onOpenChange, open]);

  if (!open) return null;
  return (
    <StagePortal>
      <section
        ref={popoverRef}
        id={id}
        className={cx("atlas-popover", className)}
        data-placement={placement}
        role={role}
        aria-label={label}
        tabIndex={role === "tooltip" ? undefined : -1}
        onKeyDown={(event) => {
          if (event.key === "Escape" && onOpenChange) {
            event.preventDefault();
            onOpenChange(false);
            return;
          }
          if (role !== "menu") return;
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"]):not(:disabled)',
            ),
          );
          const currentIndex = items.indexOf(event.target as HTMLElement);
          let nextIndex: number | undefined;
          if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
          else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
          else if (event.key === "Home") nextIndex = 0;
          else if (event.key === "End") nextIndex = items.length - 1;
          if (nextIndex !== undefined && items[nextIndex]) {
            event.preventDefault();
            items[nextIndex].focus();
          }
        }}
      >
        {onOpenChange && role === "dialog" ? (
          <IconButton
            className="atlas-popover__close"
            label={`Close ${label}`}
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <AtlasIcon name="X" size="xs" />
          </IconButton>
        ) : null}
        {children}
      </section>
    </StagePortal>
  );
}

export interface ConfirmationFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  confirmDisabled?: boolean;
}

export function ConfirmationFooter({
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmTone = "primary",
  confirmDisabled = false,
}: ConfirmationFooterProps) {
  return (
    <Cluster justify="end">
      <Button size="sm" tone="quiet" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        size="sm"
        tone={confirmTone}
        disabled={confirmDisabled}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </Cluster>
  );
}
