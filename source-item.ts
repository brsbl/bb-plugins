/**
 * Source-native records are the boundary between provider ingestion and every
 * Atlas surface. Atlas may index this data, but must not add definitions,
 * previews, or a canonical taxonomy of its own.
 */
export interface LibraryProvider {
  id: string;
  name: string;
  homepageUrl: string;
  adapterVersion: string;
  upstream: {
    kind: "git" | "npm" | "json";
    locator: string;
  };
  license: {
    id: string;
    url: string;
    attribution?: string;
    contentMode: "metadata-only" | "excerpt" | "redistributable";
  };
}

export type SourceItemLinkKind = "docs" | "example" | "code";

export interface SourceItem {
  /** Provider id + upstream-native stable id, for example `aria-apg:combobox`. */
  id: `${string}:${string}`;
  providerId: string;
  nativeId: string;
  title: string;
  canonicalUrl: string;
  contentKind: "component" | "pattern" | "guidance" | "unknown";
  aliases: string[];
  /** Included only when the provider's license/content policy permits it. */
  excerpt?: string;
  sourceSection?: string;
  sourceTags: string[];
  links: Array<{
    kind: SourceItemLinkKind;
    url: string;
  }>;
  provenance: {
    upstreamRevision: string;
    retrievedAt: string;
    contentMode: LibraryProvider["license"]["contentMode"];
  };
}

export interface SourceBrowserSnapshot {
  providers: readonly LibraryProvider[];
  items: readonly SourceItem[];
}
