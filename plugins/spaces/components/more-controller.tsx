// Always mounted, renders nothing. It brings a Space out of More when something in it is new and puts it back once
// it's read and you've moved on, using bb's live sidebar. It also reopens the Space tab after "Open" in the tab.
import {
  experimental_useSidebarThreads as useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useRealtime,
  useRealtimeConnectionState,
  useSidebarSplitLayout,
} from "@get-bb/plugin-sdk/app";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PANEL_ACTION_ID, REALTIME_CHANNEL } from "../shared";
import { clearSpaceTabRequest, hasSpaceTabRequest, subscribeSpaceTabRequests } from "./open-tab-handoff";
import { useSpacesRpc, type SpacesCall } from "./rpc";
import { planSidebarVisibility, unsentRequests, type VisibilityRequest } from "./sidebar-visibility";

/** How long the decision must hold before Spaces writes it, so a burst of updates becomes one request. */
export const SIDEBAR_DEBOUNCE_MS = 1_000;
const SPACES_REFRESH_DEBOUNCE_MS = 250;
const TAB_OPEN_ATTEMPTS = 8;
const TAB_OPEN_RETRY_MS = 150;

/** Which sections are Spaces, kept fresh from realtime, reconnects, and visibility. Null until the first answer. */
function useSpaceSectionIds(call: SpacesCall): string[] | null {
  const [ids, setIds] = useState<string[] | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const { spaces } = await call("listSpaces", null);
      setIds(spaces.map((space) => space.sectionId));
    } catch {
      // Keep the last answer; the next event or reconnect tries again.
    }
  }, [call]);

  const refresh = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void load();
    }, SPACES_REFRESH_DEBOUNCE_MS);
  }, [load]);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [load, refresh]);

  useRealtime(REALTIME_CHANNEL, refresh);

  const connection = useRealtimeConnectionState();
  const previous = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previous.current !== "connected") refresh();
    previous.current = connection;
  }, [connection, refresh]);

  return ids;
}

/** Opens the Space tab on a thread that "Open" navigated to, once that thread is the one on screen. */
function useSpaceTabHandoff(threadId: string | null) {
  const navigate = useBbNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const [requests, setRequests] = useState(0);
  useEffect(() => subscribeSpaceTabRequests(() => setRequests((count) => count + 1)), []);

  useEffect(() => {
    if (threadId === null || !hasSpaceTabRequest(threadId)) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const attempt = () => {
      if (!hasSpaceTabRequest(threadId)) return;
      attempts += 1;
      // The new thread's panel may still be mounting; give it a few tries before letting the request go.
      if (navigateRef.current.openThreadPanel({ actionId: PANEL_ACTION_ID }) || attempts >= TAB_OPEN_ATTEMPTS) {
        clearSpaceTabRequest(threadId);
        return;
      }
      timer = setTimeout(attempt, TAB_OPEN_RETRY_MS);
    };
    timer = setTimeout(attempt, 0);
    return () => {
      if (timer !== null) clearTimeout(timer);
    };
  }, [threadId, requests]);
}

export function MoreController(): null {
  const call = useSpacesRpc();
  const live = useSidebarThreads();
  const { threadId } = useBbContext();
  const split = useSidebarSplitLayout();
  const spaceIds = useSpaceSectionIds(call);

  useSpaceTabHandoff(threadId);

  const viewed = useMemo(() => {
    const ids = new Set<string>();
    if (threadId) ids.add(threadId);
    for (const pane of split?.panes ?? []) if (pane.threadId) ids.add(pane.threadId);
    return [...ids];
  }, [threadId, split]);

  // Decide only from a complete picture: a loading sidebar would look like a Space with no news.
  const plan = useMemo<VisibilityRequest[] | null>(
    () =>
      live.status === "ready" && spaceIds !== null
        ? planSidebarVisibility({ spaceSectionIds: spaceIds, threads: live.threads, viewedThreadIds: viewed })
        : null,
    [live.status, live.threads, spaceIds, viewed],
  );
  const planKey = plan?.map((request) => `${request.sectionId}=${request.key}`).join("|") ?? null;
  const planRef = useRef(plan);
  planRef.current = plan;
  const sent = useRef(new Map<string, string>());

  useEffect(() => {
    if (planKey === null) return;
    const timer = setTimeout(() => {
      void (async () => {
        for (const request of unsentRequests(planRef.current ?? [], sent.current)) {
          sent.current.set(request.sectionId, request.key);
          try {
            await call("setSidebarVisibility", { sectionId: request.sectionId, show: request.show });
          } catch {
            // Stay quiet; forget the attempt so the next change in this Space tries again.
            if (sent.current.get(request.sectionId) === request.key) sent.current.delete(request.sectionId);
          }
        }
      })();
    }, SIDEBAR_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [planKey, call]);

  return null;
}
