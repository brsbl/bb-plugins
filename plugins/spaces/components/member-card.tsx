// One member of the Space tab: a card that peeks inline into bb's own chat for that thread, and the checkbox row the
// same member becomes while you select threads to tell.
import { ThreadChat, experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { cx } from "./lib/cx";
import { formatAge, subthreadSummary, type MemberCardModel } from "./model";
import { StatusGlyph } from "./status-glyph";
import { Button, Kbd } from "./ui/button";

/** Marks the focusable element of each card, in list order, for ↑ and ↓. */
const NAV_ATTRIBUTE = "data-space-card-nav";

function moveFocus(from: HTMLElement, step: 1 | -1) {
  const list = from.closest("[data-space-list]");
  if (!list) return;
  const nodes = [...list.querySelectorAll<HTMLElement>(`[${NAV_ATTRIBUTE}]`)].filter(
    (node) => !(node instanceof HTMLInputElement && node.disabled),
  );
  nodes[nodes.indexOf(from) + step]?.focus();
}

function arrowNavigation(event: KeyboardEvent<HTMLElement>): boolean {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return false;
  event.preventDefault();
  moveFocus(event.currentTarget, event.key === "ArrowDown" ? 1 : -1);
  return true;
}

function metaText(card: MemberCardModel, now: number): string {
  return [card.projectName, formatAge(card.lastActivityAt, now)].filter(Boolean).join(" · ");
}

function ThisThreadChip() {
  return (
    <span className="shrink-0 rounded-full border border-border px-1.5 text-[11px] leading-[18px] text-muted-foreground">
      This thread
    </span>
  );
}

interface MemberCardProps {
  card: MemberCardModel;
  now: number;
  peeked: boolean;
  onTogglePeek(id: string): void;
  onClosePeek(): void;
  onOpen(id: string): void;
  onSplit(id: string): void;
}

export function MemberCard({ card, now, peeked, onTogglePeek, onClosePeek, onOpen, onSplit }: MemberCardProps) {
  const ids = useId();
  const titleId = `${ids}-title`;
  const statusId = `${ids}-status`;
  const metaId = `${ids}-meta`;
  const excerptId = `${ids}-excerpt`;
  const rollupId = `${ids}-rollup`;
  const peekId = `${ids}-peek`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);

  // Bump after the chat mounts so its composer takes focus, as a peek opened from the keyboard expects.
  useEffect(() => {
    if (peeked) setFocusRequest((current) => current + 1);
  }, [peeked]);

  const meta = card.isCurrent ? "" : metaText(card, now);
  const rollup = subthreadSummary(card.subthreads);
  const describedBy = [
    card.glyphLabel ? statusId : null,
    meta ? metaId : null,
    peeked ? null : excerptId,
    rollup ? rollupId : null,
  ]
    .filter(Boolean)
    .join(" ");

  const closeAndRefocus = () => {
    onClosePeek();
    buttonRef.current?.focus();
  };

  const body = (
    <>
      <span className="flex items-center gap-2">
        <span id={statusId} className="inline-flex size-4 shrink-0 items-center justify-center text-subtle-foreground">
          <StatusGlyph kind={card.glyph} label={card.glyphLabel} />
        </span>
        <span id={titleId} className={cx("min-w-0 flex-1 truncate text-sm", card.isUnread ? "font-semibold" : "font-medium")}>
          {card.title}
        </span>
        {card.isCurrent ? <ThisThreadChip /> : null}
        {meta ? (
          <span id={metaId} className="shrink-0 whitespace-nowrap text-xs text-subtle-foreground">
            {meta}
          </span>
        ) : null}
      </span>
      {peeked ? null : card.excerpt ? (
        <span id={excerptId} className="ml-6 mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
          {card.excerpt}
        </span>
      ) : (
        <span id={excerptId} className="ml-6 mt-0.5 block text-sm leading-snug text-subtle-foreground">
          {card.firstPrompt ? <span className="line-clamp-1">{card.firstPrompt}</span> : null}
          <span className="block text-xs">No output yet</span>
        </span>
      )}
      {rollup ? (
        <span id={rollupId} className="ml-6 mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="CornerDownRight" className="size-3.5 shrink-0" aria-hidden />
          {rollup}
        </span>
      ) : null}
    </>
  );

  if (card.isCurrent) {
    return (
      <li data-space-card={card.id} className="rounded-lg border border-transparent">
        <div className="block rounded-lg px-2.5 py-2">{body}</div>
      </li>
    );
  }

  return (
    <li
      data-space-card={card.id}
      className={cx("rounded-lg border", peeked ? "border-border shadow-sm" : "border-transparent")}
      onKeyDown={(event) => {
        // The composer owns keys inside a peek; Esc closes the peek only when nothing inside has used it.
        if (event.key !== "Escape" || !peeked || event.defaultPrevented) return;
        event.preventDefault();
        closeAndRefocus();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        data-space-card-nav=""
        aria-expanded={peeked}
        aria-controls={peeked ? peekId : undefined}
        aria-labelledby={titleId}
        aria-describedby={describedBy || undefined}
        onClick={() => onTogglePeek(card.id)}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey || arrowNavigation(event)) return;
          if (event.key === "Enter") {
            event.preventDefault();
            onOpen(card.id);
          } else if (event.key === "s" || event.key === "S") {
            event.preventDefault();
            onSplit(card.id);
          }
          // Space falls through to the button's own click, which peeks.
        }}
        className={cx(
          "block w-full cursor-pointer rounded-lg px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !peeked && "hover:bg-state-hover",
        )}
      >
        {body}
      </button>
      {peeked ? (
        <div id={peekId} role="region" aria-label={`${card.title} conversation`} className="px-2.5 pb-2.5">
          <div className="h-[min(26rem,60vh)] min-h-48 overflow-hidden rounded-md border border-border-hairline bg-background">
            <ThreadChat
              threadId={card.id}
              variant={card.archived ? "timeline" : "compact"}
              layout="contained"
              focusRequest={focusRequest}
              className="h-full"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="xs" onClick={() => onOpen(card.id)} aria-keyshortcuts="Enter">
              <Icon name="ArrowUpRight" aria-hidden />
              Open
            </Button>
            <Button variant="outline" size="xs" onClick={() => onSplit(card.id)} aria-keyshortcuts="S">
              <Icon name="Columns2" aria-hidden />
              Open in split
            </Button>
            <Button variant="ghost" size="xs" onClick={closeAndRefocus} aria-keyshortcuts="Escape">
              Close <Kbd>Esc</Kbd>
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

interface SelectableCardProps {
  card: MemberCardModel;
  now: number;
  checked: boolean;
  /** Why the row can't be selected, or null when it can. */
  disabledReason: string | null;
  messaged: boolean;
  onToggle(id: string): void;
}

/** The member as a checkbox row while selecting threads to tell. */
export function SelectableCard({ card, now, checked, disabledReason, messaged, onToggle }: SelectableCardProps) {
  const meta = messaged ? "Message sent" : card.isCurrent ? "" : metaText(card, now);
  const disabled = disabledReason !== null;
  return (
    <li data-space-card={card.id}>
      <label
        title={disabledReason ?? undefined}
        className={cx(
          "flex items-start gap-2.5 rounded-lg px-2.5 py-2",
          disabled ? "cursor-default" : "cursor-pointer hover:bg-state-hover",
        )}
      >
        <input
          type="checkbox"
          data-space-card-nav=""
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(card.id)}
          onKeyDown={arrowNavigation}
          className="mt-0.5 size-4 shrink-0 cursor-[inherit] accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={cx("min-w-0 flex-1 truncate text-sm", card.isUnread ? "font-semibold" : "font-medium")}>
              {card.title}
            </span>
            {card.isCurrent ? <ThisThreadChip /> : null}
            {meta ? <span className="shrink-0 whitespace-nowrap text-xs text-subtle-foreground">{meta}</span> : null}
          </span>
          <span className="mt-0.5 line-clamp-1 text-sm leading-snug text-muted-foreground">
            {card.excerpt ?? "No output yet"}
          </span>
        </span>
      </label>
    </li>
  );
}
