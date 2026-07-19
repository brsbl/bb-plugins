// @ts-nocheck

const retrievedAt = "2026-07-17T00:00:00.000Z";

const w3cDocumentLicense = Object.freeze({
  name: "W3C Document License",
  url: "https://www.w3.org/copyright/document-license/",
});

const providerDefinitions = Object.freeze({
  "aria-apg": Object.freeze({
    provider: "aria-apg",
    name: "WAI-ARIA Authoring Practices Guide",
    canonicalUrl: "https://www.w3.org/WAI/ARIA/apg/",
    upstreamRevision: "WAI-ARIA APG snapshot 2026-07-17",
    retrievedAt,
    license: w3cDocumentLicense,
    contentMode: "terms-and-paraphrase",
    status: "available",
  }),
  html: Object.freeze({
    provider: "html",
    name: "HTML Living Standard",
    canonicalUrl: "https://html.spec.whatwg.org/",
    upstreamRevision: "WHATWG Living Standard snapshot 2026-07-17",
    retrievedAt,
    license: w3cDocumentLicense,
    contentMode: "terms-and-paraphrase",
    status: "available",
  }),
});

function sourceEntry({
  provider,
  sourceId,
  name,
  aliases = [],
  description,
  canonicalUrl,
  recordType,
  legacyIds = [],
}) {
  const source = providerDefinitions[provider];
  return Object.freeze({
    id: `${provider}:${sourceId}`,
    provider,
    sourceId,
    name,
    aliases: Object.freeze([...aliases]),
    description,
    recordType,
    canonicalUrl,
    upstreamRevision: source.upstreamRevision,
    retrievedAt: source.retrievedAt,
    license: source.license,
    contentMode: source.contentMode,
    status: source.status,
    legacyIds: Object.freeze([...legacyIds]),
  });
}

const apg = (sourceId, name, aliases, description, legacyIds = [sourceId]) =>
  sourceEntry({
    provider: "aria-apg",
    sourceId,
    name,
    aliases,
    description,
    recordType: "pattern",
    canonicalUrl: `https://www.w3.org/WAI/ARIA/apg/patterns/${sourceId}/`,
    legacyIds,
  });

const html = (sourceId, name, aliases, description, anchor, legacyIds = [sourceId]) =>
  sourceEntry({
    provider: "html",
    sourceId,
    name,
    aliases,
    description,
    recordType: "element",
    canonicalUrl: `https://html.spec.whatwg.org/multipage/${anchor}`,
    legacyIds,
  });

export const nativeEntries = Object.freeze([
  apg("alert", "Alert", [], "A non-modal live region for important, time-sensitive information."),
  apg("alertdialog", "Alert dialog", ["alert dialog"], "A modal dialog that interrupts work for an acknowledgement or decision.", ["alert-dialog"]),
  apg("button", "Button", ["button widget"], "A custom button pattern with its required keyboard and state behavior."),
  apg("checkbox", "Checkbox", [], "A checkable control pattern for independent binary choices."),
  apg("combobox", "Combobox", ["autocomplete", "editable select"], "A composite input that combines text entry or selection with a related popup."),
  apg("dialog-modal", "Modal dialog", ["modal dialog"], "A dialog pattern that makes content outside the dialog inert while it is open.", ["dialog"]),
  apg("grid", "Grid", ["data grid"], "A composite widget pattern for a two-dimensional collection of interactive cells.", ["data-grid"]),
  apg("link", "Link", [], "A custom link pattern for navigation to another resource or location."),
  apg("listbox", "Listbox", [], "A list of options with a selected value or values."),
  apg("menu-button", "Menu button", [], "A button that opens a menu of actions or choices."),
  apg("menubar", "Menu and menubar", ["menu", "menubar"], "A menu pattern for commands and a persistent menubar pattern for grouped menus.", ["menu"]),
  apg("radio", "Radio group", ["radio buttons"], "A group of mutually exclusive choices represented by radio controls.", ["radio-group"]),
  apg("slider", "Slider", [], "A control pattern for choosing a value from a continuous or discrete range."),
  apg("spinbutton", "Spinbutton", ["number input"], "A text input pattern for numeric values with increment and decrement controls."),
  apg("switch", "Switch", [], "A binary on-or-off control pattern."),
  apg("tabs", "Tabs", [], "A set of related panels with one tab selected at a time."),
  apg("toolbar", "Toolbar", [], "A grouped set of controls for a shared context."),
  apg("tooltip", "Tooltip", [], "A non-modal popup that provides supplemental descriptive text for a control."),
  apg("treegrid", "Treegrid", [], "A hierarchical grid pattern with rows, columns, and expandable items."),
  apg("treeview", "Tree view", ["tree"], "A hierarchical collection of expandable and selectable items.", ["tree-view"]),
  html("a", "a element", ["anchor", "link element"], "The native hyperlink element.", "text-level-semantics.html#the-a-element", ["link"]),
  html("button", "button element", ["native button"], "The native element for an actionable button.", "form-elements.html#the-button-element", ["button"]),
  html("input", "input element", ["text input"], "The native single-control form element with type-specific behavior.", "input.html#the-input-element", ["text-field"]),
  html("select", "select element", ["native select", "dropdown"], "The native control for selecting one or more options.", "form-elements.html#the-select-element", ["select"]),
  html("textarea", "textarea element", ["text area"], "The native multi-line plain-text input element.", "form-elements.html#the-textarea-element", ["text-area"]),
].sort((left, right) => left.id.localeCompare(right.id)));

const providerRecordCounts = new Map();
for (const entry of nativeEntries) {
  providerRecordCounts.set(entry.provider, (providerRecordCounts.get(entry.provider) ?? 0) + 1);
}

export const providers = Object.freeze(
  Object.values(providerDefinitions)
    .map((provider) => Object.freeze({
      ...provider,
      recordCount: providerRecordCounts.get(provider.provider) ?? 0,
    }))
    .sort((left, right) => left.provider.localeCompare(right.provider)),
);

export function legacyCandidatesFor(target) {
  const legacyId = target.trim().toLocaleLowerCase();
  return nativeEntries.filter((entry) => entry.legacyIds.includes(legacyId));
}

export function legacyIdFromRouteEntryId(entryId) {
  return entryId.startsWith("legacy:") ? entryId.slice("legacy:".length) : null;
}

export function legacyRouteEntryId(entryId) {
  const legacyId = entryId.trim().toLocaleLowerCase();
  return legacyCandidatesFor(legacyId).length ? `legacy:${legacyId}` : null;
}
