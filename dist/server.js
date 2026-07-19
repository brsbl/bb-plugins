import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// runtime-cli.js
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
function commandHelpResult(command, json2) {
  const text = commandHelp(command);
  return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, { help: text })) : text };
}
function runAtlasCli(argv) {
  const json2 = argv.includes("--json");
  const args = argv.filter((argument) => argument !== "--json");
  const command = args[0];
  try {
    if (!command || command === "help" || command === "-h" || command === "--help") {
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope("help", { text: helpText })) : helpText };
    }
    if (command === "search") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["type", "category", "limit"]));
      if (parsed.help) return commandHelpResult(command, json2);
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
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, data)) : `${prefix}${search.entries.length} ${search.entries.length === 1 ? "match" : "matches"} for \u201C${query}\u201D

${formatResultRows(results)}` };
    }
    if (command === "show") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json2);
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
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "list") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set(["type", "category", "limit"]));
      if (parsed.help) return commandHelpResult(command, json2);
      if (parsed.positionals.length) throw new CliError("list does not accept search terms; use search instead.");
      const filters = filtersFromOptions(parsed.options, entries.length);
      const matches = filterEntries(entries, { type: filters.type, category: filters.category });
      const results = matches.slice(0, filters.limit).map(summarizeEntry);
      const data = { filters: { type: filters.type, category: filters.category }, total: matches.length, returned: results.length, results };
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, data)) : `${matches.length} ${matches.length === 1 ? "term" : "terms"}

${formatResultRows(results)}` };
    }
    if (command === "categories") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json2);
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
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, data)) : human };
    }
    if (command === "contexts") {
      throw new CliError(
        "The contexts command was removed because AI, SaaS, and Enterprise are not one coherent facet. Use categories and list; search \u201Cgenerative AI\u201D for intrinsically generative or agentic records."
      );
    }
    if (command === "sources") {
      const parsed = parseOptions(args.slice(1), /* @__PURE__ */ new Set());
      if (parsed.help) return commandHelpResult(command, json2);
      if (parsed.positionals.length) throw new CliError("sources does not accept arguments.");
      const data = { checkedDate: sourceCheckedDate, checkedLabel: sourceCheckedLabel, policy: sourcePolicy, sources: canonicalSources };
      const human = `Canonical source register \xB7 checked ${sourceCheckedLabel}

${canonicalSources.map((source) => `${source.priority}. ${source.name}
   ${source.role} ${source.status}
   ${source.links.map((link) => link.url).join("\n   ")}`).join("\n\n")}
`;
      return { exitCode: 0, stdout: json2 ? jsonLine(envelope(command, data)) : human };
    }
    throw new CliError(`Unknown command \u201C${command}\u201D.`);
  } catch (error51) {
    const cliError = error51 instanceof CliError ? error51 : new CliError(error51 instanceof Error ? error51.message : "Unknown CLI error.", 1);
    const payload = envelope(command || "unknown", { error: { message: cliError.message, details: cliError.details ?? null } });
    return {
      exitCode: cliError.exitCode,
      stderr: json2 ? jsonLine(payload) : `Error: ${cliError.message}
Run ui-patterns --help for usage.
`
    };
  }
}

// providers/rpc.ts
import {
  defineRpcContract
} from "@bb/plugin-sdk";

// node_modules/zod/v4/classic/external.js
var external_exports = {};
__export(external_exports, {
  $brand: () => $brand,
  $input: () => $input,
  $output: () => $output,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRealError: () => ZodRealError,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  codec: () => codec,
  coerce: () => coerce_exports,
  config: () => config,
  core: () => core_exports2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  decode: () => decode2,
  decodeAsync: () => decodeAsync2,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  encode: () => encode2,
  encodeAsync: () => encodeAsync2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  fromJSONSchema: () => fromJSONSchema,
  function: () => _function,
  getErrorMap: () => getErrorMap,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  includes: () => _includes,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  mac: () => mac2,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  meta: () => meta2,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  overwrite: () => _overwrite,
  parse: () => parse2,
  parseAsync: () => parseAsync2,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  preprocess: () => preprocess,
  prettifyError: () => prettifyError,
  promise: () => promise,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode2,
  safeDecodeAsync: () => safeDecodeAsync2,
  safeEncode: () => safeEncode2,
  safeEncodeAsync: () => safeEncodeAsync2,
  safeParse: () => safeParse2,
  safeParseAsync: () => safeParseAsync2,
  set: () => set,
  setErrorMap: () => setErrorMap,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  util: () => util_exports,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});

// node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  $ZodAny: () => $ZodAny,
  $ZodArray: () => $ZodArray,
  $ZodAsyncError: () => $ZodAsyncError,
  $ZodBase64: () => $ZodBase64,
  $ZodBase64URL: () => $ZodBase64URL,
  $ZodBigInt: () => $ZodBigInt,
  $ZodBigIntFormat: () => $ZodBigIntFormat,
  $ZodBoolean: () => $ZodBoolean,
  $ZodCIDRv4: () => $ZodCIDRv4,
  $ZodCIDRv6: () => $ZodCIDRv6,
  $ZodCUID: () => $ZodCUID,
  $ZodCUID2: () => $ZodCUID2,
  $ZodCatch: () => $ZodCatch,
  $ZodCheck: () => $ZodCheck,
  $ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
  $ZodCheckEndsWith: () => $ZodCheckEndsWith,
  $ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
  $ZodCheckIncludes: () => $ZodCheckIncludes,
  $ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
  $ZodCheckLessThan: () => $ZodCheckLessThan,
  $ZodCheckLowerCase: () => $ZodCheckLowerCase,
  $ZodCheckMaxLength: () => $ZodCheckMaxLength,
  $ZodCheckMaxSize: () => $ZodCheckMaxSize,
  $ZodCheckMimeType: () => $ZodCheckMimeType,
  $ZodCheckMinLength: () => $ZodCheckMinLength,
  $ZodCheckMinSize: () => $ZodCheckMinSize,
  $ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
  $ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
  $ZodCheckOverwrite: () => $ZodCheckOverwrite,
  $ZodCheckProperty: () => $ZodCheckProperty,
  $ZodCheckRegex: () => $ZodCheckRegex,
  $ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
  $ZodCheckStartsWith: () => $ZodCheckStartsWith,
  $ZodCheckStringFormat: () => $ZodCheckStringFormat,
  $ZodCheckUpperCase: () => $ZodCheckUpperCase,
  $ZodCodec: () => $ZodCodec,
  $ZodCustom: () => $ZodCustom,
  $ZodCustomStringFormat: () => $ZodCustomStringFormat,
  $ZodDate: () => $ZodDate,
  $ZodDefault: () => $ZodDefault,
  $ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
  $ZodE164: () => $ZodE164,
  $ZodEmail: () => $ZodEmail,
  $ZodEmoji: () => $ZodEmoji,
  $ZodEncodeError: () => $ZodEncodeError,
  $ZodEnum: () => $ZodEnum,
  $ZodError: () => $ZodError,
  $ZodExactOptional: () => $ZodExactOptional,
  $ZodFile: () => $ZodFile,
  $ZodFunction: () => $ZodFunction,
  $ZodGUID: () => $ZodGUID,
  $ZodIPv4: () => $ZodIPv4,
  $ZodIPv6: () => $ZodIPv6,
  $ZodISODate: () => $ZodISODate,
  $ZodISODateTime: () => $ZodISODateTime,
  $ZodISODuration: () => $ZodISODuration,
  $ZodISOTime: () => $ZodISOTime,
  $ZodIntersection: () => $ZodIntersection,
  $ZodJWT: () => $ZodJWT,
  $ZodKSUID: () => $ZodKSUID,
  $ZodLazy: () => $ZodLazy,
  $ZodLiteral: () => $ZodLiteral,
  $ZodMAC: () => $ZodMAC,
  $ZodMap: () => $ZodMap,
  $ZodNaN: () => $ZodNaN,
  $ZodNanoID: () => $ZodNanoID,
  $ZodNever: () => $ZodNever,
  $ZodNonOptional: () => $ZodNonOptional,
  $ZodNull: () => $ZodNull,
  $ZodNullable: () => $ZodNullable,
  $ZodNumber: () => $ZodNumber,
  $ZodNumberFormat: () => $ZodNumberFormat,
  $ZodObject: () => $ZodObject,
  $ZodObjectJIT: () => $ZodObjectJIT,
  $ZodOptional: () => $ZodOptional,
  $ZodPipe: () => $ZodPipe,
  $ZodPrefault: () => $ZodPrefault,
  $ZodPreprocess: () => $ZodPreprocess,
  $ZodPromise: () => $ZodPromise,
  $ZodReadonly: () => $ZodReadonly,
  $ZodRealError: () => $ZodRealError,
  $ZodRecord: () => $ZodRecord,
  $ZodRegistry: () => $ZodRegistry,
  $ZodSet: () => $ZodSet,
  $ZodString: () => $ZodString,
  $ZodStringFormat: () => $ZodStringFormat,
  $ZodSuccess: () => $ZodSuccess,
  $ZodSymbol: () => $ZodSymbol,
  $ZodTemplateLiteral: () => $ZodTemplateLiteral,
  $ZodTransform: () => $ZodTransform,
  $ZodTuple: () => $ZodTuple,
  $ZodType: () => $ZodType,
  $ZodULID: () => $ZodULID,
  $ZodURL: () => $ZodURL,
  $ZodUUID: () => $ZodUUID,
  $ZodUndefined: () => $ZodUndefined,
  $ZodUnion: () => $ZodUnion,
  $ZodUnknown: () => $ZodUnknown,
  $ZodVoid: () => $ZodVoid,
  $ZodXID: () => $ZodXID,
  $ZodXor: () => $ZodXor,
  $brand: () => $brand,
  $constructor: () => $constructor,
  $input: () => $input,
  $output: () => $output,
  Doc: () => Doc,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _check: () => _check,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _decode: () => _decode,
  _decodeAsync: () => _decodeAsync,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _encode: () => _encode,
  _encodeAsync: () => _encodeAsync,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _mac: () => _mac,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeDecode: () => _safeDecode,
  _safeDecodeAsync: () => _safeDecodeAsync,
  _safeEncode: () => _safeEncode,
  _safeEncodeAsync: () => _safeEncodeAsync,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _slugify: () => _slugify,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _superRefine: () => _superRefine,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  _xor: () => _xor,
  clone: () => clone,
  config: () => config,
  createStandardJSONSchemaMethod: () => createStandardJSONSchemaMethod,
  createToJSONSchemaMethod: () => createToJSONSchemaMethod,
  decode: () => decode,
  decodeAsync: () => decodeAsync,
  describe: () => describe,
  encode: () => encode,
  encodeAsync: () => encodeAsync,
  extractDefs: () => extractDefs,
  finalize: () => finalize,
  flattenError: () => flattenError,
  formatError: () => formatError,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  initializeContext: () => initializeContext,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  meta: () => meta,
  parse: () => parse,
  parseAsync: () => parseAsync,
  prettifyError: () => prettifyError,
  process: () => process,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode,
  safeDecodeAsync: () => safeDecodeAsync,
  safeEncode: () => safeEncode,
  safeEncodeAsync: () => safeEncodeAsync,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  treeifyError: () => treeifyError,
  util: () => util_exports,
  version: () => version
});

// node_modules/zod/v4/core/core.js
var _a;
var NEVER = /* @__PURE__ */ Object.freeze({
  status: "aborted"
});
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a3;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = /* @__PURE__ */ Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {
}
function getEnumValues(entries2) {
  const numericValues = Object.values(entries2).filter((v) => typeof v === "number");
  const values = Object.entries(entries2).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set2 = false;
  return {
    get value() {
      if (!set2) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base643) {
  const binaryString = atob(base643);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url3) {
  const base643 = base64url3.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base643.length % 4) % 4);
  return base64ToUint8Array(base643 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex3) {
  const cleanHex = hex3.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error51.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error51, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error52, path = []) => {
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error51);
  return fieldErrors;
}
function treeifyError(error51, mapper = (issue2) => issue2.message) {
  const result = { errors: [] };
  const processError = (error52, path = []) => {
    var _a3, _b;
    for (const issue2 of error52.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i];
          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            (_a3 = curr.properties)[el] ?? (_a3[el] = { errors: [] });
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_b = curr.items)[el] ?? (_b[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i++;
        }
      }
    }
  };
  processError(error51);
  return result;
}
function toDotPath(_path) {
  const segs = [];
  const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
  for (const seg of path) {
    if (typeof seg === "number")
      segs.push(`[${seg}]`);
    else if (typeof seg === "symbol")
      segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg))
      segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error51) {
  const lines = [];
  const issues = [...error51.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
  for (const issue2 of issues) {
    lines.push(`\u2716 ${issue2.message}`);
    if (issue2.path?.length)
      lines.push(`  \u2192 at ${toDotPath(issue2.path)}`);
  }
  return lines.join("\n");
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx);
};
var encode = /* @__PURE__ */ _encode($ZodRealError);
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var decode = /* @__PURE__ */ _decode($ZodRealError);
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx);
};
var encodeAsync = /* @__PURE__ */ _encodeAsync($ZodRealError);
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var decodeAsync = /* @__PURE__ */ _decodeAsync($ZodRealError);
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var safeEncode = /* @__PURE__ */ _safeEncode($ZodRealError);
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var safeDecode = /* @__PURE__ */ _safeDecode($ZodRealError);
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);

// node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hex: () => hex,
  hostname: () => hostname,
  html5Email: () => html5Email,
  httpProtocol: () => httpProtocol,
  idnEmail: () => idnEmail,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  mac: () => mac,
  md5_base64: () => md5_base64,
  md5_base64url: () => md5_base64url,
  md5_hex: () => md5_hex,
  nanoid: () => nanoid,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  sha1_base64: () => sha1_base64,
  sha1_base64url: () => sha1_base64url,
  sha1_hex: () => sha1_hex,
  sha256_base64: () => sha256_base64,
  sha256_base64url: () => sha256_base64url,
  sha256_hex: () => sha256_hex,
  sha384_base64: () => sha384_base64,
  sha384_base64url: () => sha384_base64url,
  sha384_hex: () => sha384_hex,
  sha512_base64: () => sha512_base64,
  sha512_base64url: () => sha512_base64url,
  sha512_hex: () => sha512_hex,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var uuid4 = /* @__PURE__ */ uuid(4);
var uuid6 = /* @__PURE__ */ uuid(6);
var uuid7 = /* @__PURE__ */ uuid(7);
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
var idnEmail = unicodeEmail;
var browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var mac = (delimiter) => {
  const escapedDelim = escapeRegex(delimiter ?? ":");
  return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var domain = /^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var _undefined = /^undefined$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
var hex = /^[0-9a-fA-F]*$/;
function fixedBase64(bodyLength, padding) {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
function fixedBase64url(length) {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
var md5_hex = /^[0-9a-fA-F]{32}$/;
var md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
var md5_base64url = /* @__PURE__ */ fixedBase64url(22);
var sha1_hex = /^[0-9a-fA-F]{40}$/;
var sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
var sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
var sha256_hex = /^[0-9a-fA-F]{64}$/;
var sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
var sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
var sha384_hex = /^[0-9a-fA-F]{96}$/;
var sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
var sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
var sha512_hex = /^[0-9a-fA-F]{128}$/;
var sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
var sha512_base64url = /* @__PURE__ */ fixedBase64url(86);

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a3;
    (_a3 = inst2._zod.bag).multipleOf ?? (_a3.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (input < minimum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "bigint",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size <= def.maximum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size >= def.minimum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input),
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.size !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.size;
    bag.maximum = def.size;
    bag.size = def.size;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const size = input.size;
    if (size === def.size)
      return;
    const tooBig = size > def.size;
    payload.issues.push({
      origin: getSizableOrigin(input),
      ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    const result = def.schema._zod.run({
      value: payload.value[def.property],
      issues: []
    }, {});
    if (result instanceof Promise) {
      return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
    }
    handleCheckPropertyResult(result, payload, def.property);
    return;
  };
});
var $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
  $ZodCheck.init(inst, def);
  const mimeSet = new Set(def.mime);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.mime = def.mime;
  });
  inst._zod.check = (payload) => {
    if (mimeSet.has(payload.value.type))
      return;
    payload.issues.push({
      code: "invalid_value",
      values: def.mime,
      input: payload.value.type,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 4,
  patch: 3
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url2 = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url2.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url2.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
  def.pattern ?? (def.pattern = mac(def.delimiter));
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `mac`;
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error();
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (def.fn(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: def.format,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigIntFormat", (inst, def) => {
  $ZodCheckBigIntFormat.init(inst, def);
  $ZodBigInt.init(inst, def);
});
var $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "symbol")
      return payload;
    payload.issues.push({
      expected: "symbol",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _undefined;
  inst._zod.values = /* @__PURE__ */ new Set([void 0]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "undefined",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (typeof input === "undefined")
      return payload;
    payload.issues.push({
      expected: "void",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input = payload.value;
    const isDate = input instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      const schema = shape[key];
      const isOptionalIn = schema?._zod?.optin === "optional";
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
  const successes = results.filter((r) => r.issues.length === 0);
  if (successes.length === 1) {
    final.value = successes[0].value;
    return final;
  }
  if (successes.length === 0) {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
    });
  } else {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: [],
      inclusive: false
    });
  }
  return final;
}
var $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
  $ZodUnion.init(inst, def);
  def.inclusive = false;
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        results.push(result);
      }
    }
    if (!async)
      return handleExclusiveUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleExclusiveUnionResults(results2, payload, inst, ctx);
    });
  };
});
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazy(inst._zod, "propValues", () => {
    const propValues = {};
    for (const option of def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
      for (const [k, v] of Object.entries(pv)) {
        if (!propValues[k])
          propValues[k] = /* @__PURE__ */ new Set();
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    return propValues;
  });
  const disc = cached(() => {
    const opts = def.options;
    const map2 = /* @__PURE__ */ new Map();
    for (const o of opts) {
      const values = o._zod.propValues?.[def.discriminator];
      if (!values || values.size === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
      for (const v of values) {
        if (map2.has(v)) {
          throw new Error(`Duplicate discriminator value "${String(v)}"`);
        }
        map2.set(v, o);
      }
    }
    return map2;
  });
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const opt = disc.value.get(input?.[def.discriminator]);
    if (opt) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const items = def.items;
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        input,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = [];
    const proms = [];
    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");
    if (!def.rest) {
      if (input.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          minimum: optinStart,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
        return payload;
      }
      if (input.length > items.length) {
        payload.issues.push({
          code: "too_big",
          maximum: items.length,
          inclusive: true,
          input,
          inst,
          origin: "array"
        });
      }
    }
    const itemResults = new Array(items.length);
    for (let i = 0; i < items.length; i++) {
      const r = items[i]._zod.run({ value: input[i], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((rr) => {
          itemResults[i] = rr;
        }));
      } else {
        itemResults[i] = r;
      }
    }
    if (def.rest) {
      let i = items.length - 1;
      const rest = input.slice(items.length);
      for (const el of rest) {
        i++;
        const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input, optoutStart));
    }
    return handleTupleResults(itemResults, payload, items, input, optoutStart);
  };
});
function getTupleOptStart(items, key) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (items[i]._zod[key] !== "optional")
      return i + 1;
  }
  return 0;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input, optoutStart) {
  for (let i = 0; i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input.length;
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }
  for (let i = final.value.length - 1; i >= input.length; i--) {
    if (items[i]._zod.optout === "optional" && final.value[i] === void 0) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values) {
      payload.value = {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Map)) {
      payload.issues.push({
        expected: "map",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Map();
    for (const [key, value] of input) {
      const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
      const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
          handleMapResult(keyResult2, valueResult2, payload, key, input, inst, ctx);
        }));
      } else {
        handleMapResult(keyResult, valueResult, payload, key, input, inst, ctx);
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleMapResult(keyResult, valueResult, final, key, input, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",
        origin: "map",
        input,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
var $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!(input instanceof Set)) {
      payload.issues.push({
        input,
        inst,
        expected: "set",
        code: "invalid_type"
      });
      return payload;
    }
    const proms = [];
    payload.value = /* @__PURE__ */ new Set();
    for (const item of input) {
      const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleSetResult(result2, payload)));
      } else
        handleSetResult(result, payload);
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input instanceof File)
      return payload;
    payload.issues.push({
      expected: "file",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError("ZodSuccess");
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.issues.length === 0;
        return payload;
      });
    }
    payload.value = result.issues.length === 0;
    return payload;
  };
});
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
var $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "nan",
        code: "invalid_type"
      });
      return payload;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
var $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
      const left = def.in._zod.run(payload, ctx);
      if (left instanceof Promise) {
        return left.then((left2) => handleCodecAResult(left2, def, ctx));
      }
      return handleCodecAResult(left, def, ctx);
    } else {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handleCodecAResult(right2, def, ctx));
      }
      return handleCodecAResult(right, def, ctx);
    }
  };
});
function handleCodecAResult(result, def, ctx) {
  if (result.issues.length) {
    result.aborted = true;
    return result;
  }
  const direction = ctx.direction || "forward";
  if (direction === "forward") {
    const transformed = def.transform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
    }
    return handleCodecTxResult(result, transformed, def.out, ctx);
  } else {
    const transformed = def.reverseTransform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
    }
    return handleCodecTxResult(result, transformed, def.in, ctx);
  }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const regexParts = [];
  for (const part of def.parts) {
    if (typeof part === "object" && part !== null) {
      if (!part._zod.pattern) {
        throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
      }
      const source = part._zod.pattern instanceof RegExp ? part._zod.pattern.source : part._zod.pattern;
      if (!source)
        throw new Error(`Invalid template literal part: ${part._zod.traits}`);
      const start = source.startsWith("^") ? 1 : 0;
      const end = source.endsWith("$") ? source.length - 1 : source.length;
      regexParts.push(source.slice(start, end));
    } else if (part === null || primitiveTypes.has(typeof part)) {
      regexParts.push(escapeRegex(`${part}`));
    } else {
      throw new Error(`Invalid template literal part: ${part}`);
    }
  }
  inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "string") {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "string",
        code: "invalid_type"
      });
      return payload;
    }
    inst._zod.pattern.lastIndex = 0;
    if (!inst._zod.pattern.test(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        code: "invalid_format",
        format: def.format ?? "template_literal",
        pattern: inst._zod.pattern.source
      });
      return payload;
    }
    return payload;
  };
});
var $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
  $ZodType.init(inst, def);
  inst._def = def;
  inst._zod.def = def;
  inst.implement = (func) => {
    if (typeof func !== "function") {
      throw new Error("implement() must be called with a function");
    }
    return function(...args) {
      const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
      const result = Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return parse(inst._def.output, result);
      }
      return result;
    };
  };
  inst.implementAsync = (func) => {
    if (typeof func !== "function") {
      throw new Error("implementAsync() must be called with a function");
    }
    return async function(...args) {
      const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
      const result = await Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return await parseAsync(inst._def.output, result);
      }
      return result;
    };
  };
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "function") {
      payload.issues.push({
        code: "invalid_type",
        expected: "function",
        input: payload.value,
        inst
      });
      return payload;
    }
    const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
    if (hasPromiseOutput) {
      payload.value = inst.implementAsync(payload.value);
    } else {
      payload.value = inst.implement(payload.value);
    }
    return payload;
  };
  inst.input = (...args) => {
    const F = inst.constructor;
    if (Array.isArray(args[0])) {
      return new F({
        type: "function",
        input: new $ZodTuple({
          type: "tuple",
          items: args[0],
          rest: args[1]
        }),
        output: inst._def.output
      });
    }
    return new F({
      type: "function",
      input: args[0],
      output: inst._def.output
    });
  };
  inst.output = (output) => {
    const F = inst.constructor;
    return new F({
      type: "function",
      input: inst._def.input,
      output
    });
  };
  return inst;
});
var $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
  };
});
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazy(inst._zod, "pattern", () => inst._zod.innerType?._zod?.pattern);
  defineLazy(inst._zod, "propValues", () => inst._zod.innerType?._zod?.propValues);
  defineLazy(inst._zod, "optin", () => inst._zod.innerType?._zod?.optin ?? void 0);
  defineLazy(inst._zod, "optout", () => inst._zod.innerType?._zod?.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  bg: () => bg_default,
  ca: () => ca_default,
  cs: () => cs_default,
  da: () => da_default,
  de: () => de_default,
  el: () => el_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  he: () => he_default,
  hr: () => hr_default,
  hu: () => hu_default,
  hy: () => hy_default,
  id: () => id_default,
  is: () => is_default,
  it: () => it_default,
  ja: () => ja_default,
  ka: () => ka_default,
  kh: () => kh_default,
  km: () => km_default,
  ko: () => ko_default,
  lt: () => lt_default,
  mk: () => mk_default,
  ms: () => ms_default,
  nl: () => nl_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ro: () => ro_default,
  ru: () => ru_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  th: () => th_default,
  tr: () => tr_default,
  ua: () => ua_default,
  uk: () => uk_default,
  ur: () => ur_default,
  uz: () => uz_default,
  vi: () => vi_default,
  yo: () => yo_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default
});

// node_modules/zod/v4/locales/ar.js
var error = () => {
  const Sizable = {
    string: { unit: "\u062D\u0631\u0641", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    file: { unit: "\u0628\u0627\u064A\u062A", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    array: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    set: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0645\u062F\u062E\u0644",
    email: "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
    url: "\u0631\u0627\u0628\u0637",
    emoji: "\u0625\u064A\u0645\u0648\u062C\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4",
    ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6",
    cidrv4: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4",
    cidrv6: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6",
    base64: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded",
    base64url: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded",
    json_string: "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON",
    e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164",
    jwt: "JWT",
    template_literal: "\u0645\u062F\u062E\u0644"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 instanceof ${issue2.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
        }
        return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"}`;
        return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${issue2.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
      }
      case "not_multiple_of":
        return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u0645\u0639\u0631\u0641${issue2.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${issue2.keys.length > 1 ? "\u0629" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      case "invalid_key":
        return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      case "invalid_union":
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
      case "invalid_element":
        return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      default:
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
    }
  };
};
function ar_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/locales/az.js
var error2 = () => {
  const Sizable = {
    string: { unit: "simvol", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    array: { unit: "element", verb: "olmal\u0131d\u0131r" },
    set: { unit: "element", verb: "olmal\u0131d\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n instanceof ${issue2.expected}, daxil olan ${received}`;
        }
        return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${expected}, daxil olan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${stringifyPrimitive(issue2.values[0])}`;
        return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
        if (_issue.format === "ends_with")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.suffix}" il\u0259 bitm\u0259lidir`;
        if (_issue.format === "includes")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.includes}" daxil olmal\u0131d\u0131r`;
        if (_issue.format === "regex")
          return `Yanl\u0131\u015F m\u0259tn: ${_issue.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
        return `Yanl\u0131\u015F ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Yanl\u0131\u015F \u0259d\u0259d: ${issue2.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan a\xE7ar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
      case "invalid_union":
        return "Yanl\u0131\u015F d\u0259y\u0259r";
      case "invalid_element":
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
      default:
        return `Yanl\u0131\u015F d\u0259y\u0259r`;
    }
  };
};
function az_default() {
  return {
    localeError: error2()
  };
}

// node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error3 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0441\u0456\u043C\u0432\u0430\u043B",
        few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B",
        many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    array: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    set: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    file: {
      unit: {
        one: "\u0431\u0430\u0439\u0442",
        few: "\u0431\u0430\u0439\u0442\u044B",
        many: "\u0431\u0430\u0439\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0443\u0432\u043E\u0434",
    email: "email \u0430\u0434\u0440\u0430\u0441",
    url: "URL",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0447\u0430\u0441",
    duration: "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C",
    ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441",
    cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    base64: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64",
    base64url: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url",
    json_string: "JSON \u0440\u0430\u0434\u043E\u043A",
    e164: "\u043D\u0443\u043C\u0430\u0440 E.164",
    jwt: "JWT",
    template_literal: "\u0443\u0432\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u043B\u0456\u043A",
    array: "\u043C\u0430\u0441\u0456\u045E"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F instanceof ${issue2.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
        }
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${issue2.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
      case "invalid_element":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${issue2.origin}`;
      default:
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434`;
    }
  };
};
function be_default() {
  return {
    localeError: error3()
  };
}

// node_modules/zod/v4/locales/bg.js
var error4 = () => {
  const Sizable = {
    string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    file: { unit: "\u0431\u0430\u0439\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0445\u043E\u0434",
    email: "\u0438\u043C\u0435\u0439\u043B \u0430\u0434\u0440\u0435\u0441",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u0434\u0436\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0432\u0440\u0435\u043C\u0435",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    duration: "ISO \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    base64: "base64-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    base64url: "base64url-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    json_string: "JSON \u043D\u0438\u0437",
    e164: "E.164 \u043D\u043E\u043C\u0435\u0440",
    jwt: "JWT",
    template_literal: "\u0432\u0445\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
        }
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u043E\u043F\u0446\u0438\u044F: \u043E\u0447\u0430\u043A\u0432\u0430\u043D\u043E \u0435\u0434\u043D\u043E \u043E\u0442 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430"}`;
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0441 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0441 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0441\u044A\u0432\u043F\u0430\u0434\u0430 \u0441 ${_issue.pattern}`;
        let invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D";
        if (_issue.format === "emoji")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "datetime")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "date")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        if (_issue.format === "time")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "duration")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        return `${invalid_adj} ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E \u0447\u0438\u0441\u043B\u043E: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0431\u044A\u0434\u0435 \u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0430 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0437\u043F\u043E\u0437\u043D\u0430\u0442${issue2.keys.length > 1 ? "\u0438" : ""} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u043E\u0432\u0435" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442 \u0432 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434`;
    }
  };
};
function bg_default() {
  return {
    localeError: error4()
  };
}

// node_modules/zod/v4/locales/ca.js
var error5 = () => {
  const Sizable = {
    string: { unit: "car\xE0cters", verb: "contenir" },
    file: { unit: "bytes", verb: "contenir" },
    array: { unit: "elements", verb: "contenir" },
    set: { unit: "elements", verb: "contenir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entrada",
    email: "adre\xE7a electr\xF2nica",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i hora ISO",
    date: "data ISO",
    time: "hora ISO",
    duration: "durada ISO",
    ipv4: "adre\xE7a IPv4",
    ipv6: "adre\xE7a IPv6",
    cidrv4: "rang IPv4",
    cidrv6: "rang IPv6",
    base64: "cadena codificada en base64",
    base64url: "cadena codificada en base64url",
    json_string: "cadena JSON",
    e164: "n\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Tipus inv\xE0lid: s'esperava instanceof ${issue2.expected}, s'ha rebut ${received}`;
        }
        return `Tipus inv\xE0lid: s'esperava ${expected}, s'ha rebut ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Valor inv\xE0lid: s'esperava ${stringifyPrimitive(issue2.values[0])}`;
        return `Opci\xF3 inv\xE0lida: s'esperava una de ${joinValues(issue2.values, " o ")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "com a m\xE0xim" : "menys de";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} contingu\xE9s ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} fos ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "com a m\xEDnim" : "m\xE9s de";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Massa petit: s'esperava que ${issue2.origin} contingu\xE9s ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Massa petit: s'esperava que ${issue2.origin} fos ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Format inv\xE0lid: ha de comen\xE7ar amb "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Format inv\xE0lid: ha d'acabar amb "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Format inv\xE0lid: ha d'incloure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${_issue.pattern}`;
        return `Format inv\xE0lid per a ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Clau${issue2.keys.length > 1 ? "s" : ""} no reconeguda${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Clau inv\xE0lida a ${issue2.origin}`;
      case "invalid_union":
        return "Entrada inv\xE0lida";
      // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
      case "invalid_element":
        return `Element inv\xE0lid a ${issue2.origin}`;
      default:
        return `Entrada inv\xE0lida`;
    }
  };
};
function ca_default() {
  return {
    localeError: error5()
  };
}

// node_modules/zod/v4/locales/cs.js
var error6 = () => {
  const Sizable = {
    string: { unit: "znak\u016F", verb: "m\xEDt" },
    file: { unit: "bajt\u016F", verb: "m\xEDt" },
    array: { unit: "prvk\u016F", verb: "m\xEDt" },
    set: { unit: "prvk\u016F", verb: "m\xEDt" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regul\xE1rn\xED v\xFDraz",
    email: "e-mailov\xE1 adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "datum a \u010Das ve form\xE1tu ISO",
    date: "datum ve form\xE1tu ISO",
    time: "\u010Das ve form\xE1tu ISO",
    duration: "doba trv\xE1n\xED ISO",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64",
    base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url",
    json_string: "\u0159et\u011Bzec ve form\xE1tu JSON",
    e164: "\u010D\xEDslo E.164",
    jwt: "JWT",
    template_literal: "vstup"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u010D\xEDslo",
    string: "\u0159et\u011Bzec",
    function: "funkce",
    array: "pole"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no instanceof ${issue2.expected}, obdr\u017Eeno ${received}`;
        }
        return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${expected}, obdr\u017Eeno ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${stringifyPrimitive(issue2.values[0])}`;
        return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${_issue.pattern}`;
        return `Neplatn\xFD form\xE1t ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nezn\xE1m\xE9 kl\xED\u010De: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neplatn\xFD kl\xED\u010D v ${issue2.origin}`;
      case "invalid_union":
        return "Neplatn\xFD vstup";
      case "invalid_element":
        return `Neplatn\xE1 hodnota v ${issue2.origin}`;
      default:
        return `Neplatn\xFD vstup`;
    }
  };
};
function cs_default() {
  return {
    localeError: error6()
  };
}

// node_modules/zod/v4/locales/da.js
var error7 = () => {
  const Sizable = {
    string: { unit: "tegn", verb: "havde" },
    file: { unit: "bytes", verb: "havde" },
    array: { unit: "elementer", verb: "indeholdt" },
    set: { unit: "elementer", verb: "indeholdt" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "e-mailadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkesl\xE6t",
    date: "ISO-dato",
    time: "ISO-klokkesl\xE6t",
    duration: "ISO-varighed",
    ipv4: "IPv4-omr\xE5de",
    ipv6: "IPv6-omr\xE5de",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    base64: "base64-kodet streng",
    base64url: "base64url-kodet streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "streng",
    number: "tal",
    boolean: "boolean",
    array: "liste",
    object: "objekt",
    set: "s\xE6t",
    file: "fil"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldigt input: forventede instanceof ${issue2.expected}, fik ${received}`;
        }
        return `Ugyldigt input: forventede ${expected}, fik ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ugyldig v\xE6rdi: forventede ${stringifyPrimitive(issue2.values[0])}`;
        return `Ugyldigt valg: forventede en af f\xF8lgende ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `For stor: forventede ${origin ?? "value"} ${sizing.verb} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        return `For stor: forventede ${origin ?? "value"} havde ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `For lille: forventede ${origin} ${sizing.verb} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lille: forventede ${origin} havde ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ugyldig streng: skal starte med "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Ugyldig streng: skal ende med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ugyldig streng: skal indeholde "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ugyldig streng: skal matche m\xF8nsteret ${_issue.pattern}`;
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ugyldigt tal: skal v\xE6re deleligt med ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ukendte n\xF8gler" : "Ukendt n\xF8gle"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8gle i ${issue2.origin}`;
      case "invalid_union":
        return "Ugyldigt input: matcher ingen af de tilladte typer";
      case "invalid_element":
        return `Ugyldig v\xE6rdi i ${issue2.origin}`;
      default:
        return `Ugyldigt input`;
    }
  };
};
function da_default() {
  return {
    localeError: error7()
  };
}

// node_modules/zod/v4/locales/de.js
var error8 = () => {
  const Sizable = {
    string: { unit: "Zeichen", verb: "zu haben" },
    file: { unit: "Bytes", verb: "zu haben" },
    array: { unit: "Elemente", verb: "zu haben" },
    set: { unit: "Elemente", verb: "zu haben" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "Eingabe",
    email: "E-Mail-Adresse",
    url: "URL",
    emoji: "Emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-Datum und -Uhrzeit",
    date: "ISO-Datum",
    time: "ISO-Uhrzeit",
    duration: "ISO-Dauer",
    ipv4: "IPv4-Adresse",
    ipv6: "IPv6-Adresse",
    cidrv4: "IPv4-Bereich",
    cidrv6: "IPv6-Bereich",
    base64: "Base64-codierter String",
    base64url: "Base64-URL-codierter String",
    json_string: "JSON-String",
    e164: "E.164-Nummer",
    jwt: "JWT",
    template_literal: "Eingabe"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "Zahl",
    array: "Array"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ung\xFCltige Eingabe: erwartet instanceof ${issue2.expected}, erhalten ${received}`;
        }
        return `Ung\xFCltige Eingabe: erwartet ${expected}, erhalten ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ung\xFCltige Eingabe: erwartet ${stringifyPrimitive(issue2.values[0])}`;
        return `Ung\xFCltige Option: erwartet eine von ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
        return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ist`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} hat`;
        }
        return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ist`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ung\xFCltiger String: muss mit "${_issue.prefix}" beginnen`;
        if (_issue.format === "ends_with")
          return `Ung\xFCltiger String: muss mit "${_issue.suffix}" enden`;
        if (_issue.format === "includes")
          return `Ung\xFCltiger String: muss "${_issue.includes}" enthalten`;
        if (_issue.format === "regex")
          return `Ung\xFCltiger String: muss dem Muster ${_issue.pattern} entsprechen`;
        return `Ung\xFCltig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ung\xFCltige Zahl: muss ein Vielfaches von ${issue2.divisor} sein`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ung\xFCltiger Schl\xFCssel in ${issue2.origin}`;
      case "invalid_union":
        return "Ung\xFCltige Eingabe";
      case "invalid_element":
        return `Ung\xFCltiger Wert in ${issue2.origin}`;
      default:
        return `Ung\xFCltige Eingabe`;
    }
  };
};
function de_default() {
  return {
    localeError: error8()
  };
}

// node_modules/zod/v4/locales/el.js
var error9 = () => {
  const Sizable = {
    string: { unit: "\u03C7\u03B1\u03C1\u03B1\u03BA\u03C4\u03AE\u03C1\u03B5\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    file: { unit: "bytes", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    array: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    set: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    map: { unit: "\u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03C3\u03B5\u03B9\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
    email: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1 \u03BA\u03B1\u03B9 \u03CE\u03C1\u03B1",
    date: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1",
    time: "ISO \u03CE\u03C1\u03B1",
    duration: "ISO \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1",
    ipv4: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv4",
    ipv6: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv6",
    mac: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 MAC",
    cidrv4: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv4",
    cidrv6: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv6",
    base64: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64",
    base64url: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64url",
    json_string: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC JSON",
    e164: "\u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 E.164",
    jwt: "JWT",
    template_literal: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (typeof issue2.expected === "string" && /^[A-Z]/.test(issue2.expected)) {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD instanceof ${issue2.expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
        }
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${stringifyPrimitive(issue2.values[0])}`;
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD \u03AD\u03BD\u03B1 \u03B1\u03C0\u03CC ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1"}`;
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AC \u03BC\u03B5 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B5\u03BB\u03B5\u03B9\u03CE\u03BD\u03B5\u03B9 \u03BC\u03B5 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03B5\u03C1\u03B9\u03AD\u03C7\u03B5\u03B9 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B1\u03B9\u03C1\u03B9\u03AC\u03B6\u03B5\u03B9 \u03BC\u03B5 \u03C4\u03BF \u03BC\u03BF\u03C4\u03AF\u03B2\u03BF ${_issue.pattern}`;
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF \u03C4\u03BF\u03C5 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u0386\u03B3\u03BD\u03C9\u03C3\u03C4${issue2.keys.length > 1 ? "\u03B1" : "\u03BF"} \u03BA\u03BB\u03B5\u03B9\u03B4${issue2.keys.length > 1 ? "\u03B9\u03AC" : "\u03AF"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03BA\u03BB\u03B5\u03B9\u03B4\u03AF \u03C3\u03C4\u03BF ${issue2.origin}`;
      case "invalid_union":
        return "\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2";
      case "invalid_element":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C4\u03B9\u03BC\u03AE \u03C3\u03C4\u03BF ${issue2.origin}`;
      default:
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2`;
    }
  };
};
function el_default() {
  return {
    localeError: error9()
  };
}

// node_modules/zod/v4/locales/en.js
var error10 = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error10()
  };
}

// node_modules/zod/v4/locales/eo.js
var error11 = () => {
  const Sizable = {
    string: { unit: "karaktrojn", verb: "havi" },
    file: { unit: "bajtojn", verb: "havi" },
    array: { unit: "elementojn", verb: "havi" },
    set: { unit: "elementojn", verb: "havi" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "enigo",
    email: "retadreso",
    url: "URL",
    emoji: "emo\u011Dio",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datotempo",
    date: "ISO-dato",
    time: "ISO-tempo",
    duration: "ISO-da\u016Dro",
    ipv4: "IPv4-adreso",
    ipv6: "IPv6-adreso",
    cidrv4: "IPv4-rango",
    cidrv6: "IPv6-rango",
    base64: "64-ume kodita karaktraro",
    base64url: "URL-64-ume kodita karaktraro",
    json_string: "JSON-karaktraro",
    e164: "E.164-nombro",
    jwt: "JWT",
    template_literal: "enigo"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "nombro",
    array: "tabelo",
    null: "senvalora"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nevalida enigo: atendi\u011Dis instanceof ${issue2.expected}, ricevi\u011Dis ${received}`;
        }
        return `Nevalida enigo: atendi\u011Dis ${expected}, ricevi\u011Dis ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Nevalida enigo: atendi\u011Dis ${stringifyPrimitive(issue2.values[0])}`;
        return `Nevalida opcio: atendi\u011Dis unu el ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
        return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} havu ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} estu ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Nevalida karaktraro: devas komenci\u011Di per "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Nevalida karaktraro: devas fini\u011Di per "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
        return `Nevalida ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Nevalida nombro: devas esti oblo de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nekonata${issue2.keys.length > 1 ? "j" : ""} \u015Dlosilo${issue2.keys.length > 1 ? "j" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Nevalida \u015Dlosilo en ${issue2.origin}`;
      case "invalid_union":
        return "Nevalida enigo";
      case "invalid_element":
        return `Nevalida valoro en ${issue2.origin}`;
      default:
        return `Nevalida enigo`;
    }
  };
};
function eo_default() {
  return {
    localeError: error11()
  };
}

// node_modules/zod/v4/locales/es.js
var error12 = () => {
  const Sizable = {
    string: { unit: "caracteres", verb: "tener" },
    file: { unit: "bytes", verb: "tener" },
    array: { unit: "elementos", verb: "tener" },
    set: { unit: "elementos", verb: "tener" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entrada",
    email: "direcci\xF3n de correo electr\xF3nico",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "fecha y hora ISO",
    date: "fecha ISO",
    time: "hora ISO",
    duration: "duraci\xF3n ISO",
    ipv4: "direcci\xF3n IPv4",
    ipv6: "direcci\xF3n IPv6",
    cidrv4: "rango IPv4",
    cidrv6: "rango IPv6",
    base64: "cadena codificada en base64",
    base64url: "URL codificada en base64",
    json_string: "cadena JSON",
    e164: "n\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "texto",
    number: "n\xFAmero",
    boolean: "booleano",
    array: "arreglo",
    object: "objeto",
    set: "conjunto",
    file: "archivo",
    date: "fecha",
    bigint: "n\xFAmero grande",
    symbol: "s\xEDmbolo",
    undefined: "indefinido",
    null: "nulo",
    function: "funci\xF3n",
    map: "mapa",
    record: "registro",
    tuple: "tupla",
    enum: "enumeraci\xF3n",
    union: "uni\xF3n",
    literal: "literal",
    promise: "promesa",
    void: "vac\xEDo",
    never: "nunca",
    unknown: "desconocido",
    any: "cualquiera"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entrada inv\xE1lida: se esperaba instanceof ${issue2.expected}, recibido ${received}`;
        }
        return `Entrada inv\xE1lida: se esperaba ${expected}, recibido ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entrada inv\xE1lida: se esperaba ${stringifyPrimitive(issue2.values[0])}`;
        return `Opci\xF3n inv\xE1lida: se esperaba una de ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `Demasiado grande: se esperaba que ${origin ?? "valor"} tuviera ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        return `Demasiado grande: se esperaba que ${origin ?? "valor"} fuera ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Demasiado peque\xF1o: se esperaba que ${origin} tuviera ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Demasiado peque\xF1o: se esperaba que ${origin} fuera ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Cadena inv\xE1lida: debe comenzar con "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Cadena inv\xE1lida: debe terminar en "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cadena inv\xE1lida: debe incluir "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${_issue.pattern}`;
        return `Inv\xE1lido ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Llave${issue2.keys.length > 1 ? "s" : ""} desconocida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Llave inv\xE1lida en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      case "invalid_union":
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Valor inv\xE1lido en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      default:
        return `Entrada inv\xE1lida`;
    }
  };
};
function es_default() {
  return {
    localeError: error12()
  };
}

// node_modules/zod/v4/locales/fa.js
var error13 = () => {
  const Sizable = {
    string: { unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    array: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    set: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0648\u0631\u0648\u062F\u06CC",
    email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644",
    url: "URL",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648",
    time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    duration: "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    ipv4: "IPv4 \u0622\u062F\u0631\u0633",
    ipv6: "IPv6 \u0622\u062F\u0631\u0633",
    cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647",
    cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647",
    base64: "base64-encoded \u0631\u0634\u062A\u0647",
    base64url: "base64url-encoded \u0631\u0634\u062A\u0647",
    json_string: "JSON \u0631\u0634\u062A\u0647",
    e164: "E.164 \u0639\u062F\u062F",
    jwt: "JWT",
    template_literal: "\u0648\u0631\u0648\u062F\u06CC"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0639\u062F\u062F",
    array: "\u0622\u0631\u0627\u06CC\u0647"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A instanceof ${issue2.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
        }
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
      }
      case "invalid_value":
        if (issue2.values.length === 1) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${stringifyPrimitive(issue2.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
        }
        return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${joinValues(issue2.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
        }
        if (_issue.format === "ends_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
        }
        if (_issue.format === "includes") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${_issue.includes}" \u0628\u0627\u0634\u062F`;
        }
        if (_issue.format === "regex") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${_issue.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
      case "not_multiple_of":
        return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${issue2.divisor} \u0628\u0627\u0634\u062F`;
      case "unrecognized_keys":
        return `\u06A9\u0644\u06CC\u062F${issue2.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${issue2.origin}`;
      case "invalid_union":
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      case "invalid_element":
        return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${issue2.origin}`;
      default:
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
    }
  };
};
function fa_default() {
  return {
    localeError: error13()
  };
}

// node_modules/zod/v4/locales/fi.js
var error14 = () => {
  const Sizable = {
    string: { unit: "merkki\xE4", subject: "merkkijonon" },
    file: { unit: "tavua", subject: "tiedoston" },
    array: { unit: "alkiota", subject: "listan" },
    set: { unit: "alkiota", subject: "joukon" },
    number: { unit: "", subject: "luvun" },
    bigint: { unit: "", subject: "suuren kokonaisluvun" },
    int: { unit: "", subject: "kokonaisluvun" },
    date: { unit: "", subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "s\xE4\xE4nn\xF6llinen lauseke",
    email: "s\xE4hk\xF6postiosoite",
    url: "URL-osoite",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-aikaleima",
    date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4",
    time: "ISO-aika",
    duration: "ISO-kesto",
    ipv4: "IPv4-osoite",
    ipv6: "IPv6-osoite",
    cidrv4: "IPv4-alue",
    cidrv6: "IPv6-alue",
    base64: "base64-koodattu merkkijono",
    base64url: "base64url-koodattu merkkijono",
    json_string: "JSON-merkkijono",
    e164: "E.164-luku",
    jwt: "JWT",
    template_literal: "templaattimerkkijono"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Virheellinen tyyppi: odotettiin instanceof ${issue2.expected}, oli ${received}`;
        }
        return `Virheellinen tyyppi: odotettiin ${expected}, oli ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Virheellinen sy\xF6te: t\xE4ytyy olla ${stringifyPrimitive(issue2.values[0])}`;
        return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian suuri: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.maximum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian suuri: arvon t\xE4ytyy olla ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian pieni: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.minimum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian pieni: arvon t\xE4ytyy olla ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${_issue.includes}"`;
        if (_issue.format === "regex") {
          return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${_issue.pattern}`;
        }
        return `Virheellinen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Virheellinen luku: t\xE4ytyy olla luvun ${issue2.divisor} monikerta`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return "Virheellinen avain tietueessa";
      case "invalid_union":
        return "Virheellinen unioni";
      case "invalid_element":
        return "Virheellinen arvo joukossa";
      default:
        return `Virheellinen sy\xF6te`;
    }
  };
};
function fi_default() {
  return {
    localeError: error14()
  };
}

// node_modules/zod/v4/locales/fr.js
var error15 = () => {
  const Sizable = {
    string: { unit: "caract\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entr\xE9e",
    email: "adresse e-mail",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date et heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\xEEne encod\xE9e en base64",
    base64url: "cha\xEEne encod\xE9e en base64url",
    json_string: "cha\xEEne JSON",
    e164: "num\xE9ro E.164",
    jwt: "JWT",
    template_literal: "entr\xE9e"
  };
  const TypeDictionary = {
    string: "cha\xEEne",
    number: "nombre",
    int: "entier",
    boolean: "bool\xE9en",
    bigint: "grand entier",
    symbol: "symbole",
    undefined: "ind\xE9fini",
    null: "null",
    never: "jamais",
    void: "vide",
    date: "date",
    array: "tableau",
    object: "objet",
    tuple: "tuple",
    record: "enregistrement",
    map: "carte",
    set: "ensemble",
    file: "fichier",
    nonoptional: "non-optionnel",
    nan: "NaN",
    function: "fonction"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : instanceof ${issue2.expected} attendu, ${received} re\xE7u`;
        }
        return `Entr\xE9e invalide : ${expected} attendu, ${received} re\xE7u`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entr\xE9e invalide : ${stringifyPrimitive(issue2.values[0])} attendu`;
        return `Option invalide : une valeur parmi ${joinValues(issue2.values, "|")} attendue`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xE9l\xE9ment(s)"}`;
        return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cha\xEEne invalide : doit correspondre au mod\xE8le ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${issue2.origin}`;
      default:
        return `Entr\xE9e invalide`;
    }
  };
};
function fr_default() {
  return {
    localeError: error15()
  };
}

// node_modules/zod/v4/locales/fr-CA.js
var error16 = () => {
  const Sizable = {
    string: { unit: "caract\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entr\xE9e",
    email: "adresse courriel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date-heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\xEEne encod\xE9e en base64",
    base64url: "cha\xEEne encod\xE9e en base64url",
    json_string: "cha\xEEne JSON",
    e164: "num\xE9ro E.164",
    jwt: "JWT",
    template_literal: "entr\xE9e"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : attendu instanceof ${issue2.expected}, re\xE7u ${received}`;
        }
        return `Entr\xE9e invalide : attendu ${expected}, re\xE7u ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entr\xE9e invalide : attendu ${stringifyPrimitive(issue2.values[0])}`;
        return `Option invalide : attendu l'une des valeurs suivantes ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u2264" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} ait ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} soit ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u2265" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop petit : attendu que ${issue2.origin} ait ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Trop petit : attendu que ${issue2.origin} soit ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cha\xEEne invalide : doit correspondre au motif ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${issue2.origin}`;
      default:
        return `Entr\xE9e invalide`;
    }
  };
};
function fr_CA_default() {
  return {
    localeError: error16()
  };
}

// node_modules/zod/v4/locales/he.js
var error17 = () => {
  const TypeNames = {
    string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA", gender: "f" },
    number: { label: "\u05DE\u05E1\u05E4\u05E8", gender: "m" },
    boolean: { label: "\u05E2\u05E8\u05DA \u05D1\u05D5\u05DC\u05D9\u05D0\u05E0\u05D9", gender: "m" },
    bigint: { label: "BigInt", gender: "m" },
    date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA", gender: "m" },
    array: { label: "\u05DE\u05E2\u05E8\u05DA", gender: "m" },
    object: { label: "\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8", gender: "m" },
    null: { label: "\u05E2\u05E8\u05DA \u05E8\u05D9\u05E7 (null)", gender: "m" },
    undefined: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05DE\u05D5\u05D2\u05D3\u05E8 (undefined)", gender: "m" },
    symbol: { label: "\u05E1\u05D9\u05DE\u05D1\u05D5\u05DC (Symbol)", gender: "m" },
    function: { label: "\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4", gender: "f" },
    map: { label: "\u05DE\u05E4\u05D4 (Map)", gender: "f" },
    set: { label: "\u05E7\u05D1\u05D5\u05E6\u05D4 (Set)", gender: "f" },
    file: { label: "\u05E7\u05D5\u05D1\u05E5", gender: "m" },
    promise: { label: "Promise", gender: "m" },
    NaN: { label: "NaN", gender: "m" },
    unknown: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2", gender: "m" },
    value: { label: "\u05E2\u05E8\u05DA", gender: "m" }
  };
  const Sizable = {
    string: { unit: "\u05EA\u05D5\u05D5\u05D9\u05DD", shortLabel: "\u05E7\u05E6\u05E8", longLabel: "\u05D0\u05E8\u05D5\u05DA" },
    file: { unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    array: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    set: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    number: { unit: "", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }
    // no unit
  };
  const typeEntry = (t) => t ? TypeNames[t] : void 0;
  const typeLabel = (t) => {
    const e = typeEntry(t);
    if (e)
      return e.label;
    return t ?? TypeNames.unknown.label;
  };
  const withDefinite = (t) => `\u05D4${typeLabel(t)}`;
  const verbFor = (t) => {
    const e = typeEntry(t);
    const gender = e?.gender ?? "m";
    return gender === "f" ? "\u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA" : "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA";
  };
  const getSizing = (origin) => {
    if (!origin)
      return null;
    return Sizable[origin] ?? null;
  };
  const FormatDictionary = {
    regex: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    email: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC", gender: "f" },
    url: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA", gender: "f" },
    emoji: { label: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9", gender: "m" },
    uuid: { label: "UUID", gender: "m" },
    nanoid: { label: "nanoid", gender: "m" },
    guid: { label: "GUID", gender: "m" },
    cuid: { label: "cuid", gender: "m" },
    cuid2: { label: "cuid2", gender: "m" },
    ulid: { label: "ULID", gender: "m" },
    xid: { label: "XID", gender: "m" },
    ksuid: { label: "KSUID", gender: "m" },
    datetime: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO", gender: "m" },
    date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO", gender: "m" },
    time: { label: "\u05D6\u05DE\u05DF ISO", gender: "m" },
    duration: { label: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO", gender: "m" },
    ipv4: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4", gender: "f" },
    ipv6: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6", gender: "f" },
    cidrv4: { label: "\u05D8\u05D5\u05D5\u05D7 IPv4", gender: "m" },
    cidrv6: { label: "\u05D8\u05D5\u05D5\u05D7 IPv6", gender: "m" },
    base64: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64", gender: "f" },
    base64url: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA", gender: "f" },
    json_string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON", gender: "f" },
    e164: { label: "\u05DE\u05E1\u05E4\u05E8 E.164", gender: "m" },
    jwt: { label: "JWT", gender: "m" },
    ends_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    includes: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    lowercase: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    starts_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    uppercase: { label: "\u05E7\u05DC\u05D8", gender: "m" }
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expectedKey = issue2.expected;
        const expected = TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? TypeNames[receivedType]?.label ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA instanceof ${issue2.expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
        }
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05E2\u05E8\u05DA \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA ${stringifyPrimitive(issue2.values[0])}`;
        }
        const stringified = issue2.values.map((v) => stringifyPrimitive(v));
        if (issue2.values.length === 2) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${stringified[0]} \u05D0\u05D5 ${stringified[1]}`;
        }
        const lastValue = stringified[stringified.length - 1];
        const restValues = stringified.slice(0, -1).join(", ");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${restValues} \u05D0\u05D5 ${lastValue}`;
      }
      case "too_big": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.longLabel ?? "\u05D0\u05E8\u05D5\u05DA"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.maximum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA" : "\u05DC\u05DB\u05DC \u05D4\u05D9\u05D5\u05EA\u05E8"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive ? `\u05E7\u05D8\u05DF \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.maximum}` : `\u05E7\u05D8\u05DF \u05DE-${issue2.maximum}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb = issue2.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
          const comparison = issue2.inclusive ? `${issue2.maximum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA` : `\u05E4\u05D7\u05D5\u05EA \u05DE-${issue2.maximum} ${sizing?.unit ?? ""}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? "<=" : "<";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.longLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.longLabel ?? "\u05D2\u05D3\u05D5\u05DC"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.shortLabel ?? "\u05E7\u05E6\u05E8"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.minimum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" : "\u05DC\u05E4\u05D7\u05D5\u05EA"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive ? `\u05D2\u05D3\u05D5\u05DC \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.minimum}` : `\u05D2\u05D3\u05D5\u05DC \u05DE-${issue2.minimum}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb = issue2.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
          if (issue2.minimum === 1 && issue2.inclusive) {
            const singularPhrase = issue2.origin === "set" ? "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3" : "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3";
            return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${singularPhrase}`;
          }
          const comparison = issue2.inclusive ? `${issue2.minimum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8` : `\u05D9\u05D5\u05EA\u05E8 \u05DE-${issue2.minimum} ${sizing?.unit ?? ""}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? ">=" : ">";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.shortLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.shortLabel ?? "\u05E7\u05D8\u05DF"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${_issue.pattern}`;
        const nounEntry = FormatDictionary[_issue.format];
        const noun = nounEntry?.label ?? _issue.format;
        const gender = nounEntry?.gender ?? "m";
        const adjective = gender === "f" ? "\u05EA\u05E7\u05D9\u05E0\u05D4" : "\u05EA\u05E7\u05D9\u05DF";
        return `${noun} \u05DC\u05D0 ${adjective}`;
      }
      case "not_multiple_of":
        return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u05DE\u05E4\u05EA\u05D7${issue2.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${issue2.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key": {
        return `\u05E9\u05D3\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8`;
      }
      case "invalid_union":
        return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
      case "invalid_element": {
        const place = withDefinite(issue2.origin ?? "array");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${place}`;
      }
      default:
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
    }
  };
};
function he_default() {
  return {
    localeError: error17()
  };
}

// node_modules/zod/v4/locales/hr.js
var error18 = () => {
  const Sizable = {
    string: { unit: "znakova", verb: "imati" },
    file: { unit: "bajtova", verb: "imati" },
    array: { unit: "stavki", verb: "imati" },
    set: { unit: "stavki", verb: "imati" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "unos",
    email: "email adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum i vrijeme",
    date: "ISO datum",
    time: "ISO vrijeme",
    duration: "ISO trajanje",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    cidrv4: "IPv4 raspon",
    cidrv6: "IPv6 raspon",
    base64: "base64 kodirani tekst",
    base64url: "base64url kodirani tekst",
    json_string: "JSON tekst",
    e164: "E.164 broj",
    jwt: "JWT",
    template_literal: "unos"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "tekst",
    number: "broj",
    boolean: "boolean",
    array: "niz",
    object: "objekt",
    set: "skup",
    file: "datoteka",
    date: "datum",
    bigint: "bigint",
    symbol: "simbol",
    undefined: "undefined",
    null: "null",
    function: "funkcija",
    map: "mapa"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neispravan unos: o\u010Dekuje se instanceof ${issue2.expected}, a primljeno je ${received}`;
        }
        return `Neispravan unos: o\u010Dekuje se ${expected}, a primljeno je ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neispravna vrijednost: o\u010Dekivano ${stringifyPrimitive(issue2.values[0])}`;
        return `Neispravna opcija: o\u010Dekivano jedno od ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} ima ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemenata"}`;
        return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} bude ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Premalo: o\u010Dekivano da ${origin} ima ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premalo: o\u010Dekivano da ${origin} bude ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Neispravan tekst: mora zapo\u010Dinjati s "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Neispravan tekst: mora zavr\u0161avati s "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neispravan tekst: mora sadr\u017Eavati "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neispravan tekst: mora odgovarati uzorku ${_issue.pattern}`;
        return `Neispravna ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neispravan broj: mora biti vi\u0161ekratnik od ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Neprepoznat${issue2.keys.length > 1 ? "i klju\u010Devi" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neispravan klju\u010D u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      case "invalid_union":
        return "Neispravan unos";
      case "invalid_element":
        return `Neispravna vrijednost u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      default:
        return `Neispravan unos`;
    }
  };
};
function hr_default() {
  return {
    localeError: error18()
  };
}

// node_modules/zod/v4/locales/hu.js
var error19 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "legyen" },
    file: { unit: "byte", verb: "legyen" },
    array: { unit: "elem", verb: "legyen" },
    set: { unit: "elem", verb: "legyen" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "bemenet",
    email: "email c\xEDm",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO id\u0151b\xE9lyeg",
    date: "ISO d\xE1tum",
    time: "ISO id\u0151",
    duration: "ISO id\u0151intervallum",
    ipv4: "IPv4 c\xEDm",
    ipv6: "IPv6 c\xEDm",
    cidrv4: "IPv4 tartom\xE1ny",
    cidrv6: "IPv6 tartom\xE1ny",
    base64: "base64-k\xF3dolt string",
    base64url: "base64url-k\xF3dolt string",
    json_string: "JSON string",
    e164: "E.164 sz\xE1m",
    jwt: "JWT",
    template_literal: "bemenet"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "sz\xE1m",
    array: "t\xF6mb"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k instanceof ${issue2.expected}, a kapott \xE9rt\xE9k ${received}`;
        }
        return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${expected}, a kapott \xE9rt\xE9k ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${stringifyPrimitive(issue2.values[0])}`;
        return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `T\xFAl nagy: ${issue2.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elem"}`;
        return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${issue2.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} m\xE9rete t\xFAl kicsi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} t\xFAl kicsi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\xC9rv\xE9nytelen string: "${_issue.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
        if (_issue.format === "ends_with")
          return `\xC9rv\xE9nytelen string: "${_issue.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
        if (_issue.format === "includes")
          return `\xC9rv\xE9nytelen string: "${_issue.includes}" \xE9rt\xE9ket kell tartalmaznia`;
        if (_issue.format === "regex")
          return `\xC9rv\xE9nytelen string: ${_issue.pattern} mint\xE1nak kell megfelelnie`;
        return `\xC9rv\xE9nytelen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\xC9rv\xE9nytelen sz\xE1m: ${issue2.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
      case "unrecognized_keys":
        return `Ismeretlen kulcs${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\xC9rv\xE9nytelen kulcs ${issue2.origin}`;
      case "invalid_union":
        return "\xC9rv\xE9nytelen bemenet";
      case "invalid_element":
        return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${issue2.origin}`;
      default:
        return `\xC9rv\xE9nytelen bemenet`;
    }
  };
};
function hu_default() {
  return {
    localeError: error19()
  };
}

// node_modules/zod/v4/locales/hy.js
function getArmenianPlural(count, one, many) {
  return Math.abs(count) === 1 ? one : many;
}
function withDefiniteArticle(word) {
  if (!word)
    return "";
  const vowels = ["\u0561", "\u0565", "\u0568", "\u056B", "\u0578", "\u0578\u0582", "\u0585"];
  const lastChar = word[word.length - 1];
  return word + (vowels.includes(lastChar) ? "\u0576" : "\u0568");
}
var error20 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0576\u0577\u0561\u0576",
        many: "\u0576\u0577\u0561\u0576\u0576\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    file: {
      unit: {
        one: "\u0562\u0561\u0575\u0569",
        many: "\u0562\u0561\u0575\u0569\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    array: {
      unit: {
        one: "\u057F\u0561\u0580\u0580",
        many: "\u057F\u0561\u0580\u0580\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    set: {
      unit: {
        one: "\u057F\u0561\u0580\u0580",
        many: "\u057F\u0561\u0580\u0580\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0574\u0578\u0582\u057F\u0584",
    email: "\u0567\u056C. \u0570\u0561\u057D\u0581\u0565",
    url: "URL",
    emoji: "\u0567\u0574\u0578\u057B\u056B",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E \u0587 \u056A\u0561\u0574",
    date: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E",
    time: "ISO \u056A\u0561\u0574",
    duration: "ISO \u057F\u0587\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
    ipv4: "IPv4 \u0570\u0561\u057D\u0581\u0565",
    ipv6: "IPv6 \u0570\u0561\u057D\u0581\u0565",
    cidrv4: "IPv4 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    cidrv6: "IPv6 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    base64: "base64 \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    base64url: "base64url \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    json_string: "JSON \u057F\u0578\u0572",
    e164: "E.164 \u0570\u0561\u0574\u0561\u0580",
    jwt: "JWT",
    template_literal: "\u0574\u0578\u0582\u057F\u0584"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0569\u056B\u057E",
    array: "\u0566\u0561\u0576\u0563\u057E\u0561\u056E"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 instanceof ${issue2.expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
        }
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${stringifyPrimitive(issue2.values[1])}`;
        return `\u054D\u056D\u0561\u056C \u057F\u0561\u0580\u0562\u0565\u0580\u0561\u056F\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 \u0570\u0565\u057F\u0587\u0575\u0561\u056C\u0576\u0565\u0580\u056B\u0581 \u0574\u0565\u056F\u0568\u055D ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getArmenianPlural(maxValue, sizing.unit.one, sizing.unit.many);
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056C\u056B\u0576\u056B ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getArmenianPlural(minValue, sizing.unit.one, sizing.unit.many);
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056C\u056B\u0576\u056B ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057D\u056F\u057D\u057E\u056B "${_issue.prefix}"-\u0578\u057E`;
        if (_issue.format === "ends_with")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0561\u057E\u0561\u0580\u057F\u057E\u056B "${_issue.suffix}"-\u0578\u057E`;
        if (_issue.format === "includes")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057A\u0561\u0580\u0578\u0582\u0576\u0561\u056F\u056B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0570\u0561\u0574\u0561\u057A\u0561\u057F\u0561\u057D\u056D\u0561\u0576\u056B ${_issue.pattern} \u0571\u0587\u0561\u0579\u0561\u0583\u056B\u0576`;
        return `\u054D\u056D\u0561\u056C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u054D\u056D\u0561\u056C \u0569\u056B\u057E\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0562\u0561\u0566\u0574\u0561\u057A\u0561\u057F\u056B\u056F \u056C\u056B\u0576\u056B ${issue2.divisor}-\u056B`;
      case "unrecognized_keys":
        return `\u0549\u0573\u0561\u0576\u0561\u0579\u057E\u0561\u056E \u0562\u0561\u0576\u0561\u056C\u056B${issue2.keys.length > 1 ? "\u0576\u0565\u0580" : ""}. ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u054D\u056D\u0561\u056C \u0562\u0561\u0576\u0561\u056C\u056B ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      case "invalid_union":
        return "\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574";
      case "invalid_element":
        return `\u054D\u056D\u0561\u056C \u0561\u0580\u056A\u0565\u0584 ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      default:
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574`;
    }
  };
};
function hy_default() {
  return {
    localeError: error20()
  };
}

// node_modules/zod/v4/locales/id.js
var error21 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "memiliki" },
    file: { unit: "byte", verb: "memiliki" },
    array: { unit: "item", verb: "memiliki" },
    set: { unit: "item", verb: "memiliki" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "alamat email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tanggal dan waktu format ISO",
    date: "tanggal format ISO",
    time: "jam format ISO",
    duration: "durasi format ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    cidrv4: "rentang alamat IPv4",
    cidrv6: "rentang alamat IPv6",
    base64: "string dengan enkode base64",
    base64url: "string dengan enkode base64url",
    json_string: "string JSON",
    e164: "angka E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak valid: diharapkan instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak valid: diharapkan ${expected}, diterima ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input tidak valid: diharapkan ${stringifyPrimitive(issue2.values[0])}`;
        return `Pilihan tidak valid: diharapkan salah satu dari ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} memiliki ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} menjadi ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: diharapkan ${issue2.origin} memiliki ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: diharapkan ${issue2.origin} menjadi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `String tidak valid: harus menyertakan "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak valid`;
      }
      case "not_multiple_of":
        return `Angka tidak valid: harus kelipatan dari ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak valid di ${issue2.origin}`;
      case "invalid_union":
        return "Input tidak valid";
      case "invalid_element":
        return `Nilai tidak valid di ${issue2.origin}`;
      default:
        return `Input tidak valid`;
    }
  };
};
function id_default() {
  return {
    localeError: error21()
  };
}

// node_modules/zod/v4/locales/is.js
var error22 = () => {
  const Sizable = {
    string: { unit: "stafi", verb: "a\xF0 hafa" },
    file: { unit: "b\xE6ti", verb: "a\xF0 hafa" },
    array: { unit: "hluti", verb: "a\xF0 hafa" },
    set: { unit: "hluti", verb: "a\xF0 hafa" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "gildi",
    email: "netfang",
    url: "vefsl\xF3\xF0",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dagsetning og t\xEDmi",
    date: "ISO dagsetning",
    time: "ISO t\xEDmi",
    duration: "ISO t\xEDmalengd",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded strengur",
    base64url: "base64url-encoded strengur",
    json_string: "JSON strengur",
    e164: "E.164 t\xF6lugildi",
    jwt: "JWT",
    template_literal: "gildi"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "n\xFAmer",
    array: "fylki"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera instanceof ${issue2.expected}`;
        }
        return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera ${expected}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Rangt gildi: gert r\xE1\xF0 fyrir ${stringifyPrimitive(issue2.values[0])}`;
        return `\xD3gilt val: m\xE1 vera eitt af eftirfarandi ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} hafi ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "hluti"}`;
        return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} s\xE9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} hafi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} s\xE9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 byrja \xE1 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 enda \xE1 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 innihalda "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 fylgja mynstri ${_issue.pattern}`;
        return `Rangt ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `R\xF6ng tala: ver\xF0ur a\xF0 vera margfeldi af ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\xD3\xFEekkt ${issue2.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Rangur lykill \xED ${issue2.origin}`;
      case "invalid_union":
        return "Rangt gildi";
      case "invalid_element":
        return `Rangt gildi \xED ${issue2.origin}`;
      default:
        return `Rangt gildi`;
    }
  };
};
function is_default() {
  return {
    localeError: error22()
  };
}

// node_modules/zod/v4/locales/it.js
var error23 = () => {
  const Sizable = {
    string: { unit: "caratteri", verb: "avere" },
    file: { unit: "byte", verb: "avere" },
    array: { unit: "elementi", verb: "avere" },
    set: { unit: "elementi", verb: "avere" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "indirizzo email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data e ora ISO",
    date: "data ISO",
    time: "ora ISO",
    duration: "durata ISO",
    ipv4: "indirizzo IPv4",
    ipv6: "indirizzo IPv6",
    cidrv4: "intervallo IPv4",
    cidrv6: "intervallo IPv6",
    base64: "stringa codificata in base64",
    base64url: "URL codificata in base64",
    json_string: "stringa JSON",
    e164: "numero E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "numero",
    array: "vettore"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input non valido: atteso instanceof ${issue2.expected}, ricevuto ${received}`;
        }
        return `Input non valido: atteso ${expected}, ricevuto ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input non valido: atteso ${stringifyPrimitive(issue2.values[0])}`;
        return `Opzione non valida: atteso uno tra ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Troppo grande: ${issue2.origin ?? "valore"} deve avere ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementi"}`;
        return `Troppo grande: ${issue2.origin ?? "valore"} deve essere ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Troppo piccolo: ${issue2.origin} deve avere ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Troppo piccolo: ${issue2.origin} deve essere ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Stringa non valida: deve includere "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
        return `Input non valido: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Numero non valido: deve essere un multiplo di ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Chiav${issue2.keys.length > 1 ? "i" : "e"} non riconosciut${issue2.keys.length > 1 ? "e" : "a"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Chiave non valida in ${issue2.origin}`;
      case "invalid_union":
        return "Input non valido";
      case "invalid_element":
        return `Valore non valido in ${issue2.origin}`;
      default:
        return `Input non valido`;
    }
  };
};
function it_default() {
  return {
    localeError: error23()
  };
}

// node_modules/zod/v4/locales/ja.js
var error24 = () => {
  const Sizable = {
    string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" },
    file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" },
    array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
    set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u5165\u529B\u5024",
    email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
    url: "URL",
    emoji: "\u7D75\u6587\u5B57",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\u65E5\u6642",
    date: "ISO\u65E5\u4ED8",
    time: "ISO\u6642\u523B",
    duration: "ISO\u671F\u9593",
    ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9",
    ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9",
    cidrv4: "IPv4\u7BC4\u56F2",
    cidrv6: "IPv6\u7BC4\u56F2",
    base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    json_string: "JSON\u6587\u5B57\u5217",
    e164: "E.164\u756A\u53F7",
    jwt: "JWT",
    template_literal: "\u5165\u529B\u5024"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u6570\u5024",
    array: "\u914D\u5217"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u52B9\u306A\u5165\u529B: instanceof ${issue2.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
        }
        return `\u7121\u52B9\u306A\u5165\u529B: ${expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u7121\u52B9\u306A\u5165\u529B: ${stringifyPrimitive(issue2.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
        return `\u7121\u52B9\u306A\u9078\u629E: ${joinValues(issue2.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u4EE5\u4E0B\u3067\u3042\u308B" : "\u3088\u308A\u5C0F\u3055\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${sizing.unit ?? "\u8981\u7D20"}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u4EE5\u4E0A\u3067\u3042\u308B" : "\u3088\u308A\u5927\u304D\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${sizing.unit}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "ends_with")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "includes")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "regex")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${_issue.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u7121\u52B9\u306A${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u52B9\u306A\u6570\u5024: ${issue2.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "unrecognized_keys":
        return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${issue2.keys.length > 1 ? "\u7FA4" : ""}: ${joinValues(issue2.keys, "\u3001")}`;
      case "invalid_key":
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
      case "invalid_union":
        return "\u7121\u52B9\u306A\u5165\u529B";
      case "invalid_element":
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
      default:
        return `\u7121\u52B9\u306A\u5165\u529B`;
    }
  };
};
function ja_default() {
  return {
    localeError: error24()
  };
}

// node_modules/zod/v4/locales/ka.js
var error25 = () => {
  const Sizable = {
    string: { unit: "\u10E1\u10D8\u10DB\u10D1\u10DD\u10DA\u10DD", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    file: { unit: "\u10D1\u10D0\u10D8\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    array: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    set: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0",
    email: "\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    url: "URL",
    emoji: "\u10D4\u10DB\u10DD\u10EF\u10D8",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8-\u10D3\u10E0\u10DD",
    date: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8",
    time: "\u10D3\u10E0\u10DD",
    duration: "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0",
    ipv4: "IPv4 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    ipv6: "IPv6 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    cidrv4: "IPv4 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    cidrv6: "IPv6 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    base64: "base64-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    base64url: "base64url-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    json_string: "JSON \u10D5\u10D4\u10DA\u10D8",
    e164: "E.164 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8",
    jwt: "JWT",
    template_literal: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u10E0\u10D8\u10EA\u10EE\u10D5\u10D8",
    string: "\u10D5\u10D4\u10DA\u10D8",
    boolean: "\u10D1\u10E3\u10DA\u10D4\u10D0\u10DC\u10D8",
    function: "\u10E4\u10E3\u10DC\u10E5\u10EA\u10D8\u10D0",
    array: "\u10DB\u10D0\u10E1\u10D8\u10D5\u10D8"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 instanceof ${issue2.expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
        }
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D0\u10E0\u10D8\u10D0\u10DC\u10E2\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8\u10D0 \u10D4\u10E0\u10D7-\u10D4\u10E0\u10D7\u10D8 ${joinValues(issue2.values, "|")}-\u10D3\u10D0\u10DC`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10EC\u10E7\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.prefix}"-\u10D8\u10D7`;
        }
        if (_issue.format === "ends_with")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10DB\u10D7\u10D0\u10D5\u10E0\u10D3\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.suffix}"-\u10D8\u10D7`;
        if (_issue.format === "includes")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1 "${_issue.includes}"-\u10E1`;
        if (_issue.format === "regex")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D4\u10E1\u10D0\u10D1\u10D0\u10DB\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10E1 ${_issue.pattern}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E0\u10D8\u10EA\u10EE\u10D5\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1 ${issue2.divisor}-\u10D8\u10E1 \u10EF\u10D4\u10E0\u10D0\u10D3\u10D8`;
      case "unrecognized_keys":
        return `\u10E3\u10EA\u10DC\u10DD\u10D1\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1${issue2.keys.length > 1 ? "\u10D4\u10D1\u10D8" : "\u10D8"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D8 ${issue2.origin}-\u10E8\u10D8`;
      case "invalid_union":
        return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
      case "invalid_element":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0 ${issue2.origin}-\u10E8\u10D8`;
      default:
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0`;
    }
  };
};
function ka_default() {
  return {
    localeError: error25()
  };
}

// node_modules/zod/v4/locales/km.js
var error26 = () => {
  const Sizable = {
    string: { unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    file: { unit: "\u1794\u17C3", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    array: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    set: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
    email: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B",
    url: "URL",
    emoji: "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO",
    date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO",
    time: "\u1798\u17C9\u17C4\u1784 ISO",
    duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO",
    ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    cidrv4: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    cidrv6: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    base64: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64",
    base64url: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url",
    json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON",
    e164: "\u179B\u17C1\u1781 E.164",
    jwt: "JWT",
    template_literal: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u179B\u17C1\u1781",
    array: "\u17A2\u17B6\u179A\u17C1 (Array)",
    null: "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A instanceof ${issue2.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
        }
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${stringifyPrimitive(issue2.values[0])}`;
        return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
        return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${_issue.pattern}`;
        return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      case "invalid_union":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
      case "invalid_element":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      default:
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
    }
  };
};
function km_default() {
  return {
    localeError: error26()
  };
}

// node_modules/zod/v4/locales/kh.js
function kh_default() {
  return km_default();
}

// node_modules/zod/v4/locales/ko.js
var error27 = () => {
  const Sizable = {
    string: { unit: "\uBB38\uC790", verb: "to have" },
    file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" },
    array: { unit: "\uAC1C", verb: "to have" },
    set: { unit: "\uAC1C", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\uC785\uB825",
    email: "\uC774\uBA54\uC77C \uC8FC\uC18C",
    url: "URL",
    emoji: "\uC774\uBAA8\uC9C0",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04",
    date: "ISO \uB0A0\uC9DC",
    time: "ISO \uC2DC\uAC04",
    duration: "ISO \uAE30\uAC04",
    ipv4: "IPv4 \uC8FC\uC18C",
    ipv6: "IPv6 \uC8FC\uC18C",
    cidrv4: "IPv4 \uBC94\uC704",
    cidrv6: "IPv6 \uBC94\uC704",
    base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    json_string: "JSON \uBB38\uC790\uC5F4",
    e164: "E.164 \uBC88\uD638",
    jwt: "JWT",
    template_literal: "\uC785\uB825"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 instanceof ${issue2.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
        }
        return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${stringifyPrimitive(issue2.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C \uC635\uC158: ${joinValues(issue2.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "too_big": {
        const adj = issue2.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC";
        const suffix = adj === "\uBBF8\uB9CC" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing)
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()}${unit} ${adj}${suffix}`;
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()} ${adj}${suffix}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC";
        const suffix = adj === "\uC774\uC0C1" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing) {
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()}${unit} ${adj}${suffix}`;
        }
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()} ${adj}${suffix}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
        }
        if (_issue.format === "ends_with")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
        if (_issue.format === "includes")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
        if (_issue.format === "regex")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${_issue.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\uC798\uBABB\uB41C \uC22B\uC790: ${issue2.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "unrecognized_keys":
        return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\uC798\uBABB\uB41C \uD0A4: ${issue2.origin}`;
      case "invalid_union":
        return `\uC798\uBABB\uB41C \uC785\uB825`;
      case "invalid_element":
        return `\uC798\uBABB\uB41C \uAC12: ${issue2.origin}`;
      default:
        return `\uC798\uBABB\uB41C \uC785\uB825`;
    }
  };
};
function ko_default() {
  return {
    localeError: error27()
  };
}

// node_modules/zod/v4/locales/lt.js
var capitalizeFirstCharacter = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
function getUnitTypeFromNumber(number4) {
  const abs = Math.abs(number4);
  const last = abs % 10;
  const last2 = abs % 100;
  if (last2 >= 11 && last2 <= 19 || last === 0)
    return "many";
  if (last === 1)
    return "one";
  return "few";
}
var error28 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "simbolis",
        few: "simboliai",
        many: "simboli\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi b\u016Bti ne ilgesn\u0117 kaip",
          notInclusive: "turi b\u016Bti trumpesn\u0117 kaip"
        },
        bigger: {
          inclusive: "turi b\u016Bti ne trumpesn\u0117 kaip",
          notInclusive: "turi b\u016Bti ilgesn\u0117 kaip"
        }
      }
    },
    file: {
      unit: {
        one: "baitas",
        few: "baitai",
        many: "bait\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi b\u016Bti ne didesnis kaip",
          notInclusive: "turi b\u016Bti ma\u017Eesnis kaip"
        },
        bigger: {
          inclusive: "turi b\u016Bti ne ma\u017Eesnis kaip",
          notInclusive: "turi b\u016Bti didesnis kaip"
        }
      }
    },
    array: {
      unit: {
        one: "element\u0105",
        few: "elementus",
        many: "element\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
        },
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip"
        }
      }
    },
    set: {
      unit: {
        one: "element\u0105",
        few: "elementus",
        many: "element\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
        },
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip"
        }
      }
    }
  };
  function getSizing(origin, unitType, inclusive, targetShouldBe) {
    const result = Sizable[origin] ?? null;
    if (result === null)
      return result;
    return {
      unit: result.unit[unitType],
      verb: result.verb[targetShouldBe][inclusive ? "inclusive" : "notInclusive"]
    };
  }
  const FormatDictionary = {
    regex: "\u012Fvestis",
    email: "el. pa\u0161to adresas",
    url: "URL",
    emoji: "jaustukas",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO data ir laikas",
    date: "ISO data",
    time: "ISO laikas",
    duration: "ISO trukm\u0117",
    ipv4: "IPv4 adresas",
    ipv6: "IPv6 adresas",
    cidrv4: "IPv4 tinklo prefiksas (CIDR)",
    cidrv6: "IPv6 tinklo prefiksas (CIDR)",
    base64: "base64 u\u017Ekoduota eilut\u0117",
    base64url: "base64url u\u017Ekoduota eilut\u0117",
    json_string: "JSON eilut\u0117",
    e164: "E.164 numeris",
    jwt: "JWT",
    template_literal: "\u012Fvestis"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "skai\u010Dius",
    bigint: "sveikasis skai\u010Dius",
    string: "eilut\u0117",
    boolean: "login\u0117 reik\u0161m\u0117",
    undefined: "neapibr\u0117\u017Eta reik\u0161m\u0117",
    function: "funkcija",
    symbol: "simbolis",
    array: "masyvas",
    object: "objektas",
    null: "nulin\u0117 reik\u0161m\u0117"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Gautas tipas ${received}, o tik\u0117tasi - instanceof ${issue2.expected}`;
        }
        return `Gautas tipas ${received}, o tik\u0117tasi - ${expected}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Privalo b\u016Bti ${stringifyPrimitive(issue2.values[0])}`;
        return `Privalo b\u016Bti vienas i\u0161 ${joinValues(issue2.values, "|")} pasirinkim\u0173`;
      case "too_big": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.maximum)), issue2.inclusive ?? false, "smaller");
        if (sizing?.verb)
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.maximum.toString()} ${sizing.unit ?? "element\u0173"}`;
        const adj = issue2.inclusive ? "ne didesnis kaip" : "ma\u017Eesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.maximum.toString()} ${sizing?.unit}`;
      }
      case "too_small": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.minimum)), issue2.inclusive ?? false, "bigger");
        if (sizing?.verb)
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.minimum.toString()} ${sizing.unit ?? "element\u0173"}`;
        const adj = issue2.inclusive ? "ne ma\u017Eesnis kaip" : "didesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.minimum.toString()} ${sizing?.unit}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Eilut\u0117 privalo prasid\u0117ti "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Eilut\u0117 privalo pasibaigti "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Eilut\u0117 privalo \u012Ftraukti "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Eilut\u0117 privalo atitikti ${_issue.pattern}`;
        return `Neteisingas ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Skai\u010Dius privalo b\u016Bti ${issue2.divisor} kartotinis.`;
      case "unrecognized_keys":
        return `Neatpa\u017Eint${issue2.keys.length > 1 ? "i" : "as"} rakt${issue2.keys.length > 1 ? "ai" : "as"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return "Rastas klaidingas raktas";
      case "invalid_union":
        return "Klaidinga \u012Fvestis";
      case "invalid_element": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi klaiding\u0105 \u012Fvest\u012F`;
      }
      default:
        return "Klaidinga \u012Fvestis";
    }
  };
};
function lt_default() {
  return {
    localeError: error28()
  };
}

// node_modules/zod/v4/locales/mk.js
var error29 = () => {
  const Sizable = {
    string: { unit: "\u0437\u043D\u0430\u0446\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    file: { unit: "\u0431\u0430\u0458\u0442\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    array: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    set: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u043D\u0435\u0441",
    email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u045F\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435",
    date: "ISO \u0434\u0430\u0442\u0443\u043C",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    duration: "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430",
    cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433",
    cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433",
    base64: "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    base64url: "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    json_string: "JSON \u043D\u0438\u0437\u0430",
    e164: "E.164 \u0431\u0440\u043E\u0458",
    jwt: "JWT",
    template_literal: "\u0432\u043D\u0435\u0441"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0431\u0440\u043E\u0458",
    array: "\u043D\u0438\u0437\u0430"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 instanceof ${issue2.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
        }
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${issue2.origin}`;
      case "invalid_union":
        return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
      case "invalid_element":
        return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${issue2.origin}`;
      default:
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441`;
    }
  };
};
function mk_default() {
  return {
    localeError: error29()
  };
}

// node_modules/zod/v4/locales/ms.js
var error30 = () => {
  const Sizable = {
    string: { unit: "aksara", verb: "mempunyai" },
    file: { unit: "bait", verb: "mempunyai" },
    array: { unit: "elemen", verb: "mempunyai" },
    set: { unit: "elemen", verb: "mempunyai" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "alamat e-mel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tarikh masa ISO",
    date: "tarikh ISO",
    time: "masa ISO",
    duration: "tempoh ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    cidrv4: "julat IPv4",
    cidrv6: "julat IPv6",
    base64: "string dikodkan base64",
    base64url: "string dikodkan base64url",
    json_string: "string JSON",
    e164: "nombor E.164",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "nombor"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak sah: dijangka instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak sah: dijangka ${expected}, diterima ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input tidak sah: dijangka ${stringifyPrimitive(issue2.values[0])}`;
        return `Pilihan tidak sah: dijangka salah satu daripada ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} adalah ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: dijangka ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: dijangka ${issue2.origin} adalah ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak sah`;
      }
      case "not_multiple_of":
        return `Nombor tidak sah: perlu gandaan ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak sah dalam ${issue2.origin}`;
      case "invalid_union":
        return "Input tidak sah";
      case "invalid_element":
        return `Nilai tidak sah dalam ${issue2.origin}`;
      default:
        return `Input tidak sah`;
    }
  };
};
function ms_default() {
  return {
    localeError: error30()
  };
}

// node_modules/zod/v4/locales/nl.js
var error31 = () => {
  const Sizable = {
    string: { unit: "tekens", verb: "heeft" },
    file: { unit: "bytes", verb: "heeft" },
    array: { unit: "elementen", verb: "heeft" },
    set: { unit: "elementen", verb: "heeft" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "invoer",
    email: "emailadres",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum en tijd",
    date: "ISO datum",
    time: "ISO tijd",
    duration: "ISO duur",
    ipv4: "IPv4-adres",
    ipv6: "IPv6-adres",
    cidrv4: "IPv4-bereik",
    cidrv6: "IPv6-bereik",
    base64: "base64-gecodeerde tekst",
    base64url: "base64 URL-gecodeerde tekst",
    json_string: "JSON string",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "invoer"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "getal"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ongeldige invoer: verwacht instanceof ${issue2.expected}, ontving ${received}`;
        }
        return `Ongeldige invoer: verwacht ${expected}, ontving ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ongeldige invoer: verwacht ${stringifyPrimitive(issue2.values[0])}`;
        return `Ongeldige optie: verwacht \xE9\xE9n van ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const longName = issue2.origin === "date" ? "laat" : issue2.origin === "string" ? "lang" : "groot";
        if (sizing)
          return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementen"} ${sizing.verb}`;
        return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} is`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const shortName = issue2.origin === "date" ? "vroeg" : issue2.origin === "string" ? "kort" : "klein";
        if (sizing) {
          return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} is`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
        }
        if (_issue.format === "ends_with")
          return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
        if (_issue.format === "includes")
          return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
        if (_issue.format === "regex")
          return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
        return `Ongeldig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ongeldig getal: moet een veelvoud van ${issue2.divisor} zijn`;
      case "unrecognized_keys":
        return `Onbekende key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ongeldige key in ${issue2.origin}`;
      case "invalid_union":
        return "Ongeldige invoer";
      case "invalid_element":
        return `Ongeldige waarde in ${issue2.origin}`;
      default:
        return `Ongeldige invoer`;
    }
  };
};
function nl_default() {
  return {
    localeError: error31()
  };
}

// node_modules/zod/v4/locales/no.js
var error32 = () => {
  const Sizable = {
    string: { unit: "tegn", verb: "\xE5 ha" },
    file: { unit: "bytes", verb: "\xE5 ha" },
    array: { unit: "elementer", verb: "\xE5 inneholde" },
    set: { unit: "elementer", verb: "\xE5 inneholde" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "e-postadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkeslett",
    date: "ISO-dato",
    time: "ISO-klokkeslett",
    duration: "ISO-varighet",
    ipv4: "IPv4-omr\xE5de",
    ipv6: "IPv6-omr\xE5de",
    cidrv4: "IPv4-spekter",
    cidrv6: "IPv6-spekter",
    base64: "base64-enkodet streng",
    base64url: "base64url-enkodet streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "tall",
    array: "liste"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldig input: forventet instanceof ${issue2.expected}, fikk ${received}`;
        }
        return `Ugyldig input: forventet ${expected}, fikk ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ugyldig verdi: forventet ${stringifyPrimitive(issue2.values[0])}`;
        return `Ugyldig valg: forventet en av ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Ugyldig streng: m\xE5 ende med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ugyldig streng: m\xE5 inneholde "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8kkel i ${issue2.origin}`;
      case "invalid_union":
        return "Ugyldig input";
      case "invalid_element":
        return `Ugyldig verdi i ${issue2.origin}`;
      default:
        return `Ugyldig input`;
    }
  };
};
function no_default() {
  return {
    localeError: error32()
  };
}

// node_modules/zod/v4/locales/ota.js
var error33 = () => {
  const Sizable = {
    string: { unit: "harf", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    array: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
    set: { unit: "unsur", verb: "olmal\u0131d\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "giren",
    email: "epostag\xE2h",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO heng\xE2m\u0131",
    date: "ISO tarihi",
    time: "ISO zaman\u0131",
    duration: "ISO m\xFCddeti",
    ipv4: "IPv4 ni\u015F\xE2n\u0131",
    ipv6: "IPv6 ni\u015F\xE2n\u0131",
    cidrv4: "IPv4 menzili",
    cidrv6: "IPv6 menzili",
    base64: "base64-\u015Fifreli metin",
    base64url: "base64url-\u015Fifreli metin",
    json_string: "JSON metin",
    e164: "E.164 say\u0131s\u0131",
    jwt: "JWT",
    template_literal: "giren"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "numara",
    array: "saf",
    null: "gayb"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `F\xE2sit giren: umulan instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `F\xE2sit giren: umulan ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `F\xE2sit giren: umulan ${stringifyPrimitive(issue2.values[0])}`;
        return `F\xE2sit tercih: m\xFBteberler ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
        return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} olmal\u0131yd\u0131.`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} ${sizing.unit} sahip olmal\u0131yd\u0131.`;
        }
        return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} olmal\u0131yd\u0131.`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `F\xE2sit metin: "${_issue.prefix}" ile ba\u015Flamal\u0131.`;
        if (_issue.format === "ends_with")
          return `F\xE2sit metin: "${_issue.suffix}" ile bitmeli.`;
        if (_issue.format === "includes")
          return `F\xE2sit metin: "${_issue.includes}" ihtiv\xE2 etmeli.`;
        if (_issue.format === "regex")
          return `F\xE2sit metin: ${_issue.pattern} nak\u015F\u0131na uymal\u0131.`;
        return `F\xE2sit ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `F\xE2sit say\u0131: ${issue2.divisor} kat\u0131 olmal\u0131yd\u0131.`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} i\xE7in tan\u0131nmayan anahtar var.`;
      case "invalid_union":
        return "Giren tan\u0131namad\u0131.";
      case "invalid_element":
        return `${issue2.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
      default:
        return `K\u0131ymet tan\u0131namad\u0131.`;
    }
  };
};
function ota_default() {
  return {
    localeError: error33()
  };
}

// node_modules/zod/v4/locales/ps.js
var error34 = () => {
  const Sizable = {
    string: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    file: { unit: "\u0628\u0627\u06CC\u067C\u0633", verb: "\u0648\u0644\u0631\u064A" },
    array: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0648\u0631\u0648\u062F\u064A",
    email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A",
    date: "\u0646\u06D0\u067C\u0647",
    time: "\u0648\u062E\u062A",
    duration: "\u0645\u0648\u062F\u0647",
    ipv4: "\u062F IPv4 \u067E\u062A\u0647",
    ipv6: "\u062F IPv6 \u067E\u062A\u0647",
    cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647",
    cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647",
    base64: "base64-encoded \u0645\u062A\u0646",
    base64url: "base64url-encoded \u0645\u062A\u0646",
    json_string: "JSON \u0645\u062A\u0646",
    e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647",
    jwt: "JWT",
    template_literal: "\u0648\u0631\u0648\u062F\u064A"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0639\u062F\u062F",
    array: "\u0627\u0631\u06D0"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F instanceof ${issue2.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
        }
        return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
      }
      case "invalid_value":
        if (issue2.values.length === 1) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${stringifyPrimitive(issue2.values[0])} \u0648\u0627\u06CC`;
        }
        return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${joinValues(issue2.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0648\u064A`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0648\u064A`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
        }
        if (_issue.format === "ends_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
        }
        if (_issue.format === "includes") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${_issue.includes}" \u0648\u0644\u0631\u064A`;
        }
        if (_issue.format === "regex") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${_issue.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
      }
      case "not_multiple_of":
        return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${issue2.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
      case "unrecognized_keys":
        return `\u0646\u0627\u0633\u0645 ${issue2.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      case "invalid_union":
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
      case "invalid_element":
        return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      default:
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
    }
  };
};
function ps_default() {
  return {
    localeError: error34()
  };
}

// node_modules/zod/v4/locales/pl.js
var error35 = () => {
  const Sizable = {
    string: { unit: "znak\xF3w", verb: "mie\u0107" },
    file: { unit: "bajt\xF3w", verb: "mie\u0107" },
    array: { unit: "element\xF3w", verb: "mie\u0107" },
    set: { unit: "element\xF3w", verb: "mie\u0107" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "wyra\u017Cenie",
    email: "adres email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i godzina w formacie ISO",
    date: "data w formacie ISO",
    time: "godzina w formacie ISO",
    duration: "czas trwania ISO",
    ipv4: "adres IPv4",
    ipv6: "adres IPv6",
    cidrv4: "zakres IPv4",
    cidrv6: "zakres IPv6",
    base64: "ci\u0105g znak\xF3w zakodowany w formacie base64",
    base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url",
    json_string: "ci\u0105g znak\xF3w w formacie JSON",
    e164: "liczba E.164",
    jwt: "JWT",
    template_literal: "wej\u015Bcie"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "liczba",
    array: "tablica"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano instanceof ${issue2.expected}, otrzymano ${received}`;
        }
        return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${expected}, otrzymano ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${stringifyPrimitive(issue2.values[0])}`;
        return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${_issue.pattern}`;
        return `Nieprawid\u0142ow(y/a/e) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nierozpoznane klucze${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Nieprawid\u0142owy klucz w ${issue2.origin}`;
      case "invalid_union":
        return "Nieprawid\u0142owe dane wej\u015Bciowe";
      case "invalid_element":
        return `Nieprawid\u0142owa warto\u015B\u0107 w ${issue2.origin}`;
      default:
        return `Nieprawid\u0142owe dane wej\u015Bciowe`;
    }
  };
};
function pl_default() {
  return {
    localeError: error35()
  };
}

// node_modules/zod/v4/locales/pt.js
var error36 = () => {
  const Sizable = {
    string: { unit: "caracteres", verb: "ter" },
    file: { unit: "bytes", verb: "ter" },
    array: { unit: "itens", verb: "ter" },
    set: { unit: "itens", verb: "ter" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "padr\xE3o",
    email: "endere\xE7o de e-mail",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data e hora ISO",
    date: "data ISO",
    time: "hora ISO",
    duration: "dura\xE7\xE3o ISO",
    ipv4: "endere\xE7o IPv4",
    ipv6: "endere\xE7o IPv6",
    cidrv4: "faixa de IPv4",
    cidrv6: "faixa de IPv6",
    base64: "texto codificado em base64",
    base64url: "URL codificada em base64",
    json_string: "texto JSON",
    e164: "n\xFAmero E.164",
    jwt: "JWT",
    template_literal: "entrada"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "n\xFAmero",
    null: "nulo"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Tipo inv\xE1lido: esperado instanceof ${issue2.expected}, recebido ${received}`;
        }
        return `Tipo inv\xE1lido: esperado ${expected}, recebido ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entrada inv\xE1lida: esperado ${stringifyPrimitive(issue2.values[0])}`;
        return `Op\xE7\xE3o inv\xE1lida: esperada uma das ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Muito grande: esperado que ${issue2.origin ?? "valor"} tivesse ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        return `Muito grande: esperado que ${issue2.origin ?? "valor"} fosse ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Muito pequeno: esperado que ${issue2.origin} tivesse ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Muito pequeno: esperado que ${issue2.origin} fosse ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Texto inv\xE1lido: deve come\xE7ar com "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Texto inv\xE1lido: deve terminar com "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} inv\xE1lido`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Chave${issue2.keys.length > 1 ? "s" : ""} desconhecida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Chave inv\xE1lida em ${issue2.origin}`;
      case "invalid_union":
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Valor inv\xE1lido em ${issue2.origin}`;
      default:
        return `Campo inv\xE1lido`;
    }
  };
};
function pt_default() {
  return {
    localeError: error36()
  };
}

// node_modules/zod/v4/locales/ro.js
var error37 = () => {
  const Sizable = {
    string: { unit: "caractere", verb: "s\u0103 aib\u0103" },
    file: { unit: "octe\u021Bi", verb: "s\u0103 aib\u0103" },
    array: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    set: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    map: { unit: "intr\u0103ri", verb: "s\u0103 aib\u0103" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "intrare",
    email: "adres\u0103 de email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "dat\u0103 \u0219i or\u0103 ISO",
    date: "dat\u0103 ISO",
    time: "or\u0103 ISO",
    duration: "durat\u0103 ISO",
    ipv4: "adres\u0103 IPv4",
    ipv6: "adres\u0103 IPv6",
    mac: "adres\u0103 MAC",
    cidrv4: "interval IPv4",
    cidrv6: "interval IPv6",
    base64: "\u0219ir codat base64",
    base64url: "\u0219ir codat base64url",
    json_string: "\u0219ir JSON",
    e164: "num\u0103r E.164",
    jwt: "JWT",
    template_literal: "intrare"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "\u0219ir",
    number: "num\u0103r",
    boolean: "boolean",
    function: "func\u021Bie",
    array: "matrice",
    object: "obiect",
    undefined: "nedefinit",
    symbol: "simbol",
    bigint: "num\u0103r mare",
    void: "void",
    never: "never",
    map: "hart\u0103",
    set: "set"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Intrare invalid\u0103: a\u0219teptat ${expected}, primit ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Intrare invalid\u0103: a\u0219teptat ${stringifyPrimitive(issue2.values[0])}`;
        return `Op\u021Biune invalid\u0103: a\u0219teptat una dintre ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemente"}`;
        return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} s\u0103 fie ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Prea mic: a\u0219teptat ca ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Prea mic: a\u0219teptat ca ${issue2.origin} s\u0103 fie ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0218ir invalid: trebuie s\u0103 \xEEnceap\u0103 cu "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u0218ir invalid: trebuie s\u0103 se termine cu "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0218ir invalid: trebuie s\u0103 includ\u0103 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u0218ir invalid: trebuie s\u0103 se potriveasc\u0103 cu modelul ${_issue.pattern}`;
        return `Format invalid: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Num\u0103r invalid: trebuie s\u0103 fie multiplu de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Chei nerecunoscute: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cheie invalid\u0103 \xEEn ${issue2.origin}`;
      case "invalid_union":
        return "Intrare invalid\u0103";
      case "invalid_element":
        return `Valoare invalid\u0103 \xEEn ${issue2.origin}`;
      default:
        return `Intrare invalid\u0103`;
    }
  };
};
function ro_default() {
  return {
    localeError: error37()
  };
}

// node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error38 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0441\u0438\u043C\u0432\u043E\u043B",
        few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
        many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    file: {
      unit: {
        one: "\u0431\u0430\u0439\u0442",
        few: "\u0431\u0430\u0439\u0442\u0430",
        many: "\u0431\u0430\u0439\u0442"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    array: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    set: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0432\u043E\u0434",
    email: "email \u0430\u0434\u0440\u0435\u0441",
    url: "URL",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0432\u0440\u0435\u043C\u044F",
    duration: "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    base64: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64",
    base64url: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url",
    json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    jwt: "JWT",
    template_literal: "\u0432\u0432\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${issue2.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0438" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435`;
    }
  };
};
function ru_default() {
  return {
    localeError: error38()
  };
}

// node_modules/zod/v4/locales/sl.js
var error39 = () => {
  const Sizable = {
    string: { unit: "znakov", verb: "imeti" },
    file: { unit: "bajtov", verb: "imeti" },
    array: { unit: "elementov", verb: "imeti" },
    set: { unit: "elementov", verb: "imeti" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "vnos",
    email: "e-po\u0161tni naslov",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum in \u010Das",
    date: "ISO datum",
    time: "ISO \u010Das",
    duration: "ISO trajanje",
    ipv4: "IPv4 naslov",
    ipv6: "IPv6 naslov",
    cidrv4: "obseg IPv4",
    cidrv6: "obseg IPv6",
    base64: "base64 kodiran niz",
    base64url: "base64url kodiran niz",
    json_string: "JSON niz",
    e164: "E.164 \u0161tevilka",
    jwt: "JWT",
    template_literal: "vnos"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0161tevilo",
    array: "tabela"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neveljaven vnos: pri\u010Dakovano instanceof ${issue2.expected}, prejeto ${received}`;
        }
        return `Neveljaven vnos: pri\u010Dakovano ${expected}, prejeto ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neveljaven vnos: pri\u010Dakovano ${stringifyPrimitive(issue2.values[0])}`;
        return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} imelo ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementov"}`;
        return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} imelo ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Neveljaven niz: mora se za\u010Deti z "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Neveljaven niz: mora se kon\u010Dati z "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
        return `Neveljaven ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Neprepoznan${issue2.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neveljaven klju\u010D v ${issue2.origin}`;
      case "invalid_union":
        return "Neveljaven vnos";
      case "invalid_element":
        return `Neveljavna vrednost v ${issue2.origin}`;
      default:
        return "Neveljaven vnos";
    }
  };
};
function sl_default() {
  return {
    localeError: error39()
  };
}

// node_modules/zod/v4/locales/sv.js
var error40 = () => {
  const Sizable = {
    string: { unit: "tecken", verb: "att ha" },
    file: { unit: "bytes", verb: "att ha" },
    array: { unit: "objekt", verb: "att inneh\xE5lla" },
    set: { unit: "objekt", verb: "att inneh\xE5lla" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regulj\xE4rt uttryck",
    email: "e-postadress",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datum och tid",
    date: "ISO-datum",
    time: "ISO-tid",
    duration: "ISO-varaktighet",
    ipv4: "IPv4-intervall",
    ipv6: "IPv6-intervall",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    base64: "base64-kodad str\xE4ng",
    base64url: "base64url-kodad str\xE4ng",
    json_string: "JSON-str\xE4ng",
    e164: "E.164-nummer",
    jwt: "JWT",
    template_literal: "mall-literal"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "antal",
    array: "lista"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ogiltig inmatning: f\xF6rv\xE4ntat instanceof ${issue2.expected}, fick ${received}`;
        }
        return `Ogiltig inmatning: f\xF6rv\xE4ntat ${expected}, fick ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ogiltig inmatning: f\xF6rv\xE4ntat ${stringifyPrimitive(issue2.values[0])}`;
        return `Ogiltigt val: f\xF6rv\xE4ntade en av ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r stor(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        }
        return `F\xF6r stor(t): f\xF6rv\xE4ntat ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Ogiltig str\xE4ng: m\xE5ste sluta med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${_issue.pattern}"`;
        return `Ogiltig(t) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ogiltigt tal: m\xE5ste vara en multipel av ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ogiltig nyckel i ${issue2.origin ?? "v\xE4rdet"}`;
      case "invalid_union":
        return "Ogiltig input";
      case "invalid_element":
        return `Ogiltigt v\xE4rde i ${issue2.origin ?? "v\xE4rdet"}`;
      default:
        return `Ogiltig input`;
    }
  };
};
function sv_default() {
  return {
    localeError: error40()
  };
}

// node_modules/zod/v4/locales/ta.js
var error41 = () => {
  const Sizable = {
    string: { unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    file: { unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    array: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    set: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1",
    email: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF",
    time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1",
    ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD",
    e164: "E.164 \u0B8E\u0BA3\u0BCD",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0B8E\u0BA3\u0BCD",
    array: "\u0B85\u0BA3\u0BBF",
    null: "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 instanceof ${issue2.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
        }
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${joinValues(issue2.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "ends_with")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "includes")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "regex")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${_issue.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${issue2.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      case "unrecognized_keys":
        return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${issue2.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
      case "invalid_union":
        return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
      case "invalid_element":
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
      default:
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1`;
    }
  };
};
function ta_default() {
  return {
    localeError: error41()
  };
}

// node_modules/zod/v4/locales/th.js
var error42 = () => {
  const Sizable = {
    string: { unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    file: { unit: "\u0E44\u0E1A\u0E15\u0E4C", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    array: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    set: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
    email: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25",
    url: "URL",
    emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO",
    time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    duration: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4",
    ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6",
    cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4",
    cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6",
    base64: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64",
    base64url: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL",
    json_string: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON",
    e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)",
    jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT",
    template_literal: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02",
    array: "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)",
    null: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 instanceof ${issue2.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
        }
        return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19" : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
        return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22" : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${_issue.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
        if (_issue.format === "regex")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${_issue.pattern}`;
        return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${issue2.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
      case "unrecognized_keys":
        return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      case "invalid_union":
        return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
      case "invalid_element":
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      default:
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`;
    }
  };
};
function th_default() {
  return {
    localeError: error42()
  };
}

// node_modules/zod/v4/locales/tr.js
var error43 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "olmal\u0131" },
    file: { unit: "bayt", verb: "olmal\u0131" },
    array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
    set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "girdi",
    email: "e-posta adresi",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO tarih ve saat",
    date: "ISO tarih",
    time: "ISO saat",
    duration: "ISO s\xFCre",
    ipv4: "IPv4 adresi",
    ipv6: "IPv6 adresi",
    cidrv4: "IPv4 aral\u0131\u011F\u0131",
    cidrv6: "IPv6 aral\u0131\u011F\u0131",
    base64: "base64 ile \u015Fifrelenmi\u015F metin",
    base64url: "base64url ile \u015Fifrelenmi\u015F metin",
    json_string: "JSON dizesi",
    e164: "E.164 say\u0131s\u0131",
    jwt: "JWT",
    template_literal: "\u015Eablon dizesi"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ge\xE7ersiz de\u011Fer: beklenen instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `Ge\xE7ersiz de\u011Fer: beklenen ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ge\xE7ersiz de\u011Fer: beklenen ${stringifyPrimitive(issue2.values[0])}`;
        return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xF6\u011Fe"}`;
        return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ge\xE7ersiz metin: "${_issue.prefix}" ile ba\u015Flamal\u0131`;
        if (_issue.format === "ends_with")
          return `Ge\xE7ersiz metin: "${_issue.suffix}" ile bitmeli`;
        if (_issue.format === "includes")
          return `Ge\xE7ersiz metin: "${_issue.includes}" i\xE7ermeli`;
        if (_issue.format === "regex")
          return `Ge\xE7ersiz metin: ${_issue.pattern} desenine uymal\u0131`;
        return `Ge\xE7ersiz ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ge\xE7ersiz say\u0131: ${issue2.divisor} ile tam b\xF6l\xFCnebilmeli`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} i\xE7inde ge\xE7ersiz anahtar`;
      case "invalid_union":
        return "Ge\xE7ersiz de\u011Fer";
      case "invalid_element":
        return `${issue2.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
      default:
        return `Ge\xE7ersiz de\u011Fer`;
    }
  };
};
function tr_default() {
  return {
    localeError: error43()
  };
}

// node_modules/zod/v4/locales/uk.js
var error44 = () => {
  const Sizable = {
    string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    file: { unit: "\u0431\u0430\u0439\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
    email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u0434\u0437\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO",
    date: "\u0434\u0430\u0442\u0430 ISO",
    time: "\u0447\u0430\u0441 ISO",
    duration: "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO",
    ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4",
    ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6",
    cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4",
    cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6",
    base64: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64",
    base64url: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url",
    json_string: "\u0440\u044F\u0434\u043E\u043A JSON",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    jwt: "JWT",
    template_literal: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F instanceof ${issue2.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} \u0431\u0443\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0456" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
      case "invalid_element":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456`;
    }
  };
};
function uk_default() {
  return {
    localeError: error44()
  };
}

// node_modules/zod/v4/locales/ua.js
function ua_default() {
  return uk_default();
}

// node_modules/zod/v4/locales/ur.js
var error45 = () => {
  const Sizable = {
    string: { unit: "\u062D\u0631\u0648\u0641", verb: "\u06C1\u0648\u0646\u0627" },
    file: { unit: "\u0628\u0627\u0626\u0679\u0633", verb: "\u06C1\u0648\u0646\u0627" },
    array: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" },
    set: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0627\u0646 \u067E\u0679",
    email: "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    uuidv4: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4",
    uuidv6: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6",
    nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2",
    ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC",
    xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC",
    ksuid: "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    datetime: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645",
    date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E",
    time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A",
    duration: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A",
    ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    cidrv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C",
    cidrv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C",
    base64: "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    base64url: "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    json_string: "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF",
    e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631",
    jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC",
    template_literal: "\u0627\u0646 \u067E\u0679"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0646\u0645\u0628\u0631",
    array: "\u0622\u0631\u06D2",
    null: "\u0646\u0644"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: instanceof ${issue2.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
        }
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${stringifyPrimitive(issue2.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
        return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${joinValues(issue2.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${adj}${issue2.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u06D2 ${adj}${issue2.minimum.toString()} ${sizing.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        }
        return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u0627 ${adj}${issue2.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        if (_issue.format === "ends_with")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (_issue.format === "includes")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (_issue.format === "regex")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${_issue.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        return `\u063A\u0644\u0637 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${issue2.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
      case "unrecognized_keys":
        return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${issue2.keys.length > 1 ? "\u0632" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      case "invalid_key":
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
      case "invalid_union":
        return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
      case "invalid_element":
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
      default:
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679`;
    }
  };
};
function ur_default() {
  return {
    localeError: error45()
  };
}

// node_modules/zod/v4/locales/uz.js
var error46 = () => {
  const Sizable = {
    string: { unit: "belgi", verb: "bo\u2018lishi kerak" },
    file: { unit: "bayt", verb: "bo\u2018lishi kerak" },
    array: { unit: "element", verb: "bo\u2018lishi kerak" },
    set: { unit: "element", verb: "bo\u2018lishi kerak" },
    map: { unit: "yozuv", verb: "bo\u2018lishi kerak" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "kirish",
    email: "elektron pochta manzili",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO sana va vaqti",
    date: "ISO sana",
    time: "ISO vaqt",
    duration: "ISO davomiylik",
    ipv4: "IPv4 manzil",
    ipv6: "IPv6 manzil",
    mac: "MAC manzil",
    cidrv4: "IPv4 diapazon",
    cidrv6: "IPv6 diapazon",
    base64: "base64 kodlangan satr",
    base64url: "base64url kodlangan satr",
    json_string: "JSON satr",
    e164: "E.164 raqam",
    jwt: "JWT",
    template_literal: "kirish"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "raqam",
    array: "massiv"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Noto\u2018g\u2018ri kirish: kutilgan instanceof ${issue2.expected}, qabul qilingan ${received}`;
        }
        return `Noto\u2018g\u2018ri kirish: kutilgan ${expected}, qabul qilingan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Noto\u2018g\u2018ri kirish: kutilgan ${stringifyPrimitive(issue2.values[0])}`;
        return `Noto\u2018g\u2018ri variant: quyidagilardan biri kutilgan ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Noto\u2018g\u2018ri satr: "${_issue.prefix}" bilan boshlanishi kerak`;
        if (_issue.format === "ends_with")
          return `Noto\u2018g\u2018ri satr: "${_issue.suffix}" bilan tugashi kerak`;
        if (_issue.format === "includes")
          return `Noto\u2018g\u2018ri satr: "${_issue.includes}" ni o\u2018z ichiga olishi kerak`;
        if (_issue.format === "regex")
          return `Noto\u2018g\u2018ri satr: ${_issue.pattern} shabloniga mos kelishi kerak`;
        return `Noto\u2018g\u2018ri ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Noto\u2018g\u2018ri raqam: ${issue2.divisor} ning karralisi bo\u2018lishi kerak`;
      case "unrecognized_keys":
        return `Noma\u2019lum kalit${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} dagi kalit noto\u2018g\u2018ri`;
      case "invalid_union":
        return "Noto\u2018g\u2018ri kirish";
      case "invalid_element":
        return `${issue2.origin} da noto\u2018g\u2018ri qiymat`;
      default:
        return `Noto\u2018g\u2018ri kirish`;
    }
  };
};
function uz_default() {
  return {
    localeError: error46()
  };
}

// node_modules/zod/v4/locales/vi.js
var error47 = () => {
  const Sizable = {
    string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" },
    file: { unit: "byte", verb: "c\xF3" },
    array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
    set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0111\u1EA7u v\xE0o",
    email: "\u0111\u1ECBa ch\u1EC9 email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ng\xE0y gi\u1EDD ISO",
    date: "ng\xE0y ISO",
    time: "gi\u1EDD ISO",
    duration: "kho\u1EA3ng th\u1EDDi gian ISO",
    ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4",
    ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6",
    cidrv4: "d\u1EA3i IPv4",
    cidrv6: "d\u1EA3i IPv6",
    base64: "chu\u1ED7i m\xE3 h\xF3a base64",
    base64url: "chu\u1ED7i m\xE3 h\xF3a base64url",
    json_string: "chu\u1ED7i JSON",
    e164: "s\u1ED1 E.164",
    jwt: "JWT",
    template_literal: "\u0111\u1EA7u v\xE0o"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "s\u1ED1",
    array: "m\u1EA3ng"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i instanceof ${issue2.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
        }
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${stringifyPrimitive(issue2.values[0])}`;
        return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "ph\u1EA7n t\u1EED"}`;
        return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} kh\xF4ng h\u1EE3p l\u1EC7`;
      }
      case "not_multiple_of":
        return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      case "invalid_union":
        return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
      case "invalid_element":
        return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      default:
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7`;
    }
  };
};
function vi_default() {
  return {
    localeError: error47()
  };
}

// node_modules/zod/v4/locales/zh-CN.js
var error48 = () => {
  const Sizable = {
    string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" },
    file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" },
    array: { unit: "\u9879", verb: "\u5305\u542B" },
    set: { unit: "\u9879", verb: "\u5305\u542B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u8F93\u5165",
    email: "\u7535\u5B50\u90AE\u4EF6",
    url: "URL",
    emoji: "\u8868\u60C5\u7B26\u53F7",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\u65E5\u671F\u65F6\u95F4",
    date: "ISO\u65E5\u671F",
    time: "ISO\u65F6\u95F4",
    duration: "ISO\u65F6\u957F",
    ipv4: "IPv4\u5730\u5740",
    ipv6: "IPv6\u5730\u5740",
    cidrv4: "IPv4\u7F51\u6BB5",
    cidrv6: "IPv6\u7F51\u6BB5",
    base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32",
    base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32",
    json_string: "JSON\u5B57\u7B26\u4E32",
    e164: "E.164\u53F7\u7801",
    jwt: "JWT",
    template_literal: "\u8F93\u5165"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u6570\u5B57",
    array: "\u6570\u7EC4",
    null: "\u7A7A\u503C(null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B instanceof ${issue2.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
        }
        return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${stringifyPrimitive(issue2.values[0])}`;
        return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u4E2A\u5143\u7D20"}`;
        return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.prefix}" \u5F00\u5934`;
        if (_issue.format === "ends_with")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.suffix}" \u7ED3\u5C3E`;
        if (_issue.format === "includes")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${_issue.pattern}`;
        return `\u65E0\u6548${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${issue2.divisor} \u7684\u500D\u6570`;
      case "unrecognized_keys":
        return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
      case "invalid_union":
        return "\u65E0\u6548\u8F93\u5165";
      case "invalid_element":
        return `${issue2.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
      default:
        return `\u65E0\u6548\u8F93\u5165`;
    }
  };
};
function zh_CN_default() {
  return {
    localeError: error48()
  };
}

// node_modules/zod/v4/locales/zh-TW.js
var error49 = () => {
  const Sizable = {
    string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" },
    file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" },
    array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
    set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u8F38\u5165",
    email: "\u90F5\u4EF6\u5730\u5740",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u65E5\u671F\u6642\u9593",
    date: "ISO \u65E5\u671F",
    time: "ISO \u6642\u9593",
    duration: "ISO \u671F\u9593",
    ipv4: "IPv4 \u4F4D\u5740",
    ipv6: "IPv6 \u4F4D\u5740",
    cidrv4: "IPv4 \u7BC4\u570D",
    cidrv6: "IPv6 \u7BC4\u570D",
    base64: "base64 \u7DE8\u78BC\u5B57\u4E32",
    base64url: "base64url \u7DE8\u78BC\u5B57\u4E32",
    json_string: "JSON \u5B57\u4E32",
    e164: "E.164 \u6578\u503C",
    jwt: "JWT",
    template_literal: "\u8F38\u5165"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA instanceof ${issue2.expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
        }
        return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${stringifyPrimitive(issue2.values[0])}`;
        return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u500B\u5143\u7D20"}`;
        return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.prefix}" \u958B\u982D`;
        }
        if (_issue.format === "ends_with")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.suffix}" \u7D50\u5C3E`;
        if (_issue.format === "includes")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${_issue.pattern}`;
        return `\u7121\u6548\u7684 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${issue2.divisor} \u7684\u500D\u6578`;
      case "unrecognized_keys":
        return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${issue2.keys.length > 1 ? "\u5011" : ""}\uFF1A${joinValues(issue2.keys, "\u3001")}`;
      case "invalid_key":
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
      case "invalid_union":
        return "\u7121\u6548\u7684\u8F38\u5165\u503C";
      case "invalid_element":
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
      default:
        return `\u7121\u6548\u7684\u8F38\u5165\u503C`;
    }
  };
};
function zh_TW_default() {
  return {
    localeError: error49()
  };
}

// node_modules/zod/v4/locales/yo.js
var error50 = () => {
  const Sizable = {
    string: { unit: "\xE0mi", verb: "n\xED" },
    file: { unit: "bytes", verb: "n\xED" },
    array: { unit: "nkan", verb: "n\xED" },
    set: { unit: "nkan", verb: "n\xED" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9",
    email: "\xE0d\xEDr\u1EB9\u0301s\xEC \xECm\u1EB9\u0301l\xEC",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\xE0k\xF3k\xF2 ISO",
    date: "\u1ECDj\u1ECD\u0301 ISO",
    time: "\xE0k\xF3k\xF2 ISO",
    duration: "\xE0k\xF3k\xF2 t\xF3 p\xE9 ISO",
    ipv4: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv4",
    ipv6: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv6",
    cidrv4: "\xE0gb\xE8gb\xE8 IPv4",
    cidrv6: "\xE0gb\xE8gb\xE8 IPv6",
    base64: "\u1ECD\u0300r\u1ECD\u0300 t\xED a k\u1ECD\u0301 n\xED base64",
    base64url: "\u1ECD\u0300r\u1ECD\u0300 base64url",
    json_string: "\u1ECD\u0300r\u1ECD\u0300 JSON",
    e164: "n\u1ECD\u0301mb\xE0 E.164",
    jwt: "JWT",
    template_literal: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "n\u1ECD\u0301mb\xE0",
    array: "akop\u1ECD"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi instanceof ${issue2.expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
        }
        return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${stringifyPrimitive(issue2.values[0])}`;
        return `\xC0\u1E63\xE0y\xE0n a\u1E63\xEC\u1E63e: yan \u1ECD\u0300kan l\xE1ra ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin ?? "iye"} ${sizing.verb} ${adj}${issue2.maximum} ${sizing.unit}`;
        return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.maximum}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum} ${sizing.unit}`;
        return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.minimum}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\u1EB9\u0300r\u1EB9\u0300 p\u1EB9\u0300l\xFA "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 par\xED p\u1EB9\u0300l\xFA "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 n\xED "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\xE1 \xE0p\u1EB9\u1EB9r\u1EB9 mu ${_issue.pattern}`;
        return `A\u1E63\xEC\u1E63e: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\u1ECD\u0301mb\xE0 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 j\u1EB9\u0301 \xE8y\xE0 p\xEDp\xEDn ti ${issue2.divisor}`;
      case "unrecognized_keys":
        return `B\u1ECDt\xECn\xEC \xE0\xECm\u1ECD\u0300: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `B\u1ECDt\xECn\xEC a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      case "invalid_union":
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
      case "invalid_element":
        return `Iye a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      default:
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
    }
  };
};
function yo_default() {
  return {
    localeError: error50()
  };
}

// node_modules/zod/v4/core/registries.js
var _a2;
var $output = /* @__PURE__ */ Symbol("ZodOutput");
var $input = /* @__PURE__ */ Symbol("ZodInput");
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta3 = _meta[0];
    this._map.set(schema, meta3);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.set(meta3.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta3 = this._map.get(schema);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.delete(meta3.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class2, params) {
  return new Class2({
    type: "string",
    format: "mac",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
var TimePrecision = {
  Any: null,
  Minute: -1,
  Second: 0,
  Millisecond: 3,
  Microsecond: 6
};
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _positive(params) {
  return /* @__PURE__ */ _gt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _negative(params) {
  return /* @__PURE__ */ _lt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
  return /* @__PURE__ */ _lte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
  return /* @__PURE__ */ _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _union(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
function _xor(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    inclusive: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _intersection(Class2, left, right) {
  return new Class2({
    type: "intersection",
    left,
    right
  });
}
// @__NO_SIDE_EFFECTS__
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    type: "map",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _enum(Class2, values, params) {
  const entries2 = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new Class2({
    type: "enum",
    entries: entries2,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nativeEnum(Class2, entries2, params) {
  return new Class2({
    type: "enum",
    entries: entries2,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _transform(Class2, fn) {
  return new Class2({
    type: "transform",
    transform: fn
  });
}
// @__NO_SIDE_EFFECTS__
function _optional(Class2, innerType) {
  return new Class2({
    type: "optional",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _nullable(Class2, innerType) {
  return new Class2({
    type: "nullable",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _success(Class2, innerType) {
  return new Class2({
    type: "success",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
// @__NO_SIDE_EFFECTS__
function _pipe(Class2, in_, out) {
  return new Class2({
    type: "pipe",
    in: in_,
    out
  });
}
// @__NO_SIDE_EFFECTS__
function _readonly(Class2, innerType) {
  return new Class2({
    type: "readonly",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    type: "template_literal",
    parts,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lazy(Class2, getter) {
  return new Class2({
    type: "lazy",
    getter
  });
}
// @__NO_SIDE_EFFECTS__
function _promise(Class2, innerType) {
  return new Class2({
    type: "promise",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
  const ch = new $ZodCheck({ check: "describe" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, description });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
  const ch = new $ZodCheck({ check: "meta" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, ...metadata });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
    falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Codec = Classes.Codec ?? $ZodCodec;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const stringSchema = new _String({ type: "string", error: params.error });
  const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
  const codec2 = new _Codec({
    type: "pipe",
    in: stringSchema,
    out: booleanSchema,
    transform: ((input, payload) => {
      let data = input;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: codec2,
          continue: false
        });
        return {};
      }
    }),
    reverseTransform: ((input, _payload) => {
      if (input === true) {
        return truthyArray[0] || "true";
      } else {
        return falsyArray[0] || "false";
      }
    }),
    error: params.error
  });
  return codec2;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    ...normalizeParams(_params),
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}

// node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta3 = ctx.metadataRegistry.get(schema);
  if (meta3)
    Object.assign(result.schema, meta3);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        Object.assign(schema2, refSchema);
      }
      Object.assign(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};

// node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var stringProcessor = (schema, ctx, _json, _params) => {
  const json2 = _json;
  json2.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
  if (typeof minimum === "number")
    json2.minLength = minimum;
  if (typeof maximum === "number")
    json2.maxLength = maximum;
  if (format) {
    json2.format = formatMap[format] ?? format;
    if (json2.format === "")
      delete json2.format;
    if (format === "time") {
      delete json2.format;
    }
  }
  if (contentEncoding)
    json2.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json2.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json2.allOf = [
        ...regexes.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, _params) => {
  const json2 = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json2.type = "integer";
  else
    json2.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json2.minimum = exclusiveMinimum;
      json2.exclusiveMinimum = true;
    } else {
      json2.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json2.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json2.maximum = exclusiveMaximum;
      json2.exclusiveMaximum = true;
    } else {
      json2.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json2.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json2.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var bigintProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("BigInt cannot be represented in JSON Schema");
  }
};
var symbolProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Symbols cannot be represented in JSON Schema");
  }
};
var nullProcessor = (_schema, ctx, json2, _params) => {
  if (ctx.target === "openapi-3.0") {
    json2.type = "string";
    json2.nullable = true;
    json2.enum = [null];
  } else {
    json2.type = "null";
  }
};
var undefinedProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Undefined cannot be represented in JSON Schema");
  }
};
var voidProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Void cannot be represented in JSON Schema");
  }
};
var neverProcessor = (_schema, _ctx, json2, _params) => {
  json2.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var dateProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Date cannot be represented in JSON Schema");
  }
};
var enumProcessor = (schema, _ctx, json2, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json2.type = "number";
  if (values.every((v) => typeof v === "string"))
    json2.type = "string";
  json2.enum = values;
};
var literalProcessor = (schema, ctx, json2, _params) => {
  const def = schema._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      } else {
      }
    } else if (typeof val === "bigint") {
      if (ctx.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json2.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json2.enum = [val];
    } else {
      json2.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json2.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json2.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json2.type = "boolean";
    if (vals.every((v) => v === null))
      json2.type = "null";
    json2.enum = vals;
  }
};
var nanProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("NaN cannot be represented in JSON Schema");
  }
};
var templateLiteralProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  const file2 = {
    type: "string",
    format: "binary",
    contentEncoding: "binary"
  };
  const { minimum, maximum, mime } = schema._zod.bag;
  if (minimum !== void 0)
    file2.minLength = minimum;
  if (maximum !== void 0)
    file2.maxLength = maximum;
  if (mime) {
    if (mime.length === 1) {
      file2.contentMediaType = mime[0];
      Object.assign(_json, file2);
    } else {
      Object.assign(_json, file2);
      _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
    }
  } else {
    Object.assign(_json, file2);
  }
};
var successProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
var functionProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Function types cannot be represented in JSON Schema");
  }
};
var transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
var mapProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Map cannot be represented in JSON Schema");
  }
};
var setProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Set cannot be represented in JSON Schema");
  }
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
  json2.type = "array";
  json2.items = process(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
var objectProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "object";
  json2.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json2.properties[key] = process(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === void 0;
    } else {
      return v.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json2.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json2.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json2.additionalProperties = false;
  } else if (def.catchall) {
    json2.additionalProperties = process(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json2.oneOf = options;
  } else {
    json2.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const a = process(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json2.allOf = allOf;
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => process(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? process(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  if (ctx.target === "draft-2020-12") {
    json2.prefixItems = prefixItems;
    if (rest) {
      json2.items = rest;
    }
  } else if (ctx.target === "openapi-3.0") {
    json2.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json2.items.anyOf.push(rest);
    }
    json2.minItems = prefixItems.length;
    if (!rest) {
      json2.maxItems = prefixItems.length;
    }
  } else {
    json2.items = prefixItems;
    if (rest) {
      json2.additionalItems = rest;
    }
  }
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
};
var recordProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "object";
  const keyType = def.keyType;
  const keyBag = keyType._zod.bag;
  const patterns = keyBag?.patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json2.patternProperties = {};
    for (const pattern of patterns) {
      json2.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json2.propertyNames = process(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
    }
    json2.additionalProperties = process(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json2.required = validKeyValues;
    }
  }
};
var nullableProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const inner = process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json2.nullable = true;
  } else {
    json2.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json2._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json2.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input, params) {
  if ("_idmap" in input) {
    const registry2 = input;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      process(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      schemas[key] = finalize(ctx2, schema);
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  process(input, ctx);
  extractDefs(ctx, input);
  return finalize(ctx, input);
}

// node_modules/zod/v4/core/json-schema-generator.js
var JSONSchemaGenerator = class {
  /** @deprecated Access via ctx instead */
  get metadataRegistry() {
    return this.ctx.metadataRegistry;
  }
  /** @deprecated Access via ctx instead */
  get target() {
    return this.ctx.target;
  }
  /** @deprecated Access via ctx instead */
  get unrepresentable() {
    return this.ctx.unrepresentable;
  }
  /** @deprecated Access via ctx instead */
  get override() {
    return this.ctx.override;
  }
  /** @deprecated Access via ctx instead */
  get io() {
    return this.ctx.io;
  }
  /** @deprecated Access via ctx instead */
  get counter() {
    return this.ctx.counter;
  }
  set counter(value) {
    this.ctx.counter = value;
  }
  /** @deprecated Access via ctx instead */
  get seen() {
    return this.ctx.seen;
  }
  constructor(params) {
    let normalizedTarget = params?.target ?? "draft-2020-12";
    if (normalizedTarget === "draft-4")
      normalizedTarget = "draft-04";
    if (normalizedTarget === "draft-7")
      normalizedTarget = "draft-07";
    this.ctx = initializeContext({
      processors: allProcessors,
      target: normalizedTarget,
      ...params?.metadata && { metadata: params.metadata },
      ...params?.unrepresentable && { unrepresentable: params.unrepresentable },
      ...params?.override && { override: params.override },
      ...params?.io && { io: params.io }
    });
  }
  /**
   * Process a schema to prepare it for JSON Schema generation.
   * This must be called before emit().
   */
  process(schema, _params = { path: [], schemaPath: [] }) {
    return process(schema, this.ctx, _params);
  }
  /**
   * Emit the final JSON Schema after processing.
   * Must call process() first.
   */
  emit(schema, _params) {
    if (_params) {
      if (_params.cycles)
        this.ctx.cycles = _params.cycles;
      if (_params.reused)
        this.ctx.reused = _params.reused;
      if (_params.external)
        this.ctx.external = _params.external;
    }
    extractDefs(this.ctx, schema);
    const result = finalize(this.ctx, schema);
    const { "~standard": _, ...plainResult } = result;
    return plainResult;
  }
};

// node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};

// node_modules/zod/v4/classic/schemas.js
var schemas_exports2 = {};
__export(schemas_exports2, {
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodIntersection: () => ZodIntersection,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  codec: () => codec,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date3,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  float32: () => float32,
  float64: () => float64,
  function: () => _function,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  literal: () => literal,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  mac: () => mac2,
  map: () => map,
  meta: () => meta2,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  never: () => never,
  nonoptional: () => nonoptional,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  prefault: () => prefault,
  preprocess: () => preprocess,
  promise: () => promise,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  set: () => set,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  transform: () => transform,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});

// node_modules/zod/v4/classic/checks.js
var checks_exports2 = {};
__export(checks_exports2, {
  endsWith: () => _endsWith,
  gt: () => _gt,
  gte: () => _gte,
  includes: () => _includes,
  length: () => _length,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  negative: () => _negative,
  nonnegative: () => _nonnegative,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  overwrite: () => _overwrite,
  positive: () => _positive,
  property: () => _property,
  regex: () => _regex,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  trim: () => _trim,
  uppercase: () => _uppercase
});

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
var ZodError = /* @__PURE__ */ $constructor("ZodError", initializer2);
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode2 = /* @__PURE__ */ _encode(ZodRealError);
var decode2 = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync2 = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync2 = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode2 = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode2 = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync2 = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync2 = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode2(inst, data, params);
  inst.decode = (data, params) => decode2(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync2(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync2(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode2(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode2(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync2(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync2(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def2 = this.def;
      return this.clone(util_exports.mergeDefs(def2, {
        checks: [
          ...def2.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def2, params) {
      return clone(this, def2, params);
    },
    brand() {
      return this;
    },
    register(reg, meta3) {
      reg.add(this, meta3);
      return this;
    },
    refine(check2, params) {
      return this.check(refine(check2, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(_overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default2(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch2(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(void 0).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => stringProcessor(inst, ctx, json2, params);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  });
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function guid2(params) {
  return _guid(ZodGUID, params);
}
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function uuid2(params) {
  return _uuid(ZodUUID, params);
}
function uuidv4(params) {
  return _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
  return _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
  return _uuidv7(ZodUUID, params);
}
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
function httpUrl(params) {
  return _url(ZodURL, {
    protocol: regexes_exports.httpProtocol,
    hostname: regexes_exports.domain,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function emoji2(params) {
  return _emoji2(ZodEmoji, params);
}
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function nanoid2(params) {
  return _nanoid(ZodNanoID, params);
}
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid3(params) {
  return _cuid(ZodCUID, params);
}
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid22(params) {
  return _cuid2(ZodCUID2, params);
}
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ulid2(params) {
  return _ulid(ZodULID, params);
}
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function xid2(params) {
  return _xid(ZodXID, params);
}
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ksuid2(params) {
  return _ksuid(ZodKSUID, params);
}
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv42(params) {
  return _ipv4(ZodIPv4, params);
}
var ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
  $ZodMAC.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function mac2(params) {
  return _mac(ZodMAC, params);
}
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv62(params) {
  return _ipv6(ZodIPv6, params);
}
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv42(params) {
  return _cidrv4(ZodCIDRv4, params);
}
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv62(params) {
  return _cidrv6(ZodCIDRv6, params);
}
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base642(params) {
  return _base64(ZodBase64, params);
}
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base64url2(params) {
  return _base64url(ZodBase64URL, params);
}
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function e1642(params) {
  return _e164(ZodE164, params);
}
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function jwt(params) {
  return _jwt(ZodJWT, params);
}
var ZodCustomStringFormat = /* @__PURE__ */ $constructor("ZodCustomStringFormat", (inst, def) => {
  $ZodCustomStringFormat.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function stringFormat(format, fnOrRegex, _params = {}) {
  return _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hostname", regexes_exports.hostname, _params);
}
function hex2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hex", regexes_exports.hex, _params);
}
function hash(alg, params) {
  const enc = params?.enc ?? "hex";
  const format = `${alg}_${enc}`;
  const regex = regexes_exports[format];
  if (!regex)
    throw new Error(`Unrecognized hash format: ${format}`);
  return _stringFormat(ZodCustomStringFormat, format, regex, params);
}
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => numberProcessor(inst, ctx, json2, params);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
function float32(params) {
  return _float32(ZodNumberFormat, params);
}
function float64(params) {
  return _float64(ZodNumberFormat, params);
}
function int32(params) {
  return _int32(ZodNumberFormat, params);
}
function uint32(params) {
  return _uint32(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => booleanProcessor(inst, ctx, json2, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor("ZodBigInt", (inst, def) => {
  $ZodBigInt.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => bigintProcessor(inst, ctx, json2, params);
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.positive = (params) => inst.check(_gt(BigInt(0), params));
  inst.negative = (params) => inst.check(_lt(BigInt(0), params));
  inst.nonpositive = (params) => inst.check(_lte(BigInt(0), params));
  inst.nonnegative = (params) => inst.check(_gte(BigInt(0), params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  const bag = inst._zod.bag;
  inst.minValue = bag.minimum ?? null;
  inst.maxValue = bag.maximum ?? null;
  inst.format = bag.format ?? null;
});
function bigint2(params) {
  return _bigint(ZodBigInt, params);
}
var ZodBigIntFormat = /* @__PURE__ */ $constructor("ZodBigIntFormat", (inst, def) => {
  $ZodBigIntFormat.init(inst, def);
  ZodBigInt.init(inst, def);
});
function int64(params) {
  return _int64(ZodBigIntFormat, params);
}
function uint64(params) {
  return _uint64(ZodBigIntFormat, params);
}
var ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
  $ZodSymbol.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => symbolProcessor(inst, ctx, json2, params);
});
function symbol(params) {
  return _symbol(ZodSymbol, params);
}
var ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
  $ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => undefinedProcessor(inst, ctx, json2, params);
});
function _undefined3(params) {
  return _undefined2(ZodUndefined, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullProcessor(inst, ctx, json2, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => anyProcessor(inst, ctx, json2, params);
});
function any() {
  return _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unknownProcessor(inst, ctx, json2, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => neverProcessor(inst, ctx, json2, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
  $ZodVoid.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => voidProcessor(inst, ctx, json2, params);
});
function _void2(params) {
  return _void(ZodVoid, params);
}
var ZodDate = /* @__PURE__ */ $constructor("ZodDate", (inst, def) => {
  $ZodDate.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => dateProcessor(inst, ctx, json2, params);
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  const c = inst._zod.bag;
  inst.minDate = c.minimum ? new Date(c.minimum) : null;
  inst.maxDate = c.maximum ? new Date(c.maximum) : null;
});
function date3(params) {
  return _date(ZodDate, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => arrayProcessor(inst, ctx, json2, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(_minLength(n, params));
    },
    nonempty(params) {
      return this.check(_minLength(1, params));
    },
    max(n, params) {
      return this.check(_maxLength(n, params));
    },
    length(n, params) {
      return this.check(_length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return _enum2(Object.keys(shape));
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => objectProcessor(inst, ctx, json2, params);
  util_exports.defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum2(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: void 0 });
    },
    extend(incoming) {
      return util_exports.extend(this, incoming);
    },
    safeExtend(incoming) {
      return util_exports.safeExtend(this, incoming);
    },
    merge(other) {
      return util_exports.merge(this, other);
    },
    pick(mask) {
      return util_exports.pick(this, mask);
    },
    omit(mask) {
      return util_exports.omit(this, mask);
    },
    partial(...args) {
      return util_exports.partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return util_exports.required(ZodNonOptional, this, args[0]);
    }
  });
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodXor.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function xor(options, params) {
  return new ZodXor({
    type: "union",
    options,
    inclusive: false,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => intersectionProcessor(inst, ctx, json2, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => tupleProcessor(inst, ctx, json2, params);
  inst.rest = (rest) => inst.clone({
    ...inst._zod.def,
    rest
  });
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => recordProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  const k = clone(keyType);
  k._zod.values = void 0;
  return new ZodRecord({
    type: "record",
    keyType: k,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function looseRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    mode: "loose",
    ...util_exports.normalizeParams(params)
  });
}
var ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
  $ZodMap.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => mapProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function map(keyType, valueType, params) {
  return new ZodMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
  $ZodSet.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => setProcessor(inst, ctx, json2, params);
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => enumProcessor(inst, ctx, json2, params);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum2(values, params) {
  const entries2 = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries: entries2,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries2, params) {
  return new ZodEnum({
    type: "enum",
    entries: entries2,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => literalProcessor(inst, ctx, json2, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
  $ZodFile.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => fileProcessor(inst, ctx, json2, params);
  inst.min = (size, params) => inst.check(_minSize(size, params));
  inst.max = (size, params) => inst.check(_maxSize(size, params));
  inst.mime = (types, params) => inst.check(_mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
  return _file(ZodFile, params);
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => transformProcessor(inst, ctx, json2, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullableProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => defaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => prefaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nonoptionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
  $ZodSuccess.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => successProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
  return new ZodSuccess({
    type: "success",
    innerType
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => catchProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch2(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
  $ZodNaN.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nanProcessor(inst, ctx, json2, params);
});
function nan(params) {
  return _nan(ZodNaN, params);
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => pipeProcessor(inst, ctx, json2, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodCodec.init(inst, def);
});
function codec(in_, out, params) {
  return new ZodCodec({
    type: "pipe",
    in: in_,
    out,
    transform: params.decode,
    reverseTransform: params.encode
  });
}
function invertCodec(codec2) {
  const def = codec2._zod.def;
  return new ZodCodec({
    type: "pipe",
    in: def.out,
    out: def.in,
    transform: def.reverseTransform,
    reverseTransform: def.transform
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => readonlyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodTemplateLiteral = /* @__PURE__ */ $constructor("ZodTemplateLiteral", (inst, def) => {
  $ZodTemplateLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => templateLiteralProcessor(inst, ctx, json2, params);
});
function templateLiteral(parts, params) {
  return new ZodTemplateLiteral({
    type: "template_literal",
    parts,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => lazyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
  $ZodPromise.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => promiseProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
  return new ZodPromise({
    type: "promise",
    innerType
  });
}
var ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
  $ZodFunction.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => functionProcessor(inst, ctx, json2, params);
});
function _function(params) {
  return new ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
    output: params?.output ?? unknown()
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => customProcessor(inst, ctx, json2, params);
});
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
var describe2 = describe;
var meta2 = meta;
function _instanceof(cls, params = {}) {
  const inst = new ZodCustom({
    type: "custom",
    check: "custom",
    fn: (data) => data instanceof cls,
    abort: true,
    ...util_exports.normalizeParams(params)
  });
  inst._zod.bag.Class = cls;
  inst._zod.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...inst._zod.def.path ?? []]
      });
    }
  };
  return inst;
}
var stringbool = (...args) => _stringbool({
  Codec: ZodCodec,
  Boolean: ZodBoolean,
  String: ZodString
}, ...args);
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}

// node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
function setErrorMap(map2) {
  config({
    customError: map2
  });
}
function getErrorMap() {
  return config().customError;
}
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

// node_modules/zod/v4/classic/from-json-schema.js
var z = {
  ...schemas_exports2,
  ...checks_exports2,
  iso: iso_exports
};
var RECOGNIZED_KEYS = /* @__PURE__ */ new Set([
  // Schema identification
  "$schema",
  "$ref",
  "$defs",
  "definitions",
  // Core schema keywords
  "$id",
  "id",
  "$comment",
  "$anchor",
  "$vocabulary",
  "$dynamicRef",
  "$dynamicAnchor",
  // Type
  "type",
  "enum",
  "const",
  // Composition
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  // Object
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  // Array
  "items",
  "prefixItems",
  "additionalItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  // String
  "minLength",
  "maxLength",
  "pattern",
  "format",
  // Number
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  // Already handled metadata
  "description",
  "default",
  // Content
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
  // Unsupported (error-throwing)
  "unevaluatedItems",
  "unevaluatedProperties",
  "if",
  "then",
  "else",
  "dependentSchemas",
  "dependentRequired",
  // OpenAPI
  "nullable",
  "readOnly"
]);
function detectVersion(schema, defaultTarget) {
  const $schema = schema.$schema;
  if ($schema === "https://json-schema.org/draft/2020-12/schema") {
    return "draft-2020-12";
  }
  if ($schema === "http://json-schema.org/draft-07/schema#") {
    return "draft-7";
  }
  if ($schema === "http://json-schema.org/draft-04/schema#") {
    return "draft-4";
  }
  return defaultTarget ?? "draft-2020-12";
}
function resolveRef(ref, ctx) {
  if (!ref.startsWith("#")) {
    throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
  }
  const path = ref.slice(1).split("/").filter(Boolean);
  if (path.length === 0) {
    return ctx.rootSchema;
  }
  const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
  if (path[0] === defsKey) {
    const key = path[1];
    if (!key || !ctx.defs[key]) {
      throw new Error(`Reference not found: ${ref}`);
    }
    return ctx.defs[key];
  }
  throw new Error(`Reference not found: ${ref}`);
}
function convertBaseSchema(schema, ctx) {
  if (schema.not !== void 0) {
    if (typeof schema.not === "object" && Object.keys(schema.not).length === 0) {
      return z.never();
    }
    throw new Error("not is not supported in Zod (except { not: {} } for never)");
  }
  if (schema.unevaluatedItems !== void 0) {
    throw new Error("unevaluatedItems is not supported");
  }
  if (schema.unevaluatedProperties !== void 0) {
    throw new Error("unevaluatedProperties is not supported");
  }
  if (schema.if !== void 0 || schema.then !== void 0 || schema.else !== void 0) {
    throw new Error("Conditional schemas (if/then/else) are not supported");
  }
  if (schema.dependentSchemas !== void 0 || schema.dependentRequired !== void 0) {
    throw new Error("dependentSchemas and dependentRequired are not supported");
  }
  if (schema.$ref) {
    const refPath = schema.$ref;
    if (ctx.refs.has(refPath)) {
      return ctx.refs.get(refPath);
    }
    if (ctx.processing.has(refPath)) {
      return z.lazy(() => {
        if (!ctx.refs.has(refPath)) {
          throw new Error(`Circular reference not resolved: ${refPath}`);
        }
        return ctx.refs.get(refPath);
      });
    }
    ctx.processing.add(refPath);
    const resolved = resolveRef(refPath, ctx);
    const zodSchema2 = convertSchema(resolved, ctx);
    ctx.refs.set(refPath, zodSchema2);
    ctx.processing.delete(refPath);
    return zodSchema2;
  }
  if (schema.enum !== void 0) {
    const enumValues = schema.enum;
    if (ctx.version === "openapi-3.0" && schema.nullable === true && enumValues.length === 1 && enumValues[0] === null) {
      return z.null();
    }
    if (enumValues.length === 0) {
      return z.never();
    }
    if (enumValues.length === 1) {
      return z.literal(enumValues[0]);
    }
    if (enumValues.every((v) => typeof v === "string")) {
      return z.enum(enumValues);
    }
    const literalSchemas = enumValues.map((v) => z.literal(v));
    if (literalSchemas.length < 2) {
      return literalSchemas[0];
    }
    return z.union([literalSchemas[0], literalSchemas[1], ...literalSchemas.slice(2)]);
  }
  if (schema.const !== void 0) {
    return z.literal(schema.const);
  }
  const type = schema.type;
  if (Array.isArray(type)) {
    const typeSchemas = type.map((t) => {
      const typeSchema = { ...schema, type: t };
      return convertBaseSchema(typeSchema, ctx);
    });
    if (typeSchemas.length === 0) {
      return z.never();
    }
    if (typeSchemas.length === 1) {
      return typeSchemas[0];
    }
    return z.union(typeSchemas);
  }
  if (!type) {
    return z.any();
  }
  let zodSchema;
  switch (type) {
    case "string": {
      let stringSchema = z.string();
      if (schema.format) {
        const format = schema.format;
        if (format === "email") {
          stringSchema = stringSchema.check(z.email());
        } else if (format === "uri" || format === "uri-reference") {
          stringSchema = stringSchema.check(z.url());
        } else if (format === "uuid" || format === "guid") {
          stringSchema = stringSchema.check(z.uuid());
        } else if (format === "date-time") {
          stringSchema = stringSchema.check(z.iso.datetime());
        } else if (format === "date") {
          stringSchema = stringSchema.check(z.iso.date());
        } else if (format === "time") {
          stringSchema = stringSchema.check(z.iso.time());
        } else if (format === "duration") {
          stringSchema = stringSchema.check(z.iso.duration());
        } else if (format === "ipv4") {
          stringSchema = stringSchema.check(z.ipv4());
        } else if (format === "ipv6") {
          stringSchema = stringSchema.check(z.ipv6());
        } else if (format === "mac") {
          stringSchema = stringSchema.check(z.mac());
        } else if (format === "cidr") {
          stringSchema = stringSchema.check(z.cidrv4());
        } else if (format === "cidr-v6") {
          stringSchema = stringSchema.check(z.cidrv6());
        } else if (format === "base64") {
          stringSchema = stringSchema.check(z.base64());
        } else if (format === "base64url") {
          stringSchema = stringSchema.check(z.base64url());
        } else if (format === "e164") {
          stringSchema = stringSchema.check(z.e164());
        } else if (format === "jwt") {
          stringSchema = stringSchema.check(z.jwt());
        } else if (format === "emoji") {
          stringSchema = stringSchema.check(z.emoji());
        } else if (format === "nanoid") {
          stringSchema = stringSchema.check(z.nanoid());
        } else if (format === "cuid") {
          stringSchema = stringSchema.check(z.cuid());
        } else if (format === "cuid2") {
          stringSchema = stringSchema.check(z.cuid2());
        } else if (format === "ulid") {
          stringSchema = stringSchema.check(z.ulid());
        } else if (format === "xid") {
          stringSchema = stringSchema.check(z.xid());
        } else if (format === "ksuid") {
          stringSchema = stringSchema.check(z.ksuid());
        }
      }
      if (typeof schema.minLength === "number") {
        stringSchema = stringSchema.min(schema.minLength);
      }
      if (typeof schema.maxLength === "number") {
        stringSchema = stringSchema.max(schema.maxLength);
      }
      if (schema.pattern) {
        stringSchema = stringSchema.regex(new RegExp(schema.pattern));
      }
      zodSchema = stringSchema;
      break;
    }
    case "number":
    case "integer": {
      let numberSchema = type === "integer" ? z.number().int() : z.number();
      if (typeof schema.minimum === "number") {
        numberSchema = numberSchema.min(schema.minimum);
      }
      if (typeof schema.maximum === "number") {
        numberSchema = numberSchema.max(schema.maximum);
      }
      if (typeof schema.exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(schema.exclusiveMinimum);
      } else if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") {
        numberSchema = numberSchema.gt(schema.minimum);
      }
      if (typeof schema.exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(schema.exclusiveMaximum);
      } else if (schema.exclusiveMaximum === true && typeof schema.maximum === "number") {
        numberSchema = numberSchema.lt(schema.maximum);
      }
      if (typeof schema.multipleOf === "number") {
        numberSchema = numberSchema.multipleOf(schema.multipleOf);
      }
      zodSchema = numberSchema;
      break;
    }
    case "boolean": {
      zodSchema = z.boolean();
      break;
    }
    case "null": {
      zodSchema = z.null();
      break;
    }
    case "object": {
      const shape = {};
      const properties = schema.properties || {};
      const requiredSet = new Set(schema.required || []);
      for (const [key, propSchema] of Object.entries(properties)) {
        const propZodSchema = convertSchema(propSchema, ctx);
        shape[key] = requiredSet.has(key) ? propZodSchema : propZodSchema.optional();
      }
      if (schema.propertyNames) {
        const keySchema = convertSchema(schema.propertyNames, ctx);
        const valueSchema = schema.additionalProperties && typeof schema.additionalProperties === "object" ? convertSchema(schema.additionalProperties, ctx) : z.any();
        if (Object.keys(shape).length === 0) {
          zodSchema = z.record(keySchema, valueSchema);
          break;
        }
        const objectSchema2 = z.object(shape).passthrough();
        const recordSchema = z.looseRecord(keySchema, valueSchema);
        zodSchema = z.intersection(objectSchema2, recordSchema);
        break;
      }
      if (schema.patternProperties) {
        const patternProps = schema.patternProperties;
        const patternKeys = Object.keys(patternProps);
        const looseRecords = [];
        for (const pattern of patternKeys) {
          const patternValue = convertSchema(patternProps[pattern], ctx);
          const keySchema = z.string().regex(new RegExp(pattern));
          looseRecords.push(z.looseRecord(keySchema, patternValue));
        }
        const schemasToIntersect = [];
        if (Object.keys(shape).length > 0) {
          schemasToIntersect.push(z.object(shape).passthrough());
        }
        schemasToIntersect.push(...looseRecords);
        if (schemasToIntersect.length === 0) {
          zodSchema = z.object({}).passthrough();
        } else if (schemasToIntersect.length === 1) {
          zodSchema = schemasToIntersect[0];
        } else {
          let result = z.intersection(schemasToIntersect[0], schemasToIntersect[1]);
          for (let i = 2; i < schemasToIntersect.length; i++) {
            result = z.intersection(result, schemasToIntersect[i]);
          }
          zodSchema = result;
        }
        break;
      }
      const objectSchema = z.object(shape);
      if (schema.additionalProperties === false) {
        zodSchema = objectSchema.strict();
      } else if (typeof schema.additionalProperties === "object") {
        zodSchema = objectSchema.catchall(convertSchema(schema.additionalProperties, ctx));
      } else {
        zodSchema = objectSchema.passthrough();
      }
      break;
    }
    case "array": {
      const prefixItems = schema.prefixItems;
      const items = schema.items;
      if (prefixItems && Array.isArray(prefixItems)) {
        const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
        const rest = items && typeof items === "object" && !Array.isArray(items) ? convertSchema(items, ctx) : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (Array.isArray(items)) {
        const tupleItems = items.map((item) => convertSchema(item, ctx));
        const rest = schema.additionalItems && typeof schema.additionalItems === "object" ? convertSchema(schema.additionalItems, ctx) : void 0;
        if (rest) {
          zodSchema = z.tuple(tupleItems).rest(rest);
        } else {
          zodSchema = z.tuple(tupleItems);
        }
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (items !== void 0) {
        const element = convertSchema(items, ctx);
        let arraySchema = z.array(element);
        if (typeof schema.minItems === "number") {
          arraySchema = arraySchema.min(schema.minItems);
        }
        if (typeof schema.maxItems === "number") {
          arraySchema = arraySchema.max(schema.maxItems);
        }
        zodSchema = arraySchema;
      } else {
        zodSchema = z.array(z.any());
      }
      break;
    }
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
  return zodSchema;
}
function convertSchema(schema, ctx) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let baseSchema = convertBaseSchema(schema, ctx);
  const hasExplicitType = schema.type || schema.enum !== void 0 || schema.const !== void 0;
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const options = schema.anyOf.map((s) => convertSchema(s, ctx));
    const anyOfUnion = z.union(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, anyOfUnion) : anyOfUnion;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const options = schema.oneOf.map((s) => convertSchema(s, ctx));
    const oneOfUnion = z.xor(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, oneOfUnion) : oneOfUnion;
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    if (schema.allOf.length === 0) {
      baseSchema = hasExplicitType ? baseSchema : z.any();
    } else {
      let result = hasExplicitType ? baseSchema : convertSchema(schema.allOf[0], ctx);
      const startIdx = hasExplicitType ? 0 : 1;
      for (let i = startIdx; i < schema.allOf.length; i++) {
        result = z.intersection(result, convertSchema(schema.allOf[i], ctx));
      }
      baseSchema = result;
    }
  }
  if (schema.nullable === true && ctx.version === "openapi-3.0") {
    baseSchema = z.nullable(baseSchema);
  }
  if (schema.readOnly === true) {
    baseSchema = z.readonly(baseSchema);
  }
  if (schema.default !== void 0) {
    baseSchema = baseSchema.default(schema.default);
  }
  const extraMeta = {};
  const coreMetadataKeys = ["$id", "id", "$comment", "$anchor", "$vocabulary", "$dynamicRef", "$dynamicAnchor"];
  for (const key of coreMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  const contentMetadataKeys = ["contentEncoding", "contentMediaType", "contentSchema"];
  for (const key of contentMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  for (const key of Object.keys(schema)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      extraMeta[key] = schema[key];
    }
  }
  if (Object.keys(extraMeta).length > 0) {
    ctx.registry.add(baseSchema, extraMeta);
  }
  if (schema.description) {
    baseSchema = baseSchema.describe(schema.description);
  }
  return baseSchema;
}
function fromJSONSchema(schema, params) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(schema));
  } catch {
    throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas");
  }
  const version2 = detectVersion(normalized, params?.defaultTarget);
  const defs = normalized.$defs || normalized.definitions || {};
  const ctx = {
    version: version2,
    defs,
    refs: /* @__PURE__ */ new Map(),
    processing: /* @__PURE__ */ new Set(),
    rootSchema: normalized,
    registry: params?.registry ?? globalRegistry
  };
  return convertSchema(normalized, ctx);
}

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint3,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint3(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodDate, params);
}

// node_modules/zod/v4/classic/external.js
config(en_default());

// generated/provider-index.v1.json
var provider_index_v1_default = {
  schemaVersion: "1",
  snapshotFingerprint: "16755ec6c0c62bbba5e01e6cdda1de467bd87026d498ad7daa4bfca077b13ae7",
  documents: [
    {
      nativeId: "accordion",
      name: "Accordion",
      summary: "The accordion component lets users show and hide sections of related content on a page",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/accordion/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/accordion/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:accordion",
      search: {
        name: [
          "accordion"
        ],
        aliases: [],
        summary: [
          "the",
          "accordion",
          "component",
          "lets",
          "users",
          "show",
          "and",
          "hide",
          "sections",
          "of",
          "related",
          "content",
          "on",
          "a",
          "page"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "accordion"
        ]
      }
    },
    {
      nativeId: "addresses",
      name: "Addresses",
      summary: "Help users provide an address",
      kind: "pattern",
      aliases: [
        "postcode"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/addresses/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/addresses/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:addresses",
      search: {
        name: [
          "addresses"
        ],
        aliases: [
          "postcode"
        ],
        summary: [
          "help",
          "users",
          "provide",
          "an",
          "address"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "addresses"
        ]
      }
    },
    {
      nativeId: "back-link",
      name: "Back link",
      summary: "Use the back link component to help users go back to the previous page in a multi-page transaction",
      kind: "component",
      aliases: [
        "return link",
        "back button"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/back-link/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/back-link/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:back-link",
      search: {
        name: [
          "back",
          "link"
        ],
        aliases: [
          "return",
          "link",
          "back",
          "button"
        ],
        summary: [
          "use",
          "the",
          "back",
          "link",
          "component",
          "to",
          "help",
          "users",
          "go",
          "back",
          "to",
          "the",
          "previous",
          "page",
          "in",
          "a",
          "multi",
          "page",
          "transaction"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "back",
          "link"
        ]
      }
    },
    {
      nativeId: "bank-details",
      name: "Bank details",
      summary: "How to ask users for their bank details",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/bank-details/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/bank-details/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:bank-details",
      search: {
        name: [
          "bank",
          "details"
        ],
        aliases: [],
        summary: [
          "how",
          "to",
          "ask",
          "users",
          "for",
          "their",
          "bank",
          "details"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "bank",
          "details"
        ]
      }
    },
    {
      nativeId: "breadcrumbs",
      name: "Breadcrumbs",
      summary: "Help users orientate themselves and navigate pages within a hierarchical structure",
      kind: "component",
      aliases: [
        "navigation path",
        "cookie crumb"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/breadcrumbs/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/breadcrumbs/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:breadcrumbs",
      search: {
        name: [
          "breadcrumbs"
        ],
        aliases: [
          "navigation",
          "path",
          "cookie",
          "crumb"
        ],
        summary: [
          "help",
          "users",
          "orientate",
          "themselves",
          "and",
          "navigate",
          "pages",
          "within",
          "a",
          "hierarchical",
          "structure"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "breadcrumbs"
        ]
      }
    },
    {
      nativeId: "button",
      name: "Button",
      summary: "Use the button component to help users carry out an action",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/button/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/button/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:button",
      search: {
        name: [
          "button"
        ],
        aliases: [],
        summary: [
          "use",
          "the",
          "button",
          "component",
          "to",
          "help",
          "users",
          "carry",
          "out",
          "an",
          "action"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "button"
        ]
      }
    },
    {
      nativeId: "character-count",
      name: "Character count",
      summary: "Tell users how many characters or words they can enter into a textarea",
      kind: "component",
      aliases: [
        "word count"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/character-count/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/character-count/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:character-count",
      search: {
        name: [
          "character",
          "count"
        ],
        aliases: [
          "word",
          "count"
        ],
        summary: [
          "tell",
          "users",
          "how",
          "many",
          "characters",
          "or",
          "words",
          "they",
          "can",
          "enter",
          "into",
          "a",
          "textarea"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "character",
          "count"
        ]
      }
    },
    {
      nativeId: "check-a-service-is-suitable",
      name: "Check a service is suitable",
      summary: "Ask users questions to help them work out if they can or should use your service",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/check-a-service-is-suitable/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/check-a-service-is-suitable/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:check-a-service-is-suitable",
      search: {
        name: [
          "check",
          "a",
          "service",
          "is",
          "suitable"
        ],
        aliases: [],
        summary: [
          "ask",
          "users",
          "questions",
          "to",
          "help",
          "them",
          "work",
          "out",
          "if",
          "they",
          "can",
          "or",
          "should",
          "use",
          "your",
          "service"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "check",
          "a",
          "service",
          "is",
          "suitable"
        ]
      }
    },
    {
      nativeId: "check-answers",
      name: "Check answers",
      summary: "Let users check their answers before submitting information to a service",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/check-answers/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/check-answers/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:check-answers",
      search: {
        name: [
          "check",
          "answers"
        ],
        aliases: [],
        summary: [
          "let",
          "users",
          "check",
          "their",
          "answers",
          "before",
          "submitting",
          "information",
          "to",
          "a",
          "service"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "check",
          "answers"
        ]
      }
    },
    {
      nativeId: "checkboxes",
      name: "Checkboxes",
      summary: "Let users select one or more options by using the checkboxes component",
      kind: "component",
      aliases: [
        "check boxes",
        "tickboxes",
        "tick boxes"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/checkboxes/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/checkboxes/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:checkboxes",
      search: {
        name: [
          "checkboxes"
        ],
        aliases: [
          "check",
          "boxes",
          "tickboxes",
          "tick",
          "boxes"
        ],
        summary: [
          "let",
          "users",
          "select",
          "one",
          "or",
          "more",
          "options",
          "by",
          "using",
          "the",
          "checkboxes",
          "component"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "checkboxes"
        ]
      }
    },
    {
      nativeId: "complete-multiple-tasks",
      name: "Complete multiple tasks",
      summary: "Task lists help users understand tasks involved in completing a transaction, the order they should complete tasks in and when they have completed tasks",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/complete-multiple-tasks/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/complete-multiple-tasks/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:complete-multiple-tasks",
      search: {
        name: [
          "complete",
          "multiple",
          "tasks"
        ],
        aliases: [],
        summary: [
          "task",
          "lists",
          "help",
          "users",
          "understand",
          "tasks",
          "involved",
          "in",
          "completing",
          "a",
          "transaction",
          "the",
          "order",
          "they",
          "should",
          "complete",
          "tasks",
          "in",
          "and",
          "when",
          "they",
          "have",
          "completed",
          "tasks"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "complete",
          "multiple",
          "tasks"
        ]
      }
    },
    {
      nativeId: "confirm-a-phone-number",
      name: "Confirm a phone number",
      summary: "Identifying users when they sign in",
      kind: "pattern",
      aliases: [
        "2FA",
        "MFA",
        "multi-factor authentication",
        "security code",
        "telephone number",
        "phone number",
        "text message",
        "two-factor authentication"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/confirm-a-phone-number/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/confirm-a-phone-number/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:confirm-a-phone-number",
      search: {
        name: [
          "confirm",
          "a",
          "phone",
          "number"
        ],
        aliases: [
          "2fa",
          "mfa",
          "multi",
          "factor",
          "authentication",
          "security",
          "code",
          "telephone",
          "number",
          "phone",
          "number",
          "text",
          "message",
          "two",
          "factor",
          "authentication"
        ],
        summary: [
          "identifying",
          "users",
          "when",
          "they",
          "sign",
          "in"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "confirm",
          "a",
          "phone",
          "number"
        ]
      }
    },
    {
      nativeId: "confirm-an-email-address",
      name: "Confirm an email address",
      summary: "Use an email confirmation loop to check that a user has access to a specific email",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/confirm-an-email-address/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/confirm-an-email-address/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:confirm-an-email-address",
      search: {
        name: [
          "confirm",
          "an",
          "email",
          "address"
        ],
        aliases: [],
        summary: [
          "use",
          "an",
          "email",
          "confirmation",
          "loop",
          "to",
          "check",
          "that",
          "a",
          "user",
          "has",
          "access",
          "to",
          "a",
          "specific",
          "email"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "confirm",
          "an",
          "email",
          "address"
        ]
      }
    },
    {
      nativeId: "confirmation-pages",
      name: "Confirmation pages",
      summary: "Let users know they\u2019ve completed a transaction",
      kind: "pattern",
      aliases: [
        "completion pages",
        "receipts",
        "finish pages"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/confirmation-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/confirmation-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:confirmation-pages",
      search: {
        name: [
          "confirmation",
          "pages"
        ],
        aliases: [
          "completion",
          "pages",
          "receipts",
          "finish",
          "pages"
        ],
        summary: [
          "let",
          "users",
          "know",
          "they",
          "ve",
          "completed",
          "a",
          "transaction"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "confirmation",
          "pages"
        ]
      }
    },
    {
      nativeId: "contact-a-department-or-service-team",
      name: "Contact a department or service team",
      summary: "Contact a department or service team",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/contact-a-department-or-service-team/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:contact-a-department-or-service-team",
      search: {
        name: [
          "contact",
          "a",
          "department",
          "or",
          "service",
          "team"
        ],
        aliases: [],
        summary: [
          "contact",
          "a",
          "department",
          "or",
          "service",
          "team"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "contact",
          "a",
          "department",
          "or",
          "service",
          "team"
        ]
      }
    },
    {
      nativeId: "cookie-banner",
      name: "Cookie banner",
      summary: "Allow users to accept or reject cookies which are not essential to making your service work.",
      kind: "component",
      aliases: [
        "Cookies banner",
        "consent banner",
        "GDPR banner",
        "tracking banner",
        "analytics banner"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/cookie-banner/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/cookie-banner/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:cookie-banner",
      search: {
        name: [
          "cookie",
          "banner"
        ],
        aliases: [
          "cookies",
          "banner",
          "consent",
          "banner",
          "gdpr",
          "banner",
          "tracking",
          "banner",
          "analytics",
          "banner"
        ],
        summary: [
          "allow",
          "users",
          "to",
          "accept",
          "or",
          "reject",
          "cookies",
          "which",
          "are",
          "not",
          "essential",
          "to",
          "making",
          "your",
          "service",
          "work"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "cookie",
          "banner"
        ]
      }
    },
    {
      nativeId: "cookies-page",
      name: "Cookies page",
      summary: "Tell users about the cookies you\u2019re setting on their device and let them accept or reject different types of non-essential cookies.",
      kind: "pattern",
      aliases: [
        "Privacy settings",
        "Cookie settings",
        "tracking settings"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/cookies-page/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/cookies-page/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:cookies-page",
      search: {
        name: [
          "cookies",
          "page"
        ],
        aliases: [
          "privacy",
          "settings",
          "cookie",
          "settings",
          "tracking",
          "settings"
        ],
        summary: [
          "tell",
          "users",
          "about",
          "the",
          "cookies",
          "you",
          "re",
          "setting",
          "on",
          "their",
          "device",
          "and",
          "let",
          "them",
          "accept",
          "or",
          "reject",
          "different",
          "types",
          "of",
          "non",
          "essential",
          "cookies"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "cookies",
          "page"
        ]
      }
    },
    {
      nativeId: "create-a-username",
      name: "Create a username",
      summary: "Help users to create a unique and memorable username to sign into a service with",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/create-a-username/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/create-a-username/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:create-a-username",
      search: {
        name: [
          "create",
          "a",
          "username"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "to",
          "create",
          "a",
          "unique",
          "and",
          "memorable",
          "username",
          "to",
          "sign",
          "into",
          "a",
          "service",
          "with"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "create",
          "a",
          "username"
        ]
      }
    },
    {
      nativeId: "create-accounts",
      name: "Create accounts",
      summary: "Help users create an account for your service",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/create-accounts/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/create-accounts/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:create-accounts",
      search: {
        name: [
          "create",
          "accounts"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "create",
          "an",
          "account",
          "for",
          "your",
          "service"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "create",
          "accounts"
        ]
      }
    },
    {
      nativeId: "date-input",
      name: "Date input",
      summary: "Use the date input component to help users enter a memorable date",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/date-input/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/date-input/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:date-input",
      search: {
        name: [
          "date",
          "input"
        ],
        aliases: [],
        summary: [
          "use",
          "the",
          "date",
          "input",
          "component",
          "to",
          "help",
          "users",
          "enter",
          "a",
          "memorable",
          "date"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "date",
          "input"
        ]
      }
    },
    {
      nativeId: "dates",
      name: "Dates",
      summary: "Help users enter or select a date",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/dates/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/dates/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:dates",
      search: {
        name: [
          "dates"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "enter",
          "or",
          "select",
          "a",
          "date"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "dates"
        ]
      }
    },
    {
      nativeId: "details",
      name: "Details",
      summary: "Make a page easier to scan by letting users reveal more detailed information only if they need it",
      kind: "component",
      aliases: [
        "reveal",
        "progressive disclosure",
        "hidden text",
        "show and hide",
        "ShowyHideyThing"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/details/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/details/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:details",
      search: {
        name: [
          "details"
        ],
        aliases: [
          "reveal",
          "progressive",
          "disclosure",
          "hidden",
          "text",
          "show",
          "and",
          "hide",
          "showyhideything"
        ],
        summary: [
          "make",
          "a",
          "page",
          "easier",
          "to",
          "scan",
          "by",
          "letting",
          "users",
          "reveal",
          "more",
          "detailed",
          "information",
          "only",
          "if",
          "they",
          "need",
          "it"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "details"
        ]
      }
    },
    {
      nativeId: "email-addresses",
      name: "Email addresses",
      summary: "Help users enter a valid email address",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/email-addresses/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/email-addresses/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:email-addresses",
      search: {
        name: [
          "email",
          "addresses"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "enter",
          "a",
          "valid",
          "email",
          "address"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "email",
          "addresses"
        ]
      }
    },
    {
      nativeId: "equality-information",
      name: "Equality information",
      summary: "This pattern explains how to ask users for equality information",
      kind: "pattern",
      aliases: [
        "protected characteristics",
        "ethnic group",
        "diversity",
        "demographic",
        "age",
        "disability",
        "marriage",
        "civil partnership",
        "religion",
        "sex",
        "gender identity",
        "sexual orientation"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/equality-information/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/equality-information/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:equality-information",
      search: {
        name: [
          "equality",
          "information"
        ],
        aliases: [
          "protected",
          "characteristics",
          "ethnic",
          "group",
          "diversity",
          "demographic",
          "age",
          "disability",
          "marriage",
          "civil",
          "partnership",
          "religion",
          "sex",
          "gender",
          "identity",
          "sexual",
          "orientation"
        ],
        summary: [
          "this",
          "pattern",
          "explains",
          "how",
          "to",
          "ask",
          "users",
          "for",
          "equality",
          "information"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "equality",
          "information"
        ]
      }
    },
    {
      nativeId: "error-message",
      name: "Error message",
      summary: "When there's a validation error, use an error message to explain what went wrong and how to fix it",
      kind: "component",
      aliases: [
        "validation message"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/error-message/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/error-message/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:error-message",
      search: {
        name: [
          "error",
          "message"
        ],
        aliases: [
          "validation",
          "message"
        ],
        summary: [
          "when",
          "there",
          "s",
          "a",
          "validation",
          "error",
          "use",
          "an",
          "error",
          "message",
          "to",
          "explain",
          "what",
          "went",
          "wrong",
          "and",
          "how",
          "to",
          "fix",
          "it"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "error",
          "message"
        ]
      }
    },
    {
      nativeId: "error-summary",
      name: "Error summary",
      summary: "Use an error summary when there is a validation error",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/error-summary/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/error-summary/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:error-summary",
      search: {
        name: [
          "error",
          "summary"
        ],
        aliases: [],
        summary: [
          "use",
          "an",
          "error",
          "summary",
          "when",
          "there",
          "is",
          "a",
          "validation",
          "error"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "error",
          "summary"
        ]
      }
    },
    {
      nativeId: "ethnic-group",
      name: "Ethnic groups",
      summary: null,
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/ethnic-group/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/ethnic-group/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:ethnic-group",
      search: {
        name: [
          "ethnic",
          "groups"
        ],
        aliases: [],
        summary: [],
        kind: [
          "pattern"
        ],
        nativeId: [
          "ethnic",
          "group"
        ]
      }
    },
    {
      nativeId: "exit-a-page-quickly",
      name: "Exit a page quickly",
      summary: "Give users a way to quickly and safely exit a service, website or application.",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/exit-a-page-quickly/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/exit-a-page-quickly/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:exit-a-page-quickly",
      search: {
        name: [
          "exit",
          "a",
          "page",
          "quickly"
        ],
        aliases: [],
        summary: [
          "give",
          "users",
          "a",
          "way",
          "to",
          "quickly",
          "and",
          "safely",
          "exit",
          "a",
          "service",
          "website",
          "or",
          "application"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "exit",
          "a",
          "page",
          "quickly"
        ]
      }
    },
    {
      nativeId: "exit-this-page",
      name: "Exit this page",
      summary: "Give users a way to quickly and safely exit a service, website or application.",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/exit-this-page/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/exit-this-page/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:exit-this-page",
      search: {
        name: [
          "exit",
          "this",
          "page"
        ],
        aliases: [],
        summary: [
          "give",
          "users",
          "a",
          "way",
          "to",
          "quickly",
          "and",
          "safely",
          "exit",
          "a",
          "service",
          "website",
          "or",
          "application"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "exit",
          "this",
          "page"
        ]
      }
    },
    {
      nativeId: "fieldset",
      name: "Fieldset",
      summary: "Use the fieldset component to group related form inputs",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/fieldset/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/fieldset/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:fieldset",
      search: {
        name: [
          "fieldset"
        ],
        aliases: [],
        summary: [
          "use",
          "the",
          "fieldset",
          "component",
          "to",
          "group",
          "related",
          "form",
          "inputs"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "fieldset"
        ]
      }
    },
    {
      nativeId: "file-upload",
      name: "File upload",
      summary: "Help users select and upload a file",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/file-upload/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/file-upload/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:file-upload",
      search: {
        name: [
          "file",
          "upload"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "select",
          "and",
          "upload",
          "a",
          "file"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "file",
          "upload"
        ]
      }
    },
    {
      nativeId: "footer",
      name: "GOV.UK footer",
      summary: "The footer provides copyright, licensing and other information about your service and department",
      kind: "component",
      aliases: [
        "privacy notice",
        "accessibility statement",
        "terms and conditions"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/footer/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/footer/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:footer",
      search: {
        name: [
          "gov",
          "uk",
          "footer"
        ],
        aliases: [
          "privacy",
          "notice",
          "accessibility",
          "statement",
          "terms",
          "and",
          "conditions"
        ],
        summary: [
          "the",
          "footer",
          "provides",
          "copyright",
          "licensing",
          "and",
          "other",
          "information",
          "about",
          "your",
          "service",
          "and",
          "department"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "footer"
        ]
      }
    },
    {
      nativeId: "gender-or-sex",
      name: "Gender or sex",
      summary: null,
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/gender-or-sex/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/gender-or-sex/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:gender-or-sex",
      search: {
        name: [
          "gender",
          "or",
          "sex"
        ],
        aliases: [],
        summary: [],
        kind: [
          "pattern"
        ],
        nativeId: [
          "gender",
          "or",
          "sex"
        ]
      }
    },
    {
      nativeId: "generic-header",
      name: "Generic header",
      summary: "A generic header to help services not on GOV.UK",
      kind: "component",
      aliases: [
        "Header (generic)"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/generic-header/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/generic-header/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:generic-header",
      search: {
        name: [
          "generic",
          "header"
        ],
        aliases: [
          "header",
          "generic"
        ],
        summary: [
          "a",
          "generic",
          "header",
          "to",
          "help",
          "services",
          "not",
          "on",
          "gov",
          "uk"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "generic",
          "header"
        ]
      }
    },
    {
      nativeId: "header",
      name: "GOV.UK header",
      summary: "The GOV.UK header shows users that they are on GOV.UK",
      kind: "component",
      aliases: [
        "GOV.UK masthead"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/header/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/header/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:header",
      search: {
        name: [
          "gov",
          "uk",
          "header"
        ],
        aliases: [
          "gov",
          "uk",
          "masthead"
        ],
        summary: [
          "the",
          "gov",
          "uk",
          "header",
          "shows",
          "users",
          "that",
          "they",
          "are",
          "on",
          "gov",
          "uk"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "header"
        ]
      }
    },
    {
      nativeId: "inset-text",
      name: "Inset text",
      summary: "Use the inset text component to differentiate a block of text from the content that surrounds it",
      kind: "component",
      aliases: [
        "highlighted text",
        "callout"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/inset-text/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/inset-text/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:inset-text",
      search: {
        name: [
          "inset",
          "text"
        ],
        aliases: [
          "highlighted",
          "text",
          "callout"
        ],
        summary: [
          "use",
          "the",
          "inset",
          "text",
          "component",
          "to",
          "differentiate",
          "a",
          "block",
          "of",
          "text",
          "from",
          "the",
          "content",
          "that",
          "surrounds",
          "it"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "inset",
          "text"
        ]
      }
    },
    {
      nativeId: "interruption-pages",
      name: "Interruption pages",
      summary: "Pause the user journey to give them important information",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/interruption-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/interruption-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:interruption-pages",
      search: {
        name: [
          "interruption",
          "pages"
        ],
        aliases: [],
        summary: [
          "pause",
          "the",
          "user",
          "journey",
          "to",
          "give",
          "them",
          "important",
          "information"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "interruption",
          "pages"
        ]
      }
    },
    {
      nativeId: "names",
      name: "Names",
      summary: "Help users correctly enter their name",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/names/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/names/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:names",
      search: {
        name: [
          "names"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "correctly",
          "enter",
          "their",
          "name"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "names"
        ]
      }
    },
    {
      nativeId: "national-insurance-numbers",
      name: "National Insurance numbers",
      summary: "Ask users to provide their National Insurance number",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/national-insurance-numbers/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/national-insurance-numbers/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:national-insurance-numbers",
      search: {
        name: [
          "national",
          "insurance",
          "numbers"
        ],
        aliases: [],
        summary: [
          "ask",
          "users",
          "to",
          "provide",
          "their",
          "national",
          "insurance",
          "number"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "national",
          "insurance",
          "numbers"
        ]
      }
    },
    {
      nativeId: "navigate-a-service",
      name: "Navigate a service",
      summary: "Help users know they\u2019re using your service and navigate around it",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/navigate-a-service/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/navigate-a-service/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:navigate-a-service",
      search: {
        name: [
          "navigate",
          "a",
          "service"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "know",
          "they",
          "re",
          "using",
          "your",
          "service",
          "and",
          "navigate",
          "around",
          "it"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "navigate",
          "a",
          "service"
        ]
      }
    },
    {
      nativeId: "notification-banner",
      name: "Notification banner",
      summary: "Use a notification banner to tell the user about something they need to know about, but that\u2019s not directly related to the page content",
      kind: "component",
      aliases: [
        "alert",
        "warning",
        "success message",
        "important message",
        "flash message"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/notification-banner/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/notification-banner/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:notification-banner",
      search: {
        name: [
          "notification",
          "banner"
        ],
        aliases: [
          "alert",
          "warning",
          "success",
          "message",
          "important",
          "message",
          "flash",
          "message"
        ],
        summary: [
          "use",
          "a",
          "notification",
          "banner",
          "to",
          "tell",
          "the",
          "user",
          "about",
          "something",
          "they",
          "need",
          "to",
          "know",
          "about",
          "but",
          "that",
          "s",
          "not",
          "directly",
          "related",
          "to",
          "the",
          "page",
          "content"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "notification",
          "banner"
        ]
      }
    },
    {
      nativeId: "page-not-found-pages",
      name: "Page not found pages",
      summary: "A page not found tells someone we cannot find the page they were trying to view. They are also known as 404 pages.",
      kind: "pattern",
      aliases: [
        '"404"'
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/page-not-found-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/page-not-found-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:page-not-found-pages",
      search: {
        name: [
          "page",
          "not",
          "found",
          "pages"
        ],
        aliases: [
          "404"
        ],
        summary: [
          "a",
          "page",
          "not",
          "found",
          "tells",
          "someone",
          "we",
          "cannot",
          "find",
          "the",
          "page",
          "they",
          "were",
          "trying",
          "to",
          "view",
          "they",
          "are",
          "also",
          "known",
          "as",
          "404",
          "pages"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "page",
          "not",
          "found",
          "pages"
        ]
      }
    },
    {
      nativeId: "pagination",
      name: "Pagination",
      summary: "Help users navigate collections of numbered pages like search results",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/pagination/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/pagination/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:pagination",
      search: {
        name: [
          "pagination"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "navigate",
          "collections",
          "of",
          "numbered",
          "pages",
          "like",
          "search",
          "results"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "pagination"
        ]
      }
    },
    {
      nativeId: "panel",
      name: "Panel",
      summary: "Use the Panel component to display important information in within confirmation and interruption pages",
      kind: "component",
      aliases: [
        "confirmation box",
        "results box",
        "reference number",
        "application complete",
        "application number"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/panel/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/panel/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:panel",
      search: {
        name: [
          "panel"
        ],
        aliases: [
          "confirmation",
          "box",
          "results",
          "box",
          "reference",
          "number",
          "application",
          "complete",
          "application",
          "number"
        ],
        summary: [
          "use",
          "the",
          "panel",
          "component",
          "to",
          "display",
          "important",
          "information",
          "in",
          "within",
          "confirmation",
          "and",
          "interruption",
          "pages"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "panel"
        ]
      }
    },
    {
      nativeId: "password-input",
      name: "Password input",
      summary: "Help users accessibly enter passwords",
      kind: "component",
      aliases: [
        "pass word",
        "pass phrase"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/password-input/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/password-input/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:password-input",
      search: {
        name: [
          "password",
          "input"
        ],
        aliases: [
          "pass",
          "word",
          "pass",
          "phrase"
        ],
        summary: [
          "help",
          "users",
          "accessibly",
          "enter",
          "passwords"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "password",
          "input"
        ]
      }
    },
    {
      nativeId: "passwords",
      name: "Passwords",
      summary: "Help users to create and enter secure and memorable passwords",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/passwords/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/passwords/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:passwords",
      search: {
        name: [
          "passwords"
        ],
        aliases: [],
        summary: [
          "help",
          "users",
          "to",
          "create",
          "and",
          "enter",
          "secure",
          "and",
          "memorable",
          "passwords"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "passwords"
        ]
      }
    },
    {
      nativeId: "payment-card-details",
      name: "Payment card details",
      summary: "How to ask users for their payment card details",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/payment-card-details/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/payment-card-details/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:payment-card-details",
      search: {
        name: [
          "payment",
          "card",
          "details"
        ],
        aliases: [],
        summary: [
          "how",
          "to",
          "ask",
          "users",
          "for",
          "their",
          "payment",
          "card",
          "details"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "payment",
          "card",
          "details"
        ]
      }
    },
    {
      nativeId: "phase-banner",
      name: "Phase banner",
      summary: "Use the phase banner component to show users your service is still being worked on",
      kind: "component",
      aliases: [
        "alpha banner",
        "beta banner",
        "prototype banner",
        "status banner",
        "feedback banner"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/phase-banner/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/phase-banner/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:phase-banner",
      search: {
        name: [
          "phase",
          "banner"
        ],
        aliases: [
          "alpha",
          "banner",
          "beta",
          "banner",
          "prototype",
          "banner",
          "status",
          "banner",
          "feedback",
          "banner"
        ],
        summary: [
          "use",
          "the",
          "phase",
          "banner",
          "component",
          "to",
          "show",
          "users",
          "your",
          "service",
          "is",
          "still",
          "being",
          "worked",
          "on"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "phase",
          "banner"
        ]
      }
    },
    {
      nativeId: "phone-numbers",
      name: "Phone numbers",
      summary: "Help users enter a valid phone number",
      kind: "pattern",
      aliases: [
        "phone numbers",
        "telephone"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/phone-numbers/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/phone-numbers/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:phone-numbers",
      search: {
        name: [
          "phone",
          "numbers"
        ],
        aliases: [
          "phone",
          "numbers",
          "telephone"
        ],
        summary: [
          "help",
          "users",
          "enter",
          "a",
          "valid",
          "phone",
          "number"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "phone",
          "numbers"
        ]
      }
    },
    {
      nativeId: "problem-with-the-service-pages",
      name: "There is a problem with the service pages",
      summary: "This is a page that tells someone there is something wrong with the service. They are also known as 500 pages",
      kind: "pattern",
      aliases: [
        '"500"'
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/problem-with-the-service-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:problem-with-the-service-pages",
      search: {
        name: [
          "there",
          "is",
          "a",
          "problem",
          "with",
          "the",
          "service",
          "pages"
        ],
        aliases: [
          "500"
        ],
        summary: [
          "this",
          "is",
          "a",
          "page",
          "that",
          "tells",
          "someone",
          "there",
          "is",
          "something",
          "wrong",
          "with",
          "the",
          "service",
          "they",
          "are",
          "also",
          "known",
          "as",
          "500",
          "pages"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "problem",
          "with",
          "the",
          "service",
          "pages"
        ]
      }
    },
    {
      nativeId: "question-pages",
      name: "Question pages",
      summary: "Follow this pattern whenever you need to ask users questions within your service",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/question-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/question-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:question-pages",
      search: {
        name: [
          "question",
          "pages"
        ],
        aliases: [],
        summary: [
          "follow",
          "this",
          "pattern",
          "whenever",
          "you",
          "need",
          "to",
          "ask",
          "users",
          "questions",
          "within",
          "your",
          "service"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "question",
          "pages"
        ]
      }
    },
    {
      nativeId: "radios",
      name: "Radios",
      summary: "Let users select a single option from a list using the radios component",
      kind: "component",
      aliases: [
        "radio buttons",
        "option buttons"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/radios/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/radios/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:radios",
      search: {
        name: [
          "radios"
        ],
        aliases: [
          "radio",
          "buttons",
          "option",
          "buttons"
        ],
        summary: [
          "let",
          "users",
          "select",
          "a",
          "single",
          "option",
          "from",
          "a",
          "list",
          "using",
          "the",
          "radios",
          "component"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "radios"
        ]
      }
    },
    {
      nativeId: "select",
      name: "Select",
      summary: "Help users select an item from a list",
      kind: "component",
      aliases: [
        "dropdown",
        "list box",
        "combo box",
        "pop-up menu"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/select/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/select/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:select",
      search: {
        name: [
          "select"
        ],
        aliases: [
          "dropdown",
          "list",
          "box",
          "combo",
          "box",
          "pop",
          "up",
          "menu"
        ],
        summary: [
          "help",
          "users",
          "select",
          "an",
          "item",
          "from",
          "a",
          "list"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "select"
        ]
      }
    },
    {
      nativeId: "service-navigation",
      name: "Service navigation",
      summary: "Service navigation helps users understand that they\u2019re using your service and lets them navigate around your service",
      kind: "component",
      aliases: [
        "Primary navigation"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/service-navigation/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/service-navigation/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:service-navigation",
      search: {
        name: [
          "service",
          "navigation"
        ],
        aliases: [
          "primary",
          "navigation"
        ],
        summary: [
          "service",
          "navigation",
          "helps",
          "users",
          "understand",
          "that",
          "they",
          "re",
          "using",
          "your",
          "service",
          "and",
          "lets",
          "them",
          "navigate",
          "around",
          "your",
          "service"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "service",
          "navigation"
        ]
      }
    },
    {
      nativeId: "service-unavailable-pages",
      name: "Service unavailable pages",
      summary: "This is a page that tells someone a service is unavailable. It should say when the service will be available or what to do if it is permanently closed",
      kind: "pattern",
      aliases: [
        '"503"'
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/service-unavailable-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/service-unavailable-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:service-unavailable-pages",
      search: {
        name: [
          "service",
          "unavailable",
          "pages"
        ],
        aliases: [
          "503"
        ],
        summary: [
          "this",
          "is",
          "a",
          "page",
          "that",
          "tells",
          "someone",
          "a",
          "service",
          "is",
          "unavailable",
          "it",
          "should",
          "say",
          "when",
          "the",
          "service",
          "will",
          "be",
          "available",
          "or",
          "what",
          "to",
          "do",
          "if",
          "it",
          "is",
          "permanently",
          "closed"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "service",
          "unavailable",
          "pages"
        ]
      }
    },
    {
      nativeId: "skip-link",
      name: "Skip link",
      summary: "Use the skip link component to help keyboard-only users skip to the main content on a page",
      kind: "component",
      aliases: [
        "Skip navigation link"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/skip-link/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/skip-link/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:skip-link",
      search: {
        name: [
          "skip",
          "link"
        ],
        aliases: [
          "skip",
          "navigation",
          "link"
        ],
        summary: [
          "use",
          "the",
          "skip",
          "link",
          "component",
          "to",
          "help",
          "keyboard",
          "only",
          "users",
          "skip",
          "to",
          "the",
          "main",
          "content",
          "on",
          "a",
          "page"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "skip",
          "link"
        ]
      }
    },
    {
      nativeId: "start-pages",
      name: "Start pages",
      summary: null,
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/start-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/start-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:start-pages",
      search: {
        name: [
          "start",
          "pages"
        ],
        aliases: [],
        summary: [],
        kind: [
          "pattern"
        ],
        nativeId: [
          "start",
          "pages"
        ]
      }
    },
    {
      nativeId: "start-using-a-service",
      name: "Start using a service",
      summary: "Create a starting point for your digital service on GOV.UK",
      kind: "pattern",
      aliases: [
        "start page",
        "start pages"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/start-using-a-service/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/start-using-a-service/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:start-using-a-service",
      search: {
        name: [
          "start",
          "using",
          "a",
          "service"
        ],
        aliases: [
          "start",
          "page",
          "start",
          "pages"
        ],
        summary: [
          "create",
          "a",
          "starting",
          "point",
          "for",
          "your",
          "digital",
          "service",
          "on",
          "gov",
          "uk"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "start",
          "using",
          "a",
          "service"
        ]
      }
    },
    {
      nativeId: "step-by-step-navigation",
      name: "Step by step navigation",
      summary: "A starting point for your digital service on GOV.UK",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/step-by-step-navigation/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/step-by-step-navigation/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:step-by-step-navigation",
      search: {
        name: [
          "step",
          "by",
          "step",
          "navigation"
        ],
        aliases: [],
        summary: [
          "a",
          "starting",
          "point",
          "for",
          "your",
          "digital",
          "service",
          "on",
          "gov",
          "uk"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "step",
          "by",
          "step",
          "navigation"
        ]
      }
    },
    {
      nativeId: "summary-list",
      name: "Summary list",
      summary: "Use the summary list to summarise information, for example, a user\u2019s responses at the end of a form.",
      kind: "component",
      aliases: [
        "Summary card"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/summary-list/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/summary-list/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:summary-list",
      search: {
        name: [
          "summary",
          "list"
        ],
        aliases: [
          "summary",
          "card"
        ],
        summary: [
          "use",
          "the",
          "summary",
          "list",
          "to",
          "summarise",
          "information",
          "for",
          "example",
          "a",
          "user",
          "s",
          "responses",
          "at",
          "the",
          "end",
          "of",
          "a",
          "form"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "summary",
          "list"
        ]
      }
    },
    {
      nativeId: "table",
      name: "Table",
      summary: "Use the table component to make information easier to compare and scan for users",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/table/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/table/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:table",
      search: {
        name: [
          "table"
        ],
        aliases: [],
        summary: [
          "use",
          "the",
          "table",
          "component",
          "to",
          "make",
          "information",
          "easier",
          "to",
          "compare",
          "and",
          "scan",
          "for",
          "users"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "table"
        ]
      }
    },
    {
      nativeId: "tabs",
      name: "Tabs",
      summary: "Tabs can be a helpful way of letting users quickly switch between related information",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/tabs/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/tabs/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:tabs",
      search: {
        name: [
          "tabs"
        ],
        aliases: [],
        summary: [
          "tabs",
          "can",
          "be",
          "a",
          "helpful",
          "way",
          "of",
          "letting",
          "users",
          "quickly",
          "switch",
          "between",
          "related",
          "information"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "tabs"
        ]
      }
    },
    {
      nativeId: "tag",
      name: "Tag",
      summary: "The Tag component indicates the status of something, such as an item on a task list or a phase banner",
      kind: "component",
      aliases: [
        "chip",
        "badge",
        "flag",
        "token"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/tag/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/tag/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:tag",
      search: {
        name: [
          "tag"
        ],
        aliases: [
          "chip",
          "badge",
          "flag",
          "token"
        ],
        summary: [
          "the",
          "tag",
          "component",
          "indicates",
          "the",
          "status",
          "of",
          "something",
          "such",
          "as",
          "an",
          "item",
          "on",
          "a",
          "task",
          "list",
          "or",
          "a",
          "phase",
          "banner"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "tag"
        ]
      }
    },
    {
      nativeId: "task-list",
      name: "Task list",
      summary: "The task list component displays all the tasks a user needs to do, and allows users to easily identify which ones are done and which they still need to do.",
      kind: "component",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/components/task-list/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/task-list/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:task-list",
      search: {
        name: [
          "task",
          "list"
        ],
        aliases: [],
        summary: [
          "the",
          "task",
          "list",
          "component",
          "displays",
          "all",
          "the",
          "tasks",
          "a",
          "user",
          "needs",
          "to",
          "do",
          "and",
          "allows",
          "users",
          "to",
          "easily",
          "identify",
          "which",
          "ones",
          "are",
          "done",
          "and",
          "which",
          "they",
          "still",
          "need",
          "to",
          "do"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "task",
          "list"
        ]
      }
    },
    {
      nativeId: "task-list-pages",
      name: "Task list pages",
      summary: null,
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/task-list-pages/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/task-list-pages/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:task-list-pages",
      search: {
        name: [
          "task",
          "list",
          "pages"
        ],
        aliases: [],
        summary: [],
        kind: [
          "pattern"
        ],
        nativeId: [
          "task",
          "list",
          "pages"
        ]
      }
    },
    {
      nativeId: "text-input",
      name: "Text input",
      summary: "Help users enter information with the text input component",
      kind: "component",
      aliases: [
        "text box",
        "text field",
        "input field",
        "text entry box"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/text-input/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/text-input/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:text-input",
      search: {
        name: [
          "text",
          "input"
        ],
        aliases: [
          "text",
          "box",
          "text",
          "field",
          "input",
          "field",
          "text",
          "entry",
          "box"
        ],
        summary: [
          "help",
          "users",
          "enter",
          "information",
          "with",
          "the",
          "text",
          "input",
          "component"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "text",
          "input"
        ]
      }
    },
    {
      nativeId: "textarea",
      name: "Textarea",
      summary: "Help users provide detailed information using the textarea component",
      kind: "component",
      aliases: [
        "multi-line text box",
        "multi-line text field"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/textarea/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/textarea/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:textarea",
      search: {
        name: [
          "textarea"
        ],
        aliases: [
          "multi",
          "line",
          "text",
          "box",
          "multi",
          "line",
          "text",
          "field"
        ],
        summary: [
          "help",
          "users",
          "provide",
          "detailed",
          "information",
          "using",
          "the",
          "textarea",
          "component"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "textarea"
        ]
      }
    },
    {
      nativeId: "understand-the-impact-of-an-emergency",
      name: "Understand the impact of an emergency on your service",
      summary: null,
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/understand-the-impact-of-an-emergency/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/understand-the-impact-of-an-emergency/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:understand-the-impact-of-an-emergency",
      search: {
        name: [
          "understand",
          "the",
          "impact",
          "of",
          "an",
          "emergency",
          "on",
          "your",
          "service"
        ],
        aliases: [],
        summary: [],
        kind: [
          "pattern"
        ],
        nativeId: [
          "understand",
          "the",
          "impact",
          "of",
          "an",
          "emergency"
        ]
      }
    },
    {
      nativeId: "validation",
      name: "Recover from validation errors",
      summary: "Check the answers users give to make sure they\u2019re valid - and if there\u2019s an error, tell them what's wrong and how to fix it",
      kind: "pattern",
      aliases: [],
      canonicalUrl: "https://design-system.service.gov.uk/patterns/validation/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/patterns/validation/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:validation",
      search: {
        name: [
          "recover",
          "from",
          "validation",
          "errors"
        ],
        aliases: [],
        summary: [
          "check",
          "the",
          "answers",
          "users",
          "give",
          "to",
          "make",
          "sure",
          "they",
          "re",
          "valid",
          "and",
          "if",
          "there",
          "s",
          "an",
          "error",
          "tell",
          "them",
          "what",
          "s",
          "wrong",
          "and",
          "how",
          "to",
          "fix",
          "it"
        ],
        kind: [
          "pattern"
        ],
        nativeId: [
          "validation"
        ]
      }
    },
    {
      nativeId: "warning-text",
      name: "Warning text",
      summary: "Use the warning text component when you need to warn users about something important, such as legal consequences of an action, or lack of action, that they might take",
      kind: "component",
      aliases: [
        "important text",
        "legal text"
      ],
      canonicalUrl: "https://design-system.service.gov.uk/components/warning-text/",
      provenance: {
        providerId: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        sourcePath: "src/components/warning-text/index.md"
      },
      providerName: "GOV.UK Design System",
      key: "govuk-design-system:warning-text",
      search: {
        name: [
          "warning",
          "text"
        ],
        aliases: [
          "important",
          "text",
          "legal",
          "text"
        ],
        summary: [
          "use",
          "the",
          "warning",
          "text",
          "component",
          "when",
          "you",
          "need",
          "to",
          "warn",
          "users",
          "about",
          "something",
          "important",
          "such",
          "as",
          "legal",
          "consequences",
          "of",
          "an",
          "action",
          "or",
          "lack",
          "of",
          "action",
          "that",
          "they",
          "might",
          "take"
        ],
        kind: [
          "component"
        ],
        nativeId: [
          "warning",
          "text"
        ]
      }
    },
    {
      nativeId: "usa-accordion",
      name: "Accordion",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-accordion/src/usa-accordion.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-accordion/src/usa-accordion.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-accordion",
      search: {
        name: [
          "accordion"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "accordion"
        ]
      }
    },
    {
      nativeId: "usa-add-aspect",
      name: "Add Aspect",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-add-aspect/src/usa-add-aspect.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-add-aspect/src/usa-add-aspect.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-add-aspect",
      search: {
        name: [
          "add",
          "aspect"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "add",
          "aspect"
        ]
      }
    },
    {
      nativeId: "usa-alert",
      name: "Alert",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-alert/src/usa-alert.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-alert/src/usa-alert.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-alert",
      search: {
        name: [
          "alert"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "alert"
        ]
      }
    },
    {
      nativeId: "usa-banner",
      name: "Banner",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-banner/src/usa-banner.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-banner/src/usa-banner.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-banner",
      search: {
        name: [
          "banner"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "banner"
        ]
      }
    },
    {
      nativeId: "usa-breadcrumb",
      name: "Breadcrumb",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-breadcrumb/src/usa-breadcrumb.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-breadcrumb/src/usa-breadcrumb.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-breadcrumb",
      search: {
        name: [
          "breadcrumb"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "breadcrumb"
        ]
      }
    },
    {
      nativeId: "usa-button",
      name: "Button",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-button/src/usa-button.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-button/src/usa-button.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-button",
      search: {
        name: [
          "button"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "button"
        ]
      }
    },
    {
      nativeId: "usa-button-group",
      name: "Button Group",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-button-group/src/usa-button-group.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-button-group/src/usa-button-group.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-button-group",
      search: {
        name: [
          "button",
          "group"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "button",
          "group"
        ]
      }
    },
    {
      nativeId: "usa-card",
      name: "Card",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-card/src/usa-card.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-card/src/usa-card.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-card",
      search: {
        name: [
          "card"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "card"
        ]
      }
    },
    {
      nativeId: "usa-character-count",
      name: "Character Count",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-character-count/src/usa-character-count.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-character-count/src/usa-character-count.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-character-count",
      search: {
        name: [
          "character",
          "count"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "character",
          "count"
        ]
      }
    },
    {
      nativeId: "usa-checkbox",
      name: "Checkbox",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-checkbox/src/usa-checkbox.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-checkbox/src/usa-checkbox.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-checkbox",
      search: {
        name: [
          "checkbox"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "checkbox"
        ]
      }
    },
    {
      nativeId: "usa-checklist",
      name: "Checklist",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-checklist/src/usa-checklist.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-checklist/src/usa-checklist.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-checklist",
      search: {
        name: [
          "checklist"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "checklist"
        ]
      }
    },
    {
      nativeId: "usa-collection",
      name: "Collection",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-collection/src/usa-collection.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-collection/src/usa-collection.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-collection",
      search: {
        name: [
          "collection"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "collection"
        ]
      }
    },
    {
      nativeId: "usa-combo-box",
      name: "Combo Box",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-combo-box/src/usa-combo-box.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-combo-box/src/usa-combo-box.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-combo-box",
      search: {
        name: [
          "combo",
          "box"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "combo",
          "box"
        ]
      }
    },
    {
      nativeId: "usa-date-picker",
      name: "Date Picker",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-date-picker/src/usa-date-picker.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-date-picker/src/usa-date-picker.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-date-picker",
      search: {
        name: [
          "date",
          "picker"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "date",
          "picker"
        ]
      }
    },
    {
      nativeId: "usa-date-range-picker",
      name: "Date Range Picker",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-date-range-picker/src/date-range-picker.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-date-range-picker/src/date-range-picker.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-date-range-picker",
      search: {
        name: [
          "date",
          "range",
          "picker"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "date",
          "range",
          "picker"
        ]
      }
    },
    {
      nativeId: "usa-embed-container",
      name: "Embed Container",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-embed-container/src/usa-embed-container.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-embed-container/src/usa-embed-container.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-embed-container",
      search: {
        name: [
          "embed",
          "container"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "embed",
          "container"
        ]
      }
    },
    {
      nativeId: "usa-file-input",
      name: "File Input",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-file-input/src/usa-file-input.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-file-input/src/usa-file-input.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-file-input",
      search: {
        name: [
          "file",
          "input"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "file",
          "input"
        ]
      }
    },
    {
      nativeId: "usa-fonts",
      name: "Fonts",
      summary: null,
      kind: "design tokens",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-fonts/src/usa-fonts.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-fonts/src/usa-fonts.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-fonts",
      search: {
        name: [
          "fonts"
        ],
        aliases: [],
        summary: [],
        kind: [
          "design",
          "tokens"
        ],
        nativeId: [
          "usa",
          "fonts"
        ]
      }
    },
    {
      nativeId: "usa-footer",
      name: "Footer",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-footer/src/usa-footer.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-footer/src/usa-footer.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-footer",
      search: {
        name: [
          "footer"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "footer"
        ]
      }
    },
    {
      nativeId: "usa-form",
      name: "Forms",
      summary: null,
      kind: "patterns",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-form/src/usa-form.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-form/src/usa-form.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-form",
      search: {
        name: [
          "forms"
        ],
        aliases: [],
        summary: [],
        kind: [
          "patterns"
        ],
        nativeId: [
          "usa",
          "form"
        ]
      }
    },
    {
      nativeId: "usa-graphic-list",
      name: "Graphic List",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-graphic-list/src/usa-graphic-list.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-graphic-list/src/usa-graphic-list.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-graphic-list",
      search: {
        name: [
          "graphic",
          "list"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "graphic",
          "list"
        ]
      }
    },
    {
      nativeId: "usa-header",
      name: "Header",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-header/src/usa-header.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-header/src/usa-header.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-header",
      search: {
        name: [
          "header"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "header"
        ]
      }
    },
    {
      nativeId: "usa-hero",
      name: "Hero",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-hero/src/usa-hero.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-hero/src/usa-hero.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-hero",
      search: {
        name: [
          "hero"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "hero"
        ]
      }
    },
    {
      nativeId: "usa-icon",
      name: "Icons",
      summary: null,
      kind: "design tokens",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-icon/src/usa-icon.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-icon/src/usa-icon.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-icon",
      search: {
        name: [
          "icons"
        ],
        aliases: [],
        summary: [],
        kind: [
          "design",
          "tokens"
        ],
        nativeId: [
          "usa",
          "icon"
        ]
      }
    },
    {
      nativeId: "usa-icon-list",
      name: "Icon List",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-icon-list/src/usa-icon-list.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-icon-list/src/usa-icon-list.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-icon-list",
      search: {
        name: [
          "icon",
          "list"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "icon",
          "list"
        ]
      }
    },
    {
      nativeId: "usa-identifier",
      name: "Identifier",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-identifier/src/usa-identifier.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-identifier/src/usa-identifier.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-identifier",
      search: {
        name: [
          "identifier"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "identifier"
        ]
      }
    },
    {
      nativeId: "usa-in-page-navigation",
      name: "In-Page Navigation",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-in-page-navigation/src/usa-in-page-navigation.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-in-page-navigation/src/usa-in-page-navigation.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-in-page-navigation",
      search: {
        name: [
          "in",
          "page",
          "navigation"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "in",
          "page",
          "navigation"
        ]
      }
    },
    {
      nativeId: "usa-input",
      name: "Text Input",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input/src/usa-input.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-input/src/usa-input.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-input",
      search: {
        name: [
          "text",
          "input"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "input"
        ]
      }
    },
    {
      nativeId: "usa-input-mask",
      name: "Text Input Mask",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input-mask/src/usa-input-mask.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-input-mask/src/usa-input-mask.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-input-mask",
      search: {
        name: [
          "text",
          "input",
          "mask"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "input",
          "mask"
        ]
      }
    },
    {
      nativeId: "usa-input-prefix-suffix",
      name: "Input Prefix or Suffix",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input-prefix-suffix/src/usa-input-prefix-suffix.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-input-prefix-suffix/src/usa-input-prefix-suffix.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-input-prefix-suffix",
      search: {
        name: [
          "input",
          "prefix",
          "or",
          "suffix"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "input",
          "prefix",
          "suffix"
        ]
      }
    },
    {
      nativeId: "usa-language-selector",
      name: "Language Selector",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-language-selector/src/usa-language-selector.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-language-selector/src/usa-language-selector.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-language-selector",
      search: {
        name: [
          "language",
          "selector"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "language",
          "selector"
        ]
      }
    },
    {
      nativeId: "usa-link",
      name: "Link",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-link/src/usa-link.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-link/src/usa-link.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-link",
      search: {
        name: [
          "link"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "link"
        ]
      }
    },
    {
      nativeId: "usa-list",
      name: "List",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-list/src/usa-list.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-list/src/usa-list.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-list",
      search: {
        name: [
          "list"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "list"
        ]
      }
    },
    {
      nativeId: "usa-media-block",
      name: "Media Block",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-media-block/src/usa-media-block.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-media-block/src/usa-media-block.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-media-block",
      search: {
        name: [
          "media",
          "block"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "media",
          "block"
        ]
      }
    },
    {
      nativeId: "usa-memorable-date",
      name: "Memorable Date",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-memorable-date/src/usa-memorable-date.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-memorable-date/src/usa-memorable-date.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-memorable-date",
      search: {
        name: [
          "memorable",
          "date"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "memorable",
          "date"
        ]
      }
    },
    {
      nativeId: "usa-modal",
      name: "Modal",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-modal/src/usa-modal.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-modal/src/usa-modal.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-modal",
      search: {
        name: [
          "modal"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "modal"
        ]
      }
    },
    {
      nativeId: "usa-pagination",
      name: "Pagination",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-pagination/src/usa-pagination.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-pagination/src/usa-pagination.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-pagination",
      search: {
        name: [
          "pagination"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "pagination"
        ]
      }
    },
    {
      nativeId: "usa-process-list",
      name: "Process List",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-process-list/src/usa-process-list.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-process-list/src/usa-process-list.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-process-list",
      search: {
        name: [
          "process",
          "list"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "process",
          "list"
        ]
      }
    },
    {
      nativeId: "usa-prose",
      name: "Prose",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-prose/src/usa-prose.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-prose/src/usa-prose.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-prose",
      search: {
        name: [
          "prose"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "prose"
        ]
      }
    },
    {
      nativeId: "usa-radio",
      name: "Radio",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-radio/src/usa-radio.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-radio/src/usa-radio.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-radio",
      search: {
        name: [
          "radio"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "radio"
        ]
      }
    },
    {
      nativeId: "usa-range",
      name: "Range",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-range/src/usa-range.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-range/src/usa-range.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-range",
      search: {
        name: [
          "range"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "range"
        ]
      }
    },
    {
      nativeId: "usa-search",
      name: "Search",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-search/src/usa-search.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-search/src/usa-search.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-search",
      search: {
        name: [
          "search"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "search"
        ]
      }
    },
    {
      nativeId: "usa-section",
      name: "Section",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-section/src/usa-section.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-section/src/usa-section.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-section",
      search: {
        name: [
          "section"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "section"
        ]
      }
    },
    {
      nativeId: "usa-select",
      name: "Select",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-select/src/usa-select.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-select/src/usa-select.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-select",
      search: {
        name: [
          "select"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "select"
        ]
      }
    },
    {
      nativeId: "usa-sidenav",
      name: "Side Navigation",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-sidenav/src/usa-sidenav.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-sidenav/src/usa-sidenav.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-sidenav",
      search: {
        name: [
          "side",
          "navigation"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "sidenav"
        ]
      }
    },
    {
      nativeId: "usa-site-alert",
      name: "Site Alert",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-site-alert/src/usa-site-alert.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-site-alert/src/usa-site-alert.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-site-alert",
      search: {
        name: [
          "site",
          "alert"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "site",
          "alert"
        ]
      }
    },
    {
      nativeId: "usa-site-title",
      name: "Site Title",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-site-title/src/usa-site-title.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-site-title/src/usa-site-title.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-site-title",
      search: {
        name: [
          "site",
          "title"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "site",
          "title"
        ]
      }
    },
    {
      nativeId: "usa-skipnav",
      name: "Skipnav",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-skipnav/src/usa-skipnav.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-skipnav/src/usa-skipnav.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-skipnav",
      search: {
        name: [
          "skipnav"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "skipnav"
        ]
      }
    },
    {
      nativeId: "usa-step-indicator",
      name: "Step Indicator",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-step-indicator/src/usa-step-indicator.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-step-indicator/src/usa-step-indicator.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-step-indicator",
      search: {
        name: [
          "step",
          "indicator"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "step",
          "indicator"
        ]
      }
    },
    {
      nativeId: "usa-summary-box",
      name: "Summary Box",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-summary-box/src/usa-summary-box.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-summary-box/src/usa-summary-box.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-summary-box",
      search: {
        name: [
          "summary",
          "box"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "summary",
          "box"
        ]
      }
    },
    {
      nativeId: "usa-table",
      name: "Table",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-table/src/usa-table.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-table/src/usa-table.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-table",
      search: {
        name: [
          "table"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "table"
        ]
      }
    },
    {
      nativeId: "usa-tag",
      name: "Tags",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-tag/src/usa-tag.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-tag/src/usa-tag.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-tag",
      search: {
        name: [
          "tags"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "tag"
        ]
      }
    },
    {
      nativeId: "usa-time-picker",
      name: "Time Picker",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-time-picker/src/usa-time-picker.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-time-picker/src/usa-time-picker.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-time-picker",
      search: {
        name: [
          "time",
          "picker"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "time",
          "picker"
        ]
      }
    },
    {
      nativeId: "usa-tooltip",
      name: "Tooltip",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-tooltip/src/usa-tooltip.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-tooltip/src/usa-tooltip.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-tooltip",
      search: {
        name: [
          "tooltip"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "tooltip"
        ]
      }
    },
    {
      nativeId: "usa-validation",
      name: "Validation",
      summary: null,
      kind: "components",
      aliases: [],
      canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-validation/src/usa-validation.stories.js",
      provenance: {
        providerId: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        sourcePath: "packages/usa-validation/src/usa-validation.stories.js"
      },
      providerName: "U.S. Web Design System",
      key: "uswds:usa-validation",
      search: {
        name: [
          "validation"
        ],
        aliases: [],
        summary: [],
        kind: [
          "components"
        ],
        nativeId: [
          "usa",
          "validation"
        ]
      }
    }
  ],
  postings: {
    "404": [
      "govuk-design-system:page-not-found-pages"
    ],
    "500": [
      "govuk-design-system:problem-with-the-service-pages"
    ],
    "503": [
      "govuk-design-system:service-unavailable-pages"
    ],
    "2fa": [
      "govuk-design-system:confirm-a-phone-number"
    ],
    a: [
      "govuk-design-system:accordion",
      "govuk-design-system:back-link",
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:character-count",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:contact-a-department-or-service-team",
      "govuk-design-system:create-a-username",
      "govuk-design-system:date-input",
      "govuk-design-system:dates",
      "govuk-design-system:details",
      "govuk-design-system:email-addresses",
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:file-upload",
      "govuk-design-system:generic-header",
      "govuk-design-system:inset-text",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:skip-link",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:summary-list",
      "govuk-design-system:tabs",
      "govuk-design-system:tag",
      "govuk-design-system:task-list"
    ],
    about: [
      "govuk-design-system:cookies-page",
      "govuk-design-system:footer",
      "govuk-design-system:notification-banner",
      "govuk-design-system:warning-text"
    ],
    accept: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    access: [
      "govuk-design-system:confirm-an-email-address"
    ],
    accessibility: [
      "govuk-design-system:footer"
    ],
    accessibly: [
      "govuk-design-system:password-input"
    ],
    accordion: [
      "govuk-design-system:accordion",
      "uswds:usa-accordion"
    ],
    account: [
      "govuk-design-system:create-accounts"
    ],
    accounts: [
      "govuk-design-system:create-accounts"
    ],
    action: [
      "govuk-design-system:button",
      "govuk-design-system:warning-text"
    ],
    add: [
      "uswds:usa-add-aspect"
    ],
    address: [
      "govuk-design-system:addresses",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:email-addresses"
    ],
    addresses: [
      "govuk-design-system:addresses",
      "govuk-design-system:email-addresses"
    ],
    age: [
      "govuk-design-system:equality-information"
    ],
    alert: [
      "govuk-design-system:notification-banner",
      "uswds:usa-alert",
      "uswds:usa-site-alert"
    ],
    all: [
      "govuk-design-system:task-list"
    ],
    allow: [
      "govuk-design-system:cookie-banner"
    ],
    allows: [
      "govuk-design-system:task-list"
    ],
    alpha: [
      "govuk-design-system:phase-banner"
    ],
    also: [
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages"
    ],
    an: [
      "govuk-design-system:addresses",
      "govuk-design-system:button",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:create-accounts",
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:select",
      "govuk-design-system:tag",
      "govuk-design-system:understand-the-impact-of-an-emergency",
      "govuk-design-system:validation",
      "govuk-design-system:warning-text"
    ],
    analytics: [
      "govuk-design-system:cookie-banner"
    ],
    and: [
      "govuk-design-system:accordion",
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:cookies-page",
      "govuk-design-system:create-a-username",
      "govuk-design-system:details",
      "govuk-design-system:error-message",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:file-upload",
      "govuk-design-system:footer",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:panel",
      "govuk-design-system:passwords",
      "govuk-design-system:service-navigation",
      "govuk-design-system:table",
      "govuk-design-system:task-list",
      "govuk-design-system:validation"
    ],
    answers: [
      "govuk-design-system:check-answers",
      "govuk-design-system:validation"
    ],
    application: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:panel"
    ],
    are: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:header",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:task-list"
    ],
    around: [
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:service-navigation"
    ],
    as: [
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:tag",
      "govuk-design-system:warning-text"
    ],
    ask: [
      "govuk-design-system:bank-details",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:equality-information",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:question-pages"
    ],
    aspect: [
      "uswds:usa-add-aspect"
    ],
    at: [
      "govuk-design-system:summary-list"
    ],
    authentication: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    available: [
      "govuk-design-system:service-unavailable-pages"
    ],
    back: [
      "govuk-design-system:back-link"
    ],
    badge: [
      "govuk-design-system:tag"
    ],
    bank: [
      "govuk-design-system:bank-details"
    ],
    banner: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:notification-banner",
      "govuk-design-system:phase-banner",
      "govuk-design-system:tag",
      "uswds:usa-banner"
    ],
    be: [
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:tabs"
    ],
    before: [
      "govuk-design-system:check-answers"
    ],
    being: [
      "govuk-design-system:phase-banner"
    ],
    beta: [
      "govuk-design-system:phase-banner"
    ],
    between: [
      "govuk-design-system:tabs"
    ],
    block: [
      "govuk-design-system:inset-text",
      "uswds:usa-media-block"
    ],
    box: [
      "govuk-design-system:panel",
      "govuk-design-system:select",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea",
      "uswds:usa-combo-box",
      "uswds:usa-summary-box"
    ],
    boxes: [
      "govuk-design-system:checkboxes"
    ],
    breadcrumb: [
      "uswds:usa-breadcrumb"
    ],
    breadcrumbs: [
      "govuk-design-system:breadcrumbs"
    ],
    but: [
      "govuk-design-system:notification-banner"
    ],
    button: [
      "govuk-design-system:back-link",
      "govuk-design-system:button",
      "uswds:usa-button",
      "uswds:usa-button-group"
    ],
    buttons: [
      "govuk-design-system:radios"
    ],
    by: [
      "govuk-design-system:checkboxes",
      "govuk-design-system:details",
      "govuk-design-system:step-by-step-navigation"
    ],
    callout: [
      "govuk-design-system:inset-text"
    ],
    can: [
      "govuk-design-system:character-count",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:tabs"
    ],
    cannot: [
      "govuk-design-system:page-not-found-pages"
    ],
    card: [
      "govuk-design-system:payment-card-details",
      "govuk-design-system:summary-list",
      "uswds:usa-card"
    ],
    carry: [
      "govuk-design-system:button"
    ],
    character: [
      "govuk-design-system:character-count",
      "uswds:usa-character-count"
    ],
    characteristics: [
      "govuk-design-system:equality-information"
    ],
    characters: [
      "govuk-design-system:character-count"
    ],
    check: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:checkboxes",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:validation"
    ],
    checkbox: [
      "uswds:usa-checkbox"
    ],
    checkboxes: [
      "govuk-design-system:checkboxes"
    ],
    checklist: [
      "uswds:usa-checklist"
    ],
    chip: [
      "govuk-design-system:tag"
    ],
    civil: [
      "govuk-design-system:equality-information"
    ],
    closed: [
      "govuk-design-system:service-unavailable-pages"
    ],
    code: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    collection: [
      "uswds:usa-collection"
    ],
    collections: [
      "govuk-design-system:pagination"
    ],
    combo: [
      "govuk-design-system:select",
      "uswds:usa-combo-box"
    ],
    compare: [
      "govuk-design-system:table"
    ],
    complete: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:panel"
    ],
    completed: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirmation-pages"
    ],
    completing: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    completion: [
      "govuk-design-system:confirmation-pages"
    ],
    component: [
      "govuk-design-system:accordion",
      "govuk-design-system:back-link",
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:button",
      "govuk-design-system:character-count",
      "govuk-design-system:checkboxes",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:date-input",
      "govuk-design-system:details",
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:fieldset",
      "govuk-design-system:file-upload",
      "govuk-design-system:footer",
      "govuk-design-system:generic-header",
      "govuk-design-system:header",
      "govuk-design-system:inset-text",
      "govuk-design-system:notification-banner",
      "govuk-design-system:pagination",
      "govuk-design-system:panel",
      "govuk-design-system:password-input",
      "govuk-design-system:phase-banner",
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "govuk-design-system:service-navigation",
      "govuk-design-system:skip-link",
      "govuk-design-system:summary-list",
      "govuk-design-system:table",
      "govuk-design-system:tabs",
      "govuk-design-system:tag",
      "govuk-design-system:task-list",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea",
      "govuk-design-system:warning-text"
    ],
    components: [
      "uswds:usa-accordion",
      "uswds:usa-add-aspect",
      "uswds:usa-alert",
      "uswds:usa-banner",
      "uswds:usa-breadcrumb",
      "uswds:usa-button",
      "uswds:usa-button-group",
      "uswds:usa-card",
      "uswds:usa-character-count",
      "uswds:usa-checkbox",
      "uswds:usa-checklist",
      "uswds:usa-collection",
      "uswds:usa-combo-box",
      "uswds:usa-date-picker",
      "uswds:usa-date-range-picker",
      "uswds:usa-embed-container",
      "uswds:usa-file-input",
      "uswds:usa-footer",
      "uswds:usa-graphic-list",
      "uswds:usa-header",
      "uswds:usa-hero",
      "uswds:usa-icon-list",
      "uswds:usa-identifier",
      "uswds:usa-in-page-navigation",
      "uswds:usa-input",
      "uswds:usa-input-mask",
      "uswds:usa-input-prefix-suffix",
      "uswds:usa-language-selector",
      "uswds:usa-link",
      "uswds:usa-list",
      "uswds:usa-media-block",
      "uswds:usa-memorable-date",
      "uswds:usa-modal",
      "uswds:usa-pagination",
      "uswds:usa-process-list",
      "uswds:usa-prose",
      "uswds:usa-radio",
      "uswds:usa-range",
      "uswds:usa-search",
      "uswds:usa-section",
      "uswds:usa-select",
      "uswds:usa-sidenav",
      "uswds:usa-site-alert",
      "uswds:usa-site-title",
      "uswds:usa-skipnav",
      "uswds:usa-step-indicator",
      "uswds:usa-summary-box",
      "uswds:usa-table",
      "uswds:usa-tag",
      "uswds:usa-time-picker",
      "uswds:usa-tooltip",
      "uswds:usa-validation"
    ],
    conditions: [
      "govuk-design-system:footer"
    ],
    confirm: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:confirm-an-email-address"
    ],
    confirmation: [
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:panel"
    ],
    consent: [
      "govuk-design-system:cookie-banner"
    ],
    consequences: [
      "govuk-design-system:warning-text"
    ],
    contact: [
      "govuk-design-system:contact-a-department-or-service-team"
    ],
    container: [
      "uswds:usa-embed-container"
    ],
    content: [
      "govuk-design-system:accordion",
      "govuk-design-system:inset-text",
      "govuk-design-system:notification-banner",
      "govuk-design-system:skip-link"
    ],
    cookie: [
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    cookies: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    copyright: [
      "govuk-design-system:footer"
    ],
    correctly: [
      "govuk-design-system:names"
    ],
    count: [
      "govuk-design-system:character-count",
      "uswds:usa-character-count"
    ],
    create: [
      "govuk-design-system:create-a-username",
      "govuk-design-system:create-accounts",
      "govuk-design-system:passwords",
      "govuk-design-system:start-using-a-service"
    ],
    crumb: [
      "govuk-design-system:breadcrumbs"
    ],
    date: [
      "govuk-design-system:date-input",
      "govuk-design-system:dates",
      "uswds:usa-date-picker",
      "uswds:usa-date-range-picker",
      "uswds:usa-memorable-date"
    ],
    dates: [
      "govuk-design-system:dates"
    ],
    demographic: [
      "govuk-design-system:equality-information"
    ],
    department: [
      "govuk-design-system:contact-a-department-or-service-team",
      "govuk-design-system:footer"
    ],
    design: [
      "uswds:usa-fonts",
      "uswds:usa-icon"
    ],
    detailed: [
      "govuk-design-system:details",
      "govuk-design-system:textarea"
    ],
    details: [
      "govuk-design-system:bank-details",
      "govuk-design-system:details",
      "govuk-design-system:payment-card-details"
    ],
    device: [
      "govuk-design-system:cookies-page"
    ],
    different: [
      "govuk-design-system:cookies-page"
    ],
    differentiate: [
      "govuk-design-system:inset-text"
    ],
    digital: [
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation"
    ],
    directly: [
      "govuk-design-system:notification-banner"
    ],
    disability: [
      "govuk-design-system:equality-information"
    ],
    disclosure: [
      "govuk-design-system:details"
    ],
    display: [
      "govuk-design-system:panel"
    ],
    displays: [
      "govuk-design-system:task-list"
    ],
    diversity: [
      "govuk-design-system:equality-information"
    ],
    do: [
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:task-list"
    ],
    done: [
      "govuk-design-system:task-list"
    ],
    dropdown: [
      "govuk-design-system:select"
    ],
    easier: [
      "govuk-design-system:details",
      "govuk-design-system:table"
    ],
    easily: [
      "govuk-design-system:task-list"
    ],
    email: [
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:email-addresses"
    ],
    embed: [
      "uswds:usa-embed-container"
    ],
    emergency: [
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ],
    end: [
      "govuk-design-system:summary-list"
    ],
    enter: [
      "govuk-design-system:character-count",
      "govuk-design-system:date-input",
      "govuk-design-system:dates",
      "govuk-design-system:email-addresses",
      "govuk-design-system:names",
      "govuk-design-system:password-input",
      "govuk-design-system:passwords",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:text-input"
    ],
    entry: [
      "govuk-design-system:text-input"
    ],
    equality: [
      "govuk-design-system:equality-information"
    ],
    error: [
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:validation"
    ],
    errors: [
      "govuk-design-system:validation"
    ],
    essential: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    ethnic: [
      "govuk-design-system:equality-information",
      "govuk-design-system:ethnic-group"
    ],
    example: [
      "govuk-design-system:summary-list"
    ],
    exit: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page"
    ],
    explain: [
      "govuk-design-system:error-message"
    ],
    explains: [
      "govuk-design-system:equality-information"
    ],
    factor: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    feedback: [
      "govuk-design-system:phase-banner"
    ],
    field: [
      "govuk-design-system:text-input",
      "govuk-design-system:textarea"
    ],
    fieldset: [
      "govuk-design-system:fieldset"
    ],
    file: [
      "govuk-design-system:file-upload",
      "uswds:usa-file-input"
    ],
    find: [
      "govuk-design-system:page-not-found-pages"
    ],
    finish: [
      "govuk-design-system:confirmation-pages"
    ],
    fix: [
      "govuk-design-system:error-message",
      "govuk-design-system:validation"
    ],
    flag: [
      "govuk-design-system:tag"
    ],
    flash: [
      "govuk-design-system:notification-banner"
    ],
    follow: [
      "govuk-design-system:question-pages"
    ],
    fonts: [
      "uswds:usa-fonts"
    ],
    footer: [
      "govuk-design-system:footer",
      "uswds:usa-footer"
    ],
    for: [
      "govuk-design-system:bank-details",
      "govuk-design-system:create-accounts",
      "govuk-design-system:equality-information",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:summary-list",
      "govuk-design-system:table"
    ],
    form: [
      "govuk-design-system:fieldset",
      "govuk-design-system:summary-list",
      "uswds:usa-form"
    ],
    forms: [
      "uswds:usa-form"
    ],
    found: [
      "govuk-design-system:page-not-found-pages"
    ],
    from: [
      "govuk-design-system:inset-text",
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "govuk-design-system:validation"
    ],
    gdpr: [
      "govuk-design-system:cookie-banner"
    ],
    gender: [
      "govuk-design-system:equality-information",
      "govuk-design-system:gender-or-sex"
    ],
    generic: [
      "govuk-design-system:generic-header"
    ],
    give: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:validation"
    ],
    go: [
      "govuk-design-system:back-link"
    ],
    gov: [
      "govuk-design-system:footer",
      "govuk-design-system:generic-header",
      "govuk-design-system:header",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation"
    ],
    graphic: [
      "uswds:usa-graphic-list"
    ],
    group: [
      "govuk-design-system:equality-information",
      "govuk-design-system:ethnic-group",
      "govuk-design-system:fieldset",
      "uswds:usa-button-group"
    ],
    groups: [
      "govuk-design-system:ethnic-group"
    ],
    has: [
      "govuk-design-system:confirm-an-email-address"
    ],
    have: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    header: [
      "govuk-design-system:generic-header",
      "govuk-design-system:header",
      "uswds:usa-header"
    ],
    help: [
      "govuk-design-system:addresses",
      "govuk-design-system:back-link",
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:button",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:create-a-username",
      "govuk-design-system:create-accounts",
      "govuk-design-system:date-input",
      "govuk-design-system:dates",
      "govuk-design-system:email-addresses",
      "govuk-design-system:file-upload",
      "govuk-design-system:generic-header",
      "govuk-design-system:names",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:pagination",
      "govuk-design-system:password-input",
      "govuk-design-system:passwords",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:select",
      "govuk-design-system:skip-link",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea"
    ],
    helpful: [
      "govuk-design-system:tabs"
    ],
    helps: [
      "govuk-design-system:service-navigation"
    ],
    hero: [
      "uswds:usa-hero"
    ],
    hidden: [
      "govuk-design-system:details"
    ],
    hide: [
      "govuk-design-system:accordion",
      "govuk-design-system:details"
    ],
    hierarchical: [
      "govuk-design-system:breadcrumbs"
    ],
    highlighted: [
      "govuk-design-system:inset-text"
    ],
    how: [
      "govuk-design-system:bank-details",
      "govuk-design-system:character-count",
      "govuk-design-system:equality-information",
      "govuk-design-system:error-message",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:validation"
    ],
    icon: [
      "uswds:usa-icon",
      "uswds:usa-icon-list"
    ],
    icons: [
      "uswds:usa-icon"
    ],
    identifier: [
      "uswds:usa-identifier"
    ],
    identify: [
      "govuk-design-system:task-list"
    ],
    identifying: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    identity: [
      "govuk-design-system:equality-information"
    ],
    if: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:details",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:validation"
    ],
    impact: [
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ],
    important: [
      "govuk-design-system:interruption-pages",
      "govuk-design-system:notification-banner",
      "govuk-design-system:panel",
      "govuk-design-system:warning-text"
    ],
    in: [
      "govuk-design-system:back-link",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:panel",
      "uswds:usa-in-page-navigation"
    ],
    indicates: [
      "govuk-design-system:tag"
    ],
    indicator: [
      "uswds:usa-step-indicator"
    ],
    information: [
      "govuk-design-system:check-answers",
      "govuk-design-system:details",
      "govuk-design-system:equality-information",
      "govuk-design-system:footer",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:panel",
      "govuk-design-system:summary-list",
      "govuk-design-system:table",
      "govuk-design-system:tabs",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea"
    ],
    input: [
      "govuk-design-system:date-input",
      "govuk-design-system:password-input",
      "govuk-design-system:text-input",
      "uswds:usa-file-input",
      "uswds:usa-input",
      "uswds:usa-input-mask",
      "uswds:usa-input-prefix-suffix"
    ],
    inputs: [
      "govuk-design-system:fieldset"
    ],
    inset: [
      "govuk-design-system:inset-text"
    ],
    insurance: [
      "govuk-design-system:national-insurance-numbers"
    ],
    interruption: [
      "govuk-design-system:interruption-pages",
      "govuk-design-system:panel"
    ],
    into: [
      "govuk-design-system:character-count",
      "govuk-design-system:create-a-username"
    ],
    involved: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    is: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:error-summary",
      "govuk-design-system:phase-banner",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-unavailable-pages"
    ],
    it: [
      "govuk-design-system:details",
      "govuk-design-system:error-message",
      "govuk-design-system:inset-text",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:validation"
    ],
    item: [
      "govuk-design-system:select",
      "govuk-design-system:tag"
    ],
    journey: [
      "govuk-design-system:interruption-pages"
    ],
    keyboard: [
      "govuk-design-system:skip-link"
    ],
    know: [
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:notification-banner"
    ],
    known: [
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages"
    ],
    lack: [
      "govuk-design-system:warning-text"
    ],
    language: [
      "uswds:usa-language-selector"
    ],
    legal: [
      "govuk-design-system:warning-text"
    ],
    let: [
      "govuk-design-system:check-answers",
      "govuk-design-system:checkboxes",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:cookies-page",
      "govuk-design-system:radios"
    ],
    lets: [
      "govuk-design-system:accordion",
      "govuk-design-system:service-navigation"
    ],
    letting: [
      "govuk-design-system:details",
      "govuk-design-system:tabs"
    ],
    licensing: [
      "govuk-design-system:footer"
    ],
    like: [
      "govuk-design-system:pagination"
    ],
    line: [
      "govuk-design-system:textarea"
    ],
    link: [
      "govuk-design-system:back-link",
      "govuk-design-system:skip-link",
      "uswds:usa-link"
    ],
    list: [
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "govuk-design-system:summary-list",
      "govuk-design-system:tag",
      "govuk-design-system:task-list",
      "govuk-design-system:task-list-pages",
      "uswds:usa-graphic-list",
      "uswds:usa-icon-list",
      "uswds:usa-list",
      "uswds:usa-process-list"
    ],
    lists: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    loop: [
      "govuk-design-system:confirm-an-email-address"
    ],
    main: [
      "govuk-design-system:skip-link"
    ],
    make: [
      "govuk-design-system:details",
      "govuk-design-system:table",
      "govuk-design-system:validation"
    ],
    making: [
      "govuk-design-system:cookie-banner"
    ],
    many: [
      "govuk-design-system:character-count"
    ],
    marriage: [
      "govuk-design-system:equality-information"
    ],
    mask: [
      "uswds:usa-input-mask"
    ],
    masthead: [
      "govuk-design-system:header"
    ],
    media: [
      "uswds:usa-media-block"
    ],
    memorable: [
      "govuk-design-system:create-a-username",
      "govuk-design-system:date-input",
      "govuk-design-system:passwords",
      "uswds:usa-memorable-date"
    ],
    menu: [
      "govuk-design-system:select"
    ],
    message: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:error-message",
      "govuk-design-system:notification-banner"
    ],
    mfa: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    might: [
      "govuk-design-system:warning-text"
    ],
    modal: [
      "uswds:usa-modal"
    ],
    more: [
      "govuk-design-system:checkboxes",
      "govuk-design-system:details"
    ],
    multi: [
      "govuk-design-system:back-link",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:textarea"
    ],
    multiple: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    name: [
      "govuk-design-system:names"
    ],
    names: [
      "govuk-design-system:names"
    ],
    national: [
      "govuk-design-system:national-insurance-numbers"
    ],
    navigate: [
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:pagination",
      "govuk-design-system:service-navigation"
    ],
    navigation: [
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:service-navigation",
      "govuk-design-system:skip-link",
      "govuk-design-system:step-by-step-navigation",
      "uswds:usa-in-page-navigation",
      "uswds:usa-sidenav"
    ],
    need: [
      "govuk-design-system:details",
      "govuk-design-system:notification-banner",
      "govuk-design-system:question-pages",
      "govuk-design-system:task-list",
      "govuk-design-system:warning-text"
    ],
    needs: [
      "govuk-design-system:task-list"
    ],
    non: [
      "govuk-design-system:cookies-page"
    ],
    not: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:generic-header",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages"
    ],
    notice: [
      "govuk-design-system:footer"
    ],
    notification: [
      "govuk-design-system:notification-banner"
    ],
    number: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:panel",
      "govuk-design-system:phone-numbers"
    ],
    numbered: [
      "govuk-design-system:pagination"
    ],
    numbers: [
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:phone-numbers"
    ],
    of: [
      "govuk-design-system:accordion",
      "govuk-design-system:cookies-page",
      "govuk-design-system:inset-text",
      "govuk-design-system:pagination",
      "govuk-design-system:summary-list",
      "govuk-design-system:tabs",
      "govuk-design-system:tag",
      "govuk-design-system:understand-the-impact-of-an-emergency",
      "govuk-design-system:warning-text"
    ],
    on: [
      "govuk-design-system:accordion",
      "govuk-design-system:cookies-page",
      "govuk-design-system:generic-header",
      "govuk-design-system:header",
      "govuk-design-system:phase-banner",
      "govuk-design-system:skip-link",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:tag",
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ],
    one: [
      "govuk-design-system:checkboxes"
    ],
    ones: [
      "govuk-design-system:task-list"
    ],
    only: [
      "govuk-design-system:details",
      "govuk-design-system:skip-link"
    ],
    option: [
      "govuk-design-system:radios"
    ],
    options: [
      "govuk-design-system:checkboxes"
    ],
    or: [
      "govuk-design-system:character-count",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:checkboxes",
      "govuk-design-system:contact-a-department-or-service-team",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page",
      "govuk-design-system:dates",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:gender-or-sex",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:tag",
      "govuk-design-system:warning-text",
      "uswds:usa-input-prefix-suffix"
    ],
    order: [
      "govuk-design-system:complete-multiple-tasks"
    ],
    orientate: [
      "govuk-design-system:breadcrumbs"
    ],
    orientation: [
      "govuk-design-system:equality-information"
    ],
    other: [
      "govuk-design-system:footer"
    ],
    out: [
      "govuk-design-system:button",
      "govuk-design-system:check-a-service-is-suitable"
    ],
    page: [
      "govuk-design-system:accordion",
      "govuk-design-system:back-link",
      "govuk-design-system:cookies-page",
      "govuk-design-system:details",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:skip-link",
      "govuk-design-system:start-using-a-service",
      "uswds:usa-in-page-navigation"
    ],
    pages: [
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:pagination",
      "govuk-design-system:panel",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:start-pages",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:task-list-pages"
    ],
    pagination: [
      "govuk-design-system:pagination",
      "uswds:usa-pagination"
    ],
    panel: [
      "govuk-design-system:panel"
    ],
    partnership: [
      "govuk-design-system:equality-information"
    ],
    pass: [
      "govuk-design-system:password-input"
    ],
    password: [
      "govuk-design-system:password-input"
    ],
    passwords: [
      "govuk-design-system:password-input",
      "govuk-design-system:passwords"
    ],
    path: [
      "govuk-design-system:breadcrumbs"
    ],
    pattern: [
      "govuk-design-system:addresses",
      "govuk-design-system:bank-details",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:contact-a-department-or-service-team",
      "govuk-design-system:cookies-page",
      "govuk-design-system:create-a-username",
      "govuk-design-system:create-accounts",
      "govuk-design-system:dates",
      "govuk-design-system:email-addresses",
      "govuk-design-system:equality-information",
      "govuk-design-system:ethnic-group",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:gender-or-sex",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:names",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:passwords",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:start-pages",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:task-list-pages",
      "govuk-design-system:understand-the-impact-of-an-emergency",
      "govuk-design-system:validation"
    ],
    patterns: [
      "uswds:usa-form"
    ],
    pause: [
      "govuk-design-system:interruption-pages"
    ],
    payment: [
      "govuk-design-system:payment-card-details"
    ],
    permanently: [
      "govuk-design-system:service-unavailable-pages"
    ],
    phase: [
      "govuk-design-system:phase-banner",
      "govuk-design-system:tag"
    ],
    phone: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:phone-numbers"
    ],
    phrase: [
      "govuk-design-system:password-input"
    ],
    picker: [
      "uswds:usa-date-picker",
      "uswds:usa-date-range-picker",
      "uswds:usa-time-picker"
    ],
    point: [
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation"
    ],
    pop: [
      "govuk-design-system:select"
    ],
    postcode: [
      "govuk-design-system:addresses"
    ],
    prefix: [
      "uswds:usa-input-prefix-suffix"
    ],
    previous: [
      "govuk-design-system:back-link"
    ],
    primary: [
      "govuk-design-system:service-navigation"
    ],
    privacy: [
      "govuk-design-system:cookies-page",
      "govuk-design-system:footer"
    ],
    problem: [
      "govuk-design-system:problem-with-the-service-pages"
    ],
    process: [
      "uswds:usa-process-list"
    ],
    progressive: [
      "govuk-design-system:details"
    ],
    prose: [
      "uswds:usa-prose"
    ],
    protected: [
      "govuk-design-system:equality-information"
    ],
    prototype: [
      "govuk-design-system:phase-banner"
    ],
    provide: [
      "govuk-design-system:addresses",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:textarea"
    ],
    provides: [
      "govuk-design-system:footer"
    ],
    question: [
      "govuk-design-system:question-pages"
    ],
    questions: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:question-pages"
    ],
    quickly: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:tabs"
    ],
    radio: [
      "govuk-design-system:radios",
      "uswds:usa-radio"
    ],
    radios: [
      "govuk-design-system:radios"
    ],
    range: [
      "uswds:usa-date-range-picker",
      "uswds:usa-range"
    ],
    re: [
      "govuk-design-system:cookies-page",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:service-navigation",
      "govuk-design-system:validation"
    ],
    receipts: [
      "govuk-design-system:confirmation-pages"
    ],
    recover: [
      "govuk-design-system:validation"
    ],
    reference: [
      "govuk-design-system:panel"
    ],
    reject: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    related: [
      "govuk-design-system:accordion",
      "govuk-design-system:fieldset",
      "govuk-design-system:notification-banner",
      "govuk-design-system:tabs"
    ],
    religion: [
      "govuk-design-system:equality-information"
    ],
    responses: [
      "govuk-design-system:summary-list"
    ],
    results: [
      "govuk-design-system:pagination",
      "govuk-design-system:panel"
    ],
    return: [
      "govuk-design-system:back-link"
    ],
    reveal: [
      "govuk-design-system:details"
    ],
    s: [
      "govuk-design-system:error-message",
      "govuk-design-system:notification-banner",
      "govuk-design-system:summary-list",
      "govuk-design-system:validation"
    ],
    safely: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page"
    ],
    say: [
      "govuk-design-system:service-unavailable-pages"
    ],
    scan: [
      "govuk-design-system:details",
      "govuk-design-system:table"
    ],
    search: [
      "govuk-design-system:pagination",
      "uswds:usa-search"
    ],
    section: [
      "uswds:usa-section"
    ],
    sections: [
      "govuk-design-system:accordion"
    ],
    secure: [
      "govuk-design-system:passwords"
    ],
    security: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    select: [
      "govuk-design-system:checkboxes",
      "govuk-design-system:dates",
      "govuk-design-system:file-upload",
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "uswds:usa-select"
    ],
    selector: [
      "uswds:usa-language-selector"
    ],
    service: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:contact-a-department-or-service-team",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:create-a-username",
      "govuk-design-system:create-accounts",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:footer",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:phase-banner",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-navigation",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ],
    services: [
      "govuk-design-system:generic-header"
    ],
    setting: [
      "govuk-design-system:cookies-page"
    ],
    settings: [
      "govuk-design-system:cookies-page"
    ],
    sex: [
      "govuk-design-system:equality-information",
      "govuk-design-system:gender-or-sex"
    ],
    sexual: [
      "govuk-design-system:equality-information"
    ],
    should: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:service-unavailable-pages"
    ],
    show: [
      "govuk-design-system:accordion",
      "govuk-design-system:details",
      "govuk-design-system:phase-banner"
    ],
    shows: [
      "govuk-design-system:header"
    ],
    showyhideything: [
      "govuk-design-system:details"
    ],
    side: [
      "uswds:usa-sidenav"
    ],
    sidenav: [
      "uswds:usa-sidenav"
    ],
    sign: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:create-a-username"
    ],
    single: [
      "govuk-design-system:radios"
    ],
    site: [
      "uswds:usa-site-alert",
      "uswds:usa-site-title"
    ],
    skip: [
      "govuk-design-system:skip-link"
    ],
    skipnav: [
      "uswds:usa-skipnav"
    ],
    someone: [
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-unavailable-pages"
    ],
    something: [
      "govuk-design-system:notification-banner",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:tag",
      "govuk-design-system:warning-text"
    ],
    specific: [
      "govuk-design-system:confirm-an-email-address"
    ],
    start: [
      "govuk-design-system:start-pages",
      "govuk-design-system:start-using-a-service"
    ],
    starting: [
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation"
    ],
    statement: [
      "govuk-design-system:footer"
    ],
    status: [
      "govuk-design-system:phase-banner",
      "govuk-design-system:tag"
    ],
    step: [
      "govuk-design-system:step-by-step-navigation",
      "uswds:usa-step-indicator"
    ],
    still: [
      "govuk-design-system:phase-banner",
      "govuk-design-system:task-list"
    ],
    structure: [
      "govuk-design-system:breadcrumbs"
    ],
    submitting: [
      "govuk-design-system:check-answers"
    ],
    success: [
      "govuk-design-system:notification-banner"
    ],
    such: [
      "govuk-design-system:tag",
      "govuk-design-system:warning-text"
    ],
    suffix: [
      "uswds:usa-input-prefix-suffix"
    ],
    suitable: [
      "govuk-design-system:check-a-service-is-suitable"
    ],
    summarise: [
      "govuk-design-system:summary-list"
    ],
    summary: [
      "govuk-design-system:error-summary",
      "govuk-design-system:summary-list",
      "uswds:usa-summary-box"
    ],
    sure: [
      "govuk-design-system:validation"
    ],
    surrounds: [
      "govuk-design-system:inset-text"
    ],
    switch: [
      "govuk-design-system:tabs"
    ],
    table: [
      "govuk-design-system:table",
      "uswds:usa-table"
    ],
    tabs: [
      "govuk-design-system:tabs"
    ],
    tag: [
      "govuk-design-system:tag",
      "uswds:usa-tag"
    ],
    tags: [
      "uswds:usa-tag"
    ],
    take: [
      "govuk-design-system:warning-text"
    ],
    task: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:tag",
      "govuk-design-system:task-list",
      "govuk-design-system:task-list-pages"
    ],
    tasks: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:task-list"
    ],
    team: [
      "govuk-design-system:contact-a-department-or-service-team"
    ],
    telephone: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:phone-numbers"
    ],
    tell: [
      "govuk-design-system:character-count",
      "govuk-design-system:cookies-page",
      "govuk-design-system:notification-banner",
      "govuk-design-system:validation"
    ],
    tells: [
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-unavailable-pages"
    ],
    terms: [
      "govuk-design-system:footer"
    ],
    text: [
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:details",
      "govuk-design-system:inset-text",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea",
      "govuk-design-system:warning-text",
      "uswds:usa-input",
      "uswds:usa-input-mask"
    ],
    textarea: [
      "govuk-design-system:character-count",
      "govuk-design-system:textarea"
    ],
    that: [
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:header",
      "govuk-design-system:inset-text",
      "govuk-design-system:notification-banner",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-navigation",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:warning-text"
    ],
    the: [
      "govuk-design-system:accordion",
      "govuk-design-system:back-link",
      "govuk-design-system:button",
      "govuk-design-system:checkboxes",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:cookies-page",
      "govuk-design-system:date-input",
      "govuk-design-system:fieldset",
      "govuk-design-system:footer",
      "govuk-design-system:header",
      "govuk-design-system:inset-text",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:panel",
      "govuk-design-system:phase-banner",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:radios",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:skip-link",
      "govuk-design-system:summary-list",
      "govuk-design-system:table",
      "govuk-design-system:tag",
      "govuk-design-system:task-list",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea",
      "govuk-design-system:understand-the-impact-of-an-emergency",
      "govuk-design-system:validation",
      "govuk-design-system:warning-text"
    ],
    their: [
      "govuk-design-system:bank-details",
      "govuk-design-system:check-answers",
      "govuk-design-system:cookies-page",
      "govuk-design-system:names",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:payment-card-details"
    ],
    them: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:cookies-page",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:service-navigation",
      "govuk-design-system:validation"
    ],
    themselves: [
      "govuk-design-system:breadcrumbs"
    ],
    there: [
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:validation"
    ],
    they: [
      "govuk-design-system:character-count",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:details",
      "govuk-design-system:header",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:service-navigation",
      "govuk-design-system:task-list",
      "govuk-design-system:validation",
      "govuk-design-system:warning-text"
    ],
    this: [
      "govuk-design-system:equality-information",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-unavailable-pages"
    ],
    tick: [
      "govuk-design-system:checkboxes"
    ],
    tickboxes: [
      "govuk-design-system:checkboxes"
    ],
    time: [
      "uswds:usa-time-picker"
    ],
    title: [
      "uswds:usa-site-title"
    ],
    to: [
      "govuk-design-system:back-link",
      "govuk-design-system:bank-details",
      "govuk-design-system:button",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:create-a-username",
      "govuk-design-system:date-input",
      "govuk-design-system:details",
      "govuk-design-system:equality-information",
      "govuk-design-system:error-message",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:fieldset",
      "govuk-design-system:generic-header",
      "govuk-design-system:inset-text",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:notification-banner",
      "govuk-design-system:page-not-found-pages",
      "govuk-design-system:panel",
      "govuk-design-system:passwords",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:phase-banner",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:skip-link",
      "govuk-design-system:summary-list",
      "govuk-design-system:table",
      "govuk-design-system:task-list",
      "govuk-design-system:validation",
      "govuk-design-system:warning-text"
    ],
    token: [
      "govuk-design-system:tag"
    ],
    tokens: [
      "uswds:usa-fonts",
      "uswds:usa-icon"
    ],
    tooltip: [
      "uswds:usa-tooltip"
    ],
    tracking: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page"
    ],
    transaction: [
      "govuk-design-system:back-link",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirmation-pages"
    ],
    trying: [
      "govuk-design-system:page-not-found-pages"
    ],
    two: [
      "govuk-design-system:confirm-a-phone-number"
    ],
    types: [
      "govuk-design-system:cookies-page"
    ],
    uk: [
      "govuk-design-system:footer",
      "govuk-design-system:generic-header",
      "govuk-design-system:header",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation"
    ],
    unavailable: [
      "govuk-design-system:service-unavailable-pages"
    ],
    understand: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:service-navigation",
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ],
    unique: [
      "govuk-design-system:create-a-username"
    ],
    up: [
      "govuk-design-system:select"
    ],
    upload: [
      "govuk-design-system:file-upload"
    ],
    usa: [
      "uswds:usa-accordion",
      "uswds:usa-add-aspect",
      "uswds:usa-alert",
      "uswds:usa-banner",
      "uswds:usa-breadcrumb",
      "uswds:usa-button",
      "uswds:usa-button-group",
      "uswds:usa-card",
      "uswds:usa-character-count",
      "uswds:usa-checkbox",
      "uswds:usa-checklist",
      "uswds:usa-collection",
      "uswds:usa-combo-box",
      "uswds:usa-date-picker",
      "uswds:usa-date-range-picker",
      "uswds:usa-embed-container",
      "uswds:usa-file-input",
      "uswds:usa-fonts",
      "uswds:usa-footer",
      "uswds:usa-form",
      "uswds:usa-graphic-list",
      "uswds:usa-header",
      "uswds:usa-hero",
      "uswds:usa-icon",
      "uswds:usa-icon-list",
      "uswds:usa-identifier",
      "uswds:usa-in-page-navigation",
      "uswds:usa-input",
      "uswds:usa-input-mask",
      "uswds:usa-input-prefix-suffix",
      "uswds:usa-language-selector",
      "uswds:usa-link",
      "uswds:usa-list",
      "uswds:usa-media-block",
      "uswds:usa-memorable-date",
      "uswds:usa-modal",
      "uswds:usa-pagination",
      "uswds:usa-process-list",
      "uswds:usa-prose",
      "uswds:usa-radio",
      "uswds:usa-range",
      "uswds:usa-search",
      "uswds:usa-section",
      "uswds:usa-select",
      "uswds:usa-sidenav",
      "uswds:usa-site-alert",
      "uswds:usa-site-title",
      "uswds:usa-skipnav",
      "uswds:usa-step-indicator",
      "uswds:usa-summary-box",
      "uswds:usa-table",
      "uswds:usa-tag",
      "uswds:usa-time-picker",
      "uswds:usa-tooltip",
      "uswds:usa-validation"
    ],
    use: [
      "govuk-design-system:back-link",
      "govuk-design-system:button",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:date-input",
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:fieldset",
      "govuk-design-system:inset-text",
      "govuk-design-system:notification-banner",
      "govuk-design-system:panel",
      "govuk-design-system:phase-banner",
      "govuk-design-system:skip-link",
      "govuk-design-system:summary-list",
      "govuk-design-system:table",
      "govuk-design-system:warning-text"
    ],
    user: [
      "govuk-design-system:confirm-an-email-address",
      "govuk-design-system:interruption-pages",
      "govuk-design-system:notification-banner",
      "govuk-design-system:summary-list",
      "govuk-design-system:task-list"
    ],
    username: [
      "govuk-design-system:create-a-username"
    ],
    users: [
      "govuk-design-system:accordion",
      "govuk-design-system:addresses",
      "govuk-design-system:back-link",
      "govuk-design-system:bank-details",
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:button",
      "govuk-design-system:character-count",
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:check-answers",
      "govuk-design-system:checkboxes",
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:confirmation-pages",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:cookies-page",
      "govuk-design-system:create-a-username",
      "govuk-design-system:create-accounts",
      "govuk-design-system:date-input",
      "govuk-design-system:dates",
      "govuk-design-system:details",
      "govuk-design-system:email-addresses",
      "govuk-design-system:equality-information",
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:file-upload",
      "govuk-design-system:header",
      "govuk-design-system:names",
      "govuk-design-system:national-insurance-numbers",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:pagination",
      "govuk-design-system:password-input",
      "govuk-design-system:passwords",
      "govuk-design-system:payment-card-details",
      "govuk-design-system:phase-banner",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:question-pages",
      "govuk-design-system:radios",
      "govuk-design-system:select",
      "govuk-design-system:service-navigation",
      "govuk-design-system:skip-link",
      "govuk-design-system:table",
      "govuk-design-system:tabs",
      "govuk-design-system:task-list",
      "govuk-design-system:text-input",
      "govuk-design-system:textarea",
      "govuk-design-system:validation",
      "govuk-design-system:warning-text"
    ],
    using: [
      "govuk-design-system:checkboxes",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:radios",
      "govuk-design-system:service-navigation",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:textarea"
    ],
    valid: [
      "govuk-design-system:email-addresses",
      "govuk-design-system:phone-numbers",
      "govuk-design-system:validation"
    ],
    validation: [
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:validation",
      "uswds:usa-validation"
    ],
    ve: [
      "govuk-design-system:confirmation-pages"
    ],
    view: [
      "govuk-design-system:page-not-found-pages"
    ],
    warn: [
      "govuk-design-system:warning-text"
    ],
    warning: [
      "govuk-design-system:notification-banner",
      "govuk-design-system:warning-text"
    ],
    way: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page",
      "govuk-design-system:tabs"
    ],
    we: [
      "govuk-design-system:page-not-found-pages"
    ],
    website: [
      "govuk-design-system:exit-a-page-quickly",
      "govuk-design-system:exit-this-page"
    ],
    went: [
      "govuk-design-system:error-message"
    ],
    were: [
      "govuk-design-system:page-not-found-pages"
    ],
    what: [
      "govuk-design-system:error-message",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:validation"
    ],
    when: [
      "govuk-design-system:complete-multiple-tasks",
      "govuk-design-system:confirm-a-phone-number",
      "govuk-design-system:error-message",
      "govuk-design-system:error-summary",
      "govuk-design-system:service-unavailable-pages",
      "govuk-design-system:warning-text"
    ],
    whenever: [
      "govuk-design-system:question-pages"
    ],
    which: [
      "govuk-design-system:cookie-banner",
      "govuk-design-system:task-list"
    ],
    will: [
      "govuk-design-system:service-unavailable-pages"
    ],
    with: [
      "govuk-design-system:create-a-username",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:text-input"
    ],
    within: [
      "govuk-design-system:breadcrumbs",
      "govuk-design-system:panel",
      "govuk-design-system:question-pages"
    ],
    word: [
      "govuk-design-system:character-count",
      "govuk-design-system:password-input"
    ],
    words: [
      "govuk-design-system:character-count"
    ],
    work: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:cookie-banner"
    ],
    worked: [
      "govuk-design-system:phase-banner"
    ],
    wrong: [
      "govuk-design-system:error-message",
      "govuk-design-system:problem-with-the-service-pages",
      "govuk-design-system:validation"
    ],
    you: [
      "govuk-design-system:cookies-page",
      "govuk-design-system:question-pages",
      "govuk-design-system:warning-text"
    ],
    your: [
      "govuk-design-system:check-a-service-is-suitable",
      "govuk-design-system:cookie-banner",
      "govuk-design-system:create-accounts",
      "govuk-design-system:footer",
      "govuk-design-system:navigate-a-service",
      "govuk-design-system:phase-banner",
      "govuk-design-system:question-pages",
      "govuk-design-system:service-navigation",
      "govuk-design-system:start-using-a-service",
      "govuk-design-system:step-by-step-navigation",
      "govuk-design-system:understand-the-impact-of-an-emergency"
    ]
  }
};

// generated/provider-snapshot.v1.json
var provider_snapshot_v1_default = {
  schemaVersion: "1",
  assembledAt: "2026-07-17T17:39:20.000Z",
  fingerprint: "16755ec6c0c62bbba5e01e6cdda1de467bd87026d498ad7daa4bfca077b13ae7",
  providers: [
    {
      id: "govuk-design-system",
      name: "GOV.UK Design System",
      homepage: "https://design-system.service.gov.uk/",
      source: {
        adapter: "govuk-design-system",
        repository: "https://github.com/alphagov/govuk-design-system",
        revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
        observedAt: "2026-07-17T11:51:27+01:00",
        format: "Markdown frontmatter",
        inputPath: "providers/sources/govuk-design-system.json",
        sourcePaths: [
          "src/components/*/index.md",
          "src/patterns/*/index.md"
        ]
      },
      license: {
        expression: "MIT",
        url: "https://github.com/alphagov/govuk-design-system/blob/b3536490dfea80a32968cf61e8b00d75530d80bd/LICENSE",
        scope: "metadata-only",
        notice: "Copyright (c) 2017 Crown Copyright (Government Digital Service)."
      },
      freshness: {
        staleAfterDays: 45
      },
      build: {
        mode: "current",
        inputSha256: "c35023510a47416c7535c780ee6bc58124d60d9acb3a6d29819ba8d9ddca1f29",
        failure: null
      },
      records: [
        {
          nativeId: "accordion",
          name: "Accordion",
          summary: "The accordion component lets users show and hide sections of related content on a page",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/accordion/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/accordion/index.md"
          }
        },
        {
          nativeId: "addresses",
          name: "Addresses",
          summary: "Help users provide an address",
          kind: "pattern",
          aliases: [
            "postcode"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/addresses/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/addresses/index.md"
          }
        },
        {
          nativeId: "back-link",
          name: "Back link",
          summary: "Use the back link component to help users go back to the previous page in a multi-page transaction",
          kind: "component",
          aliases: [
            "return link",
            "back button"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/back-link/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/back-link/index.md"
          }
        },
        {
          nativeId: "bank-details",
          name: "Bank details",
          summary: "How to ask users for their bank details",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/bank-details/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/bank-details/index.md"
          }
        },
        {
          nativeId: "breadcrumbs",
          name: "Breadcrumbs",
          summary: "Help users orientate themselves and navigate pages within a hierarchical structure",
          kind: "component",
          aliases: [
            "navigation path",
            "cookie crumb"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/breadcrumbs/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/breadcrumbs/index.md"
          }
        },
        {
          nativeId: "button",
          name: "Button",
          summary: "Use the button component to help users carry out an action",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/button/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/button/index.md"
          }
        },
        {
          nativeId: "character-count",
          name: "Character count",
          summary: "Tell users how many characters or words they can enter into a textarea",
          kind: "component",
          aliases: [
            "word count"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/character-count/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/character-count/index.md"
          }
        },
        {
          nativeId: "check-a-service-is-suitable",
          name: "Check a service is suitable",
          summary: "Ask users questions to help them work out if they can or should use your service",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/check-a-service-is-suitable/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/check-a-service-is-suitable/index.md"
          }
        },
        {
          nativeId: "check-answers",
          name: "Check answers",
          summary: "Let users check their answers before submitting information to a service",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/check-answers/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/check-answers/index.md"
          }
        },
        {
          nativeId: "checkboxes",
          name: "Checkboxes",
          summary: "Let users select one or more options by using the checkboxes component",
          kind: "component",
          aliases: [
            "check boxes",
            "tickboxes",
            "tick boxes"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/checkboxes/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/checkboxes/index.md"
          }
        },
        {
          nativeId: "complete-multiple-tasks",
          name: "Complete multiple tasks",
          summary: "Task lists help users understand tasks involved in completing a transaction, the order they should complete tasks in and when they have completed tasks",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/complete-multiple-tasks/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/complete-multiple-tasks/index.md"
          }
        },
        {
          nativeId: "confirm-a-phone-number",
          name: "Confirm a phone number",
          summary: "Identifying users when they sign in",
          kind: "pattern",
          aliases: [
            "2FA",
            "MFA",
            "multi-factor authentication",
            "security code",
            "telephone number",
            "phone number",
            "text message",
            "two-factor authentication"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/confirm-a-phone-number/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/confirm-a-phone-number/index.md"
          }
        },
        {
          nativeId: "confirm-an-email-address",
          name: "Confirm an email address",
          summary: "Use an email confirmation loop to check that a user has access to a specific email",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/confirm-an-email-address/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/confirm-an-email-address/index.md"
          }
        },
        {
          nativeId: "confirmation-pages",
          name: "Confirmation pages",
          summary: "Let users know they\u2019ve completed a transaction",
          kind: "pattern",
          aliases: [
            "completion pages",
            "receipts",
            "finish pages"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/confirmation-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/confirmation-pages/index.md"
          }
        },
        {
          nativeId: "contact-a-department-or-service-team",
          name: "Contact a department or service team",
          summary: "Contact a department or service team",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/contact-a-department-or-service-team/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/contact-a-department-or-service-team/index.md"
          }
        },
        {
          nativeId: "cookie-banner",
          name: "Cookie banner",
          summary: "Allow users to accept or reject cookies which are not essential to making your service work.",
          kind: "component",
          aliases: [
            "Cookies banner",
            "consent banner",
            "GDPR banner",
            "tracking banner",
            "analytics banner"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/cookie-banner/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/cookie-banner/index.md"
          }
        },
        {
          nativeId: "cookies-page",
          name: "Cookies page",
          summary: "Tell users about the cookies you\u2019re setting on their device and let them accept or reject different types of non-essential cookies.",
          kind: "pattern",
          aliases: [
            "Privacy settings",
            "Cookie settings",
            "tracking settings"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/cookies-page/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/cookies-page/index.md"
          }
        },
        {
          nativeId: "create-a-username",
          name: "Create a username",
          summary: "Help users to create a unique and memorable username to sign into a service with",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/create-a-username/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/create-a-username/index.md"
          }
        },
        {
          nativeId: "create-accounts",
          name: "Create accounts",
          summary: "Help users create an account for your service",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/create-accounts/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/create-accounts/index.md"
          }
        },
        {
          nativeId: "date-input",
          name: "Date input",
          summary: "Use the date input component to help users enter a memorable date",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/date-input/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/date-input/index.md"
          }
        },
        {
          nativeId: "dates",
          name: "Dates",
          summary: "Help users enter or select a date",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/dates/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/dates/index.md"
          }
        },
        {
          nativeId: "details",
          name: "Details",
          summary: "Make a page easier to scan by letting users reveal more detailed information only if they need it",
          kind: "component",
          aliases: [
            "reveal",
            "progressive disclosure",
            "hidden text",
            "show and hide",
            "ShowyHideyThing"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/details/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/details/index.md"
          }
        },
        {
          nativeId: "email-addresses",
          name: "Email addresses",
          summary: "Help users enter a valid email address",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/email-addresses/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/email-addresses/index.md"
          }
        },
        {
          nativeId: "equality-information",
          name: "Equality information",
          summary: "This pattern explains how to ask users for equality information",
          kind: "pattern",
          aliases: [
            "protected characteristics",
            "ethnic group",
            "diversity",
            "demographic",
            "age",
            "disability",
            "marriage",
            "civil partnership",
            "religion",
            "sex",
            "gender identity",
            "sexual orientation"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/equality-information/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/equality-information/index.md"
          }
        },
        {
          nativeId: "error-message",
          name: "Error message",
          summary: "When there's a validation error, use an error message to explain what went wrong and how to fix it",
          kind: "component",
          aliases: [
            "validation message"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/error-message/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/error-message/index.md"
          }
        },
        {
          nativeId: "error-summary",
          name: "Error summary",
          summary: "Use an error summary when there is a validation error",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/error-summary/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/error-summary/index.md"
          }
        },
        {
          nativeId: "ethnic-group",
          name: "Ethnic groups",
          summary: null,
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/ethnic-group/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/ethnic-group/index.md"
          }
        },
        {
          nativeId: "exit-a-page-quickly",
          name: "Exit a page quickly",
          summary: "Give users a way to quickly and safely exit a service, website or application.",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/exit-a-page-quickly/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/exit-a-page-quickly/index.md"
          }
        },
        {
          nativeId: "exit-this-page",
          name: "Exit this page",
          summary: "Give users a way to quickly and safely exit a service, website or application.",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/exit-this-page/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/exit-this-page/index.md"
          }
        },
        {
          nativeId: "fieldset",
          name: "Fieldset",
          summary: "Use the fieldset component to group related form inputs",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/fieldset/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/fieldset/index.md"
          }
        },
        {
          nativeId: "file-upload",
          name: "File upload",
          summary: "Help users select and upload a file",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/file-upload/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/file-upload/index.md"
          }
        },
        {
          nativeId: "footer",
          name: "GOV.UK footer",
          summary: "The footer provides copyright, licensing and other information about your service and department",
          kind: "component",
          aliases: [
            "privacy notice",
            "accessibility statement",
            "terms and conditions"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/footer/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/footer/index.md"
          }
        },
        {
          nativeId: "gender-or-sex",
          name: "Gender or sex",
          summary: null,
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/gender-or-sex/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/gender-or-sex/index.md"
          }
        },
        {
          nativeId: "generic-header",
          name: "Generic header",
          summary: "A generic header to help services not on GOV.UK",
          kind: "component",
          aliases: [
            "Header (generic)"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/generic-header/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/generic-header/index.md"
          }
        },
        {
          nativeId: "header",
          name: "GOV.UK header",
          summary: "The GOV.UK header shows users that they are on GOV.UK",
          kind: "component",
          aliases: [
            "GOV.UK masthead"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/header/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/header/index.md"
          }
        },
        {
          nativeId: "inset-text",
          name: "Inset text",
          summary: "Use the inset text component to differentiate a block of text from the content that surrounds it",
          kind: "component",
          aliases: [
            "highlighted text",
            "callout"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/inset-text/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/inset-text/index.md"
          }
        },
        {
          nativeId: "interruption-pages",
          name: "Interruption pages",
          summary: "Pause the user journey to give them important information",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/interruption-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/interruption-pages/index.md"
          }
        },
        {
          nativeId: "names",
          name: "Names",
          summary: "Help users correctly enter their name",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/names/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/names/index.md"
          }
        },
        {
          nativeId: "national-insurance-numbers",
          name: "National Insurance numbers",
          summary: "Ask users to provide their National Insurance number",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/national-insurance-numbers/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/national-insurance-numbers/index.md"
          }
        },
        {
          nativeId: "navigate-a-service",
          name: "Navigate a service",
          summary: "Help users know they\u2019re using your service and navigate around it",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/navigate-a-service/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/navigate-a-service/index.md"
          }
        },
        {
          nativeId: "notification-banner",
          name: "Notification banner",
          summary: "Use a notification banner to tell the user about something they need to know about, but that\u2019s not directly related to the page content",
          kind: "component",
          aliases: [
            "alert",
            "warning",
            "success message",
            "important message",
            "flash message"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/notification-banner/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/notification-banner/index.md"
          }
        },
        {
          nativeId: "page-not-found-pages",
          name: "Page not found pages",
          summary: "A page not found tells someone we cannot find the page they were trying to view. They are also known as 404 pages.",
          kind: "pattern",
          aliases: [
            '"404"'
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/page-not-found-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/page-not-found-pages/index.md"
          }
        },
        {
          nativeId: "pagination",
          name: "Pagination",
          summary: "Help users navigate collections of numbered pages like search results",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/pagination/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/pagination/index.md"
          }
        },
        {
          nativeId: "panel",
          name: "Panel",
          summary: "Use the Panel component to display important information in within confirmation and interruption pages",
          kind: "component",
          aliases: [
            "confirmation box",
            "results box",
            "reference number",
            "application complete",
            "application number"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/panel/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/panel/index.md"
          }
        },
        {
          nativeId: "password-input",
          name: "Password input",
          summary: "Help users accessibly enter passwords",
          kind: "component",
          aliases: [
            "pass word",
            "pass phrase"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/password-input/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/password-input/index.md"
          }
        },
        {
          nativeId: "passwords",
          name: "Passwords",
          summary: "Help users to create and enter secure and memorable passwords",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/passwords/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/passwords/index.md"
          }
        },
        {
          nativeId: "payment-card-details",
          name: "Payment card details",
          summary: "How to ask users for their payment card details",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/payment-card-details/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/payment-card-details/index.md"
          }
        },
        {
          nativeId: "phase-banner",
          name: "Phase banner",
          summary: "Use the phase banner component to show users your service is still being worked on",
          kind: "component",
          aliases: [
            "alpha banner",
            "beta banner",
            "prototype banner",
            "status banner",
            "feedback banner"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/phase-banner/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/phase-banner/index.md"
          }
        },
        {
          nativeId: "phone-numbers",
          name: "Phone numbers",
          summary: "Help users enter a valid phone number",
          kind: "pattern",
          aliases: [
            "phone numbers",
            "telephone"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/phone-numbers/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/phone-numbers/index.md"
          }
        },
        {
          nativeId: "problem-with-the-service-pages",
          name: "There is a problem with the service pages",
          summary: "This is a page that tells someone there is something wrong with the service. They are also known as 500 pages",
          kind: "pattern",
          aliases: [
            '"500"'
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/problem-with-the-service-pages/index.md"
          }
        },
        {
          nativeId: "question-pages",
          name: "Question pages",
          summary: "Follow this pattern whenever you need to ask users questions within your service",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/question-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/question-pages/index.md"
          }
        },
        {
          nativeId: "radios",
          name: "Radios",
          summary: "Let users select a single option from a list using the radios component",
          kind: "component",
          aliases: [
            "radio buttons",
            "option buttons"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/radios/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/radios/index.md"
          }
        },
        {
          nativeId: "select",
          name: "Select",
          summary: "Help users select an item from a list",
          kind: "component",
          aliases: [
            "dropdown",
            "list box",
            "combo box",
            "pop-up menu"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/select/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/select/index.md"
          }
        },
        {
          nativeId: "service-navigation",
          name: "Service navigation",
          summary: "Service navigation helps users understand that they\u2019re using your service and lets them navigate around your service",
          kind: "component",
          aliases: [
            "Primary navigation"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/service-navigation/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/service-navigation/index.md"
          }
        },
        {
          nativeId: "service-unavailable-pages",
          name: "Service unavailable pages",
          summary: "This is a page that tells someone a service is unavailable. It should say when the service will be available or what to do if it is permanently closed",
          kind: "pattern",
          aliases: [
            '"503"'
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/service-unavailable-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/service-unavailable-pages/index.md"
          }
        },
        {
          nativeId: "skip-link",
          name: "Skip link",
          summary: "Use the skip link component to help keyboard-only users skip to the main content on a page",
          kind: "component",
          aliases: [
            "Skip navigation link"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/skip-link/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/skip-link/index.md"
          }
        },
        {
          nativeId: "start-pages",
          name: "Start pages",
          summary: null,
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/start-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/start-pages/index.md"
          }
        },
        {
          nativeId: "start-using-a-service",
          name: "Start using a service",
          summary: "Create a starting point for your digital service on GOV.UK",
          kind: "pattern",
          aliases: [
            "start page",
            "start pages"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/start-using-a-service/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/start-using-a-service/index.md"
          }
        },
        {
          nativeId: "step-by-step-navigation",
          name: "Step by step navigation",
          summary: "A starting point for your digital service on GOV.UK",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/step-by-step-navigation/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/step-by-step-navigation/index.md"
          }
        },
        {
          nativeId: "summary-list",
          name: "Summary list",
          summary: "Use the summary list to summarise information, for example, a user\u2019s responses at the end of a form.",
          kind: "component",
          aliases: [
            "Summary card"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/summary-list/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/summary-list/index.md"
          }
        },
        {
          nativeId: "table",
          name: "Table",
          summary: "Use the table component to make information easier to compare and scan for users",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/table/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/table/index.md"
          }
        },
        {
          nativeId: "tabs",
          name: "Tabs",
          summary: "Tabs can be a helpful way of letting users quickly switch between related information",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/tabs/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/tabs/index.md"
          }
        },
        {
          nativeId: "tag",
          name: "Tag",
          summary: "The Tag component indicates the status of something, such as an item on a task list or a phase banner",
          kind: "component",
          aliases: [
            "chip",
            "badge",
            "flag",
            "token"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/tag/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/tag/index.md"
          }
        },
        {
          nativeId: "task-list",
          name: "Task list",
          summary: "The task list component displays all the tasks a user needs to do, and allows users to easily identify which ones are done and which they still need to do.",
          kind: "component",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/components/task-list/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/task-list/index.md"
          }
        },
        {
          nativeId: "task-list-pages",
          name: "Task list pages",
          summary: null,
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/task-list-pages/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/task-list-pages/index.md"
          }
        },
        {
          nativeId: "text-input",
          name: "Text input",
          summary: "Help users enter information with the text input component",
          kind: "component",
          aliases: [
            "text box",
            "text field",
            "input field",
            "text entry box"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/text-input/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/text-input/index.md"
          }
        },
        {
          nativeId: "textarea",
          name: "Textarea",
          summary: "Help users provide detailed information using the textarea component",
          kind: "component",
          aliases: [
            "multi-line text box",
            "multi-line text field"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/textarea/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/textarea/index.md"
          }
        },
        {
          nativeId: "understand-the-impact-of-an-emergency",
          name: "Understand the impact of an emergency on your service",
          summary: null,
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/understand-the-impact-of-an-emergency/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/understand-the-impact-of-an-emergency/index.md"
          }
        },
        {
          nativeId: "validation",
          name: "Recover from validation errors",
          summary: "Check the answers users give to make sure they\u2019re valid - and if there\u2019s an error, tell them what's wrong and how to fix it",
          kind: "pattern",
          aliases: [],
          canonicalUrl: "https://design-system.service.gov.uk/patterns/validation/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/patterns/validation/index.md"
          }
        },
        {
          nativeId: "warning-text",
          name: "Warning text",
          summary: "Use the warning text component when you need to warn users about something important, such as legal consequences of an action, or lack of action, that they might take",
          kind: "component",
          aliases: [
            "important text",
            "legal text"
          ],
          canonicalUrl: "https://design-system.service.gov.uk/components/warning-text/",
          provenance: {
            providerId: "govuk-design-system",
            repository: "https://github.com/alphagov/govuk-design-system",
            revision: "b3536490dfea80a32968cf61e8b00d75530d80bd",
            sourcePath: "src/components/warning-text/index.md"
          }
        }
      ]
    },
    {
      id: "uswds",
      name: "U.S. Web Design System",
      homepage: "https://designsystem.digital.gov/",
      source: {
        adapter: "uswds",
        repository: "https://github.com/uswds/uswds",
        revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
        observedAt: "2026-07-17T13:39:20-04:00",
        format: "Storybook default-export metadata",
        inputPath: "providers/sources/uswds.json",
        sourcePaths: [
          "packages/usa-*/src/*.stories.js"
        ]
      },
      license: {
        expression: "CC0-1.0",
        url: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/LICENSE.md",
        scope: "metadata-only",
        notice: "Only component names and Storybook grouping metadata are ingested; excluded font, icon, and third-party assets are not copied."
      },
      freshness: {
        staleAfterDays: 45
      },
      build: {
        mode: "current",
        inputSha256: "f938d2fc8df73f77634cf0f59e389c669da7ae0130537548ca5f0326e9a43d7c",
        failure: null
      },
      records: [
        {
          nativeId: "usa-accordion",
          name: "Accordion",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-accordion/src/usa-accordion.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-accordion/src/usa-accordion.stories.js"
          }
        },
        {
          nativeId: "usa-add-aspect",
          name: "Add Aspect",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-add-aspect/src/usa-add-aspect.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-add-aspect/src/usa-add-aspect.stories.js"
          }
        },
        {
          nativeId: "usa-alert",
          name: "Alert",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-alert/src/usa-alert.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-alert/src/usa-alert.stories.js"
          }
        },
        {
          nativeId: "usa-banner",
          name: "Banner",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-banner/src/usa-banner.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-banner/src/usa-banner.stories.js"
          }
        },
        {
          nativeId: "usa-breadcrumb",
          name: "Breadcrumb",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-breadcrumb/src/usa-breadcrumb.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-breadcrumb/src/usa-breadcrumb.stories.js"
          }
        },
        {
          nativeId: "usa-button",
          name: "Button",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-button/src/usa-button.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-button/src/usa-button.stories.js"
          }
        },
        {
          nativeId: "usa-button-group",
          name: "Button Group",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-button-group/src/usa-button-group.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-button-group/src/usa-button-group.stories.js"
          }
        },
        {
          nativeId: "usa-card",
          name: "Card",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-card/src/usa-card.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-card/src/usa-card.stories.js"
          }
        },
        {
          nativeId: "usa-character-count",
          name: "Character Count",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-character-count/src/usa-character-count.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-character-count/src/usa-character-count.stories.js"
          }
        },
        {
          nativeId: "usa-checkbox",
          name: "Checkbox",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-checkbox/src/usa-checkbox.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-checkbox/src/usa-checkbox.stories.js"
          }
        },
        {
          nativeId: "usa-checklist",
          name: "Checklist",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-checklist/src/usa-checklist.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-checklist/src/usa-checklist.stories.js"
          }
        },
        {
          nativeId: "usa-collection",
          name: "Collection",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-collection/src/usa-collection.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-collection/src/usa-collection.stories.js"
          }
        },
        {
          nativeId: "usa-combo-box",
          name: "Combo Box",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-combo-box/src/usa-combo-box.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-combo-box/src/usa-combo-box.stories.js"
          }
        },
        {
          nativeId: "usa-date-picker",
          name: "Date Picker",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-date-picker/src/usa-date-picker.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-date-picker/src/usa-date-picker.stories.js"
          }
        },
        {
          nativeId: "usa-date-range-picker",
          name: "Date Range Picker",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-date-range-picker/src/date-range-picker.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-date-range-picker/src/date-range-picker.stories.js"
          }
        },
        {
          nativeId: "usa-embed-container",
          name: "Embed Container",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-embed-container/src/usa-embed-container.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-embed-container/src/usa-embed-container.stories.js"
          }
        },
        {
          nativeId: "usa-file-input",
          name: "File Input",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-file-input/src/usa-file-input.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-file-input/src/usa-file-input.stories.js"
          }
        },
        {
          nativeId: "usa-fonts",
          name: "Fonts",
          summary: null,
          kind: "design tokens",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-fonts/src/usa-fonts.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-fonts/src/usa-fonts.stories.js"
          }
        },
        {
          nativeId: "usa-footer",
          name: "Footer",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-footer/src/usa-footer.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-footer/src/usa-footer.stories.js"
          }
        },
        {
          nativeId: "usa-form",
          name: "Forms",
          summary: null,
          kind: "patterns",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-form/src/usa-form.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-form/src/usa-form.stories.js"
          }
        },
        {
          nativeId: "usa-graphic-list",
          name: "Graphic List",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-graphic-list/src/usa-graphic-list.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-graphic-list/src/usa-graphic-list.stories.js"
          }
        },
        {
          nativeId: "usa-header",
          name: "Header",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-header/src/usa-header.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-header/src/usa-header.stories.js"
          }
        },
        {
          nativeId: "usa-hero",
          name: "Hero",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-hero/src/usa-hero.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-hero/src/usa-hero.stories.js"
          }
        },
        {
          nativeId: "usa-icon",
          name: "Icons",
          summary: null,
          kind: "design tokens",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-icon/src/usa-icon.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-icon/src/usa-icon.stories.js"
          }
        },
        {
          nativeId: "usa-icon-list",
          name: "Icon List",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-icon-list/src/usa-icon-list.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-icon-list/src/usa-icon-list.stories.js"
          }
        },
        {
          nativeId: "usa-identifier",
          name: "Identifier",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-identifier/src/usa-identifier.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-identifier/src/usa-identifier.stories.js"
          }
        },
        {
          nativeId: "usa-in-page-navigation",
          name: "In-Page Navigation",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-in-page-navigation/src/usa-in-page-navigation.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-in-page-navigation/src/usa-in-page-navigation.stories.js"
          }
        },
        {
          nativeId: "usa-input",
          name: "Text Input",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input/src/usa-input.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-input/src/usa-input.stories.js"
          }
        },
        {
          nativeId: "usa-input-mask",
          name: "Text Input Mask",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input-mask/src/usa-input-mask.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-input-mask/src/usa-input-mask.stories.js"
          }
        },
        {
          nativeId: "usa-input-prefix-suffix",
          name: "Input Prefix or Suffix",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-input-prefix-suffix/src/usa-input-prefix-suffix.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-input-prefix-suffix/src/usa-input-prefix-suffix.stories.js"
          }
        },
        {
          nativeId: "usa-language-selector",
          name: "Language Selector",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-language-selector/src/usa-language-selector.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-language-selector/src/usa-language-selector.stories.js"
          }
        },
        {
          nativeId: "usa-link",
          name: "Link",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-link/src/usa-link.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-link/src/usa-link.stories.js"
          }
        },
        {
          nativeId: "usa-list",
          name: "List",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-list/src/usa-list.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-list/src/usa-list.stories.js"
          }
        },
        {
          nativeId: "usa-media-block",
          name: "Media Block",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-media-block/src/usa-media-block.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-media-block/src/usa-media-block.stories.js"
          }
        },
        {
          nativeId: "usa-memorable-date",
          name: "Memorable Date",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-memorable-date/src/usa-memorable-date.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-memorable-date/src/usa-memorable-date.stories.js"
          }
        },
        {
          nativeId: "usa-modal",
          name: "Modal",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-modal/src/usa-modal.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-modal/src/usa-modal.stories.js"
          }
        },
        {
          nativeId: "usa-pagination",
          name: "Pagination",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-pagination/src/usa-pagination.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-pagination/src/usa-pagination.stories.js"
          }
        },
        {
          nativeId: "usa-process-list",
          name: "Process List",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-process-list/src/usa-process-list.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-process-list/src/usa-process-list.stories.js"
          }
        },
        {
          nativeId: "usa-prose",
          name: "Prose",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-prose/src/usa-prose.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-prose/src/usa-prose.stories.js"
          }
        },
        {
          nativeId: "usa-radio",
          name: "Radio",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-radio/src/usa-radio.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-radio/src/usa-radio.stories.js"
          }
        },
        {
          nativeId: "usa-range",
          name: "Range",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-range/src/usa-range.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-range/src/usa-range.stories.js"
          }
        },
        {
          nativeId: "usa-search",
          name: "Search",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-search/src/usa-search.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-search/src/usa-search.stories.js"
          }
        },
        {
          nativeId: "usa-section",
          name: "Section",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-section/src/usa-section.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-section/src/usa-section.stories.js"
          }
        },
        {
          nativeId: "usa-select",
          name: "Select",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-select/src/usa-select.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-select/src/usa-select.stories.js"
          }
        },
        {
          nativeId: "usa-sidenav",
          name: "Side Navigation",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-sidenav/src/usa-sidenav.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-sidenav/src/usa-sidenav.stories.js"
          }
        },
        {
          nativeId: "usa-site-alert",
          name: "Site Alert",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-site-alert/src/usa-site-alert.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-site-alert/src/usa-site-alert.stories.js"
          }
        },
        {
          nativeId: "usa-site-title",
          name: "Site Title",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-site-title/src/usa-site-title.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-site-title/src/usa-site-title.stories.js"
          }
        },
        {
          nativeId: "usa-skipnav",
          name: "Skipnav",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-skipnav/src/usa-skipnav.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-skipnav/src/usa-skipnav.stories.js"
          }
        },
        {
          nativeId: "usa-step-indicator",
          name: "Step Indicator",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-step-indicator/src/usa-step-indicator.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-step-indicator/src/usa-step-indicator.stories.js"
          }
        },
        {
          nativeId: "usa-summary-box",
          name: "Summary Box",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-summary-box/src/usa-summary-box.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-summary-box/src/usa-summary-box.stories.js"
          }
        },
        {
          nativeId: "usa-table",
          name: "Table",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-table/src/usa-table.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-table/src/usa-table.stories.js"
          }
        },
        {
          nativeId: "usa-tag",
          name: "Tags",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-tag/src/usa-tag.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-tag/src/usa-tag.stories.js"
          }
        },
        {
          nativeId: "usa-time-picker",
          name: "Time Picker",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-time-picker/src/usa-time-picker.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-time-picker/src/usa-time-picker.stories.js"
          }
        },
        {
          nativeId: "usa-tooltip",
          name: "Tooltip",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-tooltip/src/usa-tooltip.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-tooltip/src/usa-tooltip.stories.js"
          }
        },
        {
          nativeId: "usa-validation",
          name: "Validation",
          summary: null,
          kind: "components",
          aliases: [],
          canonicalUrl: "https://github.com/uswds/uswds/blob/7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e/packages/usa-validation/src/usa-validation.stories.js",
          provenance: {
            providerId: "uswds",
            repository: "https://github.com/uswds/uswds",
            revision: "7e3a5076dc4ec1922a19bb17a17adc93bbeb5f1e",
            sourcePath: "packages/usa-validation/src/usa-validation.stories.js"
          }
        }
      ]
    }
  ]
};

// providers/schema.ts
var providerIdPattern = /^[a-z0-9][a-z0-9._-]*$/;
var sha256Pattern = /^[a-f0-9]{64}$/;
var gitRevisionPattern = /^[a-f0-9]{40}$/;
var providerIdSchema = external_exports.string().min(1).max(80).regex(providerIdPattern);
var providerDefinitionSchema = external_exports.object({
  id: providerIdSchema,
  name: external_exports.string().min(1).max(160),
  homepage: external_exports.url(),
  adapter: external_exports.enum(["govuk-design-system", "uswds"]),
  source: external_exports.object({
    repository: external_exports.url(),
    revision: external_exports.string().regex(gitRevisionPattern),
    observedAt: external_exports.iso.datetime({ offset: true }),
    format: external_exports.string().min(1).max(120),
    inputPath: external_exports.string().min(1),
    sourcePaths: external_exports.array(external_exports.string().min(1)).min(1)
  }).strict(),
  license: external_exports.object({
    expression: external_exports.string().min(1).max(120),
    url: external_exports.url(),
    scope: external_exports.literal("metadata-only"),
    notice: external_exports.string().min(1).max(500)
  }).strict(),
  freshness: external_exports.object({
    staleAfterDays: external_exports.number().int().positive().max(365)
  }).strict()
}).strict();
var providerLockSchema = external_exports.object({
  schemaVersion: external_exports.literal("1"),
  inputs: external_exports.record(providerIdSchema, external_exports.string().regex(sha256Pattern))
}).strict();
var providerRecordSchema = external_exports.object({
  nativeId: external_exports.string().min(1).max(240),
  name: external_exports.string().min(1).max(240),
  summary: external_exports.string().min(1).max(1e3).nullable(),
  kind: external_exports.string().min(1).max(120),
  aliases: external_exports.array(external_exports.string().min(1).max(240)),
  canonicalUrl: external_exports.url(),
  provenance: external_exports.object({
    providerId: providerIdSchema,
    repository: external_exports.url(),
    revision: external_exports.string().regex(gitRevisionPattern),
    sourcePath: external_exports.string().min(1)
  }).strict()
}).strict();
var providerBuildSchema = external_exports.object({
  mode: external_exports.enum(["current", "last-known-good"]),
  inputSha256: external_exports.string().regex(sha256Pattern),
  failure: external_exports.object({
    code: external_exports.string().min(1).max(120),
    candidateRevision: external_exports.string().regex(gitRevisionPattern),
    candidateInputSha256: external_exports.string().regex(sha256Pattern).nullable()
  }).strict().nullable()
}).strict();
var providerSnapshotSchema = external_exports.object({
  id: providerIdSchema,
  name: external_exports.string().min(1).max(160),
  homepage: external_exports.url(),
  source: external_exports.object({
    adapter: external_exports.string().min(1).max(120),
    repository: external_exports.url(),
    revision: external_exports.string().regex(gitRevisionPattern),
    observedAt: external_exports.iso.datetime({ offset: true }),
    format: external_exports.string().min(1).max(120),
    inputPath: external_exports.string().min(1),
    sourcePaths: external_exports.array(external_exports.string().min(1)).min(1)
  }).strict(),
  license: providerDefinitionSchema.shape.license,
  freshness: providerDefinitionSchema.shape.freshness,
  build: providerBuildSchema,
  records: external_exports.array(providerRecordSchema)
}).strict();
var federatedSnapshotSchema = external_exports.object({
  schemaVersion: external_exports.literal("1"),
  assembledAt: external_exports.iso.datetime({ offset: true }),
  fingerprint: external_exports.string().regex(sha256Pattern),
  providers: external_exports.array(providerSnapshotSchema)
}).strict();
var providerDocumentSchema = providerRecordSchema.extend({
  providerName: external_exports.string().min(1).max(160),
  key: external_exports.string().min(1),
  search: external_exports.object({
    name: external_exports.array(external_exports.string().min(1)),
    aliases: external_exports.array(external_exports.string().min(1)),
    summary: external_exports.array(external_exports.string().min(1)),
    kind: external_exports.array(external_exports.string().min(1)),
    nativeId: external_exports.array(external_exports.string().min(1))
  }).strict()
});
var providerIndexSchema = external_exports.object({
  schemaVersion: external_exports.literal("1"),
  snapshotFingerprint: external_exports.string().regex(sha256Pattern),
  documents: external_exports.array(providerDocumentSchema),
  postings: external_exports.record(external_exports.string().min(1), external_exports.array(external_exports.string().min(1)))
}).strict();

// providers/generated.ts
var providerSnapshot = federatedSnapshotSchema.parse(
  provider_snapshot_v1_default
);
var providerIndex = providerIndexSchema.parse(provider_index_v1_default);
if (providerIndex.snapshotFingerprint !== providerSnapshot.fingerprint) {
  throw new Error(
    "Provider index does not match the bundled provider snapshot."
  );
}

// providers/health.ts
var millisecondsPerDay = 864e5;
function assessProviderHealth(provider, now = /* @__PURE__ */ new Date()) {
  if (!provider) {
    return {
      health: "unavailable",
      availability: "unavailable",
      freshness: "unknown",
      observedAt: null,
      staleAt: null,
      reason: "no-last-known-good-snapshot"
    };
  }
  const observedAt = new Date(provider.source.observedAt);
  const staleAt = new Date(
    observedAt.getTime() + provider.freshness.staleAfterDays * millisecondsPerDay
  );
  const freshness = now.getTime() > staleAt.getTime() ? "stale" : "fresh";
  const availability = provider.build.mode === "current" ? "current" : "last-known-good";
  const degraded = freshness === "stale" || availability === "last-known-good";
  return {
    health: degraded ? "degraded" : "healthy",
    availability,
    freshness,
    observedAt: provider.source.observedAt,
    staleAt: staleAt.toISOString(),
    reason: provider.build.failure?.code ?? (freshness === "stale" ? "freshness-window-exceeded" : null)
  };
}

// providers/adapters/govuk-design-system.ts
var govukInputSchema = external_exports.object({
  schemaVersion: external_exports.literal("1"),
  revision: external_exports.string(),
  documents: external_exports.array(
    external_exports.object({
      path: external_exports.string().min(1),
      frontmatter: external_exports.object({
        title: external_exports.string().min(1),
        description: external_exports.string().nullable(),
        section: external_exports.string().nullable(),
        aliases: external_exports.string().nullable()
      }).strict()
    }).strict()
  )
}).strict();
function aliasesFromFrontmatter(value) {
  if (!value) return [];
  return value.split(",").map((alias) => alias.trim()).filter(Boolean);
}
function recordKind(path) {
  const match = path.match(/^src\/(components|patterns)\//);
  if (!match?.[1]) {
    throw new Error(`Unsupported GOV.UK Design System record path: ${path}`);
  }
  return match[1] === "components" ? "component" : "pattern";
}
function nativeId(path) {
  const match = path.match(/^src\/(?:components|patterns)\/([^/]+)\/index\.md$/);
  if (!match?.[1]) {
    throw new Error(`Cannot derive a source-native GOV.UK id from ${path}`);
  }
  return match[1];
}
var govukDesignSystemAdapter = {
  id: "govuk-design-system",
  version: "1",
  adapt(definition, input) {
    const source = govukInputSchema.parse(input);
    if (source.revision !== definition.source.revision) {
      throw new Error(
        `GOV.UK source revision ${source.revision} does not match ${definition.source.revision}.`
      );
    }
    return source.documents.map(({ path, frontmatter }) => {
      const id = nativeId(path);
      const kind = recordKind(path);
      const declaredKind = frontmatter.section?.toLocaleLowerCase();
      if (declaredKind && declaredKind !== `${kind}s`) {
        throw new Error(
          `GOV.UK record ${path} declares section ${frontmatter.section}, expected ${kind}.`
        );
      }
      return {
        nativeId: id,
        name: frontmatter.title,
        summary: frontmatter.description,
        kind,
        aliases: aliasesFromFrontmatter(frontmatter.aliases),
        canonicalUrl: `https://design-system.service.gov.uk/${kind}s/${id}/`,
        provenance: {
          providerId: definition.id,
          repository: definition.source.repository,
          revision: definition.source.revision,
          sourcePath: path
        }
      };
    });
  }
};

// providers/adapters/uswds.ts
var uswdsInputSchema = external_exports.object({
  schemaVersion: external_exports.literal("1"),
  revision: external_exports.string(),
  packageVersion: external_exports.string().min(1),
  stories: external_exports.array(
    external_exports.object({
      path: external_exports.string().min(1),
      title: external_exports.string().min(1)
    }).strict()
  )
}).strict();
function sourceNativeId(path) {
  const match = path.match(/^packages\/(usa-[^/]+)\//);
  if (!match?.[1]) {
    throw new Error(`Cannot derive a source-native USWDS id from ${path}`);
  }
  return match[1];
}
function storyMetadata(title) {
  const parts = title.split("/").map((part) => part.trim()).filter(Boolean);
  const name = parts.at(-1);
  const root = parts.at(0);
  if (!name || !root) {
    throw new Error(`Invalid USWDS Storybook title: ${title}`);
  }
  return {
    name,
    kind: root.toLocaleLowerCase()
  };
}
var uswdsAdapter = {
  id: "uswds",
  version: "1",
  adapt(definition, input) {
    const source = uswdsInputSchema.parse(input);
    if (source.revision !== definition.source.revision) {
      throw new Error(
        `USWDS source revision ${source.revision} does not match ${definition.source.revision}.`
      );
    }
    return source.stories.map(({ path, title }) => {
      const id = sourceNativeId(path);
      const metadata = storyMetadata(title);
      return {
        nativeId: id,
        name: metadata.name,
        summary: null,
        kind: metadata.kind,
        aliases: [],
        canonicalUrl: `${definition.source.repository}/blob/${definition.source.revision}/${path}`,
        provenance: {
          providerId: definition.id,
          repository: definition.source.repository,
          revision: definition.source.revision,
          sourcePath: path
        }
      };
    });
  }
};

// providers/adapters/index.ts
var adapters = /* @__PURE__ */ new Map([
  [govukDesignSystemAdapter.id, govukDesignSystemAdapter],
  [uswdsAdapter.id, uswdsAdapter]
]);
function adapterVersionFor(adapterId) {
  const adapter = adapters.get(adapterId);
  if (!adapter) {
    throw new Error(`No adapter registered for ${adapterId}.`);
  }
  return adapter.version;
}

// providers/policy.ts
var acceptedMetadataLicenses = /* @__PURE__ */ new Map([
  ["MIT", { requiresNotice: true }],
  ["CC0-1.0", { requiresNotice: false }]
]);
var providerLicensePolicy = Object.freeze({
  version: "1",
  ingestionScope: "metadata-only",
  acceptedExpressions: [...acceptedMetadataLicenses.keys()].sort()
});

// providers/build.ts
function normalizeProviderSearchText(value) {
  return value.normalize("NFKD").toLocaleLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean);
}

// providers/search.ts
var weights = {
  name: 1e3,
  aliases: 700,
  nativeId: 600,
  kind: 120,
  summary: 80
};
function scoreField(queryTerms, terms, weight) {
  let score = 0;
  let exact = 0;
  let prefix = 0;
  for (const query of queryTerms) {
    if (terms.includes(query)) {
      score += weight;
      exact += 1;
      continue;
    }
    if (terms.some((term) => term.startsWith(query))) {
      score += Math.round(weight * 0.6);
      prefix += 1;
    }
  }
  return { score, exact, prefix };
}
function scoreDocument(document, queryTerms) {
  let score = 0;
  let exact = 0;
  let prefix = 0;
  for (const field of Object.keys(weights)) {
    const match = scoreField(
      queryTerms,
      document.search[field],
      weights[field]
    );
    score += match.score;
    exact += match.exact;
    prefix += match.prefix;
  }
  return { score, exact, prefix };
}
function searchProviderIndex(index, {
  query = "",
  providerId,
  kind,
  limit = 50
} = {}) {
  const queryTerms = normalizeProviderSearchText(query);
  const normalizedKind = kind?.toLocaleLowerCase();
  const candidates = index.documents.filter(
    (document) => !providerId || document.provenance.providerId === providerId
  ).filter(
    (document) => !normalizedKind || document.kind.toLocaleLowerCase() === normalizedKind
  );
  if (!queryTerms.length) {
    return {
      mode: "browse",
      queryTerms,
      results: candidates.slice().sort(
        (left, right) => left.name.localeCompare(right.name) || left.provenance.providerId.localeCompare(
          right.provenance.providerId
        )
      ).slice(0, limit).map((record2) => ({ record: record2, score: 0 }))
    };
  }
  const scored = candidates.map((record2) => ({
    record: record2,
    ...scoreDocument(record2, queryTerms)
  })).filter(({ exact, prefix }) => exact + prefix > 0).sort(
    (left, right) => right.score - left.score || left.record.name.localeCompare(right.record.name) || left.record.provenance.providerId.localeCompare(
      right.record.provenance.providerId
    )
  );
  const complete = scored.filter(
    ({ exact, prefix }) => exact + prefix >= queryTerms.length
  );
  const results = complete.length ? complete : scored;
  const mode = complete.length ? complete.some(({ prefix }) => prefix > 0) ? "prefix" : "exact" : "expanded";
  return {
    mode,
    queryTerms,
    results: results.slice(0, limit).map(({ record: record2, score }) => ({ record: record2, score }))
  };
}
function findProviderRecord(index, providerId, nativeId2) {
  return index.documents.find(
    (document) => document.provenance.providerId === providerId && document.nativeId === nativeId2
  ) ?? null;
}

// providers/source-browser.ts
var contentModeSchema = external_exports.enum([
  "metadata-only",
  "excerpt",
  "redistributable"
]);
var contentKindSchema = external_exports.enum([
  "component",
  "pattern",
  "guidance",
  "unknown"
]);
var libraryProviderSchema = external_exports.object({
  id: external_exports.string().min(1),
  name: external_exports.string().min(1),
  homepageUrl: external_exports.url(),
  adapterVersion: external_exports.string().min(1),
  upstream: external_exports.object({
    kind: external_exports.enum(["git", "npm", "json"]),
    locator: external_exports.string().min(1)
  }).strict(),
  license: external_exports.object({
    id: external_exports.string().min(1),
    url: external_exports.url(),
    attribution: external_exports.string().min(1).optional(),
    contentMode: contentModeSchema
  }).strict()
}).strict();
var sourceItemLinkSchema = external_exports.object({
  kind: external_exports.enum(["docs", "example", "code"]),
  url: external_exports.url()
}).strict();
var sourceItemSchema = external_exports.object({
  id: external_exports.custom(
    (value) => typeof value === "string" && value.indexOf(":") > 0 && value.indexOf(":") < value.length - 1,
    "Expected a provider-scoped source-native id."
  ),
  providerId: external_exports.string().min(1),
  nativeId: external_exports.string().min(1),
  title: external_exports.string().min(1),
  canonicalUrl: external_exports.url(),
  contentKind: contentKindSchema,
  aliases: external_exports.array(external_exports.string().min(1)),
  excerpt: external_exports.string().min(1).optional(),
  sourceSection: external_exports.string().min(1).optional(),
  sourceTags: external_exports.array(external_exports.string().min(1)),
  links: external_exports.array(sourceItemLinkSchema),
  provenance: external_exports.object({
    upstreamRevision: external_exports.string().min(1),
    retrievedAt: external_exports.string().min(1),
    contentMode: contentModeSchema
  }).strict()
}).strict();
var sourceBrowserSnapshotSchema = external_exports.object({
  providers: external_exports.array(libraryProviderSchema),
  items: external_exports.array(sourceItemSchema)
}).strict();
var sourceItemSearchInputSchema = external_exports.object({
  query: external_exports.string().max(500).optional(),
  providerId: external_exports.string().min(1).max(80).optional(),
  contentKind: contentKindSchema.optional(),
  limit: external_exports.number().int().min(1).max(100).optional()
}).strict();
var sourceItemSearchResultSchema = external_exports.object({
  mode: external_exports.enum(["browse", "exact", "prefix", "expanded"]),
  queryTerms: external_exports.array(external_exports.string()),
  items: external_exports.array(sourceItemSchema)
}).strict();
function contentKindFor(kind) {
  switch (kind.toLocaleLowerCase()) {
    case "component":
    case "components":
      return "component";
    case "pattern":
    case "patterns":
      return "pattern";
    default:
      return "unknown";
  }
}
function codeUrl(record2) {
  return `${record2.provenance.repository}/blob/${record2.provenance.revision}/${record2.provenance.sourcePath}`;
}
function linksFor(record2) {
  const sourceCodeUrl = codeUrl(record2);
  const links = [
    {
      kind: record2.canonicalUrl === sourceCodeUrl ? "code" : "docs",
      url: record2.canonicalUrl
    }
  ];
  if (record2.canonicalUrl !== sourceCodeUrl) {
    links.push({ kind: "code", url: sourceCodeUrl });
  }
  return links;
}
function toLibraryProvider(provider) {
  return {
    id: provider.id,
    name: provider.name,
    homepageUrl: provider.homepage,
    adapterVersion: adapterVersionFor(provider.source.adapter),
    upstream: {
      kind: "git",
      locator: provider.source.repository
    },
    license: {
      id: provider.license.expression,
      url: provider.license.url,
      ...provider.license.expression === "MIT" ? { attribution: provider.license.notice } : {},
      contentMode: provider.license.scope
    }
  };
}
function toSourceItem(provider, record2) {
  return {
    id: `${provider.id}:${record2.nativeId}`,
    providerId: provider.id,
    nativeId: record2.nativeId,
    title: record2.name,
    canonicalUrl: record2.canonicalUrl,
    contentKind: contentKindFor(record2.kind),
    aliases: [...record2.aliases],
    sourceSection: record2.kind,
    sourceTags: [],
    links: linksFor(record2),
    provenance: {
      upstreamRevision: record2.provenance.revision,
      retrievedAt: provider.source.observedAt,
      contentMode: provider.license.scope
    }
  };
}
function freezeProvider(provider) {
  Object.freeze(provider.upstream);
  Object.freeze(provider.license);
  return Object.freeze(provider);
}
function freezeItem(item) {
  Object.freeze(item.aliases);
  Object.freeze(item.sourceTags);
  for (const link of item.links) Object.freeze(link);
  Object.freeze(item.links);
  Object.freeze(item.provenance);
  return Object.freeze(item);
}
function createSourceBrowserSnapshot() {
  const parsed = sourceBrowserSnapshotSchema.parse({
    providers: providerSnapshot.providers.map(toLibraryProvider),
    items: providerSnapshot.providers.flatMap(
      (provider) => provider.records.map((record2) => toSourceItem(provider, record2))
    )
  });
  const providers = parsed.providers.map(freezeProvider);
  const items = parsed.items.map(freezeItem);
  return Object.freeze({
    providers: Object.freeze(providers),
    items: Object.freeze(items)
  });
}
var bundledSourceBrowserSnapshot = createSourceBrowserSnapshot();
var sourceItemsById = new Map(
  bundledSourceBrowserSnapshot.items.map((item) => [item.id, item])
);
function getSourceBrowserSnapshot() {
  return bundledSourceBrowserSnapshot;
}
function searchSourceItems(options = {}) {
  const parsed = sourceItemSearchInputSchema.parse(options);
  const limit = parsed.limit ?? 50;
  const result = searchProviderIndex(providerIndex, {
    query: parsed.query,
    providerId: parsed.providerId,
    limit: providerIndex.documents.length
  });
  const items = result.results.map(
    ({ record: record2 }) => sourceItemsById.get(
      `${record2.provenance.providerId}:${record2.nativeId}`
    )
  ).filter((item) => Boolean(item)).filter(
    (item) => !parsed.contentKind || item.contentKind === parsed.contentKind
  ).slice(0, limit);
  return Object.freeze({
    mode: result.mode,
    queryTerms: Object.freeze([...result.queryTerms]),
    items: Object.freeze(items)
  });
}

// providers/rpc.ts
var healthReportSchema = external_exports.object({
  health: external_exports.enum(["healthy", "degraded", "unavailable"]),
  availability: external_exports.enum(["current", "last-known-good", "unavailable"]),
  freshness: external_exports.enum(["fresh", "stale", "unknown"]),
  observedAt: external_exports.string().nullable(),
  staleAt: external_exports.string().nullable(),
  reason: external_exports.string().nullable()
}).strict();
var publicRecordSchema = providerRecordSchema.extend({
  providerName: external_exports.string().min(1)
});
var providerSummarySchema = external_exports.object({
  id: external_exports.string().min(1),
  name: external_exports.string().min(1),
  homepage: external_exports.url(),
  recordCount: external_exports.number().int().nonnegative(),
  license: external_exports.object({
    expression: external_exports.string().min(1),
    url: external_exports.url(),
    scope: external_exports.literal("metadata-only"),
    notice: external_exports.string().min(1)
  }).strict(),
  health: healthReportSchema
}).strict();
var sourceBrowserRpcContract = defineRpcContract({
  getSourceBrowserSnapshot: {
    input: external_exports.null(),
    output: sourceBrowserSnapshotSchema
  },
  searchSourceItems: {
    input: sourceItemSearchInputSchema,
    output: sourceItemSearchResultSchema
  }
});
var providerRpcContract = defineRpcContract({
  listProviders: {
    input: external_exports.null(),
    output: external_exports.object({
      providers: external_exports.array(providerSummarySchema),
      snapshotFingerprint: external_exports.string()
    }).strict()
  },
  searchProviderRecords: {
    input: external_exports.object({
      query: external_exports.string().max(500).optional(),
      providerId: external_exports.string().max(80).optional(),
      kind: external_exports.string().max(120).optional(),
      limit: external_exports.number().int().min(1).max(100).optional()
    }).strict(),
    output: external_exports.object({
      mode: external_exports.enum(["browse", "exact", "prefix", "expanded"]),
      queryTerms: external_exports.array(external_exports.string()),
      results: external_exports.array(
        external_exports.object({
          record: publicRecordSchema,
          score: external_exports.number().finite()
        }).strict()
      )
    }).strict()
  },
  getProviderRecord: {
    input: external_exports.object({
      providerId: external_exports.string().min(1).max(80),
      nativeId: external_exports.string().min(1).max(240)
    }).strict(),
    output: external_exports.object({
      record: publicRecordSchema.nullable()
    }).strict()
  }
});
function publicRecord(record2) {
  const {
    key: _key,
    search: _search,
    ...result
  } = record2;
  return result;
}
function registerProviderRpc(bb) {
  bb.rpc.register(sourceBrowserRpcContract, {
    getSourceBrowserSnapshot() {
      const snapshot = getSourceBrowserSnapshot();
      return {
        providers: [...snapshot.providers],
        items: [...snapshot.items]
      };
    },
    searchSourceItems(input) {
      const result = searchSourceItems(input);
      return {
        mode: result.mode,
        queryTerms: [...result.queryTerms],
        items: [...result.items]
      };
    }
  });
  bb.rpc.register(providerRpcContract, {
    listProviders() {
      const now = /* @__PURE__ */ new Date();
      return {
        providers: providerSnapshot.providers.map((provider) => ({
          id: provider.id,
          name: provider.name,
          homepage: provider.homepage,
          recordCount: provider.records.length,
          license: provider.license,
          health: assessProviderHealth(provider, now)
        })),
        snapshotFingerprint: providerSnapshot.fingerprint
      };
    },
    searchProviderRecords(input) {
      const result = searchProviderIndex(providerIndex, input);
      return {
        mode: result.mode,
        queryTerms: result.queryTerms,
        results: result.results.map(({ record: record2, score }) => ({
          record: publicRecord(record2),
          score
        }))
      };
    },
    getProviderRecord({ providerId, nativeId: nativeId2 }) {
      const record2 = findProviderRecord(
        providerIndex,
        providerId,
        nativeId2
      );
      return {
        record: record2 ? publicRecord(record2) : null
      };
    }
  });
}

// server.ts
async function plugin(bb) {
  registerProviderRpc(bb);
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
  bb.log.info("UI Patterns provider index loaded");
  bb.onDispose(() => bb.log.info("UI Patterns provider index disposed"));
}
export {
  plugin as default
};
//# sourceMappingURL=server.js.map
