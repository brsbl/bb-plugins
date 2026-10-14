import type { BbPluginApi } from "@get-bb/plugin-sdk";
import { createPriorities } from "./priorities.js";
import { contract } from "./contract.js";
import { CHANGED } from "./signals.js";
import { createCli } from "./cli.js";
import { createStore, MIGRATIONS } from "./store.js";

const INSTRUCTIONS =
  "CRM: when the user asks to see the customer pipeline or investor ranking, and right after you change CRM data, run `bb crm view --type customers` (or `--type investors`) and paste the directive it prints once, on its own line. It renders the live CRM; describe what changed in words instead of pasting tables. Load the crm skill before editing records.";

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
  bb.agents.contributeInstructions(() => INSTRUCTIONS);
}
