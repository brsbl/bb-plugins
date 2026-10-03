import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { closestCenter, DndContext, KeyboardSensor, MouseSensor, pointerWithin, TouchSensor, useDroppable, useSensor, useSensors, type CollisionDetection } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./components/ui/button.js";
import { CHROME_SECTION_LABEL_CLASS } from "./components/ui/chrome-style-tokens.js";
import { Icon } from "./components/ui/icon.js";
import { cn } from "./lib/utils.js";
import { PIN_SLOT_CLASS, type PinLayout } from "./pin-layout.js";
import { ReferenceIcon } from "./reference-icon.js";
import type { Reference } from "./contract.js";

// Copied from bb's SidebarFooterCustomize so pins customize the same way the footer does.
const BADGE_CLASS =
  "flex size-4 cursor-pointer items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground outline-none after:absolute after:-inset-1.5 after:content-[''] hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:cursor-default disabled:opacity-40";
const TILE_CLASS = cn(PIN_SLOT_CLASS, "h-8 max-md:pointer-coarse:h-9");
const SORTABLE_TRANSITION = { duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" };
const SLOT_PREFIX = "pin-slot:";
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
};

export function CustomizePins({ layout, capacity, busy, onRemoveFromStrip, onAddToStrip, onMove, onUnpin, onDone }: {
  layout: PinLayout<Reference>; capacity: number | null; busy: boolean;
  onRemoveFromStrip(id: string): void; onAddToStrip(id: string): void; onMove(activeId: string, overId: string | null): void;
  onUnpin(pin: Reference): void; onDone(): void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusAfter = useRef<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useEffect(() => {
    containerRef.current?.querySelector<HTMLButtonElement>("[data-pin-placement-toggle]")?.focus();
  }, []);
  // A badge moves its pin to the other zone; keep keyboard focus on that pin.
  useLayoutEffect(() => {
    const id = focusAfter.current;
    if (!id) return;
    focusAfter.current = null;
    const toggle = containerRef.current?.querySelector<HTMLButtonElement>(`[data-pin-placement-toggle="${id}"]`);
    const target = toggle && !toggle.disabled ? toggle : containerRef.current?.querySelector<HTMLButtonElement>(`[data-pin-handle="${id}"]`);
    target?.focus();
  });
  const place = (id: string, action: (id: string) => void) => { focusAfter.current = id; action(id); };
  const emptySlots = Math.max(0, (capacity ?? 0) - layout.strip.length);

  return (
    <div
      ref={containerRef}
      className="rounded-lg bg-sidebar-accent/40 py-1"
      data-testid="file-pins-customize-inline"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || event.defaultPrevented || dragging) return;
        event.preventDefault();
        onDone();
      }}
    >
      <div className="flex items-center gap-1 px-1 pb-1">
        <div className={cn("min-w-0 flex-1 px-2 py-1", CHROME_SECTION_LABEL_CLASS)}>Customize pins</div>
        <Button type="button" variant="ghost" size="sm" className="h-6 shrink-0 px-2 text-xs text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent focus-visible:ring-2" onClick={onDone}>
          Done
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={() => setDragging(true)}
        onDragCancel={() => setDragging(false)}
        onDragEnd={({ active, over }) => {
          setDragging(false);
          if (typeof active.id !== "string" || typeof over?.id !== "string") return;
          onMove(active.id, over.id.startsWith(SLOT_PREFIX) ? null : over.id);
        }}
      >
        <div className="relative flex items-center gap-1 overflow-hidden bg-sidebar-accent px-3 py-2">
          <ul aria-label="Pinned" className="flex min-w-0 flex-1 items-center justify-between gap-1">
            <SortableContext items={layout.strip.map((pin) => pin.id)} strategy={horizontalListSortingStrategy}>
              {layout.strip.map((pin) => (
                <PinTile key={pin.id} pin={pin} busy={busy} onRemove={() => place(pin.id, onRemoveFromStrip)} />
              ))}
            </SortableContext>
            {Array.from({ length: emptySlots }, (_, index) => <EmptySlot key={index} index={index} />)}
          </ul>
        </div>
        {layout.more.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-2 text-xs text-muted-foreground">More pins</div>
            <ul aria-label="More pins" className="space-y-0.5 px-2">
              <SortableContext items={layout.more.map((pin) => pin.id)} strategy={verticalListSortingStrategy}>
                {layout.more.map((pin) => (
                  <MorePinRow key={pin.id} pin={pin} busy={busy} addDisabled={layout.isFull}
                    onAdd={() => place(pin.id, onAddToStrip)} onUnpin={() => onUnpin(pin)} />
                ))}
              </SortableContext>
            </ul>
          </>
        )}
      </DndContext>
    </div>
  );
}

function usePinSortable(id: string, disabled: boolean) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } =
    useSortable({ id, disabled, transition: SORTABLE_TRANSITION });
  const style = useMemo<CSSProperties>(() => ({
    transform: CSS.Translate.toString(transform),
    transition,
    position: isDragging ? "relative" : undefined,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  }), [isDragging, transform, transition]);
  return { handle: { ref: setActivatorNodeRef, ...attributes, ...listeners, "data-pin-handle": id }, setNodeRef, style };
}

function PinName({ pin }: { pin: Reference }) {
  return <>
    <ReferenceIcon name={pin.name} moss={pin.moss} />
    <span className="min-w-0 truncate">{pin.name}</span>
    {pin.status === "missing" && <span className="sr-only"> (missing)</span>}
  </>;
}

function PinTile({ pin, busy, onRemove }: { pin: Reference; busy: boolean; onRemove(): void }) {
  const { handle, setNodeRef, style } = usePinSortable(pin.id, busy);
  return (
    <li ref={setNodeRef} style={style} className="relative flex shrink-0">
      <button
        type="button"
        {...handle}
        aria-label={`Reorder ${pin.name}${pin.status === "missing" ? " (missing)" : ""}`}
        title={`${pin.path}\n${pin.hostName}`}
        className={cn(
          TILE_CLASS,
          "flex touch-none items-center gap-1.5 rounded-md border border-sidebar-foreground/15 bg-sidebar px-2 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          // Like the strip, a missing pin has no pill: just its tinted name in the tile's slot.
          pin.status === "missing" && "border-transparent bg-transparent text-destructive/55",
          !busy && "cursor-grab active:cursor-grabbing",
        )}
      >
        <PinName pin={pin} />
      </button>
      <button
        type="button"
        aria-label={`Move ${pin.name} to More pins`}
        data-pin-placement-toggle={pin.id}
        disabled={busy}
        className={cn(BADGE_CLASS, "absolute -top-1.5 right-0")}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onRemove}
      >
        <Icon name="Minus" className="size-3" />
      </button>
    </li>
  );
}

function EmptySlot({ index }: { index: number }) {
  const { setNodeRef } = useDroppable({ id: `${SLOT_PREFIX}${index}` });
  return <li ref={setNodeRef} aria-hidden="true" className={cn(TILE_CLASS, "shrink-0 rounded-md border border-dashed border-sidebar-foreground/20")} />;
}

function MorePinRow({ pin, busy, addDisabled, onAdd, onUnpin }: {
  pin: Reference; busy: boolean; addDisabled: boolean; onAdd(): void; onUnpin(): void;
}) {
  const { handle, setNodeRef, style } = usePinSortable(pin.id, busy);
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex min-h-7 items-center gap-1 rounded-md px-1 text-xs text-sidebar-foreground hover:bg-sidebar-accent focus-within:bg-sidebar-accent"
      data-pin-more-item={pin.id}
    >
      <button
        type="button"
        {...handle}
        aria-label={`Reorder ${pin.name}${pin.status === "missing" ? " (missing)" : ""}`}
        className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-subtle-foreground/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
      >
        <Icon name="DragDropVertical" className="size-4" />
      </button>
      <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 px-1", pin.status === "missing" && "text-destructive/55")} title={`${pin.path}\n${pin.hostName}`}>
        <PinName pin={pin} />
      </span>
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <button type="button" aria-label={`Add ${pin.name} to Pinned`} data-pin-placement-toggle={pin.id} disabled={busy || addDisabled} className={cn(BADGE_CLASS, "relative")} onClick={onAdd}>
          <Icon name="Plus" className="size-3" />
        </button>
      </span>
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <button type="button" aria-label={`Unpin ${pin.name}`} disabled={busy} className={cn(BADGE_CLASS, "relative")} onClick={onUnpin}>
          <Icon name="X" className="size-3" />
        </button>
      </span>
    </li>
  );
}
