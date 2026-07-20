import type { BbPluginApi } from "@bb/plugin-sdk";
import { cliCommandInfo, runAtlasCli } from "./atlas-cli-v5.js";
import { registerProviderRpc } from "./providers/rpc-v2.js";

export default async function plugin(bb: BbPluginApi) {
  registerProviderRpc(bb);
  bb.cli.register({
    name: "ui-patterns",
    summary: "Search and inspect the approved-source UI Pattern Atlas",
    commands: cliCommandInfo.map((command) => ({
      name: command.name,
      summary: command.summary,
      usage: `bb ${command.usage}`,
    })),
    run(argv) {
      return runAtlasCli(argv);
    },
  });
  bb.log.info("UI Pattern Atlas generated index loaded");
  bb.onDispose(() => bb.log.info("UI Pattern Atlas generated index disposed"));
}
