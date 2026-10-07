import { useEffect, useState } from "react";
import { experimental_Icon as Icon, experimental_useSidebarThreadPullRequest, useRpc } from "@get-bb/plugin-sdk/app";
import { iconUrl } from "@brsbl/bb-website-icons/url";
import type { UrlPin, rpcContract } from "./contract.js";
import { githubPullRequest, prKey, type PrState } from "./pr-state.js";
import { isLocalUrl } from "./url-pin.js";

// One lookup per origin per page; the server caches origins across clients and restarts.
// Misses are not remembered here, so a pin mounted later asks again.
const favicons = new Map<string, Promise<string | null>>();
const SAFE_ICON = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

// One request per PR per minute on this page, shared by the strip, the ⋯ list and the measuring row.
const prStates = new Map<string, { at: number; state: Promise<PrState | null> }>();
const PR_POLL_MS = 5 * 60_000;
const noThreadPr = () => ({ isLoading: false, pullRequest: null });

// GitHub's pull request glyphs as outlines, in bb's own PR status colors so themes recolor them.
const PR_LOOKS: Record<PrState, { color: string; paths: string[] }> = {
  open: { color: "var(--success, currentColor)", paths: ["M13 6h3a2 2 0 0 1 2 2v7", "M6 9v12"] },
  draft: { color: "var(--muted-foreground, currentColor)", paths: ["M18 6V5", "M18 11v-1", "M6 9v12"] },
  merged: { color: "var(--pr-merged, currentColor)", paths: ["M6 21V9a9 9 0 0 0 9 9"] },
  closed: { color: "var(--destructive, currentColor)", paths: ["M6 9v12", "m21 3-6 6", "m21 9-6-6", "M18 11.5V15"] },
};

function PrStateIcon({ state }: { state: PrState }) {
  const look = PR_LOOKS[state];
  return <svg viewBox="0 0 24 24" aria-hidden="true" data-pr-state={state} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className="size-3.5 shrink-0" style={{ color: look.color }}>
    <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
    {look.paths.map((d) => <path key={d} d={d} />)}
  </svg>;
}

/** A GitHub PR's state: bb's live state when it is this thread's own PR, otherwise the plugin's cached lookup, refreshed while shown. */
function usePrState(threadId: string, pin: UrlPin): PrState | null {
  const rpc = useRpc<typeof rpcContract>();
  const pr = githubPullRequest(pin.url);
  const own = (experimental_useSidebarThreadPullRequest ?? noThreadPr)(threadId).pullRequest;
  const ownState = pr && own && githubPullRequest(own.url) && prKey(githubPullRequest(own.url)!) === prKey(pr) ? own.state : null;
  const [state, setState] = useState<PrState | null>(null);
  const key = pr ? prKey(pr) : null;
  useEffect(() => {
    if (key === null || ownState !== null) return;
    let current = true;
    const look = () => {
      let entry = prStates.get(key);
      if (!entry || Date.now() - entry.at > 60_000) {
        entry = { at: Date.now(), state: rpc.call("prState", { threadId, pinId: pin.id }).then(({ state: next }) => next, () => null) };
        prStates.set(key, entry);
      }
      void entry.state.then((next) => { if (current && next !== null) setState(next); });
    };
    look();
    const timer = setInterval(look, PR_POLL_MS);
    return () => { current = false; clearInterval(timer); };
  }, [rpc, threadId, pin.id, key, ownState]);
  return ownState ?? state;
}

/** A GitHub PR's state, else the favicon Compact Links would show for this URL, a terminal for a dev server, or a globe while loading, without one, or if it fails to paint. */
export function UrlPinIcon({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const prState = usePrState(threadId, pin);
  const local = isLocalUrl(pin.url);
  // Ask only for icons the server would fetch: a public HTTPS site with no port.
  const origin = iconUrl(pin.url)?.origin ?? null;
  const [icon, setIcon] = useState<string | null>(null);
  useEffect(() => {
    if (origin === null) return;
    let current = true;
    let request = favicons.get(origin);
    if (!request) {
      request = rpc.call("icon", { threadId, pinId: pin.id }).then(({ dataUrl }) => dataUrl && SAFE_ICON.test(dataUrl) ? dataUrl : null, () => null);
      favicons.set(origin, request);
      const pending = request;
      void pending.then((value) => { if (value === null && favicons.get(origin) === pending) favicons.delete(origin); });
    }
    void request.then((value) => { if (current) setIcon(value); });
    return () => { current = false; setIcon(null); };
  }, [rpc, threadId, pin.id, origin]);
  if (prState) return <PrStateIcon state={prState} />;
  if (local) {
    return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0">
      <rect width="18" height="18" x="3" y="3" rx="2" /><path d="m7 11 2-2-2-2M11 13h4" />
    </svg>;
  }
  // Compact Links paints favicons on white so dark glyphs stay legible in dark themes.
  return icon
    ? <img src={icon} alt="" aria-hidden="true" draggable={false} onError={() => setIcon(null)} className="size-3.5 shrink-0 rounded-[3px] bg-white object-contain" />
    // Globe ships in every supported bb; an unknown name would render the host's Zap fallback.
    : <Icon name="Globe" fallback="Globe" className="size-3.5 shrink-0" />;
}
