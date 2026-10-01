import { useMemo, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Search01 from "@hugeicons/core-free-icons/Search01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import { customToList } from "../model";
import { pickCandidates } from "../selection";
import { NOTES_LIST_ID } from "../notes-list";
import { Chip, Icon, IconButton, ListCover, plural } from "../ui";
import { Frame, PlaceRow } from "./rows";
import { addWithUndo } from "./compose";
import { togglePicked, useApp } from "./context";

const MAX_ROWS = 200;

export function PickView({ listId, query, sourceId, picked }: { listId: string; query: string; sourceId: string | null; picked: string[] }) {
  const app = useApp();
  const { store } = app;
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const target = store.customLists.find(l => l.id === listId);
  const candidates = useMemo(() => pickCandidates(sourceId, query, app.getList, store.notes), [sourceId, query, app.getList, store.notes]);
  const notes = app.getList(NOTES_LIST_ID);
  const sources = [...(notes ? [notes] : []), ...store.lists.filter(l => l.id !== listId && l.placeKeys.length > 0)];
  const update = (patch: { query?: string; sourceId?: string | null; picked?: string[] }) => app.replace({ kind: "pick", listId, query, sourceId, picked, ...patch });

  if (!target) return <Frame label="Add places" header={<div className="sp-nav-row"><IconButton icon={ArrowLeft01} label="Back" onClick={app.pop} /></div>}><p className="sp-empty">This list was deleted.</p></Frame>;

  const visible = new Set(candidates.map(p => p.key));
  const hidden = picked.filter(key => !visible.has(key)).length;
  const source = sourceId ? app.getList(sourceId) : undefined;
  const add = async () => {
    if (!picked.length || busy) return;
    setBusy(true);
    setFailed(false);
    if (await addWithUndo(app, target, picked, false)) {
      app.pop();
      app.fitKeys([...target.placeKeys, ...picked]);
      return;
    }
    setBusy(false);
    setFailed(true);
  };

  const header = <>
    <div className="sp-nav-row">
      <IconButton icon={ArrowLeft01} label="Cancel" onClick={app.pop} />
      <span className="sp-nav-spacer" />
    </div>
    <div className="sp-list-hero">
      <ListCover list={customToList(target)} size={44} />
      <div className="sp-title-block">
        <h2 className="sp-title">Add to {target.title}</h2>
        <p className="sp-subtitle">Tap places or pins to pick them</p>
      </div>
    </div>
    <label className="sp-search sp-search-small">
      <Icon icon={Search01} size={15} />
      <input type="search" value={query} placeholder={source ? `Search ${source.title}` : "Search all your saves"} aria-label="Search places to add" onChange={e => update({ query: e.target.value })} onFocus={app.expand} />
      {query && <button type="button" aria-label="Clear search" onClick={() => update({ query: "" })}><Icon icon={Cancel01} size={14} /></button>}
    </label>
    <div className="sp-chips" role="group" aria-label="Pick from">
      <Chip pressed={sourceId === null} onClick={() => update({ sourceId: null })}>All saves</Chip>
      {sources.map(l => <Chip key={l.id} pressed={sourceId === l.id} onClick={() => update({ sourceId: sourceId === l.id ? null : l.id })}><span className="sp-chip-dot" style={{ background: l.color }} />{l.title}<span>{l.placeKeys.length}</span></Chip>)}
    </div>
  </>;

  const footer = <>
    {failed && <p className="sp-inline-error" role="alert">Those places didn’t save. Check your connection and try again.</p>}
    <div className="sp-action-bar">
      <span className="sp-action-bar-label" role="status">{picked.length ? `${picked.length} selected${hidden ? ` · ${hidden} hidden by filter` : ""}` : "Select places to add"}</span>
      <button type="button" className="sp-button sp-button-primary" disabled={!picked.length || busy} onClick={() => void add()}>{failed ? "Try again" : busy ? "Adding…" : picked.length ? `Add ${picked.length} to ${target.title}` : "Add"}</button>
    </div>
  </>;

  return <Frame label={`Add places to ${target.title}`} header={header} footer={footer}>
    {candidates.slice(0, MAX_ROWS).map(place => <PlaceRow key={place.key} place={place} check={{
      on: picked.includes(place.key),
      toggle: () => update({ picked: togglePicked(picked, place.key) }),
      locked: target.placeKeys.includes(place.key) ? "In list" : undefined,
    }} />)}
    {!candidates.length && <p className="sp-empty">{query.trim() ? `Nothing matches “${query.trim()}”. Try a neighborhood or a dish.` : "This list has no places yet."}</p>}
    {candidates.length > MAX_ROWS && <p className="sp-empty">Showing {MAX_ROWS} of {plural(candidates.length, "place")}. Search or pick a list to narrow it down.</p>}
  </Frame>;
}
