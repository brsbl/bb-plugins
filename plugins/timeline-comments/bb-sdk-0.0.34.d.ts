import type {
  BbNavigate,
  PluginRealtimeConnectionState,
  PluginRpcClient,
} from "@bb/plugin-sdk/app";

interface TimelineCommentsRenderedTextSelection {
  version: 1;
  coordinateSpace: "rendered-text-utf16";
  start: number;
  end: number;
  exact: string;
  prefix: string;
  suffix: string;
  rects: readonly {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

declare module "@bb/plugin-sdk/app" {
  interface PluginThreadPanelProps {
    revealMessage(messageId: string): Promise<"revealed" | "missing">;
  }

  interface PluginMessageActionContext {
    selection?: TimelineCommentsRenderedTextSelection;
  }

  interface PluginMessageActionRegistration {
    placements?: readonly ("action-bar" | "selection-menu")[];
  }

  interface PluginContentScriptContext {
    readonly rpc: PluginRpcClient;
    readonly realtime: {
      subscribe(
        channel: string,
        handler: (payload: unknown) => void,
      ): () => void | Promise<void>;
      getConnectionState(): PluginRealtimeConnectionState;
      subscribeConnectionState(
        handler: (state: PluginRealtimeConnectionState) => void,
      ): () => void | Promise<void>;
    };
    readonly navigate: Pick<BbNavigate, "toCompose">;
  }
}

declare module "@bb/plugin-sdk" {
  interface PluginThreadPanelProps {
    revealMessage(messageId: string): Promise<"revealed" | "missing">;
  }
}
