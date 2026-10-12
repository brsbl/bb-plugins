import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  definePluginApp,
  type ExperimentalSidebarFooterDisclosureProps,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  defaultRings,
  resolveRing,
  type Ring,
  type RingSetting,
} from "./rings.js";
import {
  accountServerRows,
  accountServersSchema,
  bbAccountStatusSchema,
  desktopServerRows,
  detectSwitcherMode,
  serverListFailure,
  type AccountServers,
  type DesktopServerApi,
  type ServerListFailure,
  type ServerRow,
  type SwitcherMode,
} from "./servers.js";

import {
  AvatarGlyph,
  publishAccount,
  RingPopover,
  ringKey,
  useAccountRevision,
  useRings,
  watchAccount,
} from "./avatar-ui.js";

type ListState =
  | { status: "loading" }
  | { status: "ready"; rows: ServerRow[] }
  | ServerListFailure;

type AccountState =
  | { status: "loading" }
  | { status: "ready"; data: AccountServers }
  | ServerListFailure;

let cachedAccount: AccountServers | null = null;

function useAccountServers(): {
  state: AccountState;
  handles: string[] | null;
  reload: () => void;
} {
  const sdk = useSdk();
  const [state, setState] = useState<AccountState>(() =>
    cachedAccount === null
      ? { status: "loading" }
      : { status: "ready", data: cachedAccount },
  );
  const [nonce, setNonce] = useState(0);
  const accountRevision = useAccountRevision();

  useEffect(() => {
    const controller = new AbortController();
    sdk.plugins
      .callRpc({
        pluginId: "bb-account",
        method: "bb-account.v1.status",
        input: {},
        outputSchema: bbAccountStatusSchema,
        signal: controller.signal,
      })
      .then((account) => {
        publishAccount(account);
        if (account.state === "signed-out") throw new Error("not_paired");
        return sdk.plugins.callRpc({
          pluginId: "connect",
          method: "listAccountServers",
          input: null,
          outputSchema: accountServersSchema,
          signal: controller.signal,
        });
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        cachedAccount = result;
        setState({ status: "ready", data: result });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const failure = serverListFailure(error);
        if (failure.status === "signed_out") cachedAccount = null;
        if (failure.status === "error" && cachedAccount !== null) return;
        setState(failure);
      });
    return () => controller.abort();
  }, [sdk, nonce, accountRevision]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const handles =
    state.status === "ready"
      ? state.data.servers.map((server) => server.handle)
      : null;
  return { state, handles, reload };
}

function useDesktopChoices(
  api: DesktopServerApi,
):
  | { status: "loading" }
  | { status: "ready"; choices: unknown }
  | ServerListFailure {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; choices: unknown }
    | ServerListFailure
  >({ status: "loading" });
  useEffect(() => {
    let disposed = false;
    let receivedEvent = false;
    const unsubscribe = api.onServerChoicesChange((choices) => {
      receivedEvent = true;
      if (!disposed) setState({ status: "ready", choices });
    });
    api
      .getServerChoices()
      .then((choices) => {
        if (!disposed && !receivedEvent) setState({ status: "ready", choices });
      })
      .catch((error: unknown) => {
        if (!disposed && !receivedEvent) setState(serverListFailure(error));
      });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [api]);
  return state;
}

function CurrentServerCard({
  row,
  ring,
  expanded,
  onToggle,
  canReset,
  onRingChange,
}: {
  row: ServerRow;
  ring: Ring | null;
  expanded: boolean;
  onToggle: () => void;
  canReset: boolean;
  onRingChange: (ring: RingSetting | null) => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-2.5",
        expanded ? "py-2 pl-1.75 pr-3" : "py-1.5 pl-1.75 pr-2.5",
      )}
    >
      <RingPopover
        row={row}
        ring={ring}
        size={expanded ? "lg" : "sm"}
        canReset={canReset}
        onChange={onRingChange}
      />
      <button
        type="button"
        aria-current="true"
        aria-expanded={expanded}
        onClick={onToggle}
        title={expanded ? "Hide servers" : "Switch server"}
        className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate font-medium text-sidebar-foreground",
              expanded ? "text-sm" : "text-xs",
            )}
          >
            {row.name}
          </span>
          <span className="truncate text-2xs text-muted-foreground">
            {row.detail}
          </span>
        </span>
        <Icon
          name={expanded ? "ChevronDown" : "ChevronUp"}
          className="ml-auto size-3.5 shrink-0 text-muted-foreground"
        />
      </button>
    </div>
  );
}

function ServerRowButton({
  row,
  ring,
  interactive,
  onSelect,
  canReset,
  onRingChange,
}: {
  row: ServerRow;
  ring: Ring | null;
  interactive: boolean;
  onSelect: (row: ServerRow) => void;
  canReset: boolean;
  onRingChange: (ring: RingSetting | null) => void;
}) {
  const offline = row.live === false;
  const disabled = !interactive || offline;
  return (
    <li className="flex flex-col">
      <div className="flex min-w-0 items-center gap-2.5 rounded-md py-1 pl-0.75 pr-2 hover:bg-state-hover">
        <RingPopover
          row={row}
          ring={ring}
          size="sm"
          canReset={canReset}
          onChange={onRingChange}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelect(row)}
          className={cn(
            "flex min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
            disabled ? "cursor-default" : "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "truncate text-xs font-medium",
              offline ? "text-muted-foreground" : "text-sidebar-foreground",
            )}
          >
            {row.name}
          </span>
          <span className="truncate text-2xs text-muted-foreground">
            {offline ? "Offline" : row.detail}
          </span>
        </button>
      </div>
    </li>
  );
}

function PanelBody({
  state,
  interactive,
  onSelect,
  onRetry,
  accountHandles,
}: {
  state: ListState;
  interactive: boolean;
  onSelect: (row: ServerRow) => void;
  onRetry: (() => void) | null;
  accountHandles: readonly string[] | null;
}) {
  const { rings, save } = useRings();
  const [expanded, setExpanded] = useState(false);

  if (state.status === "loading") {
    return (
      <div
        className="flex items-center gap-2.5 py-1.5 pl-1.75 pr-2.5"
        aria-busy="true"
      >
        <Skeleton className="size-7 rounded-full" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      </div>
    );
  }
  if (state.status === "signed_out") {
    return (
      <div className="flex flex-col items-start gap-2 p-3 text-xs text-muted-foreground">
        <p>
          Sign in to your bb account to switch servers. Run{" "}
          <code className="font-mono">bb account login</code>.
        </p>
        {onRetry === null ? null : (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-2 p-3 text-xs text-muted-foreground">
        <p>Couldn't load servers.</p>
        {state.message === "" ? null : (
          <p className="break-words font-mono text-2xs">{state.message}</p>
        )}
        {onRetry === null ? null : (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }
  const defaults = defaultRings(
    accountHandles ?? state.rows.filter((row) => row.account).map(ringKey),
  );
  const ringProps = (row: ServerRow) => ({
    ring: resolveRing(rings, ringKey(row), defaults.get(ringKey(row)) ?? null),
    canReset: row.account && rings[ringKey(row)] !== undefined,
    onRingChange: (ring: RingSetting | null) => save(ringKey(row), ring),
  });
  const current = state.rows.find((row) => row.current) ?? null;
  const others = state.rows.filter((row) => !row.current);
  const showList = expanded || current === null;
  return (
    <div className="flex flex-col">
      {current === null ? null : (
        <CurrentServerCard
          row={current}
          {...ringProps(current)}
          expanded={expanded}
          onToggle={() => {
            if (!expanded) onRetry?.();
            setExpanded(!expanded);
          }}
        />
      )}
      {showList ? (
        <>
          <div className="flex h-7 items-center gap-1 border-t border-sidebar-border pl-1.75 pr-3 pt-1">
            <span className="text-2xs font-medium text-muted-foreground">
              {others.length === 0 ? "No other servers" : "Switch to"}
            </span>
          </div>
          {others.length === 0 ? null : (
            <ul className="flex flex-col gap-0.5 px-1 pb-1">
              {others.map((row) => (
                <ServerRowButton
                  key={row.id}
                  row={row}
                  {...ringProps(row)}
                  interactive={interactive}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          )}
          {interactive ? null : (
            <p className="px-3 pb-2 text-2xs text-muted-foreground">
              Switch servers from the bb app's server list.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

function PanelFrame({ children }: { children: ReactNode }) {
  return <div className="max-h-96 overflow-y-auto">{children}</div>;
}

function DesktopPanel({
  api,
  dismiss,
}: ExperimentalSidebarFooterDisclosureProps & { api: DesktopServerApi }) {
  const desktop = useDesktopChoices(api);
  const account = useAccountServers();
  let state: ListState;
  if (desktop.status !== "ready") {
    state = desktop;
  } else {
    const rows = desktopServerRows(
      desktop.choices,
      account.state.status === "ready" ? account.state.data : null,
    );
    state =
      rows === null
        ? {
            status: "error",
            message: "The desktop app sent an unexpected server list.",
          }
        : { status: "ready", rows };
  }
  return (
    <PanelFrame>
      <PanelBody
        state={state}
        interactive
        onRetry={account.reload}
        accountHandles={account.handles}
        onSelect={(row) => {
          dismiss();
          api.selectServer(row.id);
        }}
      />
    </PanelFrame>
  );
}

function AccountPanel({
  dismiss,
  interactive,
}: ExperimentalSidebarFooterDisclosureProps & { interactive: boolean }) {
  const { state: account, handles, reload } = useAccountServers();
  const state: ListState =
    account.status === "ready"
      ? { status: "ready", rows: accountServerRows(account.data) }
      : account;
  return (
    <PanelFrame>
      <PanelBody
        state={state}
        interactive={interactive}
        onRetry={reload}
        accountHandles={handles}
        onSelect={(row) => {
          if (row.url === null) return;
          dismiss();
          window.location.assign(row.url);
        }}
      />
    </PanelFrame>
  );
}

function ServerSwitcherPanel(props: ExperimentalSidebarFooterDisclosureProps) {
  const [mode] = useState<SwitcherMode>(() => detectSwitcherMode(window));
  if (mode.kind === "desktop")
    return <DesktopPanel {...props} api={mode.api} />;
  return <AccountPanel {...props} interactive={mode.kind === "web"} />;
}

export default definePluginApp((app) => {
  app.experimental_icons.register({
    name: "server-switcher-avatar",
    component: AvatarGlyph,
  });
  app.contentScripts.register({
    id: "account-avatar",
    mount({ signal }) {
      void watchAccount(signal);
    },
  });
  const strip = app.experimental_sidebarFooter.register({
    kind: "disclosure",
    id: "servers",
    label: "Servers",
    icon: "server-switcher-avatar",
    component: ServerSwitcherPanel,
  });
  strip.open();
});
