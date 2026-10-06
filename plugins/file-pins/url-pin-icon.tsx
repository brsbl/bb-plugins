import { useEffect, useState } from "react";
import { experimental_Icon as Icon, useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";

// One lookup per origin per page; the server caches origins across clients and restarts.
const favicons = new Map<string, Promise<string | null>>();
const SAFE_ICON = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;

/** The favicon Compact Links would show for this URL, or a generic link icon while loading, without one, or if it fails to paint. */
export function UrlPinIcon({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const origin = new URL(pin.url).origin;
  const [icon, setIcon] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    let request = favicons.get(origin);
    if (!request) {
      request = rpc.call("icon", { threadId, pinId: pin.id }).then(({ dataUrl }) => dataUrl && SAFE_ICON.test(dataUrl) ? dataUrl : null, () => null);
      favicons.set(origin, request);
    }
    void request.then((value) => { if (current) setIcon(value); });
    return () => { current = false; setIcon(null); };
  }, [rpc, threadId, pin.id, origin]);
  // Compact Links paints favicons on white so dark glyphs stay legible in dark themes.
  return icon
    ? <img src={icon} alt="" aria-hidden="true" draggable={false} onError={() => setIcon(null)} className="size-3.5 shrink-0 rounded-[3px] bg-white object-contain" />
    : <Icon name="Link" className="size-3.5 shrink-0" />;
}
