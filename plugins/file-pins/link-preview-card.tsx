import { useEffect, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";
import type { LinkPreview } from "./link-preview.js";
import { UrlPinIcon } from "./url-pin-icon.js";
import { urlPinName } from "./url-pin.js";

// Moss EmbedPillHoverCard's media band and compact metadata
// panel. Keep this plugin's URL header, and use BB's opaque themed surfaces.
export function LinkPreviewCard({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [failedImage, setFailedImage] = useState(false);
  useEffect(() => {
    let current = true;
    setPreview(null); setFailedImage(false);
    void rpc.call("preview", { threadId, pinId: pin.id }).then(({ preview: value }) => {
      if (current) setPreview(value);
    }, () => {});
    return () => { current = false; };
  }, [rpc, threadId, pin.id]);
  const site = preview?.site || new URL(pin.url).hostname.replace(/^www\./, "");
  const title = pin.name !== urlPinName(pin.url) ? pin.name : preview?.title || pin.name;
  const image = preview?.image && /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+=*$/.test(preview.image) && !failedImage ? preview.image : null;
  return <>
    <div className="flex h-28 items-center justify-center overflow-hidden border-b bg-muted/30">
      {image ? <img src={image} alt="" draggable={false} onError={() => setFailedImage(true)} className="h-full w-full object-cover" />
        : <span className="flex size-14 items-center justify-center rounded-xl border bg-popover shadow-sm [&_img]:size-10 [&_svg]:size-10"><UrlPinIcon threadId={threadId} pin={pin} /></span>}
    </div>
    <div className="space-y-1 px-3 py-2">
      <div className="truncate text-[11px] leading-4 text-muted-foreground">{site}</div>
      <div className="line-clamp-2 text-xs font-medium leading-5">{title}</div>
      {preview?.description && preview.description !== title && <div className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{preview.description}</div>}
    </div>
  </>;
}
