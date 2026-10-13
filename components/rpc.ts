import { useCallback, useRef } from "react";
import { useRpc, type PluginRpcCallArgs } from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "../server.js";

type Contract = typeof rpcContract;

/** `useRpc().call` with a stable identity, so effects can depend on it. */
export function useCoordinatorRpc() {
  const rpc = useRpc<Contract>();
  const current = useRef(rpc);
  current.current = rpc;
  return useCallback(
    <Method extends Extract<keyof Contract, string>>(method: Method, ...args: PluginRpcCallArgs<Contract[Method]>) =>
      current.current.call(method, ...args),
    [],
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";
}
