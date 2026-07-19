import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);

// ../../../plugin-sources/ui-patterns-recovered/runtime-cli.js
var categoryDefinitions = (
  /** @type {const} */
  [
    {
      name: "Actions & commands",
      scope: "Invoke, authorize, or reverse an operation."
    },
    {
      name: "Inputs & selection",
      scope: "Enter, edit, choose, or refine a value."
    },
    {
      name: "Navigation & wayfinding",
      scope: "Move between or orient within places, views, or steps."
    },
    {
      name: "Content & data",
      scope: "Inspect, compare, organize, or work with information."
    },
    {
      name: "Feedback & status",
      scope: "Understand progress, outcome, validation, or recovery."
    },
    {
      name: "Surfaces & disclosure",
      scope: "Reveal temporary, contextual, or conditional content or controls."
    },
    {
      name: "Layout & composition",
      scope: "Arrange persistent regions, panes, or a workspace."
    }
  ]
);
var categories = (
  /** @type {readonly Category[]} */
  categoryDefinitions.map(({ name }) => name)
);
var categoryTieBreakRule = "Classify by the user\u2019s primary goal in the record definition. If roles remain tied, choose the role that distinguishes the record from its see-also neighbors; structural form belongs in kind.";
var recordTypes = (
  /** @type {const} */
  ["component", "pattern"]
);
var entryKinds = (
  /** @type {const} */
  [
    "element",
    "composite",
    "surface",
    "layout",
    "behavior",
    "state",
    "flow"
  ]
);
var subjects = (
  /** @type {const} */
  ["generative-ai"]
);
var ambiguityRoutes = Object.freeze({
  dropdown: ["select", "combobox", "menu"],
  modal: ["dialog", "alert-dialog"],
  toggle: ["switch", "toggle-button"],
  tab: ["tabs", "tab-bar"],
  popup: ["popover", "menu", "tooltip", "dialog", "listbox"],
  panel: ["panel", "side-navigation", "drawer", "dialog", "split-view"],
  sidebar: ["side-navigation", "panel", "drawer"],
  alert: ["alert", "banner", "alert-dialog"],
  "progress indicator": ["progress-indicator", "spinner", "stepper"],
  table: ["table", "data-grid"],
  pill: ["badge", "tag", "chip"],
  "hamburger menu": ["button", "drawer", "menu"],
  "action sheet": ["dialog", "menu", "sheet"],
  "side sheet": ["drawer", "sheet", "panel"],
  approval: ["action-approval", "approval-workflow"],
  activity: ["activity-feed", "agent-activity", "audit-log"],
  history: ["conversation-history", "version-history", "audit-log"]
});
function defineEntries(entries2) {
  return entries2;
}
function normalizeLabel(value) {
  return value.trim().toLocaleLowerCase();
}
function catalogErrors(authoredCategories, entries2) {
  const errors = [];
  const canonicalCategories = categoryDefinitions.map(({ name }) => name);
  const categorySet = new Set(authoredCategories);
  const ids = /* @__PURE__ */ new Set();
  const names = /* @__PURE__ */ new Set();
  const labelOwners = /* @__PURE__ */ new Map();
  if (authoredCategories.length !== 7 || categorySet.size !== authoredCategories.length || authoredCategories.join("|") !== canonicalCategories.join("|")) {
    errors.push("The catalog must use the seven controlled categories in canonical order.");
  }
  if (entries2.length !== 107) {
    errors.push(`The catalog must contain exactly 107 records; found ${entries2.length}.`);
  }
  for (const entry of entries2) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      errors.push(`${entry.name || entry.id}: id must be kebab-case.`);
    }
    if (ids.has(entry.id)) errors.push(`${entry.id}: duplicate id.`);
    ids.add(entry.id);
    const normalizedName = normalizeLabel(entry.name);
    if (names.has(normalizedName)) errors.push(`${entry.name}: duplicate preferred name.`);
    names.add(normalizedName);
    if (!categorySet.has(entry.category)) errors.push(`${entry.name}: unknown category.`);
    if (!recordTypes.includes(entry.type)) errors.push(`${entry.name}: unknown record type.`);
    if (!entryKinds.includes(entry.kind)) errors.push(`${entry.name}: unknown kind.`);
    if (entry.subject !== void 0 && !subjects.includes(entry.subject)) {
      errors.push(`${entry.name}: unknown subject \u201C${entry.subject}\u201D.`);
    }
    if (!entry.description.trim() || entry.description.length > 180) {
      errors.push(`${entry.name}: description must be 1\u2013180 characters.`);
    }
    if (!entry.details.trim() || entry.details.length > 300) {
      errors.push(`${entry.name}: details must be 1\u2013300 characters.`);
    }
    if (!/[.!?]$/.test(entry.description) || !/[.!?]$/.test(entry.details)) {
      errors.push(`${entry.name}: prose fields must end with punctuation.`);
    }
    if (/[<>]/.test(`${entry.name}${entry.description}${entry.details}`)) {
      errors.push(`${entry.name}: prose fields cannot contain markup.`);
    }
    if (!Array.isArray(entry.altLabels) || entry.altLabels.length > 5) {
      errors.push(`${entry.name}: altLabels must contain at most five terms.`);
    }
    const hiddenLabels = entry.hiddenLabels ?? [];
    if (!Array.isArray(hiddenLabels) || hiddenLabels.length > 5) {
      errors.push(`${entry.name}: hiddenLabels must contain at most five terms.`);
    }
    const ownLabels = /* @__PURE__ */ new Set([normalizedName]);
    for (
      const [field, labels] of
      /** @type {const} */
      [
        ["altLabels", entry.altLabels ?? []],
        ["hiddenLabels", hiddenLabels]
      ]
    ) {
      for (const label of labels) {
        const normalized = normalizeLabel(label);
        if (!normalized) errors.push(`${entry.name}: ${field} cannot contain an empty label.`);
        if (ownLabels.has(normalized)) {
          errors.push(`${entry.name}: ${field} duplicates \u201C${label}\u201D.`);
        }
        ownLabels.add(normalized);
      }
    }
    for (const label of ownLabels) {
      const owners = labelOwners.get(label) ?? /* @__PURE__ */ new Set();
      owners.add(entry.id);
      labelOwners.set(label, owners);
    }
    const seeAlso = entry.seeAlsoIds ?? [];
    if (seeAlso.length < 1 || seeAlso.length > 5) {
      errors.push(`${entry.name}: seeAlsoIds must contain 1\u20135 directional references.`);
    }
    if (new Set(seeAlso).size !== seeAlso.length) {
      errors.push(`${entry.name}: seeAlsoIds contains a duplicate.`);
    }
    if (seeAlso.includes(entry.id)) errors.push(`${entry.name}: cannot point seeAlso to itself.`);
  }
  for (const entry of entries2) {
    for (const seeAlsoId of entry.seeAlsoIds ?? []) {
      if (!ids.has(seeAlsoId)) errors.push(`${entry.name}: unknown seeAlso id \u201C${seeAlsoId}\u201D.`);
    }
  }
  for (const [label, owners] of labelOwners) {
    if (owners.size < 2) continue;
    const route = ambiguityRoutes[label];
    const actual = [...owners].sort();
    const routed = route ? [...route].filter((id) => owners.has(id)).sort() : [];
    if (!route || actual.join("|") !== routed.join("|")) {
      errors.push(`Label \u201C${label}\u201D has an unrouted collision: ${actual.join(", ")}.`);
    }
  }
  for (const [query, routedIds] of Object.entries(ambiguityRoutes)) {
    if (query !== normalizeLabel(query)) {
      errors.push(`Ambiguity route \u201C${query}\u201D must be normalized.`);
    }
    if (routedIds.length < 2 || new Set(routedIds).size !== routedIds.length) {
      errors.push(`Ambiguity route \u201C${query}\u201D must contain at least two unique IDs.`);
      continue;
    }
    const routedEntries = routedIds.map((id) => entries2.find((entry) => entry.id === id)).filter((entry) => entry !== void 0);
    if (routedEntries.length !== routedIds.length) {
      errors.push(`Ambiguity route \u201C${query}\u201D points to an unknown ID.`);
      continue;
    }
    if (new Set(routedEntries.map((entry) => entry.details)).size !== routedEntries.length) {
      errors.push(`Ambiguity route \u201C${query}\u201D must point to records with distinct boundaries.`);
    }
  }
  return errors;
}
function assertValidCatalog(authoredCategories, entries2) {
  const errors = catalogErrors(authoredCategories, entries2);
  if (errors.length) throw new Error(`Invalid UI pattern catalog:
- ${errors.join("\n- ")}`);
}
var categories2 = categories;
var typeLabels = {
  all: "All",
  component: "Components",
  pattern: "Patterns"
};
var kindLabels = {
  element: "Element",
  composite: "Composite",
  surface: "Surface",
  layout: "Layout",
  behavior: "Behavior",
  state: "State",
  flow: "Flow"
};
var kindOverrides = {
  "button-group": "composite",
  toolbar: "composite",
  "command-palette": "composite",
  combobox: "composite",
  "segmented-control": "composite",
  "date-picker": "composite",
  "search-field": "composite",
  "navigation-bar": "composite",
  "side-navigation": "composite",
  "navigation-rail": "composite",
  pagination: "composite",
  stepper: "composite",
  "tab-bar": "composite",
  listbox: "composite",
  "data-grid": "composite",
  "tree-view": "composite",
  accordion: "composite",
  header: "layout",
  card: "surface",
  dialog: "surface",
  "alert-dialog": "surface",
  popover: "surface",
  tooltip: "surface",
  menu: "surface",
  drawer: "surface",
  sheet: "surface",
  panel: "layout",
  "split-view": "layout",
  "form-validation": "behavior",
  "search-and-filtering": "behavior",
  "filter-bar": "behavior",
  sorting: "behavior",
  "master-detail": "behavior",
  "bulk-selection-and-actions": "behavior",
  notifications: "behavior",
  "empty-state": "state",
  "loading-state": "state",
  form: "flow",
  "multi-step-flow": "flow",
  "ai-composer": "composite",
  "artifact-preview": "surface",
  "conversation-history": "surface",
  "workspace-switcher": "composite",
  "kanban-board": "layout",
  dashboard: "layout",
  "comment-thread": "composite",
  "notification-center": "surface",
  "permission-matrix": "composite",
  "rule-builder": "composite",
  "prompt-suggestions": "behavior",
  "ai-feature-entry": "behavior",
  "streaming-response": "state",
  "response-regeneration": "behavior",
  "grounded-answer": "behavior",
  "context-attachment": "behavior",
  "follow-up-question": "flow",
  "agent-activity": "state",
  "action-approval": "flow",
  "change-preview": "flow",
  "agent-management": "flow",
  "ai-failure-recovery": "behavior",
  "ai-feedback": "behavior",
  "memory-controls": "behavior",
  "saved-view": "behavior",
  "onboarding-checklist": "flow",
  "collaborative-presence": "state",
  "inline-editing": "behavior",
  "record-detail": "layout",
  "approval-workflow": "flow",
  "review-queue": "layout",
  "role-management": "flow",
  "import-workflow": "flow",
  "draft-autosave": "state",
  "version-history": "behavior",
  "impersonation-banner": "state",
  "admin-console": "layout"
};
function withKind(entry) {
  const kind = (
    /** @type {EntryKind} */
    kindOverrides[entry.id] ?? (entry.type === "component" ? "element" : "behavior")
  );
  return { ...entry, kind };
}
var rawEntries = (
  /** @type {Omit<PatternEntry, "kind">[]} */
  [
    {
      id: "button",
      name: "Button",
      altLabels: ["action button", "push button"],
      hiddenLabels: ["CTA", "icon button", "floating action button", "FAB"],
      type: "component",
      category: "Actions & commands",
      description: "Triggers a discrete action from a clear, labeled control.",
      details: "Use a concise action label. Icon-only and floating variants remain buttons when they perform the same primary job.",
      seeAlsoIds: ["button-group", "link", "toolbar"]
    },
    {
      id: "toggle-button",
      name: "Toggle button",
      altLabels: ["pressed button", "stateful button"],
      type: "component",
      category: "Actions & commands",
      description: "A button that stays pressed or unpressed to show whether an action mode is active.",
      details: "Use for a persistent action state such as mute or bold. Use Switch for an on/off setting and Checkbox for selecting an option.",
      seeAlsoIds: ["button", "switch", "segmented-control"]
    },
    {
      id: "link",
      name: "Link",
      altLabels: ["text link", "hyperlink"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Moves someone to another place, resource, or view.",
      details: "Use a Link for navigation and a Button for an action that changes state, submits work, or opens a process.",
      seeAlsoIds: ["button", "breadcrumb"]
    },
    {
      id: "button-group",
      name: "Button group",
      altLabels: ["action group", "button set"],
      type: "component",
      category: "Actions & commands",
      description: "Keeps a small set of related actions together.",
      details: "Use when the actions share a local context. Use a Toolbar when the group forms a command region with broader tools.",
      seeAlsoIds: ["button", "toolbar", "segmented-control"]
    },
    {
      id: "toolbar",
      name: "Toolbar",
      altLabels: ["command bar", "action bar"],
      type: "component",
      category: "Actions & commands",
      description: "A persistent row of commands for a view, object, or editor.",
      details: "Toolbars organize several commands, often with grouping and overflow. They are not a substitute for primary navigation.",
      seeAlsoIds: ["button-group", "command-palette", "menu"]
    },
    {
      id: "command-palette",
      name: "Command palette",
      altLabels: ["command menu", "quick open", "command launcher"],
      type: "component",
      category: "Actions & commands",
      description: "A searchable overlay for finding and running commands quickly.",
      details: "Use for broad keyboard-first command access. A Menu exposes a smaller, contextual command list without search.",
      seeAlsoIds: ["menu", "search-field", "toolbar"]
    },
    {
      id: "text-field",
      name: "Text field",
      altLabels: ["text input", "input", "single-line input"],
      type: "component",
      category: "Inputs & selection",
      description: "Accepts a short, single-line text value.",
      details: "Pair with a visible label and helpful validation. Use a Text area when people need to write across multiple lines.",
      seeAlsoIds: ["text-area", "search-field", "combobox"]
    },
    {
      id: "text-area",
      name: "Text area",
      altLabels: ["textarea", "multiline input"],
      type: "component",
      category: "Inputs & selection",
      description: "Accepts longer, multi-line written content.",
      details: "Use for messages, notes, and descriptions. Keep expected length and any character limit clear near the field.",
      seeAlsoIds: ["text-field", "form"]
    },
    {
      id: "checkbox",
      name: "Checkbox",
      altLabels: [],
      hiddenLabels: ["check box"],
      type: "component",
      category: "Inputs & selection",
      description: "Lets a person independently include or exclude one or more options.",
      details: "Use Checkbox for independent, often multi-select choices. Use a Radio group when exactly one option is required.",
      seeAlsoIds: ["radio-group", "switch", "bulk-selection-and-actions"]
    },
    {
      id: "radio-group",
      name: "Radio group",
      altLabels: ["radio buttons", "radio button group"],
      type: "component",
      category: "Inputs & selection",
      description: "Presents a small, visible set of mutually exclusive choices.",
      details: "Use when people should compare the available options at once. Use Select for a compact fixed-value choice.",
      seeAlsoIds: ["checkbox", "select", "segmented-control"]
    },
    {
      id: "switch",
      name: "Switch",
      altLabels: ["toggle switch"],
      type: "component",
      category: "Inputs & selection",
      description: "Turns a setting or state on or off.",
      details: "A Switch represents an immediate binary state. Use Checkbox for selected items or choices that are usually saved with a form.",
      seeAlsoIds: ["checkbox", "form", "toggle-button"]
    },
    {
      id: "select",
      name: "Select",
      altLabels: ["select menu"],
      hiddenLabels: ["drop-down list"],
      type: "component",
      category: "Inputs & selection",
      description: "Lets a person choose one fixed value from a compact list.",
      details: "Choose a fixed value; use Combobox when typing filters or suggests options, and Menu for commands.",
      seeAlsoIds: ["combobox", "listbox", "menu", "radio-group"]
    },
    {
      id: "combobox",
      name: "Combobox",
      altLabels: ["autocomplete", "typeahead", "searchable select"],
      hiddenLabels: ["combo box"],
      type: "component",
      category: "Inputs & selection",
      description: "An input with an associated list of suggested or matching choices.",
      details: "Use when typing filters or suggests options. Use Select for a fixed compact choice and Menu for commands, not values.",
      seeAlsoIds: ["select", "listbox", "menu", "search-field", "text-field"]
    },
    {
      id: "listbox",
      name: "Listbox",
      altLabels: ["option list", "selection list"],
      type: "component",
      category: "Inputs & selection",
      description: "Presents a list of options from which one or more values can be selected.",
      details: "Use for the option list itself, often within a Combobox. Use Menu for commands and Select for the complete compact field.",
      seeAlsoIds: ["combobox", "select", "menu"]
    },
    {
      id: "segmented-control",
      name: "Segmented control",
      altLabels: ["segmented buttons", "segmented button"],
      type: "component",
      category: "Inputs & selection",
      description: "A compact set of adjacent options for switching a value or view.",
      details: "Use only for a few short, peer options. Tabs represent navigation between related content panels rather than a generic value choice.",
      seeAlsoIds: ["radio-group", "tabs", "button-group"]
    },
    {
      id: "slider",
      name: "Slider",
      altLabels: ["range input", "trackbar"],
      type: "component",
      category: "Inputs & selection",
      description: "Adjusts a value within a known numeric range.",
      details: "Use when approximate, visual adjustment is useful. Provide an exact value control when precision or direct entry matters.",
      seeAlsoIds: ["text-field", "form"]
    },
    {
      id: "date-picker",
      name: "Date picker",
      altLabels: ["date selector", "calendar picker"],
      type: "component",
      category: "Inputs & selection",
      description: "Helps someone enter or choose a calendar date.",
      details: "Support typed entry as well as calendar selection, with unambiguous formatting and keyboard access.",
      seeAlsoIds: ["text-field", "form"]
    },
    {
      id: "file-upload",
      name: "File upload",
      altLabels: ["file input", "attachment", "uploader"],
      type: "component",
      category: "Inputs & selection",
      description: "Lets someone add a file to the current task or record.",
      details: "Communicate permitted file types, size limits, progress, and failure states before and during upload.",
      seeAlsoIds: ["progress-indicator", "form", "alert"]
    },
    {
      id: "search-field",
      name: "Search field",
      altLabels: ["search box", "query input"],
      type: "component",
      category: "Inputs & selection",
      description: "Accepts a query for finding content, records, or commands.",
      details: "A Search field captures a query. Combobox adds an associated choice list; a Command palette searches executable commands.",
      seeAlsoIds: ["combobox", "command-palette", "search-and-filtering"]
    },
    {
      id: "header",
      name: "Header",
      altLabels: ["app header", "app bar", "top app bar", "banner landmark", "site banner"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "The top-level region that orients people and carries global controls.",
      details: "A site-wide Header may provide the HTML banner landmark. Keep it distinct from page-local toolbars and content headings.",
      seeAlsoIds: ["navigation-bar", "toolbar", "breadcrumb"]
    },
    {
      id: "navigation-bar",
      name: "Navigation bar",
      altLabels: ["nav bar", "primary navigation"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "A primary set of links for moving among major destinations.",
      details: "Use for a small set of top-level destinations. Side navigation serves the same job when a vertical, persistent layout fits better.",
      seeAlsoIds: ["side-navigation", "header", "tabs", "tab-bar"]
    },
    {
      id: "side-navigation",
      name: "Side navigation",
      altLabels: ["side nav", "navigation sidebar"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "A vertical navigation region for moving among destinations or sections.",
      details: "A navigation sidebar is for wayfinding. Use Panel for a non-navigation content pane, and Drawer for a temporary navigation surface.",
      seeAlsoIds: ["panel", "drawer", "navigation-bar", "navigation-rail"]
    },
    {
      id: "navigation-rail",
      name: "Navigation rail",
      altLabels: ["nav rail"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "A compact vertical strip for primary navigation, often led by icons.",
      details: "Use when persistent side navigation needs a narrow footprint. Expand to Side navigation when labels and hierarchy need more space.",
      seeAlsoIds: ["side-navigation", "navigation-bar"]
    },
    {
      id: "breadcrumb",
      name: "Breadcrumb",
      altLabels: ["breadcrumbs", "breadcrumb trail"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Shows the current location within a hierarchy and links back through it.",
      details: "Use for location context in deep structures. It supplements, rather than replaces, primary navigation.",
      seeAlsoIds: ["navigation-bar", "header", "link"]
    },
    {
      id: "tabs",
      name: "Tabs",
      altLabels: ["tabbed interface"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Switches among closely related views or content panels at the same level.",
      details: "Use concise peer labels and preserve context between panels. Use Segmented control for a compact value or view setting without tab-panel semantics.",
      seeAlsoIds: ["segmented-control", "navigation-bar", "tab-bar"]
    },
    {
      id: "tab-bar",
      name: "Tab bar",
      altLabels: ["bottom navigation", "bottom navigation bar"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "A persistent row of destinations for switching among an app\u2019s top-level sections.",
      details: "Use for a small set of peer destinations, commonly on mobile. Use Tabs for related panels within one context.",
      seeAlsoIds: ["tabs", "navigation-bar", "navigation-rail"]
    },
    {
      id: "pagination",
      name: "Pagination",
      altLabels: ["pager", "page navigation"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Moves through a finite, ordered set of content pages.",
      details: "Make the current page and available movement explicit. Use when stable page boundaries or direct navigation to a known page matter.",
      seeAlsoIds: ["table", "list"]
    },
    {
      id: "stepper",
      name: "Step indicator",
      altLabels: ["progress steps", "wizard steps"],
      hiddenLabels: ["stepper"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Shows progress and movement through a defined sequence of steps.",
      details: "Use for progress or navigation within a multi-step flow. A numeric stepper is an increment-and-decrement input, not this component.",
      seeAlsoIds: ["multi-step-flow", "progress-indicator"]
    },
    {
      id: "avatar",
      name: "Avatar",
      altLabels: ["profile image", "user avatar"],
      type: "component",
      category: "Content & data",
      description: "Represents a person, account, or entity with an image, initials, or fallback mark.",
      details: "Always provide an accessible name nearby or through the surrounding context; the image alone should not carry essential identity.",
      seeAlsoIds: ["badge", "list"]
    },
    {
      id: "badge",
      name: "Badge",
      altLabels: ["count badge", "status badge", "notification badge"],
      type: "component",
      category: "Content & data",
      description: "A small count or status indicator, often attached to another element.",
      details: "Badge communicates a concise count or status. Use Tag for metadata labels and Chip for compact selectable or removable items.",
      seeAlsoIds: ["tag", "chip", "notifications"]
    },
    {
      id: "tag",
      name: "Tag",
      altLabels: ["label", "metadata tag"],
      type: "component",
      category: "Content & data",
      description: "A compact label that classifies or describes content.",
      details: "Tag is metadata. Use Chip when the item can be selected or removed, and Badge for a count or status attached to something else.",
      seeAlsoIds: ["chip", "badge", "filter-bar"]
    },
    {
      id: "chip",
      name: "Chip",
      altLabels: ["token", "filter chip", "input chip"],
      type: "component",
      category: "Inputs & selection",
      description: "A compact item representing a selected value, filter, or removable input.",
      details: "Chip has an interaction or selection role. Use Tag for passive metadata labels and Badge for a small attached status or count.",
      seeAlsoIds: ["tag", "badge", "filter-bar"]
    },
    {
      id: "card",
      name: "Card",
      altLabels: ["content card", "tile"],
      type: "component",
      category: "Content & data",
      description: "A bounded container that groups related content and actions around one subject.",
      details: "Use when each group can stand as a distinct, scannable unit. Avoid cards when a simple list or table better supports comparison.",
      seeAlsoIds: ["list", "table", "panel"]
    },
    {
      id: "list",
      name: "List",
      altLabels: ["item list", "collection"],
      type: "component",
      category: "Content & data",
      description: "Presents a linear collection of related items.",
      details: "Use when people scan items in sequence. Use Table for aligned fields and Data grid for interactive tabular work.",
      seeAlsoIds: ["table", "data-grid", "master-detail"]
    },
    {
      id: "table",
      name: "Table",
      altLabels: ["data table", "tabular data"],
      type: "component",
      category: "Content & data",
      description: "Displays structured values in aligned rows and columns.",
      details: "Use for readable tabular display. Use Data grid when people need richer interactive behaviors such as selection, editing, or complex keyboard navigation.",
      seeAlsoIds: ["data-grid", "list", "sorting"]
    },
    {
      id: "data-grid",
      name: "Data grid",
      altLabels: ["grid", "interactive table"],
      type: "component",
      category: "Content & data",
      description: "An interactive tabular structure for working with structured data.",
      details: "Grid refers to interactive, tabular data here. Use Table for plain display, and avoid using the term for layout in this library.",
      seeAlsoIds: ["table", "bulk-selection-and-actions", "sorting"]
    },
    {
      id: "tree-view",
      name: "Tree view",
      altLabels: ["tree", "hierarchy view"],
      type: "component",
      category: "Content & data",
      description: "Shows nested items that can be expanded and collapsed.",
      details: "Use when hierarchy is essential to scanning or navigation. Use Accordion for stacked disclosure sections without a general hierarchy.",
      seeAlsoIds: ["accordion", "disclosure", "side-navigation"]
    },
    {
      id: "icon",
      name: "Icon",
      altLabels: ["glyph", "symbol"],
      type: "component",
      category: "Content & data",
      description: "A compact visual symbol that supports recognition and scanning.",
      details: "Do not rely on an Icon alone for essential meaning unless it has an accessible name and is familiar in its context.",
      seeAlsoIds: ["button", "tooltip"]
    },
    {
      id: "alert",
      name: "Inline alert",
      altLabels: ["message bar", "inline notification", "callout"],
      type: "component",
      category: "Feedback & status",
      description: "Contextual feedback displayed near the task, content, or value it concerns.",
      details: "Use for local feedback that should remain visible. Use Banner for broad context, Toast for temporary confirmation, and Alert dialog when a response is required.",
      seeAlsoIds: ["banner", "toast", "alert-dialog", "form-validation"]
    },
    {
      id: "banner",
      name: "Banner",
      altLabels: ["announcement bar", "site notice", "global notice", "notification banner"],
      type: "component",
      category: "Feedback & status",
      description: "A prominent message that applies broadly to a page, product, or service.",
      details: "Use for broad announcements or persistent system context. This visual pattern is distinct from the ARIA banner landmark used by a site header.",
      seeAlsoIds: ["alert", "toast", "notifications"]
    },
    {
      id: "toast",
      name: "Toast",
      altLabels: ["snackbar", "transient notification", "notification toast"],
      type: "component",
      category: "Feedback & status",
      description: "A temporary, non-critical message confirming a recent event or change.",
      details: "Do not use for essential information or a required response. Use Inline alert for persistent local feedback and Alert dialog when a response is required.",
      seeAlsoIds: ["alert", "banner", "alert-dialog", "notifications"]
    },
    {
      id: "progress-indicator",
      name: "Progress bar",
      altLabels: ["determinate progress", "linear progress indicator"],
      type: "component",
      category: "Feedback & status",
      description: "Shows measured progress toward a known completion point.",
      details: "Use when a meaningful completion amount can be reported. Use Spinner for indeterminate activity and Step indicator for a task sequence.",
      seeAlsoIds: ["spinner", "stepper", "loading-state", "file-upload"]
    },
    {
      id: "spinner",
      name: "Spinner",
      altLabels: ["activity indicator", "loading spinner"],
      type: "component",
      category: "Feedback & status",
      description: "Signals that work is in progress when completion cannot be measured.",
      details: "Pair with an accessible status message. Use Progress bar when a meaningful completion amount is available.",
      seeAlsoIds: ["progress-indicator", "skeleton", "loading-state"]
    },
    {
      id: "skeleton",
      name: "Skeleton",
      altLabels: ["skeleton loader", "placeholder UI"],
      type: "component",
      category: "Feedback & status",
      description: "A temporary shape that reserves the layout of loading content.",
      details: "Use to reduce layout shift while content loads. Keep the state brief and expose an accessible loading status separately.",
      seeAlsoIds: ["spinner", "loading-state", "card"]
    },
    {
      id: "dialog",
      name: "Dialog",
      altLabels: ["modal", "modal dialog", "dialog box", "modal window"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A focused surface for a task, decision, or information that needs attention.",
      details: "Modal describes blocking behavior, not a separate component. A Dialog may be modal or non-modal. Use Alert dialog only for a brief, urgent message that requires a response.",
      seeAlsoIds: ["alert-dialog", "popover", "toast"]
    },
    {
      id: "alert-dialog",
      name: "Alert dialog",
      altLabels: ["urgent dialog"],
      hiddenLabels: ["alertdialog"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A modal dialog for a brief, important message that requires an immediate response.",
      details: "Use sparingly when interruption is necessary. Use Dialog for routine confirmation, longer tasks, or non-urgent information.",
      seeAlsoIds: ["dialog", "alert", "button"]
    },
    {
      id: "popover",
      name: "Popover",
      altLabels: ["flyout", "contextual popup", "popup"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "An anchored, non-blocking surface for contextual content or controls.",
      details: "Use for contextual, often structured content. Tooltip is brief plain-text help; Dialog takes focus for a task that needs stronger attention.",
      seeAlsoIds: ["tooltip", "dialog", "menu"]
    },
    {
      id: "tooltip",
      name: "Tooltip",
      altLabels: ["hover tooltip", "hint"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "Brief, nonessential plain-text help associated with a control or label.",
      details: "Use Tooltip for concise supplemental help. Interactive or structured content belongs in a Popover, and essential instructions should be visible without hover.",
      seeAlsoIds: ["popover", "icon"]
    },
    {
      id: "menu",
      name: "Menu",
      altLabels: ["context menu", "overflow menu", "dropdown menu"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A compact list of commands or actions in a local context.",
      details: "Use Menu for commands. Use Select for fixed values and Combobox when typing filters or suggests choices; \u201Cdropdown\u201D can refer to all three.",
      seeAlsoIds: ["select", "combobox", "listbox", "popover", "toolbar"]
    },
    {
      id: "drawer",
      name: "Drawer",
      altLabels: ["navigation drawer", "side drawer"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A temporary edge-originating navigation surface.",
      details: "Use for temporary navigation. Use Side navigation when navigation remains in the layout, and Bottom sheet for temporary supporting content.",
      seeAlsoIds: ["side-navigation", "sheet", "panel"]
    },
    {
      id: "sheet",
      name: "Bottom sheet",
      altLabels: ["sheet", "modal bottom sheet"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A temporary surface that rises from the bottom edge for a focused task or supporting content.",
      details: "Use for a short, contextual task on a constrained viewport. Use Drawer for side-originating navigation and Dialog for an interruptive decision.",
      seeAlsoIds: ["drawer", "dialog", "panel"]
    },
    {
      id: "accordion",
      name: "Accordion",
      altLabels: ["collapsible sections"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A stack of disclosure sections that expand and collapse independently or in coordination.",
      details: "Use Accordion for multiple stacked sections. Use Disclosure for a single reveal/hide control or region.",
      seeAlsoIds: ["disclosure", "tree-view"]
    },
    {
      id: "disclosure",
      name: "Disclosure",
      altLabels: ["show/hide", "expand/collapse", "disclosure widget"],
      type: "component",
      category: "Surfaces & disclosure",
      description: "A control or region that reveals and hides a single block of additional content.",
      details: "Use Disclosure for one local reveal/hide relationship. Use Accordion when several stacked sections are involved.",
      seeAlsoIds: ["accordion", "tree-view"]
    },
    {
      id: "divider",
      name: "Divider",
      altLabels: ["separator", "rule"],
      type: "component",
      category: "Layout & composition",
      description: "A subtle visual boundary between related groups or sections.",
      details: "Use sparingly to clarify grouping. Prefer spacing and headings when they communicate structure more clearly.",
      seeAlsoIds: ["panel", "list"]
    },
    {
      id: "panel",
      name: "Panel",
      altLabels: ["pane", "content pane"],
      type: "component",
      category: "Layout & composition",
      description: "An in-layout region for supporting, inspectable, or adjacent content.",
      details: "Panel is a non-navigation content pane. Use Side navigation for a navigation sidebar and Bottom sheet for a temporary bottom-edge surface.",
      seeAlsoIds: ["side-navigation", "sheet", "split-view", "card"]
    },
    {
      id: "split-view",
      name: "Split view",
      altLabels: ["split pane", "resizable panes"],
      type: "component",
      category: "Layout & composition",
      description: "Places two coordinated panes side by side, sometimes with a resizable divider.",
      details: "Use when both contexts need to remain visible together. Master-detail is the matching interaction pattern for a list and selected record.",
      seeAlsoIds: ["panel", "master-detail", "divider"]
    },
    {
      id: "form",
      name: "Form",
      altLabels: ["data-entry form", "form flow"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Organizes related fields so someone can enter, review, and submit information.",
      details: "Group fields by task, make labels and requirements clear, and give people a reliable submission outcome.",
      seeAlsoIds: ["form-validation", "text-field", "button"]
    },
    {
      id: "form-validation",
      name: "Form validation",
      altLabels: ["inline validation", "error summary", "field error"],
      type: "pattern",
      category: "Feedback & status",
      description: "Helps someone identify, understand, and correct form errors.",
      details: "Combine field-level messages with a summary when errors are numerous or difficult to find. Preserve entered values whenever possible.",
      seeAlsoIds: ["form", "alert", "text-field"]
    },
    {
      id: "search-and-filtering",
      name: "Search and filtering",
      altLabels: ["faceted search", "query refinement"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Lets people narrow a collection with a query and selected criteria.",
      details: "Keep the active query and filters visible, reversible, and reflected in the resulting collection.",
      seeAlsoIds: ["search-field", "filter-bar", "sorting"]
    },
    {
      id: "filter-bar",
      name: "Filter bar",
      altLabels: ["filter toolbar", "facets"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Groups visible controls for narrowing the current collection.",
      details: "Show active filters and make them easy to remove or clear. It supports Search and filtering rather than replacing it.",
      seeAlsoIds: ["search-and-filtering", "chip", "sorting"]
    },
    {
      id: "sorting",
      name: "Sorting",
      altLabels: ["sort controls", "sort order"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Lets people reorder a collection by a chosen criterion and direction.",
      details: "Make the active criterion and order explicit, and retain it while someone refines the same collection.",
      seeAlsoIds: ["filter-bar", "search-and-filtering", "table"]
    },
    {
      id: "multi-step-flow",
      name: "Multi-step flow",
      altLabels: ["wizard", "step-by-step flow"],
      type: "pattern",
      category: "Navigation & wayfinding",
      description: "Guides someone through a sequence of dependent tasks or decisions.",
      details: "Break work into meaningful stages, preserve progress, and make the current step and recovery path clear.",
      seeAlsoIds: ["stepper", "form", "progress-indicator"]
    },
    {
      id: "master-detail",
      name: "Master-detail",
      altLabels: ["list-detail", "list and detail"],
      type: "pattern",
      category: "Layout & composition",
      description: "Pairs a collection of items with a focused view of the selected item.",
      details: "Maintain the list context while updating the detail region. A Split view provides the layout; this pattern defines the selection relationship.",
      seeAlsoIds: ["split-view", "list", "panel"]
    },
    {
      id: "bulk-selection-and-actions",
      name: "Bulk selection and actions",
      altLabels: ["batch actions", "bulk edit"],
      type: "pattern",
      category: "Actions & commands",
      description: "Lets someone select several records and act on them together.",
      details: "Keep selection state, the selected count, and the scope of each action visible before a change is applied.",
      seeAlsoIds: ["checkbox", "toolbar", "data-grid"]
    },
    {
      id: "empty-state",
      name: "Empty state",
      altLabels: ["zero state", "blank slate"],
      type: "pattern",
      category: "Feedback & status",
      description: "Explains why a view has no content and what can happen next.",
      details: "Distinguish a first-use empty state from a filtered no-results state, and offer one clear next action when it is useful.",
      seeAlsoIds: ["search-and-filtering", "alert", "loading-state"]
    },
    {
      id: "loading-state",
      name: "Loading state",
      altLabels: ["pending state", "initial loading"],
      type: "pattern",
      category: "Feedback & status",
      description: "Communicates that a view or action is still working and what remains stable while it does.",
      details: "Use a stable layout and a clear status. Skeleton, Spinner, and Progress bar are component choices within this pattern.",
      seeAlsoIds: ["skeleton", "spinner", "progress-indicator"]
    },
    {
      id: "notifications",
      name: "Notifications",
      altLabels: ["notification strategy", "message hierarchy"],
      type: "pattern",
      category: "Feedback & status",
      description: "Chooses the right message channel, urgency, persistence, and timing for system feedback.",
      details: "Match urgency and persistence: Inline alert for local context, Banner for broad context, Toast for temporary confirmation, and Alert dialog only when a response is required.",
      seeAlsoIds: ["alert", "banner", "toast", "dialog"]
    },
    {
      id: "ai-composer",
      name: "AI composer",
      altLabels: ["prompt box", "prompt input", "chat composer", "AI input"],
      type: "component",
      category: "Inputs & selection",
      description: "A compound input for prompts, context, attachments, and generation controls.",
      details: "Use when an AI request may combine written intent with files or selected context. Keep send, stop, and attachment states explicit.",
      subject: "generative-ai",
      seeAlsoIds: ["text-area", "context-attachment", "prompt-suggestions", "streaming-response", "file-upload"]
    },
    {
      id: "prompt-suggestions",
      name: "Prompt suggestions",
      altLabels: ["support prompts", "prompt starters", "example prompts"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Offers example requests that reveal useful ways to begin working with an AI system.",
      details: "Use a small, contextual set to teach capability without implying that only the examples are supported. Replace or remove them after use.",
      subject: "generative-ai",
      seeAlsoIds: ["ai-composer", "ai-feature-entry", "follow-up-question"]
    },
    {
      id: "ai-label",
      name: "AI label",
      altLabels: ["AI disclosure", "AI indicator", "generative AI label"],
      type: "component",
      category: "Feedback & status",
      description: "Marks content or functionality that was generated, transformed, or recommended by AI.",
      details: "Use a consistent accessible label as a path to concise explanation, not as decoration or as the control that triggers an AI action.",
      subject: "generative-ai",
      seeAlsoIds: ["popover", "grounded-answer", "artifact-preview", "ai-feedback"]
    },
    {
      id: "ai-feature-entry",
      name: "AI feature entry point",
      altLabels: ["AI ingress", "assistant entry point", "AI launch point"],
      type: "pattern",
      category: "Actions & commands",
      description: "A consistent control that lets someone intentionally enter an AI-assisted experience.",
      details: "Place it where the capability is relevant and make the outcome clear. Do not interrupt work merely to advertise AI.",
      subject: "generative-ai",
      seeAlsoIds: ["button", "ai-composer", "prompt-suggestions", "command-palette"]
    },
    {
      id: "streaming-response",
      name: "Streaming response",
      altLabels: ["response streaming", "token streaming", "generating response"],
      type: "pattern",
      category: "Feedback & status",
      description: "Reveals an AI response incrementally while generation is still in progress.",
      details: "Keep the changing region stable, announce status accessibly, and provide Stop when waiting or an unwanted direction has meaningful cost.",
      subject: "generative-ai",
      seeAlsoIds: ["loading-state", "spinner", "ai-composer", "agent-activity"]
    },
    {
      id: "response-regeneration",
      name: "Response regeneration",
      altLabels: ["regenerate response", "retry response", "try another answer"],
      type: "pattern",
      category: "Actions & commands",
      description: "Requests an alternative AI output while preserving the original request and relevant context.",
      details: "Keep prior outputs recoverable when comparison matters, and distinguish retrying a failure from intentionally asking for a new variation.",
      subject: "generative-ai",
      seeAlsoIds: ["ai-feedback", "ai-failure-recovery", "streaming-response", "button"]
    },
    {
      id: "grounded-answer",
      name: "Cited AI response",
      altLabels: ["cited answer", "answer with sources", "AI response citations"],
      hiddenLabels: ["grounded answer", "source-grounded response"],
      type: "pattern",
      category: "Content & data",
      description: "Connects an AI response to sources or records that people can inspect alongside its claims.",
      details: "Keep citations close to supported claims and provide a scannable source list. Citations expose provenance; they do not prove that the response is correct.",
      subject: "generative-ai",
      seeAlsoIds: ["ai-label", "artifact-preview", "popover", "ai-feedback"]
    },
    {
      id: "context-attachment",
      name: "Context attachment",
      altLabels: ["context picker", "attach context", "add context"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Lets someone select files, records, or services that an AI system may use for a request.",
      details: "Show exactly what is attached, its access scope, and how to remove it. Confirm what the system understood before consequential work.",
      subject: "generative-ai",
      seeAlsoIds: ["file-upload", "chip", "ai-composer", "follow-up-question", "memory-controls"]
    },
    {
      id: "follow-up-question",
      name: "Follow-up question",
      altLabels: ["clarification request", "agent question", "input request"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Asks for missing information only when an AI system needs it to continue accurately.",
      details: "Explain why the input matters and match the control to the answer type. Avoid asking for information already available in context.",
      subject: "generative-ai",
      seeAlsoIds: ["form", "ai-composer", "context-attachment", "action-approval"]
    },
    {
      id: "artifact-preview",
      name: "Artifact preview",
      altLabels: ["AI artifact", "generated artifact", "canvas preview", "inline preview"],
      type: "component",
      category: "Content & data",
      description: "Presents an AI-generated document, image, code result, or workflow as an inspectable object.",
      details: "Use inline preview for quick recognition and actions; use an adjacent canvas when the artifact needs sustained review, editing, or interaction.",
      subject: "generative-ai",
      seeAlsoIds: ["card", "split-view", "change-preview", "ai-label", "ai-composer"]
    },
    {
      id: "agent-activity",
      name: "Agent activity",
      altLabels: ["agent steps", "tool activity", "activity summary", "agent progress"],
      type: "pattern",
      category: "Feedback & status",
      description: "Shows the observable steps, tools, statuses, and outcomes of delegated AI work.",
      details: "Expose concise progress and failures with optional details, plus Stop or another intervention when ongoing work has meaningful cost. Summarize observable work rather than presenting hidden chain-of-thought as fact.",
      subject: "generative-ai",
      seeAlsoIds: ["progress-indicator", "streaming-response", "audit-log", "action-approval", "ai-failure-recovery"]
    },
    {
      id: "action-approval",
      name: "Action approval",
      altLabels: ["tool approval", "agent authorization", "human approval", "user authorized action"],
      type: "pattern",
      category: "Actions & commands",
      description: "Pauses an AI-initiated mutation so a person can review its scope and authorize execution.",
      details: "Show the exact action, affected objects, reversibility, and risk before approval. Require stronger confirmation for serious or permanent changes.",
      subject: "generative-ai",
      seeAlsoIds: ["alert-dialog", "change-preview", "approval-workflow", "agent-activity", "audit-log"]
    },
    {
      id: "change-preview",
      name: "Change preview",
      altLabels: ["AI diff", "proposed changes", "review changes", "edit preview"],
      type: "pattern",
      category: "Actions & commands",
      description: "Shows proposed mutations before someone accepts, edits, or rejects them.",
      details: "Make additions, removals, affected objects, and partial acceptance clear. Preserve a recovery path after accepted changes.",
      subject: "generative-ai",
      seeAlsoIds: ["action-approval", "version-history", "inline-editing", "artifact-preview", "audit-log"]
    },
    {
      id: "agent-management",
      name: "Agent management",
      altLabels: ["agent directory", "agent catalog", "manage agents"],
      type: "pattern",
      category: "Actions & commands",
      description: "Supports finding, enabling, disabling, and scoping AI agents available to a person or organization.",
      details: "Show each agent\u2019s source, capabilities, status, permissions, and scope before enablement. Keep those controls editable after setup.",
      subject: "generative-ai",
      seeAlsoIds: ["role-management", "permission-matrix", "admin-console", "workspace-switcher", "action-approval"]
    },
    {
      id: "ai-failure-recovery",
      name: "AI failure recovery",
      altLabels: ["AI error recovery", "fallback path", "agent failure"],
      type: "pattern",
      category: "Feedback & status",
      description: "Explains an AI failure and offers a safe retry, correction, or manual continuation path.",
      details: "Preserve the person\u2019s input, identify what failed, scope any partial effects, and offer an actionable alternative rather than a generic error.",
      subject: "generative-ai",
      seeAlsoIds: ["alert", "response-regeneration", "agent-activity", "follow-up-question", "audit-log"]
    },
    {
      id: "ai-feedback",
      name: "AI response feedback",
      altLabels: ["response feedback", "thumbs feedback", "rate response", "correction feedback"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Collects lightweight, contextual feedback about an AI output or behavior.",
      details: "Ask at the output level, support specific correction when useful, and explain how feedback may be used without blocking the task.",
      subject: "generative-ai",
      seeAlsoIds: ["response-regeneration", "grounded-answer", "ai-failure-recovery", "inline-editing"]
    },
    {
      id: "conversation-history",
      name: "Conversation history",
      altLabels: ["chat history", "conversation list", "previous chats"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "A searchable list of prior AI conversations that can be reopened, renamed, or managed.",
      details: "Orient people with useful titles and dates, make retention clear, and separate deleting a conversation from clearing broader memory.",
      subject: "generative-ai",
      seeAlsoIds: ["side-navigation", "ai-composer", "saved-view", "search-field", "memory-controls"]
    },
    {
      id: "memory-controls",
      name: "AI memory controls",
      altLabels: ["AI memory", "remembered context", "memory settings", "forget control"],
      type: "pattern",
      category: "Actions & commands",
      description: "Lets people inspect, correct, disable, or remove context retained by an AI system over time.",
      details: "This emerging pattern should distinguish current-chat context from durable memory, expose scope and source, and support correction, disabling, and deletion.",
      subject: "generative-ai",
      seeAlsoIds: ["context-attachment", "conversation-history", "role-management", "audit-log"]
    },
    {
      id: "workspace-switcher",
      name: "Workspace switcher",
      altLabels: ["tenant switcher", "organization switcher", "workspace selector", "account switcher"],
      type: "component",
      category: "Navigation & wayfinding",
      description: "Changes the active workspace, organization, tenant, or account context.",
      details: "Keep the current context visible and warn before switching with unsaved work. Use Combobox when many contexts need typed filtering.",
      seeAlsoIds: ["combobox", "header", "side-navigation", "saved-view"]
    },
    {
      id: "saved-view",
      name: "Saved view",
      altLabels: ["saved filter", "custom view", "view preset"],
      type: "pattern",
      category: "Navigation & wayfinding",
      description: "Stores a named combination of filters, sorting, columns, and display choices for reuse.",
      details: "Show whether changes are temporary or saved, who can see the view, and how to reset to the shared default.",
      seeAlsoIds: ["search-and-filtering", "filter-bar", "sorting", "data-grid", "workspace-switcher"]
    },
    {
      id: "kanban-board",
      name: "Kanban board",
      altLabels: ["board view", "task board", "card board"],
      type: "pattern",
      category: "Content & data",
      description: "Organizes work items as cards across columns representing status, stage, or category.",
      details: "Keep card identity and column meaning visible, support non-drag movement, and preserve ordering and filters across view changes.",
      seeAlsoIds: ["card", "saved-view", "bulk-selection-and-actions", "inline-editing", "comment-thread"]
    },
    {
      id: "dashboard",
      name: "Dashboard",
      altLabels: ["analytics dashboard", "overview dashboard", "KPI dashboard"],
      type: "pattern",
      category: "Layout & composition",
      description: "Combines prioritized metrics, statuses, and actions into a scannable operational overview.",
      details: "Design around decisions and exceptions, not maximum widget count. Link summaries to the underlying records and definitions.",
      seeAlsoIds: ["card", "data-grid", "saved-view", "activity-feed", "record-detail"]
    },
    {
      id: "activity-feed",
      name: "Activity feed",
      altLabels: ["event feed", "recent activity", "update feed"],
      type: "component",
      category: "Content & data",
      description: "Presents recent human and system events in a readable chronological stream.",
      details: "Group repetitive events, identify the actor and affected object, and link to details. Use Audit log when governance-grade evidence is required.",
      seeAlsoIds: ["comment-thread", "audit-log", "notification-center", "version-history", "collaborative-presence"]
    },
    {
      id: "onboarding-checklist",
      name: "Onboarding checklist",
      altLabels: ["setup checklist", "getting started checklist", "activation checklist"],
      type: "pattern",
      category: "Navigation & wayfinding",
      description: "Guides new users through a small set of meaningful setup milestones.",
      details: "Prioritize actions that reach value, preserve progress, and stay dismissible. Do not turn every feature into a required tour step.",
      seeAlsoIds: ["stepper", "empty-state", "progress-indicator", "dashboard"]
    },
    {
      id: "collaborative-presence",
      name: "Collaborative presence",
      altLabels: ["presence indicators", "live collaborators", "co-editing presence"],
      type: "pattern",
      category: "Feedback & status",
      description: "Shows who is currently viewing, editing, or selecting within a shared workspace.",
      details: "Use identity plus location or activity when it prevents collisions. Do not imply real-time presence from stale availability data.",
      seeAlsoIds: ["avatar", "comment-thread", "inline-editing", "activity-feed"]
    },
    {
      id: "comment-thread",
      name: "Comment thread",
      altLabels: ["threaded comments", "discussion thread", "annotation thread"],
      type: "component",
      category: "Content & data",
      description: "Keeps a discussion attached to a record, artifact, or precise content range.",
      details: "Preserve context, authorship, chronology, replies, and resolution state. Use Activity feed for broader events rather than discussion.",
      seeAlsoIds: ["avatar", "activity-feed", "collaborative-presence", "notification-center", "record-detail"]
    },
    {
      id: "inline-editing",
      name: "Inline editing",
      altLabels: ["inline edit", "edit in place", "in-cell editing"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Switches content from reading to editing without moving to a separate page or dialog.",
      details: "Make entry, save, cancel, validation, and keyboard behavior obvious. Use a full form when several dependent fields must change together.",
      seeAlsoIds: ["text-field", "data-grid", "draft-autosave", "version-history", "change-preview"]
    },
    {
      id: "notification-center",
      name: "Notification center",
      altLabels: ["notification inbox", "alerts center", "activity inbox"],
      type: "component",
      category: "Feedback & status",
      description: "A persistent inbox for updates that people may need to review after the moment they occur.",
      details: "Separate read state from resolution, group related events, and let people tune subscriptions. Use Toast only for transient feedback.",
      seeAlsoIds: ["notifications", "badge", "activity-feed", "saved-view", "toast"]
    },
    {
      id: "record-detail",
      name: "Record detail",
      altLabels: ["object page", "record page", "entity detail", "resource detail"],
      type: "pattern",
      category: "Layout & composition",
      description: "Organizes the identity, status, fields, relationships, and actions of one business object.",
      details: "Prioritize role-relevant information, keep object identity and status visible, and use sections or tabs without turning the page into a content dump.",
      seeAlsoIds: ["master-detail", "dashboard", "activity-feed", "audit-log", "comment-thread"]
    },
    {
      id: "approval-workflow",
      name: "Approval workflow",
      altLabels: ["approval flow", "sign-off workflow", "review and approve"],
      type: "pattern",
      category: "Actions & commands",
      description: "Routes a record or change through defined reviewers, decisions, and status transitions.",
      details: "Show the current stage, decision owner, due state, evidence, and consequences. Preserve comments and an audit trail across reassignment.",
      seeAlsoIds: ["action-approval", "review-queue", "role-management", "notification-center", "audit-log"]
    },
    {
      id: "review-queue",
      name: "Review queue",
      altLabels: ["work queue", "approval queue", "triage queue"],
      type: "pattern",
      category: "Layout & composition",
      description: "Prioritizes records that need a person\u2019s review, decision, assignment, or exception handling.",
      details: "Make urgency, ownership, status, and next action scannable. Preserve filters and selection while moving through record details.",
      seeAlsoIds: ["data-grid", "approval-workflow", "bulk-selection-and-actions", "saved-view", "record-detail"]
    },
    {
      id: "audit-log",
      name: "Audit log",
      altLabels: ["audit trail", "event log", "security log", "change log"],
      type: "component",
      category: "Content & data",
      description: "Records attributable, time-ordered system and user actions for governance or investigation.",
      details: "Preserve actor, action, target, time, outcome, and relevant before/after data. Activity feed is a friendlier summary, not a substitute.",
      seeAlsoIds: ["activity-feed", "version-history", "action-approval", "role-management", "impersonation-banner"]
    },
    {
      id: "permission-matrix",
      name: "Permission matrix",
      altLabels: ["access matrix", "permissions grid", "capability matrix"],
      type: "component",
      category: "Content & data",
      description: "Displays or edits which roles or subjects can perform actions on resources.",
      details: "Use for comparing a bounded permission model. Explain inheritance, defaults, exceptions, and effective access outside the raw grid.",
      seeAlsoIds: ["role-management", "data-grid", "checkbox", "agent-management", "admin-console"]
    },
    {
      id: "role-management",
      name: "Role management",
      altLabels: ["access control", "user roles", "RBAC management", "member permissions"],
      type: "pattern",
      category: "Actions & commands",
      description: "Creates, assigns, and reviews reusable permission sets for people, groups, or service identities.",
      details: "Show effective access before changes, distinguish inherited from direct grants, and record privileged assignment changes.",
      seeAlsoIds: ["permission-matrix", "admin-console", "agent-management", "audit-log", "workspace-switcher"]
    },
    {
      id: "rule-builder",
      name: "Rule builder",
      altLabels: ["policy builder", "condition builder", "automation rule", "logic builder"],
      type: "component",
      category: "Inputs & selection",
      description: "Builds structured conditions and outcomes without requiring raw query or policy syntax.",
      details: "Keep grouping and precedence visible, validate incrementally, and offer a readable summary or code view for complex rules.",
      seeAlsoIds: ["form", "multi-step-flow", "inline-editing", "approval-workflow", "version-history"]
    },
    {
      id: "import-workflow",
      name: "Import workflow",
      altLabels: ["bulk import", "data import", "CSV import", "import wizard"],
      type: "pattern",
      category: "Inputs & selection",
      description: "Guides file selection, field mapping, validation, preview, and commit for incoming records.",
      details: "Separate parsing from final commit, preserve row-level errors, and make partial success, rollback, and duplicate handling explicit.",
      seeAlsoIds: ["file-upload", "form-validation", "progress-indicator", "change-preview", "audit-log"]
    },
    {
      id: "draft-autosave",
      name: "Draft and autosave",
      altLabels: ["autosave", "saved draft", "save status", "draft handling"],
      type: "pattern",
      category: "Feedback & status",
      description: "Preserves in-progress work automatically while communicating save, conflict, and recovery state.",
      details: "Make saving and failure states visible without constant interruption. Distinguish a private draft from a published or shared change.",
      seeAlsoIds: ["inline-editing", "toast", "version-history", "form", "loading-state"]
    },
    {
      id: "version-history",
      name: "Version history",
      altLabels: ["revision history", "change history", "restore version", "version timeline"],
      type: "pattern",
      category: "Navigation & wayfinding",
      description: "Lets people inspect, compare, and restore prior states of a record or artifact.",
      details: "Identify author and time, show meaningful differences, and explain whether restoration creates a new version or rewrites history.",
      seeAlsoIds: ["audit-log", "activity-feed", "change-preview", "draft-autosave", "record-detail"]
    },
    {
      id: "impersonation-banner",
      name: "Impersonation banner",
      altLabels: ["admin impersonation", "acting as user", "support session banner"],
      type: "pattern",
      category: "Feedback & status",
      description: "Persistently indicates that an administrator is viewing or acting as another user.",
      details: "Keep the assumed identity, scope, risk, and exit action continuously visible. Record consequential actions in the audit log.",
      seeAlsoIds: ["banner", "audit-log", "role-management", "admin-console"]
    },
    {
      id: "admin-console",
      name: "Admin console",
      altLabels: ["admin portal", "administration area", "management console"],
      type: "pattern",
      category: "Layout & composition",
      description: "A role-restricted workspace for organization-wide configuration, access, policy, and governance.",
      details: "Group tasks by administrative job, show scope and impact before mutation, and keep ordinary end-user workflows outside this surface.",
      seeAlsoIds: ["side-navigation", "dashboard", "role-management", "permission-matrix", "audit-log"]
    }
  ]
);
var entries = defineEntries(rawEntries.map(withKind));
assertValidCatalog(categories2, entries);
var fieldWeights = {
  name: 1e3,
  altLabels: 700,
  hiddenLabels: 650,
  subject: 500,
  description: 130,
  details: 90
};
var commonFramingWords = /* @__PURE__ */ new Set([
  "a",
  "an",
  "and",
  "are",
  "called",
  "can",
  "component",
  "create",
  "design",
  "do",
  "find",
  "for",
  "i",
  "in",
  "interface",
  "is",
  "it",
  "like",
  "looking",
  "make",
  "me",
  "need",
  "of",
  "on",
  "or",
  "pattern",
  "please",
  "show",
  "something",
  "that",
  "the",
  "this",
  "to",
  "ui",
  "use",
  "want",
  "we",
  "what",
  "with"
]);
function normalizeText(value = "") {
  return value.toLocaleLowerCase().replace(/combo[\s-]*box/g, "combobox").replace(/drop[\s-]*down/g, "dropdown").replace(/\bai\b/g, "ai").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).map(singularize).join(" ");
}
function singularize(token) {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (/(xes|ches|shes)$/.test(token) && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("ses") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && token.length > 3 && !/(ss|us|is)$/.test(token)) return token.slice(0, -1);
  return token;
}
function parseQuery(query) {
  const normalizedQuery = normalizeText(query);
  const allTokens = normalizedQuery ? normalizedQuery.split(" ") : [];
  if (allTokens.length < 2) return { normalizedQuery, queryTokens: allTokens, ignoredTokens: [] };
  const queryTokens = allTokens.filter((token) => !commonFramingWords.has(token));
  if (!queryTokens.length) return { normalizedQuery, queryTokens: allTokens, ignoredTokens: [] };
  return {
    normalizedQuery,
    queryTokens,
    ignoredTokens: allTokens.filter((token) => commonFramingWords.has(token))
  };
}
function editDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array(right.length + 1).fill(0);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitution
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}
function tokenSimilarity(queryToken, targetToken, allowFuzzy) {
  if (queryToken === targetToken) return { strength: 1, kind: "exact" };
  if (queryToken.length >= 3 && targetToken.startsWith(queryToken)) return { strength: 0.82, kind: "prefix" };
  if (!allowFuzzy || queryToken.length < 4 || targetToken.length < 4) return null;
  const distance = editDistance(queryToken, targetToken);
  const threshold = queryToken.length >= 8 ? 2 : 1;
  if (distance <= threshold && distance / Math.max(queryToken.length, targetToken.length) <= 0.24) {
    return { strength: distance === 1 ? 0.72 : 0.6, kind: "fuzzy" };
  }
  return null;
}
function searchableFields(entry) {
  return [
    { name: "name", value: entry.name, weight: fieldWeights.name, allowFuzzy: true },
    { name: "altLabels", value: entry.altLabels.join(" "), weight: fieldWeights.altLabels, allowFuzzy: true },
    { name: "hiddenLabels", value: (entry.hiddenLabels ?? []).join(" "), weight: fieldWeights.hiddenLabels, allowFuzzy: true },
    { name: "subject", value: entry.subject ?? "", weight: fieldWeights.subject, allowFuzzy: true },
    { name: "description", value: entry.description, weight: fieldWeights.description, allowFuzzy: false },
    { name: "details", value: entry.details, weight: fieldWeights.details, allowFuzzy: false }
  ].map((field) => ({ ...field, normalized: normalizeText(field.value), tokens: normalizeText(field.value).split(" ").filter(Boolean) }));
}
function matchEntry(entry, queryTokens, normalizedQuery) {
  const fields = searchableFields(entry);
  const matchedTerms = [];
  const unmatchedTerms = [];
  const matchedFields = /* @__PURE__ */ new Set();
  const strategies = /* @__PURE__ */ new Set();
  let score = 0;
  let strongMatches = 0;
  for (const queryToken of queryTokens) {
    let best = null;
    for (const field of fields) {
      for (const targetToken of field.tokens) {
        const similarity = tokenSimilarity(queryToken, targetToken, field.allowFuzzy);
        if (!similarity) continue;
        const candidate = { ...similarity, field: field.name, weight: field.weight };
        if (!best || candidate.weight * candidate.strength > best.weight * best.strength) best = candidate;
      }
    }
    if (!best) {
      unmatchedTerms.push(queryToken);
      continue;
    }
    matchedTerms.push(queryToken);
    matchedFields.add(best.field);
    strategies.add(best.kind);
    if (["name", "altLabels", "hiddenLabels", "subject"].includes(best.field)) strongMatches += 1;
    score += best.weight * best.strength;
  }
  const normalizedName = normalizeText(entry.name);
  const normalizedAltLabels = entry.altLabels.map((label) => normalizeText(label));
  const normalizedHiddenLabels = (entry.hiddenLabels ?? []).map((label) => normalizeText(label));
  if (normalizedName === normalizedQuery) score += fieldWeights.name * 2;
  if (normalizedAltLabels.includes(normalizedQuery)) score += fieldWeights.altLabels * 2;
  if (normalizedHiddenLabels.includes(normalizedQuery)) score += fieldWeights.hiddenLabels * 2;
  if (normalizeText(entry.subject) === normalizedQuery) score += fieldWeights.subject * 2;
  score += queryTokens.length ? matchedTerms.length / queryTokens.length * 400 : 0;
  return {
    score,
    matchedTerms,
    unmatchedTerms,
    fields: [...matchedFields],
    strategies: [...strategies],
    strongMatches
  };
}
function searchEntries(entries2, { query = "", type = "all", category = "all" } = {}) {
  const { normalizedQuery, queryTokens, ignoredTokens } = parseQuery(query);
  const routedIds = ambiguityRoutes[normalizedQuery] ?? [];
  const routeRanks = new Map(routedIds.map((id, index) => [id, routedIds.length - index]));
  const candidates = entries2.filter((entry) => type === "all" || entry.type === type).filter((entry) => category === "all" || entry.category === category);
  if (!normalizedQuery) {
    const hits2 = candidates.slice().sort((left, right) => left.name.localeCompare(right.name)).map((entry) => ({ entry, match: { score: 0, matchedTerms: [], unmatchedTerms: [], fields: [], strategies: [], strongMatches: 0 } }));
    return { entries: hits2.map(({ entry }) => entry), hits: hits2, mode: "browse", normalizedQuery, queryTokens, ignoredTokens, routedIds };
  }
  const scored = candidates.map((entry) => ({ entry, match: matchEntry(entry, queryTokens, normalizedQuery) }));
  const strict = scored.filter(({ entry, match }) => routeRanks.has(entry.id) || match.matchedTerms.length === queryTokens.length);
  let mode = routedIds.length ? "routed" : strict.some(({ match }) => match.strategies.some((strategy) => strategy !== "exact")) ? "tolerant" : "exact";
  let selected = strict;
  if (!selected.length) {
    mode = "expanded";
    const requiredMatches = queryTokens.length <= 2 ? 1 : Math.ceil(queryTokens.length / 2);
    selected = scored.filter(
      ({ match }) => match.matchedTerms.length >= requiredMatches && (queryTokens.length === 1 || match.strongMatches > 0 || match.matchedTerms.length >= 2)
    );
  }
  const hits = selected.map(({ entry, match }) => ({
    entry,
    match: { ...match, score: match.score + (routeRanks.get(entry.id) ?? 0) * 1e5 }
  })).filter(({ entry, match }) => routeRanks.has(entry.id) || match.score > 0).sort((left, right) => right.match.score - left.match.score || left.entry.name.localeCompare(right.entry.name));
  return { entries: hits.map(({ entry }) => entry), hits, mode, normalizedQuery, queryTokens, ignoredTokens, routedIds };
}
function filterEntries(entries2, filters = {}) {
  return searchEntries(entries2, filters).entries;
}
var sourceCheckedDate = "2026-07-17";
var sourceCheckedLabel = "17 July 2026";
var canonicalSources = [
  {
    id: "html-semantics",
    priority: 1,
    name: "HTML and ARIA in HTML",
    links: [
      { label: "HTML Living Standard", url: "https://html.spec.whatwg.org/dev/" },
      { label: "ARIA in HTML", url: "https://www.w3.org/TR/html-aria/" }
    ],
    role: "Native control names and semantics.",
    status: "Living and current standards.",
    reuse: "Paraphrase. Prefer native HTML; ARIA must not contradict it."
  },
  {
    id: "wcag-22",
    priority: 1,
    name: "WCAG 2.2",
    links: [{ label: "WCAG 2.2", url: "https://www.w3.org/TR/WCAG22/" }],
    role: "Testable accessibility floor.",
    status: "Version-pinned W3C Recommendation.",
    reuse: "Paraphrase; retain required W3C notices and source context if material is reproduced."
  },
  {
    id: "aria-apg",
    priority: 2,
    name: "WAI-ARIA Authoring Practices Guide",
    links: [{ label: "WAI-ARIA APG", url: "https://www.w3.org/WAI/ARIA/apg/" }],
    role: "Keyboard, focus, role, and state conventions for custom widgets.",
    status: "Informative guidance, not a design system.",
    reuse: "Paraphrase and validate browser and assistive-technology support."
  },
  {
    id: "cognitive-accessibility",
    priority: 2,
    name: "Cognitive Accessibility Guidance",
    links: [{ label: "Cognitive Accessibility Guidance", url: "https://www.w3.org/WAI/WCAG2/supplemental/" }],
    role: "Review lens for forms, navigation, errors, memory, timing, and hidden content.",
    status: "Supplemental guidance; it does not change WCAG conformance.",
    reuse: "Use as an additional review lens."
  },
  {
    id: "design-tokens",
    priority: 3,
    name: "Design Tokens Format Module 2025.10",
    links: [{ label: "Design Tokens Format Module 2025.10", url: "https://www.designtokens.org/tr/2025.10/format/" }],
    role: "Foundational vocabulary for tokens, values, groups, and aliases.",
    status: "Version-pinned interchange specification, not a component taxonomy.",
    reuse: "Use terminology and confirm the exact license before reproducing diagrams or examples."
  },
  {
    id: "open-ui",
    priority: 3,
    name: "Open UI",
    links: [{ label: "Open UI", url: "https://open-ui.org/working-mode/" }],
    role: "Cross-system component anatomy, state, and naming research.",
    status: "Mature terms can inform names; drafts are evidence, not rules.",
    reuse: "Confirm the specific page or repository license before reuse."
  },
  {
    id: "govuk-design-system",
    priority: 4,
    name: "GOV.UK Design System",
    links: [{ label: "GOV.UK Design System", url: "https://design-system.service.gov.uk/" }],
    role: "Open visual and task-pattern exemplar.",
    status: "Reference system; it does not set the Atlas visual style.",
    reuse: "Attribute reused material under OGL v3.0 and exclude marks or third-party material.",
    license: { label: "Open Government Licence v3.0", url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" }
  },
  {
    id: "human-ai-guidance",
    priority: 4,
    name: "Human-AI interaction guidance",
    links: [
      { label: "Microsoft HAX AI Guidelines", url: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
      { label: "Google PAIR Guidebook", url: "https://pair.withgoogle.com/guidebook-v2/" }
    ],
    role: "Research-grounded guidance for expectations, control, correction, feedback, failure, and behavior over time.",
    status: "Specialized human-AI guidance; it informs interaction boundaries rather than defining web semantics.",
    reuse: "Paraphrase findings and guidance. Respect the PAIR guidebook license; do not reuse vendor visuals."
  },
  {
    id: "generative-ai-patterns",
    priority: 4,
    name: "Generative AI pattern systems",
    links: [
      { label: "Cloudscape generative AI patterns", url: "https://cloudscape.design/gen-ai/patterns/" },
      { label: "Carbon for AI", url: "https://carbondesignsystem.com/guidelines/carbon-for-ai/" }
    ],
    role: "Current vocabulary for AI labels, context, progress, approvals, artifacts, agents, regeneration, and recovery.",
    status: "Emerging product-design patterns, not universal standards.",
    reuse: "Use for terminology and coverage checks. Draw original neutral examples; do not copy code, assets, or visual language."
  },
  {
    id: "saas-enterprise-systems",
    priority: 4,
    name: "SaaS and enterprise design systems",
    links: [
      { label: "Atlassian Design System", url: "https://atlassian.design/components/" },
      { label: "SAP Design System", url: "https://www.sap.com/design-system/" }
    ],
    role: "Coverage checks for collaboration, data density, onboarding, object handling, workflows, administration, and governance.",
    status: "Product-specific systems; terms are neutralized before entering the Atlas.",
    reuse: "Paraphrase and use for coverage checks only. Do not reproduce branded assets, screenshots, or styling."
  }
];
var sourcePolicy = {
  entriesCitationFree: true,
  definitionsOriginal: true,
  visualsOriginal: true,
  methodologyPath: "research/CANONICAL_SOURCES.md"
};
var cliSchemaVersion = "2";
var cliCommandInfo = [
  { name: "search", summary: "Search preferred names, labels, prose, and the optional subject", usage: "ui-patterns search <terms> [--type component|pattern] [--category <name>] [--limit N] [--json]" },
  { name: "show", summary: "Show one stable record ID and its directional see-also terms", usage: "ui-patterns show <id> [--json]" },
  { name: "list", summary: "List a Category and Record type inventory slice", usage: "ui-patterns list [--type component|pattern] [--category <name>] [--limit N] [--json]" },
  { name: "categories", summary: "List controlled categories, scope notes, and counts", usage: "ui-patterns categories [--json]" },
  { name: "sources", summary: "Show the library-level canonical source register", usage: "ui-patterns sources [--json]" }
];
var CliError = class extends Error {
  /** @param {string} message @param {number} [exitCode] @param {unknown} [details] */
  constructor(message, exitCode = 2, details = void 0) {
    super(message);
    this.name = "CliError";
    this.exitCode = exitCode;
    this.details = details;
  }
};
var helpText = `Pattern Atlas CLI

Retrieve concise, project-agnostic UI vocabulary for design and planning.

Usage:
  ui-patterns <command> [options]

Commands:
${cliCommandInfo.map((command) => `  ${command.name.padEnd(12)} ${command.summary}
               ${command.usage}`).join("\n")}

Global option:
  --json       Emit one stable JSON response envelope
  -h, --help   Show help

Examples:
  ui-patterns search dropdown --json
  ui-patterns search "generative AI" --type pattern --json
  ui-patterns search "onbording checklst" --json
  ui-patterns show combobox --json
  ui-patterns list --category "Feedback & status" --type pattern --json
  ui-patterns categories --json
  ui-patterns sources --json
`;
function envelope(command, data) {
  return { schemaVersion: cliSchemaVersion, command, data };
}
function jsonLine(value) {
  return `${JSON.stringify(value, null, 2)}
`;
}
function summarizeEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    altLabels: [...entry.altLabels],
    type: entry.type,
    kind: entry.kind,
    kindLabel: kindLabels[entry.kind],
    category: entry.category,
    subject: entry.subject ?? null,
    description: entry.description,
    details: entry.details
  };
}
function detailEntry(entry) {
  const seeAlso = (entry.seeAlsoIds ?? []).map((id) => entries.find((candidate) => candidate.id === id)).filter((candidate) => candidate !== void 0).map(summarizeEntry);
  return { ...summarizeEntry(entry), seeAlso };
}
function resolveCategory(value) {
  const category = categories2.find((candidate) => candidate.toLocaleLowerCase() === value.trim().toLocaleLowerCase());
  if (!category) {
    throw new CliError(`Unknown category \u201C${value}\u201D.`, 2, { validCategories: [...categories2] });
  }
  return category;
}
function resolveType(value) {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized !== "all" && normalized !== "component" && normalized !== "pattern") {
    throw new CliError(`Unknown type \u201C${value}\u201D. Use component or pattern.`, 2, { validTypes: ["component", "pattern"] });
  }
  return (
    /** @type {EntryTypeFilter} */
    normalized
  );
}
function resolveLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > entries.length) {
    throw new CliError(`Limit must be an integer from 1 to ${entries.length}.`);
  }
  return limit;
}
function parseOptions(tokens, allowed) {
  const options = {};
  const positionals = [];
  let help = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") {
      positionals.push(...tokens.slice(index + 1));
      break;
    }
    if (token === "-h" || token === "--help") {
      help = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const separator = token.indexOf("=");
    const flag = separator >= 0 ? token.slice(2, separator) : token.slice(2);
    if (flag === "context") {
      throw new CliError(
        "Option --context was removed because AI, SaaS, and Enterprise are not one coherent facet. Use --category and --type; search \u201Cgenerative AI\u201D for intrinsically generative or agentic records."
      );
    }
    if (!allowed.has(flag)) throw new CliError(`Unknown option --${flag}.`);
    const inlineValue = separator >= 0 ? token.slice(separator + 1) : void 0;
    const value = inlineValue === void 0 ? tokens[index + 1] : inlineValue;
    if (value === void 0 || inlineValue === void 0 && value.startsWith("--")) {
      throw new CliError(`Option --${flag} requires a value.`);
    }
    options[flag] = value;
    if (inlineValue === void 0) index += 1;
  }
  return { help, options, positionals };
}
function filtersFromOptions(options, defaultLimit) {
  const type = (
    /** @type {EntryTypeFilter} */
    options.type ? resolveType(options.type) : "all"
  );
  const category = (
    /** @type {Category | "all"} */
    options.category ? resolveCategory(options.category) : "all"
  );
  const limit = options.limit ? resolveLimit(options.limit) : defaultLimit;
  return { type, category, limit };
}
function resolveEntry(target) {
  const trimmed = target.trim();
  const idMatch = entries.find((entry) => entry.id === trimmed.toLocaleLowerCase());
  if (idMatch) return idMatch;
  const normalized = trimmed.toLocaleLowerCase();
  const routedIds = ambiguityRoutes[normalized] ?? [];
  if (routedIds.length > 1) {
    const candidates = routedIds.map((id) => entries.find((entry) => entry.id === id)).filter((entry) => entry !== void 0).map(summarizeEntry);
    throw new CliError(`\u201C${target}\u201D is ambiguous. Search it first, then show a candidate ID.`, 1, { candidates });
  }
  const suggestions = filterEntries(entries, { query: trimmed }).slice(0, 5).map(summarizeEntry);
  throw new CliError(
    `No stable Atlas record ID matches \u201C${target}\u201D. Run search, then pass a returned ID to show.`,
    1,
    { suggestions }
  );
}
function formatResultRows(results) {
  if (!results.length) return "No matching terms.\n";
  return `${results.map((entry, index) => `${index + 1}. ${entry.name} [${entry.id}]
   ${typeLabels[entry.type]} \xB7 ${entry.kindLabel} \xB7 ${entry.category}
   ${entry.description}
   ${entry.details}`).join("\n\n")}
`;
}
function commandHelp(command) {
  const metadata = cliCommandInfo.find((item) => item.name === command);
  return metadata ? `${metadata.summary}

Usage: ${metadata.usage}
` : helpText;
}
function commandHelpResult(command, json) {
  const text = commandHelp(command);
  return { exitCode: 0, stdout: json ? jsonLine(envelope(command, { help: text })) : text };
}
function runAtlasCli(argv) {
  const json = argv.includes("--json");
  const args = argv.filter((argument) => argument !== "--json");
  const command = args[0];
  try {
    if (!command || command === "help" || command === "-h" || command === "--help") {
      return { exitCode: 0, stdout: json ? jsonLine(envelope("help", { text: helpText })) : helpText };
    }
    if (command === "search") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["type", "category", "limit"]));
      if (parsed.help) return commandHelpResult(command, json);
      const query = parsed.positionals.join(" ").trim();
      if (!query) throw new CliError("search requires one or more terms.");
      const filters = filtersFromOptions(parsed.options, 10);
      const search = searchEntries(entries, { query, type: filters.type, category: filters.category });
      const results = search.hits.slice(0, filters.limit).map(({ entry, match }) => ({
        ...summarizeEntry(entry),
        match: { matchedTerms: match.matchedTerms, unmatchedTerms: match.unmatchedTerms, fields: match.fields, strategies: match.strategies }
      }));
      const data = {
        query,
        normalizedQuery: search.normalizedQuery,
        filters: { type: filters.type, category: filters.category },
        retrieval: { mode: search.mode, queryTokens: search.queryTokens, ignoredTokens: search.ignoredTokens },
        total: search.entries.length,
        returned: results.length,
        ambiguity: search.routedIds.length ? { exactRoute: true, routedIds: [...search.routedIds] } : null,
        results
      };
      const notices = [];
      if (search.routedIds.length) notices.push(`Ambiguous term: ${search.routedIds.join(", ")}`);
      if (search.mode === "tolerant") notices.push("Matched spelling or partial-word variants.");
      if (search.mode === "expanded") notices.push("Showing close lexical matches; no entry matched every meaningful term.");
      if (search.ignoredTokens.length) notices.push(`Ignored common framing: ${search.ignoredTokens.join(", ")}`);
      const prefix = notices.length ? `${notices.join("\n")}
` : "";
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${prefix}${search.entries.length} ${search.entries.length === 1 ? "match" : "matches"} for \u201C${query}\u201D

${formatResultRows(results)}` };
    }
    if (command === "show") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json);
      const target = parsed.positionals.join(" ").trim();
      if (!target) throw new CliError("show requires a stable record ID.");
      const entry = detailEntry(resolveEntry(target));
      const data = { entry };
      const seeAlso = entry.seeAlso.length ? `
See also:
${entry.seeAlso.map((item) => `- ${item.name} [${item.id}] \u2014 ${item.description}`).join("\n")}
` : "";
      const altLabels = entry.altLabels.length ? `
Also called: ${entry.altLabels.join(", ")}` : "";
      const human = `${entry.name} [${entry.id}]
${typeLabels[entry.type]} \xB7 ${entry.kindLabel} \xB7 ${entry.category}${altLabels}

${entry.description}
${entry.details}
${seeAlso}`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "list") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["type", "category", "limit"]));
      if (parsed.help) return commandHelpResult(command, json);
      if (parsed.positionals.length) throw new CliError("list does not accept search terms; use search instead.");
      const filters = filtersFromOptions(parsed.options, entries.length);
      const matches = filterEntries(entries, { type: filters.type, category: filters.category });
      const results = matches.slice(0, filters.limit).map(summarizeEntry);
      const data = { filters: { type: filters.type, category: filters.category }, total: matches.length, returned: results.length, results };
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : `${matches.length} ${matches.length === 1 ? "term" : "terms"}

${formatResultRows(results)}` };
    }
    if (command === "categories") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json);
      if (parsed.positionals.length) throw new CliError("categories does not accept arguments.");
      const results = categoryDefinitions.map(({ name, scope }) => ({
        name,
        scope,
        count: entries.filter((entry) => entry.category === name).length,
        components: entries.filter((entry) => entry.category === name && entry.type === "component").length,
        patterns: entries.filter((entry) => entry.category === name && entry.type === "pattern").length
      }));
      const data = { total: entries.length, tieBreakRule: categoryTieBreakRule, categories: results };
      const human = `${results.map((item) => `${item.name}: ${item.count} (${item.components} ${typeLabels.component.toLocaleLowerCase()}, ${item.patterns} ${typeLabels.pattern.toLocaleLowerCase()})
  ${item.scope}`).join("\n")}

Tie-break: ${categoryTieBreakRule}
`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "contexts") {
      throw new CliError(
        "The contexts command was removed because AI, SaaS, and Enterprise are not one coherent facet. Use categories and list; search \u201Cgenerative AI\u201D for intrinsically generative or agentic records."
      );
    }
    if (command === "sources") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json);
      if (parsed.positionals.length) throw new CliError("sources does not accept arguments.");
      const data = { checkedDate: sourceCheckedDate, checkedLabel: sourceCheckedLabel, policy: sourcePolicy, sources: canonicalSources };
      const human = `Canonical source register \xB7 checked ${sourceCheckedLabel}

${canonicalSources.map((source) => `${source.priority}. ${source.name}
   ${source.role} ${source.status}
   ${source.links.map((link) => link.url).join("\n   ")}`).join("\n\n")}
`;
      return { exitCode: 0, stdout: json ? jsonLine(envelope(command, data)) : human };
    }
    throw new CliError(`Unknown command \u201C${command}\u201D.`);
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError(error instanceof Error ? error.message : "Unknown CLI error.", 1);
    const payload = envelope(command || "unknown", { error: { message: cliError.message, details: cliError.details ?? null } });
    return {
      exitCode: cliError.exitCode,
      stderr: json ? jsonLine(payload) : `Error: ${cliError.message}
Run ui-patterns --help for usage.
`
    };
  }
}

// ../../../plugin-sources/ui-patterns-recovered/server.ts
async function plugin(bb) {
  bb.cli.register({
    name: "ui-patterns",
    summary: "Search and inspect the Pattern Atlas UI vocabulary",
    commands: cliCommandInfo.map((command) => ({
      name: command.name,
      summary: command.summary,
      usage: `bb ${command.usage}`
    })),
    run(argv) {
      return runAtlasCli(argv);
    }
  });
  bb.log.info("UI Patterns library loaded");
  bb.onDispose(() => bb.log.info("UI Patterns library disposed"));
}
export {
  plugin as default
};
//# sourceMappingURL=server.js.map
