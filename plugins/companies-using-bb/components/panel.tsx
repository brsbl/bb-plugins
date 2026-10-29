import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ICONS } from "./icons.js";
import { fmtDay, panelFor, type PanelItem, type Row, type Signal } from "./view.js";

const CAP = 5;

function Glyph({ name, className, label }: { name: string; className: string; label: string }) {
  const icon = ICONS[name]!;
  return <svg viewBox={icon.viewBox} className={className} role="img" aria-label={label}><title>{label}</title>{icon.paths.map((d) => <path key={d} d={d} />)}</svg>;
}

function ItemIcon({ item }: { item: PanelItem }) {
  if (item.k === "Issue") return item.st === "open" ? <Glyph name="issue-opened" className="ic-open" label="Open issue" /> : <Glyph name="issue-closed" className="ic-done" label="Closed issue" />;
  if (item.k === "PR") {
    if (item.st === "merged") return <Glyph name="git-merge" className="ic-done" label="Merged PR" />;
    return item.st === "open" ? <Glyph name="git-pull-request" className="ic-open" label="Open PR" /> : <Glyph name="git-pull-request-closed" className="ic-closed" label="Closed PR" />;
  }
  if (item.k === "Discord") return <Glyph name="discord" className="ic-muted" label="Discord message" />;
  return <Glyph name="slack" className="ic-muted" label="Slack Connect" />;
}

function ItemRow({ item }: { item: PanelItem }) {
  return <li>
    <ItemIcon item={item} />
    {item.u ? <a className="t" href={item.u} target="_blank" rel="noopener">{item.t || item.u}</a> : <span className="t">{item.t}</span>}
    {item.opened === false ? <span className="dt">commented</span> : null}
    <span className="dt">{fmtDay(item.d)}</span>
  </li>;
}

const Chevron = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/**
 * The list behind one count, anchored under (or above) the count button
 * inside the page's scroll container, like the original page's popover.
 */
export function CountPanel({ row, sig, anchor, container, onClose }: {
  row: Row; sig: Signal; anchor: () => HTMLElement | null; container: () => HTMLElement | null; onClose: () => void;
}) {
  const { people, head } = panelFor(row, sig);
  const [closed, setClosed] = useState<ReadonlySet<number>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const [moreBelow, setMoreBelow] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  const fade = useCallback(() => {
    const b = body.current;
    if (b) setMoreBelow(b.scrollTop + b.clientHeight < b.scrollHeight - 2);
  }, []);

  const place = useCallback(() => {
    const p = panel.current, a = anchor(), root = container();
    if (!p || !a || !root) return;
    const r = a.getBoundingClientRect(), box = root.getBoundingClientRect();
    const w = p.offsetWidth, h = p.offsetHeight;
    let left = r.left - box.left + root.scrollLeft;
    left = Math.max(root.scrollLeft + 16, Math.min(left, root.scrollLeft + root.clientWidth - w - 16));
    let top = r.bottom - box.top + root.scrollTop + 6;
    const bottom = Math.min(window.innerHeight, root.closest(".cub")?.getBoundingClientRect().bottom ?? window.innerHeight);
    if (r.bottom + 6 + h > bottom && r.top - 6 - h > 0) top = r.top - box.top + root.scrollTop - 6 - h;
    p.style.left = `${left}px`;
    p.style.top = `${top}px`;
  }, [anchor, container]);

  useLayoutEffect(() => {
    place();
    close.current?.focus({ preventScroll: true });
  }, [place]);
  useLayoutEffect(fade, [fade, closed, expanded]);
  useEffect(() => {
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [place]);

  const anyOpen = people.some((_, i) => !closed.has(i));
  const toggle = (i: number) => setClosed((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return <aside ref={panel} className="cub-panel" role="dialog" aria-modal="false" aria-labelledby="cub-panel-title">
    <div className="ph">
      <h2 id="cub-panel-title">{row.c} <span className="cnt2">{head}</span></h2>
      <button type="button" className="pall" onClick={() => setClosed(anyOpen ? new Set(people.map((_, i) => i)) : new Set())}>{anyOpen ? "Collapse all" : "Expand all"}</button>
      <button ref={close} type="button" className="x" aria-label="Close" onClick={onClose}>×</button>
    </div>
    <div ref={body} className={`pb${moreBelow ? " more-below" : ""}`} onScroll={fade}>
      {people.map(({ person: p, link, items }, i) => {
        const open = !closed.has(i);
        const more = items.length > CAP && !expanded.has(i);
        return <section key={`${p.n}-${i}`} className="pp" data-open={open ? "1" : "0"}>
          <div className="pp-h">
            <button type="button" className="tog" aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} ${p.n}`} onClick={() => toggle(i)}><Chevron /></button>
            {link ? <a className="pn" href={link} target="_blank" rel="noopener">{p.n}</a> : <span className="pn">{p.n}</span>}
            {p.champ ? <span className="chip champ">Champion</span> : null}
            {p.role ? <span className="role" title={p.role}>{p.role}</span> : null}
            <span className="pc">{items.length}</span>
          </div>
          <ul>{(more ? items.slice(0, CAP) : items).map((item, j) => <ItemRow key={j} item={item} />)}</ul>
          {more ? <button type="button" className="more" onClick={() => setExpanded((prev) => new Set(prev).add(i))}>Show {items.length - CAP} more</button> : null}
        </section>;
      })}
    </div>
  </aside>;
}
