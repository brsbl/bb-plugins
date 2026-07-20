export interface ApprovedEquivalenceGroup {
  canonicalName: string;
  sourceRecordIds: readonly `${string}:${string}`[];
}

/**
 * Reviewed semantic equivalences across approved sources.
 *
 * Records are never joined from name similarity alone. Each group represents
 * the same user-facing control or interaction model, even when a source names
 * the record after its implementation primitive or its accessibility pattern.
 */
export const approvedEquivalenceGroups = Object.freeze([
  {
    canonicalName: "Accordion",
    sourceRecordIds: [
      "aria-apg:accordion",
      "base-ui:accordion",
      "shadcn-ui:accordion",
    ],
  },
  {
    canonicalName: "Alert",
    sourceRecordIds: ["aria-apg:alert", "shadcn-ui:alert"],
  },
  {
    canonicalName: "Alert Dialog",
    sourceRecordIds: [
      "aria-apg:alertdialog",
      "base-ui:alert-dialog",
      "shadcn-ui:alert-dialog",
    ],
  },
  {
    canonicalName: "Avatar",
    sourceRecordIds: ["base-ui:avatar", "shadcn-ui:avatar"],
  },
  {
    canonicalName: "Breadcrumb",
    sourceRecordIds: ["aria-apg:breadcrumb", "shadcn-ui:breadcrumb"],
  },
  {
    canonicalName: "Button",
    sourceRecordIds: [
      "aria-apg:button",
      "base-ui:button",
      "shadcn-ui:button",
    ],
  },
  {
    canonicalName: "Carousel",
    sourceRecordIds: ["aria-apg:carousel", "shadcn-ui:carousel"],
  },
  {
    canonicalName: "Checkbox",
    sourceRecordIds: [
      "aria-apg:checkbox",
      "base-ui:checkbox",
      "shadcn-ui:checkbox",
    ],
  },
  {
    canonicalName: "Collapsible",
    sourceRecordIds: [
      "aria-apg:disclosure",
      "base-ui:collapsible",
      "shadcn-ui:collapsible",
    ],
  },
  {
    canonicalName: "Combobox",
    sourceRecordIds: [
      "aria-apg:combobox",
      "base-ui:combobox",
      "shadcn-ui:combobox",
    ],
  },
  {
    canonicalName: "Context Menu",
    sourceRecordIds: ["base-ui:context-menu", "shadcn-ui:context-menu"],
  },
  {
    canonicalName: "Dialog",
    sourceRecordIds: [
      "aria-apg:dialog-modal",
      "base-ui:dialog",
      "shadcn-ui:dialog",
    ],
  },
  {
    canonicalName: "Drawer",
    sourceRecordIds: ["base-ui:drawer", "shadcn-ui:drawer"],
  },
  {
    canonicalName: "Field",
    sourceRecordIds: ["base-ui:field", "shadcn-ui:field"],
  },
  {
    canonicalName: "Input",
    sourceRecordIds: ["base-ui:input", "shadcn-ui:input"],
  },
  {
    canonicalName: "Menu",
    sourceRecordIds: [
      "aria-apg:menu-button",
      "base-ui:menu",
      "shadcn-ui:dropdown-menu",
    ],
  },
  {
    canonicalName: "Menubar",
    sourceRecordIds: [
      "aria-apg:menubar",
      "base-ui:menubar",
      "shadcn-ui:menubar",
    ],
  },
  {
    canonicalName: "Meter",
    sourceRecordIds: ["aria-apg:meter", "base-ui:meter"],
  },
  {
    canonicalName: "Navigation Menu",
    sourceRecordIds: [
      "base-ui:navigation-menu",
      "shadcn-ui:navigation-menu",
    ],
  },
  {
    canonicalName: "Number Field",
    sourceRecordIds: ["aria-apg:spinbutton", "base-ui:number-field"],
  },
  {
    canonicalName: "Popover",
    sourceRecordIds: ["base-ui:popover", "shadcn-ui:popover"],
  },
  {
    canonicalName: "Progress",
    sourceRecordIds: ["base-ui:progress", "shadcn-ui:progress"],
  },
  {
    canonicalName: "Radio Group",
    sourceRecordIds: [
      "aria-apg:radio",
      "base-ui:radio",
      "shadcn-ui:radio-group",
    ],
  },
  {
    canonicalName: "Scroll Area",
    sourceRecordIds: ["base-ui:scroll-area", "shadcn-ui:scroll-area"],
  },
  {
    canonicalName: "Select",
    sourceRecordIds: ["base-ui:select", "shadcn-ui:select"],
  },
  {
    canonicalName: "Separator",
    sourceRecordIds: ["base-ui:separator", "shadcn-ui:separator"],
  },
  {
    canonicalName: "Slider",
    sourceRecordIds: [
      "aria-apg:slider",
      "aria-apg:slider-multithumb",
      "base-ui:slider",
      "shadcn-ui:slider",
    ],
  },
  {
    canonicalName: "Switch",
    sourceRecordIds: [
      "aria-apg:switch",
      "base-ui:switch",
      "shadcn-ui:switch",
    ],
  },
  {
    canonicalName: "Table",
    sourceRecordIds: ["aria-apg:table", "shadcn-ui:table"],
  },
  {
    canonicalName: "Tabs",
    sourceRecordIds: [
      "aria-apg:tabs",
      "base-ui:tabs",
      "shadcn-ui:tabs",
    ],
  },
  {
    canonicalName: "Toast",
    sourceRecordIds: ["base-ui:toast", "shadcn-ui:toast"],
  },
  {
    canonicalName: "Toggle",
    sourceRecordIds: ["base-ui:toggle", "shadcn-ui:toggle"],
  },
  {
    canonicalName: "Toggle Group",
    sourceRecordIds: ["base-ui:toggle-group", "shadcn-ui:toggle-group"],
  },
  {
    canonicalName: "Toolbar",
    sourceRecordIds: ["aria-apg:toolbar", "base-ui:toolbar"],
  },
  {
    canonicalName: "Tooltip",
    sourceRecordIds: [
      "aria-apg:tooltip",
      "base-ui:tooltip",
      "shadcn-ui:tooltip",
    ],
  },
  {
    canonicalName: "Window Splitter",
    sourceRecordIds: ["aria-apg:windowsplitter", "shadcn-ui:resizable"],
  },
] as const satisfies readonly ApprovedEquivalenceGroup[]);
