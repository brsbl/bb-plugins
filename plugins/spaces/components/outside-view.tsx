// The Space tab in a thread that isn't in a Space: make its section a Space, start a new one, or move it into one.
import {
  experimental_Icon as Icon,
  experimental_useSidebarThreadActions as useSidebarThreadActions,
} from "@get-bb/plugin-sdk/app";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import type { PanelState } from "../contract";
import { plural } from "./model";
import { errorMessage, type SpacesCall } from "./rpc";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Menu } from "./ui/menu";

type OutsideState = Extract<PanelState, { kind: "outside" }>;

interface OutsideViewProps {
  call: SpacesCall;
  threadId: string;
  state: OutsideState;
  /** The thread's parent, when it is a subthread and bb's live list knows it. */
  parentThreadId: string | null;
  onChanged(): void;
}

function NewSpaceForm({ busy, onCancel, onCreate }: { busy: boolean; onCancel(): void; onCreate(name: string): void }) {
  const fieldId = useId();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() && !busy) onCreate(name.trim());
  };
  return (
    <form onSubmit={submit} className="grid w-full max-w-72 gap-2 text-left">
      <label htmlFor={fieldId} className="text-xs font-medium">
        Space name
      </label>
      <Input
        ref={inputRef}
        id={fieldId}
        value={name}
        maxLength={120}
        placeholder="e.g. Launch content"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          onCancel();
        }}
      />
      <div className="flex justify-end gap-1.5">
        <Button variant="ghost" size="xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="xs" disabled={!name.trim() || busy}>
          Create Space
        </Button>
      </div>
    </form>
  );
}

export function OutsideView({ call, threadId, state, parentThreadId, onChanged }: OutsideViewProps) {
  const actions = useSidebarThreadActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      onChanged();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  };

  const moveMenu = (
    <Menu
      label="Move this thread to a Space"
      text="Move this thread to a Space"
      variant="outline"
      align="start"
      disabled={busy || state.spaces.length === 0}
      disabledReason={state.spaces.length === 0 ? "You don't have any Spaces yet" : undefined}
      items={state.spaces.map((space) => ({
        id: space.sectionId,
        label: space.name,
        detail: plural(space.memberCount, "thread"),
        onSelect: () => void run(() => call("addThreads", { sectionId: space.sectionId, threadIds: [threadId] })),
      }))}
    />
  );

  let heading: string;
  let body: string;
  let controls: ReactNode;
  if (state.isSubthread) {
    heading = "Subthreads follow their parent";
    body = "This thread stays with its parent, so it's in a Space when its parent is. Open the parent to see or change its Space.";
    controls = parentThreadId ? (
      <Button variant="outline" size="xs" onClick={() => actions.open(parentThreadId)}>
        Open parent thread
      </Button>
    ) : null;
  } else if (state.section?.eligible) {
    const section = state.section;
    const makeSpace = () => void run(() => call("makeSpace", { sectionId: section.id }));
    heading = `${section.name} isn't a Space`;
    body = confirming
      ? `${section.name} has a Thread Organizer entry prompt. It pauses while ${section.name} is a Space and comes back if it stops being one.`
      : "Make it a Space to keep its threads here when they finish, see all of them in this tab, and coordinate them when you want.";
    controls = confirming ? (
      <div className="flex gap-1.5">
        <Button variant="ghost" size="xs" disabled={busy} onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button size="xs" disabled={busy} onClick={makeSpace}>
          Make it a Space
        </Button>
      </div>
    ) : (
      <>
        <Button
          size="xs"
          disabled={busy}
          onClick={() => (section.hasEntryPrompt ? setConfirming(true) : makeSpace())}
        >
          Make {section.name} a Space
        </Button>
        {moveMenu}
      </>
    );
  } else {
    heading = state.section ? `${state.section.name} can't be a Space` : "This thread isn't in a Space";
    body = state.section
      ? `${state.section.name} is an inbox, so it can't become a Space. Start a new Space with this thread, or move it into one you have.`
      : "Start a Space with this thread, or move it into one you have. A Space keeps related threads from any project together.";
    controls = naming ? (
      <NewSpaceForm
        busy={busy}
        onCancel={() => setNaming(false)}
        onCreate={(name) => void run(() => call("createSpace", { name, threadIds: [threadId] }))}
      />
    ) : (
      <>
        <Button size="xs" disabled={busy} onClick={() => setNaming(true)}>
          New Space
        </Button>
        {moveMenu}
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-8 text-center">
      <Icon name="Layers" className="size-6 text-muted-foreground" aria-hidden />
      <h2 className="m-0 text-[15px] font-semibold">{heading}</h2>
      <p className="m-0 max-w-72 text-sm text-muted-foreground">{body}</p>
      {controls ? <div className="flex flex-col items-center gap-2">{controls}</div> : null}
      {error ? (
        <p role="alert" className="m-0 max-w-72 text-xs text-destructive-text">
          {error}
        </p>
      ) : null}
    </div>
  );
}
