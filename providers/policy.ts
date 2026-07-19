import type { ProviderDefinition } from "./schema.js";

const acceptedMetadataLicenses = new Map([
  ["MIT", { requiresNotice: true }],
  ["CC0-1.0", { requiresNotice: false }],
]);

export class ProviderPolicyError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProviderPolicyError";
    this.code = code;
  }
}

export function enforceProviderLicensePolicy(
  provider: ProviderDefinition,
): void {
  const policy = acceptedMetadataLicenses.get(provider.license.expression);
  if (!policy) {
    throw new ProviderPolicyError(
      "license-not-allowed",
      `Provider ${provider.id} uses unapproved license ${provider.license.expression}.`,
    );
  }
  if (provider.license.scope !== "metadata-only") {
    throw new ProviderPolicyError(
      "license-scope-not-allowed",
      `Provider ${provider.id} may ingest metadata only.`,
    );
  }
  if (policy.requiresNotice && !provider.license.notice.trim()) {
    throw new ProviderPolicyError(
      "license-notice-required",
      `Provider ${provider.id} must retain its license notice.`,
    );
  }
}

export const providerLicensePolicy = Object.freeze({
  version: "1",
  ingestionScope: "metadata-only",
  acceptedExpressions: [...acceptedMetadataLicenses.keys()].sort(),
});
