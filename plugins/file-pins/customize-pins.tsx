import { useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
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
  return <section aria-label="Customize pins" className="rounded-lg bg-sidebar-accent/40 py-1" onKeyDown={(event) => {
    if (event.key === "Escape" && !event.defaultPrevented && !dragging) { event.preventDefault(); onDone(); }
  }}>
    <div className="flex items-center gap-1 px-1 pb-1">
      <div className="min-w-0 flex-1 px-2 py-1 text-xs font-normal leading-5 text-subtle-foreground/75">Customize pins</div>
      <Button autoFocus type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent focus-visible:ring-2" onClick={onDone}>Done</Button>
    </div>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={() => setDragging(true)} onDragCancel={() => setDragging(false)} onDragEnd={({ active, over }) => {
      setDragging(false);
      if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
    }}>
      <SortableContext items={pins.map((pin) => pin.id)} strategy={verticalListSortingStrategy}>
        <ul aria-label="Pinned files order" className="max-h-56 space-y-0.5 overflow-y-auto px-2">
          {pins.map((pin) => <PinRow key={pin.id} pin={pin} busy={busy} reorderDisabled={busy || pins.length < 2} onRemove={() => onRemove(pin)} />)}
        </ul>
      </SortableContext>
    </DndContext>
    {pins.length === 0 && <p className="px-3 py-1 text-xs text-muted-foreground">No pinned files.</p>}
    {pins.length > 1 && <p className="px-3 pt-1 text-xs text-muted-foreground">Drag to reorder. Or press Space, then arrow keys.</p>}
  </section>;
}
function PinRow({ pin, busy, reorderDisabled, onRemove }: { pin: Reference; busy: boolean; reorderDisabled: boolean; onRemove(): void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({ id: pin.id, disabled: reorderDisabled, transition: null, animateLayoutChanges: () => false });
  return <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), position: isDragging ? "relative" : undefined, zIndex: isDragging ? 1 : undefined }}
    className="flex min-h-7 items-center gap-1 rounded-md px-1 text-xs text-sidebar-foreground hover:bg-sidebar-accent focus-within:bg-sidebar-accent">
    <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} disabled={reorderDisabled} aria-label={`Reorder ${pin.name}`}
      title={`Reorder ${pin.name}: Space to pick up, arrow keys to move, Space to drop`}
      className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-subtle-foreground/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing disabled:opacity-40">
      <Icon name="DragDropVertical" className="size-4" />
    </button>
    <ReferenceIcon name={pin.name} moss={pin.moss} />
    <span className="min-w-0 flex-1 truncate px-1" title={`${pin.path}\n${pin.hostName}`}>{pin.name}{pin.status === "missing" && " (missing)"}</span>
    <button type="button" disabled={busy} aria-label={`Remove ${pin.name}`} title={`Remove ${pin.name}`} onClick={onRemove}
      className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">×</button>
  </li>;
}
