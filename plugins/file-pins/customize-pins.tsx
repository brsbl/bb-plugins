import { useLayoutEffect, useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./components/ui/button.js";
import { PinPopover, PinPopoverContent, PinPopoverTrigger } from "./pin-popover.js";
import { ReferenceIcon } from "./reference-icon.js";
import type { Reference } from "./contract.js";

const pinContent = "inline-flex h-7 min-w-0 max-w-48 items-center gap-1.5 pl-1.5 pr-5 text-xs";
export function CustomizePins({ pins, busy, onMove, onRemove, onDone }: {
  pins: Reference[]; busy: boolean; onMove(pinId: string, overId: string): void; onRemove(pin: Reference): void; onDone(): void;
}) {
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const row = useRef<HTMLElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const done = useRef<HTMLButtonElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const moreMeasure = useRef<HTMLSpanElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useLayoutEffect(() => {
    if (!row.current || !measure.current) return;
    const fit = () => {
      const widths = Array.from(measure.current?.children ?? [], (node) => (node as HTMLElement).offsetWidth);
      const space = (row.current?.clientWidth ?? 0) - (label.current?.offsetWidth ?? 0) - (done.current?.offsetWidth ?? 0) - 16;
      if (widths.reduce((sum, width) => sum + width + 4, 0) <= space) { setVisible(widths.length); return; }
      const available = space - (moreMeasure.current?.offsetWidth ?? 36) - 4;
      let used = 0, count = 0;
      for (const width of widths) { if (used + width + 4 > available) break; used += width + 4; count++; }
      setVisible(count);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(row.current); observer.observe(measure.current);
    return () => observer.disconnect();
  }, [pins]);
  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id || busy) return;
    const handle = handles.current.get(id);
    if (handle) { handle.focus(); pendingFocus.current = null; }
    else if (pins.some((pin) => pin.id === id)) setMoreOpen(true);
    else pendingFocus.current = null;
  }, [pins, busy, visible, moreOpen]);
  const move = (id: string, over: string) => { pendingFocus.current = id; onMove(id, over); };
  const handleRef = (id: string, node: HTMLButtonElement | null) => { if (node) handles.current.set(id, node); else handles.current.delete(id); };
  const overflow = pins.slice(visible);
  return <section ref={row} aria-label="Customize pins" className="relative flex min-w-0 items-center gap-1 px-1 py-1" onKeyDown={(event) => {
    if (event.key === "Escape" && !event.defaultPrevented && !dragging) { event.preventDefault(); onDone(); }
  }}>
    <span ref={label} className="mr-1 shrink-0 text-xs text-muted-foreground">Pinned</span>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={({ active, over }) => {
      setDragging(false);
      if (over && active.id !== over.id) move(String(active.id), String(over.id));
    }}>
      <SortableContext items={pins.map((pin) => pin.id)} strategy={rectSortingStrategy}>
        {pins.slice(0, visible).map((pin) => <PinRow key={pin.id} pin={pin} busy={busy} reorderDisabled={busy || pins.length < 2} handleRef={handleRef} onRemove={() => onRemove(pin)} />)}
        {overflow.length > 0 && <PinPopover open={moreOpen} onOpenChange={setMoreOpen}>
          <PinPopoverTrigger asChild><button type="button" aria-label={`${overflow.length} more pins to customize`} className="h-7 shrink-0 rounded px-1.5 text-xs tabular-nums text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">+{overflow.length}</button></PinPopoverTrigger>
          <PinPopoverContent aria-label="Customize more pins" className="w-80 p-1">
            <div className="max-h-64 space-y-1 overflow-y-auto p-1">
              {overflow.map((pin) => {
                const index = pins.findIndex((item) => item.id === pin.id);
                return <div key={pin.id} className="flex min-w-0 items-center gap-1">
                  <PinRow pin={pin} busy={busy} reorderDisabled={busy || pins.length < 2} handleRef={handleRef} onRemove={() => onRemove(pin)} inList />
                  <button type="button" aria-label={`Move ${pin.name} earlier`} title="Move earlier" disabled={busy || index === 0} onClick={() => move(pin.id, pins[index - 1]!.id)} className="size-6 shrink-0 rounded text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">←</button>
                  <button type="button" aria-label={`Move ${pin.name} later`} title="Move later" disabled={busy || index === pins.length - 1} onClick={() => move(pin.id, pins[index + 1]!.id)} className="size-6 shrink-0 rounded text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">→</button>
                </div>;
              })}
            </div>
          </PinPopoverContent>
        </PinPopover>}
      </SortableContext>
    </DndContext>
    {pins.length === 0 && <span className="min-w-0 text-xs text-muted-foreground">No pinned files.</span>}
    <Button ref={done} autoFocus type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent focus-visible:ring-2" onClick={onDone}>Done</Button>
    <span className="sr-only">Drag to reorder. Or press Space, then arrow keys.</span>
    <div aria-hidden="true" className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
      <div ref={measure} className="flex w-max">{pins.map((pin) => <span key={pin.id} className={`${pinContent} shrink-0`}><ReferenceIcon name={pin.name} moss={pin.moss} /><span className="truncate">{pin.name}</span></span>)}</div>
      <span ref={moreMeasure} className="inline-block h-7 w-max px-1.5 text-xs tabular-nums">+{pins.length}</span>
    </div>
  </section>;
}
function PinRow({ pin, busy, reorderDisabled, onRemove, handleRef, inList = false }: {
  pin: Reference; busy: boolean; reorderDisabled: boolean; onRemove(): void; handleRef(id: string, node: HTMLButtonElement | null): void; inList?: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({ id: pin.id, disabled: reorderDisabled, transition: null, animateLayoutChanges: () => false });
  return <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), position: isDragging ? "relative" : undefined, zIndex: isDragging ? 1 : undefined }}
    className={`relative flex min-w-0 items-center text-xs ${inList ? "flex-1" : "shrink-0"} ${pin.status === "missing" ? "text-destructive/55" : "rounded text-muted-foreground hover:bg-state-hover"}`}>
    <button ref={(node) => { setActivatorNodeRef(node); handleRef(pin.id, node); }} type="button" {...attributes} {...listeners} disabled={reorderDisabled} aria-label={`Reorder ${pin.name}${pin.status === "missing" ? " (missing)" : ""}`}
      title={`${pin.path}\n${pin.hostName}\nSpace to pick up, arrow keys to move, Space to drop`}
      className={`${pinContent} cursor-grab touch-none rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing ${inList ? "w-full max-w-none" : ""}`}>
      <ReferenceIcon name={pin.name} moss={pin.moss} /><span className="truncate">{pin.name}</span>
    </button>
    <button type="button" disabled={busy} aria-label={`Remove ${pin.name}`} title={`Remove ${pin.name}`} onClick={onRemove}
      className="absolute right-0 -top-1 flex size-5 items-center justify-center rounded-sm text-xs text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
  </div>;
}
