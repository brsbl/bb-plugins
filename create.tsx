import { useCallback, useEffect, useState } from "react";
import { useBbNavigate, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";

import type { DailyScene, ambientRpcContract } from "./rpc.js";
import { Section, Switch, TextButton } from "./widgets.js";

function hourLabel(hour: number): string {
  return new Date(2000, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" });
}

export function DailySceneRow() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const [daily, setDaily] = useState<DailyScene | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setDaily(await rpc.call("daily"));
  }, [rpc]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtime("daily", () => {
    void refresh();
  });

  if (!daily) return null;

  const update = async (next: { enabled?: boolean; hour?: number }) => {
    const previous = daily;
    setDaily({ ...daily, ...next });
    setError(null);
    try {
      setDaily(
        await rpc.call("setDaily", {
          ...next,
          ...(next.enabled ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}),
        }),
      );
    } catch (caught) {
      setDaily(previous);
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const next =
    daily.enabled && daily.nextRunAt
      ? `Next ${new Date(daily.nextRunAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}, in Automations`
      : "An agent paints a new scene each day";

  return (
    <div className="space-y-1">
      <div className="flex h-6 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground" title={next}>
        <span className="font-medium text-foreground/70">Daily scene</span>
        <select
          aria-label="Daily scene hour"
          value={daily.hour}
          onChange={(event) => void update({ hour: Number(event.currentTarget.value) })}
          className="min-w-0 cursor-pointer appearance-none rounded bg-transparent px-0.5 text-xs text-foreground underline decoration-foreground/30 underline-offset-2 outline-none"
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <option key={hour} value={hour}>
              {hourLabel(hour)}
            </option>
          ))}
        </select>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <Switch
            checked={daily.enabled}
            label="New scene every morning"
            onChange={(enabled) => void update({ enabled })}
          />
        </span>
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}

export function PaintRequestRow() {
  const rpc = useRpc<typeof ambientRpcContract>();
  const navigate = useBbNavigate();
  const [request, setRequest] = useState("");
  const [painting, setPainting] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const text = request.trim();
    if (text.length < 3 || painting) return;
    setPainting(true);
    setError(null);
    try {
      setThreadId((await rpc.call("paintRequest", { request: text })).threadId);
      setRequest("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPainting(false);
    }
  };

  return (
    <Section title="Create a scene">
      <form
        className="flex h-7 items-center gap-1 rounded-md bg-foreground/5 pr-1 pl-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          aria-label="Describe a scene for an agent to create"
          value={request}
          maxLength={400}
          placeholder="California poppies, impressionist, in the wind"
          onChange={(event) => setRequest(event.currentTarget.value)}
          className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          aria-label="Create this scene"
          title="Create this scene"
          disabled={painting || request.trim().length < 3}
          className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-state-hover hover:text-foreground disabled:opacity-40"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        </button>
      </form>
      {threadId && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>An agent is creating it in a new thread.</span>
          <TextButton onClick={() => navigate.toThread(threadId)}>Open</TextButton>
        </div>
      )}
      {error && <div className="text-xs text-destructive">{error}</div>}
    </Section>
  );
}
