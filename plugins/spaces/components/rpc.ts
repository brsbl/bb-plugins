import { useRpc, type PluginRpcCallArgs } from "@get-bb/plugin-sdk/app";
import { useCallback, useRef } from "react";

import type { SpacesRpc } from "../contract";

/** `useRpc().call` for the Spaces contract with a stable identity, so effects can depend on it. */
export function useSpacesRpc() {
  const rpc = useRpc<SpacesRpc>();
  const current = useRef(rpc);
  current.current = rpc;
  return useCallback(
    <Method extends Extract<keyof SpacesRpc, string>>(method: Method, ...args: PluginRpcCallArgs<SpacesRpc[Method]>) =>
      current.current.call(method, ...args),
    [],
  );
}

export type SpacesCall = ReturnType<typeof useSpacesRpc>;

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";
}
