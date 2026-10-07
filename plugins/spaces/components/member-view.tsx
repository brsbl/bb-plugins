// The Space tab inside a member: every member grouped by what it needs from you, with peek, open, split, Tell, and
// the Space's own actions.
import {
  experimental_Icon as Icon,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
  useComposer,
  type PluginSidebarThread,
} from "@get-bb/plugin-sdk/app";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import type { SpaceSnapshot } from "../contract";
import { IDLE_PREVIEW_COUNT, MEMBER_GROUP_LABELS, MENTION_PROVIDER_ID } from "../shared";
import { AddThreadsDialog, type AddedThreads } from "./add-threads-dialog";
import { MemberCard, SelectableCard } from "./member-card";
import {
  joinNames,
  keepLayout,
  layoutGroups,
  mergeMembers,
  plural,
  spaceSubline,
  type GroupLayout,
  type MemberCardModel,
} from "./model";
import { requestSpaceTab } from "./open-tab-handoff";
import { errorMessage, type SpacesCall } from "./rpc";
import { TellBar } from "./tell-bar";
import { Button, Kbd } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { Menu } from "./ui/menu";

/** Re-render once a minute so card ages stay current. */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function addedNote({ added, skipped, fromSections }: AddedThreads): string | null {
  const parts: string[] = [];
  if (added > 0) {
    parts.push(
      `Moved from ${joinNames(fromSections)}. ${added === 1 ? "It stays here when it finishes." : "They stay here when they finish."}`,
    );
  }
  if (skipped > 0) {
    parts.push(`${plural(skipped, "subthread")} stayed with ${skipped === 1 ? "its parent" : "their parents"}.`);
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

function RenameForm({ initial, onCancel, onSave }: { initial: string; onCancel(): void; onSave(name: string): Promise<void> }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = value.trim();
    if (!name || busy) return;
    if (name === initial) {
      onCancel();
      return;
    }
    setBusy(true);
    try {
      await onSave(name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1.5">
      <Input
        ref={inputRef}
        inputSize="sm"
        value={value}
        maxLength={120}
        aria-label="Space name"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }}
      />
      <Button type="submit" size="xs" disabled={!value.trim() || busy}>
        Save
      </Button>
      <Button variant="ghost" size="xs" onClick={onCancel}>
        Cancel
      </Button>
    </form>
  );
}

function KeyboardHints() {
  return (
    <p className="m-0 flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
      <span>
        <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
      </span>
      <span>
        <Kbd>Space</Kbd> peek
      </span>
      <span>
        <Kbd>↵</Kbd> open
      </span>
      <span>
        <Kbd>S</Kbd> split
      </span>
    </p>
  );
}

interface MemberViewProps {
  call: SpacesCall;
  threadId: string;
  space: SpaceSnapshot;
  /** bb's live sidebar threads, or null while that list isn't ready. */
  live: readonly PluginSidebarThread[] | null;
  onChanged(): void;
}

export function MemberView({ call, threadId, space, live, onChanged }: MemberViewProps) {
  const actions = useSidebarThreadActions();
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const composer = useComposer();
  const now = useNow();
  const ids = useId();
  const stopTitleId = `${ids}-stop-title`;
  const stopBodyId = `${ids}-stop-body`;

  const [peekId, setPeekId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [messaged, setMessaged] = useState<ReadonlySet<string>>(new Set());
  const [idleOpen, setIdleOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cards = useMemo(
    () => mergeMembers({ sectionId: space.sectionId, members: space.members, live, currentThreadId: threadId }),
    [space.sectionId, space.members, live, threadId],
  );
  const byId = useMemo(() => new Map(cards.map((card) => [card.id, card] as const)), [cards]);
  const liveLayout = useMemo(() => layoutGroups(cards), [cards]);

  // While a peek is open or you're selecting, cards keep their place; they regroup when you finish.
  const frozenLayout = useRef<GroupLayout[] | null>(null);
  if (peekId === null && !selecting) frozenLayout.current = null;
  else if (frozenLayout.current === null) frozenLayout.current = liveLayout;
  const layout = frozenLayout.current ? keepLayout(frozenLayout.current, byId) : liveLayout;

  const peeked = peekId === null ? undefined : byId.get(peekId);
  const peekedUnread = peeked?.isUnread ?? false;
  useEffect(() => {
    if (peekId !== null && !byId.has(peekId)) setPeekId(null);
  }, [peekId, byId]);
  // Peeking marks the thread read, the same as opening it, including output that arrives while the peek is open.
  useEffect(() => {
    if (peekId !== null && peekedUnread) void actionsRef.current.setRead(peekId, true).catch(() => undefined);
  }, [peekId, peekedUnread]);

  const open = (id: string) => {
    setPeekId(null);
    requestSpaceTab(id);
    actionsRef.current.open(id);
  };
  const openInSplit = (id: string) => {
    setPeekId(null);
    actionsRef.current.open(id, { split: true });
  };

  const startSelecting = () => {
    setPeekId(null);
    setSelected(new Set());
    setMessaged(new Set());
    setSelecting(true);
  };
  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const unselectableReason = (card: MemberCardModel): string | null =>
    card.isCurrent ? "You are in this thread" : card.archived ? "Archived threads can't be told" : null;
  const toggleSelected = (id: string) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ordered = layout.flatMap((entry) => entry.ids);
  const tellTargets = ordered
    .map((id) => byId.get(id))
    .filter((card): card is MemberCardModel => card !== undefined && selected.has(card.id) && !unselectableReason(card))
    .map((card) => ({ id: card.id, title: card.title }));

  const mention = () => {
    composer.insertMention({ provider: MENTION_PROVIDER_ID, id: space.sectionId, label: space.name });
    composer.focus();
  };

  const rename = async (name: string) => {
    try {
      await call("renameSpace", { sectionId: space.sectionId, name });
      setRenaming(false);
      setError(null);
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    }
  };

  const stop = async () => {
    try {
      await call("stopSpace", { sectionId: space.sectionId });
      setConfirmingStop(false);
      onChanged();
    } catch (reason) {
      setConfirmingStop(false);
      setError(errorMessage(reason));
    }
  };

  const threadCount = cards.filter((card) => !card.archived).length;

  const renderCard = (card: MemberCardModel) =>
    selecting ? (
      <SelectableCard
        key={card.id}
        card={card}
        now={now}
        checked={selected.has(card.id)}
        disabledReason={unselectableReason(card)}
        messaged={messaged.has(card.id)}
        onToggle={toggleSelected}
      />
    ) : (
      <MemberCard
        key={card.id}
        card={card}
        now={now}
        peeked={peekId === card.id}
        onTogglePeek={(id) => setPeekId((current) => (current === id ? null : id))}
        onClosePeek={() => setPeekId(null)}
        onOpen={open}
        onSplit={openInSplit}
      />
    );

  const cardsOf = (entryIds: readonly string[]) =>
    entryIds.map((id) => byId.get(id)).filter((card): card is MemberCardModel => card !== undefined);

  const renderGroup = (entry: GroupLayout) => {
    const headingId = `${ids}-group-${entry.group}`;
    if (entry.group === "archived") {
      return (
        <section key={entry.group} aria-labelledby={headingId} className="mt-2">
          <button
            id={headingId}
            type="button"
            aria-expanded={archivedOpen}
            onClick={() => setArchivedOpen((current) => !current)}
            className="flex min-h-7 w-full cursor-pointer items-center gap-1.5 rounded-md px-2 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name={archivedOpen ? "ChevronDown" : "ChevronRight"} className="size-3.5 shrink-0" aria-hidden />
            {`${MEMBER_GROUP_LABELS.archived} (${entry.ids.length})`}
          </button>
          {archivedOpen ? <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{cardsOf(entry.ids).map(renderCard)}</ul> : null}
        </section>
      );
    }
    const folded = entry.group === "idle" && !idleOpen && entry.ids.length > IDLE_PREVIEW_COUNT;
    const shown = folded ? entry.ids.slice(0, IDLE_PREVIEW_COUNT) : entry.ids;
    return (
      <section key={entry.group} aria-labelledby={headingId}>
        <h3 id={headingId} className="m-0 flex items-baseline gap-1.5 px-2 pb-1 pt-3 text-xs font-medium text-muted-foreground">
          {MEMBER_GROUP_LABELS[entry.group]} <span className="font-normal text-subtle-foreground">{entry.ids.length}</span>
        </h3>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{cardsOf(shown).map(renderCard)}</ul>
        {entry.group === "idle" && entry.ids.length > IDLE_PREVIEW_COUNT ? (
          <button
            type="button"
            aria-expanded={idleOpen}
            onClick={() => {
              if (idleOpen && peekId !== null && entry.ids.indexOf(peekId) >= IDLE_PREVIEW_COUNT) setPeekId(null);
              setIdleOpen((current) => !current);
            }}
            className="mt-0.5 flex min-h-7 w-full cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-left text-xs text-muted-foreground outline-none hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name={idleOpen ? "ChevronDown" : "ChevronRight"} className="size-3.5 shrink-0" aria-hidden />
            {idleOpen ? "Show fewer" : `${entry.ids.length - IDLE_PREVIEW_COUNT} more idle`}
          </button>
        ) : null}
      </section>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex min-h-11 items-center gap-2 pb-0.5 pl-4 pr-2 pt-3">
        <Icon name="Layers" className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {renaming ? (
          <RenameForm initial={space.name} onCancel={() => setRenaming(false)} onSave={rename} />
        ) : (
          <h2 className="m-0 min-w-0 flex-1 truncate text-[15px] font-semibold leading-6">{space.name}</h2>
        )}
        {renaming ? null : selecting ? (
          <Button variant="outline" size="xs" onClick={stopSelecting}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="icon" aria-label={`Add threads to ${space.name}`} onClick={() => setPickerOpen(true)}>
              <Icon name="Plus" aria-hidden />
            </Button>
            <Menu
              label={`${space.name} options`}
              icon="MoreHorizontal"
              items={[
                { id: "rename", label: "Rename", onSelect: () => setRenaming(true) },
                { id: "select", label: "Select threads", onSelect: startSelecting },
                { id: "mention", label: "Mention in composer", onSelect: mention },
                { id: "stop", label: "Stop being a Space", onSelect: () => setConfirmingStop(true) },
              ]}
            />
          </>
        )}
      </header>
      <p className="m-0 pb-1.5 pl-10 pr-4 text-xs text-muted-foreground" aria-live={selecting ? "polite" : undefined}>
        {selecting ? `${tellTargets.length} selected` : spaceSubline(threadCount, space.projects)}
      </p>
      {space.organizer === "outdated" ? (
        <p role="note" className="mx-3 mb-1.5 mt-0 flex items-start gap-2 rounded-md bg-surface-attention px-2.5 py-1.5 text-xs">
          <Icon name="AlertTriangle" className="mt-px size-3.5 shrink-0 text-warning-text" aria-hidden />
          <span>Thread Organizer will still move finished threads to Agent Inbox. Update Thread Organizer.</span>
        </p>
      ) : null}
      {note ? (
        <div role="status" className="mx-3 mb-1.5 flex items-start gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs">
          <span className="min-w-0 flex-1 pt-0.5">{note}</span>
          <Button variant="ghost" size="icon" className="-my-1 -mr-1.5" aria-label="Dismiss" onClick={() => setNote(null)}>
            <Icon name="X" aria-hidden />
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mx-4 mb-1.5 mt-0 text-xs text-destructive-text">
          {error}
        </p>
      ) : null}
      <div data-space-list="" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {layout.length === 0 ? (
          <p className="m-0 px-2 py-6 text-center text-sm text-muted-foreground">
            No threads in this Space yet. Add some with +, or drag threads onto its heading in the sidebar.
          </p>
        ) : (
          layout.map(renderGroup)
        )}
      </div>
      {selecting ? (
        <TellBar
          call={call}
          targets={tellTargets}
          onSent={(sentIds) => {
            setSelected((previous) => new Set([...previous].filter((id) => !sentIds.includes(id))));
            setMessaged((previous) => new Set([...previous, ...sentIds]));
          }}
        />
      ) : (
        <KeyboardHints />
      )}
      {pickerOpen ? (
        <AddThreadsDialog
          call={call}
          sectionId={space.sectionId}
          spaceName={space.name}
          onClose={() => setPickerOpen(false)}
          onAdded={(result) => {
            setPickerOpen(false);
            setNote(addedNote(result));
            onChanged();
          }}
        />
      ) : null}
      {confirmingStop ? (
        <Dialog role="alertdialog" labelledBy={stopTitleId} describedBy={stopBodyId} onClose={() => setConfirmingStop(false)}>
          <div className="grid gap-2 px-4 pb-3 pt-3.5">
            <h2 id={stopTitleId} className="m-0 text-sm font-semibold">
              Stop {space.name} being a Space?
            </h2>
            <p id={stopBodyId} className="m-0 text-sm text-muted-foreground">
              The section and its threads stay where they are. Thread Organizer's normal rules apply again, so a member
              that is unread moves to Agent Inbox.
            </p>
          </div>
          <div className="flex justify-end gap-1.5 border-t border-border px-3 py-2.5">
            <Button variant="outline" size="xs" onClick={() => setConfirmingStop(false)}>
              Cancel
            </Button>
            <Button size="xs" onClick={() => void stop()}>
              Stop being a Space
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
