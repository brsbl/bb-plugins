import { adapterFor } from "./adapters/index.js";
import { sha256Canonical } from "./canonical.js";
import { enforceProviderLicensePolicy, ProviderPolicyError } from "./policy.js";
import {
  federatedSnapshotSchema,
  providerIndexSchema,
  providerRecordSchema,
  providerSnapshotSchema,
  type FederatedSnapshot,
  type ProviderDefinition,
  type ProviderDocument,
  type ProviderIndex,
  type ProviderRecord,
  type ProviderSnapshot,
} from "./schema.js";

export interface ProviderBuildInput {
  definition: ProviderDefinition;
  input: unknown;
  expectedInputSha256: string | undefined;
}

export interface ProviderArtifacts {
  snapshot: FederatedSnapshot;
  index: ProviderIndex;
}

export class ProviderBuildError extends Error {
  readonly code: string;
  readonly providerId: string;

  constructor(providerId: string, code: string, message: string) {
    super(message);
    this.name = "ProviderBuildError";
    this.providerId = providerId;
    this.code = code;
  }
}

export function normalizeProviderSearchText(value: string): string[] {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function sortRecords(records: readonly ProviderRecord[]) {
  return [...records].sort(
    (left, right) =>
      left.nativeId.localeCompare(right.nativeId) ||
      left.name.localeCompare(right.name),
  );
}

function validateRecordSet(
  definition: ProviderDefinition,
  records: readonly ProviderRecord[],
) {
  if (!records.length) {
    throw new ProviderBuildError(
      definition.id,
      "empty-provider",
      `Provider ${definition.id} produced no records.`,
    );
  }

  const nativeIds = new Set<string>();
  for (const candidate of records) {
    const record = providerRecordSchema.parse(candidate);
    if (record.provenance.providerId !== definition.id) {
      throw new ProviderBuildError(
        definition.id,
        "provenance-provider-mismatch",
        `Record ${record.nativeId} has provider ${record.provenance.providerId}.`,
      );
    }
    if (nativeIds.has(record.nativeId)) {
      throw new ProviderBuildError(
        definition.id,
        "duplicate-native-id",
        `Provider ${definition.id} emitted duplicate native id ${record.nativeId}.`,
      );
    }
    nativeIds.add(record.nativeId);
  }
}

function currentProvider(input: ProviderBuildInput): ProviderSnapshot {
  const { definition } = input;
  enforceProviderLicensePolicy(definition);

  const inputSha256 = sha256Canonical(input.input);
  if (!input.expectedInputSha256) {
    throw new ProviderBuildError(
      definition.id,
      "missing-input-lock",
      `Provider ${definition.id} has no locked input hash.`,
    );
  }
  if (inputSha256 !== input.expectedInputSha256) {
    throw new ProviderBuildError(
      definition.id,
      "input-integrity-mismatch",
      `Provider ${definition.id} input does not match its lock.`,
    );
  }

  const records = adapterFor(definition).adapt(definition, input.input);
  validateRecordSet(definition, records);

  return providerSnapshotSchema.parse({
    id: definition.id,
    name: definition.name,
    homepage: definition.homepage,
    source: {
      adapter: definition.adapter,
      ...definition.source,
    },
    license: definition.license,
    freshness: definition.freshness,
    build: {
      mode: "current",
      inputSha256,
      failure: null,
    },
    records: sortRecords(records),
  });
}

function errorCode(error: unknown) {
  if (error instanceof ProviderBuildError) return error.code;
  if (error instanceof ProviderPolicyError) return error.code;
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    return "schema-validation-failed";
  }
  return "adapter-failed";
}

function verifiedPreviousSnapshot(
  previousSnapshot: FederatedSnapshot | undefined,
) {
  if (!previousSnapshot) return undefined;
  const previous = federatedSnapshotSchema.parse(previousSnapshot);
  if (sha256Canonical(previous.providers) !== previous.fingerprint) {
    throw new Error("Previous provider snapshot fingerprint is invalid.");
  }
  return previous;
}

function lastKnownGoodProvider(
  input: ProviderBuildInput,
  previousSnapshot: FederatedSnapshot | undefined,
  failure: unknown,
): ProviderSnapshot {
  const previous = previousSnapshot?.providers.find(
    ({ id }) => id === input.definition.id,
  );
  if (!previous) throw failure;

  const candidateInputSha256 = (() => {
    try {
      return sha256Canonical(input.input);
    } catch {
      return null;
    }
  })();

  return providerSnapshotSchema.parse({
    ...previous,
    build: {
      mode: "last-known-good",
      inputSha256: previous.build.inputSha256,
      failure: {
        code: errorCode(failure),
        candidateRevision: input.definition.source.revision,
        candidateInputSha256,
      },
    },
  });
}

function documentKey(providerId: string, nativeId: string) {
  return `${providerId}:${encodeURIComponent(nativeId)}`;
}

export function buildProviderIndex(
  snapshot: FederatedSnapshot,
): ProviderIndex {
  const documents: ProviderDocument[] = snapshot.providers
    .flatMap((provider) =>
      provider.records.map((record) => ({
        ...record,
        providerName: provider.name,
        key: documentKey(provider.id, record.nativeId),
        search: {
          name: normalizeProviderSearchText(record.name),
          aliases: normalizeProviderSearchText(record.aliases.join(" ")),
          summary: normalizeProviderSearchText(record.summary ?? ""),
          kind: normalizeProviderSearchText(record.kind),
          nativeId: normalizeProviderSearchText(record.nativeId),
        },
      })),
    )
    .sort(
      (left, right) =>
        left.provenance.providerId.localeCompare(
          right.provenance.providerId,
        ) || left.nativeId.localeCompare(right.nativeId),
    );

  const postings = new Map<string, Set<string>>();
  for (const document of documents) {
    const terms = new Set(Object.values(document.search).flat());
    for (const term of terms) {
      const keys = postings.get(term) ?? new Set<string>();
      keys.add(document.key);
      postings.set(term, keys);
    }
  }

  return providerIndexSchema.parse({
    schemaVersion: "1",
    snapshotFingerprint: snapshot.fingerprint,
    documents,
    postings: Object.fromEntries(
      [...postings.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([term, keys]) => [term, [...keys].sort()]),
    ),
  });
}

export function buildProviderArtifacts({
  inputs,
  assembledAt,
  previousSnapshot,
}: {
  inputs: readonly ProviderBuildInput[];
  assembledAt: string;
  previousSnapshot?: FederatedSnapshot;
}): ProviderArtifacts {
  const previous = verifiedPreviousSnapshot(previousSnapshot);
  const providers = [...inputs]
    .sort((left, right) =>
      left.definition.id.localeCompare(right.definition.id),
    )
    .map((input) => {
      try {
        return currentProvider(input);
      } catch (error) {
        return lastKnownGoodProvider(input, previous, error);
      }
    });

  const snapshot = federatedSnapshotSchema.parse({
    schemaVersion: "1",
    assembledAt,
    fingerprint: sha256Canonical(providers),
    providers,
  });

  return {
    snapshot,
    index: buildProviderIndex(snapshot),
  };
}
