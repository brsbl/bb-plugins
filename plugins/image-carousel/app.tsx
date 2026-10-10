import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
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

function Shot({ rpc, image, alt }: { rpc: Rpc; image: ImageRef; alt: string }) {
  const [state, setState] = useState<{ url: string | null; failed: boolean }>({ url: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLButtonElement>(null);
  const closeViewer = useCallback(() => { setOpen(false); frame.current?.focus(); }, []);
  useEffect(() => {
    let live = true;
    setState({ url: null, failed: false });
    loadImage(rpc, image).then((url) => { if (live) setState({ url, failed: false }); }, () => { if (live) setState({ url: null, failed: true }); });
    return () => { live = false; };
  }, [rpc, image, attempt]);
  if (state.failed) return <div className="icx-frame icx-frame-empty" role="alert">Image unavailable<button type="button" className="icx-retry" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>;
  if (!state.url) return <div className="icx-frame icx-frame-empty" aria-busy="true"><span className="icx-sr-only">Loading image</span></div>;
  return <>
    <button ref={frame} type="button" className="icx-frame icx-frame-button" aria-label={`View full size: ${alt}`} onClick={() => setOpen(true)}>
      <img src={state.url} alt={alt} draggable={false} />
    </button>
    {open && <Viewer url={state.url} alt={alt} onClose={closeViewer} />}
  </>;
}

function Viewer({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return createPortal(<div className="icx-viewer" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose} onKeyDown={(event) => event.stopPropagation()}>
    <img src={url} alt={alt} />
    <button ref={close} type="button" className="icx-viewer-close" aria-label="Close full-size image" onClick={onClose}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>, document.body);
}

function Arrow({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  return <button type="button" className="icx-arrow" aria-label={direction === "previous" ? "Previous slide" : "Next slide"} aria-disabled={disabled} onClick={() => { if (!disabled) onClick(); }}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === "previous" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>
  </button>;
}

function CarouselView({ carousel }: { carousel: Carousel }) {
  const rpc = useRpc<typeof rpcContract>();
  const [index, setIndex] = useState(0);
  const caption = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const count = carousel.slides.length;
  const move = useCallback((delta: number) => setIndex((value) => Math.min(count - 1, Math.max(0, value + delta))), [count]);
  const measure = useCallback(() => {
    const box = caption.current;
    setMore(!!box && box.scrollTop + box.clientHeight < box.scrollHeight - 2);
  }, []);
  useLayoutEffect(() => {
    if (caption.current) caption.current.scrollTop = 0;
    measure();
  }, [index, measure]);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  };
  const slide = carousel.slides[index]!;
  return <section className="icx" aria-roledescription="carousel" aria-label={carousel.title ?? (carousel.kind === "research" ? "Research images" : "Before and after")} onKeyDown={onKeyDown}>
    {carousel.title && <div className="icx-heading">{carousel.title}</div>}
    <div className="icx-row">
      <Arrow direction="previous" disabled={index === 0} onClick={() => move(-1)} />
      <div className="icx-media" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}: ${slide.title}`}>
        {carousel.kind === "research"
          ? <Shot key={carousel.slides[index]!.image.sha256} rpc={rpc} image={carousel.slides[index]!.image} alt={slide.title} />
          : <div className="icx-pair">
            <figure><figcaption className="icx-tag">Before</figcaption><Shot key={carousel.slides[index]!.before.sha256} rpc={rpc} image={carousel.slides[index]!.before} alt={`Before: ${slide.title}`} /></figure>
            <figure><figcaption className="icx-tag icx-tag-after">After</figcaption><Shot key={carousel.slides[index]!.after.sha256} rpc={rpc} image={carousel.slides[index]!.after} alt={`After: ${slide.title}`} /></figure>
          </div>}
      </div>
      <Arrow direction="next" disabled={index === count - 1} onClick={() => move(1)} />
    </div>
    <div ref={caption} className={more ? "icx-caption icx-caption-more" : "icx-caption"} tabIndex={0} aria-live="polite" onScroll={measure}>
      <div className="icx-caption-title">{slide.title}</div>
      {slide.description && <p className="icx-caption-text">{slide.description}</p>}
      {carousel.kind === "research" && carousel.slides[index]!.source && <a className="icx-source" href={carousel.slides[index]!.source} target="_blank" rel="noreferrer">{new URL(carousel.slides[index]!.source!).host}<span aria-hidden="true"> ↗</span></a>}
    </div>
    <div className="icx-position">
      <span className="icx-count">{index + 1} / {count}</span>
      {count > 1 && count <= MAX_DOTS && <span className="icx-dots" aria-hidden="true">{carousel.slides.map((_, dot) => <i key={dot} className={dot === index ? "icx-dot-on" : undefined} />)}</span>}
    </div>
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
