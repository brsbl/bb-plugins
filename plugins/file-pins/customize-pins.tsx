import { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./components/ui/button.js";
import { ReferenceIcon } from "./reference-icon.js";
import type { Reference } from "./contract.js";

export function CustomizePins({ pins, busy, onMove, onRemove, onDone }: {
  pins: Reference[]; busy: boolean; onMove(pinId: string, overId: string): void; onRemove(pin: Reference): void; onDone(): void;
}) {
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return <section aria-label="Customize pins" className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-2 px-1 py-1" onKeyDown={(event) => {
    if (event.key === "Escape" && !event.defaultPrevented && !dragging) { event.preventDefault(); onDone(); }
  }}>
    <span className="mr-1 shrink-0 text-xs text-muted-foreground">Pinned</span>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={({ active, over }) => {
      setDragging(false);
      if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
    }}>
      <SortableContext items={pins.map((pin) => pin.id)} strategy={rectSortingStrategy}>
        <ul aria-label="Pinned files order" className="contents">
          {pins.map((pin) => <PinRow key={pin.id} pin={pin} busy={busy} reorderDisabled={busy || pins.length < 2} onRemove={() => onRemove(pin)} />)}
        </ul>
      </SortableContext>
    </DndContext>
    {pins.length === 0 && <span className="min-w-0 flex-1 text-xs text-muted-foreground">No pinned files.</span>}
    <Button autoFocus type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent focus-visible:ring-2" onClick={onDone}>Done</Button>
    <span className="sr-only">Drag horizontally to reorder. Or press Space, then arrow keys.</span>
  </section>;
}
function PinRow({ pin, busy, reorderDisabled, onRemove }: { pin: Reference; busy: boolean; reorderDisabled: boolean; onRemove(): void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({ id: pin.id, disabled: reorderDisabled, transition: null, animateLayoutChanges: () => false });
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), position: isDragging ? "relative" : undefined, zIndex: isDragging ? 1 : undefined }}
    className={`relative flex shrink-0 items-center rounded text-xs ${pin.status === "missing" ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-state-hover"}`}>
    <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} disabled={reorderDisabled} aria-label={`Reorder ${pin.name}${pin.status === "missing" ? " (missing)" : ""}`}
      title={`${pin.path}\n${pin.hostName}\nSpace to pick up, arrow keys to move, Space to drop`}
      className="inline-flex h-7 max-w-48 cursor-grab touch-none items-center gap-1.5 rounded pl-1.5 pr-5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing">
      <ReferenceIcon name={pin.name} moss={pin.moss} /><span className="truncate">{pin.name}</span>
    </button>
    <button type="button" disabled={busy} aria-label={`Remove ${pin.name}`} title={`Remove ${pin.name}`} onClick={onRemove}
      className="absolute right-0 -top-1 flex size-5 items-center justify-center rounded-sm text-xs text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
  </li>;
}
