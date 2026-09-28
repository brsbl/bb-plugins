import { useMemo, useState } from "react";
import Search01 from "@hugeicons/core-free-icons/Search01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import Add01 from "@hugeicons/core-free-icons/Add01Icon";
import { allPlaces, GROUP_LABELS, matchesQuery, type ListGroup } from "../model";
import { Icon, ListCover, SectionTitle, plural } from "../ui";
import { NOTES_LIST_ID } from "../notes-list";
import { Frame, ListRow, PlaceRow } from "./rows";
import { inBounds, useApp } from "./context";

const GROUPS: ListGroup[] = ["custom", "trips", "friends", "saved"];

export function LibraryView({ query }: { query: string }) {
  const app = useApp();
  const { store } = app;
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const q = query.trim();
  const noteKeys = Object.keys(store.notes);
  const notesList = app.getList(NOTES_LIST_ID);
  const setQuery = (next: string) => app.replace({ kind: "library", query: next });

  const area = useMemo(() => {
    const bounds = app.bounds;
    if (!bounds || app.zoom < 6) return [];
    const here = new Set(allPlaces.filter(p => inBounds(p, bounds)).map(p => p.key));
    if (!here.size) return [];
    return store.lists.map(list => ({ list, count: list.placeKeys.reduce((n, key) => n + (here.has(key) ? 1 : 0), 0) }))
      .filter(entry => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [app.bounds, app.zoom, store.lists]);

  const listMatches = useMemo(() => q ? store.lists.filter(list => list.title.toLocaleLowerCase().includes(q.toLocaleLowerCase())) : [], [q, store.lists]);
  const placeMatches = useMemo(() => q ? allPlaces.filter(place => matchesQuery(place, q, store.notes[place.key]?.text)) : [], [q, store.notes]);

  const toggle = (id: string) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  const openList = (id: string) => selecting ? toggle(id) : app.openLists([id]);
  const startCompose = () => {
    const sources = selected.map(app.getList).filter(l => l !== undefined);
    const keys = [...new Set(sources.flatMap(l => l.placeKeys))];
    app.compose({ sourceIds: sources.map(l => l.id), scopes: [{ id: "all", label: `All ${plural(keys.length, "place")}`, keys }], title: sources.length === 1 ? `${sources[0].title} picks` : "" });
    setSelecting(false);
    setSelected([]);
  };

  const header = <>
    <div className="sp-title-row">
      <div className="sp-title-block">
        <h2 className="sp-title">Saved</h2>
        <p className="sp-subtitle">{plural(allPlaces.length, "place")}<span className="sp-dot-sep" />{plural(store.lists.length, "list")}{noteKeys.length > 0 && <><span className="sp-dot-sep" />{plural(noteKeys.length, "note")}</>}</p>
      </div>
      <button type="button" className="sp-text-button" onClick={() => { setSelecting(v => !v); setSelected([]); }}>{selecting ? "Done" : "Select"}</button>
      {!selecting && <button type="button" className="sp-round-button" aria-label="New list" title="New list" onClick={() => app.compose({ sourceIds: [], scopes: [{ id: "empty", label: "Start empty", keys: [] }] })}><Icon icon={Add01} size={18} /></button>}
    </div>
    <label className="sp-search">
      <Icon icon={Search01} size={16} />
      <input type="search" value={query} placeholder="Search places, lists and notes" aria-label="Search places, lists and notes" onChange={e => setQuery(e.target.value)} onFocus={app.expand} />
      {query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><Icon icon={Cancel01} size={14} /></button>}
    </label>
  </>;

  const footer = selecting ? <div className="sp-action-bar">
    <span className="sp-action-bar-label">{selected.length ? plural(selected.length, "list") + " selected" : "Choose lists to combine"}</span>
    <button type="button" className="sp-button" disabled={!selected.length} onClick={() => { app.openLists(selected); setSelecting(false); setSelected([]); }}>Show together</button>
    <button type="button" className="sp-button sp-button-primary" disabled={!selected.length} onClick={startCompose}>New list</button>
  </div> : undefined;

  if (q) return <Frame label="Search results" header={header}>
    {listMatches.length > 0 && <>
      <SectionTitle>Lists</SectionTitle>
      {listMatches.map(list => <ListRow key={list.id} list={list} onClick={() => openList(list.id)} selecting={selecting} selected={selected.includes(list.id)} />)}
    </>}
    <SectionTitle>{placeMatches.length ? plural(placeMatches.length, "place") : "Places"}</SectionTitle>
    {placeMatches.slice(0, 60).map(place => <PlaceRow key={place.key} place={place} />)}
    {!placeMatches.length && !listMatches.length && <p className="sp-empty">Nothing matches “{q}”. Try a neighborhood, a dish, or words from a note.</p>}
    {placeMatches.length > 60 && <p className="sp-empty">Showing 60 of {placeMatches.length}. Keep typing to narrow it down.</p>}
  </Frame>;

  return <Frame label="Your saved lists" header={header} footer={footer}>
    {area.length > 0 && !selecting && <>
      <SectionTitle>In this area</SectionTitle>
      <div className="sp-shelf">
        {area.map(({ list, count }) => <button key={list.id} type="button" className="sp-shelf-card" onClick={() => app.openLists([list.id])}>
          <ListCover list={list} size={72} />
          <span className="sp-shelf-title">{list.title}</span>
          <span className="sp-shelf-meta">{count} here</span>
        </button>)}
      </div>
    </>}
    {notesList && !selecting && <ListRow list={notesList} meta={plural(notesList.placeKeys.length, "place") + " with notes"} onClick={() => app.openLists([NOTES_LIST_ID])} />}
    {GROUPS.map(group => {
      const lists = store.lists.filter(list => list.group === group);
      if (!lists.length) return null;
      return <div key={group} className="sp-group">
        <SectionTitle>{GROUP_LABELS[group]}</SectionTitle>
        {lists.map(list => <ListRow key={list.id} list={list} onClick={() => openList(list.id)} selecting={selecting} selected={selected.includes(list.id)} />)}
      </div>;
    })}
    {!store.customLists.length && !selecting && <div className="sp-hint">
      <strong>Make your own lists</strong>
      <span>Tap Select to combine lists, or open any list and save the places you filter into a new one.</span>
    </div>}
  </Frame>;
}

