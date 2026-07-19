import type { SourceBrowserSnapshot } from "./source-item.js";

/**
 * Frontend-only snapshot used while the provider kernel is integrated. It is
 * deliberately small: fixtures prove rendering and accessibility contracts,
 * not source ingestion. Replace this module at the composition boundary with
 * the generated, validated provider snapshot.
 */
export const sourceBrowserFixture: SourceBrowserSnapshot = {
  providers: [
    {
      id: "aria-apg",
      name: "WAI-ARIA Authoring Practices Guide",
      homepageUrl: "https://www.w3.org/WAI/ARIA/apg/",
      adapterVersion: "fixture",
      upstream: {
        kind: "git",
        locator: "https://github.com/w3c/aria-practices",
      },
      license: {
        id: "W3C-2023",
        url: "https://www.w3.org/copyright/software-license-2023/",
        attribution: "W3C WAI-ARIA Authoring Practices Guide",
        contentMode: "excerpt",
      },
    },
    {
      id: "base-ui",
      name: "Base UI",
      homepageUrl: "https://base-ui.com/",
      adapterVersion: "fixture",
      upstream: {
        kind: "npm",
        locator: "https://www.npmjs.com/package/@base-ui-components/react",
      },
      license: {
        id: "MIT",
        url: "https://github.com/mui/base-ui/blob/master/LICENSE",
        attribution: "Base UI contributors",
        contentMode: "redistributable",
      },
    },
  ],
  items: [
    {
      id: "aria-apg:button",
      providerId: "aria-apg",
      nativeId: "button",
      title: "Button",
      canonicalUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
      contentKind: "pattern",
      aliases: ["button pattern"],
      excerpt: "A button is a widget that enables users to trigger an action.",
      sourceSection: "Button Pattern",
      sourceTags: ["keyboard", "widget"],
      links: [
        { kind: "docs", url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/" },
        { kind: "example", url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/" },
      ],
      provenance: {
        upstreamRevision: "fixture-aria-apg",
        retrievedAt: "2026-07-18",
        contentMode: "excerpt",
      },
    },
    {
      id: "base-ui:button",
      providerId: "base-ui",
      nativeId: "button",
      title: "Button",
      canonicalUrl: "https://base-ui.com/react/components/button",
      contentKind: "component",
      aliases: ["button component"],
      excerpt: "A component for triggering an action.",
      sourceSection: "Components / Button",
      sourceTags: ["react", "component"],
      links: [
        { kind: "docs", url: "https://base-ui.com/react/components/button" },
        { kind: "code", url: "https://github.com/mui/base-ui/tree/master/packages/react/src/button" },
      ],
      provenance: {
        upstreamRevision: "fixture-base-ui",
        retrievedAt: "2026-07-18",
        contentMode: "redistributable",
      },
    },
    {
      id: "aria-apg:combobox",
      providerId: "aria-apg",
      nativeId: "combobox",
      title: "Combobox",
      canonicalUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/",
      contentKind: "pattern",
      aliases: ["autocomplete"],
      excerpt: "A combobox is an input widget with an associated popup.",
      sourceSection: "Combobox Pattern",
      sourceTags: ["keyboard", "autocomplete"],
      links: [
        { kind: "docs", url: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
        { kind: "example", url: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/" },
      ],
      provenance: {
        upstreamRevision: "fixture-aria-apg",
        retrievedAt: "2026-07-18",
        contentMode: "excerpt",
      },
    },
    {
      id: "base-ui:combobox",
      providerId: "base-ui",
      nativeId: "combobox",
      title: "Combobox",
      canonicalUrl: "https://base-ui.com/react/components/combobox",
      contentKind: "component",
      aliases: ["autocomplete"],
      sourceSection: "Components / Combobox",
      sourceTags: ["react", "component"],
      links: [
        { kind: "docs", url: "https://base-ui.com/react/components/combobox" },
        { kind: "code", url: "https://github.com/mui/base-ui/tree/master/packages/react/src/combobox" },
      ],
      provenance: {
        upstreamRevision: "fixture-base-ui",
        retrievedAt: "2026-07-18",
        contentMode: "redistributable",
      },
    },
  ],
};
