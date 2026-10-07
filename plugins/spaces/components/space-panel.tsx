// The Space tab: loads what the server says about this thread's Space, keeps it fresh, and renders the member or
// outside view. Live status comes from bb's sidebar so cards move the moment a thread changes.
import {
  experimental_useSidebarThreads as useSidebarThreads,
  useRealtime,
  useRealtimeConnectionState,
  type PluginThreadPanelProps,
} from "@get-bb/plugin-sdk/app";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { PanelState } from "../contract";
import { REALTIME_CHANNEL } from "../shared";
import { MemberView } from "./member-view";
import { OutsideView } from "./outside-view";
import { errorMessage, useSpacesRpc } from "./rpc";
import { Button } from "./ui/button";

const REFRESH_DEBOUNCE_MS = 120;

export function SpacePanel({ threadId }: PluginThreadPanelProps) {
  const call = useSpacesRpc();
  const live = useSidebarThreads();
  const [loaded, setLoaded] = useState<{ threadId: string; state: PanelState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const request = ++requested.current;
    try {
      const state = await call("panelState", { threadId });
      if (request !== requested.current) return;
      setLoaded({ threadId, state });
      setError(null);
    } catch (reason) {
      if (request === requested.current) setError(errorMessage(reason));
    }
  }, [call, threadId]);

  const refresh = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void load();
    }, REFRESH_DEBOUNCE_MS);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const connection = useRealtimeConnectionState();
  const previousConnection = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previousConnection.current !== "connected") refresh();
    previousConnection.current = connection;
  }, [connection, refresh]);

  const panel = loaded?.threadId === threadId ? loaded.state : null;
  const shownSection = useRef<string | null>(null);
  shownSection.current = panel?.kind === "member" ? panel.space.sectionId : null;
  useRealtime(REALTIME_CHANNEL, (payload) => {
    // A member view only cares about its own Space; anything may change what an outside view offers.
    const sectionIds = (payload as { sectionIds?: unknown } | null)?.sectionIds;
    const mine = shownSection.current;
    if (mine !== null && Array.isArray(sectionIds) && !sectionIds.includes(mine)) return;
    refresh();
  });

  // Dragging this thread to another section, or nesting it, changes its Space without a Spaces event.
  const self = live.status === "ready" ? live.threads.find((thread) => thread.id === threadId) : undefined;
  const placement = self ? `${self.sectionId ?? ""}|${self.parentThreadId ?? ""}` : null;
  const lastPlacement = useRef(placement);
  useEffect(() => {
    if (placement === lastPlacement.current) return;
    const known = lastPlacement.current !== null;
    lastPlacement.current = placement;
    if (known && placement !== null) refresh();
  }, [placement, refresh]);

  const liveThreads = live.status === "ready" ? live.threads : null;

  let content: ReactNode;
  if (panel === null) {
    content = error ? (
      <div role="alert" className="flex items-center gap-2 px-4 py-3 text-xs text-destructive-text">
        <span className="min-w-0 flex-1">{error}</span>
        <Button variant="outline" size="xs" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    ) : (
      <p className="m-0 px-4 py-3 text-muted-foreground">Loading…</p>
    );
  } else if (panel.kind === "member") {
    content = (
      <MemberView
        key={panel.space.sectionId}
        call={call}
        threadId={threadId}
        space={panel.space}
        live={liveThreads}
        onChanged={refresh}
      />
    );
  } else {
    content = (
      <OutsideView
        call={call}
        threadId={threadId}
        state={panel}
        parentThreadId={self?.parentThreadId ?? null}
        onChanged={refresh}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background font-sans text-sm text-foreground">
      {panel !== null && error ? (
        <div role="alert" className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-1.5 text-xs text-destructive-text">
          <span className="min-w-0 flex-1">Couldn't refresh this Space. {error}</span>
          <Button variant="ghost" size="xs" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      ) : null}
      {content}
    </div>
  );
}
