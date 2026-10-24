import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { UrlPin, rpcContract } from "./contract.js";
import { previewClient, previewKey, previewProblem, type PreviewAnswer } from "./preview-client.js";
import { renderHoverCard, relativeTime, type HoverCardContent } from "./hover-card.js";
import { githubReference } from "./github-preview.js";
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

function Card({ data }: { data: HoverCardContent }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => { if (ref.current) renderHoverCard(ref.current, data); }, [data]);
  return <div ref={ref} className="px-3 py-3" />;
}

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
  const reference = githubReference(pin.url);
  const github = preview?.github;
  const site = preview?.site || new URL(pin.url).hostname.replace(/^www\./, "");
  const title = github ? preview!.title : pin.name !== urlPinName(pin.url) ? pin.name : preview?.title || pin.name;
  const image = preview?.image && SAFE_IMAGE.test(preview.image) && failedImage !== preview.image ? preview.image : null;
  const settled = answer !== undefined || failed;
  const facts: string[] = [];
  if (github?.kind === "pull-request") {
    facts.push(github.checks ?? "Checks unavailable", github.review ?? "Review status unavailable");
    if (github.state === "open" || github.state === "draft") facts.push(github.mergeability ?? "Mergeability unknown");
    facts.push(github.branch ?? "Branch unavailable");
  }
  if (github?.kind === "issue") facts.push(github.labels.length ? `Labels: ${github.labels.join(", ")}` : "No labels", github.assignees.length ? `Assigned to ${github.assignees.map(a => `@${a}`).join(", ")}` : "Unassigned", `${github.comments} comment${github.comments === 1 ? "" : "s"}`);
  const content: Node[] = [];
  if (preview?.description && preview.description !== title) {
    const description = document.createElement("p"); description.textContent = preview.description;
    description.style.cssText = "margin:0;color:var(--muted-foreground);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:11px";
    content.push(description);
  }
  const state = !settled ? "Loading" : !preview ? "Unavailable" : github ? github.state === "closed" && github.stateReason === "not_planned" ? "Not planned" : github.state[0]!.toUpperCase() + github.state.slice(1) : reference ? "Details unavailable" : "Web page";
  const stale = failed || (answer?.status !== undefined && !["ready", "no-image"].includes(answer.status));
  return <>
    <Card data={{
      kind: github?.kind ?? reference?.kind ?? "link", title,
      identifier: github ? `${github.repository} #${github.number}` : undefined,
      state: { label: state, tone: github?.state === "merged" ? "merged" : github?.state === "open" ? "success" : "muted" },
      facts,
      meta: github ? [github.author ? `By @${github.author}` : "Author unavailable", relativeTime(github.updatedAt)] : [site],
      content,
      notice: !settled ? "Loading preview…" : stale || !preview ? `${previewProblem(failed ? undefined : answer)}${preview ? " Showing the last preview." : ""}` : reference && !github ? "GitHub details are unavailable. Open the link for current status." : undefined,
    }} />
    {image && <img src={image} alt="" draggable={false} onError={() => setFailedImage(image)} className="h-32 w-full border-t object-cover" />}
  </>;
}
