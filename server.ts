import type { BbPluginApi } from "@bb/plugin-sdk";
import { cliCommandInfo, runAtlasCli } from "./runtime-cli.js";
import { registerProviderRpc } from "./providers/rpc.js";

export default async function plugin(bb: BbPluginApi) {
  registerProviderRpc(bb);
  bb.cli.register({
    name: "ui-patterns",
    summary: "Search and inspect the Pattern Atlas UI vocabulary",
    commands: cliCommandInfo.map((command) => ({
      name: command.name,
      summary: command.summary,
      usage: `bb ${command.usage}`,
    })),
    run(argv) {
      return runAtlasCli(argv);
    },
  });
  bb.log.info("UI Patterns provider index loaded");
  bb.onDispose(() => bb.log.info("UI Patterns provider index disposed"));
}
