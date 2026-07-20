import { adapterFor } from "./adapters/index.js";
import { sha256Canonical } from "./canonical.js";
import { approvedEquivalenceGroups } from "./equivalences.js";
import { enforceProviderLicensePolicy, ProviderPolicyError } from "./policy.js";
import {
  atlasEntrySchema,
  federatedSnapshotSchema,
  providerIndexSchema,
  providerRecordSchema,
  providerSnapshotSchema,
  type AtlasEntry,
  type AtlasEntryDocument,
  type FederatedSnapshot,
  type ProviderDefinition,
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

function sourceRecordId(record: ProviderRecord): `${string}:${string}` {
  return `${record.provenance.providerId}:${record.nativeId}`;
}

function sortRecords(records: readonly ProviderRecord[]) {
  return [...records].sort(
    (left, right) =>
      left.nativeId.localeCompare(right.nativeId) ||
      left.name.localeCompare(right.name),
  );
}

function duplicateValue<T>(items: readonly T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  for (const item of items) {
    const key = keyFor(item);
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
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

    const duplicateSection = duplicateValue(
      record.sections,
      ({ nativeId }) => nativeId,
    );
    if (duplicateSection) {
      throw new ProviderBuildError(
        definition.id,
        "duplicate-section-id",
        `Record ${record.nativeId} emitted duplicate section ${duplicateSection}.`,
      );
    }
    const duplicateExample = duplicateValue(
      record.examples,
      ({ nativeId }) => nativeId,
    );
    if (duplicateExample) {
      throw new ProviderBuildError(
        definition.id,
        "duplicate-example-id",
        `Record ${record.nativeId} emitted duplicate example ${duplicateExample}.`,
      );
    }
    const duplicateLink = duplicateValue(
      record.links,
      ({ kind, url }) => `${kind}:${url}`,
    );
    if (duplicateLink) {
      throw new ProviderBuildError(
        definition.id,
        "duplicate-link",
        `Record ${record.nativeId} emitted duplicate link ${duplicateLink}.`,
      );
    }
    if (definition.license.scope === "metadata-only" && record.summary) {
      throw new ProviderBuildError(
        definition.id,
        "summary-not-allowed",
        `Record ${record.nativeId} contains source text under metadata-only policy.`,
      );
    }
    if (
      definition.license.scope === "metadata-only" &&
      record.sections.some(({ content }) => content !== null)
    ) {
      throw new ProviderBuildError(
        definition.id,
        "section-content-not-allowed",
        `Record ${record.nativeId} contains section text under metadata-only policy.`,
      );
    }
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
  if (
    sha256Canonical({
      providers: previousSnapshot.providers,
      entries: previousSnapshot.entries,
    }) !== previousSnapshot.fingerprint
  ) {
    throw new Error("Previous provider snapshot fingerprint is invalid.");
  }

  // Snapshot v2 originally predated additive source section content. Verify the
  // stored artifact before normalizing that legacy boundary so last-known-good
  // fallback remains available without making the current contract optional.
  const providers = previousSnapshot.providers.map((provider) => ({
    ...provider,
    records: provider.records.map((record) => ({
      ...record,
      sections: record.sections.map((section) => ({
        ...section,
        content: section.content ?? null,
      })),
    })),
  }));
  return federatedSnapshotSchema.parse({
    ...previousSnapshot,
    fingerprint: sha256Canonical({
      providers,
      entries: previousSnapshot.entries,
    }),
    providers,
  });
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

class RecordGroups {
  private readonly parent = new Map<string, string>();

  constructor(ids: readonly string[]) {
    for (const id of ids) this.parent.set(id, id);
  }

  find(id: string): string {
    const parent = this.parent.get(id);
    if (!parent) throw new Error(`Unknown source record ${id}.`);
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(left: string, right: string): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot === rightRoot) return;
    const [first, second] = [leftRoot, rightRoot].sort();
    this.parent.set(second, first);
  }
}

export function buildAtlasEntries(
  providers: readonly ProviderSnapshot[],
): AtlasEntry[] {
  const records = providers
    .flatMap(({ records: providerRecords }) => providerRecords)
    .slice()
    .sort((left, right) => sourceRecordId(left).localeCompare(sourceRecordId(right)));
  const recordById = new Map(records.map((record) => [sourceRecordId(record), record]));
  const groups = new RecordGroups([...recordById.keys()]);
  const canonicalNameByRoot = new Map<string, string>();
  const groupedRecordIds = new Set<string>();

  for (const equivalence of approvedEquivalenceGroups) {
    for (const id of equivalence.sourceRecordIds) {
      if (!recordById.has(id)) {
        throw new Error(`Approved equivalence references missing source record ${id}.`);
      }
      if (groupedRecordIds.has(id)) {
        throw new Error(`Source record ${id} belongs to more than one equivalence group.`);
      }
      groupedRecordIds.add(id);
    }
    const [firstId, ...otherIds] = equivalence.sourceRecordIds;
    if (!firstId) continue;
    for (const id of otherIds) groups.union(firstId, id);
    canonicalNameByRoot.set(groups.find(firstId), equivalence.canonicalName);
  }

  const membersByRoot = new Map<string, ProviderRecord[]>();
  for (const record of records) {
    const root = groups.find(sourceRecordId(record));
    const members = membersByRoot.get(root) ?? [];
    members.push(record);
    membersByRoot.set(root, members);
  }

  return [...membersByRoot.values()]
    .map((members) => {
      members.sort((left, right) => sourceRecordId(left).localeCompare(sourceRecordId(right)));
      const names = [...new Set(members.map(({ name }) => name))].sort((left, right) =>
        left.localeCompare(right),
      );
      const name = canonicalNameByRoot.get(groups.find(sourceRecordId(members[0]!))) ?? names[0] ?? "";
      const aliases = [
        ...new Set(
          members.flatMap((record) => [
            ...record.aliases,
            ...(record.name === name ? [] : [record.name]),
          ]),
        ),
      ].sort((left, right) => left.localeCompare(right));
      const summaries = [
        ...new Map(
          members
            .filter((record) => record.summary)
            .map((record) => [record.summary!.text, record] as const),
        ).entries(),
      ];
      const kinds = [...new Set(members.map(({ kind }) => kind))];
      const exampleCount = new Set(
        members.flatMap((record) =>
          record.examples.map(
            (example) => `${sourceRecordId(record)}:${example.nativeId}`,
          ),
        ),
      ).size;
      return atlasEntrySchema.parse({
        name,
        aliases,
        summary:
          summaries.length === 1
            ? {
                text: summaries[0]![0],
                sourceRecordId: sourceRecordId(summaries[0]![1]),
              }
            : null,
        kind: kinds.length === 1 ? kinds[0] : "mixed",
        sourceRecordIds: members.map(sourceRecordId),
        exampleCount,
      });
    })
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) ||
        left.sourceRecordIds[0]!.localeCompare(right.sourceRecordIds[0]!),
    );
}

export function buildProviderIndex(
  snapshot: FederatedSnapshot,
): ProviderIndex {
  const recordById = new Map(
    snapshot.providers.flatMap((provider) =>
      provider.records.map((record) => [sourceRecordId(record), record] as const),
    ),
  );
  const documents: AtlasEntryDocument[] = snapshot.entries.map((entry) => {
    const records = entry.sourceRecordIds.map((id) => recordById.get(id)!);
    return {
      ...entry,
      key: entry.sourceRecordIds[0]!,
      search: {
        name: normalizeProviderSearchText(entry.name),
        aliases: normalizeProviderSearchText(entry.aliases.join(" ")),
        summaries: normalizeProviderSearchText(
          records.map((record) => record.summary?.text ?? "").join(" "),
        ),
        kinds: normalizeProviderSearchText(
          records.map((record) => record.kind).join(" "),
        ),
        nativeIds: normalizeProviderSearchText(
          records.map((record) => record.nativeId).join(" "),
        ),
        sections: normalizeProviderSearchText(
          records
            .flatMap((record) =>
              record.sections.flatMap(({ title, content }) => [
                title,
                content ?? "",
              ]),
            )
            .join(" "),
        ),
        relationships: normalizeProviderSearchText(
          records
            .flatMap((record) =>
              record.relationships.flatMap(({ label, targetTitle }) => [label, targetTitle]),
            )
            .join(" "),
        ),
      },
    };
  });

  const postings = new Map<string, Set<`${string}:${string}`>>();
  for (const document of documents) {
    const terms = new Set(Object.values(document.search).flat());
    for (const term of terms) {
      const keys = postings.get(term) ?? new Set<`${string}:${string}`>();
      keys.add(document.key);
      postings.set(term, keys);
    }
  }

  return providerIndexSchema.parse({
    schemaVersion: "2",
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
    .sort((left, right) => left.definition.id.localeCompare(right.definition.id))
    .map((input) => {
      try {
        return currentProvider(input);
      } catch (error) {
        return lastKnownGoodProvider(input, previous, error);
      }
    });
  const entries = buildAtlasEntries(providers);
  const fingerprint = sha256Canonical({ providers, entries });
  const snapshot = federatedSnapshotSchema.parse({
    schemaVersion: "2",
    assembledAt,
    fingerprint,
    providers,
    entries,
  });

  return {
    snapshot,
    index: buildProviderIndex(snapshot),
  };
}
