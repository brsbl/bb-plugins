import { defineRpcContract, type BbPluginApi } from "@get-bb/plugin-sdk";
import { z } from "zod";
import { IconService, createIconCache } from "@brsbl/bb-website-icons";

const contract = defineRpcContract({
  config: { input: z.object({}).strict(), output: z.object({ enabled: z.boolean() }) },
  icon: {
    input: z.object({ origin: z.string().max(2048) }).strict(),
    output: z.object({ dataUrl: z.string().max(128 * 1024).nullable(), enabled: z.boolean() }),
  },
});

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
