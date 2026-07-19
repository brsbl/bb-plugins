import * as React from "react";

import atlasRegistry from "./generated/atlas-registry.v2.json";
import {
  ActionApproval,
  AgentActivity,
  ApplicationFrame,
  AtlasRoot,
  AtlasIcon,
  Avatar,
  AvatarGroup,
  Badge,
  BooleanField,
  Breadcrumbs,
  Button,
  Checkbox,
  Chip,
  Cluster,
  CollectionList,
  DataTable,
  Divider,
  EmptyState,
  FormActions,
  FormSection,
  Heading,
  IconButton,
  InlineAlert,
  LoadingStatus,
  NativeSelect,
  NavigationBar,
  NavigationRail,
  PageHeader,
  PreviewStage,
  ProgressBar,
  SelectField,
  SideNavigation,
  Skeleton,
  Stack,
  StageDialog,
  StagePopover,
  StepIndicator,
  StatusBadge,
  Surface,
  Switch,
  TabBar,
  Tag,
  Tabs,
  Text,
  TextArea,
  TextAreaField,
  TextField,
  TextInput,
  ToastRegion,
  TreeView,
} from "./atlas-ds/index.js";
import "./atlas-ds/tokens.css";

export const patternPreviewIds = [
  "button", "toggle-button", "link", "button-group", "toolbar",
  "command-palette", "text-field", "text-area", "checkbox", "radio-group",
  "switch", "select", "combobox", "listbox", "segmented-control", "slider",
  "date-picker", "file-upload", "search-field", "header", "navigation-bar",
  "side-navigation", "navigation-rail", "breadcrumb", "tabs", "tab-bar",
  "pagination", "stepper", "avatar", "badge", "tag", "chip", "card", "list",
  "table", "data-grid", "tree-view", "icon", "alert", "banner", "toast",
  "progress-indicator", "spinner", "skeleton", "dialog", "alert-dialog",
  "popover", "tooltip", "menu", "drawer", "sheet", "accordion", "disclosure",
  "divider", "panel", "split-view", "form", "form-validation",
  "search-and-filtering", "filter-bar", "sorting", "multi-step-flow",
  "master-detail", "bulk-selection-and-actions", "empty-state", "loading-state",
  "notifications", "ai-composer", "prompt-suggestions", "ai-label",
  "ai-feature-entry", "streaming-response", "response-regeneration",
  "grounded-answer", "context-attachment", "follow-up-question",
  "artifact-preview", "agent-activity", "action-approval", "change-preview",
  "agent-management", "ai-failure-recovery", "ai-feedback",
  "conversation-history", "memory-controls", "workspace-switcher", "saved-view",
  "kanban-board", "dashboard", "activity-feed", "onboarding-checklist",
  "collaborative-presence", "comment-thread", "inline-editing",
  "notification-center", "record-detail", "approval-workflow", "review-queue",
  "audit-log", "permission-matrix", "role-management", "rule-builder",
  "import-workflow", "draft-autosave", "version-history", "impersonation-banner",
  "admin-console",
] as const;

export type PatternPreviewEntryId = (typeof patternPreviewIds)[number];
export type PatternPreviewMode = "inert" | "interactive";
export type PatternPreviewState =
  | "default"
  | "rest"
  | "active"
  | "reduced-motion";

export interface PatternPreviewProps {
  entryId: PatternPreviewEntryId;
  mode?: PatternPreviewMode;
  phase?: number;
  state?: PatternPreviewState;
  className?: string;
}

export const patternPreviewTemplateFamilies = [
  "admin", "agent-activity", "agents", "ai", "ai-recovery", "approval",
  "approval-flow", "autosave", "cards", "checklist", "comments", "content",
  "control", "dashboard", "disclosure", "feedback", "flow", "form", "grid",
  "history", "import", "inline-edit", "kanban", "layout", "list", "loading",
  "master-detail", "matrix", "memory", "navigation", "notifications", "overlay",
  "presence", "record", "review", "rules", "skeleton", "table", "tree",
] as const;

export type PatternPreviewTemplate =
  (typeof patternPreviewTemplateFamilies)[number];

interface AnatomyRecord {
  entryId: string;
  template: string;
  regions: readonly { id: string; label: string; required: boolean }[];
}

interface EntryStory {
  entryId: string;
  card: { title: string; description: string };
  fixture: {
    states: readonly {
      id: string;
      phase: number;
      reducedMotion: boolean;
    }[];
  };
}

const manifestEntries = atlasRegistry.entries as unknown as readonly {
  anatomy: AnatomyRecord;
  story: EntryStory;
}[];
const anatomyRecords = manifestEntries.map(({ anatomy }) => anatomy);
const entryStories = manifestEntries.map(({ story }) => story);

export interface PatternPreviewRegistryRecord {
  entryId: PatternPreviewEntryId;
  template: PatternPreviewTemplate;
  title: string;
  description: string;
  labels: readonly string[];
  states: readonly PatternPreviewState[];
}

const anatomyById = new Map(
  anatomyRecords.map((record) => [record.entryId, record]),
);
const storyById = new Map(entryStories.map((story) => [story.entryId, story]));

export const patternPreviewRegistry: readonly PatternPreviewRegistryRecord[] =
  patternPreviewIds.map((entryId) => {
    const anatomy = anatomyById.get(entryId);
    const story = storyById.get(entryId);
    if (!anatomy || !story) {
      throw new Error(`Pattern preview registry is missing ${entryId}.`);
    }
    return {
      entryId,
      template: anatomy.template as PatternPreviewTemplate,
      title: story.card.title,
      description: story.card.description,
      labels: anatomy.regions.map((region) => region.label),
      states: story.fixture.states.map(
        (fixtureState) => fixtureState.id as PatternPreviewState,
      ),
    };
  });

interface PreviewContext {
  entryId: PatternPreviewEntryId;
  anatomy: AnatomyRecord;
  story: EntryStory;
  labels: readonly [string, string, ...string[]];
  interactive: boolean;
  active: boolean;
  phase: number;
  state: PatternPreviewState;
  selected: string;
  setSelected: (value: string) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  approved: boolean;
  setApproved: (value: boolean) => void;
}

type PreviewRenderer = (context: PreviewContext) => React.ReactNode;

const noop = () => {};
const preventNavigation = (event: React.MouseEvent) => event.preventDefault();

function support(context: PreviewContext, index: number, fallback: string) {
  return context.labels[index + 2] ?? fallback;
}

const secondaryFixtureValueIds = new Set<PatternPreviewEntryId>([
  "button",
  "text-field",
  "text-area",
  "select",
  "combobox",
  "search-field",
  "inline-editing",
]);

function initialSelection(
  entryId: PatternPreviewEntryId,
  labels: readonly string[],
  title: string,
) {
  if (entryId === "button") return "Northstar";
  if (secondaryFixtureValueIds.has(entryId)) {
    return labels[3] ?? labels[2] ?? title;
  }
  return labels[2] ?? title;
}

function previewHeader(context: PreviewContext) {
  return (
    <Stack gap="xs">
      <Heading level={3} size="sm">{context.labels[0]}</Heading>
      <Text tone="muted" size="xs">{context.labels[1]}</Text>
    </Stack>
  );
}

function collectionItems(context: PreviewContext, count = 3) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${context.entryId}-${index}`,
    primary: support(context, index, `Item ${index + 1}`),
    secondary: index === 0 ? context.labels[1] : undefined,
    meta: index === 0 ? <StatusBadge tone="success">Ready</StatusBadge> : undefined,
  }));
}

function ContextPage({
  context,
  children,
  actions,
  sidebar,
}: {
  context: PreviewContext;
  children: React.ReactNode;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  return (
    <ApplicationFrame
      label={`${context.story.card.title} example`}
      title="Northstar"
      brand={<AtlasIcon name="GridView" size="sm" />}
      actions={actions ?? <Avatar name="Morgan Lee" size="sm" status="online" />}
      sidebar={sidebar}
    >
      <Stack className="atlas-preview-context" gap="md">
        <PageHeader
          title={context.labels[0]}
          description={context.labels[1]}
          level={3}
        />
        {children}
      </Stack>
    </ApplicationFrame>
  );
}

function SettingSurface({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Surface className="atlas-setting-surface" as="section" elevation="raised">
      <Stack gap="md">
        <Stack gap="xs">
          <Heading level={4} size="sm">{title}</Heading>
          {description ? <Text tone="muted" size="xs">{description}</Text> : null}
        </Stack>
        {children}
      </Stack>
    </Surface>
  );
}

function ControlPreview(context: PreviewContext) {
  const first = support(context, 0, "Name");
  const second = support(context, 1, "Continue");
  const third = support(context, 2, "Option C");
  const setSelected = (value: string) => {
    if (context.interactive) context.setSelected(value);
  };

  switch (context.entryId) {
    case "button":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Workspace details" description="Add a clear name before creating the workspace.">
            <TextField
              label={first}
              description="Shown to collaborators across comments and activity."
              required
              value={context.selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            />
            <Cluster justify="end">
              <Button size="sm" tone="quiet">Cancel</Button>
              <Button size="sm" tone="primary" onClick={() => setSelected(second)}>
                {second}
              </Button>
            </Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "toggle-button":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Canvas" description="Pressed controls keep an editor mode active.">
            <Cluster role="toolbar" aria-label="Canvas view controls">
              <IconButton
                label={first}
                aria-pressed={context.enabled}
                tone={context.enabled ? "primary" : "neutral"}
                onClick={() => context.interactive && context.setEnabled(!context.enabled)}
              >
                <AtlasIcon name="GridView" />
              </IconButton>
              <IconButton label="Pin annotations" aria-pressed="false">
                <AtlasIcon name="Pin" />
              </IconButton>
              <IconButton label="Wrap lines" aria-pressed="false">
                <AtlasIcon name="TextWrap" />
              </IconButton>
            </Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "link":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Launch readiness" description="Review supporting detail without turning navigation into an action button.">
            <Text tone="muted">The project is ready for review. Six activities were recorded this week.</Text>
            <Cluster justify="between">
              <a href="#pattern-destination" onClick={preventNavigation}>
                {first} <AtlasIcon name="ArrowRight" size="xs" />
              </a>
              <Button size="sm" tone="primary">Request review</Button>
            </Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "button-group":
      const groupedActions = [
        { label: "Duplicate", icon: "Copy" as const, tone: "neutral" as const },
        { label: "Archive", icon: "Archive" as const, tone: "neutral" as const },
        { label: "Delete", icon: "Trash2" as const, tone: "danger" as const },
      ];
      return (
        <ContextPage context={context}>
          <SettingSurface title="Selected projects" description="Related actions share a boundary but keep independent outcomes.">
            <Text tone="muted" size="xs">3 projects selected</Text>
            <Cluster role="group" aria-label={context.labels[0]}>
              {groupedActions.map((action) => (
                <Button
                  key={action.label}
                  tone={action.tone}
                  size="sm"
                >
                  <AtlasIcon name={action.icon} />
                  {action.label}
                </Button>
              ))}
            </Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "text-field":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Public profile" description="This name appears in comments and activity.">
            <TextField
              label={first}
              value={context.selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            />
            <Cluster justify="end"><Button size="sm" tone="primary">Save profile</Button></Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "text-area":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Project brief" description="Give collaborators enough context to make decisions.">
            <TextAreaField
              label={first}
              description="Summarize the goal, constraints, and decision owner."
              maxLength={500}
              value={context.selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            />
            <Cluster justify="between">
              <Text tone="muted" size="xs">{context.selected.length} of 500 characters</Text>
              <Cluster>
                <Button size="sm" tone="quiet">Cancel</Button>
                <Button size="sm" tone="primary">Save brief</Button>
              </Cluster>
            </Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "checkbox":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Email notifications" description="Choose any updates you want to receive.">
            <fieldset>
              <legend>Notify me about</legend>
              <Stack gap="sm">
                {[first, second, third].map((label, index) => (
                  <BooleanField
                    key={label}
                    label={label}
                    description={index === 0 ? "Includes mentions and assignment changes." : undefined}
                    checked={index === 0 ? context.enabled : index === 1}
                    onChange={(event) =>
                      context.interactive && index === 0 &&
                      context.setEnabled(event.currentTarget.checked)}
                  />
                ))}
              </Stack>
            </fieldset>
            <Cluster justify="end"><Button size="sm" tone="primary">Save preferences</Button></Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "radio-group":
      return (
        <ContextPage context={context}>
          <SettingSurface title={context.labels[0]} description="Only one visibility level can be active.">
            <fieldset>
              <legend className="atlas-sr-only">{context.labels[0]}</legend>
              <Stack gap="sm">
                {[first, second, third].map((label) => (
                  <label key={label}>
                    <input
                      type="radio"
                      name={`${context.entryId}-choice`}
                      checked={context.selected === label}
                      onChange={() => setSelected(label)}
                    />{" "}
                    {label}
                  </label>
                ))}
              </Stack>
            </fieldset>
            <InlineAlert tone="info" title={`${context.selected || first} selected`}>
              This visibility applies to new workspace content.
            </InlineAlert>
          </SettingSurface>
        </ContextPage>
      );
    case "switch":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Guest access" description="This setting takes effect immediately.">
            <BooleanField
              variant="switch"
              label={first}
              description={context.enabled ? "Guests can request access." : "Guest access is off."}
              checked={context.enabled}
              onChange={(event) =>
                context.interactive && context.setEnabled(event.currentTarget.checked)}
            />
          </SettingSurface>
        </ContextPage>
      );
    case "select":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Issue defaults" description="New issues inherit this priority.">
            <SelectField
              label={first}
              value={context.selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
              options={[second, third, support(context, 3, "Low")].map((label) => ({
                value: label,
                label,
              }))}
            />
          </SettingSurface>
        </ContextPage>
      );
    case "combobox":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Issue owner" description="Search people, then choose one result.">
            <Stack gap="sm">
              <TextField
                role="combobox"
                aria-expanded="true"
                aria-controls="owner-suggestions"
                aria-autocomplete="list"
                aria-activedescendant="owner-suggestion-morgan"
                label={first}
                value={context.selected}
                onChange={(event) => setSelected(event.currentTarget.value)}
              />
              <Surface
                id="owner-suggestions"
                role="listbox"
                aria-label={`${first} suggestions`}
              >
                <Stack gap="xs">
                  {[second, third, support(context, 3, "Jordan Doe")].map((label, index) => (
                    <div
                      key={label}
                      id={index === 0 ? "owner-suggestion-morgan" : undefined}
                      role="option"
                      aria-selected={index === 0}
                      tabIndex={index === 0 ? 0 : -1}
                      onClick={() => setSelected(label)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setSelected(label);
                      }}
                    >
                      <Cluster>
                        <Avatar name={label} size="sm" />
                        <Stack gap="xs">
                          <Text>{label}</Text>
                          <Text tone="muted" size="xs">{index === 0 ? "Workspace member" : "Organization member"}</Text>
                        </Stack>
                        {index === 0 ? <AtlasIcon name="Check" size="xs" /> : null}
                      </Cluster>
                    </div>
                  ))}
                </Stack>
              </Surface>
            </Stack>
          </SettingSurface>
        </ContextPage>
      );
    case "listbox":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Deploy environment" description="The available options remain visible while choosing.">
            <NativeSelect
              aria-label={context.labels[0]}
              size={3}
              value={context.selected}
              onChange={(event) => setSelected(event.currentTarget.value)}
            >
              {[first, second, third].map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </NativeSelect>
            <Text tone="muted" size="xs">Use arrow keys to move; the selected environment receives the deployment.</Text>
          </SettingSurface>
        </ContextPage>
      );
    case "segmented-control":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Usage" description="Change the time scale without leaving this view.">
            <Cluster role="group" aria-label={context.labels[0]}>
              {[first, second, third].map((label) => (
                <Button
                  key={label}
                  size="sm"
                  aria-pressed={context.selected === label}
                  tone={context.selected === label ? "primary" : "neutral"}
                  onClick={() => setSelected(label)}
                >
                  {label}
                </Button>
              ))}
            </Cluster>
            <ProgressBar
              label={`${context.selected || first} requests`}
              value={context.selected === second ? 54 : context.selected === third ? 82 : 68}
              valueText={context.selected === second ? "5,418" : context.selected === third ? "8,204" : "6,842"}
            />
          </SettingSurface>
        </ContextPage>
      );
    case "slider":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Alert threshold" description="Tune the threshold and review its current value.">
            <label>
              <Cluster justify="between">
                <span>{first}</span>
                <Badge>{context.active ? "68%" : "24%"}</Badge>
              </Cluster>
              <TextInput
                type="range"
                min="0"
                max="100"
                value={context.active ? 68 : 24}
                onChange={noop}
              />
              <Cluster justify="between">
                <Text tone="muted" size="xs">0%: quiet</Text>
                <Text tone="muted" size="xs">100%: sensitive</Text>
              </Cluster>
            </label>
            <InlineAlert tone="info" title="Current threshold">
              Alerts fire when usage exceeds {context.active ? "68%" : "24%"}.
            </InlineAlert>
          </SettingSurface>
        </ContextPage>
      );
    case "date-picker":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Schedule review" description="Choose a valid review date.">
            <TextField
              label={first}
              type="date"
              value="2026-07-17"
              min="2026-07-18"
              max="2026-08-31"
              error="Choose July 18 or later."
              onChange={noop}
            />
            <Text tone="muted" size="xs">Dates before July 18 are unavailable. Displayed in your locale.</Text>
            <Cluster justify="end"><Button size="sm" tone="primary">Schedule</Button></Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "file-upload":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Import customer data" description="CSV files up to 25 MB.">
            <label>
              {first}
              <TextInput type="file" accept=".csv,text/csv" onChange={noop} />
            </label>
            <CollectionList
              label="Selected files"
              items={[{
                id: "customers",
                primary: second,
                secondary: "1.8 MB",
                leading: <AtlasIcon name="FileText" />,
                meta: context.active
                  ? <StatusBadge tone="success">Ready</StatusBadge>
                  : <ProgressBar label="Uploading customers.csv" value={42} valueText="42%" />,
                action: <IconButton label="Remove customers.csv" size="sm"><AtlasIcon name="X" /></IconButton>,
              }]}
            />
            <Cluster justify="end"><Button size="sm" tone="primary" disabled={!context.active}>Continue import</Button></Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "search-field":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Knowledge base">
            <Cluster align="end">
              <TextField
                label={first}
                type="search"
                value={context.selected}
                onChange={(event) => setSelected(event.currentTarget.value)}
              />
              <IconButton label="Clear search" size="sm" onClick={() => setSelected("")}><AtlasIcon name="X" /></IconButton>
            </Cluster>
            <Text tone="muted" size="xs">2 results in Help center</Text>
            <CollectionList
              label="Search results"
              items={[
                { id: "policy", primary: second, secondary: "Updated yesterday" },
                { id: "roles", primary: "Role permissions", secondary: "Admin guide" },
              ]}
            />
          </SettingSurface>
        </ContextPage>
      );
    default:
      return <TextInput aria-label={first} value={context.selected} onChange={(event) => setSelected(event.currentTarget.value)} />;
  }
}

function NavigationPreview(context: PreviewContext) {
  const labels = [support(context, 0, "Overview"), support(context, 1, "Activity"), support(context, 2, "Settings")];
  const setSelected = (value: string) => context.interactive && context.setSelected(value);
  const selected = labels.includes(context.selected) ? context.selected : labels[0];
  const compactItems = labels.map((label, index) => ({
    id: label,
    label,
    icon: <AtlasIcon name={(["GridView", "ListTodo", "File", "Settings"] as const)[index] ?? "GridView"} />,
  }));
  if (context.entryId === "toolbar") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">{labels[2]}</Button>}>
        <SettingSurface title="Launch plan" description="Select text to make formatting actions available.">
          <Cluster role="toolbar" aria-label={context.labels[0]}>
            <IconButton label={labels[0]} size="sm"><AtlasIcon name="ArrowTurnBackward" /></IconButton>
            <IconButton label={labels[1]} size="sm" aria-pressed="true"><AtlasIcon name="AlignLeft" /></IconButton>
            <Divider role="separator" aria-orientation="vertical" />
            <Button size="sm" tone="quiet">Heading</Button>
            <IconButton label="More formatting" size="sm"><AtlasIcon name="MoreHorizontal" /></IconButton>
          </Cluster>
          <Text>Align the launch plan, owners, and decision dates before sharing.</Text>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "header") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Northstar"
        brand={<AtlasIcon name="GridView" />}
        navigation={
          <NavigationBar
            label="Workspace"
            activeId="Projects"
            items={["Projects", "Activity", "Reports"].map((label) => ({ id: label, label }))}
          />
        }
        actions={
          <>
            <IconButton label={labels[0]} size="sm"><AtlasIcon name="Search" /></IconButton>
            <IconButton label={labels[1]} size="sm"><AtlasIcon name="MessageQuestion" /></IconButton>
            <Avatar name="Morgan Lee" size="sm" />
          </>
        }
      >
        <Stack gap="md">
          <PageHeader title="Projects" description="Plan and monitor active work." level={3} />
          <CollectionList label="Projects" items={collectionItems(context, 3)} />
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "breadcrumb") {
    return (
      <ContextPage context={context}>
        <Breadcrumbs items={labels.map((label, index) => ({ id: label, label, href: index < labels.length - 1 ? `#${index}` : undefined }))} />
        <SettingSurface title={labels.at(-1)} description="Permissions inherited from Northstar.">
          <CollectionList label="Access" items={collectionItems(context, 2)} />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "side-navigation") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Admin"
        brand={<AtlasIcon name="Lock" />}
        sidebar={
          <SideNavigation
            label={context.labels[0]}
            activeId={selected}
            onNavigate={setSelected}
            items={labels.map((label) => ({ id: label, label, badge: label === labels[1] ? 3 : undefined }))}
          />
        }
      >
        <Stack gap="md">
          <PageHeader title={selected} description="Organization-wide settings and access." level={3} />
          <SettingSurface title="Members"><CollectionList label="Members" items={collectionItems(context, 2)} /></SettingSurface>
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "navigation-rail") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Inbox"
        brand={<AtlasIcon name="Mail" />}
        sidebar={
          <NavigationRail
            label={context.labels[0]}
            activeId={selected}
            onNavigate={setSelected}
            items={compactItems}
          />
        }
      >
        <Stack gap="md">
          <PageHeader title={selected} description="Messages that need your attention." level={3} />
          <CollectionList label="Inbox" items={collectionItems(context, 3)} />
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "navigation-bar") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Workspace"
        brand={<AtlasIcon name="Smartphone" />}
        navigation={
          <NavigationBar
            label={context.labels[0]}
            activeId={selected}
            onNavigate={setSelected}
            items={labels.map((label) => ({ id: label, label }))}
          />
        }
      >
        <Stack gap="md">
          <PageHeader title={selected} description="Primary workspace destination." level={3} />
          <CollectionList label={selected} items={collectionItems(context, 2)} />
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "tab-bar") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={selected} description="Mobile account destination">
          <CollectionList label={selected} items={collectionItems(context, 2)} />
        </SettingSurface>
        <TabBar
          label={context.labels[0]}
          activeId={selected}
          onNavigate={setSelected}
          items={compactItems}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "pagination") {
    return (
      <ContextPage context={context}>
        <DataTable
          caption={context.labels[0]}
          items={collectionItems(context, 2)}
          getRowId={(item) => item.id}
          columns={[
            { id: "event", header: "Event", rowHeader: true, cell: (item) => item.primary },
            { id: "status", header: "Status", cell: () => <StatusBadge>Complete</StatusBadge> },
          ]}
        />
        <nav aria-label={context.labels[0]}>
          <Cluster justify="between">
            <Text tone="muted" size="xs">21-40 of 126</Text>
            <Cluster>
              {["Previous", "1", "2", "3", "Next"].map((label) => (
                <Button
                  key={label}
                  size="sm"
                  disabled={label === "Previous"}
                  aria-current={label === "2" ? "page" : undefined}
                  aria-label={/^\d+$/.test(label) ? `Page ${label}` : label}
                >
                  {label}
                </Button>
              ))}
            </Cluster>
          </Cluster>
        </nav>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <Tabs
        label={context.labels[0]}
        selectedId={selected}
        onSelectionChange={setSelected}
        items={labels.map((label) => ({
          id: label,
          label,
          panel: (
            <Stack gap="sm">
              <Heading level={4} size="sm">{label}</Heading>
              <Text tone="muted">{context.labels[1]}</Text>
              <CollectionList label={label} items={collectionItems(context, 2)} />
            </Stack>
          ),
        }))}
      />
    </ContextPage>
  );
}

function ContentPreview(context: PreviewContext) {
  const label = support(context, 0, context.story.card.title);
  if (context.entryId === "avatar") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assignee">
          <Cluster>
            <Avatar name={label} size="lg" status="online" />
            <Stack gap="xs">
              <Heading level={4} size="sm">{label}</Heading>
              <Text tone="muted" size="xs">{support(context, 1, "Product design")}</Text>
            </Stack>
            <Button size="sm" tone="quiet">Change</Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "icon") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]} description="Icons reinforce labeled actions; they do not replace meaning.">
          <Cluster role="toolbar" aria-label={context.labels[0]}>
            <IconButton label={label}><AtlasIcon name="Check" /></IconButton>
            <IconButton label={support(context, 1, "Search")}><AtlasIcon name="Search" /></IconButton>
            <IconButton label={support(context, 2, "More")}><AtlasIcon name="MoreHorizontal" /></IconButton>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "badge") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Inbox">
          <Cluster justify="between">
            <Cluster><AtlasIcon name="Mail" /><Text>{label}</Text></Cluster>
            <Badge tone="info" aria-label="103 unread messages">99+</Badge>
          </Cluster>
          <CollectionList label="Unread messages" items={collectionItems(context, 2)} />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "tag") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]} description="Tags describe the issue and can be scanned together.">
          <Cluster>
            <Tag>{label}</Tag>
            <Tag>Access</Tag>
            <Tag>Needs review</Tag>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <SettingSurface title={context.labels[0]} description="Interactive chips expose their selected state.">
        <Cluster>
          <Chip selected onClick={() => context.interactive && context.setEnabled(true)}>{label}</Chip>
          <Chip>Open</Chip>
          <Chip>High priority</Chip>
        </Cluster>
        <CollectionList label="Filtered issues" items={collectionItems(context, 2)} />
      </SettingSurface>
    </ContextPage>
  );
}

function CollectionPreview(context: PreviewContext) {
  const items = collectionItems(context, 3);
  if (["table", "audit-log"].includes(context.entryId)) {
    const rows = items.map((item, index) => ({ id: item.id, name: item.primary, actor: support(context, index + 1, `Member ${index + 1}`), state: index === 0 ? "Ready" : "Pending" }));
    return (
      <ContextPage context={context} actions={<Button size="sm">Export</Button>}>
        <DataTable
          caption={context.labels[0]}
          items={rows}
          getRowId={(row) => row.id}
          columns={[
            { id: "name", header: support(context, 0, "Name"), rowHeader: true, cell: (row) => row.name },
            { id: "actor", header: support(context, 1, "Owner"), cell: (row) => row.actor },
            { id: "state", header: support(context, 2, "Status"), cell: (row) => <StatusBadge tone={row.state === "Ready" ? "success" : "warning"}>{row.state}</StatusBadge> },
          ]}
        />
      </ContextPage>
    );
  }
  if (["data-grid", "bulk-selection-and-actions"].includes(context.entryId)) {
    return (
      <ContextPage context={context}>
        <Stack gap="sm">
          <Cluster justify="between">
            <BooleanField
              label={context.enabled ? "3 selected" : "Select all"}
              checked={context.enabled}
              onChange={(event) =>
                context.interactive && context.setEnabled(event.currentTarget.checked)}
            />
            <Cluster>
              <Button size="sm" disabled={!context.enabled}>Change role</Button>
              <Button size="sm" tone="danger" disabled={!context.enabled}>Remove</Button>
            </Cluster>
          </Cluster>
          <DataTable
            caption={context.labels[0]}
            items={items}
            getRowId={(item) => item.id}
            columns={[
              { id: "select", header: "Select", cell: () => <Checkbox aria-label="Select row" /> },
              { id: "item", header: support(context, 0, "Member"), rowHeader: true, cell: (item) => item.primary },
              { id: "role", header: support(context, 1, "Role"), cell: () => "Editor" },
              { id: "status", header: "Status", cell: () => <StatusBadge tone="success">Active</StatusBadge> },
            ]}
          />
        </Stack>
      </ContextPage>
    );
  }
  if (context.entryId === "tree-view") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Files" description="Expand folders and move focus through visible tree items.">
          <TreeView
            label={context.labels[0]}
            expandedIds={["src", "components"]}
            selectedId="app"
            onExpandedChange={noop}
            onSelectionChange={(id) => context.interactive && context.setSelected(id)}
            nodes={[{
              id: "src",
              label: support(context, 0, "src"),
              children: [{
                id: "components",
                label: support(context, 1, "components"),
                children: [{ id: "app", label: support(context, 2, "app.tsx") }],
              }],
            }, { id: "tests", label: support(context, 3, "tests") }]}
          />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "kanban-board") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">Add work</Button>}>
        <Cluster align="start">
          {[0, 1, 2].map((index) => (
            <Surface key={index} as="section">
              <Stack gap="sm">
                <Cluster justify="between">
                  <Heading level={4} size="sm">{support(context, index, `Column ${index + 1}`)}</Heading>
                  <Badge>{index + 1}</Badge>
                </Cluster>
                <CollectionList
                  label={`Column ${index + 1}`}
                  items={[{
                    ...(items[index] ?? items[0]),
                    secondary: index === 1 ? "Due today" : "Release 2.4",
                    meta: <Avatar name={["Morgan Lee", "Sam Kim", "Jordan Doe"][index]} size="sm" />,
                  }]}
                />
              </Stack>
            </Surface>
          ))}
        </Cluster>
      </ContextPage>
    );
  }
  if (context.entryId === "dashboard") {
    return (
      <ContextPage context={context} actions={<Button size="sm">This week</Button>}>
        <Cluster>
          {[0, 1, 2].map((index) => (
            <Surface key={index} as="article" elevation="raised">
              <Stack gap="xs">
                <Text tone="muted" size="xs">{support(context, index, `Metric ${index + 1}`)}</Text>
                <Heading level={4} size="lg">{[24, 3, 8][index]}</Heading>
                <Text tone={index === 1 ? "default" : "muted"} size="xs">
                  {index === 1 ? "Needs attention" : "Within target"}
                </Text>
              </Stack>
            </Surface>
          ))}
        </Cluster>
        <SettingSurface title={support(context, 3, "Throughput")}>
          <ProgressBar label="Completed" value={68} valueText="68%" />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "comment-thread") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Review thread">
          <CollectionList
            label={context.labels[0]}
            items={items.slice(0, 2).map((item, index) => ({
              ...item,
              primary: index === 0 ? "Morgan Lee" : "Sam Kim",
              secondary: index === 0 ? support(context, 1, "Can we narrow the scope?") : support(context, 3, "Updated."),
              leading: <Avatar name={index === 0 ? "Morgan Lee" : "Sam Kim"} size="sm" />,
              meta: index === 0 ? "10:42" : "11:08",
            }))}
          />
          <TextArea
            aria-label="Reply"
            placeholder="Reply to the thread"
            value={context.selected}
            onChange={(event) =>
              context.interactive && context.setSelected(event.currentTarget.value)}
          />
          <Cluster justify="end"><Button size="sm" tone="primary">Reply</Button></Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "collaborative-presence") {
    return (
      <ContextPage
        context={context}
        actions={
          <AvatarGroup
            label="Editing now"
            people={["Morgan Lee", "Sam Kim", "Jordan Doe"].map((name) => ({ name, status: "online" as const }))}
          />
        }
      >
        <SettingSurface title="Launch plan" description="Morgan is editing the rollout section.">
          <Text>Confirm owners, milestones, and the final launch decision.</Text>
          <InlineAlert tone="info" title="Sam is viewing this section">Changes appear as collaborators edit.</InlineAlert>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "card") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">New project</Button>}>
        <Cluster align="start">
          {items.map((item, index) => (
            <Surface key={item.id} as="article" elevation="raised">
              <Stack gap="sm">
                <Cluster justify="between">
                  <AtlasIcon name={index === 0 ? "Target" : index === 1 ? "GridView" : "Workflow"} />
                  <Cluster gap="xs">
                    <StatusBadge tone={index === 0 ? "success" : "neutral"}>
                      {index === 0 ? "On track" : "Planning"}
                    </StatusBadge>
                    <IconButton label={`More actions for ${item.primary}`} size="sm">
                      <AtlasIcon name="MoreHorizontal" />
                    </IconButton>
                  </Cluster>
                </Cluster>
                <Heading level={4} size="sm">
                  <a href={`#project-${item.id}`} onClick={preventNavigation}>{item.primary}</a>
                </Heading>
                <Text tone="muted" size="xs">{item.secondary ?? "Updated recently"}</Text>
                <Cluster gap="xs">
                  <Avatar name={["Morgan Lee", "Sam Kim", "Jordan Doe"][index]} size="sm" />
                  <Text tone="muted" size="xs">Updated {index + 1}d ago</Text>
                </Cluster>
              </Stack>
            </Surface>
          ))}
        </Cluster>
      </ContextPage>
    );
  }
  if (context.entryId === "search-and-filtering") {
    return (
      <ContextPage context={context}>
        <Cluster>
          <TextField label="Search issues" type="search" value="access" onChange={noop} />
          {[0, 1, 2].map((index) => <Chip key={index} selected>{support(context, index, `Filter ${index + 1}`)}</Chip>)}
        </Cluster>
        <CollectionList label="Filtered issues" items={items} />
      </ContextPage>
    );
  }
  if (context.entryId === "filter-bar") {
    return (
      <ContextPage context={context}>
        <Cluster justify="between">
          <Cluster>
            {[0, 1].map((index) => (
              <Tag key={index} onRemove={noop} removeLabel={`Remove ${support(context, index, "filter")}`}>
                {support(context, index, `Filter ${index + 1}`)}
              </Tag>
            ))}
          </Cluster>
          <Button size="sm" tone="quiet">{support(context, 2, "Clear")}</Button>
        </Cluster>
        <DataTable
          caption="Filtered audit log"
          items={items}
          getRowId={(item) => item.id}
          columns={[
            { id: "event", header: "Event", rowHeader: true, cell: (item) => item.primary },
            { id: "status", header: "Status", cell: () => <StatusBadge>Matched</StatusBadge> },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "sorting") {
    return (
      <ContextPage context={context}>
        <Cluster justify="end">
          <SelectField
            label={support(context, 0, "Sort")}
            value="newest"
            onChange={noop}
            options={[
              { value: "newest", label: support(context, 1, "Newest first") },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
        </Cluster>
        <CollectionList label="Sorted projects" items={items.map((item, index) => ({ ...item, meta: `${index + 1}d ago` }))} />
      </ContextPage>
    );
  }
  if (context.entryId === "conversation-history") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">New conversation</Button>}>
        <TextField label="Search conversations" type="search" value="" onChange={noop} />
        <Heading level={4} size="sm">Recent</Heading>
        <CollectionList
          label={context.labels[0]}
          items={items.map((item, index) => ({
            ...item,
            leading: <AtlasIcon name="MessageSquare" />,
            primary: ["Launch risks", "Access review", "Migration plan"][index],
            secondary: ["Release risks and owners", "Permission gaps", "Customer migration"][index],
            meta: index === 0 ? <StatusBadge tone="info">Open</StatusBadge> : ["", "Yesterday", "Monday"][index],
            action: <IconButton label={`More actions for ${item.primary}`} size="sm"><AtlasIcon name="MoreHorizontal" /></IconButton>,
          }))}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "saved-view") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">Save current view</Button>}>
        <CollectionList
          label={context.labels[0]}
          items={items.map((item, index) => ({
            ...item,
            leading: <AtlasIcon name="Pin" />,
            primary: ["My open issues", "Needs security review", "Stale accounts"][index],
            secondary: ["Owner: me, status: open", "Review: required", "Updated more than 7 days ago"][index],
            meta: index === 0 ? <Badge tone="info">Default</Badge> : <Text tone="muted" size="xs">Last run {index + 1}d ago</Text>,
            action: (
              <Cluster gap="xs">
                <IconButton label={`Edit ${item.primary}`} size="sm"><AtlasIcon name="Edit" /></IconButton>
                <IconButton label={`Run ${item.primary}`} size="sm"><AtlasIcon name="ArrowRight" /></IconButton>
              </Cluster>
            ),
          }))}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "activity-feed") {
    return (
      <ContextPage context={context}>
        <CollectionList
          label={context.labels[0]}
          items={items.map((item, index) => ({
            ...item,
            leading: <Avatar name={["Morgan Lee", "Sam Kim", "System"][index]} size="sm" />,
            primary: ["Morgan Lee updated Access policy", "Sam Kim joined Northstar", "System completed Customer export"][index],
            secondary: ["Changed guest access from all projects to assigned projects", "Workspace member", "128 records exported"][index],
            meta: ["4 min", "1 hour", "3 hours"][index],
          }))}
        />
        <Cluster><Button size="sm" tone="quiet">Load earlier activity</Button></Cluster>
      </ContextPage>
    );
  }
  if (context.entryId === "notifications") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="quiet">Mark all read</Button>}>
        <Stack gap="sm">
          <Cluster justify="between">
            <Heading level={4} size="sm">Today</Heading>
            <Badge tone="info">2 unread</Badge>
          </Cluster>
          <CollectionList
            label={context.labels[0]}
            items={items.map((item, index) => ({
              ...item,
              leading: <AtlasIcon name={index === 0 ? "MessageSquare" : index === 1 ? "CircleCheck" : "FileText"} />,
              primary: ["Morgan mentioned you", "Access request approved", "Export is ready"][index],
              secondary: ["Launch plan", "Northstar workspace", "Customer records"][index],
              meta: index < 2 ? <Badge tone="info">Unread</Badge> : "3 hours",
              action: index === 0 ? <Button size="sm" tone="quiet">Reply</Button> : undefined,
            }))}
          />
        </Stack>
      </ContextPage>
    );
  }
  if (context.entryId === "notification-center") {
    const labels = ["All", "Mentions", "Approvals"];
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="quiet">Mark all read</Button>}>
        <Cluster justify="between">
          <Text tone="muted" size="xs">8 unread across this workspace</Text>
          <Button size="sm" tone="quiet">Notification settings</Button>
        </Cluster>
        <Tabs
          label="Notification categories"
          selectedId="All"
          onSelectionChange={noop}
          items={labels.map((label) => ({
            id: label,
            label,
            panel: (
              <CollectionList
                label={`${label} notifications`}
                items={items.map((item, index) => ({
                  ...item,
                  leading: <AtlasIcon name={index === 0 ? "CircleCheck" : index === 1 ? "MessageSquare" : "FileText"} />,
                  secondary: ["Access request approved", "Mentioned in Atlas", "Export completed"][index],
                  meta: index === 0 ? <Badge tone="info">Unread</Badge> : `${index + 1} hours`,
                  action: <IconButton label={`Open ${item.primary}`} size="sm"><AtlasIcon name="ArrowRight" /></IconButton>,
                }))}
              />
            ),
          }))}
        />
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <CollectionList label={context.labels[0]} items={items} />
    </ContextPage>
  );
}

function FeedbackPreview(context: PreviewContext) {
  const first = support(context, 0, "Saved");
  const second = support(context, 1, "Your changes are available.");
  if (context.entryId === "toast") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Members">
          <CollectionList label="Members" items={collectionItems(context, 2)} />
        </SettingSurface>
        <ToastRegion
          toasts={[{ id: "preview", title: first, description: second, tone: "success" }]}
          onDismiss={context.interactive ? noop : undefined}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "progress-indicator") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={first} description="The destination and filename remain visible.">
          <CollectionList
            label="Uploads"
            items={[{
              id: "file",
              primary: first,
              secondary: "1.8 MB CSV",
              leading: <AtlasIcon name="FileText" />,
            }]}
          />
          <ProgressBar
            label="Uploading"
            value={context.active ? 72 : 24}
            valueText={context.active ? "72%" : "24%"}
          />
          <Cluster justify="end"><Button size="sm" tone="quiet">Cancel</Button></Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "spinner") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Search results">
          <TextField label="Search" value="access policy" onChange={noop} />
          <LoadingStatus label={first} />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "loading-state") {
    const rows = [
      { id: "event-1", event: "Policy updated", actor: "Mina", status: "Complete" },
      { id: "event-2", event: "Access reviewed", actor: "Dev", status: "Complete" },
    ];
    return (
      <ContextPage context={context}>
        <Surface
          as="section"
          aria-label="Audit event updates"
          aria-busy="true"
          elevation="raised"
        >
          <Stack gap="sm">
            <Cluster justify="between">
              <Heading level={4} size="sm">Recent audit events</Heading>
              <StatusBadge tone="info">Updating</StatusBadge>
            </Cluster>
            <DataTable
              caption="Recent audit events"
              items={rows}
              getRowId={(row) => row.id}
              columns={[
                { id: "event", header: "Event", rowHeader: true, cell: (row) => row.event },
                { id: "actor", header: "Actor", cell: (row) => row.actor },
                { id: "status", header: "Status", cell: (row) => <StatusBadge tone="success">{row.status}</StatusBadge> },
              ]}
            />
            <LoadingStatus label={first} />
          </Stack>
        </Surface>
      </ContextPage>
    );
  }
  if (context.entryId === "skeleton") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Customer record">
          <Stack gap="sm" aria-busy="true" aria-label={context.labels[0]}>
            <Cluster>
              <Skeleton shape="circle" width="2.5rem" height="2.5rem" />
              <Stack gap="xs">
                <Skeleton width="8rem" />
                <Skeleton width="5rem" />
              </Stack>
            </Cluster>
            <Divider />
            <Skeleton width="100%" height="2.75rem" />
            <Cluster>
              <Skeleton width="46%" height="3.5rem" />
              <Skeleton width="46%" height="3.5rem" />
            </Cluster>
          </Stack>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "empty-state") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Saved views">
          <EmptyState
            title={first}
            description={second}
            action={{ label: support(context, 2, "Create first item"), onAction: noop }}
          />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "impersonation-banner") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Customer support"
        brand={<AtlasIcon name="Lock" />}
        actions={<Button size="sm" tone="danger">{support(context, 1, "Exit session")}</Button>}
      >
        <Stack gap="md">
          <InlineAlert title={first} tone="warning">{second}</InlineAlert>
          <PageHeader title="Customer record" description="Support access is logged." level={3} />
          <CollectionList label="Customer details" items={collectionItems(context, 2)} />
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "banner") {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Northstar"
        brand={<AtlasIcon name="GridView" />}
      >
        <Stack gap="md">
          <InlineAlert title={first} tone="info" actions={<Button size="sm">{support(context, 2, "Review")}</Button>}>{second}</InlineAlert>
          <PageHeader title="Workspace" description="Current projects and activity." level={3} />
          <CollectionList label="Projects" items={collectionItems(context, 2)} />
        </Stack>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "notifications" || context.entryId === "notification-center") return <CollectionPreview {...context} />;
  return (
    <ContextPage context={context}>
      <SettingSurface title="Account settings">
        <InlineAlert title={first} tone="info">{second}</InlineAlert>
        <TextField label="Billing email" value="billing@northstar.co" onChange={noop} />
      </SettingSurface>
    </ContextPage>
  );
}

function OverlayPreview(context: PreviewContext) {
  const first = support(context, 0, "Option one");
  const second = support(context, 1, "Option two");
  const third = support(context, 2, "Continue");
  const triggerId = `overlay-trigger-${context.entryId}`;
  const surfaceId = `overlay-surface-${context.entryId}`;
  const open = context.enabled;
  const setOpen = (nextOpen: boolean) => {
    if (context.interactive) context.setEnabled(nextOpen);
  };
  const dialogEntries = new Set([
    "command-palette",
    "dialog",
    "alert-dialog",
    "drawer",
    "sheet",
  ]);
  const popoverEntries = new Set(["popover", "tooltip", "menu", "workspace-switcher"]);
  const dialogBody =
    context.entryId === "command-palette" ? (
      <Stack gap="sm">
        <TextField label="Command" type="search" placeholder="Type a command" />
        <CollectionList
          label="Commands"
          items={[first, second, third].map((label, index) => ({
            id: label,
            primary: label,
            leading: <AtlasIcon name={(["File", "Plus", "Repeat"] as const)[index]} />,
            meta: index === 0 ? "Command P" : undefined,
          }))}
        />
      </Stack>
    ) : context.entryId === "drawer" ? (
      <SideNavigation
        label={context.labels[0]}
        activeId={first}
        items={[first, second, third, support(context, 3, "Settings")].map((label) => ({
          id: label,
          label,
        }))}
      />
    ) : context.entryId === "sheet" ? (
      <Stack gap="sm">
        <SelectField
          label={first}
          value="morgan"
          onChange={noop}
          options={[{ value: "morgan", label: "Morgan Lee" }, { value: "sam", label: "Sam Kim" }]}
        />
        <SelectField
          label={second}
          value="open"
          onChange={noop}
          options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]}
        />
      </Stack>
    ) : (
      <Text>{context.entryId === "alert-dialog" ? first : context.labels[1]}</Text>
    );

  const popoverBody = context.entryId === "tooltip" ? (
      <Text>{first}</Text>
    ) : context.entryId === "menu" ? (
      <Stack gap="xs">
        {[first, second, third].map((label, index) => (
          <Button
            key={label}
            role="menuitem"
            tone="quiet"
            size="sm"
            onClick={() => setOpen(false)}
          >
            <AtlasIcon name={(["Edit", "Copy", "Archive"] as const)[index]} />
            {label}
          </Button>
        ))}
      </Stack>
    ) : context.entryId === "workspace-switcher" ? (
      <Stack gap="sm">
        <TextField label="Find workspace" type="search" value="" onChange={noop} />
        <CollectionList
          label={context.labels[0]}
          items={[first, second, third].map((label, index) => ({
            id: label,
            primary: label,
            leading: <Avatar name={label} initials={label.slice(0, 1)} size="sm" />,
            meta: index === 0 ? <StatusBadge tone="success">Current</StatusBadge> : undefined,
            action: index === 0 ? undefined : <Button size="sm">Switch</Button>,
          }))}
        />
      </Stack>
    ) : (
      <Stack gap="sm">
        <TextField label={first} value={context.selected} onChange={noop} />
        <SelectField
          label={second}
          value="open"
          onChange={noop}
          options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]}
        />
        <Cluster justify="end"><Button size="sm" tone="primary">{third}</Button></Cluster>
      </Stack>
    );

  const triggerLabel = context.entryId === "workspace-switcher"
    ? "Northstar"
    : context.entryId === "command-palette"
      ? "Open command palette"
      : context.entryId === "alert-dialog"
        ? "Delete workspace"
        : context.entryId === "drawer"
          ? "Open navigation"
          : context.entryId === "sheet"
            ? "Assign issue"
            : context.entryId === "menu"
              ? "More actions"
              : context.entryId === "tooltip"
                ? "Show help"
                : context.entryId === "popover"
                  ? "Filter projects"
                  : "Edit workspace";

  const trigger = context.entryId === "menu" || context.entryId === "tooltip" ? (
    <IconButton
      id={triggerId}
      label={triggerLabel}
      size="sm"
      aria-haspopup={context.entryId === "menu" ? "menu" : undefined}
      aria-expanded={context.entryId === "menu" ? open : undefined}
      aria-controls={context.entryId === "menu" && open ? surfaceId : undefined}
      aria-describedby={context.entryId === "tooltip" && open ? surfaceId : undefined}
      onClick={() => setOpen(!open)}
      onKeyDown={(event) => {
        if (context.entryId === "tooltip" && event.key === "Escape") setOpen(false);
      }}
    >
      <AtlasIcon name={context.entryId === "menu" ? "MoreHorizontal" : "Info"} />
    </IconButton>
  ) : (
    <Button
      id={triggerId}
      size="sm"
      tone={context.entryId === "alert-dialog" ? "danger" : "neutral"}
      aria-haspopup={dialogEntries.has(context.entryId) || popoverEntries.has(context.entryId) ? "dialog" : undefined}
      aria-expanded={open}
      aria-controls={open ? surfaceId : undefined}
      onClick={() => setOpen(!open)}
    >
      {context.entryId === "workspace-switcher" ? <AtlasIcon name="GridView" /> : null}
      {triggerLabel}
    </Button>
  );

  return (
    <PreviewStage
      label={`${context.story.card.title} preview`}
      inert={!context.interactive}
      height="100%"
    >
      <ApplicationFrame
        label={`${context.story.card.title} background`}
        title="Northstar"
        brand={<AtlasIcon name="GridView" />}
        actions={trigger}
      >
        <Stack gap="md">
          <PageHeader title={context.labels[0]} description="The underlying task remains visible." level={3} />
          <CollectionList label="Workspace items" items={collectionItems(context, 2)} />
        </Stack>
      </ApplicationFrame>
      {dialogEntries.has(context.entryId) ? (
        <StageDialog
          open={open}
          id={surfaceId}
          onOpenChange={setOpen}
          title={context.labels[0]}
          role={context.entryId === "alert-dialog" ? "alertdialog" : "dialog"}
          description={
            context.entryId === "command-palette" || context.entryId === "drawer"
              ? undefined
              : context.labels[1]
          }
          variant={
            context.entryId === "drawer"
              ? "drawer"
              : context.entryId === "sheet"
                ? "sheet"
                : "dialog"
          }
          dismissible={context.entryId !== "alert-dialog"}
          footer={
            context.entryId === "command-palette" || context.entryId === "drawer"
              ? undefined
              : (
                <Cluster justify="end">
                  <Button size="sm" tone="quiet" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    tone={context.entryId === "alert-dialog" ? "danger" : "primary"}
                    onClick={() => setOpen(false)}
                  >
                    {third}
                  </Button>
                </Cluster>
              )
          }
        >
          {dialogBody}
        </StageDialog>
      ) : null}
      {context.entryId === "tooltip" ? (
        <StagePopover
          open={open}
          id={surfaceId}
          onOpenChange={setOpen}
          label={context.labels[0]}
          placement="top-end"
          role="tooltip"
        >
          {popoverBody}
        </StagePopover>
      ) : context.entryId === "menu" ? (
        <StagePopover
          open={open}
          id={surfaceId}
          onOpenChange={setOpen}
          label={context.labels[0]}
          placement="top-end"
          role="menu"
        >
          {popoverBody}
        </StagePopover>
      ) : popoverEntries.has(context.entryId) ? (
        <StagePopover
          open={open}
          id={surfaceId}
          onOpenChange={setOpen}
          label={context.labels[0]}
          placement="top-end"
          role="dialog"
        >
          {popoverBody}
        </StagePopover>
      ) : null}
    </PreviewStage>
  );
}

function DisclosurePreview(context: PreviewContext) {
  if (context.entryId === "disclosure") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Security">
          <details open={context.active}>
            <summary>{context.labels[0]}</summary>
            <Stack gap="sm">
              <Text tone="muted">{context.labels[1]}</Text>
              <BooleanField label={support(context, 0, "Retention")} checked readOnly />
              <BooleanField label={support(context, 1, "Encryption")} checked readOnly />
            </Stack>
          </details>
        </SettingSurface>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <SettingSurface title={context.labels[0]} description={context.labels[1]}>
        <Stack gap="xs">
          {[0, 1, 2].map((index) => (
            <details key={index} open={index === 0 || (index === 1 && context.active)}>
              <summary>{support(context, index, `Section ${index + 1}`)}</summary>
              <Text tone="muted">Guidance and requirements for this policy section.</Text>
            </details>
          ))}
        </Stack>
      </SettingSurface>
    </ContextPage>
  );
}

function LayoutPreview(context: PreviewContext) {
  if (context.entryId === "divider") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="General">
          <BooleanField label="Allow invitations" checked readOnly />
        </SettingSurface>
        <Divider />
        <SettingSurface title="Danger zone">
          <Cluster justify="between">
            <Text tone="muted">Delete this workspace and its data.</Text>
            <Button size="sm" tone="danger">Delete workspace</Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (["split-view", "master-detail"].includes(context.entryId)) {
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title={context.entryId === "split-view" ? "Compare" : "Customers"}
        brand={<AtlasIcon name="Columns2" />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "minmax(8rem, 0.82fr) auto minmax(12rem, 1.18fr)", gap: "0.5rem", height: "100%" }}>
          <Surface>
            <Stack gap="sm">
              <Heading level={4} size="sm">{context.entryId === "split-view" ? "Current" : "Customers"}</Heading>
              <CollectionList label={context.labels[0]} items={collectionItems(context, 3)} />
            </Stack>
          </Surface>
          <Divider
            role="separator"
            aria-orientation="vertical"
            aria-label={context.entryId === "split-view" ? "Resize comparison panes" : "Resize customer list"}
            aria-valuemin={25}
            aria-valuemax={75}
            aria-valuenow={42}
            tabIndex={0}
          />
          <Surface elevation="raised">
            <Stack gap="sm">
              <PageHeader
                title={context.entryId === "split-view" ? "Proposed" : support(context, 0, "Acme")}
                description={context.labels[1]}
                level={4}
              />
              <Divider />
              <Text>{support(context, 1, "Selected record details and activity.")}</Text>
              <CollectionList label="Details" items={collectionItems(context, 2)} />
            </Stack>
          </Surface>
        </div>
      </ApplicationFrame>
    );
  }
  if (context.entryId === "record-detail") {
    return (
      <ContextPage context={context} actions={<Button size="sm">Edit</Button>}>
        <Cluster justify="between">
          <Cluster>
            <Avatar name={support(context, 0, "Acme Corp")} size="lg" />
            <Stack gap="xs">
              <Heading level={4} size="md">{support(context, 0, "Acme Corp")}</Heading>
              <Text tone="muted" size="xs">{support(context, 2, "Enterprise")}</Text>
            </Stack>
          </Cluster>
          <StatusBadge tone="success">{support(context, 1, "Active")}</StatusBadge>
        </Cluster>
        <SettingSurface title="Account details">
          <CollectionList
            label="Customer details"
            items={[
              { id: "owner", primary: "Owner", meta: support(context, 3, "Morgan Lee") },
              { id: "renewal", primary: "Renewal", meta: "Oct 24, 2026" },
              { id: "region", primary: "Region", meta: "North America" },
            ]}
          />
        </SettingSurface>
        <Tabs
          label="Customer record sections"
          selectedId="relationships"
          onSelectionChange={noop}
          items={[
            {
              id: "relationships",
              label: "Relationships",
              panel: <CollectionList label="Related records" items={collectionItems(context, 2)} />,
            },
            {
              id: "activity",
              label: "Activity",
              panel: <Text tone="muted">Last updated by Morgan Lee today.</Text>,
            },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "admin-console") {
    const labels = [0, 1, 2, 3].map((index) => support(context, index, `Section ${index + 1}`));
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title="Organization settings"
        brand={<AtlasIcon name="Lock" />}
        sidebar={<SideNavigation label="Administration" activeId={labels[1]} items={labels.map((label) => ({ id: label, label }))} />}
      >
        <Stack gap="md">
          <PageHeader
            title={labels[1]}
            description="Restricted governance workspace"
            level={3}
            actions={<><Badge tone="warning">Admin only</Badge><Button size="sm" tone="primary">Create policy</Button></>}
          />
          <Cluster>
            <Surface elevation="raised"><Stack gap="xs"><Text tone="muted" size="xs">Members</Text><Heading level={4} size="lg">248</Heading></Stack></Surface>
            <Surface elevation="raised"><Stack gap="xs"><Text tone="muted" size="xs">Policy exceptions</Text><Heading level={4} size="lg">3</Heading></Stack></Surface>
          </Cluster>
          <DataTable
            caption="Organization access policies"
            items={[
              { id: "sso", policy: "Require single sign-on", owner: "Security", status: "Enforced" },
              { id: "devices", policy: "Managed devices", owner: "IT", status: "Review" },
            ]}
            getRowId={(item) => item.id}
            columns={[
              { id: "policy", header: "Policy", rowHeader: true, cell: (item) => item.policy },
              { id: "owner", header: "Owner", cell: (item) => item.owner },
              { id: "status", header: "Status", cell: (item) => <StatusBadge tone={item.status === "Enforced" ? "success" : "warning"}>{item.status}</StatusBadge> },
              { id: "actions", header: "Actions", cell: (item) => <IconButton label={`Edit ${item.policy}`} size="sm"><AtlasIcon name="Edit" /></IconButton> },
            ]}
          />
        </Stack>
      </ApplicationFrame>
    );
  }
  return (
    <ContextPage context={context}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(9rem, 0.75fr) minmax(12rem, 1.25fr)", gap: "0.5rem" }}>
        <CollectionList
          label="Issues"
          items={collectionItems(context, 3).map((item, index) => ({
            ...item,
            meta: index === 0 ? <StatusBadge tone="info">Selected</StatusBadge> : item.meta,
          }))}
        />
        <Surface as="section" elevation="raised">
          <Stack gap="sm">
            <Cluster justify="between">
              {previewHeader(context)}
              <IconButton label="Close panel" size="sm"><AtlasIcon name="X" /></IconButton>
            </Cluster>
            <Divider />
            <Text>{support(context, 0, "Panel content")}</Text>
            <CollectionList label="Selected issue details" items={collectionItems(context, 2)} />
          </Stack>
        </Surface>
      </div>
    </ContextPage>
  );
}

function FormPreview(context: PreviewContext) {
  const first = support(context, 0, "Name");
  const hasError = context.entryId === "form-validation" && context.active;
  return (
    <ContextPage context={context}>
      <SettingSurface title={context.labels[0]} description={context.labels[1]}>
        <form onSubmit={(event) => event.preventDefault()}>
          <Stack gap="md">
            <FormSection title="Member details">
              <TextField
                label={first}
                value={context.selected}
                error={hasError ? support(context, 1, "A value is required") : undefined}
                onChange={(event) =>
                  context.interactive && context.setSelected(event.currentTarget.value)}
              />
              <TextField
                label="Email"
                type="email"
                value={hasError ? "morgan@" : "morgan@northstar.co"}
                error={hasError ? support(context, 1, "Enter a valid address") : undefined}
                onChange={noop}
              />
              <SelectField
                label={support(context, 2, "Role")}
                value="editor"
                onChange={noop}
                options={[{ value: "editor", label: "Editor" }, { value: "viewer", label: "Viewer" }]}
              />
            </FormSection>
            <FormActions>
              <Button size="sm" tone="quiet">Cancel</Button>
              <Button size="sm" tone="primary" type="submit">Create member</Button>
            </FormActions>
          </Stack>
        </form>
      </SettingSurface>
    </ContextPage>
  );
}

function FlowPreview(context: PreviewContext) {
  const activeIndex = context.active ? 2 : 1;
  const stepLabels = [0, 1, 2, 3].map((index) => support(context, index, `Step ${index + 1}`));
  const steps = stepLabels.map((label, index) => ({
    id: `step-${index}`,
    label,
    description: index === activeIndex ? "In progress" : undefined,
    status: index < activeIndex
      ? "complete" as const
      : index === activeIndex
        ? "current" as const
        : "upcoming" as const,
  }));
  if (context.entryId === "stepper") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Import progress" description="A compact indicator reports position; it does not own the task content.">
          <StepIndicator label={context.labels[0]} items={steps} compact />
          <InlineAlert tone="info" title={stepLabels[activeIndex]}>
            Step {activeIndex + 1} of {steps.length}: validating customer records.
          </InlineAlert>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "onboarding-checklist") {
    return (
      <ContextPage context={context}>
        <ProgressBar label="Workspace setup" value={66} valueText="2 of 3 complete" />
        <CollectionList
          label={context.labels[0]}
          items={stepLabels.slice(0, 3).map((label, index) => ({
            id: label,
            primary: label,
            leading: <Checkbox checked={index < 2} readOnly aria-label={`${label} complete`} />,
            meta: index < 2 ? <StatusBadge tone="success">Done</StatusBadge> : <Button size="sm">Start</Button>,
          }))}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "import-workflow") {
    const rows = collectionItems(context, 2);
    return (
      <ContextPage context={context}>
        <StepIndicator label="Import progress" items={steps} compact />
        <ProgressBar label="Validating rows" value={context.active ? 76 : 20} valueText={context.active ? "76 rows" : "20 rows"} />
        <DataTable
          caption={context.labels[0]}
          items={rows}
          getRowId={(item) => item.id}
          columns={[
            { id: "item", header: support(context, 0, "Record"), cell: (item) => item.primary },
            { id: "status", header: "Status", cell: () => <StatusBadge tone="success">Valid</StatusBadge> },
          ]}
        />
        <Cluster justify="end"><Button size="sm" tone="primary">Import valid rows</Button></Cluster>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <StepIndicator label={context.labels[0]} items={steps} />
      <SettingSurface title={stepLabels[activeIndex]} description={context.labels[1]}>
        <TextField label="Field mapping" value="Email to Customer email" onChange={noop} />
        <Cluster justify="end">
          <Button size="sm" tone="quiet">Back</Button>
          <Button size="sm" tone="primary">Continue</Button>
        </Cluster>
      </SettingSurface>
    </ContextPage>
  );
}

function AiPreview(context: PreviewContext) {
  const first = support(context, 0, "Summarize this workspace");
  const second = support(context, 1, "Generate response");
  const third = support(context, 2, "Source");
  if (context.entryId === "ai-composer") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Ask about this workspace" description="Attached context is visible before sending.">
          <TextArea
            aria-label={context.labels[0]}
            placeholder={first}
            value={context.selected}
            onChange={(event) =>
              context.interactive && context.setSelected(event.currentTarget.value)}
          />
          <Cluster justify="between">
            <Tag><AtlasIcon name="Paperclip" size="xs" /> context.pdf</Tag>
            <Button size="sm" tone="primary"><AtlasIcon name="Sent" />{second}</Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "prompt-suggestions") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Start with a prompt" description="Suggestions are optional shortcuts, not required choices.">
          <Stack gap="sm">
            {[first, second, third].map((label, index) => (
              <Button
                key={label}
                size="sm"
                tone="quiet"
                onClick={() => context.interactive && context.setSelected(label)}
              >
                <AtlasIcon name={(["FileText", "Search", "Edit"] as const)[index]} />
                {label}
              </Button>
            ))}
            <TextArea
              aria-label="Prompt"
              placeholder="Ask about this workspace"
              value={context.selected}
              onChange={(event) => context.interactive && context.setSelected(event.currentTarget.value)}
            />
            <Cluster justify="end"><Button size="sm" tone="primary">Send prompt</Button></Cluster>
          </Stack>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "ai-label") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]}>
          <Cluster><Badge tone="info"><AtlasIcon name="Zap" size="xs" />AI generated</Badge><Text tone="muted" size="xs">Review before sharing</Text></Cluster>
          <Text>{first}</Text>
          <details>
            <summary>{second || "Why this label appears"}</summary>
            <Text tone="muted" size="xs">This summary was generated from project activity and has not been edited by a person.</Text>
          </details>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "ai-feature-entry") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Project overview" description="The AI capability is introduced next to the task it helps with.">
          <Cluster justify="between" align="center">
            <Text>Summarize risks, decisions, and open questions.</Text>
            <Cluster>
              <Button tone="quiet"><AtlasIcon name="Edit" />Edit overview</Button>
              <Button tone="neutral"><AtlasIcon name="Zap" />{first}</Button>
            </Cluster>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "streaming-response") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant response">
          <div aria-live="polite" aria-busy={context.active}>
            <Stack gap="sm">
              <Cluster justify="between">
                <Badge tone={context.active ? "info" : "success"}>{context.active ? "Generating" : "Complete"}</Badge>
                {context.active ? <Button size="sm" tone="quiet">Stop</Button> : null}
              </Cluster>
              <Text>{context.active ? `${first} The access review is in progress.` : `${first} The access review is complete.`}</Text>
              {context.active ? <LoadingStatus label={second} /> : null}
            </Stack>
          </div>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "response-regeneration") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant response">
          <Text>{first}</Text>
          <Text tone="muted" size="xs">Previous response remains available while a replacement is generated.</Text>
          <Divider />
          <Cluster>
            <Button size="sm" tone="quiet"><AtlasIcon name="RotateCcw" />{second}</Button>
            <Button size="sm" tone="quiet"><AtlasIcon name="Settings" />Use different model</Button>
          </Cluster>
          {context.active ? <LoadingStatus label="Generating replacement response" /> : null}
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "grounded-answer") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Answer with sources">
          <Text>{first}<sup><a href="#source-policy" onClick={preventNavigation}>1</a></sup> Access reviews run every quarter.<sup><a href="#source-audit" onClick={preventNavigation}>2</a></sup></Text>
          <InlineAlert tone="warning" title="One claim needs review">The source set does not confirm the rollout date.</InlineAlert>
          <Divider />
          <CollectionList
            label="Sources"
            items={[
              {
                id: "source-policy",
                primary: third,
                secondary: "Policy.pdf, page 4",
                leading: <AtlasIcon name="FileText" />,
                action: <IconButton label="Open source 1" size="sm"><AtlasIcon name="ExternalLink" /></IconButton>,
              },
              {
                id: "source-audit",
                primary: "Audit schedule",
                secondary: "Controls handbook, page 12",
                leading: <AtlasIcon name="FileText" />,
                action: <IconButton label="Open source 2" size="sm"><AtlasIcon name="ExternalLink" /></IconButton>,
              },
            ]}
          />
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "context-attachment") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Attached context" description="Review exactly what the assistant can use.">
          <CollectionList
            label={context.labels[0]}
            items={[first, second].map((label, index) => ({
              id: label,
              primary: label,
              secondary: index === 0 ? "Workspace scope, 1.8 MB" : "Conversation scope, 14 MB limit exceeded",
              leading: <AtlasIcon name="FileText" />,
              meta: index === 0 ? <StatusBadge tone="success">Included</StatusBadge> : <StatusBadge tone="danger">Error</StatusBadge>,
              action: index === 0
                ? <IconButton label={`Remove ${label}`} size="sm"><AtlasIcon name="X" /></IconButton>
                : <Button size="sm">Retry</Button>,
            }))}
          />
          <Text tone="muted" size="xs">Removing an attachment excludes it from the next prompt.</Text>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "follow-up-question") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant" description="A consequential ambiguity is resolved before acting.">
          <Text tone="muted" size="xs">You: Update the access policy for the project.</Text>
          <InlineAlert title={first} tone="info">
            Choose the workspace the update should apply to.
          </InlineAlert>
          <Cluster>
            {[second, third].map((label) => <Button key={label} size="sm">{label}</Button>)}
          </Cluster>
          <TextField label="Or answer in your own words" value="" onChange={noop} />
          <Text tone="muted" size="xs">The task resumes after you answer.</Text>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "artifact-preview") {
    return (
      <ContextPage context={context}>
        <Surface as="article" elevation="raised">
          <Stack gap="sm">
            <Cluster justify="between">
              <Cluster><AtlasIcon name="FileText" /><Heading level={3} size="sm">{first}</Heading></Cluster>
              <StatusBadge tone="success">Ready</StatusBadge>
            </Cluster>
            <Divider />
            <Stack gap="xs">
              <Heading level={4} size="sm">Migration plan</Heading>
              <Text tone="muted">{second}</Text>
              <DataTable
                caption="Migration tasks"
                items={[
                  { id: "owners", task: "Confirm owners", status: "Ready" },
                  { id: "access", task: "Review access", status: "Needs review" },
                ]}
                getRowId={(item) => item.id}
                columns={[
                  { id: "task", header: "Task", rowHeader: true, cell: (item) => item.task },
                  { id: "status", header: "Status", cell: (item) => <StatusBadge tone={item.status === "Ready" ? "success" : "warning"}>{item.status}</StatusBadge> },
                ]}
              />
            </Stack>
            <Cluster justify="end"><Button size="sm">Preview</Button><Button size="sm" tone="primary">Apply</Button></Cluster>
          </Stack>
        </Surface>
      </ContextPage>
    );
  }
  if (context.entryId === "ai-feedback") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant response">
          <Text>{first}</Text>
          <Cluster justify="between">
            <Text tone="muted" size="xs">Was this response useful?</Text>
            <Cluster>
              <IconButton
                label="Helpful"
                aria-pressed={context.selected === "helpful"}
                tone={context.selected === "helpful" ? "primary" : "neutral"}
                onClick={() => context.interactive && context.setSelected("helpful")}
              ><AtlasIcon name="ArrowUp" /></IconButton>
              <IconButton
                label="Not helpful"
                aria-pressed={context.selected === "not-helpful"}
                tone={context.selected === "not-helpful" ? "primary" : "neutral"}
                onClick={() => context.interactive && context.setSelected("not-helpful")}
              ><AtlasIcon name="ArrowDown" /></IconButton>
              <Button size="sm" tone="quiet"><AtlasIcon name="AlertCircle" />{third}</Button>
            </Cluster>
          </Cluster>
          {context.selected === "helpful" || context.selected === "not-helpful" ? (
            <Text role="status" tone="muted" size="xs">Feedback submitted. You can change your response.</Text>
          ) : null}
        </SettingSurface>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <SettingSurface title={context.labels[0]}>
        <Text>{first}</Text>
        <Badge tone="info"><AtlasIcon name="Zap" size="xs" />AI</Badge>
      </SettingSurface>
    </ContextPage>
  );
}

function AgentPreview(context: PreviewContext) {
  return (
    <ContextPage context={context}>
      <AgentActivity
        title={context.labels[0]}
        status={context.active ? "running" : "queued"}
        summary={context.labels[1]}
        onStop={context.interactive ? () => context.setEnabled(false) : undefined}
        steps={[0, 1, 2].map((index) => ({
          id: `step-${index}`,
          label: support(context, index, `Step ${index + 1}`),
          summary: index === 0 ? "Completed with 3 records" : undefined,
          status: index === 0
            ? "completed"
            : index === 1 && context.active
              ? "running"
              : "pending",
        }))}
      />
    </ContextPage>
  );
}

function ApprovalPreview(context: PreviewContext) {
  return (
    <ContextPage context={context}>
      <ActionApproval
        title={context.labels[0]}
        description={context.labels[1]}
        action={support(context, 0, "Apply changes")}
        affectedObjects={[support(context, 1, "3 records")]}
        risk="high"
        reversible
        state={context.approved ? "approved" : "pending"}
        confirmation={{
          label: "I reviewed the scope and impact",
          checked: context.enabled,
          onCheckedChange: (checked) =>
            context.interactive && context.setEnabled(checked),
        }}
        onApprove={() => context.interactive && context.setApproved(true)}
        onReject={() => {
          if (context.interactive) {
            context.setApproved(false);
            context.setEnabled(false);
          }
        }}
      />
    </ContextPage>
  );
}

function RecoveryPreview(context: PreviewContext) {
  return (
    <ContextPage context={context}>
      <SettingSurface title="Assistant">
        <InlineAlert
          tone="danger"
          title={support(context, 0, "Source unavailable")}
          actions={
            <Cluster>
              <Button size="sm" tone="primary">{support(context, 1, "Retry")}</Button>
              <Button size="sm" tone="quiet">{support(context, 2, "Continue without source")}</Button>
            </Cluster>
          }
        >
          {context.labels[1]} No changes were made.
        </InlineAlert>
      </SettingSurface>
    </ContextPage>
  );
}

function GovernancePreview(context: PreviewContext) {
  if (context.entryId === "permission-matrix") {
    const rows = collectionItems(context, 3);
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">Save changes</Button>}>
        <DataTable
          caption={context.labels[0]}
          items={rows}
          getRowId={(row) => row.id}
          columns={[
            { id: "role", header: support(context, 0, "Role"), rowHeader: true, cell: (row) => row.primary },
            { id: "view", header: support(context, 3, "Read"), cell: () => <Switch aria-label="Read permission" defaultChecked /> },
            { id: "edit", header: support(context, 4, "Write"), cell: () => <Switch aria-label="Write permission" /> },
            { id: "manage", header: support(context, 5, "Manage"), cell: () => <Switch aria-label="Manage permission" /> },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "rule-builder") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]} description={context.labels[1]}>
          <Cluster align="end">
            <Badge>IF</Badge>
            <SelectField label="Attribute" value="department" onChange={noop} options={[{ value: "department", label: support(context, 1, "department") }]} />
            <SelectField label="Operator" value="is" onChange={noop} options={[{ value: "is", label: support(context, 2, "is") }]} />
            <TextField label="Value" value={support(context, 3, "Finance")} onChange={noop} />
          </Cluster>
          <Cluster align="end">
            <Badge tone="info">THEN</Badge>
            <SelectField label="Access" value="allow" onChange={noop} options={[{ value: "allow", label: support(context, 5, "allow") }]} />
          </Cluster>
          <Cluster justify="end"><Button size="sm" tone="primary">Save rule</Button></Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "change-preview") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]} description="Review the exact before and after state.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <Surface>
              <Stack gap="xs"><Badge>Current</Badge><Text>Guests can view projects.</Text></Stack>
            </Surface>
            <Surface elevation="raised">
              <Stack gap="xs"><Badge tone="info">Proposed</Badge><Text>Guests can view assigned projects only.</Text></Stack>
            </Surface>
          </div>
          <InlineAlert title="2 changes" tone="info">Scope narrows for 14 guest accounts.</InlineAlert>
          <Cluster justify="end">
            <Button size="sm" tone="quiet">Request changes</Button>
            <Button size="sm" tone="primary">Approve</Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "review-queue") {
    return (
      <ContextPage context={context} actions={<Button size="sm">Queue settings</Button>}>
        <CollectionList
          label={context.labels[0]}
          items={collectionItems(context, 3).map((item, index) => ({
            ...item,
            leading: <Badge tone={index === 0 ? "danger" : index === 1 ? "warning" : "neutral"}>{index + 1}</Badge>,
            secondary: [support(context, 0, "High risk"), support(context, 1, "Due today"), support(context, 2, "Needs context")][index],
            meta: index === 0 ? <StatusBadge tone="danger">Urgent</StatusBadge> : "2h",
            action: <Button size="sm">Review</Button>,
          }))}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "agent-management") {
    const agents = [
      {
        id: "policy-reviewer",
        name: support(context, 0, "Policy reviewer"),
        source: support(context, 2, "Vendor"),
        capability: "Review policies · Summarize changes",
        scope: "Workspace",
        permissions: "Read policies",
        enabled: true,
      },
      {
        id: "release-assistant",
        name: support(context, 1, "Release assistant"),
        source: support(context, 3, "Built-in"),
        capability: "Draft notes · Check release status",
        scope: "Organization",
        permissions: "Read releases",
        enabled: context.enabled,
      },
    ];
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">Add agent</Button>}>
        <Stack gap="sm">
          {agents.map((agent) => (
            <Surface key={agent.id} as="article" elevation="raised">
              <Stack gap="xs">
                <Cluster justify="between">
                  <Cluster>
                    <Avatar name={agent.name} initials="AI" size="sm" />
                    <Heading level={4} size="sm">{agent.name}</Heading>
                  </Cluster>
                  <StatusBadge tone={agent.enabled ? "success" : "neutral"}>
                    {agent.enabled ? "Enabled" : "Available"}
                  </StatusBadge>
                </Cluster>
                <Cluster gap="xs">
                  <Badge>{agent.source}</Badge>
                  <Text size="xs">{agent.capability}</Text>
                </Cluster>
                <Text tone="muted" size="xs">
                  Scope: {agent.scope} · Permissions: {agent.permissions}
                </Text>
                <BooleanField
                  variant="switch"
                  label={`Enable ${agent.name}`}
                  checked={agent.enabled}
                  onChange={(event) => {
                    if (context.interactive && agent.id === "release-assistant") {
                      context.setEnabled(event.currentTarget.checked);
                    }
                  }}
                />
              </Stack>
            </Surface>
          ))}
        </Stack>
      </ContextPage>
    );
  }
  if (context.entryId === "approval-workflow") return <FlowPreview {...context} />;
  if (context.entryId === "role-management") {
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">Create role</Button>}>
        <CollectionList
          label={context.labels[0]}
          items={collectionItems(context, 3).map((item, index) => {
            const roleName = ["Organization admin", "Editor", "Viewer"][index] ?? item.primary;
            return {
              ...item,
              leading: <AtlasIcon name="Lock" />,
              primary: roleName,
              secondary: ["Full organization access", "Create and edit content", "Read-only access"][index],
              meta: index === 0 ? <Badge tone="info">Protected default</Badge> : <Badge>{[4, 18, 62][index]} members</Badge>,
              action: (
                <Cluster gap="xs">
                  <IconButton label={`Edit ${roleName}`} size="sm"><AtlasIcon name="Edit" /></IconButton>
                  <IconButton label={`Duplicate ${roleName}`} size="sm"><AtlasIcon name="Copy" /></IconButton>
                </Cluster>
              ),
            };
          })}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "draft-autosave") {
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]}>
          <TextAreaField label="Brief" value="Launch Northstar with a staged access review." onChange={noop} />
          <Cluster justify="between">
            <StatusBadge tone="success"><AtlasIcon name="CircleCheck" size="xs" />{context.active ? "Saved" : "Saving"}</StatusBadge>
            <Text tone="muted" size="xs">Drafts are restored after reconnecting.</Text>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "version-history") {
    return (
      <ContextPage context={context}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(10rem, 0.8fr) minmax(12rem, 1.2fr)", gap: "0.5rem" }}>
          <CollectionList
            label={context.labels[0]}
            items={collectionItems(context, 3).map((item, index) => ({
              ...item,
              leading: <AtlasIcon name="Clock" />,
              primary: support(context, index, `Revision ${index + 1}`),
              secondary: ["Morgan Lee, today 10:42", "Sam Kim, yesterday", "Morgan Lee, Monday"][index],
              meta: index === 0 ? <Badge tone="info">Current</Badge> : undefined,
            }))}
          />
          <Surface as="section" elevation="raised">
            <Stack gap="sm">
              <Cluster justify="between">
                <Heading level={4} size="sm">Updated launch dates</Heading>
                <Button size="sm">Restore this version</Button>
              </Cluster>
              <Text tone="muted" size="xs">Sam Kim, yesterday at 16:20</Text>
              <Divider />
              <InlineAlert tone="info" title="2 changes">Launch date moved to September 18; security review added.</InlineAlert>
            </Stack>
          </Surface>
        </div>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <CollectionList
        label={context.labels[0]}
        items={collectionItems(context, 3).map((item, index) => ({
          ...item,
          action: <Button size="sm" tone="quiet">{index === 0 ? "Review" : "Open"}</Button>,
        }))}
      />
    </ContextPage>
  );
}

function InlineEditPreview(context: PreviewContext) {
  return (
    <ContextPage context={context}>
      <SettingSurface title="Project details">
        <Cluster justify="between">
          <Text tone="muted" size="xs">Project name</Text>
          <StatusBadge tone="success">Saved</StatusBadge>
        </Cluster>
        <TextField
          label={support(context, 0, "Name")}
          value={context.selected}
          onChange={(event) =>
            context.interactive && context.setSelected(event.currentTarget.value)}
        />
        <Cluster justify="end">
          <Button size="sm" tone="quiet">Cancel</Button>
          <Button size="sm" tone="primary">Save</Button>
        </Cluster>
      </SettingSurface>
    </ContextPage>
  );
}

function MemoryPreview(context: PreviewContext) {
  return (
    <ContextPage context={context}>
      <SettingSurface title="Workspace memory" description="Review what is retained, for how long, and where it applies.">
        <BooleanField
          variant="switch"
          label={support(context, 0, "Use workspace memory")}
          description="Use approved workspace facts in future conversations."
          checked={context.enabled}
          onChange={(event) =>
            context.interactive && context.setEnabled(event.currentTarget.checked)}
        />
        <Cluster>
          <Badge>Scope: Northstar</Badge>
          <Badge>{support(context, 1, "30 days")}</Badge>
        </Cluster>
        <CollectionList
          label="Remembered context"
          items={[
            { id: "launch", primary: "Launch date", secondary: "September 18", action: <Button size="sm">{support(context, 2, "Review")}</Button> },
            { id: "owner", primary: "Release owner", secondary: "Morgan Lee", action: <Button size="sm">Review</Button> },
          ]}
        />
        <InlineAlert
          tone="danger"
          title="Clear workspace memory?"
          actions={
            <Cluster>
              <Button size="sm" tone="quiet">Cancel</Button>
              <Button size="sm" tone="danger">{support(context, 3, "Clear")}</Button>
            </Cluster>
          }
        >
          This permanently removes two remembered facts from Northstar.
        </InlineAlert>
      </SettingSurface>
    </ContextPage>
  );
}

const templateRenderers = {
  admin: GovernancePreview,
  "agent-activity": AgentPreview,
  agents: GovernancePreview,
  ai: AiPreview,
  "ai-recovery": RecoveryPreview,
  approval: ApprovalPreview,
  "approval-flow": GovernancePreview,
  autosave: GovernancePreview,
  cards: CollectionPreview,
  checklist: FlowPreview,
  comments: CollectionPreview,
  content: ContentPreview,
  control: ControlPreview,
  dashboard: CollectionPreview,
  disclosure: DisclosurePreview,
  feedback: FeedbackPreview,
  flow: FlowPreview,
  form: FormPreview,
  grid: CollectionPreview,
  history: GovernancePreview,
  import: FlowPreview,
  "inline-edit": InlineEditPreview,
  kanban: CollectionPreview,
  layout: LayoutPreview,
  list: CollectionPreview,
  loading: FeedbackPreview,
  "master-detail": LayoutPreview,
  matrix: GovernancePreview,
  memory: MemoryPreview,
  navigation: NavigationPreview,
  notifications: FeedbackPreview,
  overlay: OverlayPreview,
  presence: CollectionPreview,
  record: LayoutPreview,
  review: GovernancePreview,
  rules: GovernancePreview,
  skeleton: FeedbackPreview,
  table: CollectionPreview,
  tree: CollectionPreview,
} satisfies Record<PatternPreviewTemplate, PreviewRenderer>;

export function PatternPreview({
  entryId,
  mode = "inert",
  phase = 1,
  state,
  className,
}: PatternPreviewProps) {
  const registryRecord = patternPreviewRegistry.find(
    (record) => record.entryId === entryId,
  );
  const anatomy = anatomyById.get(entryId);
  const story = storyById.get(entryId);
  if (!registryRecord || !anatomy || !story) {
    throw new Error(`Unknown Pattern Preview entry: ${entryId}`);
  }

  const normalizedPhase = Math.max(0, Math.min(1, phase));
  const resolvedState = state ?? (normalizedPhase > 0 ? "active" : "rest");
  const active = resolvedState === "active" ||
    (resolvedState === "default" && normalizedPhase >= 0.5);
  const interactive = mode === "interactive";
  const initialValue = initialSelection(
    entryId,
    registryRecord.labels,
    registryRecord.title,
  );
  const [selected, setSelected] = React.useState(initialValue);
  const [enabled, setEnabled] = React.useState(
    entryId === "action-approval" || entryId === "agent-management"
      ? false
      : active,
  );
  const [approved, setApproved] = React.useState(false);
  const labels = registryRecord.labels as readonly [string, string, ...string[]];
  const renderer = templateRenderers[registryRecord.template];

  return (
    <AtlasRoot
      className={className}
      density="compact"
      inert={!interactive}
      data-pattern-preview=""
      data-entry-id={entryId}
      data-preview-template={registryRecord.template}
      data-preview-mode={mode}
      data-preview-phase={normalizedPhase}
      data-preview-state={resolvedState}
    >
      <Surface as="section" aria-label={`${registryRecord.title} preview`}>
        {renderer({
          entryId,
          anatomy,
          story,
          labels,
          interactive,
          active,
          phase: normalizedPhase,
          state: resolvedState,
          selected,
          setSelected,
          enabled,
          setEnabled,
          approved,
          setApproved,
        })}
      </Surface>
    </AtlasRoot>
  );
}
