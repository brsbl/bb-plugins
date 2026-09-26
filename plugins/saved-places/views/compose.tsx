import { useState } from "react";
import ArrowLeft01 from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import { LIST_COLORS, type CustomList, type SavedList } from "../model";
import { IconButton, ListCover, SectionTitle, plural } from "../ui";
import { Frame } from "./rows";
import { useApp, type ComposeDraft } from "./context";

const newId = () => `list-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function ComposeView({ draft }: { draft: ComposeDraft }) {
  const app = useApp();
  const editing = draft.editing;
  const [title, setTitle] = useState(editing?.title ?? draft.title ?? "");
  const [color, setColor] = useState(editing?.color ?? draft.color ?? LIST_COLORS[(app.store.customLists.length * 3 + 6) % LIST_COLORS.length]);
  const [scopeId, setScopeId] = useState(draft.scopes[0]?.id ?? "");
  const scope = draft.scopes.find(s => s.id === scopeId) ?? draft.scopes[0];
  const keys = scope?.keys ?? [];
  const sources = draft.sourceIds.map(app.getList).filter(l => l !== undefined);
  const preview: SavedList = { id: editing?.id ?? "preview", title, color, group: "custom", placeKeys: keys, custom: true, sourceIds: draft.sourceIds };
  const valid = title.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    const now = Date.now();
    const list: CustomList = editing
      ? { ...editing, title: title.trim(), color, updatedAt: now }
      : { id: newId(), title: title.trim(), color, placeKeys: keys, sourceIds: draft.sourceIds, createdAt: now, updatedAt: now };
    void app.store.saveList(list);
    if (editing) app.pop();
    else app.replace({ kind: "lists", ids: [list.id], filter: { categories: [], notes: false, query: "", inView: false } });
  };

  return <Frame label={editing ? "Edit list" : "New list"} header={<>
    <div className="sp-nav-row">
      <IconButton icon={ArrowLeft01} label="Cancel" onClick={app.pop} />
      <span className="sp-nav-title">{editing ? "Edit list" : "New list"}</span>
      <span className="sp-nav-spacer" />
    </div>
  </>} footer={<div className="sp-action-bar">
    <button type="button" className="sp-button" onClick={app.pop}>Cancel</button>
    <button type="button" className="sp-button sp-button-primary" disabled={!valid} onClick={submit}>{editing ? "Save" : keys.length ? `Create with ${plural(keys.length, "place")}` : "Create list"}</button>
  </div>}>
    <form className="sp-compose" onSubmit={e => { e.preventDefault(); submit(); }}>
      <div className="sp-compose-preview">
        <ListCover list={preview} size={84} />
        <input className="sp-compose-title" value={title} autoFocus maxLength={80} placeholder="Name your list" aria-label="List name" onChange={e => setTitle(e.target.value)} />
        {sources.length > 0 && <p className="sp-subtitle">From {sources.map(s => s.title).join(", ")}</p>}
      </div>
      {!editing && draft.scopes.length > 1 && <>
        <SectionTitle>Include</SectionTitle>
        <div className="sp-scopes" role="radiogroup" aria-label="Places to include">
          {draft.scopes.map(s => <button key={s.id} type="button" role="radio" aria-checked={s.id === scope?.id} onClick={() => setScopeId(s.id)}><span className="sp-radio" />{s.label}</button>)}
        </div>
      </>}
      <SectionTitle>Color</SectionTitle>
      <div className="sp-swatches" role="radiogroup" aria-label="List color">
        {LIST_COLORS.map(c => <button key={c} type="button" role="radio" aria-checked={c === color} aria-label={c} style={{ background: c }} onClick={() => setColor(c)} />)}
      </div>
    </form>
  </Frame>;
}
