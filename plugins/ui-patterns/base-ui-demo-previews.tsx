import type { ComponentType } from "react";

function stage(Component: ComponentType): ComponentType {
  return Component;
}

const loaders = {
  accordion: async () => stage((await import("./vendor/base-ui/examples/accordion.js")).default),
  "alert-dialog": async () => stage((await import("./vendor/base-ui/examples/alert-dialog.js")).default),
  autocomplete: async () => stage((await import("./vendor/base-ui/examples/autocomplete.js")).default),
  avatar: async () => stage((await import("./vendor/base-ui/examples/avatar.js")).default),
  button: async () => stage((await import("./vendor/base-ui/examples/button.js")).default),
  checkbox: async () => stage((await import("./vendor/base-ui/examples/checkbox.js")).default),
  "checkbox-group": async () => stage((await import("./vendor/base-ui/examples/checkbox-group.js")).default),
  collapsible: async () => stage((await import("./vendor/base-ui/examples/collapsible.js")).default),
  combobox: async () => stage((await import("./vendor/base-ui/examples/combobox.js")).default),
  "context-menu": async () => stage((await import("./vendor/base-ui/examples/context-menu.js")).default),
  dialog: async () => stage((await import("./vendor/base-ui/examples/dialog.js")).default),
  drawer: async () => stage((await import("./vendor/base-ui/examples/drawer.js")).default),
  field: async () => stage((await import("./vendor/base-ui/examples/field.js")).default),
  fieldset: async () => stage((await import("./vendor/base-ui/examples/fieldset.js")).default),
  form: async () => stage((await import("./vendor/base-ui/examples/form.js")).default),
  input: async () => stage((await import("./vendor/base-ui/examples/input.js")).default),
  menu: async () => stage((await import("./vendor/base-ui/examples/menu.js")).default),
  menubar: async () => stage((await import("./vendor/base-ui/examples/menubar.js")).default),
  meter: async () => stage((await import("./vendor/base-ui/examples/meter.js")).default),
  "navigation-menu": async () => stage((await import("./vendor/base-ui/examples/navigation-menu.js")).default),
  "number-field": async () => stage((await import("./vendor/base-ui/examples/number-field.js")).default),
  "otp-field": async () => stage((await import("./vendor/base-ui/examples/otp-field.js")).default),
  popover: async () => stage((await import("./vendor/base-ui/examples/popover.js")).default),
  "preview-card": async () => stage((await import("./vendor/base-ui/examples/preview-card.js")).default),
  progress: async () => stage((await import("./vendor/base-ui/examples/progress.js")).default),
  radio: async () => stage((await import("./vendor/base-ui/examples/radio.js")).default),
  "scroll-area": async () => stage((await import("./vendor/base-ui/examples/scroll-area.js")).default),
  select: async () => stage((await import("./vendor/base-ui/examples/select.js")).default),
  separator: async () => stage((await import("./vendor/base-ui/examples/separator.js")).default),
  slider: async () => stage((await import("./vendor/base-ui/examples/slider.js")).default),
  switch: async () => stage((await import("./vendor/base-ui/examples/switch.js")).default),
  tabs: async () => stage((await import("./vendor/base-ui/examples/tabs.js")).default),
  toast: async () => stage((await import("./vendor/base-ui/examples/toast.js")).default),
  toggle: async () => stage((await import("./vendor/base-ui/examples/toggle.js")).default),
  "toggle-group": async () => stage((await import("./vendor/base-ui/examples/toggle-group.js")).default),
  toolbar: async () => stage((await import("./vendor/base-ui/examples/toolbar.js")).default),
  tooltip: async () => stage((await import("./vendor/base-ui/examples/tooltip.js")).default),
} satisfies Record<string, () => Promise<ComponentType>>;

export const baseUiDemoIds = [
  "accordion", "alert-dialog", "autocomplete", "avatar", "button", "checkbox",
  "checkbox-group", "collapsible", "combobox", "context-menu", "dialog", "drawer",
  "field", "fieldset", "form", "input", "menu", "menubar", "meter",
  "navigation-menu", "number-field", "otp-field", "popover", "preview-card",
  "progress", "radio", "scroll-area", "select", "separator", "slider", "switch",
  "tabs", "toast", "toggle", "toggle-group", "toolbar", "tooltip",
] as const satisfies readonly (keyof typeof loaders)[];

export type BaseUiDemoId = (typeof baseUiDemoIds)[number];

export function loadBaseUiDemo(id: BaseUiDemoId) {
  return loaders[id]();
}
