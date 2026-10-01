import { useCallback, useEffect, useRef, useState } from "react";
import { useRealtime, useRealtimeConnectionState, useRpc } from "@get-bb/plugin-sdk/app";
import { FolderArt } from "../art";
import { useDesktopEnabled } from "../enabled";
import type { rpcContract } from "../server";
import { PLUGIN_SCOPE } from "../slots";

/** Shown next to a thread's title in bb: the Desktop folders the thread is filed in. */
export function ThreadFolderChip({ threadId }: { threadId: string }) {
  return useDesktopEnabled() ? <FolderChip threadId={threadId} /> : null;
}

/** Asks only for this thread's folders, and again when folders change, rather than loading the whole desktop. */
function FolderChip({ threadId }: { threadId: string }) {
  const rpc = useRpc<typeof rpcContract>();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [folders, setFolders] = useState<{ threadId: string; names: string[] } | null>(null);
  const request = useRef(0);

  const load = useCallback(() => {
    const current = ++request.current;
    void rpcRef.current.call("threadFolders", { threadId }).then(
      (result) => {
        if (current === request.current) setFolders({ threadId, names: result.folders.map((folder) => folder.name) });
      },
      () => undefined,
    );
  }, [threadId]);

  useEffect(load, [load]);
  useRealtime("changed", (payload) => {
    if ((payload as { scope?: unknown } | null)?.scope === "folders") load();
  });
  const connection = useRealtimeConnectionState();
  const previousConnection = useRef(connection);
  useEffect(() => {
    if (connection === "connected" && previousConnection.current !== "connected") load();
    previousConnection.current = connection;
  }, [connection, load]);

  const names = folders?.threadId === threadId ? folders.names : [];
  const [first] = names;
  if (first === undefined) return null;
  const label = `In Desktop ${names.length === 1 ? "folder" : "folders"}: ${names.join(", ")}`;
  return (
    <span className="bbd-root bbd-folder-chip" {...PLUGIN_SCOPE} title={label} aria-label={label}>
      <FolderArt kind="section" size={16} />
      <span className="truncate">{first}</span>
      {names.length > 1 ? <span className="text-muted-foreground">+{names.length - 1}</span> : null}
    </span>
  );
}
