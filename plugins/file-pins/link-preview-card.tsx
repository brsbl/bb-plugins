import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";
import { previewClient, previewKey, previewProblem } from "./preview-client.js";
import { UrlPinIcon } from "./url-pin-icon.js";
import { urlPinName } from "./url-pin.js";

const SAFE_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

// Moss EmbedPillHoverCard's media band and compact metadata
// panel. Keep this plugin's URL header, and use BB's opaque themed surfaces.
// The 128px band holds the image, edge to edge; without one it holds the text itself, so nothing repeats below it.
export function LinkPreviewCard({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const key = previewKey(threadId, pin.id, pin.url);
  const subscribe = useCallback((listener: () => void) => previewClient.subscribe(key, listener), [key]);
  const { answer, failed } = useSyncExternalStore(subscribe, () => previewClient.state(key));
  useEffect(() => {
    void previewClient.load(key, () => rpc.call("preview", { threadId, pinId: pin.id }));
  }, [rpc, key, threadId, pin.id]);
  const preview = answer?.preview ?? null;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const site = preview?.site || new URL(pin.url).hostname.replace(/^www\./, "");
  const title = pin.name !== urlPinName(pin.url) ? pin.name : preview?.title || pin.name;
  const image = preview?.image && SAFE_IMAGE.test(preview.image) && failedImage !== preview.image ? preview.image : null;
  const description = preview?.description && preview.description !== title ? preview.description : "";
  const settled = answer !== undefined || failed;
  if (image || !settled) return <>
    <div className="flex h-32 items-center justify-center overflow-hidden border-b bg-muted/30">
      {image ? <img src={image} alt="" draggable={false} onError={() => setFailedImage(image)} className="h-full w-full object-cover" />
        : <span role="status" aria-label="Loading preview" className="h-full w-full animate-pulse bg-muted/60" />}
    </div>
    <div className="space-y-1 px-4 py-3">
      <div className="truncate text-[11px] leading-4 text-muted-foreground">{site}</div>
      <div className="line-clamp-2 text-xs font-medium leading-5">{title}</div>
      {description && <div className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{description}</div>}
    </div>
  </>;
  // Text-only when the page answered without a usable image; unavailable when no preview has ever loaded.
  const note = preview ? description : previewProblem(failed ? undefined : answer);
  return <div className="flex h-32 flex-col overflow-hidden px-4 py-3">
    <div className="flex h-4 min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground [&_img]:size-3.5 [&_svg]:size-3.5">
      <span className="flex shrink-0"><UrlPinIcon threadId={threadId} pin={pin} /></span><span className="truncate">{site}</span>
    </div>
    <div className="mt-2 line-clamp-2 text-xs font-medium leading-5">{title}</div>
    {note && <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{note}</div>}
  </div>;
}
