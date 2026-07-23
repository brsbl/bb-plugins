import ariaApgInput from "./sources/aria-apg.json";
import assistantUiInput from "./sources/assistant-ui.json";
import baseUiInput from "./sources/base-ui.json";
import shadcnUiInput from "./sources/shadcn-ui.json";
import providerLockInput from "./providers.lock.json";
import upstreamManifestInput from "./upstreams.json";
import {
  providerLockSchema,
  providerManifestSchema,
} from "./schema.js";

const providerLock = providerLockSchema.parse(providerLockInput);
const manifest = providerManifestSchema.parse(upstreamManifestInput);

const rawInputs: Record<string, unknown> = {
  "aria-apg": ariaApgInput,
  "assistant-ui": assistantUiInput,
  "base-ui": baseUiInput,
  "shadcn-ui": shadcnUiInput,
};

export const providerBuildInputs = manifest.providers.map((definition) => ({
  definition,
  input: rawInputs[definition.id],
  expectedInputSha256: providerLock.inputs[definition.id],
}));

export const providerSnapshotAssembledAt = manifest.assembledAt;
