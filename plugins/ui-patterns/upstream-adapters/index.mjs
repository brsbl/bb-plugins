export {
  UPSTREAM_ADAPTER_CONTRACT_VERSION,
  canonicalFixturePayload,
  contentModes,
  fixtureChecksum,
} from "./contract.mjs";
export { w3cAriaApgAdapter } from "./w3c-aria-apg.mjs";
export { baseUiAdapter } from "./base-ui.mjs";
export { carbonAdapter } from "./carbon.mjs";

import { baseUiAdapter } from "./base-ui.mjs";
import { carbonAdapter } from "./carbon.mjs";
import { w3cAriaApgAdapter } from "./w3c-aria-apg.mjs";

export const upstreamAdapters = Object.freeze(
  new Map([
    [w3cAriaApgAdapter.providerId, w3cAriaApgAdapter],
    [baseUiAdapter.providerId, baseUiAdapter],
    [carbonAdapter.providerId, carbonAdapter],
  ]),
);

export function parsePinnedUpstreamFixture(providerId, fixture) {
  const adapter = upstreamAdapters.get(providerId);
  if (!adapter) throw new RangeError(`No upstream adapter is registered for ${providerId}`);
  return adapter.parse(fixture);
}
