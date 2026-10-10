import { useEffect, useState } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";
import type { LinkPreview } from "./link-preview.js";
import { UrlPinIcon } from "./url-pin-icon.js";
import { urlPinName } from "./url-pin.js";

// Fit the card to the image's aspect ratio, keeping text readable on narrow previews.
export function LinkPreviewCard({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [failedImage, setFailedImage] = useState(false);
  const [imageWidth, setImageWidth] = useState(288);
  useEffect(() => {
    let current = true;
    setPreview(null); setFailedImage(false); setImageWidth(288);
    void rpc.call("preview", { threadId, pinId: pin.id }).then(({ preview: value }) => {
      if (current) setPreview(value);
    }, () => {});
    return () => { current = false; };
  }, [rpc, threadId, pin.id]);
  const site = preview?.site || new URL(pin.url).hostname.replace(/^www\./, "");
  const title = pin.name !== urlPinName(pin.url) ? pin.name : preview?.title || pin.name;
  const image = preview?.image && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(preview.image) && !failedImage ? preview.image : null;
  return <div style={{ width: image ? imageWidth : 256 }} className="max-w-[calc(100vw-24px)]">
    <div className="border-b bg-muted/30 px-3 py-2 text-[11px] leading-4 text-muted-foreground break-all">{pin.url}</div>
    {image && <img src={image} alt="" draggable={false} onError={() => setFailedImage(true)}
      onLoad={({ currentTarget }) => setImageWidth(Math.round(Math.min(288, Math.max(192, 192 * currentTarget.naturalWidth / currentTarget.naturalHeight))))}
      className="block h-auto max-h-60 w-full border-b object-contain" />}
    <div className="space-y-1 px-4 py-3">
      <div className="flex min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
        {!image && <span className="shrink-0"><UrlPinIcon threadId={threadId} pin={pin} /></span>}
        <span className="truncate">{site}</span>
      </div>
      <div className="line-clamp-2 text-xs font-medium leading-5">{title}</div>
      {preview?.description && preview.description !== title && <div className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{preview.description}</div>}
    </div>
  </div>;
}
