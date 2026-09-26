import type { ReactNode } from "react";
import Route01 from "@hugeicons/core-free-icons/Route01Icon";
import Note01 from "@hugeicons/core-free-icons/Note01Icon";
import CheckmarkCircle02 from "@hugeicons/core-free-icons/CheckmarkCircle02Icon";
import { categoryFor } from "../categories";
import { shortAddress, type SavedList, type SavedPlace } from "../model";
import { Icon, ListCover, PlaceAvatar, plural } from "../ui";
import { useApp } from "./context";

export function Frame({ header, footer, children, label }: { header: ReactNode; footer?: ReactNode; children: ReactNode; label: string }) {
  return <section className="sp-frame" aria-label={label}>
    <header className="sp-frame-header" data-drag-zone>{header}</header>
    <div className="sp-frame-body">{children}</div>
    {footer && <footer className="sp-frame-footer">{footer}</footer>}
  </section>;
}

export function ListRow({ list, meta, onClick, selecting, selected, trailing }: { list: SavedList; meta?: string; onClick: () => void; selecting?: boolean; selected?: boolean; trailing?: ReactNode }) {
  const { store } = useApp();
  const notes = list.placeKeys.reduce((n, key) => n + (store.notes[key] ? 1 : 0), 0);
  return <button type="button" className="sp-row sp-list-row" onClick={onClick} aria-pressed={selecting ? selected : undefined}>
    <ListCover list={list} />
    <span className="sp-row-text">
      <span className="sp-row-title">{list.title}</span>
      <span className="sp-row-meta">{meta ?? plural(list.placeKeys.length, "place")}{notes > 0 && <><span className="sp-dot-sep" />{plural(notes, "note")}</>}</span>
    </span>
    {selecting ? <span className="sp-check" data-on={selected || undefined} aria-hidden="true">{selected && <Icon icon={CheckmarkCircle02} size={22} />}</span> : trailing}
  </button>;
}

export function PlaceRow({ place, showLists }: { place: SavedPlace; showLists?: SavedList[] }) {
  const app = useApp();
  const note = app.store.notes[place.key]?.text;
  const stop = app.route.stops.indexOf(place.key);
  const category = categoryFor(place.category);
  const kind = place.placeType ?? (place.category === "other" ? null : category.label);
  return <div className="sp-place-row" onMouseEnter={() => app.hover(place.key)} onMouseLeave={() => app.hover(null)}>
    <button type="button" className="sp-row" onClick={() => app.openPlace(place.key)} onFocus={() => app.hover(place.key)} onBlur={() => app.hover(null)}>
      <PlaceAvatar place={place} color={category.color} />
      <span className="sp-row-text">
        <span className="sp-row-title">{place.name}</span>
        <span className="sp-row-meta">{kind && <>{kind}<span className="sp-dot-sep" /></>}{shortAddress(place.address) || "No address"}</span>
        {note && <span className="sp-row-note"><Icon icon={Note01} size={13} />{note}</span>}
        {showLists && showLists.length > 1 && <span className="sp-row-lists">{showLists.filter(l => l.placeKeys.includes(place.key)).map(l => <span key={l.id} style={{ background: l.color }} title={l.title} />)}</span>}
      </span>
    </button>
    <button type="button" className="sp-stop-toggle" data-on={stop >= 0 || undefined} aria-label={stop >= 0 ? `Remove ${place.name} from route` : `Add ${place.name} to route`} title={stop >= 0 ? "Remove from route" : "Add to route"} onClick={() => app.route.toggle(place.key)}>
      {stop >= 0 ? stop + 1 : <Icon icon={Route01} size={16} />}
    </button>
  </div>;
}
