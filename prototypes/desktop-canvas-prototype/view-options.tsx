import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import { groupByEnvironment, type CanvasCollection } from "./canvas-organization";
import type { useSidebarPreferences } from "./sidebar-preferences";

export function menuKeys(event: KeyboardEvent<HTMLDivElement>) {
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  let target: number | undefined;
  if (event.key === "ArrowDown") target = (index + 1) % buttons.length;
  if (event.key === "ArrowUp") target = (index - 1 + buttons.length) % buttons.length;
  if (event.key === "Home") target = 0;
  if (event.key === "End") target = buttons.length - 1;
  if (target !== undefined) { event.preventDefault(); event.stopPropagation(); buttons[target]?.focus(); }
}

export function ViewOptions({ state, groups, onBack, onArrange }: {
  state: ReturnType<typeof useSidebarPreferences>;
  groups: CanvasCollection[];
  onBack: () => void;
  onArrange: () => void;
}) {
  const [page, setPage] = useState<"view" | "organize" | "sort" | "filter" | "visibility">("view");
  const root = useRef<HTMLDivElement>(null);
  const { preferences: p, saving, error, update, refresh } = state;
  useEffect(() => { root.current?.querySelector("button")?.focus(); }, [page]);
  const choose = (label: string, checked: boolean, action: () => void, checkbox = false, icon = "Check") => <Button key={label} variant="ghost" role={checkbox ? "menuitemcheckbox" : "menuitemradio"} aria-checked={checked} aria-disabled={saving} onClick={() => { if (!saving) action(); }}><span>{label}</span>{checked && <Icon name={icon} />}</Button>;
  return <div ref={root} className="cdc-view-options">
    <Button variant="ghost" role="menuitem" onClick={() => page === "view" ? onBack() : setPage("view")}><Icon name="ChevronLeft" />{page === "view" ? "Back" : "View options"}</Button>
    <div className="cdc-menu-label">{page === "view" ? "Sidebar & canvas" : page === "sort" ? "Sort by" : page === "visibility" ? "Visible groups" : page === "organize" ? "Organize" : "Filter"}</div>
    {error && <p role="alert" className="cdc-menu-error">{error}<button onClick={() => void refresh()}>Retry</button></p>}
    {!p ? <p role="status">Loading sidebar settings…</p> : <>
      {page === "view" && <>
        {([["organize", "Organize", "Layers"], ["sort", "Sort by", "ArrowUpDown"], ["filter", "Filter", "SlidersHorizontal"], ["visibility", "Visible groups", "Eye"]] as const).map(([value, label, icon]) => <Button key={value} variant="ghost" role="menuitem" onClick={() => setPage(value)}><Icon name={icon} /><span>{label}</span><Icon name="ChevronRight" /></Button>)}
        <hr /><Button variant="ghost" role="menuitem" onClick={onArrange}>Arrange like sidebar</Button>
      </>}
      {page === "organize" && <>
        {([["project", "By project"], ["machine", "By machine"], ["chronological", "Custom"]] as const).map(([value, label]) => choose(label, p.organizationMode === value, () => void update({ organizationMode: value })))}
        <hr />
        {choose("By environment", groupByEnvironment(p), () => void update({ environmentGrouping: !groupByEnvironment(p) }), true)}
        {choose("Provider icons", p.showProviderIcons, () => void update({ showProviderIcons: !p.showProviderIcons }), true)}
      </>}
      {page === "sort" && ([["updated", "Updated at"], ["created", "Created at"], ["alpha", "Alphabetical"]] as const).map(([value, label]) => {
        const selected = (p.chronologicalSort === "none" ? "updated" : p.chronologicalSort) === value;
        const direction = p.sortDirection === "default" ? (value === "alpha" ? "ascending" : "descending") : p.sortDirection;
        const next = selected ? direction === "ascending" ? "descending" : "ascending" : value === "alpha" ? "ascending" : "descending";
        return <Button key={value} variant="ghost" role="menuitemradio" aria-checked={selected} aria-label={selected ? label + ", " + direction + ". Sort " + next : label} aria-disabled={saving} onClick={() => { if (!saving) void update({ chronologicalSort: value, sortDirection: next }); }}><span>{label}</span>{selected && <Icon name={direction === "ascending" ? "ArrowUp" : "ArrowDown"} />}</Button>;
      })}
      {page === "filter" && (["active", "archived"] as const).map(value => {
        const checked = p.threadLifecycles.includes(value);
        return <Button key={value} variant="ghost" role="menuitemcheckbox" aria-checked={checked} aria-disabled={saving || (checked && p.threadLifecycles.length === 1)} disabled={checked && p.threadLifecycles.length === 1} onClick={() => void update({ threadLifecycles: checked ? p.threadLifecycles.filter(v => v !== value) : [...p.threadLifecycles, value] })}><span>{value === "active" ? "Active" : "Archived"}</span>{checked && <Icon name="Check" />}</Button>;
      })}
      {page === "visibility" && groups.filter(group => group.id !== "pinned").map(group => choose(group.name, !p.hiddenGroups.includes(group.id), () => void update({ hiddenGroups: p.hiddenGroups.includes(group.id) ? p.hiddenGroups.filter(id => id !== group.id) : [...p.hiddenGroups, group.id] }), true))}
    </>}
  </div>;
}
