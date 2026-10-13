import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { createPriorities } from "./priorities.js";
import { contract } from "./contract.js";
import { CHANGED } from "./signals.js";
import { createCli } from "./cli.js";
import { createStore, MIGRATIONS } from "./store.js";

export default function plugin(bb: BbPluginApi): void {
  const db = bb.storage.database();
  bb.storage.migrate(db, MIGRATIONS);
  const store = createStore(db);
  const priorities = createPriorities(db);
  const changed = () => bb.realtime.publish(CHANGED, {});
  bb.rpc.register(contract, {
    view: input => store.view(input), history: input => store.history(input),
    customers: input => priorities.customers(input), investors: input => priorities.investors(input),
    setRank: input => { const result = priorities.setRank(input); changed(); return result; },
    autoRank: input => { const result = priorities.autoRank(input.id); changed(); return result; },
    setTier: input => { const result = priorities.setTier(input); changed(); return result; },
  });
  bb.cli.register(createCli(store, priorities, changed));
}
