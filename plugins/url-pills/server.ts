import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { ICON_LIMITS, IconService, type IconCache } from "./icons.js";

const contract = defineRpcContract({
  config: { input: z.object({}).strict(), output: z.object({ enabled: z.boolean() }) },
  icon: {
    input: z.object({ origin: z.string().max(2048) }).strict(),
    output: z.object({ dataUrl: z.string().max(128 * 1024).nullable(), enabled: z.boolean() }),
  },
});

/** Only disposable origin-level raster data lives in the plugin's own database. */
export function createIconCache(bb: Pick<BbPluginApi, "storage">, now = Date.now): IconCache {
  const db = bb.storage.database();
  db.exec("CREATE TABLE IF NOT EXISTS icons (origin TEXT PRIMARY KEY, data TEXT, expires INTEGER NOT NULL, touched INTEGER NOT NULL, bytes INTEGER NOT NULL)");
  const read = db.prepare("SELECT data, expires FROM icons WHERE origin = ?");
  const remove = db.prepare("DELETE FROM icons WHERE origin = ?");
  const touch = db.prepare("UPDATE icons SET touched = ? WHERE origin = ?");
  const write = db.prepare("INSERT OR REPLACE INTO icons(origin, data, expires, touched, bytes) VALUES (?, ?, ?, ?, ?)");
  const expired = db.prepare("DELETE FROM icons WHERE expires <= ?");
  const list = db.prepare("SELECT origin, bytes FROM icons ORDER BY touched DESC, rowid DESC");
  const put = db.transaction((origin: string, dataUrl: string | null) => {
    const time = now();
    expired.run(time);
    write.run(origin, dataUrl, time + (dataUrl ? ICON_LIMITS.positiveMs : ICON_LIMITS.negativeMs), time, Buffer.byteLength(dataUrl ?? ""));
    let bytes = 0;
    for (const [index, entry] of (list.all() as Array<{ origin: string; bytes: number }>).entries()) {
      bytes += entry.bytes;
      if (index >= ICON_LIMITS.entries || bytes > ICON_LIMITS.cacheBytes) remove.run(entry.origin);
    }
  });
  return {
    get(origin) {
      const entry = read.get(origin) as { data: string | null; expires: number } | undefined;
      if (!entry) return undefined;
      if (entry.expires <= now()) { remove.run(origin); return undefined; }
      touch.run(now(), origin);
      return entry.data;
    },
    put,
  };
}

export default async function plugin(bb: BbPluginApi): Promise<void> {
  const settings = bb.settings.define({
    loadWebsiteIcons: {
      type: "boolean",
      label: "Load website icons",
      description: "Contacts public websites for their icons. Your pasted path, query and fragment are not sent.",
      default: true,
    },
  });
  let enabled = (await settings.get()).loadWebsiteIcons;
  const icons = new IconService(createIconCache(bb));
  icons.setEnabled(enabled);
  settings.onChange((next) => {
    enabled = next.loadWebsiteIcons;
    icons.setEnabled(enabled);
    bb.realtime.publish("config-changed", { enabled });
  });
  bb.onDispose(() => icons.setEnabled(false));
  bb.rpc.register(contract, {
    config: () => ({ enabled }),
    icon: async ({ origin }) => {
      const dataUrl = await icons.get(origin);
      return { enabled, dataUrl: enabled ? dataUrl : null };
    },
  });
}
