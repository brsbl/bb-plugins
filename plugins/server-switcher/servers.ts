import { z } from "zod";

export const bbAccountStatusSchema = z.object({
  state: z.enum(["signed-out", "profile-pending", "signed-in"]),
  revision: z.number().int().nonnegative(),
  account: z.object({ avatarUrl: z.string().url().nullable() }).nullable(),
});
export type BbAccountStatus = z.infer<typeof bbAccountStatusSchema>;

export const accountServersSchema = z.object({
  servers: z.array(
    z.object({
      handle: z.string().min(1),
      name: z.string().min(1),
      live: z.boolean(),
      url: z.string().url(),
    }),
  ),
  selfHandle: z.string().min(1),
});
export type AccountServers = z.infer<typeof accountServersSchema>;

const desktopChoicesSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    active: z.boolean(),
  }),
);

export interface ServerRow {
  id: string;
  name: string;
  detail: string;
  account: boolean;
  live: boolean | null;
  current: boolean;
  url: string | null;
}

export type ServerListFailure =
  | { status: "signed_out" }
  | { status: "error"; message: string };

const ERROR_MESSAGE_MAX_LENGTH = 200;

export function sortServerRows(rows: readonly ServerRow[]): ServerRow[] {
  return [...rows].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function serverHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function accountServerRows(result: AccountServers): ServerRow[] {
  return sortServerRows(
    result.servers.map((server) => ({
      id: server.handle,
      name: server.handle,
      detail: serverHost(server.url),
      account: true,
      live: server.live,
      current: server.handle === result.selfHandle,
      url: server.url,
    })),
  );
}

const CONNECT_CHOICE_PREFIX = "connect:";
const BUILTIN_CHOICE_ID = "builtin";

export function desktopServerRows(
  choices: unknown,
  account: AccountServers | null,
): ServerRow[] | null {
  const parsed = desktopChoicesSchema.safeParse(choices);
  if (!parsed.success) return null;
  const servers = account?.servers ?? [];
  const byHandle = new Map(servers.map((server) => [server.handle, server]));
  const byHost = new Map(
    servers.map((server) => [serverHost(server.url), server]),
  );
  const rows = new Map<string, ServerRow>();
  const add = (key: string, row: ServerRow, preferred: boolean) => {
    const existing = rows.get(key);
    if (
      existing === undefined ||
      (row.current && !existing.current) ||
      (preferred && !existing.current)
    ) {
      rows.set(key, row);
    }
  };
  for (const choice of parsed.data) {
    if (choice.id === BUILTIN_CHOICE_ID) {
      if (!choice.active) continue;
      add(
        choice.id,
        {
          id: choice.id,
          name: choice.name,
          detail: "Built-in server",
          account: false,
          live: null,
          current: true,
          url: null,
        },
        true,
      );
      continue;
    }
    const isConnect = choice.id.startsWith(CONNECT_CHOICE_PREFIX);
    const server = isConnect
      ? byHandle.get(choice.id.slice(CONNECT_CHOICE_PREFIX.length))
      : byHost.get(choice.name);
    const handle =
      server?.handle ??
      (isConnect
        ? choice.id.slice(CONNECT_CHOICE_PREFIX.length)
        : getbbHandle(choice.name));
    if (handle === null) {
      add(
        choice.id,
        {
          id: choice.id,
          name: choice.name,
          detail: "Custom server",
          account: false,
          live: null,
          current: choice.active,
          url: null,
        },
        false,
      );
      continue;
    }
    add(
      `handle:${handle}`,
      {
        id: choice.id,
        name: handle,
        detail:
          server === undefined
            ? isConnect
              ? "bb account server"
              : choice.name
            : serverHost(server.url),
        account: true,
        live: server?.live ?? null,
        current: choice.active,
        url: null,
      },
      isConnect,
    );
  }
  return sortServerRows([...rows.values()]);
}

function getbbHandle(host: string): string | null {
  const match = /^([a-z0-9-]+)\.getbb\.app$/u.exec(host);
  return match?.[1] ?? null;
}

export function serverListFailure(error: unknown): ServerListFailure {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.replace(/^HTTP \d+: /u, "");
  if (message === "not_paired") return { status: "signed_out" };
  return {
    status: "error",
    message:
      message.length > ERROR_MESSAGE_MAX_LENGTH
        ? `${message.slice(0, ERROR_MESSAGE_MAX_LENGTH - 1)}…`
        : message,
  };
}

export interface DesktopServerApi {
  getServerChoices(): Promise<unknown>;
  onServerChoicesChange(listener: (choices: unknown) => void): () => void;
  selectServer(id: string): void;
}

export type SwitcherMode =
  | { kind: "desktop"; api: DesktopServerApi }
  | { kind: "mobile-shell" }
  | { kind: "web" };

function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

export function detectSwitcherMode(target: object): SwitcherMode {
  const desktop: unknown = Reflect.get(target, "bbDesktop");
  if (typeof desktop === "object" && desktop !== null) {
    const getServerChoices: unknown = Reflect.get(desktop, "getServerChoices");
    const onServerChoicesChange: unknown = Reflect.get(
      desktop,
      "onServerChoicesChange",
    );
    const selectServer: unknown = Reflect.get(desktop, "selectServer");
    if (
      isFunction(getServerChoices) &&
      isFunction(onServerChoicesChange) &&
      isFunction(selectServer)
    ) {
      return {
        kind: "desktop",
        api: {
          getServerChoices: () =>
            Promise.resolve(Reflect.apply(getServerChoices, desktop, [])),
          onServerChoicesChange: (listener) => {
            const unsubscribe: unknown = Reflect.apply(
              onServerChoicesChange,
              desktop,
              [listener],
            );
            return isFunction(unsubscribe) ? () => unsubscribe() : () => {};
          },
          selectServer: (id) => {
            Reflect.apply(selectServer, desktop, [id]);
          },
        },
      };
    }
  }
  if (Reflect.get(target, "ReactNativeWebView") !== undefined) {
    return { kind: "mobile-shell" };
  }
  return { kind: "web" };
}
