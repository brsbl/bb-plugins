import { useCallback, useRef } from "react";
import { useRpc } from "@get-bb/plugin-sdk/app";
import type { RpcMethods } from "../contracts.js";

export type CoordinatorStatus = ReturnType<RpcMethods["status"]>;

export type CoordinatorCall = <Method extends keyof RpcMethods>(
  method: Method,
  input: Parameters<RpcMethods[Method]>[0],
) => Promise<ReturnType<RpcMethods[Method]>>;

/** `RpcMethods` is a plain function map, so type `useRpc().call` against it here. */
export function useCoordinatorRpc(): CoordinatorCall {
  const rpc = useRpc();
  const current = useRef(rpc);
  current.current = rpc;
  return useCallback(
    <Method extends keyof RpcMethods>(method: Method, input: Parameters<RpcMethods[Method]>[0]) =>
      current.current.call(method, input) as Promise<ReturnType<RpcMethods[Method]>>,
    [],
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Try again.";
}
