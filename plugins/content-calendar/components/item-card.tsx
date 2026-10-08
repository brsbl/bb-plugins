import type { KeyboardEvent, Ref } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { isBlocked, itemSubtitle, type Item } from "../model.js";

export type CardSize = "month" | "week";

/** A calendar item: checkbox (checked = posted), title, and one muted line. Nothing is ever crossed out. */
export function ItemCardView({ item, size, picked = false, dragging = false, selected = false, overlay = false, cardRef, handle, onOpen, onToggle, onMenu, onKeyDown, onBlur }: {
  item: Item; size: CardSize; picked?: boolean; dragging?: boolean; selected?: boolean; overlay?: boolean;
  cardRef?: Ref<HTMLDivElement>; handle?: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners };
  onOpen?: (item: Item) => void; onToggle?: (item: Item, posted: boolean) => void; onMenu?: (item: Item, anchor: HTMLElement) => void;
  onKeyDown?: (item: Item, event: KeyboardEvent<HTMLDivElement>) => void; onBlur?: (item: Item) => void;
}) {
  const subtitle = itemSubtitle(item);
  const files = item.attachments.length;
  const className = [
    "cc-item", `cc-f-${item.format ?? "none"}`, `cc-item-${size}`,
    isBlocked(item) ? "cc-gated" : "", picked ? "cc-picked" : "", dragging ? "cc-dragging" : "", selected ? "cc-selected" : "", overlay ? "cc-overlay" : "",
  ].filter(Boolean).join(" ");
  const stop = { onPointerDown: (event: { stopPropagation(): void }) => event.stopPropagation(), onKeyDown: (event: { stopPropagation(): void }) => event.stopPropagation() };
  return <div
    {...handle?.attributes}
    {...handle?.listeners}
    ref={cardRef}
    role="group"
    tabIndex={overlay ? -1 : 0}
    aria-roledescription="calendar item"
    aria-label={`${item.title}. ${subtitle}`}
    data-item-id={item.id}
    data-gated={isBlocked(item) ? "true" : "false"}
    className={className}
    onClick={(event) => { if (!(event.target as HTMLElement).closest("input,button")) onOpen?.(item); }}
    onKeyDown={(event) => onKeyDown?.(item, event)}
    onBlur={(event) => { if (event.target === event.currentTarget) onBlur?.(item); }}
  >
    <input type="checkbox" className="cc-check" aria-label={`Posted: ${item.title}`} checked={item.status === "posted"} tabIndex={overlay ? -1 : 0}
      onChange={(event) => onToggle?.(item, event.target.checked)} {...stop} />
    <div className="cc-item-text">
      <div className="cc-item-title">{item.title}</div>
      <div className="cc-item-meta">{subtitle}</div>
      {size === "week" && <>
        {(item.time || item.days > 1) && <div className="cc-item-extra">{[item.time, item.days > 1 ? `${item.days} days` : null].filter(Boolean).join(" · ")}</div>}
        {item.target && <div className="cc-item-extra">Target: {item.target}</div>}
        {files > 0 && <div className="cc-item-extra">{files === 1 ? "1 attachment" : `${files} attachments`}</div>}
      </>}
      {size === "month" && item.days > 1 && <div className="cc-item-meta">{item.days} days</div>}
    </div>
    {onMenu && <button type="button" className="cc-item-more" aria-label={`More actions for ${item.title}`} aria-haspopup="dialog"
      onClick={(event) => onMenu(item, event.currentTarget)} {...stop}>⋯</button>}
  </div>;
}
