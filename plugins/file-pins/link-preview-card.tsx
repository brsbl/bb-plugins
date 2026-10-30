import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";
import { previewClient, previewKey, previewProblem, type PreviewAnswer } from "./preview-client.js";
import { UrlPinIcon } from "./url-pin-icon.js";
import { urlPinName } from "./url-pin.js";

const SAFE_IMAGE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
/** How long a hovered link's card waits for its preview before opening with what it has. */
export const PREVIEW_HOLD_MS = 800;
const decoded = new Set<string>();

/** Loads a link's preview and decodes its image, so its card opens with everything painted. Never rejects. */
export async function preparePreview(key: string, call: () => Promise<PreviewAnswer>): Promise<void> {
  await previewClient.load(key, call);
  const image = previewClient.state(key).answer?.preview?.image;
  if (!image || !SAFE_IMAGE.test(image) || decoded.has(image) || typeof Image === "undefined") return;
  const element = new Image();
  element.src = image;
  try { await element.decode(); decoded.add(image); } catch { /* The card's own <img> reports a broken image. */ }
  // Remember only recent images; the cache below holds the data itself.
  if (decoded.size > 40) decoded.delete(decoded.values().next().value!);
}

// Moss EmbedPillHoverCard's media band and compact metadata
// panel. Keep this plugin's URL header, and use BB's opaque themed surfaces.
// Images use a 128px edge-to-edge band; text-only cards fit their content.
export function LinkPreviewCard({ threadId, pin }: { threadId: string; pin: UrlPin }) {
  const rpc = useRpc<typeof rpcContract>();
  const key = previewKey(threadId, pin.id, pin.url);
  const subscribe = useCallback((listener: () => void) => previewClient.subscribe(key, listener), [key]);
  const { answer, failed } = useSyncExternalStore(subscribe, () => previewClient.state(key));
  // An open card shows its cached preview at once; when the server says a reload runs behind it, the card waits
  // for that reload and updates in place.
  useEffect(() => {
    let open = true;
    const ask = (wait: boolean) => rpc.call("preview", { threadId, pinId: pin.id, ...(wait ? { wait } : {}) });
    void previewClient.load(key, () => ask(false)).then(() => { if (open) void previewClient.revalidate(key, () => ask(true)); });
    return () => { open = false; };
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
  return <div className="flex flex-col overflow-hidden px-4 py-3">
    <div className="flex h-4 min-w-0 items-center gap-1.5 text-[11px] leading-4 text-muted-foreground [&_img]:size-3.5 [&_svg]:size-3.5">
      <span className="flex shrink-0"><UrlPinIcon threadId={threadId} pin={pin} /></span><span className="truncate">{site}</span>
    </div>
    <div className="mt-2 line-clamp-2 text-xs font-medium leading-5">{title}</div>
    {note && <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">{note}</div>}
  </div>;
}
