import { Fragment, useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import { LIST_COLORS, customToList, type CustomList, type SavedList } from "../model";
import { IconButton, ListCover, SectionTitle, plural } from "../ui";
import { Frame } from "./rows";
import { emptyFilter, useApp, type AppApi, type ComposeDraft } from "./context";

const newId = () => `list-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const SAVE_FAILED = "That didn’t save. Check your connection and try again.";

export function Swatches({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  return <div className="sp-swatches" role="radiogroup" aria-label="List color">
    {LIST_COLORS.map(c => <button key={c} type="button" role="radio" aria-checked={c === color} aria-label={c} style={{ background: c }} onMouseDown={e => e.preventDefault()} onClick={() => onChange(c)} />)}
  </div>;
}

export async function addWithUndo(app: AppApi, list: CustomList, keys: string[], offerOpen = true) {
  const fresh = keys.filter(key => !list.placeKeys.includes(key));
  if (!await app.store.addPlaces(list.id, fresh)) return false;
  app.notify(`Added ${plural(fresh.length, "place")} to ${list.title}`, [
    { label: "Undo", run: () => void app.store.removePlaces(list.id, fresh).then(ok => { if (!ok) app.notify("That couldn’t be undone. Try again."); }) },
    ...(offerOpen ? [{ label: "Open", run: () => app.openLists([list.id]) }] : []),
  ]);
  return true;
}

export function ComposeView({ draft }: { draft: ComposeDraft }) {
  const app = useApp();
  const { store } = app;
  const [title, setTitle] = useState(draft.title);
  const [color, setColor] = useState<string>(LIST_COLORS[(store.customLists.length * 3 + 6) % LIST_COLORS.length]);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const count = draft.keys.length;
  const destinations = draft.destinations ? store.customLists : [];
  const preview: SavedList = { id: "preview", title, color, group: "custom", placeKeys: draft.keys, custom: true, sourceIds: draft.sourceIds };
  const valid = title.trim().length > 0;
  const createLabel = failed === "new" ? "Try again" : busy === "new" ? "Creating…" : count ? `Create with ${plural(count, "place")}` : "Create list";

  const create = async () => {
    if (!valid || busy) return;
    const now = Date.now();
    const list: CustomList = { id: newId(), title: title.trim(), color, placeKeys: draft.keys, sourceIds: draft.sourceIds, createdAt: now, updatedAt: now };
    setBusy("new");
    setFailed(null);
    if (await store.saveList(list)) {
      app.finishSelect({ kind: "lists", ids: [list.id], filter: emptyFilter, reach: null, picked: null });
      if (list.placeKeys.length) app.fitKeys(list.placeKeys);
      return;
    }
    setBusy(null);
    setFailed("new");
  };
  const addTo = async (list: CustomList) => {
    if (busy) return;
    setBusy(list.id);
    setFailed(null);
    const added = await addWithUndo(app, list, draft.keys);
    if (added) { app.finishSelect(); return; }
    setBusy(null);
    setFailed(list.id);
  };

  const nameInput = (large: boolean) => <input className={large ? "sp-compose-title" : "sp-new-list-name"} value={title} autoFocus={large} maxLength={80} placeholder="Name your list" aria-label="New list name" onFocus={e => e.currentTarget.select()} onChange={e => setTitle(e.target.value)} />;
  const error = failed && <p className="sp-inline-error" role="alert">{SAVE_FAILED}</p>;

  if (!destinations.length) return <Frame label="New list" header={<div className="sp-nav-row">
    <IconButton icon={ArrowLeft01} label="Cancel" onClick={app.pop} />
    <span className="sp-nav-title">New list</span>
    <span className="sp-nav-spacer" />
  </div>} footer={<div className="sp-action-bar">
    <button type="button" className="sp-button" onClick={app.pop}>Cancel</button>
    <button type="button" className="sp-button sp-button-primary" disabled={!valid || busy !== null} onClick={() => void create()}>{createLabel}</button>
  </div>}>
    <form className="sp-compose" onSubmit={e => { e.preventDefault(); void create(); }}>
      <div className="sp-compose-preview">
        <ListCover list={preview} size={84} />
        {nameInput(true)}
        <p className="sp-subtitle">{count ? `${plural(count, "place")} · ${draft.source}` : "Starts empty. You’ll add places next."}</p>
      </div>
      <SectionTitle>Color</SectionTitle>
      <Swatches color={color} onChange={setColor} />
      {error}
    </form>
  </Frame>;

  return <Frame label={`Add ${plural(count, "place")}`} header={<>
    <div className="sp-nav-row">
      <IconButton icon={ArrowLeft01} label="Cancel" onClick={app.pop} />
      <span className="sp-nav-spacer" />
    </div>
    <h2 className="sp-title">Add {plural(count, "place")}</h2>
    <p className="sp-subtitle">{draft.source}</p>
  </>}>
    <SectionTitle>New list</SectionTitle>
    <form className="sp-new-list" onSubmit={e => { e.preventDefault(); void create(); }}>
      <div className="sp-new-list-head">
        <ListCover list={preview} size={44} />
        {nameInput(false)}
      </div>
      <Swatches color={color} onChange={setColor} />
      <button type="submit" className="sp-button sp-button-primary" disabled={!valid || busy !== null}>{createLabel}</button>
      {failed === "new" && error}
    </form>
    <SectionTitle>Your lists</SectionTitle>
    {destinations.map(list => {
      const already = draft.keys.filter(key => list.placeKeys.includes(key)).length;
      const fresh = count - already;
      const status = failed === list.id ? "Try again" : busy === list.id ? "Adding…" : !fresh ? "All here" : already ? `Add ${fresh} · ${already} already there` : `Add ${fresh}`;
      return <Fragment key={list.id}><button type="button" className="sp-row sp-dest-row" disabled={!fresh || busy !== null} onClick={() => void addTo(list)}>
        <ListCover list={customToList(list)} />
        <span className="sp-row-text">
          <span className="sp-row-title">{list.title}</span>
          <span className="sp-row-meta">{plural(list.placeKeys.length, "place")}</span>
        </span>
        <span className="sp-dest-status" data-failed={failed === list.id || undefined}>{status}</span>
      </button>{failed === list.id && error}</Fragment>;
    })}
  </Frame>;
}
