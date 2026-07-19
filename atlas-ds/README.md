# Atlas React foundation

This directory provides the real, reusable React layer for Atlas scenes without changing the current gallery renderer. Components render semantic DOM, keep state controlled, and share one neutral token scope.

## Integration contract

Import the CSS once beneath the plugin or standalone token layer, then render scenes inside `AtlasRoot`.

```tsx
import {
  AtlasRoot,
  DataTable,
  PreviewStage,
  StageDialog,
} from "./atlas-ds/index.js";
import "./atlas-ds/tokens.css";

export function Scene() {
  return (
    <AtlasRoot density="compact">
      <PreviewStage label="Dialog example" inert>
        <StageDialog
          open
          onOpenChange={() => {}}
          title="Apply saved view?"
        />
      </PreviewStage>
    </AtlasRoot>
  );
}
```

`AtlasRoot` owns token scope and density. `PreviewStage` owns overlay containment. All inputs, selections, open states, progress values, agent states, and approval decisions are caller-controlled.

`atlasDesignSystemManifest` exposes the entrypoint, stylesheet, state and overlay contracts, family exports, and representative examples for registry integration. The installable plugin package includes the whole `atlas-ds/` directory.

## API by scene family

| Family | Foundation API | Reusable compositions |
| --- | --- | --- |
| Foundation | `AtlasRoot`, `Surface`, `Stack`, `Cluster`, `Divider`, `Heading`, `Text` | Quiet hierarchy, compact spacing, neutral elevation |
| Forms | `Button`, `IconButton`, `TextInput`, `TextArea`, `NativeSelect`, `Checkbox`, `Switch` | `TextField`, `TextAreaField`, `SelectField`, `BooleanField`, `FormSection`, `FormActions` |
| Navigation | Native links and buttons | `Breadcrumbs`, controlled `Tabs`, `SideNavigation` |
| Collections | Native list and table elements | Generic `DataTable<T>`, `CollectionList`, `EmptyState` |
| Overlays | `PreviewStage`, `StagePortal` | Controlled `StageDialog`, `StagePopover`, `ConfirmationFooter` |
| Feedback | `StatusBadge`, `LoadingStatus`, `ProgressBar` | `InlineAlert`, controlled `ToastRegion` |
| Agent work | Native ordered lists, `details`, and status text | `AgentActivity`, `ActionApproval` |

Representative deterministic compositions live in `examples.tsx`.

## Accessibility boundaries

- Native inputs, selects, buttons, progress, lists, tables, and disclosure elements are the default.
- Field composites own visible labels, descriptions, error relationships, required state, and invalid state.
- Tabs implement the tab, tablist, and tabpanel relationship plus arrow, Home, and End key behavior.
- Dialogs have labels, optional descriptions, Escape dismissal, initial focus, focus containment, and focus restoration when the stage is interactive.
- Icon-only controls require a `label`; action approval names the action, affected objects, risk, recovery, and decision controls.
- High-risk approval remains disabled until a supplied controlled confirmation is checked.

## Overlay and preview rules

Every Atlas overlay must descend from `PreviewStage`. `StagePortal` fails closed outside that owner instead of falling back to `document.body`.

The portal root is absolutely positioned within the stage, and the stage uses paint containment plus clipping. `inert` on `PreviewStage` disables its canvas and portal subtree and suppresses dialog focus side effects, so examples can render safely inside browse cards.

## Validation

Run the scoped checks from `bb-plugin-ui-patterns`:

```bash
npm run typecheck
npm test
```

The Node tests bundle the TSX fixture with the existing esbuild dependency and use server-rendered DOM assertions. They do not use Playwright.
