import { useEffect, useState } from "react";
import { experimental_Icon as Icon, useRpc } from "@get-bb/plugin-sdk/app";
import { iconUrl } from "@brsbl/bb-website-icons/url";
import type { UrlPin, rpcContract } from "./contract.js";
import { isLocalUrl } from "./url-pin.js";

// One lookup per origin per page; the server caches origins across clients and restarts.
// Misses are not remembered here, so a pin mounted later asks again.
const favicons = new Map<string, Promise<string | null>>();
const SAFE_ICON = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

/** The favicon Compact Links would show for this URL, a terminal for a dev server, or a globe while loading, without one, or if it fails to paint. */
export function UrlPinIcon({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
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
