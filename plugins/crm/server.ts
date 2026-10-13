import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { CHANGED, contract } from "./contract.js";
import { createCli } from "./cli.js";
import { createStore, MIGRATIONS } from "./store.js";

export default function plugin(bb: BbPluginApi): void {
  const db = bb.storage.database();
  bb.storage.migrate(db, MIGRATIONS);
  const store = createStore(db);
  bb.rpc.register(contract, { view: input => store.view(input), history: input => store.history(input) });
  bb.cli.register(createCli(store, () => bb.realtime.publish(CHANGED, {})));
}
