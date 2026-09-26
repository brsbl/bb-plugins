import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import maplibregl, { type GeoJSONSource, type Map as GlMap, type PaddingOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useBbNavigate, useComposer, useRpc } from "@get-bb/plugin-sdk/app";
import BubbleChatAdd from "@hugeicons/core-free-icons/BubbleChatAddIcon";
import Add01 from "@hugeicons/core-free-icons/Add01Icon";
import MinusSign from "@hugeicons/core-free-icons/MinusSignIcon";
import CenterFocus from "@hugeicons/core-free-icons/CenterFocusIcon";
import Route01 from "@hugeicons/core-free-icons/Route01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import ArrowRight01 from "@hugeicons/core-free-icons/ArrowRight01Icon";
import { CLUSTER_MAX_ZOOM, CLUSTER_RADIUS, PLACES_SOURCE, attachClusterPiles } from "./cluster-piles";
import { categoryFor } from "./categories";
import { muteBasemap, readTheme, type MapTheme } from "./basemap";
import { POINT_LAYERS, installLayers, setMarkedPoint, setPins, setRings, setRouteLine, setStops, type PinInput } from "./layers";
import { allPlaces, placesByKey, type SavedPlace } from "./model";
import { NOTES_LIST_ID, notesList } from "./notes-list";
import { selectLists } from "./selection";
import { isochrone, inPolygon, formatDuration, type Ring } from "./routing";
import type { ViewContext, rpcContract } from "./server";
import { useSavedState } from "./use-saved-state";
import { useRoute } from "./use-route";
import { Icon, IconButton, plural } from "./ui";
import { AppContext, emptyFilter, inBounds, type AppApi, type Bounds, type RingState, type View } from "./views/context";
import { LibraryView } from "./views/library";
import { ListView } from "./views/list";
import { PlaceView } from "./views/place";
import { RouteView } from "./views/route";
import { ComposeView } from "./views/compose";

type Detent = "peek" | "half" | "full";
const PANEL_WIDTH = 372;
const WIDE_MIN = 720;
const FIT_INSET = 28;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function uncoveredBounds(map: maplibregl.Map, sheet: HTMLElement | null, wide: boolean, sheetHeight: number): Bounds {
  const box = map.getContainer().getBoundingClientRect();
  const panel = wide ? sheet?.getBoundingClientRect() : undefined;
  const left = panel ? Math.min(box.width, Math.max(0, panel.right - box.left)) : 0;
  const bottom = wide ? box.height : Math.max(0, box.height - sheetHeight);
  const corners = [[left, 0], [box.width, 0], [left, bottom], [box.width, bottom]].map(([x, y]) => map.unproject([x, y]));
  const lngs = corners.map(c => c.lng);
  const lats = corners.map(c => c.lat);
  return { west: Math.min(...lngs), south: Math.min(...lats), east: Math.max(...lngs), north: Math.max(...lats) };
}

function trimmedBounds(places: SavedPlace[]) {
  if (!places.length) return null;
  const q = (values: number[], t: number) => values[Math.min(values.length - 1, Math.max(0, Math.round(t * (values.length - 1))))];
  const lats = places.map(p => p.latitude).sort((a, b) => a - b);
  const lngs = places.map(p => p.longitude).sort((a, b) => a - b);
  const bounds = (t: number) => new maplibregl.LngLatBounds([q(lngs, t), q(lats, t)], [q(lngs, 1 - t), q(lats, 1 - t)]);
  const trimmed = bounds(0.05);
  const cityScale = trimmed.getEast() - trimmed.getWest() < 3 && trimmed.getNorth() - trimmed.getSouth() < 3;
  return places.length > 24 && cityScale ? trimmed : bounds(0);
}

export function PlacesMap() {
  const root = useRef<HTMLElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GlMap | null>(null);
  const themeRef = useRef<MapTheme | null>(null);
  const piles = useRef<ReturnType<typeof attachClusterPiles> | null>(null);
  const navigate = useBbNavigate();
  const composer = useComposer();
  const rpc = useRpc<typeof rpcContract>();
  const [asking, setAsking] = useState(false);
  const store = useSavedState();
  const route = useRoute();
  const [theme, setTheme] = useState<MapTheme | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [stack, setStack] = useState<View[]>([{ kind: "library", query: "" }]);
  const [size, setSize] = useState({ width: 1024, height: 720 });
  const [detent, setDetent] = useState<Detent>("half");
  const [drag, setDrag] = useState<number | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [zoom, setZoom] = useState(2);
  const [rings, setRingState] = useState<RingState | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);
  const ringRequest = useRef<AbortController | null>(null);
  const top = stack[stack.length - 1];
  const wide = size.width >= WIDE_MIN;

  const detentHeight = useCallback((d: Detent) => d === "peek" ? 156 : d === "half" ? Math.round(size.height * 0.5) : size.height - 56, [size.height]);
  const sheetHeight = wide ? 0 : drag ?? detentHeight(detent);
  const cover = useRef({ wide, sheetHeight: detentHeight(detent) });
  cover.current = { wide, sheetHeight: wide ? 0 : detentHeight(detent) };
  const readBounds = useCallback((map: maplibregl.Map) => uncoveredBounds(map, sheet.current, cover.current.wide, cover.current.sheetHeight), []);
  const settled = drag === null;
  useEffect(() => {
    const map = mapRef.current;
    if (map && settled) setBounds(readBounds(map));
  }, [wide, detent, size.height, settled, readBounds]);
  const paddingFor = useCallback((d: Detent): PaddingOptions => wide
    ? { top: 56, bottom: 48, left: PANEL_WIDTH + 64, right: 88 }
    : { top: 64, bottom: Math.min(detentHeight(d === "full" ? "half" : d), size.height * 0.55) + 28, left: 36, right: 36 }, [wide, detentHeight, size.height]);
  const padding = useCallback(() => paddingFor(detent), [paddingFor, detent]);

  const notes = useMemo(() => notesList(store.notes), [store.notes]);
  const getList = useCallback((id: string) => id === NOTES_LIST_ID ? notes : store.listsById.get(id), [notes, store.listsById]);

  const contextView = useMemo(() => [...stack].reverse().find(v => v.kind === "lists" || v.kind === "library") ?? stack[0], [stack]);
  const context = useMemo(() => {
    if (contextView.kind === "lists") {
      const selection = selectLists(contextView.ids, contextView.filter, getList, store.notes);
      return { places: selection.filtered };
    }
    const query = contextView.kind === "library" ? contextView.query.trim().toLocaleLowerCase() : "";
    const places = query ? allPlaces.filter(p => `${p.name} ${p.address} ${p.placeType ?? ""} ${store.notes[p.key]?.text ?? ""}`.toLocaleLowerCase().includes(query)) : allPlaces;
    return { places };
  }, [contextView, getList, store.notes]);

  const selectedPlace = top.kind === "place" ? placesByKey.get(top.key) ?? null : null;

  const pins = useMemo<PinInput[]>(() => {
    const ringShapes = rings && top.kind === "place" && rings.owner === `place:${top.key}` && rings.features.length ? rings.features : null;
    const stopSet = top.kind === "route" && route.stops.length ? new Set(route.stops) : null;
    const list = selectedPlace && !context.places.includes(selectedPlace) ? [...context.places, selectedPlace] : context.places;
    return list.map(place => {
      const outsideRings = ringShapes ? place !== selectedPlace && !ringShapes.some(r => inPolygon([place.longitude, place.latitude], r.geometry)) : false;
      return { place, color: categoryFor(place.category).color, note: Boolean(store.notes[place.key]), dim: outsideRings || Boolean(stopSet && !stopSet.has(place.key)) };
    });
  }, [context, selectedPlace, rings, top, route.stops, store.notes]);

  const fitPlaces = useCallback((places: SavedPlace[], animate = true) => {
    const map = mapRef.current;
    const b = trimmedBounds(places);
    if (!map || !b) return;
    map.fitBounds(b, { padding: FIT_INSET, maxZoom: places.length === 1 ? 16 : 15.5, duration: animate && !reducedMotion() ? 700 : 0 });
  }, []);
  const fitKeys = useCallback((keys: string[]) => fitPlaces(keys.map(k => placesByKey.get(k)).filter((p): p is SavedPlace => Boolean(p))), [fitPlaces]);

  const push = useCallback((view: View) => setStack(s => [...s, view]), []);
  const pop = useCallback(() => setStack(s => s.length > 1 ? s.slice(0, -1) : s), []);
  const replace = useCallback((view: View) => setStack(s => [...s.slice(0, -1), view]), []);
  const openPlace = useCallback((key: string) => {
    setStack(s => s[s.length - 1].kind === "place" ? [...s.slice(0, -1), { kind: "place", key }] : [...s, { kind: "place", key }]);
    const place = placesByKey.get(key);
    const map = mapRef.current;
    const next = !wide && detent === "peek" ? "half" : detent;
    if (place && map) map.easeTo({ center: [place.longitude, place.latitude], zoom: Math.max(map.getZoom(), 15), padding: paddingFor(next), duration: reducedMotion() ? 0 : 650 });
    setDetent(next);
  }, [wide, detent, paddingFor]);
  const openLists = useCallback((ids: string[]) => {
    setStack(s => [...s, { kind: "lists", ids, filter: emptyFilter }]);
    const keys = new Set(ids.flatMap(id => getList(id)?.placeKeys ?? []));
    fitPlaces([...keys].map(k => placesByKey.get(k)).filter((p): p is SavedPlace => Boolean(p)));
  }, [getList, fitPlaces]);

  const clearRings = useCallback(() => { ringRequest.current?.abort(); ringRequest.current = null; setRingState(null); }, []);
  const showRings = useCallback((owner: string, points: SavedPlace[], mode: RingState["mode"], minutes: number[]) => {
    ringRequest.current?.abort();
    const controller = new AbortController();
    ringRequest.current = controller;
    setRingState({ owner, mode, features: [], loading: true, error: null });
    (async () => {
      const features: Ring[] = [];
      for (const point of points.slice(0, 12)) features.push(...await isochrone(point, mode, minutes, controller.signal));
      return features;
    })().then(features => {
      if (controller.signal.aborted) return;
      setRingState({ owner, mode, features, loading: false, error: null });
      const map = mapRef.current;
      if (!map) return;
      const b = new maplibregl.LngLatBounds();
      for (const f of features) for (const poly of f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates) for (const [lng, lat] of poly[0]) b.extend([lng, lat]);
      if (!b.isEmpty()) map.fitBounds(b, { padding: FIT_INSET, duration: reducedMotion() ? 0 : 700 });
    }, () => {
      if (!controller.signal.aborted) setRingState({ owner, mode, features: [], loading: false, error: "Travel times are unavailable right now. Try again in a moment." });
    });
  }, []);

  useEffect(() => {
    if (!rings) return;
    const owned = rings.owner === "route" ? top.kind === "route" : top.kind === "place" && rings.owner === `place:${top.key}`;
    if (!owned) clearRings();
  }, [top, rings, clearRings]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    themeRef.current = readTheme(el);
    const update = () => setTheme(previous => {
      const next = readTheme(el);
      return previous && JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
    update();
    const observer = new MutationObserver(update);
    for (const target of [document.documentElement, document.body]) observer.observe(target, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    const resize = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    resize.observe(el);
    return () => { observer.disconnect(); media.removeEventListener("change", update); resize.disconnect(); };
  }, []);

  const hasTheme = theme !== null;
  useEffect(() => {
    if (!hasTheme || !container.current || !themeRef.current) return;
    const map = new maplibregl.Map({
      container: container.current, style: themeRef.current.style, center: [139.72, 35.68], zoom: 2, minZoom: 0.6, maxZoom: 19,
      attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: true, fadeDuration: 160,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("style.load", () => {
      const current = themeRef.current;
      if (!current) return;
      muteBasemap(map, current);
      installLayers(map, current);
      setStyleVersion(v => v + 1);
    });
    piles.current = attachClusterPiles(map, setMapError);
    map.on("error", event => {
      const message = event.error?.message ?? "";
      setMapError(message.includes("WebGL") ? "Your browser could not start the map. Try reopening this panel." : "Some map details could not load. Check your connection.");
    });
    const syncView = () => {
      setBounds(readBounds(map));
      setZoom(map.getZoom());
    };
    map.on("moveend", syncView);
    map.on("load", syncView);
    const resize = new ResizeObserver(() => map.resize());
    resize.observe(container.current);
    return () => { resize.disconnect(); piles.current?.remove(); piles.current = null; map.remove(); mapRef.current = null; };
  }, [hasTheme]);

  useEffect(() => {
    if (!theme) return;
    const previous = themeRef.current;
    themeRef.current = theme;
    const map = mapRef.current;
    if (map && previous && JSON.stringify(previous) !== JSON.stringify(theme)) map.setStyle(theme.style, { diff: false });
  }, [theme]);

  const paddingKey = JSON.stringify(padding());
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion || !size.width) return;
    const apply = () => {
      if (JSON.stringify(map.getPadding()) !== paddingKey) map.easeTo({ padding: JSON.parse(paddingKey) as PaddingOptions, duration: reducedMotion() ? 0 : 300 });
    };
    if (!map.isMoving()) { apply(); return; }
    map.once("moveend", apply);
    return () => { map.off("moveend", apply); };
  }, [paddingKey, styleVersion, size.width]);

  const initialFit = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    setPins(map, pins);
    if (!initialFit.current && size.width > 0) {
      initialFit.current = true;
      map.setPadding(padding());
      fitPlaces(allPlaces, false);
    }
  }, [styleVersion, pins, fitPlaces, size.width, padding]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    setMarkedPoint(map, "sp-selected", selectedPlace, selectedPlace ? categoryFor(selectedPlace.category).color : undefined);
  }, [styleVersion, selectedPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    const place = hoverKey ? placesByKey.get(hoverKey) ?? null : null;
    setMarkedPoint(map, "sp-hover", place);
  }, [styleVersion, hoverKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    setRings(map, rings?.features ?? []);
  }, [styleVersion, rings]);

  const unclustered = Boolean(rings?.features.length) || (top.kind === "route" && route.stops.length > 0);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    (map.getSource(PLACES_SOURCE) as GeoJSONSource | undefined)?.setClusterOptions({ cluster: !unclustered, clusterRadius: CLUSTER_RADIUS, clusterMaxZoom: CLUSTER_MAX_ZOOM });
  }, [styleVersion, unclustered]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleVersion) return;
    setStops(map, route.places);
    setRouteLine(map, route.result ? route.result.line.map(([lng, lat]) => [lng, lat] as [number, number]) : null);
  }, [styleVersion, route.places, route.result]);

  const mapReady = styleVersion > 0;
  const topRef = useRef(top);
  topRef.current = top;
  const openPlaceRef = useRef(openPlace);
  openPlaceRef.current = openPlace;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const nearest = (point: maplibregl.Point, radius: number) => {
      if (!map.getLayer(POINT_LAYERS[0])) return null;
      const features = map.queryRenderedFeatures([[point.x - radius, point.y - radius], [point.x + radius, point.y + radius]], { layers: POINT_LAYERS });
      let best: { key: string; name: string; distance: number } | null = null;
      for (const feature of features) {
        if (feature.geometry.type !== "Point") continue;
        const screen = map.project(feature.geometry.coordinates as [number, number]);
        const distance = Math.hypot(screen.x - point.x, screen.y - point.y);
        const key = String(feature.properties.key);
        if (!best || distance < best.distance) best = { key, name: String(feature.properties.name), distance };
      }
      return best;
    };
    const click = (event: maplibregl.MapMouseEvent) => {
      const hit = nearest(event.point, 22);
      if (hit) openPlaceRef.current(hit.key);
      else if (topRef.current.kind === "place") setStack(s => s.slice(0, -1));
    };
    const move = (event: maplibregl.MapMouseEvent) => {
      const hit = nearest(event.point, 12);
      map.getCanvas().style.cursor = hit ? "pointer" : "";
      setTooltip(hit && map.getZoom() < 14.8 ? { x: event.point.x, y: event.point.y, name: hit.name } : null);
    };
    const leave = () => { setTooltip(null); map.getCanvas().style.cursor = ""; };
    map.on("click", click);
    map.on("mousemove", move);
    map.on("mouseout", leave);
    map.on("movestart", leave);
    return () => { map.off("click", click); map.off("mousemove", move); map.off("mouseout", leave); map.off("movestart", leave); };
  }, [mapReady]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea")) { target.blur(); return; }
      pop();
    };
    const el = root.current;
    el?.addEventListener("keydown", key);
    return () => el?.removeEventListener("keydown", key);
  }, [pop]);

  useEffect(() => {
    if (wide) return;
    if (top.kind === "compose") setDetent("full");
    else if (top.kind === "place" || top.kind === "route") setDetent(d => d === "peek" ? "half" : d);
  }, [top.kind, wide]);

  const dragStart = useRef<{ y: number; height: number; moved: boolean } | null>(null);
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (wide) return;
    const target = event.target as HTMLElement;
    if (!target.closest("[data-drag-zone], .sp-grip") || target.closest("button, input, textarea, a, [role=menu]")) return;
    dragStart.current = { y: event.clientY, height: detentHeight(detent), moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    const dy = start.y - event.clientY;
    if (Math.abs(dy) > 4) start.moved = true;
    if (start.moved) setDrag(Math.max(96, Math.min(detentHeight("full"), start.height + dy)));
  };
  const onPointerUp = () => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;
    if (!start.moved) {
      setDetent(d => d === "peek" ? "half" : d === "half" ? "full" : "peek");
      setDrag(null);
      return;
    }
    const height = drag ?? start.height;
    const options: Detent[] = ["peek", "half", "full"];
    setDetent(options.reduce((best, d) => Math.abs(detentHeight(d) - height) < Math.abs(detentHeight(best) - height) ? d : best, "half"));
    setDrag(null);
  };

  const inViewChip = useMemo(() => {
    if (contextView.kind !== "lists" || !bounds || top.kind !== "lists") return null;
    const total = context.places.length;
    const here = context.places.filter(p => inBounds(p, bounds)).length;
    return { here, outside: total - here };
  }, [contextView, bounds, context.places, top.kind]);

  const api: AppApi = {
    store, route, wide, bounds, zoom, rings, canGoBack: stack.length > 1, getList,
    push, pop, replace, openPlace, openLists, hover: setHoverKey, fitKeys, showRings, clearRings,
    compose: draft => { push({ kind: "compose", draft }); },
    openUrl: url => { if (!navigate.openUrl(url)) window.open(url, "_blank", "noopener,noreferrer"); },
    expand: () => { if (!wide) setDetent(d => d === "full" ? d : "full"); },
  };

  const askAgent = async () => {
    if (asking) return;
    const map = mapRef.current;
    const b = map ? readBounds(map) : null;
    const center = map?.getCenter();
    const snapshot: ViewContext = {
      view: top.kind,
      query: contextView.kind === "library" ? contextView.query.trim() : "",
      listIds: contextView.kind === "lists" ? contextView.ids : [],
      filter: contextView.kind === "lists" ? contextView.filter : null,
      placeKey: selectedPlace?.key ?? null,
      camera: map && b && center ? { center: [center.lng, center.lat], zoom: map.getZoom(), bounds: b } : null,
      placeKeys: pins.map(pin => pin.place.key),
      route: route.stops.length ? { mode: route.mode, stops: route.stops } : null,
      rings: rings?.features.length ? { mode: rings.mode, minutes: [...new Set(rings.features.map(ring => ring.properties.minutes))].sort((a, b) => a - b) } : null,
    };
    setAsking(true);
    try {
      const mention = await rpc.call("viewContextCreate", snapshot);
      composer.insertMention(mention);
      if (composer.scope.kind === "new-thread") navigate.toCompose({ focusPrompt: true });
    } catch {
      setMapError("This view could not be shared with an agent. Try again.");
    } finally {
      setAsking(false);
    }
  };

  const error = mapError ?? store.error ?? route.error;
  const showTray = route.stops.length > 0 && top.kind !== "route" && top.kind !== "compose";
  const zoomBy = (delta: number) => mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 2) + delta, duration: reducedMotion() ? 0 : 250 });

  return <AppContext.Provider value={api}>
    <section ref={root} className="sp-root" data-layout={wide ? "wide" : "narrow"} data-theme={theme?.dark ? "dark" : "light"} aria-label="Saved places" style={{ "--sheet-height": `${sheetHeight}px`, "--panel-width": `${PANEL_WIDTH}px` } as React.CSSProperties}>
      <div ref={container} className="sp-map" data-no-sidebar-swipe />
      {tooltip && <div className="sp-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.name}</div>}

      <div className="sp-controls">
        <button type="button" className="sp-agent-button" aria-label="Ask agent" onClick={() => void askAgent()} disabled={asking} aria-busy={asking} title={composer.scope.kind === "new-thread" ? "Start a new thread about this map view" : "Add this map view to the chat"}>
          <Icon icon={BubbleChatAdd} size={17} /><span>Ask agent</span>
        </button>
        <div className="sp-control-group">
          <IconButton tone="glass" icon={Add01} label="Zoom in" onClick={() => zoomBy(1)} />
          <IconButton tone="glass" icon={MinusSign} label="Zoom out" onClick={() => zoomBy(-1)} />
        </div>
        <div className="sp-control-group">
          <IconButton tone="glass" icon={CenterFocus} label="Fit places" onClick={() => fitPlaces(selectedPlace ? [selectedPlace] : context.places)} />
        </div>
      </div>

      {inViewChip && inViewChip.outside > 0 && <div className="sp-map-chip" role="status">
        <span>{inViewChip.here ? `${inViewChip.here} in view` : "None in view"}</span>
        <span className="sp-muted">{inViewChip.outside} elsewhere</span>
        <button type="button" onClick={() => fitPlaces(context.places)}>Show all</button>
      </div>}

      <div ref={sheet} className="sp-sheet" data-dragging={drag !== null || undefined} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {!wide && <div className="sp-grip" aria-hidden="true"><span /></div>}
        <div className="sp-view" key={stack.length + top.kind}>
          {!store.loaded ? <div className="sp-loading" role="status"><span className="sp-spinner" />Loading your places…</div>
            : top.kind === "library" ? <LibraryView query={top.query} />
            : top.kind === "lists" ? <ListView ids={top.ids} filter={top.filter} />
            : top.kind === "place" ? <PlaceView placeKey={top.key} />
            : top.kind === "route" ? <RouteView />
            : <ComposeView draft={top.draft} />}
        </div>
        {showTray && <button type="button" className="sp-tray" onClick={() => push({ kind: "route" })}>
          <span className="sp-tray-icon"><Icon icon={Route01} size={17} /></span>
          <span className="sp-row-text"><span className="sp-row-title">Route · {plural(route.stops.length, "stop")}</span><span className="sp-row-meta">{route.result ? `${formatDuration(route.result.seconds)} ${route.mode === "walk" ? "walking" : route.mode === "bike" ? "by bike" : "by car"}` : route.stops.length < 2 ? "Add another stop" : "Working out the route…"}</span></span>
          <Icon icon={ArrowRight01} size={16} />
        </button>}
      </div>

      {error && <div className="sp-toast" role="alert"><span>{error}</span><button type="button" aria-label="Dismiss" onClick={() => { setMapError(null); store.clearError(); route.clearError(); }}><Icon icon={Cancel01} size={14} /></button></div>}
    </section>
  </AppContext.Provider>;
}
