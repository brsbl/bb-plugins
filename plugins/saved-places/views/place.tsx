import { useEffect, useMemo, useRef, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Navigation03 from "@hugeicons/core-free-icons/Navigation03Icon";
import Route01 from "@hugeicons/core-free-icons/Route01Icon";
import LinkSquare02 from "@hugeicons/core-free-icons/LinkSquare02Icon";
import Target02 from "@hugeicons/core-free-icons/Target02Icon";
import Add01 from "@hugeicons/core-free-icons/Add01Icon";
import Tick02 from "@hugeicons/core-free-icons/Tick02Icon";
import Walking from "@hugeicons/core-free-icons/WalkingIcon";
import Bicycle01 from "@hugeicons/core-free-icons/Bicycle01Icon";
import Car01 from "@hugeicons/core-free-icons/Car01Icon";
import type { IconSvgElement } from "@hugeicons/react";
import { categoryFor } from "../categories";
import { categoryIcons } from "../category-icons";
import { allPlaces, customToList, placesByKey, type SavedPlace } from "../model";
import { RING_MINUTES, TRAVEL_MODES, inPolygon, type TravelMode } from "../routing";
import { Icon, IconButton, ListCover, PlaceAvatar, SectionTitle, plural } from "../ui";
import { Frame } from "./rows";
import { useApp } from "./context";

const MODE_ICONS: Record<TravelMode, IconSvgElement> = { walk: Walking, bike: Bicycle01, drive: Car01 };
const REACH_KM: Record<TravelMode, number> = { walk: 2.2, bike: 7, drive: 22 };
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const km = (a: SavedPlace, b: SavedPlace) => {
  const dLat = (b.latitude - a.latitude) * 111.32;
  const dLng = (b.longitude - a.longitude) * 111.32 * Math.cos(a.latitude * Math.PI / 180);
  return Math.hypot(dLat, dLng);
};

export function PlaceView({ placeKey }: { placeKey: string }) {
  const app = useApp();
  const { store, route } = app;
  const place = placesByKey.get(placeKey);
  const [picker, setPicker] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const owner = `place:${placeKey}`;
  const rings = app.rings?.owner === owner ? app.rings : null;

  const nearby = useMemo(() => {
    if (!place || !rings?.features.length) return [];
    const sorted = [...rings.features].sort((a, b) => a.properties.minutes - b.properties.minutes);
    const groups = sorted.map(ring => ({ minutes: ring.properties.minutes, places: [] as SavedPlace[] }));
    for (const other of allPlaces) {
      if (other.key === place.key || km(place, other) > REACH_KM[rings.mode]) continue;
      const index = sorted.findIndex(ring => inPolygon([other.longitude, other.latitude], ring.geometry));
      if (index >= 0) groups[index].places.push(other);
    }
    for (const group of groups) group.places.sort((a, b) => km(place, a) - km(place, b));
    return groups;
  }, [place, rings]);

  if (!place) return <Frame label="Place" header={<div className="sp-nav-row"><IconButton icon={ArrowLeft01} label="Back" onClick={app.pop} /></div>}><p className="sp-empty">This place is no longer saved.</p></Frame>;

  const category = categoryFor(place.category);
  const lists = place.listIds.map(app.getList).filter(l => l !== undefined);
  const customLists = store.customLists;
  const inCustom = customLists.filter(l => l.placeKeys.includes(place.key));
  const color = category.color;
  const stop = route.stops.indexOf(place.key);
  const mobile = isMobile();
  const mapsUrl = mobile ? `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${place.name}, ${place.address}` })}` : place.url;
  const directions = `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination: `${place.latitude},${place.longitude}`, travelmode: "walking" })}`;
  const kind = place.placeType ?? (place.category === "other" ? "Saved place" : category.label);
  const open = (url: string) => mobile ? window.open(url, "_blank", "noopener,noreferrer") : app.openUrl(url);
  const toggleRings = (mode: TravelMode) => rings && rings.mode === mode ? app.clearRings() : app.showRings(owner, [place], mode, RING_MINUTES);

  return <Frame label={place.name} header={<div className="sp-nav-row">
    <IconButton icon={ArrowLeft01} label="Back" onClick={app.pop} />
    <span className="sp-nav-spacer" />
    <IconButton icon={Target02} label="Center on map" onClick={() => app.fitKeys([place.key])} />
  </div>}>
    <div className="sp-place-hero">
      {place.photoUrl && !photoFailed
        ? <div className="sp-photo"><img src={place.photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} /></div>
        : <PlaceAvatar place={place} color={color} size={52} />}
      <h2 className="sp-place-name">{place.name}</h2>
      <p className="sp-place-kind">
        {place.category !== "other" && <Icon icon={categoryIcons[place.category]} size={15} />}
        {kind}
        {place.rating !== null && <><span className="sp-dot-sep" /><span className="sp-rating">★ {place.rating.toFixed(1)}</span>{place.reviewCount !== null && <span className="sp-muted">({place.reviewCount.toLocaleString()})</span>}</>}
        {place.price && <><span className="sp-dot-sep" />{place.price}</>}
      </p>
      {place.status && <p className="sp-place-status">{place.status}</p>}
      <p className="sp-place-address">{place.address}</p>
    </div>

    <div className="sp-actions">
      <ActionButton icon={Navigation03} label="Directions" onClick={() => open(directions)} primary />
      <ActionButton icon={Walking} label={rings ? "Hide reach" : "Walk reach"} pressed={Boolean(rings)} onClick={() => rings ? app.clearRings() : toggleRings("walk")} />
      <ActionButton icon={stop >= 0 ? Tick02 : Route01} label={stop >= 0 ? `Stop ${stop + 1}` : "Add to route"} pressed={stop >= 0} onClick={() => route.toggle(place.key)} />
      <ActionButton icon={LinkSquare02} label="Google Maps" onClick={() => open(mapsUrl)} />
    </div>

    <NoteEditor key={place.key} placeKey={place.key} />

    <SectionTitle>On your lists</SectionTitle>
    <div className="sp-list-chips">
      {lists.map(list => <button key={list.id} type="button" className="sp-list-chip" style={{ "--chip-color": list.color } as React.CSSProperties} onClick={() => app.openLists([list.id])}><ListCover list={list} size={20} />{list.title}</button>)}
      <div className="sp-menu-anchor">
        <button type="button" className="sp-list-chip sp-list-chip-add" aria-expanded={picker} onClick={() => setPicker(v => !v)}><Icon icon={Add01} size={14} />Add to list</button>
        {picker && <div className="sp-menu sp-menu-left" role="menu">
          {customLists.map(list => {
            const on = inCustom.includes(list);
            return <button key={list.id} type="button" role="menuitemcheckbox" aria-checked={on} onClick={() => void store.togglePlaceInList(list, place.key)}>
              <ListCover list={customToList(list)} size={22} />{list.title}{on && <span className="sp-menu-check"><Icon icon={Tick02} size={15} /></span>}
            </button>;
          })}
          {customLists.length > 0 && <hr />}
          <button type="button" role="menuitem" onClick={() => { setPicker(false); app.compose({ sourceIds: [], scopes: [{ id: "one", label: place.name, keys: [place.key] }] }); }}><Icon icon={Add01} size={16} />New list with this place</button>
        </div>}
      </div>
    </div>

    <SectionTitle action={rings && <div className="sp-segmented sp-segmented-small" role="radiogroup" aria-label="Travel mode">
      {TRAVEL_MODES.map(m => <button key={m.id} type="button" role="radio" aria-checked={rings.mode === m.id} aria-label={m.label} title={m.label} onClick={() => app.showRings(owner, [place], m.id, RING_MINUTES)}><Icon icon={MODE_ICONS[m.id]} size={15} /></button>)}
    </div>}>Nearby saves</SectionTitle>
    {!rings && <button type="button" className="sp-reach-cta" onClick={() => toggleRings("walk")}>
      <span className="sp-reach-rings" aria-hidden="true"><span /><span /><span /></span>
      <span className="sp-row-text"><span className="sp-row-title">What’s within a 15-minute walk?</span><span className="sp-row-meta">Shows 5, 10 and 15 minute rings and your saves inside them</span></span>
    </button>}
    {rings?.loading && <p className="sp-empty">Working out how far you can {TRAVEL_MODES.find(m => m.id === rings.mode)?.verb}…</p>}
    {rings?.error && <p className="sp-empty">{rings.error}</p>}
    {rings && !rings.loading && !rings.error && nearby.map(group => <NearbyGroup key={group.minutes} minutes={group.minutes} mode={rings.mode} places={group.places} />)}
    {rings && !rings.loading && !rings.error && nearby.every(g => !g.places.length) && <p className="sp-empty">No other saves within 15 minutes.</p>}
  </Frame>;
}

function NearbyGroup({ minutes, mode, places }: { minutes: number; mode: TravelMode; places: SavedPlace[] }) {
  const app = useApp();
  const [all, setAll] = useState(false);
  if (!places.length) return null;
  const shown = all ? places : places.slice(0, 5);
  const verb = mode === "walk" ? "walk" : mode === "bike" ? "ride" : "drive";
  return <div className="sp-nearby">
    <p className="sp-nearby-label"><span className="sp-nearby-badge">{minutes}</span>min {verb}<span className="sp-muted">{plural(places.length, "save")}</span></p>
    {shown.map(p => {
      return <div key={p.key} className="sp-nearby-row" onMouseEnter={() => app.hover(p.key)} onMouseLeave={() => app.hover(null)}>
        <button type="button" onClick={() => app.openPlace(p.key)}><span aria-hidden="true" className="sp-nearby-icon"><Icon icon={categoryIcons[p.category]} size={15} /></span><span className="sp-nearby-name">{p.name}</span>{app.store.notes[p.key] && <span className="sp-note-dot" aria-label="Has a note" />}</button>
        <button type="button" className="sp-stop-toggle sp-stop-toggle-small" data-on={app.route.stops.includes(p.key) || undefined} aria-label={app.route.stops.includes(p.key) ? `Remove ${p.name} from route` : `Add ${p.name} to route`} title={app.route.stops.includes(p.key) ? "Remove from route" : "Add to route"} onClick={() => app.route.toggle(p.key)}>{app.route.stops.includes(p.key) ? app.route.stops.indexOf(p.key) + 1 : <Icon icon={Route01} size={14} />}</button>
      </div>;
    })}
    {places.length > 5 && <button type="button" className="sp-link-button" onClick={() => setAll(v => !v)}>{all ? "Show fewer" : `Show ${places.length - 5} more`}</button>}
  </div>;
}

function ActionButton({ icon, label, onClick, pressed, primary }: { icon: IconSvgElement; label: string; onClick: () => void; pressed?: boolean; primary?: boolean }) {
  return <button type="button" className={`sp-action${primary ? " sp-action-primary" : ""}`} aria-pressed={pressed} onClick={onClick}><span className="sp-action-icon"><Icon icon={icon} size={19} /></span><span className="sp-action-label">{label}</span></button>;
}

function NoteEditor({ placeKey }: { placeKey: string }) {
  const { store } = useApp();
  const saved = store.notes[placeKey]?.text ?? "";
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(44, el.scrollHeight)}px`;
  }, [text]);
  useEffect(() => {
    if (status !== "saving") return;
    const timer = setTimeout(() => setStatus("saved"), 650);
    return () => clearTimeout(timer);
  }, [status, text]);
  return <label className="sp-note" data-empty={!text.trim() || undefined}>
    <span className="sp-note-head"><span className="sp-note-title">Note</span><span className="sp-note-status" aria-live="polite">{status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}</span></span>
    <textarea ref={area} value={text} maxLength={2000} placeholder="What to order, who told you about it, when to go…" onChange={e => { setText(e.target.value); setStatus("saving"); store.saveNote(placeKey, e.target.value); }} />
  </label>;
}
