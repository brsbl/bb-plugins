import { Fragment, useEffect, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowUp01 from "@hugeicons/core-free-icons/ArrowUp01Icon";
import ArrowDown01 from "@hugeicons/core-free-icons/ArrowDown01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import MagicWand01 from "@hugeicons/core-free-icons/MagicWand01Icon";
import LinkSquare02 from "@hugeicons/core-free-icons/LinkSquare02Icon";
import Copy01 from "@hugeicons/core-free-icons/Copy01Icon";
import Walking from "@hugeicons/core-free-icons/WalkingIcon";
import Bicycle01 from "@hugeicons/core-free-icons/Bicycle01Icon";
import Car01 from "@hugeicons/core-free-icons/Car01Icon";
import Route02 from "@hugeicons/core-free-icons/Route02Icon";
import type { IconSvgElement } from "@hugeicons/react";
import { MAX_STOPS } from "../use-route";
import { TRAVEL_MODES, directionsUrl, formatDistance, formatDuration, type TravelMode } from "../routing";
import { Icon, IconButton, plural } from "../ui";
import { Frame } from "./rows";
import { useApp } from "./context";

const MODE_ICONS: Record<TravelMode, IconSvgElement> = { walk: Walking, bike: Bicycle01, drive: Car01 };
const REACH_MINUTES: Record<TravelMode, number> = { walk: 10, bike: 10, drive: 15 };

export function RouteView() {
  const app = useApp();
  const { route } = app;
  const [keepStart, setKeepStart] = useState(true);
  const reach = app.rings?.owner === "route" ? app.rings : null;
  const { places, result } = route;
  useEffect(() => {
    if (route.stops.length) app.fitKeys(route.stops);
  }, []);
  const summary = result ? `${formatDuration(result.seconds)} · ${formatDistance(result.km)}` : route.loading && places.length > 1 ? "Working out the route…" : null;
  const openGoogle = () => {
    const url = directionsUrl(places, route.mode);
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) window.open(url, "_blank", "noopener,noreferrer");
    else app.openUrl(url);
  };
  const setMode = (mode: TravelMode) => {
    route.setMode(mode);
    if (reach) app.showRings("route", places, mode, [REACH_MINUTES[mode]]);
  };

  const header = <>
    <div className="sp-nav-row">
      <IconButton icon={ArrowLeft01} label="Back" onClick={app.pop} />
      <span className="sp-nav-spacer" />
      {places.length > 0 && <button type="button" className="sp-text-button" onClick={() => { route.clear(); app.clearRings(); }}>Clear</button>}
    </div>
    <div className="sp-title-block">
      <h2 className="sp-title">Route</h2>
      <p className="sp-subtitle">{places.length ? plural(places.length, "stop") : "No stops yet"}{summary && <><span className="sp-dot-sep" />{summary}</>}</p>
    </div>
    <div className="sp-segmented" role="radiogroup" aria-label="Travel mode">
      {TRAVEL_MODES.map(m => <button key={m.id} type="button" role="radio" aria-checked={route.mode === m.id} onClick={() => setMode(m.id)}><Icon icon={MODE_ICONS[m.id]} size={16} />{m.label}</button>)}
    </div>
  </>;

  if (!places.length) return <Frame label="Route" header={header}>
    <div className="sp-route-empty">
      <span className="sp-route-empty-art" aria-hidden="true"><Icon icon={Route02} size={28} /></span>
      <strong>Plan a day out</strong>
      <span>Tap ＋ next to any place to add it as a stop. Add a few, then let Saved Places find the quickest order.</span>
    </div>
  </Frame>;

  return <Frame label="Route" header={header} footer={<div className="sp-action-bar">
    <button type="button" className="sp-button" disabled={places.length < 1} onClick={() => app.compose({ sourceIds: [], scopes: [{ id: "route", label: plural(places.length, "stop"), keys: route.stops }], title: "Day out" })}><Icon icon={Copy01} size={16} />Save as list</button>
    <button type="button" className="sp-button sp-button-primary" disabled={places.length < 2} onClick={openGoogle}><Icon icon={LinkSquare02} size={16} />Open in Google Maps</button>
  </div>}>
    <ol className="sp-stops">
      {places.map((place, index) => <Fragment key={place.key}>
        {index > 0 && <li className="sp-leg" aria-label="Travel time">{result ? <span>{formatDuration(result.legs[index - 1].seconds)}<span className="sp-muted"> · {formatDistance(result.legs[index - 1].km)}</span></span> : <span className="sp-muted">{route.loading ? "…" : "—"}</span>}</li>}
        <li className="sp-stop" onMouseEnter={() => app.hover(place.key)} onMouseLeave={() => app.hover(null)}>
          <span className="sp-stop-number">{index + 1}</span>
          <button type="button" className="sp-stop-name" onClick={() => app.openPlace(place.key)}>{place.name}</button>
          <span className="sp-stop-tools">
            <IconButton icon={ArrowUp01} label={`Move ${place.name} earlier`} disabled={index === 0} onClick={() => route.move(index, -1)} />
            <IconButton icon={ArrowDown01} label={`Move ${place.name} later`} disabled={index === places.length - 1} onClick={() => route.move(index, 1)} />
            <IconButton icon={Cancel01} label={`Remove ${place.name}`} onClick={() => route.remove(place.key)} />
          </span>
        </li>
      </Fragment>)}
    </ol>
    {places.length >= MAX_STOPS && <p className="sp-empty">Routes can have up to {MAX_STOPS} stops.</p>}

    <div className="sp-route-tools">
      <button type="button" className="sp-button sp-button-wide" disabled={places.length < 3 || route.optimizing} onClick={() => void route.optimize(keepStart)}><Icon icon={MagicWand01} size={16} />{route.optimizing ? "Finding the quickest order…" : "Find the quickest order"}</button>
      <button type="button" className="sp-toggle" aria-pressed={keepStart} onClick={() => setKeepStart(v => !v)}><span className="sp-toggle-track" />Start at stop 1</button>
      <button type="button" className="sp-toggle" aria-pressed={Boolean(reach)} disabled={!places.length} onClick={() => reach ? app.clearRings() : app.showRings("route", places, route.mode, [REACH_MINUTES[route.mode]])}><span className="sp-toggle-track" />Show {REACH_MINUTES[route.mode]}-minute reach around stops</button>
    </div>
    {(route.undo || route.notice) && <div className="sp-inline-toast" role="status">
      <span>{route.undo ? `Reordered to save ${formatDuration(route.undo.saved)}` : route.notice}</span>
      {route.undo && <button type="button" onClick={route.applyUndo}>Undo</button>}
      <button type="button" aria-label="Dismiss" onClick={route.dismissUndo}><Icon icon={Cancel01} size={13} /></button>
    </div>}
    {places.length > 10 && <p className="sp-empty">Google Maps opens the first 10 stops.</p>}
  </Frame>;
}
