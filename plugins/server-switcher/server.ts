import type { BbPluginApi } from "@get-bb/plugin-sdk";
import {
  parseRingArgs,
  RINGS_CHANNEL,
  RING_KEY_MAX_LENGTH,
  ringKeySchema,
  ringsContract,
  ringsSchema,
  withRing,
  describeRing,
  type RingSetting,
  type RingsSnapshot,
  type Rings,
} from "./rings.js";

const RINGS_KEY = "rings";
const REVISION_KEY = "ringsRevision";

export default function serverSwitcher(bb: BbPluginApi) {
  const read = async (): Promise<Rings> => {
    const stored: unknown = await bb.storage.kv.get(RINGS_KEY);
    if (typeof stored !== "object" || stored === null) return {};
    const rings: Rings = {};
    for (const [key, value] of Object.entries(stored)) {
      const entry = ringsSchema.safeParse({ [key]: value });
      if (entry.success) Object.assign(rings, entry.data);
    }
    return rings;
  };
  const readRevision = async (): Promise<number> => {
    const stored: unknown = await bb.storage.kv.get(REVISION_KEY);
    return typeof stored === "number" && Number.isInteger(stored) && stored >= 0
      ? stored
      : 0;
  };
  const snapshot = async (): Promise<RingsSnapshot> => ({
    revision: await readRevision(),
    rings: await read(),
  });
  let pending: Promise<unknown> = Promise.resolve();
  const write = (
    key: string,
    ring: RingSetting | null,
  ): Promise<RingsSnapshot> => {
    const run = pending.then(async () => {
      if (!ringKeySchema.safeParse(key).success)
        throw new Error(
          `Server names must be 1 to ${RING_KEY_MAX_LENGTH} characters.`,
        );
      const next: RingsSnapshot = {
        revision: (await readRevision()) + 1,
        rings: withRing(await read(), key, ring),
      };
      await bb.storage.kv.set(RINGS_KEY, next.rings);
      await bb.storage.kv.set(REVISION_KEY, next.revision);
      bb.realtime.publish(RINGS_CHANNEL, next);
      return next;
    });
    pending = run.catch(() => undefined);
    return run;
  };

  bb.rpc.register(ringsContract, {
    listRings: () => snapshot(),
    setRing: ({ key, ring }) => write(key, ring),
  });

  bb.cli.register({
    name: "server-switcher",
    summary: "Manage the colored rings around server avatars",
    commands: [
      {
        name: "ring",
        summary:
          "List, set, remove, or reset a server's ring (account servers default to a gradient)",
        usage:
          "bb server-switcher ring list | set <server> <color> [<color>] | clear <server> | reset <server>",
      },
    ],
    async run(argv) {
      const [group, command, server, ...colors] = argv;
      const usage =
        "Usage: bb server-switcher ring list | set <server> <color> [<color>] | clear <server> | reset <server>\n";
      try {
        if (group !== "ring") return { exitCode: 2, stderr: usage };
        if (command === "list") {
          const entries = Object.entries(await read());
          return {
            exitCode: 0,
            stdout:
              entries.length === 0
                ? "No server rings set; account servers use their default ring.\n"
                : entries
                    .map(([key, ring]) => `${key}\t${describeRing(ring)}\n`)
                    .join(""),
          };
        }
        if (command === "set" && server !== undefined) {
          await write(server, parseRingArgs(colors));
          return { exitCode: 0, stdout: `Ring set for ${server}.\n` };
        }
        if (command === "clear" && server !== undefined) {
          await write(server, "none");
          return { exitCode: 0, stdout: `Ring removed for ${server}.\n` };
        }
        if (command === "reset" && server !== undefined) {
          await write(server, null);
          return {
            exitCode: 0,
            stdout: `Ring reset to the default for ${server}.\n`,
          };
        }
        return { exitCode: 2, stderr: usage };
      } catch (error) {
        return {
          exitCode: 1,
          stderr: `${error instanceof Error ? error.message : String(error)}\n`,
        };
      }
    },
  });
}
