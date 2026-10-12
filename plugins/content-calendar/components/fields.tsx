import { useState } from "react";
import { FORMATS, FORMAT_LABELS, NO_FORMAT_LABEL, TRAY_LABELS, todayInCalendar, type Format, type Item } from "../model.js";
import type { When } from "./data.js";

export function FormatSelect({ value, onChange, id, label = "Format" }: { value: Format | null; onChange: (value: Format | null) => void; id?: string; label?: string }) {
  return <select id={id} aria-label={id ? undefined : label} className="cc-input" value={value ?? ""} onChange={(event) => onChange(event.target.value ? event.target.value as Format : null)}>
    {FORMATS.map((format) => <option key={format} value={format}>{FORMAT_LABELS[format]}</option>)}
    <option value="">{NO_FORMAT_LABEL}</option>
  </select>;
}

/** Move to…: a date, Evergreen, or Later. The click-only alternative to dragging. */
export function MoveTo({ item, onMove }: { item: Item; onMove: (when: When) => void }) {
  const [date, setDate] = useState(item.date ?? todayInCalendar());
  return <form className="cc-move" onSubmit={(event) => { event.preventDefault(); if (date) onMove({ date }); }}>
    <label className="cc-muted" htmlFor={`cc-move-${item.id}`}>Move “{item.title}” to</label>
    <div className="cc-row-actions">
      <input id={`cc-move-${item.id}`} className="cc-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} autoFocus />
      <button type="submit" className="cc-button cc-primary" disabled={!date || date === item.date}>Move</button>
    </div>
    <div className="cc-row-actions">
      {(["evergreen", "later"] as const).map((tray) => <button key={tray} type="button" className="cc-button" disabled={item.tray === tray} onClick={() => onMove({ tray })}>{TRAY_LABELS[tray]}</button>)}
    </div>
  </form>;
}
