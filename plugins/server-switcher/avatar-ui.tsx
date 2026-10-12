import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@get-bb/plugin-sdk/app";
import { z } from "zod";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  bbAccountStatusSchema,
  type BbAccountStatus,
  type ServerRow,
} from "./servers.js";
import {
  RING_PRESETS,
  RINGS_CHANNEL,
  ringBackground,
  ringsSchema,
  type Ring,
  type RingSetting,
  type Rings,
  type ringsContract,
} from "./rings.js";
import { createRingStore } from "./ring-store.js";

interface AccountSnapshot {
  avatarUrl: string | null;
  revision: number;
}

let account: AccountSnapshot = { avatarUrl: null, revision: -1 };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishAccount(status: BbAccountStatus) {
  const avatarUrl = status.account?.avatarUrl ?? null;
  if (status.revision === account.revision && avatarUrl === account.avatarUrl)
    return;
  account = { avatarUrl, revision: status.revision };
  for (const listener of listeners) listener();
}

export function useAccountRevision(): number {
  return useSyncExternalStore(subscribe, () => account.revision);
}

const accountStatusResponseSchema = z.object({
  ok: z.literal(true),
  result: bbAccountStatusSchema,
});

const ACCOUNT_RETRY_MS = 5_000;

async function fetchAccountStatus(
  method: string,
  input: unknown,
  signal: AbortSignal,
): Promise<BbAccountStatus> {
  const response = await fetch(
    `/api/v1/plugins/bb-account/rpc/${encodeURIComponent(method)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal,
    },
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return accountStatusResponseSchema.parse(await response.json()).result;
}

export async function watchAccount(signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const status =
        account.revision < 0
          ? await fetchAccountStatus("bb-account.v1.status", {}, signal)
          : await fetchAccountStatus(
              "bb-account.v1.waitForStatusChange",
              { afterRevision: account.revision },
              signal,
            );
      if (!signal.aborted) publishAccount(status);
    } catch {
      if (signal.aborted) return;
      await new Promise((resolve) => setTimeout(resolve, ACCOUNT_RETRY_MS));
    }
  }
}

function useAccountAvatar(): string | null {
  return useSyncExternalStore(subscribe, () => account.avatarUrl);
}

function AvatarImage({ row }: { row: ServerRow | null }) {
  const accountAvatar = useAccountAvatar();
  const [failed, setFailed] = useState<string | null>(null);
  const url = row === null || row.account ? accountAvatar : null;
  return (
    <span className="flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-recessed text-muted-foreground">
      {url === null || failed === url ? (
        <Icon
          name="server-switcher/bb-mark"
          style={{ width: "55%", height: "55%" }}
        />
      ) : (
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full object-cover"
          onError={() => setFailed(url)}
        />
      )}
    </span>
  );
}

export function AvatarGlyph() {
  return (
    <span className="flex size-4">
      <AvatarImage row={null} />
    </span>
  );
}

const RING_SAVE_DELAY_MS = 300;

const ringStore = createRingStore(RING_SAVE_DELAY_MS);
let ringsRequested = false;

export function ringKey(row: ServerRow): string {
  return row.account ? row.name : row.id;
}

export function useRings() {
  const rpc = useRpc<typeof ringsContract>();
  const connection = useRealtimeConnectionState();
  useEffect(() => {
    ringStore.setSender((key, ring) => rpc.call("setRing", { key, ring }));
  }, [rpc]);
  useEffect(() => {
    if (ringsRequested && connection !== "connected") return;
    ringsRequested = true;
    rpc
      .call("listRings", null)
      .then(ringStore.setServerRings)
      .catch(() => {
        ringsRequested = false;
      });
  }, [rpc, connection]);
  useRealtime(RINGS_CHANNEL, (payload) => {
    const parsed = ringsSchema.safeParse(payload);
    if (parsed.success) ringStore.setServerRings(parsed.data);
  });
  const rings = useSyncExternalStore(
    ringStore.subscribe,
    ringStore.getSnapshot,
  );
  return { rings, save: ringStore.queue };
}

function RingedAvatar({
  row,
  ring,
  size,
}: {
  row: ServerRow;
  ring: Ring | null;
  size: "lg" | "sm";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex shrink-0 rounded-full p-0.5",
        size === "lg" ? "size-10" : "size-8",
        row.live === false && "opacity-50",
      )}
      style={ring === null ? undefined : { background: ringBackground(ring) }}
    >
      <span className="flex size-full rounded-full bg-sidebar p-px">
        <AvatarImage row={row} />
      </span>
      {row.live === null ? null : (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-sidebar",
            size === "lg" ? "size-2.5" : "size-2",
            row.live ? "bg-success" : "bg-muted-foreground",
          )}
        />
      )}
    </span>
  );
}

const CUSTOM_SWATCH_BACKGROUND = `conic-gradient(${[...RING_PRESETS, RING_PRESETS[0]].join(", ")})`;

const SWATCH_CLASS =
  "size-5 shrink-0 rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

const STOP_CLASS =
  "absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-2 border-sidebar shadow focus-visible:outline-none";

function sidebarEdgeOffset(trigger: HTMLElement | null): number {
  if (trigger === null) return 8;
  const panel = trigger.closest('[data-sidebar="panel"], [role="dialog"]');
  if (panel === null) return 8;
  return Math.max(
    8,
    panel.getBoundingClientRect().right -
      trigger.getBoundingClientRect().right +
      8,
  );
}

export function RingPopover({
  row,
  ring,
  size,
  canReset,
  onChange,
}: {
  row: ServerRow;
  ring: Ring | null;
  size: "lg" | "sm";
  canReset: boolean;
  onChange: (ring: RingSetting | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [stop, setStop] = useState<"from" | "to">("from");
  const [offset, setOffset] = useState(8);
  const trigger = useRef<HTMLButtonElement>(null);
  const custom = useRef<HTMLInputElement>(null);
  const active = stop === "to" && ring?.to != null ? "to" : "from";
  const pick = (color: string) => {
    if (ring === null) onChange({ from: color, to: null });
    else if (active === "to") onChange({ ...ring, to: color });
    else onChange({ ...ring, from: color });
  };
  const addStop = () => {
    if (ring === null || ring.to !== null) return;
    onChange({
      ...ring,
      to: RING_PRESETS.find((color) => color !== ring.from) ?? ring.from,
    });
    setStop("to");
  };
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setOffset(sidebarEdgeOffset(trigger.current));
          setStop("from");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          ref={trigger}
          type="button"
          aria-label={`Ring color for ${row.name}`}
          title="Ring color"
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <RingedAvatar row={row} ring={ring} size={size} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={offset}
        mobileTitle={`Ring for ${row.name}`}
        className="w-64 p-3"
        onEscapeKeyDown={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <RingedAvatar row={row} ring={ring} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium">{row.name}</span>
              {ring?.to === null || ring === null ? (
                <span className="text-2xs text-muted-foreground">
                  {ring === null
                    ? "No ring"
                    : "Click the bar to add a gradient"}
                </span>
              ) : null}
            </div>
            {canReset ? (
              <button
                type="button"
                title="Use this server's default ring"
                onClick={() => {
                  onChange(null);
                  setStop("from");
                }}
                className="shrink-0 self-start rounded px-1 text-2xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                Reset
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <div
              role="button"
              tabIndex={ring === null || ring.to !== null ? -1 : 0}
              aria-label={
                ring === null
                  ? "Pick a color below"
                  : ring.to === null
                    ? "Add a second color"
                    : "Ring gradient"
              }
              onClick={addStop}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  addStop();
                }
              }}
              className={cn(
                "relative h-4 flex-1 rounded-full",
                ring === null
                  ? "border border-dashed border-muted-foreground/50"
                  : ring.to === null && "cursor-copy",
              )}
              style={
                ring === null
                  ? undefined
                  : {
                      background:
                        ring.to === null
                          ? ring.from
                          : `linear-gradient(90deg, ${ring.from}, ${ring.to})`,
                    }
              }
            >
              {ring === null ? null : (
                <button
                  type="button"
                  aria-label="Edit first color"
                  aria-pressed={active === "from"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setStop("from");
                  }}
                  className={cn(
                    STOP_CLASS,
                    "-left-0.5",
                    active === "from" && "ring-2 ring-sidebar-foreground",
                  )}
                  style={{ background: ring.from }}
                />
              )}
              {ring?.to == null ? null : (
                <button
                  type="button"
                  aria-label="Edit second color"
                  aria-pressed={active === "to"}
                  onClick={(event) => {
                    event.stopPropagation();
                    setStop("to");
                  }}
                  className={cn(
                    STOP_CLASS,
                    "-right-0.5",
                    active === "to" && "ring-2 ring-sidebar-foreground",
                  )}
                  style={{ background: ring.to }}
                />
              )}
            </div>
            {ring?.to == null ? null : (
              <button
                type="button"
                aria-label="Remove the second color"
                title="Remove the second color"
                onClick={() => {
                  onChange({ ...ring, to: null });
                  setStop("from");
                }}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-state-hover hover:text-foreground"
              >
                <Icon name="X" className="size-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {RING_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color}`}
                onClick={() => pick(color)}
                className={SWATCH_CLASS}
                style={{ background: color }}
              />
            ))}
            <button
              type="button"
              aria-label="Pick a custom color"
              title="Pick a custom color"
              onClick={() => custom.current?.click()}
              className={SWATCH_CLASS}
              style={{ background: CUSTOM_SWATCH_BACKGROUND }}
            />
            <input
              ref={custom}
              type="color"
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              value={
                (active === "to" ? ring?.to : ring?.from) ?? RING_PRESETS[4]
              }
              onChange={(event) => pick(event.target.value)}
            />
            <button
              type="button"
              aria-label="No ring"
              title="No ring"
              aria-pressed={ring === null}
              onClick={() => onChange("none")}
              className={cn(
                SWATCH_CLASS,
                "flex items-center justify-center border border-dashed border-muted-foreground/60 text-muted-foreground aria-pressed:ring-2 aria-pressed:ring-sidebar-foreground",
              )}
            >
              <Icon name="X" className="size-2.5" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
