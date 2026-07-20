import { createHash } from "node:crypto";

export const UPSTREAM_ADAPTER_CONTRACT_VERSION = 1;

export const contentModes = Object.freeze([
  "metadata-only",
  "licensed-excerpt",
]);

function fail(message) {
  throw new TypeError(`Invalid upstream adapter fixture: ${message}`);
}

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") fail(`${name} must be a non-empty string`);
  return value;
}

function stringList(value, name) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    fail(`${name} must be an array of non-empty strings`);
  }
  return Object.freeze([...value]);
}

function httpsUrl(value, name) {
  const url = new URL(requiredString(value, name));
  if (url.protocol !== "https:") fail(`${name} must use HTTPS`);
  return url;
}

/**
 * The checksum covers the exact upstream metadata payload that an adapter is
 * allowed to emit. It intentionally excludes the fixture wrapper and checksum
 * field so an offline verifier can reproduce it without network access.
 */
export function canonicalFixturePayload(fixture) {
  return JSON.stringify({
    upstreamRevision: fixture.provenance?.upstreamRevision,
    retrievedAt: fixture.provenance?.retrievedAt,
    license: fixture.license,
    document: fixture.document,
    urls: fixture.urls,
  });
}

export function fixtureChecksum(fixture) {
  return createHash("sha256")
    .update(canonicalFixturePayload(fixture), "utf8")
    .digest("hex");
}

function verifyProviderUrls(urls, provider) {
  for (const [kind, allowedTargets] of Object.entries(provider.allowedTargets)) {
    const url = httpsUrl(urls[kind], `urls.${kind}`);
    const matchesOfficialTarget = allowedTargets.some(
      ({ hostname, pathnamePrefix }) =>
        url.hostname === hostname && url.pathname.startsWith(pathnamePrefix),
    );
    if (!matchesOfficialTarget) {
      fail(`urls.${kind} must use an official ${provider.providerId} source`);
    }
  }
}

/**
 * Creates an offline-only adapter. The caller supplies already retrieved,
 * pinned JSON; this module intentionally has no network or installer surface.
 */
export function createUpstreamAdapter(provider) {
  const providerId = requiredString(provider.providerId, "provider.providerId");
  const allowedTargets = provider.allowedTargets;
  if (!allowedTargets || typeof allowedTargets !== "object") {
    fail("provider.allowedTargets must be present");
  }

  return Object.freeze({
    providerId,
    parse(fixture) {
      if (!fixture || typeof fixture !== "object") fail("fixture must be an object");
      if (fixture.contractVersion !== UPSTREAM_ADAPTER_CONTRACT_VERSION) {
        fail(`contractVersion must be ${UPSTREAM_ADAPTER_CONTRACT_VERSION}`);
      }
      if (fixture.providerId !== providerId) fail(`providerId must be ${providerId}`);

      const upstreamId = requiredString(fixture.document?.stableId, "document.stableId");
      const title = requiredString(fixture.document?.title, "document.title");
      const sections = stringList(fixture.document?.sections, "document.sections");
      const tags = stringList(fixture.document?.tags, "document.tags");
      const aliases = stringList(fixture.document?.aliases, "document.aliases");
      const upstreamRevision = requiredString(
        fixture.provenance?.upstreamRevision,
        "provenance.upstreamRevision",
      );
      const retrievedAt = requiredString(fixture.provenance?.retrievedAt, "provenance.retrievedAt");
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(retrievedAt) ||
        Number.isNaN(Date.parse(retrievedAt))
      ) {
        fail("provenance.retrievedAt must be an ISO-8601 UTC timestamp");
      }

      const licenseId = requiredString(fixture.license?.id, "license.id");
      const licenseUrl = httpsUrl(fixture.license?.url, "license.url").href;
      const contentMode = requiredString(fixture.license?.contentMode, "license.contentMode");
      if (!contentModes.includes(contentMode)) fail("license.contentMode is not supported");
      if (contentMode === "metadata-only" && "excerpt" in fixture.document) {
        fail("metadata-only fixtures cannot contain document.excerpt");
      }
      let attribution;
      if (contentMode === "licensed-excerpt") {
        requiredString(fixture.document?.excerpt, "document.excerpt");
        attribution = requiredString(fixture.license?.attribution, "license.attribution");
      }

      if (fixture.provenance?.checksum?.algorithm !== "sha256") {
        fail("provenance.checksum.algorithm must be sha256");
      }
      const declaredChecksum = requiredString(
        fixture.provenance.checksum.value,
        "provenance.checksum.value",
      );
      if (declaredChecksum !== fixtureChecksum(fixture)) {
        fail("provenance.checksum.value does not match the fixture metadata payload");
      }

      verifyProviderUrls(fixture.urls, { providerId, allowedTargets });

      return Object.freeze({
        contractVersion: UPSTREAM_ADAPTER_CONTRACT_VERSION,
        providerId,
        upstreamId,
        title,
        native: Object.freeze({ sections, tags, aliases }),
        canonicalUrls: Object.freeze({
          docs: fixture.urls.docs,
          example: fixture.urls.example,
          code: fixture.urls.code,
        }),
        provenance: Object.freeze({
          upstreamRevision,
          retrievedAt,
          checksum: Object.freeze({ algorithm: "sha256", value: declaredChecksum }),
          license: Object.freeze({
            id: licenseId,
            url: licenseUrl,
            contentMode,
            ...(attribution ? { attribution } : {}),
          }),
        }),
      });
    },
  });
}
