import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { definePluginApp, experimental_Icon as Icon, useComposer } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "./components/ui/popover";
import { categories, categoryEmojis, emojis, nativeEmoji, readPreferences, searchEmojis, storageKey, tones, toneSamples, type Emoji, type Preferences } from "./emojis";

import { insertedColon } from "./trigger";

const preferencesEvent = "bb:emoji-picker:preferences-changed";

function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);
  useEffect(() => {
    const sync = () => setPreferences(readPreferences());
    window.addEventListener("storage", sync);
    window.addEventListener(preferencesEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(preferencesEvent, sync);
    };
  }, []);
  function update(change: (current: Preferences) => Preferences) {
    const next = change(preferences);
    setPreferences(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(preferencesEvent));
    } catch {
      // Private browsing or a full storage quota must not prevent picking.
    }
  }
  return { preferences, update };
}

export function EmojiPicker({ onSelect }: { onSelect: (value: string) => void }) {
  const { preferences, update } = usePreferences();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("people");
  const [active, setActive] = useState<Emoji | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [focusId, setFocusId] = useState("");
  const searching = query.trim().length > 0;
  const results = useMemo(() => searching ? searchEmojis(query) : category === "recent" ? preferences.recent.map((id) => emojis[id]) : categoryEmojis(category), [query, searching, category, preferences.recent]);
  const currentFocusId = results.some((emoji) => emoji.id === focusId) ? focusId : results[0]?.id;
  const heading = searching ? "Search results" : category === "recent" ? "Recently used" : categories.find((item) => item.id === category)?.label;

  useEffect(() => {
    grid.current?.scrollTo?.({ top: 0 });
    setActive(null);
    setStatus("");
  }, [query, category]);

  function pick(emoji: Emoji) {
    if (busyRef.current) return;
    const value = nativeEmoji(emoji, preferences.tone);
    busyRef.current = true;
    setBusy(true);
    try {
      onSelect(value);
      update((current) => ({ ...current, recent: [emoji.id, ...current.recent.filter((id) => id !== emoji.id)].slice(0, 24) }));

    } catch {
      setStatus("The draft changed. Close this picker and type : again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const columns = grid.current ? getComputedStyle(grid.current).gridTemplateColumns.split(" ").length : 8;
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns, Home: -index, End: results.length - 1 - index };
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(results.length - 1, index + offsets[event.key]));
    grid.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }

  return (
    <section aria-label="Emoji picker" className="flex min-h-0 w-full flex-col text-foreground">
      <div className="flex items-center gap-2 px-3 pb-3 pt-3">
        <div className="relative min-w-0 flex-1">
          <Icon name="Search" aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input ref={search} value={query} aria-label="Search emojis" placeholder="Search emojis…" className="pl-9 pr-8" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" && results.length) { event.preventDefault(); grid.current?.querySelector<HTMLButtonElement>("button")?.focus(); }
            if (event.key === "Enter" && searching && results[0]) { event.preventDefault(); void pick(results[0]); }
            if (event.key === "Escape" && query) { event.preventDefault(); event.stopPropagation(); setQuery(""); }
          }} />
          {query && <Button type="button" variant="ghost" size="icon" aria-label="Clear search" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" onClick={() => { setQuery(""); search.current?.focus(); }}><Icon name="X" aria-hidden="true" className="size-3" /></Button>}
        </div>
      </div>
      <div role="group" aria-label="Emoji categories" className="flex justify-between gap-0.5 border-b border-border px-3 pb-2">
        {[{ id: "recent", label: "Recently used", symbol: null }, ...categories].map((item) => (
          <span key={item.id} title={item.label} className="min-w-0">
            <Button type="button" variant="ghost" size="icon" aria-label={item.label} aria-pressed={!searching && category === item.id} className="size-8 text-muted-foreground" onClick={() => { setCategory(item.id); setQuery(""); }}>{item.symbol ? <span aria-hidden="true" className="text-lg">{item.symbol}</span> : <Icon name="Clock" aria-hidden="true" className="size-4" />}</Button>
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
        <h2 className="font-medium text-foreground">{heading}</h2>
        <span aria-live="polite">{results.length.toLocaleString()} {results.length === 1 ? "emoji" : "emojis"}</span>
      </div>
      {results.length ? (
        <div ref={grid} role="group" aria-label={heading} className="grid h-72 grid-cols-8 content-start gap-1 overflow-y-auto overscroll-contain px-3 pb-3" style={{ maxHeight: "40dvh" }}>
          {results.map((emoji, index) => (
            <button key={emoji.id} type="button" tabIndex={emoji.id === currentFocusId ? 0 : -1} aria-label={emoji.name} aria-disabled={busy} title={`${emoji.name} · :${emoji.id}:`} className="flex aspect-square min-h-8 cursor-pointer items-center justify-center rounded-md text-2xl leading-none hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onMouseEnter={() => setActive(emoji)} onFocus={() => { setActive(emoji); setFocusId(emoji.id); }} onKeyDown={(event) => move(event, index)} onClick={() => void pick(emoji)}>{nativeEmoji(emoji, preferences.tone)}</button>
          ))}
        </div>
      ) : (
        <div className="flex h-72 flex-col items-center justify-center gap-2 px-5 text-center text-sm text-muted-foreground" style={{ maxHeight: "40dvh" }}>
          <Icon name={searching ? "Search" : "Clock"} aria-hidden="true" className="mb-1 size-6" />
          <p className="font-medium text-foreground">{searching ? "No emojis found" : "Your emojis will appear here"}</p>
          <p>{searching ? "Try a name like “smile” or “rocket”." : "Pick an emoji to keep it close for next time."}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center text-2xl">{active ? nativeEmoji(active, preferences.tone) : "✨"}</span>
          <div className="min-w-0 text-xs"><p className="truncate font-medium">{active?.name ?? "Click an emoji to insert"}</p><p className="truncate text-muted-foreground">{active ? `:${active.id}:` : "Find just the right expression"}</p></div>
        </div>
        <label className="relative shrink-0 rounded-md border border-border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring" title="Skin tone">
          <span aria-hidden="true" className="text-xl">{toneSamples[preferences.tone]}</span>
          <select aria-label="Skin tone" value={preferences.tone} className="absolute inset-0 w-full cursor-pointer opacity-0" onChange={(event) => { const tone = Number(event.target.value); update((current) => ({ ...current, tone })); }}>{tones.map((tone, index) => <option key={tone} value={index}>{tone}</option>)}</select>
        </label>
      </div>
      <div className="min-h-7 px-4 pb-2 text-xs text-muted-foreground" role="status" aria-live="polite">{status || "↑ ↓ ← → to browse · Enter to select"}</div>
    </section>
  );
}

export function ComposerEmojiPicker() {
  const composer = useComposer();
  const scope = JSON.stringify(composer.scope);
  const previous = useRef({ scope, text: composer.text });
  const [trigger, setTrigger] = useState<{ scope: string; text: string; index: number } | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = { scope, text: composer.text };
    if (before.scope !== scope) { setTrigger(null); return; }
    if (before.text === composer.text) return;
    const index = insertedColon(before.text, composer.text);
    setTrigger(index === null ? null : { scope, text: composer.text, index });
  }, [composer.text, scope]);

  // Never apply a saved replacement to a different scope or a changed draft.
  const open = !!trigger && trigger.scope === scope && trigger.text === composer.text;
  return (
    <Popover open={open} onOpenChange={(open) => { if (!open) setTrigger(null); }}>
      <PopoverAnchor asChild><span aria-hidden="true" className="pointer-events-none absolute h-0 w-0" /></PopoverAnchor>
      <PopoverContent aria-label="Insert emoji" side="top" align="start" className="w-96 max-w-[calc(100vw-2rem)] p-0" mobileTitle="Insert emoji" onMobileContentAnimationEnd={(isOpen) => { if (!isOpen) composer.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); composer.focus(); }}>
        <EmojiPicker key={open ? "open" : "closed"} onSelect={(value) => {
          if (!trigger || trigger.scope !== JSON.stringify(composer.scope)) throw new Error("Draft changed");
          composer.updateText((current) => {
            if (current !== trigger.text) throw new Error("Draft changed");
            return current.slice(0, trigger.index) + value + current.slice(trigger.index + 1);
          });
          setTrigger(null);
          composer.focus();
        }} />
      </PopoverContent>
    </Popover>
  );
}

export default definePluginApp((app) => {
  app.composer.customize({ id: "emoji-picker", banners: [{ id: "colon-picker", chrome: "bare", component: ComposerEmojiPicker }] });
});
