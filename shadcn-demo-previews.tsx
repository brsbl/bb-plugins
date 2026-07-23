import { useState, type ComponentType } from "react";
import { Button } from "@/registry/bases/base/ui/button";
import { DirectionProvider } from "@/registry/bases/base/ui/direction";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/registry/bases/base/ui/input-otp";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/registry/bases/base/ui/message-scroller";
import { Toaster } from "@/registry/bases/base/ui/sonner";

function stage(Component: ComponentType, withToaster = false): ComponentType {
  return function ShadcnRegistryPreview() {
    return (
      <>
        <Component />
        {withToaster ? <Toaster /> : null}
      </>
    );
  };
}

function DirectionDemo() {
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  return (
    <DirectionProvider direction={direction}>
      <div className="grid w-full max-w-sm gap-4" dir={direction}>
        <Button
          variant="outline"
          onClick={() => setDirection((value) => value === "ltr" ? "rtl" : "ltr")}
        >
          Switch to {direction === "ltr" ? "right-to-left" : "left-to-right"}
        </Button>
        <p className="rounded-lg border border-border p-4 text-sm">
          DirectionProvider is controlling this reading direction.
        </p>
      </div>
    </DirectionProvider>
  );
}

function MessageScrollerDemo() {
  return (
    <MessageScrollerProvider>
      <MessageScroller className="h-72 w-full max-w-sm rounded-lg border border-border bg-muted/20">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-3 p-4">
            {Array.from({ length: 12 }, (_, index) => (
              <MessageScrollerItem key={index} className="rounded-lg bg-background p-3 text-sm shadow-sm">
                Message {index + 1}: scroll this real registry component.
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

function InputOTPDemo() {
  const [value, setValue] = useState("");

  return (
    <InputOTP maxLength={6} value={value} onChange={setValue}>
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot key={index} index={index} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}

const loaders = {
  accordion: async () => stage((await import("./vendor/shadcn-ui/examples/base/accordion-demo.js")).default),
  alert: async () => stage((await import("./vendor/shadcn-ui/examples/base/alert-demo.js")).default),
  "alert-dialog": async () => stage((await import("./vendor/shadcn-ui/examples/base/alert-dialog-demo.js")).default),
  "aspect-ratio": async () => stage((await import("./vendor/shadcn-ui/examples/base/aspect-ratio-demo.js")).default),
  attachment: async () => stage((await import("./vendor/shadcn-ui/examples/base/attachment-demo.js")).AttachmentDemo),
  avatar: async () => stage((await import("./vendor/shadcn-ui/examples/base/avatar-demo.js")).default),
  badge: async () => stage((await import("./vendor/shadcn-ui/examples/base/badge-demo.js")).default),
  breadcrumb: async () => stage((await import("./vendor/shadcn-ui/examples/base/breadcrumb-demo.js")).BreadcrumbDemo),
  bubble: async () => stage((await import("./vendor/shadcn-ui/examples/base/bubble-demo.js")).BubbleDemo),
  button: async () => stage((await import("./vendor/shadcn-ui/examples/base/button-demo.js")).default),
  "button-group": async () => stage((await import("./vendor/shadcn-ui/examples/base/button-group-demo.js")).default),
  calendar: async () => stage((await import("./vendor/shadcn-ui/examples/base/calendar-demo.js")).default),
  card: async () => stage((await import("./vendor/shadcn-ui/examples/base/card-demo.js")).default),
  carousel: async () => stage((await import("./vendor/shadcn-ui/examples/base/carousel-demo.js")).default),
  chart: async () => stage((await import("./vendor/shadcn-ui/examples/base/chart-demo.js")).ChartDemo),
  checkbox: async () => stage((await import("./vendor/shadcn-ui/examples/base/checkbox-demo.js")).default),
  collapsible: async () => stage((await import("./vendor/shadcn-ui/examples/base/collapsible-demo.js")).default),
  combobox: async () => stage((await import("./vendor/shadcn-ui/examples/base/combobox-demo.js")).default),
  command: async () => stage((await import("./vendor/shadcn-ui/examples/base/command-demo.js")).CommandDemo),
  "context-menu": async () => stage((await import("./vendor/shadcn-ui/examples/base/context-menu-demo.js")).ContextMenuDemo),
  "data-table": async () => stage((await import("./vendor/shadcn-ui/examples/base/data-table-demo.js")).DataTableDemo),
  "date-picker": async () => stage((await import("./vendor/shadcn-ui/examples/base/date-picker-demo.js")).DatePickerDemo),
  dialog: async () => stage((await import("./vendor/shadcn-ui/examples/base/dialog-demo.js")).DialogDemo),
  direction: async () => stage(DirectionDemo),
  drawer: async () => stage((await import("./vendor/shadcn-ui/examples/base/drawer-demo.js")).DrawerDemo),
  "dropdown-menu": async () => stage((await import("./vendor/shadcn-ui/examples/base/dropdown-menu-demo.js")).DropdownMenuDemo),
  empty: async () => stage((await import("./vendor/shadcn-ui/examples/base/empty-demo.js")).default),
  field: async () => stage((await import("./vendor/shadcn-ui/examples/base/field-demo.js")).default),
  "hover-card": async () => stage((await import("./vendor/shadcn-ui/examples/base/hover-card-demo.js")).default),
  input: async () => stage((await import("./vendor/shadcn-ui/examples/base/input-demo.js")).InputDemo),
  "input-group": async () => stage((await import("./vendor/shadcn-ui/examples/base/input-group-demo.js")).InputGroupDemo),
  "input-otp": async () => stage(InputOTPDemo),
  item: async () => stage((await import("./vendor/shadcn-ui/examples/base/item-demo.js")).ItemDemo),
  kbd: async () => stage((await import("./vendor/shadcn-ui/examples/base/kbd-demo.js")).default),
  label: async () => stage((await import("./vendor/shadcn-ui/examples/base/label-demo.js")).default),
  marker: async () => stage((await import("./vendor/shadcn-ui/examples/base/marker-demo.js")).MarkerDemo),
  menubar: async () => stage((await import("./vendor/shadcn-ui/examples/base/menubar-demo.js")).default),
  message: async () => stage((await import("./vendor/shadcn-ui/examples/base/message-demo.js")).MessageDemo),
  "message-scroller": async () => stage(MessageScrollerDemo),
  "native-select": async () => stage((await import("./vendor/shadcn-ui/examples/base/native-select-demo.js")).default),
  "navigation-menu": async () => stage((await import("./vendor/shadcn-ui/examples/base/navigation-menu-demo.js")).default),
  pagination: async () => stage((await import("./vendor/shadcn-ui/examples/base/pagination-demo.js")).default),
  popover: async () => stage((await import("./vendor/shadcn-ui/examples/base/popover-demo.js")).default),
  progress: async () => stage((await import("./vendor/shadcn-ui/examples/base/progress-demo.js")).default),
  "radio-group": async () => stage((await import("./vendor/shadcn-ui/examples/base/radio-group-demo.js")).RadioGroupDemo),
  resizable: async () => stage((await import("./vendor/shadcn-ui/examples/base/resizable-demo.js")).default),
  "scroll-area": async () => stage((await import("./vendor/shadcn-ui/examples/base/scroll-area-demo.js")).ScrollAreaDemo),
  select: async () => stage((await import("./vendor/shadcn-ui/examples/base/select-demo.js")).SelectDemo),
  separator: async () => stage((await import("./vendor/shadcn-ui/examples/base/separator-demo.js")).default),
  sheet: async () => stage((await import("./vendor/shadcn-ui/examples/base/sheet-demo.js")).default),
  sidebar: async () => stage((await import("./vendor/shadcn-ui/examples/base/sidebar-demo.js")).default),
  skeleton: async () => stage((await import("./vendor/shadcn-ui/examples/base/skeleton-demo.js")).SkeletonDemo),
  slider: async () => stage((await import("./vendor/shadcn-ui/examples/base/slider-demo.js")).SliderDemo),
  sonner: async () => stage((await import("./vendor/shadcn-ui/examples/base/sonner-demo.js")).SonnerDemo, true),
  spinner: async () => stage((await import("./vendor/shadcn-ui/examples/base/spinner-demo.js")).SpinnerDemo),
  switch: async () => stage((await import("./vendor/shadcn-ui/examples/base/switch-demo.js")).SwitchDemo),
  table: async () => stage((await import("./vendor/shadcn-ui/examples/base/table-demo.js")).TableDemo),
  tabs: async () => stage((await import("./vendor/shadcn-ui/examples/base/tabs-demo.js")).TabsDemo),
  textarea: async () => stage((await import("./vendor/shadcn-ui/examples/base/textarea-demo.js")).default),
  toggle: async () => stage((await import("./vendor/shadcn-ui/examples/base/toggle-demo.js")).ToggleDemo),
  "toggle-group": async () => stage((await import("./vendor/shadcn-ui/examples/base/toggle-group-demo.js")).ToggleGroupDemo),
  tooltip: async () => stage((await import("./vendor/shadcn-ui/examples/base/tooltip-demo.js")).TooltipDemo),
} satisfies Record<string, () => Promise<ComponentType>>;

export const shadcnDemoIds = [
  "accordion", "alert", "alert-dialog", "aspect-ratio", "attachment", "avatar",
  "badge", "breadcrumb", "bubble", "button", "button-group", "calendar", "card",
  "carousel", "chart", "checkbox", "collapsible", "combobox", "command",
  "context-menu", "data-table", "date-picker", "dialog", "direction", "drawer", "dropdown-menu",
  "empty", "field", "hover-card", "input", "input-group", "input-otp", "item",
  "kbd", "label", "marker", "menubar", "message", "message-scroller", "native-select", "navigation-menu",
  "pagination", "popover", "progress", "radio-group", "resizable", "scroll-area",
  "select", "separator", "sheet", "sidebar", "skeleton", "slider", "sonner",
  "spinner", "switch", "table", "tabs", "textarea", "toggle", "toggle-group",
  "tooltip",
] as const satisfies readonly (keyof typeof loaders)[];

export type ShadcnDemoId = (typeof shadcnDemoIds)[number];

export function loadShadcnDemo(id: ShadcnDemoId) {
  return loaders[id]();
}
