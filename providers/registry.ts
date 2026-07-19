import govukInput from "./sources/govuk-design-system.json";
import uswdsInput from "./sources/uswds.json";
import providerLockInput from "./providers.lock.json";
import {
  providerDefinitionSchema,
  providerLockSchema,
  type ProviderDefinition,
} from "./schema.js";

const providerLock = providerLockSchema.parse(providerLockInput);

const definitions = [
  {
    id: "govuk-design-system",
    name: "GOV.UK Design System",
    homepage: "https://design-system.service.gov.uk/",
    adapter: "govuk-design-system",
    source: {
      repository: "https://github.com/alphagov/govuk-design-system",
      revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
      observedAt: "2026-07-17T11:51:27+01:00",
      format: "Markdown frontmatter",
      inputPath: "providers/sources/govuk-design-system.json",
      sourcePaths: [
        "src/components/*/index.md",
        "src/patterns/*/index.md",
      ],
    },
    license: {
      expression: "MIT",
      url: "https://github.com/alphagov/govuk-design-system/blob/b3536490dfea80a32968cf61e8b00d75530d80bd/LICENSE",
      scope: "metadata-only",
      notice:
        "Copyright (c) 2017 Crown Copyright (Government Digital Service).",
    },
    freshness: {
      staleAfterDays: 45,
    },
  },
  {
    id: "uswds",
    name: "U.S. Web Design System",
    homepage: "https://designsystem.digital.gov/",
    adapter: "uswds",
    source: {
      repository: "https://github.com/uswds/uswds",
      revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
      observedAt: "2026-07-17T13:39:20-04:00",
      format: "Storybook default-export metadata",
      inputPath: "providers/sources/uswds.json",
      sourcePaths: ["packages/usa-*/src/*.stories.js"],
    },
    license: {
      expression: "CC0-1.0",
      url: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/LICENSE.md",
      scope: "metadata-only",
      notice:
        "Only component names and Storybook grouping metadata are ingested; excluded font, icon, and third-party assets are not copied.",
    },
    freshness: {
      staleAfterDays: 45,
    },
  },
] satisfies readonly ProviderDefinition[];

const parsedDefinitions = definitions.map((definition) =>
  providerDefinitionSchema.parse(definition),
);

const rawInputs: Record<string, unknown> = {
  "govuk-design-system": govukInput,
  uswds: uswdsInput,
};

export const providerBuildInputs = parsedDefinitions.map((definition) => ({
  definition,
  input: rawInputs[definition.id],
  expectedInputSha256: providerLock.inputs[definition.id],
}));

export const providerSnapshotAssembledAt = "2026-07-17T17:39:20.000Z";
