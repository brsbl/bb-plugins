// The Add threads picker: search active threads in every project, see where each one sits now (adding moves it), and
// move the checked ones into the Space. Nothing starts checked.
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { useEffect, useId, useState } from "react";

import type { Candidate } from "../contract";
import { plural } from "./model";
import { errorMessage, type SpacesCall } from "./rpc";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";

export const SEARCH_DEBOUNCE_MS = 200;

/** The loose Threads list's name, for a candidate with no section. */
const LOOSE_SECTION_NAME = "Threads";

export interface AddedThreads {
  added: number;
  skipped: number;
  /** Where the added threads came from, in the order they were picked. */
  fromSections: string[];
}

interface AddThreadsDialogProps {
  call: SpacesCall;
  sectionId: string;
  spaceName: string;
  onClose(): void;
  onAdded(result: AddedThreads): void;
}

export function AddThreadsDialog({ call, sectionId, spaceName, onClose, onAdded }: AddThreadsDialogProps) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [lists, setLists] = useState<{ suggested: Candidate[]; others: Candidate[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<ReadonlyMap<string, Candidate>>(new Map());
  const [busy, setBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let current = true;
    call("candidates", search ? { sectionId, query: search } : { sectionId }).then(
      (next) => {
        if (!current) return;
        setLists(next);
        setLoadError(null);
      },
      (error: unknown) => {
        if (current) setLoadError(errorMessage(error));
      },
    );
    return () => {
      current = false;
    };
  }, [call, sectionId, search]);

  const toggle = (candidate: Candidate) => {
    setPicked((previous) => {
      const next = new Map(previous);
      if (next.has(candidate.id)) next.delete(candidate.id);
      else next.set(candidate.id, candidate);
      return next;
    });
  };

  const add = async () => {
    if (picked.size === 0 || busy) return;
    setBusy(true);
    setAddError(null);
    try {
      const { added, skipped } = await call("addThreads", { sectionId, threadIds: [...picked.keys()] });
      const fromSections = [
        ...new Set(added.map((id) => picked.get(id)?.sectionName ?? LOOSE_SECTION_NAME)),
      ];
      onAdded({ added: added.length, skipped: skipped.length, fromSections });
    } catch (error) {
      setAddError(errorMessage(error));
      setBusy(false);
    }
  };

  const row = (candidate: Candidate) => (
    <li key={candidate.id}>
      <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 hover:bg-state-hover">
        <input
          type="checkbox"
          checked={picked.has(candidate.id)}
          onChange={() => toggle(candidate)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{candidate.title || "Untitled thread"}</span>
          <span className="block text-xs text-muted-foreground">
            {[candidate.sectionName ?? LOOSE_SECTION_NAME, candidate.projectName, candidate.reason]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </label>
    </li>
  );

  const group = (heading: string, candidates: readonly Candidate[]) =>
    candidates.length === 0 ? null : (
      <section aria-label={heading}>
        <h3 className="m-0 px-2 pb-1 pt-2.5 text-xs font-medium text-muted-foreground">{heading}</h3>
        <ul className="m-0 list-none p-0">{candidates.map(row)}</ul>
      </section>
    );

  const empty = lists !== null && lists.suggested.length === 0 && lists.others.length === 0;

  return (
    <Dialog labelledBy={titleId} onClose={onClose}>
      <h2 id={titleId} className="m-0 px-4 pb-2 pt-3.5 text-sm font-semibold">
        Add threads to {spaceName}
      </h2>
      <label className="mx-3 flex h-8 items-center gap-2 rounded-md border border-input px-2.5 focus-within:ring-1 focus-within:ring-ring">
        <Icon name="Search" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          data-autofocus=""
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search threads in every project"
          aria-label="Search threads"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <div className="min-h-24 flex-1 overflow-y-auto px-1.5 py-1">
        {loadError ? (
          <p role="alert" className="m-0 px-2 py-3 text-xs text-destructive-text">
            {loadError}
          </p>
        ) : lists === null ? (
          <p className="m-0 px-2 py-3 text-sm text-muted-foreground">Loading…</p>
        ) : empty ? (
          <p className="m-0 px-2 py-3 text-sm text-muted-foreground">
            {search ? "No threads match." : "No other active threads."}
          </p>
        ) : (
          <>
            {group("Talked with this Space", lists.suggested)}
            {group("Other threads", lists.others)}
          </>
        )}
      </div>
      {addError ? (
        <p role="alert" className="m-0 px-4 pb-1 text-xs text-destructive-text">
          {addError}
        </p>
      ) : null}
      <div className="flex shrink-0 justify-end gap-1.5 border-t border-border px-3 py-2.5">
        <Button variant="outline" size="xs" onClick={onClose}>
          Cancel
        </Button>
        <Button size="xs" disabled={picked.size === 0 || busy} onClick={() => void add()}>
          {picked.size > 0 ? `Add ${plural(picked.size, "thread")}` : "Add threads"}
        </Button>
      </div>
    </Dialog>
  );
}
