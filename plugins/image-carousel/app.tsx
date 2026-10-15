import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "./components/ui/button.js";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./components/ui/dialog.js";
import { definePluginApp, useRpc, type PluginMessageDirectiveProps, type PluginRpcClient } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./server.js";
import { carouselIdSchema, type Carousel, type ImageRef } from "./model.js";
import "./app.css";

type Rpc = PluginRpcClient<typeof rpcContract>;
const MAX_DOTS = 12;
const imageUrls = new Map<string, Promise<string>>();

function loadImage(rpc: Rpc, image: ImageRef) {
  let url = imageUrls.get(image.sha256);
  if (!url) {
    url = rpc.call("image", { sha256: image.sha256 }).then(({ mimeType, data }) => {
      const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
      return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
    });
    url.catch(() => imageUrls.delete(image.sha256));
    imageUrls.set(image.sha256, url);
  }
  return url;
}

function Shot({ rpc, image, alt, onOpen }: { rpc: Rpc; image: ImageRef; alt: string; onOpen?: () => void }) {
  const [state, setState] = useState<{ url: string | null; failed: boolean }>({ url: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ url: null, failed: false });
    loadImage(rpc, image).then((url) => { if (live) setState({ url, failed: false }); }, () => { if (live) setState({ url: null, failed: true }); });
    return () => { live = false; };
  }, [rpc, image, attempt]);
  if (state.failed) return <div className="icx-frame icx-frame-empty" role="alert">Image unavailable<button type="button" className="icx-retry" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>;
  if (!state.url) return <div className="icx-frame icx-frame-empty" aria-busy="true"><span className="icx-sr-only">Loading image</span></div>;
  if (!onOpen) return <img src={state.url} alt={alt} draggable={false} />;
  return <button type="button" className="icx-frame icx-frame-button" aria-label={`View full size: ${alt}`} onClick={onOpen}>
    <img src={state.url} alt={alt} draggable={false} />
  </button>;
}

function Description({ text }: { text: string }) {
  const summary = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  useLayoutEffect(() => {
    const element = summary.current;
    if (!element) return;
    const measure = () => setClipped(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [text]);
  return <div className="icx-description">
    <p ref={summary} className="icx-caption-text icx-description-summary">{text}</p>
    {clipped && <button type="button" className="icx-description-toggle" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Show more"}</button>}
    {expanded && <div id={id} role="region" aria-label="Full description" tabIndex={0} className="icx-description-expanded">
      <p className="icx-caption-text">{text}</p>
    </div>}
  </div>;
}

const position = (index: number, count: number) => `${index + 1} / ${count}`;

type ViewerImage = { image: ImageRef; title: string; description?: string; source?: string; slideIndex: number };

function Viewer({ rpc, images, index, onMove, onClose, restoreFocus }: {
  rpc: Rpc; images: ViewerImage[]; index: number; onMove: (index: number) => void;
  onClose: () => void; restoreFocus: () => void;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const current = images[index]!;
  const move = (delta: number) => onMove(Math.max(0, Math.min(images.length - 1, index + delta)));
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="icx-viewer" aria-describedby={undefined}
      onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        // A portal still bubbles through the inline carousel in React.
        event.stopPropagation();
        if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}>
      <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="icx-viewer-close" aria-label="Close full-size image">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </Button></DialogClose>
      <div className="icx-viewer-stage"
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
        onTouchStart={(event) => { touch.current = event.touches.length === 1 ? { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY } : null; }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(end.clientY - start.y)) move(dx < 0 ? 1 : -1);
        }}>
        <Shot key={current.image.sha256} rpc={rpc} image={current.image} alt={current.title} />
      </div>
      <div className="icx-viewer-details" aria-live="polite">
        <DialogTitle className="icx-caption-title">{current.title}</DialogTitle>
        {current.source && <a className="icx-source" href={current.source} target="_blank" rel="noreferrer">{new URL(current.source).host}<span aria-hidden="true"> ↗</span></a>}
        {current.description && <Description key={index} text={current.description} />}
      </div>
      <div className="icx-viewer-position">
        <Button type="button" variant="ghost" size="icon" aria-label="Previous image" aria-disabled={index === 0} onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Button>
        <span className="icx-count" aria-live="polite">{position(index, images.length)}</span>
        <Button type="button" variant="ghost" size="icon" aria-label="Next image" aria-disabled={index === images.length - 1} onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}

function Arrow({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  return <button type="button" className="icx-arrow" aria-label={direction === "previous" ? "Previous slide" : "Next slide"} aria-disabled={disabled} onClick={() => { if (!disabled) onClick(); }}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "previous" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>
  </button>;
}

function CarouselView({ carousel }: { carousel: Carousel }) {
  const rpc = useRpc<typeof rpcContract>();
  const [index, setIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const region = useRef<HTMLElement>(null);
  const focusImage = useRef(0);
  const images: ViewerImage[] = carousel.kind === "research"
    ? carousel.slides.map((slide, slideIndex) => ({ ...slide, slideIndex }))
    : carousel.slides.flatMap((slide, slideIndex) => [
      { image: slide.before, title: `Before: ${slide.title}`, description: slide.description, slideIndex },
      { image: slide.after, title: `After: ${slide.title}`, description: slide.description, slideIndex },
    ]);
  const openViewer = (position: number) => {
    focusImage.current = carousel.kind === "research" ? 0 : position % 2;
    setViewerIndex(position);
    setIndex(images[position]!.slideIndex);
  };
  const count = carousel.slides.length;
  const move = useCallback((delta: number) => setIndex((value) => Math.min(count - 1, Math.max(0, value + delta))), [count]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const slide = carousel.slides[index]!;
  return <section ref={region} className="icx" aria-roledescription="carousel" aria-label={carousel.title ?? (carousel.kind === "research" ? "Research images" : "Before and after")} onKeyDown={onKeyDown}>
    {carousel.title && <div className="icx-heading">{carousel.title}</div>}
    <div className={carousel.kind === "before-after" ? "icx-row icx-row-pair" : "icx-row"}>
      <Arrow direction="previous" disabled={index === 0} onClick={() => move(-1)} />
      <div className="icx-media" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}: ${slide.title}`}>
        {carousel.kind === "research"
          ? <Shot key={carousel.slides[index]!.image.sha256} rpc={rpc} image={carousel.slides[index]!.image} alt={slide.title} onOpen={() => openViewer(index)} />
          : <div className="icx-pair">
            <figure><figcaption className="icx-tag">Before</figcaption><Shot key={carousel.slides[index]!.before.sha256} rpc={rpc} image={carousel.slides[index]!.before} alt={`Before: ${slide.title}`} onOpen={() => openViewer(index * 2)} /></figure>
            <figure><figcaption className="icx-tag icx-tag-after">After</figcaption><Shot key={carousel.slides[index]!.after.sha256} rpc={rpc} image={carousel.slides[index]!.after} alt={`After: ${slide.title}`} onOpen={() => openViewer(index * 2 + 1)} /></figure>
          </div>}
      </div>
      <Arrow direction="next" disabled={index === count - 1} onClick={() => move(1)} />
    </div>
    <div className="icx-caption" aria-live="polite">
      <div className="icx-caption-title">{slide.title}</div>
      {carousel.kind === "research" && carousel.slides[index]!.source && <a className="icx-source" href={carousel.slides[index]!.source} target="_blank" rel="noreferrer">{new URL(carousel.slides[index]!.source!).host}<span aria-hidden="true"> ↗</span></a>}
      {slide.description && <Description key={index} text={slide.description} />}
    </div>
    <div className="icx-position">
      <span className="icx-count">{position(index, count)}</span>
      {count > 1 && count <= MAX_DOTS && <span className="icx-dots" aria-hidden="true">{carousel.slides.map((_, dot) => <i key={dot} className={dot === index ? "icx-dot-on" : undefined} />)}</span>}
    </div>
    {viewerIndex !== null && <Viewer rpc={rpc} images={images} index={viewerIndex} onMove={openViewer}
      onClose={() => setViewerIndex(null)}
      restoreFocus={() => region.current?.querySelectorAll<HTMLButtonElement>(".icx-frame-button")[focusImage.current]?.focus()} />}
  </section>;
}

function CarouselDirective({ attributes }: PluginMessageDirectiveProps) {
  const rpc = useRpc<typeof rpcContract>();
  const id = carouselIdSchema.safeParse(attributes.id);
  const [carousel, setCarousel] = useState<Carousel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!id.success) return;
    setError(null);
    try { setCarousel(await rpc.call("get", { id: id.data })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "This carousel could not be loaded."); }
  }, [rpc, id.success, id.data]);
  useEffect(() => { void load(); }, [load]);
  if (!id.success) return <div className="icx-note" role="alert">This carousel reference is invalid.</div>;
  if (error) return <div className="icx-note" role="alert">{error}<button type="button" className="icx-retry" onClick={() => void load()}>Retry</button></div>;
  if (!carousel) return <div className="icx-note" aria-busy="true">Loading carousel…</div>;
  return <CarouselView carousel={carousel} />;
}

export default definePluginApp((app) => {
  app.slots.messageDirective({ id: "image-carousel", component: CarouselDirective });
});
