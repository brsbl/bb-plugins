import { useCallback, useEffect, useRef, useState } from "react";

import {
  definePluginApp,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
} from "@bb/plugin-sdk/app";

import type { ListFoldersResult, rpcContract } from "./server";

function MossThreadFolders({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const connectionState = useRealtimeConnectionState();
  const previousConnectionState = useRef(connectionState);
  const hasConnected = useRef(connectionState !== "connecting");
  const [data, setData] = useState<ListFoldersResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await rpc.call("openThread", { threadId });
      setData(await rpc.call("listFolders"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read Moss folders.");
    } finally {
      setIsLoading(false);
    }
  }, [rpc, threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime("folders-changed", () => {
    void load();
  });

  useEffect(() => {
    const previous = previousConnectionState.current;
    previousConnectionState.current = connectionState;
    if (connectionState !== "connected" || previous === "connected") return;
    if (hasConnected.current) void load();
    hasConnected.current = true;
  }, [connectionState, load]);

  return (
    <main className="h-full overflow-y-auto p-4 md:p-5">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Default Moss workspace
              </p>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {data?.root ?? "~/Moss/Notes/bb Threads"}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void load()}
            >
              Refresh
            </button>
          </div>
        </section>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : isLoading && data === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Reading Moss folders…
          </p>
        ) : data &&
          data.folders.active.length === 0 &&
          data.folders.archived.length === 0 &&
          data.folders.deleted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No bb thread folders yet.
          </p>
        ) : (
          <div className="space-y-4">
            {data &&
              Object.entries(data.folders).map(([state, folders]) =>
                folders.length > 0 ? (
                  <section key={state} className="space-y-2">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {state}
                    </h2>
                    <ul aria-label={`${state} bb thread folders`} className="space-y-2">
                      {folders.map((folder) => (
                        <li key={folder}>
                          <div className="rounded-lg border border-border bg-card p-4">
                            <span className="block font-mono text-sm text-foreground">
                              {folder}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null,
              )}
          </div>
        )}
      </div>
    </main>
  );
}

export default definePluginApp((app) => {
  app.slots.threadPanelAction({
    id: "moss-notes",
    title: "Moss Notes",
    icon: "Folder",
    layout: "padded",
    component: MossThreadFolders,
  });
});
