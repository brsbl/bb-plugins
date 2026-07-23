import type { ProviderDefinition } from "./schema.js";

const approvedProviders = new Map<
  string,
  {
    repository: string;
    license: string;
    maximumContentMode: "metadata-only" | "excerpt";
    sourcePaths: readonly string[];
  }
>([
  [
    "shadcn-ui",
    {
      repository: "https://github.com/shadcn-ui/ui",
      license: "MIT",
      maximumContentMode: "excerpt",
      sourcePaths: [
        "apps/v4/content/docs/components/base/meta.json",
        "apps/v4/content/docs/components/base/*.mdx",
      ],
    },
  ],
  [
    "base-ui",
    {
      repository: "https://github.com/mui/base-ui",
      license: "MIT",
      maximumContentMode: "excerpt",
      sourcePaths: ["docs/src/app/(docs)/react/components/*/page.mdx"],
    },
  ],
  [
    "assistant-ui",
    {
      repository: "https://github.com/assistant-ui/assistant-ui",
      license: "MIT",
      maximumContentMode: "excerpt",
      sourcePaths: [
        "apps/docs/content/docs/primitives/meta.json",
        "apps/docs/content/docs/primitives/*.mdx",
        "apps/docs/content/docs/(reference)/api-reference/primitives/meta.json",
        "apps/docs/content/docs/(reference)/api-reference/primitives/*.mdx",
      ],
    },
  ],
  [
    "aria-apg",
    {
      repository: "https://github.com/w3c/aria-practices",
      license: "W3C-Software-Document",
      maximumContentMode: "excerpt",
      sourcePaths: [
        "content/patterns/**/*-pattern.html",
        "content/patterns/**/examples/*.html",
      ],
    },
  ],
]);

export class ProviderPolicyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProviderPolicyError";
    this.code = code;
  }
}

function sameStrings(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function enforceProviderLicensePolicy(
  provider: ProviderDefinition,
): void {
  const policy = approvedProviders.get(provider.id);
  if (!policy) {
    throw new ProviderPolicyError(
      "provider-not-approved",
      `Provider ${provider.id} is not approved for Atlas ingestion.`,
    );
  }
  if (provider.source.repository !== policy.repository) {
    throw new ProviderPolicyError(
      "repository-not-approved",
      `Provider ${provider.id} does not use its approved repository.`,
    );
  }
  if (provider.license.expression !== policy.license) {
    throw new ProviderPolicyError(
      "license-not-approved",
      `Provider ${provider.id} does not use its approved license.`,
    );
  }
  if (
    provider.license.scope === "excerpt" &&
    policy.maximumContentMode === "metadata-only"
  ) {
    throw new ProviderPolicyError(
      "content-mode-not-approved",
      `Provider ${provider.id} may ingest metadata only.`,
    );
  }
  if (!sameStrings(provider.source.sourcePaths, policy.sourcePaths)) {
    throw new ProviderPolicyError(
      "source-paths-not-approved",
      `Provider ${provider.id} does not use its approved upstream paths.`,
    );
  }
  if (!provider.license.notice.trim()) {
    throw new ProviderPolicyError(
      "license-notice-required",
      `Provider ${provider.id} must retain its license notice.`,
    );
  }
}

export const providerLicensePolicy = Object.freeze({
  version: "2",
  approvedProviderIds: Object.freeze([...approvedProviders.keys()].sort()),
});
