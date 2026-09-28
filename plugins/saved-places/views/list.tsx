import { useMemo, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import MoreHorizontal from "@hugeicons/core-free-icons/MoreHorizontalIcon";
import Search01 from "@hugeicons/core-free-icons/Search01Icon";
import Cancel01 from "@hugeicons/core-free-icons/Cancel01Icon";
import Copy01 from "@hugeicons/core-free-icons/Copy01Icon";
import PencilEdit02 from "@hugeicons/core-free-icons/PencilEdit02Icon";
import Delete02 from "@hugeicons/core-free-icons/Delete02Icon";
import Note01 from "@hugeicons/core-free-icons/Note01Icon";
import { categories } from "../categories";
import { LIST_COLORS } from "../model";
import { selectLists } from "../selection";
import { categoryIcons } from "../category-icons";
import { Chip, Icon, IconButton, ListCover, SectionTitle, plural } from "../ui";
import { Frame, PlaceRow } from "./rows";
import { inBounds, useApp, type ListFilter } from "./context";

export function ListView({ ids, filter }: { ids: string[]; filter: ListFilter }) {
  const app = useApp();
  const { store } = app;
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selection = useMemo(() => selectLists(ids, filter, app.getList, store.notes), [ids, filter, app.getList, store.notes]);
  const { lists, all, filtered } = selection;
  const setFilter = (patch: Partial<ListFilter>) => app.replace({ kind: "lists", ids, filter: { ...filter, ...patch } });
  const bounds = app.bounds;
  const here = bounds ? filtered.filter(p => inBounds(p, bounds)) : filtered;
  const hereKeys = new Set(here.map(p => p.key));
  const elsewhere = filtered.filter(p => !hereKeys.has(p.key));
  const visibleRows = filter.inView ? here : [...here, ...elsewhere];
  const categoryCounts = categories.map(c => ({ ...c, count: all.filter(p => p.category === c.id).length })).filter(c => c.count > 0 && c.id !== "other");
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
      {categoryCounts.length > 1 && categoryCounts.map(c => <Chip key={c.id} pressed={filter.categories.includes(c.id)} onClick={() => setFilter({ categories: filter.categories.includes(c.id) ? filter.categories.filter(x => x !== c.id) : [...filter.categories, c.id] })}><span className="sp-chip-dot" style={{ background: c.color }} /><Icon icon={categoryIcons[c.id]} size={14} />{c.label}<span>{c.count}</span></Chip>)}
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
    {here.map(p => <PlaceRow key={p.key} place={p} showLists={single ? undefined : lists} />)}
    {!filter.inView && elsewhere.length > 0 && <>
      {here.length > 0 && <SectionTitle>Elsewhere</SectionTitle>}
      {elsewhere.slice(0, 200).map(p => <PlaceRow key={p.key} place={p} showLists={single ? undefined : lists} />)}
    </>}
    {!visibleRows.length && <p className="sp-empty">{filtered.length ? "Nothing here in view. Pan the map or tap Show all above the map." : "No places match. Clear a filter to see more."}</p>}
  </Frame>;
}
