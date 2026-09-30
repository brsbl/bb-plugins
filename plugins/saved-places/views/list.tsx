import { useEffect, useMemo, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import MoreHorizontal from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import Search01 from "@hugeicons/core-free-icons/Search01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import Copy01 from "@hugeicons/core-free-icons/Copy01Icon";
import PencilEdit02 from "@hugeicons/core-free-icons/PencilEdit02Icon";
import Delete02 from "@hugeicons/core-free-icons/Delete02Icon";
import Note01 from "@hugeicons/core-free-icons/Note01Icon";
import { categories, groupOf, groups, type CategoryId } from "../categories";
import { LIST_COLORS } from "../model";
import { selectLists } from "../selection";
import { MAX_RING_PLACES, RING_MINUTES } from "../routing";
import { categoryIcons } from "../category-icons";
import { Chip, Icon, IconButton, ListCover, SectionTitle, plural } from "../ui";
import { Frame, PlaceRow } from "./rows";
import { inBounds, listRingOwner, useApp, type ListFilter } from "./context";

const MAX_CATEGORY_CHIPS = 8;
const DEFAULT_REACH = 10;

export function ListView({ ids, filter, reach }: { ids: string[]; filter: ListFilter; reach: number | null }) {
  const app = useApp();
  const { store } = app;
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selection = useMemo(() => selectLists(ids, filter, app.getList, store.notes), [ids, filter, app.getList, store.notes]);
  const { lists, all, filtered } = selection;
  const setFilter = (patch: Partial<ListFilter>) => app.replace({ kind: "lists", ids, filter: { ...filter, ...patch }, reach });
  const setReach = (next: number | null) => app.replace({ kind: "lists", ids, filter, reach: next });
  const owner = listRingOwner(ids);
  const rings = app.rings?.owner === owner ? app.rings : null;
  const tooMany = filtered.length > MAX_RING_PLACES;
  const { showRings, clearRings } = app;
  useEffect(() => {
    if (reach === null) return;
    if (tooMany) clearRings();
    else showRings(owner, filtered, "walk", [reach]);
  }, [reach, tooMany, owner, filtered, showRings, clearRings]);
  const reachNote = reach === null ? null
    : tooMany ? `Walking distance maps up to ${MAX_RING_PLACES} places. Search or pick a category to narrow these ${filtered.length}.`
    : rings?.error ?? (rings && !rings.loading ? `Shaded areas are within a ${reach}-minute walk of each place.` : `Mapping walking distance… ${rings?.done ?? 0} of ${filtered.length}`);
  const bounds = app.bounds;
  const here = bounds ? filtered.filter(p => inBounds(p, bounds)) : filtered;
  const hereKeys = new Set(here.map(p => p.key));
  const elsewhere = filtered.filter(p => !hereKeys.has(p.key));
  const visibleRows = filter.inView ? here : [...here, ...elsewhere];
  const categoryCounts = categories.map(c => ({ key: c.id, label: c.label, color: c.color, icon: categoryIcons[c.id], ids: [c.id], count: all.filter(p => p.category === c.id).length })).filter(c => c.count > 0 && c.key !== "other").sort((a, b) => b.count - a.count);
  const chips = categoryCounts.length <= MAX_CATEGORY_CHIPS ? categoryCounts : groups.map(g => {
    const members = categoryCounts.filter(c => c.ids.some(id => groupOf(id).id === g.id));
    return { key: g.id, label: g.label, color: g.color, icon: categoryIcons[g.icon], ids: members.flatMap(c => c.ids), count: members.reduce((n, c) => n + c.count, 0) };
  }).filter(g => g.count > 0).sort((a, b) => b.count - a.count);
  const toggleChip = (ids: CategoryId[]) => {
    const on = ids.every(id => filter.categories.includes(id));
    setFilter({ categories: on ? filter.categories.filter(id => !ids.includes(id)) : [...filter.categories, ...ids.filter(id => !filter.categories.includes(id))] });
  };
  const noteCount = all.filter(p => store.notes[p.key]).length;
  const single = lists.length === 1 ? lists[0] : null;
  const custom = single?.custom ? store.customLists.find(l => l.id === single.id) : undefined;
  const filtering = filter.categories.length > 0 || filter.notes || filter.query.trim().length > 0;

  if (!lists.length) return <Frame label="List" header={<div className="sp-nav-row"><IconButton icon={ArrowLeft01} label="Back" onClick={app.pop} /></div>}><p className="sp-empty">This list is empty or was deleted.</p></Frame>;

  const scopes = [
    ...(filtering ? [{ id: "filtered", label: `Filtered · ${plural(filtered.length, "place")}`, keys: filtered.map(p => p.key) }] : []),
    ...(here.length && here.length < filtered.length ? [{ id: "view", label: `In view · ${plural(here.length, "place")}`, keys: here.map(p => p.key) }] : []),
    { id: "all", label: `Everything · ${plural(all.length, "place")}`, keys: all.map(p => p.key) },
  ];
  const saveAsNew = () => { setMenu(false); app.compose({ sourceIds: lists.map(l => l.id), scopes, title: single ? `${single.title} picks` : lists.map(l => l.title).join(" + ").slice(0, 60), color: single ? LIST_COLORS[(LIST_COLORS.indexOf(single.color as typeof LIST_COLORS[number]) + 3) % LIST_COLORS.length] : undefined }); };

  const header = <>
    <div className="sp-nav-row">
      <IconButton icon={ArrowLeft01} label="Back to lists" onClick={app.pop} />
      <span className="sp-nav-spacer" />
      <div className="sp-menu-anchor">
        <IconButton icon={MoreHorizontal} label="List options" pressed={menu} onClick={() => { setMenu(v => !v); setConfirmDelete(false); }} />
        {menu && <div className="sp-menu" role="menu">
          <button type="button" role="menuitem" onClick={saveAsNew}><Icon icon={Copy01} size={16} />{single ? "Duplicate or save a subset" : "Save as one list"}</button>
          {custom && <button type="button" role="menuitem" onClick={() => { setMenu(false); app.compose({ sourceIds: custom.sourceIds, scopes: [{ id: "all", label: "", keys: custom.placeKeys }], editing: custom }); }}><Icon icon={PencilEdit02} size={16} />Edit name and color</button>}
          {custom && <button type="button" role="menuitem" className="sp-menu-danger" onClick={() => { if (!confirmDelete) { setConfirmDelete(true); return; } void store.deleteList(custom.id); app.pop(); }}><Icon icon={Delete02} size={16} />{confirmDelete ? "Tap again to delete" : "Delete list"}</button>}
        </div>}
      </div>
    </div>
    <div className="sp-list-hero">
      {single ? <ListCover list={single} size={56} /> : <span className="sp-cover-stack">{lists.slice(0, 3).map(l => <ListCover key={l.id} list={l} size={40} />)}</span>}
      <div className="sp-title-block">
        <h2 className="sp-title">{single ? single.title : `${lists.length} lists together`}</h2>
        <p className="sp-subtitle">{single ? plural(all.length, "place") : lists.map(l => l.title).join(", ")}{!single && <><span className="sp-dot-sep" />{plural(all.length, "place")}</>}</p>
      </div>
    </div>
    <label className="sp-search sp-search-small">
      <Icon icon={Search01} size={15} />
      <input type="search" value={filter.query} placeholder={single ? `Search ${single.title}` : "Search these lists"} aria-label="Search in this list" onChange={e => setFilter({ query: e.target.value })} onFocus={app.expand} />
      {filter.query && <button type="button" aria-label="Clear search" onClick={() => setFilter({ query: "" })}><Icon icon={Cancel01} size={14} /></button>}
    </label>
    <div className="sp-chips" role="group" aria-label="Filter places">
      {noteCount > 0 && <Chip pressed={filter.notes} onClick={() => setFilter({ notes: !filter.notes })} color="#e2a336"><Icon icon={Note01} size={13} />Notes<span>{noteCount}</span></Chip>}
      {chips.length > 1 && chips.map(c => <Chip key={c.key} pressed={c.ids.every(id => filter.categories.includes(id))} onClick={() => toggleChip(c.ids)}><span className="sp-chip-glyph sp-orb" style={{ "--orb-color": c.color } as React.CSSProperties}><Icon icon={c.icon} size={12} /></span>{c.label}<span>{c.count}</span></Chip>)}
      {!single && lists.map(l => <span key={l.id} className="sp-legend"><span style={{ background: l.color }} />{l.title}</span>)}
    </div>
  </>;

  return <Frame label={single?.title ?? "Lists"} header={header} footer={<div className="sp-action-bar">
    <button type="button" className="sp-button sp-button-primary" onClick={saveAsNew}><Icon icon={Copy01} size={16} />{filtering ? "Save these as a list" : single ? "Make a new list from this" : "Combine into a list"}</button>
  </div>}>
    <div className="sp-view-meta">
      <button type="button" className="sp-toggle" aria-pressed={filter.inView} onClick={() => setFilter({ inView: !filter.inView })}><span className="sp-toggle-track" />Only in view</button>
      <span>{here.length} in view{elsewhere.length > 0 && ` · ${elsewhere.length} elsewhere`}</span>
    </div>
    <div className="sp-view-meta">
      <button type="button" className="sp-toggle" aria-pressed={reach !== null} onClick={() => setReach(reach === null ? DEFAULT_REACH : null)}><span className="sp-toggle-track" />Walking distance</button>
      {reach !== null && <div className="sp-segmented sp-segmented-small sp-segmented-text" role="radiogroup" aria-label="Walking time">
        {RING_MINUTES.map(minutes => <button key={minutes} type="button" role="radio" aria-checked={reach === minutes} onClick={() => setReach(minutes)}>{minutes} min</button>)}
      </div>}
    </div>
    {reachNote && <p className="sp-view-note" role="status">{reachNote}</p>}
    {here.map(p => <PlaceRow key={p.key} place={p} showLists={single ? undefined : lists} />)}
    {!filter.inView && elsewhere.length > 0 && <>
      {here.length > 0 && <SectionTitle>Elsewhere</SectionTitle>}
      {elsewhere.slice(0, 200).map(p => <PlaceRow key={p.key} place={p} showLists={single ? undefined : lists} />)}
    </>}
    {!visibleRows.length && <p className="sp-empty">{filtered.length ? "Nothing here in view. Pan the map or tap Show all above the map." : "No places match. Clear a filter to see more."}</p>}
  </Frame>;
}
