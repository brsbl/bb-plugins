import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  DndContext, DragOverlay, PointerSensor, pointerWithin, rectIntersection, useDraggable, useDroppable, useSensor, useSensors,
  type Announcements, type CollisionDetection, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { FORMATS, FORMAT_LABELS, NO_FORMAT_LABEL, TRAY_LABELS, todayInCalendar, weekdayIndex, type Format, type Item, type Tray } from "../model.js";
import {
  WEEKDAY_SHORT, cellNumber, dayName, dropPlacement, gridWeeks, itemsByDay, keyboardStep, rangeDays, samePlace, whereLabel,
  type CalendarRange,
} from "../calendar-layout.js";
import { lastFormat, readableError, rememberFormat, type CalendarView, type When, type useCalendarData } from "./data.js";
import { ItemCardView, type CardSize } from "./item-card.js";
import { Popover, usePopover } from "./popover.js";

type Data = ReturnType<typeof useCalendarData>;
type Container = `day:${string}` | `tray:${Tray}`;

// The header's New item button lives outside the page body; it asks the board to open quick add.
const newItemListeners = new Set<(anchor: HTMLElement) => void>();
export function requestNewItem(anchor: HTMLElement) { for (const listener of newItemListeners) listener(anchor); }

const TRAY_HINTS: Record<Tray, string> = {
  evergreen: "weekday mornings, when ready · repeats every Monday in Google Calendar",
  later: "no date yet · repeats every Monday in Google Calendar",
};
const containerLabel = (container: string) => container.startsWith("day:") ? dayName(container.slice(4)) : TRAY_LABELS[container.slice(5) as Tray] ?? "";
const containerWhen = (container: Container): When => container.startsWith("day:") ? { date: container.slice(4) } : { tray: container.slice(5) as Tray };
const containerOf = (item: Item): Container => item.tray ? `tray:${item.tray}` : `day:${item.date ?? ""}`;
// Prefer the item under the pointer (a reorder), then its day or tray.
const collisions: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const found = hits.length ? hits : rectIntersection(args);
  const item = found.find((hit) => String(hit.id).startsWith("item:"));
  return item ? [item, ...found.filter((hit) => hit !== item)] : found;
};

type Pop =
  | { kind: "add"; when: When }
  | { kind: "menu"; item: Item }
  | { kind: "move"; item: Item };

/**
 * The Monday-to-Sunday grid (and, on the page, the two trays). Items move by
 * pointer drag, by keyboard (Space, arrows, Space, or Escape), or through
 * Move to… in each item's ⋯ menu.
 */
export function CalendarBoard({ range, mode, data, view, selectedId = null, onOpen, children }: {
  range: CalendarRange; mode: "page" | "inline"; data: Data; view: CalendarView; selectedId?: string | null;
  onOpen: (item: Item) => void; children?: ReactNode;
}) {
  const today = todayInCalendar();
  const { from, to } = rangeDays(range);
  const weeks = useMemo(() => gridWeeks(range), [range]);
  const byDay = useMemo(() => itemsByDay(view.dated), [view.dated]);
  const all = useMemo(() => new Map([...view.dated, ...view.evergreen, ...view.later].map((item) => [item.id, item])), [view]);
  const listOf = useCallback((container: Container): Item[] => container.startsWith("day:")
    ? byDay.get(container.slice(4)) ?? []
    : container === "tray:evergreen" ? view.evergreen : view.later, [byDay, view]);
  const size: CardSize = range.view === "week" ? "week" : "month";
  const trays = mode === "page";
  const root = useRef<HTMLDivElement>(null);
  const pop = usePopover<Pop["kind"]>();
  const [popState, setPopState] = useState<Pop | null>(null);
  const openPop = (state: Pop, anchor: HTMLElement) => { setPopState(state); pop.show(state.kind, anchor); };
  const closePop = () => { pop.close(); setPopState(null); };

  // Pointer drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [active, setActive] = useState<Item | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const resolve = (id: string | number | undefined): Container | null => {
    if (id === undefined) return null;
    const value = String(id);
    if (value.startsWith("item:")) { const item = all.get(value.slice(5)); return item ? containerOf(item) : null; }
    return value.startsWith("day:") || value.startsWith("tray:") ? value as Container : null;
  };
  const onDragStart = ({ active: start }: DragStartEvent) => { setActive(all.get(String(start.id)) ?? null); closePop(); };
  const onDragOver = ({ over: target }: DragOverEvent) => setOver(resolve(target?.id));
  const onDragEnd = ({ active: start, over: target }: DragEndEvent) => {
    setActive(null); setOver(null);
    const item = all.get(String(start.id));
    const container = resolve(target?.id);
    if (!item || !container) return;
    const list = listOf(container);
    const overId = String(target!.id).startsWith("item:") ? String(target!.id).slice(5) : null;
    const placement = dropPlacement(list, item.id, overId);
    if (container === containerOf(item) && samePlace(list, item.id, placement)) return;
    void data.move(item, containerWhen(container), placement, list);
  };
  const announcements: Announcements = {
    onDragStart: ({ active: start }) => `Picked up ${all.get(String(start.id))?.title ?? "item"}.`,
    onDragOver: ({ over: target }) => { const container = resolve(target?.id); return container ? `Over ${containerLabel(container)}.` : "Not over a day."; },
    onDragEnd: ({ active: start, over: target }) => {
      const title = all.get(String(start.id))?.title ?? "Item";
      const container = resolve(target?.id);
      return container ? `Dropped ${title} on ${containerLabel(container)}.` : `${title} stays where it was.`;
    },
    onDragCancel: ({ active: start }) => `Move cancelled. ${all.get(String(start.id))?.title ?? "The item"} stays where it was.`,
  };

  // Keyboard move: Space picks up, arrows move a day or a week, Space drops, Escape cancels.
  const [picked, setPickedState] = useState<{ item: Item; target: string } | null>(null);
  // Read through a ref so a blur that follows a drop never sees the stale pickup.
  const pickedRef = useRef(picked);
  const setPicked = (next: { item: Item; target: string } | null) => { pickedRef.current = next; setPickedState(next); };
  const [said, setSaid] = useState("");
  const refocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!refocus.current) return;
    const card = root.current?.querySelector<HTMLElement>(`[data-item-id="${refocus.current}"]`);
    if (card) { card.focus(); refocus.current = null; }
  });
  const say = (text: string) => setSaid((previous) => previous === text ? `${text} ` : text);
  const onCardKey = (item: Item, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const picked = pickedRef.current;
    const mine = picked && picked.item.id === item.id ? picked : null;
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      if (!picked) {
        const start = item.date ?? today;
        setPicked({ item, target: start });
        say(item.date ? `Picked up ${item.title}. ${dayName(start)}.` : `Picked up ${item.title} from ${whereLabel(item)}. Arrows place it from ${dayName(start)}.`);
      } else if (mine) {
        setPicked(null);
        if (mine.target === item.date) { say(`Dropped ${item.title}. It stays on ${dayName(mine.target)}.`); return; }
        const container: Container = `day:${mine.target}`;
        const list = listOf(container);
        refocus.current = item.id;
        void data.move(item, { date: mine.target }, dropPlacement(list, item.id, null), list);
        say(`Dropped ${item.title} on ${dayName(mine.target)}.`);
      }
      return;
    }
    if (mine) {
      const next = keyboardStep(mine.target, event.key);
      if (next) {
        event.preventDefault();
        setPicked({ item, target: next });
        say(`${dayName(next)}${next < from || next > to ? ", outside this view" : ""}.`);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setPicked(null);
        say(`Move cancelled. ${item.title} stays ${item.date ? `on ${dayName(item.date)}` : `in ${whereLabel(item)}`}.`);
      }
      return;
    }
    // Alt+Up/Down reorders within the day or tray.
    if (!picked && event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      reorder(item, event.key === "ArrowUp" ? "up" : "down");
      return;
    }
    if (event.key === "Enter") { event.preventDefault(); onOpen(item); }
  };
  /** Moves an item one place up or down within its day or tray: Alt+arrows, or Move up/down in its menu. */
  const reorder = (item: Item, direction: "up" | "down") => {
    const container = containerOf(item);
    const list = listOf(container);
    const index = list.findIndex((entry) => entry.id === item.id);
    const neighbour = list[direction === "up" ? index - 1 : index + 1];
    if (!neighbour) { say(`${item.title} is already ${direction === "up" ? "first" : "last"}.`); return; }
    refocus.current = item.id;
    void data.move(item, containerWhen(container), direction === "up" ? { before: neighbour.id } : { after: neighbour.id }, list);
    say(`Moved ${item.title} ${direction === "up" ? "above" : "below"} ${neighbour.title}.`);
  };
  const onCardBlur = (item: Item) => {
    if (pickedRef.current?.item.id !== item.id) return;
    setPicked(null);
    say(`Move cancelled. ${item.title} stays where it was.`);
  };

  // New item from the page header.
  useEffect(() => {
    if (mode !== "page") return;
    const listener = (anchor: HTMLElement) => openPop({ kind: "add", when: { date: today >= from && today <= to ? today : from } }, anchor);
    newItemListeners.add(listener);
    return () => { newItemListeners.delete(listener); };
  });

  const highlighted = picked ? `day:${picked.target}` : over;
  const card = (item: Item) => <DraggableItem key={item.id} item={item} size={size} picked={picked?.item.id === item.id} selected={selectedId === item.id}
    onOpen={onOpen} onToggle={(target, posted) => void data.setPosted(target, posted)} onMenu={(target, anchor) => openPop({ kind: "menu", item: target }, anchor)}
    onKeyDown={onCardKey} onBlur={onCardBlur} />;
  const inlineWeek = mode === "inline" && range.view === "week";
  // bb renders its own dnd-kit contexts in other React roots, whose ids also start at 0; a unique id keeps
  // each card's aria-describedby pointing at this calendar's instructions, not bb's.
  const dndId = `cc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const month = range.start.slice(0, 7);

  return <div ref={root} className={`cc-board cc-board-${mode} cc-view-${range.view}`}>
    <DndContext id={dndId} sensors={sensors} collisionDetection={collisions} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}
      onDragCancel={() => { setActive(null); setOver(null); }}
      accessibility={{ announcements, screenReaderInstructions: { draggable: "To move this item, press Space to pick it up, use the arrow keys to move it a day or a week, then press Space to drop it or Escape to cancel. Alt+Up and Alt+Down reorder it within its day. Move to… in its menu also moves it." } }}>
      <div className="cc-grid" aria-label="Calendar">
        {!inlineWeek && WEEKDAY_SHORT.map((day) => <div key={day} className="cc-dow" aria-hidden="true">{day}</div>)}
        {weeks.flat().map((date, index) => <DayCell key={date} date={date} label={inlineWeek ? `${WEEKDAY_SHORT[weekdayIndex(date)]} ${Number(date.slice(8))}` : cellNumber(date, index === 0)}
          today={date === today} weekend={weekdayIndex(date) >= 5} outside={range.view === "month" && !date.startsWith(month)} highlighted={highlighted === `day:${date}`}
          onAdd={mode === "page" ? (anchor) => openPop({ kind: "add", when: { date } }, anchor) : undefined}>
          {(byDay.get(date) ?? []).map(card)}
        </DayCell>)}
      </div>
      {children}
      {trays && <div className="cc-trays">
        {(["evergreen", "later"] as const).map((tray) => <TrayBox key={tray} tray={tray} highlighted={highlighted === `tray:${tray}`}
          onAdd={(anchor) => openPop({ kind: "add", when: { tray } }, anchor)}>
          {(tray === "evergreen" ? view.evergreen : view.later).map(card)}
        </TrayBox>)}
      </div>}
      <DragOverlay dropAnimation={null}>{active ? <ItemCardView item={active} size={size} overlay /> : null}</DragOverlay>
    </DndContext>
    <div className="cc-sr-only" aria-live="assertive" aria-atomic="true">{said}</div>
    {pop.open && popState && <Popover anchor={pop.open.anchor} onClose={closePop} align={popState.kind === "add" ? "start" : "end"} width={popState.kind === "add" ? 280 : 240}
      role={popState.kind === "menu" ? "menu" : "dialog"}
      label={popState.kind === "add" ? "New item" : popState.kind === "menu" ? `Actions for ${popState.item.title}` : `Move ${popState.item.title}`}>
      {popState.kind === "add" && <QuickAdd when={popState.when} onClose={closePop} onCreate={async (title, format) => {
        await data.add({ title, format, when: popState.when });
      }} />}
      {popState.kind === "menu" && <div className="cc-menu">
        <button type="button" role="menuitem" onClick={() => { onOpen(popState.item); closePop(); }}>Open</button>
        <button type="button" role="menuitem" onClick={() => setPopState({ kind: "move", item: popState.item })}>Move to…</button>
        {(() => {
          const list = listOf(containerOf(popState.item));
          const index = list.findIndex((entry) => entry.id === popState.item.id);
          return <>
            {index > 0 && <button type="button" role="menuitem" onClick={() => { reorder(popState.item, "up"); closePop(); }}>Move up</button>}
            {index >= 0 && index < list.length - 1 && <button type="button" role="menuitem" onClick={() => { reorder(popState.item, "down"); closePop(); }}>Move down</button>}
          </>;
        })()}
        <button type="button" role="menuitem" className="cc-danger" onClick={() => { data.remove(popState.item); closePop(); }}>Delete</button>
      </div>}
      {popState.kind === "move" && <MoveTo item={popState.item} onMove={(when) => {
        const container: Container = "date" in when ? `day:${when.date}` : `tray:${when.tray}`;
        const list = listOf(container);
        void data.move(popState.item, when, dropPlacement(list, popState.item.id, null), list);
        closePop();
      }} />}
    </Popover>}
  </div>;
}

function DraggableItem(props: Omit<Parameters<typeof ItemCardView>[0], "cardRef" | "handle" | "dragging">) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: props.item.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: `item:${props.item.id}` });
  const ref = useCallback((node: HTMLDivElement | null) => { setDragRef(node); setDropRef(node); }, [setDragRef, setDropRef]);
  return <ItemCardView {...props} cardRef={ref} dragging={isDragging} handle={{ attributes, listeners }} />;
}

function DayCell({ date, label, today, weekend, outside, highlighted, onAdd, children }: {
  date: string; label: string; today: boolean; weekend: boolean; outside: boolean; highlighted: boolean;
  onAdd?: (anchor: HTMLElement) => void; children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const className = ["cc-day", weekend ? "cc-weekend" : "", outside ? "cc-outside" : "", highlighted || isOver ? "cc-over" : ""].filter(Boolean).join(" ");
  return <div ref={setNodeRef} className={className} role="group" aria-label={dayName(date)} data-date={date}>
    <div className="cc-day-head">
      <span className={today ? "cc-today" : undefined}>{label}</span>
      {onAdd && <button type="button" className="cc-add" aria-label={`Add item on ${dayName(date)}`} onClick={(event) => onAdd(event.currentTarget)}>+</button>}
    </div>
    <div className="cc-day-items">{children}</div>
  </div>;
}

function TrayBox({ tray, highlighted, onAdd, children }: { tray: Tray; highlighted: boolean; onAdd: (anchor: HTMLElement) => void; children: ReactNode[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tray:${tray}` });
  return <section ref={setNodeRef} className={highlighted || isOver ? "cc-tray cc-over" : "cc-tray"} aria-label={TRAY_LABELS[tray]}>
    <h2><span>{TRAY_LABELS[tray]} <small>{TRAY_HINTS[tray]}</small></span>
      <button type="button" className="cc-text-button" aria-label={`Add item to ${TRAY_LABELS[tray]}`} onClick={(event) => onAdd(event.currentTarget)}>Add</button></h2>
    {children.length ? <div className="cc-tray-items">{children}</div> : <p className="cc-empty-line">Drop items here.</p>}
  </section>;
}

export function FormatSelect({ value, onChange, id, label = "Format" }: { value: Format | null; onChange: (value: Format | null) => void; id?: string; label?: string }) {
  return <select id={id} aria-label={id ? undefined : label} className="cc-input" value={value ?? ""} onChange={(event) => onChange(event.target.value ? event.target.value as Format : null)}>
    {FORMATS.map((format) => <option key={format} value={format}>{FORMAT_LABELS[format]}</option>)}
    <option value="">{NO_FORMAT_LABEL}</option>
  </select>;
}

/** Quick add: a title and a format (the last one used). Enter creates the item. */
function QuickAdd({ when, onCreate, onClose }: { when: When; onCreate: (title: string, format: Format | null) => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<Format | null>(() => { const saved = lastFormat(); return (FORMATS as readonly string[]).includes(saved) ? saved as Format : saved === "" ? null : "tweet"; });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <form className="cc-quick-add" onSubmit={(event) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true); setError(null);
    rememberFormat(format ?? "");
    onCreate(title.trim(), format).then(onClose, (err: unknown) => { setError(readableError(err)); setBusy(false); });
  }}>
    <p className="cc-muted">{"date" in when ? `New item on ${dayName(when.date)}` : `New item in ${TRAY_LABELS[when.tray]}`}</p>
    <input className="cc-input" aria-label="Title" placeholder="Title" autoFocus value={title} maxLength={300} onChange={(event) => setTitle(event.target.value)} />
    <div className="cc-row-actions">
      <FormatSelect value={format} onChange={setFormat} />
      <button type="submit" className="cc-button cc-primary" disabled={!title.trim() || busy}>{busy ? "Adding…" : "Add"}</button>
    </div>
    {error && <p className="cc-error" role="alert">{error}</p>}
  </form>;
}

/** Move to…: a date, Evergreen, or Later. The click-only alternative to dragging. */
export function MoveTo({ item, onMove }: { item: Item; onMove: (when: When) => void }) {
  const [date, setDate] = useState(item.date ?? todayInCalendar());
  return <form className="cc-move" onSubmit={(event) => { event.preventDefault(); if (date) onMove({ date }); }}>
    <label className="cc-muted" htmlFor={`cc-move-${item.id}`}>Move “{item.title}” to</label>
    <div className="cc-row-actions">
      <input id={`cc-move-${item.id}`} className="cc-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} autoFocus />
      <button type="submit" className="cc-button cc-primary" disabled={!date || date === item.date}>Move</button>
    </div>
    <div className="cc-row-actions">
      {(["evergreen", "later"] as const).map((tray) => <button key={tray} type="button" className="cc-button" disabled={item.tray === tray} onClick={() => onMove({ tray })}>{TRAY_LABELS[tray]}</button>)}
    </div>
  </form>;
}
