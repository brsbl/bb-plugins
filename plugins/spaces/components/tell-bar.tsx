// The bar pinned under the list while selecting: one message, sent as you to every selected member. It names the
// threads it reached and offers Retry for any it didn't.
import { experimental_Icon as Icon } from "@get-bb/plugin-sdk/app";
import { useId, useRef, useState, type FormEvent } from "react";

import type { TellResult } from "../contract";
import { joinNames, plural } from "./model";
import { errorMessage, type SpacesCall } from "./rpc";
import { Button } from "./ui/button";

export interface TellTarget {
  id: string;
  title: string;
}

interface Outcome {
  message: string;
  sent: Array<TellTarget & { queued: boolean }>;
  failed: Array<TellTarget & { error: string | null }>;
}

interface TellBarProps {
  call: SpacesCall;
  targets: readonly TellTarget[];
  /** Called with the threads that got the message, so the list can clear and mark them. */
  onSent(threadIds: string[]): void;
}

export function TellBar({ call, targets, onSent }: TellBarProps) {
  const fieldId = useId();
  const hintId = useId();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const titles = useRef(new Map<string, string>());
  for (const target of targets) titles.current.set(target.id, target.title);
  const titleOf = (id: string) => titles.current.get(id) ?? "Untitled thread";

  const send = async (threadIds: string[], text: string, previous: Outcome | null) => {
    if (threadIds.length === 0 || !text.trim() || sending) return;
    setSending(true);
    let results: TellResult[];
    try {
      ({ results } = await call("tell", { threadIds, message: text }));
    } catch (error) {
      const reason = errorMessage(error);
      results = threadIds.map((threadId) => ({ threadId, ok: false, queued: false, error: reason }));
    }
    const reached = results.filter((result) => result.ok);
    const missed = results.filter((result) => !result.ok);
    setOutcome({
      message: text,
      sent: [
        ...(previous?.sent ?? []),
        ...reached.map((result) => ({ id: result.threadId, title: titleOf(result.threadId), queued: result.queued })),
      ],
      failed: missed.map((result) => ({ id: result.threadId, title: titleOf(result.threadId), error: result.error })),
    });
    setSending(false);
    if (reached.length > 0) {
      if (previous === null) setMessage("");
      onSent(reached.map((result) => result.threadId));
    }
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    void send(
      targets.map((target) => target.id),
      message.trim(),
      null,
    );
  };

  const queued = outcome?.sent.filter((target) => target.queued) ?? [];
  const canSend = targets.length > 0 && message.trim().length > 0 && !sending;

  return (
    <div className="shrink-0 border-t border-border bg-surface-recessed px-3.5 pb-3.5 pt-3">
      {outcome && outcome.sent.length > 0 ? (
        <div role="status" className="mb-2.5 text-xs text-foreground">
          <p className="m-0">
            Sent as you to {joinNames(outcome.sent.map((target) => target.title))}. No other thread was messaged.
          </p>
          {queued.length > 0 ? (
            <p className="m-0 mt-1 text-muted-foreground">
              {joinNames(queued.map((target) => target.title))} {queued.length === 1 ? "is" : "are"} running, so{" "}
              {queued.length === 1 ? "it gets" : "they get"} it when {queued.length === 1 ? "its" : "their"} turn ends.
            </p>
          ) : null}
        </div>
      ) : null}
      {outcome && outcome.failed.length > 0 ? (
        <div role="alert" className="mb-2.5 flex items-start gap-2 text-xs text-destructive-text">
          <Icon name="CircleX" className="mt-px size-3.5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="m-0">Couldn't send to {joinNames(outcome.failed.map((target) => target.title))}.</p>
            {outcome.failed.map((target) =>
              target.error ? (
                <p key={target.id} className="m-0 mt-0.5 text-muted-foreground">
                  {target.title}: {target.error}
                </p>
              ) : null,
            )}
          </div>
          <Button
            variant="outline"
            size="xs"
            disabled={sending}
            onClick={() =>
              void send(
                outcome.failed.map((target) => target.id),
                outcome.message,
                outcome,
              )
            }
          >
            Retry
          </Button>
        </div>
      ) : null}
      <form onSubmit={submit}>
        <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold">
          {targets.length > 0 ? `Tell ${plural(targets.length, "thread")}` : "Select threads to tell"}
        </label>
        <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-2 pl-2.5 focus-within:ring-1 focus-within:ring-ring">
          <textarea
            id={fieldId}
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends and Shift+Enter adds a line, as in bb's composer.
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (canSend) submit();
              }
            }}
            aria-describedby={hintId}
            placeholder="Write one message for every selected thread"
            className="min-h-14 min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" aria-label="Send to selected threads" disabled={!canSend}>
            <Icon name="ArrowUp" aria-hidden />
          </Button>
        </div>
        <p id={hintId} className="m-0 mt-1.5 text-xs text-muted-foreground">
          Each thread gets this as a message from you. A running thread gets it when its turn ends.
        </p>
      </form>
    </div>
  );
}
