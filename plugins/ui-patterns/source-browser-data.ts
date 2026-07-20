import { useEffect, useState } from "react";
import { useRpc } from "@bb/plugin-sdk/app";
import type { sourceBrowserRpcContract } from "./providers/rpc.js";
import type { SourceBrowserSnapshot } from "./providers/source-browser.js";

export interface SourceBrowserDataState {
  snapshot: SourceBrowserSnapshot | null;
  error: string | null;
}

/** Reads the backend's validated, offline provider snapshot through bb RPC. */
export function useSourceBrowserData(): SourceBrowserDataState {
  const rpc = useRpc<typeof sourceBrowserRpcContract>();
  const [state, setState] = useState<SourceBrowserDataState>({
    snapshot: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    void rpc.call("getSourceBrowserSnapshot", null).then(
      (snapshot) => {
        if (!cancelled) setState({ snapshot, error: null });
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            snapshot: null,
            error: error instanceof Error ? error.message : "Unable to load source records.",
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [rpc]);

  return state;
}
