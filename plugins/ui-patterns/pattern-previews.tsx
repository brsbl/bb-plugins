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

export function resolvePreviewActiveState(
  state: PatternPreviewState,
  _phase: number,
): boolean {
  return state !== "rest";
}

export function resolvePreviewEnabledState(
  entryId: PatternPreviewEntryId,
  active: boolean,
): boolean {
  return entryId === "action-approval" || entryId === "agent-management"
    ? false
    : active;
}

export function resolvePreviewState(
  states: readonly PatternPreviewState[],
  phase: number,
  requestedState?: PatternPreviewState,
): PatternPreviewState {
  if (requestedState) return requestedState;
  return states.includes("rest") && states.includes("active")
    ? phase >= 0.5
      ? "active"
      : "rest"
    : "default";
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
  query: string;
  setQuery: (value: string) => void;
  activeOptionIndex: number;
  setActiveOptionIndex: (value: number) => void;
  invokedCommand: string;
  setInvokedCommand: (value: string) => void;
  numericValue: number;
  setNumericValue: (value: number) => void;
  actionResult: string;
  setActionResult: (value: string) => void;
  selectedIds: readonly string[];
  setSelectedIds: (value: readonly string[]) => void;
  secondarySelected: string;
  setSecondarySelected: (value: string) => void;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  approved: boolean;
  setApproved: (value: boolean) => void;
  expandedIds: readonly string[];
  setExpandedIds: (ids: readonly string[]) => void;
  splitPercent: number;
  setSplitPercent: (value: number) => void;
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
  if (entryId === "button") return "Launch workspace";
  if (entryId === "date-picker") return "2026-07-24";
  if (entryId === "form-validation") return "morgan@";
  if (entryId === "draft-autosave") return "Launch the workspace with a staged access review.";
  if (entryId === "rule-builder") return "Finance";
  if (entryId === "master-detail") return "customer-1";
  if (entryId === "version-history") return "revision-2";
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
}: {
  context: PreviewContext;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Stack className="atlas-preview-context" gap="md">
      <PageHeader
        title={context.labels[0]}
        description={context.labels[1]}
        actions={actions}
        level={3}
      />
      {children}
    </Stack>
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
              <Button
                size="sm"
                tone="primary"
                disabled={!context.selected.trim()}
                onClick={() => context.interactive && context.setActionResult(`Created ${context.selected}`)}
              >
                {second}
              </Button>
            </Cluster>
            {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
      const ownerOptions = [second, third, support(context, 3, "Jordan Doe")].filter((label) =>
        label.toLocaleLowerCase().includes(context.query.toLocaleLowerCase()),
      );
      const activeOwner = ownerOptions[context.activeOptionIndex];
      return (
        <ContextPage context={context}>
          <SettingSurface title="Issue owner" description="Search people, then choose one result.">
            <Stack gap="sm">
              <TextField
                role="combobox"
                aria-expanded="true"
                aria-controls="owner-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={activeOwner
                  ? `owner-suggestion-${[second, third, support(context, 3, "Jordan Doe")].indexOf(activeOwner)}`
                  : undefined}
                label={first}
                value={context.query}
                onChange={(event) => {
                  if (!context.interactive) return;
                  context.setQuery(event.currentTarget.value);
                  context.setActiveOptionIndex(0);
                }}
                onKeyDown={(event) => {
                  if (!context.interactive) return;
                  if (event.key === "Enter" && activeOwner) {
                    event.preventDefault();
                    context.setSelected(activeOwner);
                    context.setQuery(activeOwner);
                    return;
                  }
                  if (!["ArrowDown", "ArrowUp"].includes(event.key) || ownerOptions.length === 0) return;
                  event.preventDefault();
                  const delta = event.key === "ArrowDown" ? 1 : -1;
                  context.setActiveOptionIndex(
                    (context.activeOptionIndex + delta + ownerOptions.length) % ownerOptions.length,
                  );
                }}
              />
              <Surface
                id="owner-suggestions"
                role="listbox"
                aria-label={`${first} suggestions`}
              >
                <Stack gap="xs">
                  {ownerOptions.map((label, index) => (
                    <div
                      key={label}
                      id={`owner-suggestion-${[second, third, support(context, 3, "Jordan Doe")].indexOf(label)}`}
                      role="option"
                      aria-selected={label === activeOwner}
                      tabIndex={-1}
                      onPointerMove={() => context.interactive && context.setActiveOptionIndex(index)}
                      onClick={() => {
                        if (!context.interactive) return;
                        context.setSelected(label);
                        context.setQuery(label);
                      }}
                    >
                      <Cluster>
                        <Avatar name={label} size="sm" />
                        <Stack gap="xs">
                          <Text>{label}</Text>
                          <Text tone="muted" size="xs">{index === 0 ? "Workspace member" : "Organization member"}</Text>
                        </Stack>
                        {label === context.selected ? <AtlasIcon name="Check" size="xs" /> : null}
                      </Cluster>
                    </div>
                  ))}
                </Stack>
              </Surface>
              <Text role="status" tone="muted" size="xs">
                {context.selected ? `Selected ${context.selected}` : `${ownerOptions.length} suggestions`}
              </Text>
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
      const sliderValue = context.interactive
        ? context.numericValue
        : Math.round(24 + (44 * context.phase));
      return (
        <ContextPage context={context}>
          <SettingSurface title="Alert threshold" description="Tune the threshold and review its current value.">
            <label>
              <Cluster justify="between">
                <span>{first}</span>
                <Badge>{sliderValue}%</Badge>
              </Cluster>
              <TextInput
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(event) => context.interactive && context.setNumericValue(Number(event.currentTarget.value))}
              />
              <Cluster justify="between">
                <Text tone="muted" size="xs">0%: quiet</Text>
                <Text tone="muted" size="xs">100%: sensitive</Text>
              </Cluster>
            </label>
            <InlineAlert tone="info" title="Current threshold">
              Alerts fire when usage exceeds {sliderValue}%.
            </InlineAlert>
          </SettingSurface>
        </ContextPage>
      );
    case "date-picker":
      const minimumDate = "2026-07-18";
      const invalidDate = context.selected < minimumDate;
      return (
        <ContextPage context={context}>
          <SettingSurface title="Schedule review" description="Choose a valid review date.">
            <TextField
              label={first}
              type="date"
              value={context.selected}
              min={minimumDate}
              max="2026-08-31"
              error={invalidDate ? "Choose July 18 or later." : undefined}
              onChange={(event) => setSelected(event.currentTarget.value)}
            />
            <Text tone="muted" size="xs">Dates before July 18 are unavailable. Displayed in your locale.</Text>
            <Cluster justify="end">
              <Button
                size="sm"
                tone="primary"
                disabled={invalidDate}
                onClick={() => context.interactive && context.setActionResult(`Scheduled for ${context.selected}`)}
              >
                Schedule
              </Button>
            </Cluster>
            {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
          </SettingSurface>
        </ContextPage>
      );
    case "file-upload":
      return (
        <ContextPage context={context}>
          <SettingSurface title="Import customer data" description="CSV files up to 25 MB.">
            <label>
              {first}
              <TextInput
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  if (!context.interactive) return;
                  const file = event.currentTarget.files?.[0];
                  context.setEnabled(Boolean(file));
                  if (file) context.setSelected(file.name);
                }}
              />
            </label>
            {context.enabled ? <CollectionList
              label="Selected files"
              items={[{
                id: "customers",
                primary: context.selected || second,
                secondary: "1.8 MB",
                leading: <AtlasIcon name="FileText" />,
                meta: context.active
                  ? <StatusBadge tone="success">Ready</StatusBadge>
                  : <ProgressBar label="Uploading customers.csv" value={42} valueText="42%" />,
                action: (
                  <IconButton
                    label={`Remove ${context.selected || second}`}
                    size="sm"
                    onClick={() => context.interactive && context.setEnabled(false)}
                  >
                    <AtlasIcon name="X" />
                  </IconButton>
                ),
              }]}
            /> : <Text tone="muted" size="xs">No file selected.</Text>}
            <Cluster justify="end"><Button size="sm" tone="primary" disabled={!context.enabled}>Continue import</Button></Cluster>
          </SettingSurface>
        </ContextPage>
      );
    case "search-field":
      const searchResults = [
        { id: "policy", primary: second, secondary: "Updated yesterday" },
        { id: "roles", primary: "Role permissions", secondary: "Admin guide" },
      ].filter((item) =>
        `${item.primary} ${item.secondary}`.toLocaleLowerCase().includes(context.selected.toLocaleLowerCase()),
      );
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
            <Text role="status" tone="muted" size="xs">{searchResults.length} results in Help center</Text>
            <CollectionList
              label="Search results"
              items={searchResults}
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
        title="Workspace"
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
        <SettingSurface title={labels.at(-1)} description="Permissions inherited from the workspace.">
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
    const page = Math.max(1, Math.min(3, context.numericValue || 2));
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
            <Text tone="muted" size="xs">{(page - 1) * 20 + 1}-{page * 20} of 126</Text>
            <Cluster>
              {["Previous", "1", "2", "3", "Next"].map((label) => (
                <Button
                  key={label}
                  size="sm"
                  disabled={(label === "Previous" && page === 1) || (label === "Next" && page === 3)}
                  aria-current={label === String(page) ? "page" : undefined}
                  aria-label={/^\d+$/.test(label) ? `Page ${label}` : label}
                  onClick={() => {
                    if (!context.interactive) return;
                    if (label === "Previous") context.setNumericValue(Math.max(1, page - 1));
                    else if (label === "Next") context.setNumericValue(Math.min(3, page + 1));
                    else context.setNumericValue(Number(label));
                  }}
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
          <Chip selected={context.enabled} onClick={() => context.interactive && context.setEnabled(!context.enabled)}>{label}</Chip>
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
  if (context.entryId === "audit-log") {
    const rows = [
      { id: "event-1", time: "10:42", actor: "Morgan Lee", action: "Updated access policy", target: "Guest projects", outcome: "Succeeded" },
      { id: "event-2", time: "09:18", actor: "Sam Kim", action: "Approved request", target: "Finance workspace", outcome: "Succeeded" },
      { id: "event-3", time: "Yesterday", actor: "System", action: "Exported records", target: "Customer data", outcome: "Failed" },
    ];
    return (
      <ContextPage context={context} actions={<Button size="sm">Export log</Button>}>
        <DataTable
          caption={context.labels[0]}
          items={rows}
          getRowId={(row) => row.id}
          columns={[
            { id: "time", header: support(context, 0, "Time"), cell: (row) => row.time },
            { id: "actor", header: support(context, 1, "Actor"), rowHeader: true, cell: (row) => row.actor },
            { id: "action", header: support(context, 2, "Action"), cell: (row) => row.action },
            { id: "target", header: support(context, 3, "Target"), cell: (row) => row.target },
            {
              id: "outcome",
              header: "Outcome",
              cell: (row) => (
                <StatusBadge tone={row.outcome === "Succeeded" ? "success" : "danger"}>
                  {row.outcome}
                </StatusBadge>
              ),
            },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "table") {
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
  if (context.entryId === "data-grid") {
    const rows = items.map((item, index) => ({
      id: item.id,
      member: item.primary,
      role: index === 0 ? "Admin" : "Editor",
      scope: index === 2 ? "Assigned projects" : "All projects",
      active: index !== 2,
    }));
    return (
      <ContextPage context={context} actions={<Button size="sm">Add member</Button>}>
        <DataTable
          interaction="grid"
          aria-label={context.labels[0]}
          caption={context.labels[0]}
          items={rows}
          getRowId={(row) => row.id}
          columns={[
            { id: "member", header: support(context, 0, "Member"), rowHeader: true, cell: (row) => row.member },
            {
              id: "role",
              header: support(context, 1, "Role"),
              cell: (row) => (
                <NativeSelect aria-label={`Role for ${row.member}`} defaultValue={row.role} tabIndex={-1}>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </NativeSelect>
              ),
            },
            { id: "scope", header: support(context, 2, "Scope"), cell: (row) => row.scope },
            {
              id: "status",
              header: support(context, 3, "Status"),
              cell: (row) => <Switch aria-label={`Active status for ${row.member}`} defaultChecked={row.active} tabIndex={-1} />,
            },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "bulk-selection-and-actions") {
    const selectedCount = context.selectedIds.length;
    const allSelected = selectedCount === items.length;
    return (
      <ContextPage context={context}>
        <Stack gap="sm">
          <Cluster justify="between">
            <BooleanField
              label={selectedCount > 0 ? `${selectedCount} selected` : "Select all"}
              checked={allSelected}
              onChange={(event) => {
                if (!context.interactive) return;
                context.setSelectedIds(event.currentTarget.checked ? items.map(({ id }) => id) : []);
              }}
            />
            <Cluster>
              <Button size="sm" disabled={selectedCount === 0}>Change role</Button>
              <Button size="sm" tone="danger" disabled={selectedCount === 0}>Remove</Button>
            </Cluster>
          </Cluster>
          <DataTable
            caption={context.labels[0]}
            items={items}
            getRowId={(item) => item.id}
            columns={[
              {
                id: "select",
                header: "Select",
                cell: (item) => (
                  <Checkbox
                    aria-label={`Select ${item.primary}`}
                    checked={context.selectedIds.includes(item.id)}
                    onChange={(event) => {
                      if (!context.interactive) return;
                      context.setSelectedIds(event.currentTarget.checked
                        ? [...context.selectedIds, item.id]
                        : context.selectedIds.filter((id) => id !== item.id));
                    }}
                  />
                ),
              },
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
            expandedIds={context.expandedIds}
            selectedId={context.selected === "src" || context.selected === "components" || context.selected === "app" || context.selected === "tests" ? context.selected : "app"}
            onExpandedChange={(ids) => context.interactive && context.setExpandedIds(ids)}
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
    const postedReply = context.actionResult;
    return (
      <ContextPage context={context}>
        <SettingSurface title="Review thread">
          <CollectionList
            label={context.labels[0]}
            items={[
              ...items.slice(0, 2).map((item, index) => ({
              ...item,
              primary: index === 0 ? "Morgan Lee" : "Sam Kim",
              secondary: index === 0 ? support(context, 1, "Can we narrow the scope?") : support(context, 3, "Updated."),
              leading: <Avatar name={index === 0 ? "Morgan Lee" : "Sam Kim"} size="sm" />,
              meta: index === 0 ? "10:42" : "11:08",
              })),
              ...(postedReply ? [{
                id: "posted-reply",
                primary: "You",
                secondary: postedReply,
                leading: <Avatar name="You" size="sm" />,
                meta: "Now",
              }] : []),
            ]}
          />
          <TextArea
            aria-label="Reply"
            placeholder="Reply to the thread"
            value={context.selected}
            onChange={(event) =>
              context.interactive && context.setSelected(event.currentTarget.value)}
          />
          <Cluster justify="end">
            <Button
              size="sm"
              tone="primary"
              disabled={!context.selected.trim()}
              onClick={() => {
                if (!context.interactive || !context.selected.trim()) return;
                context.setActionResult(context.selected.trim());
                context.setSelected("");
              }}
            >
              Reply
            </Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "collaborative-presence") {
    const collaborators = context.active
      ? ["Morgan Lee", "Sam Kim", "Jordan Doe"]
      : [];
    return (
      <ContextPage
        context={context}
        actions={collaborators.length > 0 ? (
          <AvatarGroup
            label="Editing now"
            people={collaborators.map((name) => ({ name, status: "online" as const }))}
          />
        ) : <StatusBadge tone="neutral">Only you</StatusBadge>}
      >
        <SettingSurface
          title="Launch plan"
          description={context.active
            ? "Morgan is editing the rollout section."
            : "No one else is editing this page."}
        >
          <Text>Confirm owners, milestones, and the final launch decision.</Text>
          {context.active ? (
            <InlineAlert tone="info" title="Sam is viewing this section">
              Changes appear as collaborators edit.
            </InlineAlert>
          ) : null}
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
    const query = context.query.toLocaleLowerCase();
    const filteredItems = items.filter((item) =>
      `${item.primary} ${item.secondary ?? ""}`.toLocaleLowerCase().includes(query),
    );
    return (
      <ContextPage context={context}>
        <Cluster>
          <TextField
            label="Search issues"
            type="search"
            value={context.query}
            onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
          />
          {[0, 1, 2].map((index) => {
            const filter = support(context, index, `Filter ${index + 1}`);
            const selected = context.selectedIds.includes(filter);
            return (
              <Chip
                key={filter}
                selected={selected}
                onClick={() => context.interactive && context.setSelectedIds(
                  selected
                    ? context.selectedIds.filter((id) => id !== filter)
                    : [...context.selectedIds, filter],
                )}
              >
                {filter}
              </Chip>
            );
          })}
        </Cluster>
        <Text role="status" tone="muted" size="xs">{filteredItems.length} matching issues</Text>
        <CollectionList label="Filtered issues" items={filteredItems} />
      </ContextPage>
    );
  }
  if (context.entryId === "filter-bar") {
    const filters = context.selectedIds;
    return (
      <ContextPage context={context}>
        <Cluster justify="between">
          <Cluster>
            {filters.map((filter) => (
              <Tag
                key={filter}
                onRemove={() => context.interactive && context.setSelectedIds(filters.filter((item) => item !== filter))}
                removeLabel={`Remove ${filter}`}
              >
                {filter}
              </Tag>
            ))}
          </Cluster>
          <Button
            size="sm"
            tone="quiet"
            disabled={filters.length === 0}
            onClick={() => context.interactive && context.setSelectedIds([])}
          >
            {support(context, 2, "Clear")}
          </Button>
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
    const sortedItems = context.secondarySelected === "oldest" ? [...items].reverse() : items;
    return (
      <ContextPage context={context}>
        <Cluster justify="end">
          <SelectField
            label={support(context, 0, "Sort")}
            value={context.secondarySelected || "newest"}
            onChange={(event) => context.interactive && context.setSecondarySelected(event.currentTarget.value)}
            options={[
              { value: "newest", label: support(context, 1, "Newest first") },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
        </Cluster>
        <CollectionList label="Sorted projects" items={sortedItems.map((item, index) => ({ ...item, meta: `${index + 1}d ago` }))} />
      </ContextPage>
    );
  }
  if (context.entryId === "conversation-history") {
    const conversations = [
      { id: "launch", primary: "Launch risks", secondary: "Release risks and owners" },
      { id: "access", primary: "Access review", secondary: "Permission gaps" },
      { id: "migration", primary: "Migration plan", secondary: "Customer migration" },
    ].filter((item) =>
      `${item.primary} ${item.secondary}`.toLocaleLowerCase().includes(context.query.toLocaleLowerCase()),
    );
    return (
      <ContextPage context={context} actions={<Button size="sm" tone="primary">New conversation</Button>}>
        <TextField
          label="Search conversations"
          type="search"
          value={context.query}
          onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
        />
        <Heading level={4} size="sm">Recent</Heading>
        <CollectionList
          label={context.labels[0]}
          items={conversations.map((item, index) => ({
            ...item,
            leading: <AtlasIcon name="MessageSquare" />,
            meta: index === 0 ? <StatusBadge tone="info">Open</StatusBadge> : ["", "Yesterday", "Monday"][index],
            action: (
              <Button
                size="sm"
                tone="quiet"
                onClick={() => context.interactive && context.setActionResult(`Opened ${item.primary}`)}
              >
                Open
              </Button>
            ),
          }))}
        />
        {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
            primary: ["Morgan Lee updated Access policy", "Sam Kim joined the workspace", "System completed Customer export"][index],
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
              secondary: ["Launch plan", "Launch workspace", "Customer records"][index],
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
    const unreadCount = context.active && context.actionResult !== "read" ? 8 : 0;
    return (
      <ContextPage
        context={context}
        actions={unreadCount > 0 ? (
          <Button size="sm" tone="quiet" onClick={() => context.interactive && context.setActionResult("read")}>
            Mark all read
          </Button>
        ) : undefined}
      >
        <Cluster justify="between">
          <Text tone="muted" size="xs">
            {unreadCount > 0 ? `${unreadCount} unread across this workspace` : "You're all caught up"}
          </Text>
          <Button size="sm" tone="quiet">Notification settings</Button>
        </Cluster>
        <Tabs
          label="Notification categories"
          selectedId={context.secondarySelected || "All"}
          onSelectionChange={(id) => context.interactive && context.setSecondarySelected(id)}
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
                  meta: unreadCount > 0 && index === 0
                    ? <Badge tone="info">Unread</Badge>
                    : `${index + 1} hours`,
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
          toasts={context.active && context.actionResult !== "dismissed"
            ? [{ id: "preview", title: first, description: second, tone: "success" }]
            : []}
          onDismiss={context.interactive ? () => context.setActionResult("dismissed") : undefined}
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
            value={Math.round(24 + (48 * context.phase))}
            valueText={`${Math.round(24 + (48 * context.phase))}%`}
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
          {context.active ? (
            <LoadingStatus label={first} />
          ) : (
            <StatusBadge tone="success">Results ready</StatusBadge>
          )}
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
          aria-busy={context.active}
          elevation="raised"
        >
          <Stack gap="sm">
            <Cluster justify="between">
              <Heading level={4} size="sm">Recent audit events</Heading>
              <StatusBadge tone={context.active ? "info" : "success"}>
                {context.active ? "Updating" : "Up to date"}
              </StatusBadge>
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
            {context.active ? (
              <LoadingStatus label={first} />
            ) : (
              <Text tone="muted" size="xs">Last updated just now.</Text>
            )}
          </Stack>
        </Surface>
      </ContextPage>
    );
  }
  if (context.entryId === "skeleton") {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Customer record">
          {context.active ? (
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
          ) : (
            <Stack gap="sm" aria-label={context.labels[0]}>
              <Cluster>
                <Avatar name="Morgan Lee" />
                <Stack gap="xs">
                  <Heading level={4} size="sm">Morgan Lee</Heading>
                  <Text tone="muted" size="xs">Workspace administrator</Text>
                </Stack>
              </Cluster>
              <Divider />
              <Text>morgan@example.com</Text>
              <Cluster>
                <Badge>Active</Badge>
                <Badge>Admin</Badge>
              </Cluster>
            </Stack>
          )}
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
            action={{
              label: support(context, 2, "Create first item"),
              onAction: () => context.interactive && context.setActionResult("creation-started"),
            }}
          />
          {context.actionResult ? <Text role="status" tone="muted" size="xs">Creation started.</Text> : null}
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
        title="Workspace"
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
        <TextField label="Billing email" value="billing@example.com" onChange={noop} />
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
  const commands = [first, second, third];
  const normalizedQuery = context.query.trim().toLocaleLowerCase();
  const filteredCommands = commands.filter((command) =>
    command.toLocaleLowerCase().includes(normalizedQuery),
  );
  const activeCommand = filteredCommands[context.activeOptionIndex];
  const invokeActiveCommand = () => {
    if (!context.interactive || !activeCommand) return;
    context.setInvokedCommand(activeCommand);
  };
  const dialogBody =
    context.entryId === "command-palette" ? (
      <Stack gap="sm">
        <TextField
          id={`${surfaceId}-input`}
          label="Command"
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${surfaceId}-commands`}
          aria-autocomplete="list"
          aria-activedescendant={activeCommand
            ? `${surfaceId}-command-${commands.indexOf(activeCommand)}`
            : undefined}
          placeholder="Type a command"
          value={context.query}
          onChange={(event) => {
            if (!context.interactive) return;
            context.setQuery(event.currentTarget.value);
            context.setActiveOptionIndex(0);
            context.setInvokedCommand("");
          }}
          onKeyDown={(event) => {
            if (!context.interactive) return;
            if (event.key === "Enter") {
              event.preventDefault();
              invokeActiveCommand();
              return;
            }
            if (!["ArrowDown", "ArrowUp"].includes(event.key) || filteredCommands.length === 0) return;
            event.preventDefault();
            const delta = event.key === "ArrowDown" ? 1 : -1;
            context.setActiveOptionIndex(
              (context.activeOptionIndex + delta + filteredCommands.length) % filteredCommands.length,
            );
          }}
        />
        <Surface id={`${surfaceId}-commands`} role="listbox" aria-label="Commands">
          <Stack gap="xs">
            {filteredCommands.map((label, filteredIndex) => {
              const commandIndex = commands.indexOf(label);
              return (
              <Button
                key={label}
                id={`${surfaceId}-command-${commandIndex}`}
                role="option"
                tone="quiet"
                size="sm"
                aria-selected={filteredIndex === context.activeOptionIndex}
                tabIndex={-1}
                onPointerMove={() => context.interactive && context.setActiveOptionIndex(filteredIndex)}
                onClick={() => {
                  if (!context.interactive) return;
                  context.setActiveOptionIndex(filteredIndex);
                  context.setInvokedCommand(label);
                }}
              >
                <Cluster justify="between">
                  <Cluster><AtlasIcon name={(["File", "Plus", "Repeat"] as const)[commandIndex]} />{label}</Cluster>
                  {commandIndex === 0 ? <Text as="span" tone="subtle" size="xs">Command P</Text> : null}
                </Cluster>
              </Button>
              );
            })}
            {filteredCommands.length === 0 ? (
              <Text tone="muted" size="xs">No matching commands</Text>
            ) : null}
          </Stack>
        </Surface>
        <Text role="status" aria-live="polite" tone="muted" size="xs">
          {context.invokedCommand
            ? `Opened ${context.invokedCommand}`
            : `${filteredCommands.length} commands`}
        </Text>
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
          value={context.secondarySelected || "morgan"}
          onChange={(event) => context.interactive && context.setSecondarySelected(event.currentTarget.value)}
          options={[{ value: "morgan", label: "Morgan Lee" }, { value: "sam", label: "Sam Kim" }]}
        />
        <SelectField
          label={second}
          value={context.query || "open"}
          onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
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
        <TextField
          label="Find workspace"
          type="search"
          value={context.query}
          onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
        />
        <CollectionList
          label={context.labels[0]}
          items={[first, second, third]
            .filter((label) => label.toLocaleLowerCase().includes(context.query.toLocaleLowerCase()))
            .map((label) => ({
            id: label,
            primary: label,
            leading: <Avatar name={label} initials={label.slice(0, 1)} size="sm" />,
            meta: (context.secondarySelected || first) === label
              ? <StatusBadge tone="success">Current</StatusBadge>
              : undefined,
            action: (context.secondarySelected || first) === label
              ? undefined
              : (
                <Button
                  size="sm"
                  onClick={() => {
                    if (!context.interactive) return;
                    context.setSecondarySelected(label);
                    setOpen(false);
                  }}
                >
                  Switch
                </Button>
              ),
          }))}
        />
      </Stack>
    ) : (
      <Stack gap="sm">
        <TextField label={first} value={context.selected} onChange={(event) => context.interactive && context.setSelected(event.currentTarget.value)} />
        <SelectField
          label={second}
          value={context.secondarySelected || "open"}
          onChange={(event) => context.interactive && context.setSecondarySelected(event.currentTarget.value)}
          options={[{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }]}
        />
        <Cluster justify="end"><Button size="sm" tone="primary">{third}</Button></Cluster>
      </Stack>
    );

  const triggerLabel = context.entryId === "workspace-switcher"
    ? "Launch workspace"
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
      onMouseEnter={() => context.entryId === "tooltip" && setOpen(true)}
      onMouseLeave={() => context.entryId === "tooltip" && setOpen(false)}
      onFocus={() => context.entryId === "tooltip" && setOpen(true)}
      onBlur={() => context.entryId === "tooltip" && setOpen(false)}
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
        title="Workspace"
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
          initialFocusId={context.entryId === "command-palette" ? `${surfaceId}-input` : undefined}
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
    const customers = [
      { id: "customer-1", name: "Acme Corp", detail: "Enterprise account · 24 members" },
      { id: "customer-2", name: "Bluebird Labs", detail: "Growth account · 8 members" },
      { id: "customer-3", name: "Cedar Group", detail: "Standard account · 5 members" },
    ];
    const selectedCustomer = customers.find(({ id }) => id === context.selected) ?? customers[0];
    return (
      <ApplicationFrame
        label={context.labels[0]}
        title={context.entryId === "split-view" ? "Compare" : "Customers"}
        brand={<AtlasIcon name="Columns2" />}
      >
        <div style={{ display: "grid", gridTemplateColumns: `minmax(8rem, ${context.splitPercent}fr) auto minmax(12rem, ${100 - context.splitPercent}fr)`, gap: "0.5rem", height: "100%" }}>
          <Surface>
            <Stack gap="sm">
              <Heading level={4} size="sm">{context.entryId === "split-view" ? "Current" : "Customers"}</Heading>
              <CollectionList
                label={context.labels[0]}
                items={context.entryId === "master-detail"
                  ? customers.map((customer) => ({
                      id: customer.id,
                      primary: (
                        <Button
                          size="sm"
                          tone="quiet"
                          aria-pressed={selectedCustomer.id === customer.id}
                          onClick={() => context.interactive && context.setSelected(customer.id)}
                        >
                          {customer.name}
                        </Button>
                      ),
                      secondary: customer.detail,
                      meta: selectedCustomer.id === customer.id
                        ? <StatusBadge tone="info">Selected</StatusBadge>
                        : undefined,
                    }))
                  : collectionItems(context, 3)}
              />
            </Stack>
          </Surface>
          <Divider
            role="separator"
            aria-orientation="vertical"
            aria-label={context.entryId === "split-view" ? "Resize comparison panes" : "Resize customer list"}
            aria-valuemin={25}
            aria-valuemax={75}
            aria-valuenow={context.splitPercent}
            tabIndex={0}
            onKeyDown={(event) => {
              if (!context.interactive) return;
              const next = event.key === "ArrowLeft"
                ? context.splitPercent - 5
                : event.key === "ArrowRight"
                  ? context.splitPercent + 5
                  : event.key === "Home"
                    ? 25
                    : event.key === "End"
                      ? 75
                      : null;
              if (next === null) return;
              event.preventDefault();
              context.setSplitPercent(Math.max(25, Math.min(75, next)));
            }}
          />
          <Surface elevation="raised">
            <Stack gap="sm">
              <PageHeader
                title={context.entryId === "split-view" ? "Proposed" : selectedCustomer.name}
                description={context.entryId === "split-view" ? context.labels[1] : selectedCustomer.detail}
                level={4}
              />
              <Divider />
              <Text>
                {context.entryId === "split-view"
                  ? "Review the proposed changes alongside the current version."
                  : `Account summary and recent activity for ${selectedCustomer.name}.`}
              </Text>
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
          selectedId={context.secondarySelected || "relationships"}
          onSelectionChange={(id) => context.interactive && context.setSecondarySelected(id)}
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
  if (!context.enabled) {
    return (
      <ContextPage context={context} actions={(
        <Button size="sm" onClick={() => context.interactive && context.setEnabled(true)}>
          Open issue panel
        </Button>
      )}>
        <CollectionList label="Issues" items={collectionItems(context, 3)} />
      </ContextPage>
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
              <IconButton
                label="Close panel"
                size="sm"
                onClick={() => context.interactive && context.setEnabled(false)}
              >
                <AtlasIcon name="X" />
              </IconButton>
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
  const validationExample = context.entryId === "form-validation";
  const hasError = validationExample && !/^\S+@\S+\.\S+$/.test(context.selected);
  return (
    <ContextPage context={context}>
      <SettingSurface title={context.labels[0]} description={context.labels[1]}>
        <form onSubmit={(event) => event.preventDefault()}>
          <Stack gap="md">
            <FormSection title="Member details">
              <TextField
                label={first}
                type={validationExample ? "email" : "text"}
                value={context.selected}
                error={hasError ? support(context, 1, "A value is required") : undefined}
                onChange={(event) =>
                  context.interactive && context.setSelected(event.currentTarget.value)}
              />
              {!validationExample ? <TextField
                label="Email"
                type="email"
                value={context.query || "morgan@example.com"}
                onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
              /> : null}
              <SelectField
                label={support(context, 2, "Role")}
                value={context.secondarySelected || "editor"}
                onChange={(event) => context.interactive && context.setSecondarySelected(event.currentTarget.value)}
                options={[{ value: "editor", label: "Editor" }, { value: "viewer", label: "Viewer" }]}
              />
            </FormSection>
            <FormActions>
              <Button size="sm" tone="quiet">Cancel</Button>
              <Button size="sm" tone="primary" type="submit" disabled={hasError}>Create member</Button>
            </FormActions>
          </Stack>
        </form>
      </SettingSurface>
    </ContextPage>
  );
}

function FlowPreview(context: PreviewContext) {
  const phaseIndex = context.entryId === "import-workflow" && context.actionResult
    ? 3
    : context.active
      ? 2
      : 1;
  const interactiveFlow = context.entryId === "multi-step-flow" || context.entryId === "approval-workflow";
  const activeIndex = interactiveFlow && context.interactive
    ? Math.max(0, Math.min(3, context.numericValue))
    : phaseIndex;
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
    const started = context.actionResult === "started";
    return (
      <ContextPage context={context}>
        <ProgressBar
          label="Workspace setup"
          value={started ? 83 : 66}
          valueText={started ? "Final task started" : "2 of 3 complete"}
        />
        <CollectionList
          label={context.labels[0]}
          items={stepLabels.slice(0, 3).map((label, index) => ({
            id: label,
            primary: label,
            leading: <Checkbox checked={index < 2} readOnly aria-label={`${label} complete`} />,
            meta: index < 2
              ? <StatusBadge tone="success">Done</StatusBadge>
              : started
                ? <StatusBadge tone="info">In progress</StatusBadge>
                : <Button size="sm" onClick={() => context.interactive && context.setActionResult("started")}>Start</Button>,
          }))}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "import-workflow") {
    const rows = [
      { id: "row-1", record: "morgan@example.com", status: "Valid", detail: "Ready to import" },
      { id: "row-2", record: "sam@example.com", status: "Duplicate", detail: "Matches an existing member" },
      { id: "row-3", record: "missing-email", status: "Invalid", detail: "Email is required" },
    ];
    return (
      <ContextPage context={context}>
        <StepIndicator label="Import progress" items={steps} compact />
        <ProgressBar
          label="Validating rows"
          value={Math.round(20 + (56 * context.phase))}
          valueText={`${Math.round(20 + (56 * context.phase))} rows`}
        />
        <DataTable
          caption={context.labels[0]}
          items={rows}
          getRowId={(item) => item.id}
          columns={[
            { id: "item", header: support(context, 0, "Record"), rowHeader: true, cell: (item) => item.record },
            {
              id: "status",
              header: "Status",
              cell: (item) => (
                <StatusBadge tone={item.status === "Valid" ? "success" : item.status === "Duplicate" ? "warning" : "danger"}>
                  {item.status}
                </StatusBadge>
              ),
            },
            { id: "detail", header: "Resolution", cell: (item) => item.detail },
          ]}
        />
        <InlineAlert tone="warning" title="2 rows need attention">
          Fix invalid rows or import the 1 valid row now. Duplicate rows will be skipped.
        </InlineAlert>
        <Cluster justify="end">
          <Button size="sm" tone="quiet">Download errors</Button>
          <Button
            size="sm"
            tone="primary"
            onClick={() => context.interactive && context.setActionResult("Imported 1 valid row; skipped 2 rows")}
          >
            Import 1 valid row
          </Button>
        </Cluster>
        {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
      </ContextPage>
    );
  }
  if (context.entryId === "approval-workflow") {
    const stageCopy = [
      "Request submitted with business justification.",
      "Manager checks necessity and scope.",
      "Security reviews risk and policy exceptions.",
      "Access approved and requester notified.",
    ][activeIndex];
    return (
      <ContextPage context={context}>
        <StepIndicator label={context.labels[0]} items={steps} />
        <SettingSurface title={stepLabels[activeIndex]} description={stageCopy}>
          <CollectionList
            label="Request summary"
            items={[
              { id: "requester", primary: "Requester", meta: "Morgan Lee" },
              { id: "access", primary: "Requested access", meta: "Finance workspace" },
              { id: "duration", primary: "Duration", meta: "30 days" },
            ]}
          />
          <Cluster justify="end">
            <Button
              size="sm"
              tone="quiet"
              disabled={activeIndex === 0}
              onClick={() => context.interactive && context.setNumericValue(Math.max(0, activeIndex - 1))}
            >
              Back
            </Button>
            <Button
              size="sm"
              tone="primary"
              disabled={activeIndex === steps.length - 1}
              onClick={() => context.interactive && context.setNumericValue(Math.min(steps.length - 1, activeIndex + 1))}
            >
              Continue review
            </Button>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <StepIndicator label={context.labels[0]} items={steps} />
      <SettingSurface title={stepLabels[activeIndex]} description={context.labels[1]}>
        <TextField
          label="Field mapping"
          value={context.selected}
          onChange={(event) => context.interactive && context.setSelected(event.currentTarget.value)}
        />
        <Cluster justify="end">
          <Button
            size="sm"
            tone="quiet"
            disabled={activeIndex === 0}
            onClick={() => context.interactive && context.setNumericValue(Math.max(0, activeIndex - 1))}
          >
            Back
          </Button>
          <Button
            size="sm"
            tone="primary"
            disabled={activeIndex === steps.length - 1}
            onClick={() => context.interactive && context.setNumericValue(Math.min(steps.length - 1, activeIndex + 1))}
          >
            Continue
          </Button>
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
            <Button
              size="sm"
              tone="primary"
              disabled={!context.selected.trim()}
              onClick={() => {
                if (!context.interactive || !context.selected.trim()) return;
                context.setActionResult(`Sent: ${context.selected.trim()}`);
                context.setSelected("");
              }}
            >
              <AtlasIcon name="Sent" />{second}
            </Button>
          </Cluster>
          {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
            <Cluster justify="end">
              <Button
                size="sm"
                tone="primary"
                disabled={!context.selected.trim()}
                onClick={() => {
                  if (!context.interactive || !context.selected.trim()) return;
                  context.setActionResult(`Sent: ${context.selected.trim()}`);
                  context.setSelected("");
                }}
              >
                Send prompt
              </Button>
            </Cluster>
            {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
    const generating = context.active && context.enabled;
    const stopped = context.active && !context.enabled;
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant response">
          <div aria-live="polite" aria-busy={generating}>
            <Stack gap="sm">
              <Cluster justify="between">
                <Badge tone={generating ? "info" : stopped ? "warning" : "success"}>
                  {generating ? "Generating" : stopped ? "Stopped" : "Complete"}
                </Badge>
                {generating ? (
                  <Button size="sm" tone="quiet" onClick={() => context.interactive && context.setEnabled(false)}>
                    Stop
                  </Button>
                ) : null}
              </Cluster>
              <Text>{generating
                ? `${first} The access review is in progress.`
                : stopped
                  ? `${first} Generation stopped; the partial response is preserved.`
                  : `${first} The access review is complete.`}</Text>
              {generating ? <LoadingStatus label={second} /> : null}
            </Stack>
          </div>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "response-regeneration") {
    const regenerating = context.interactive
      ? context.actionResult === "regenerating"
      : context.active;
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant response">
          <Text>{first}</Text>
          <Text tone="muted" size="xs">Previous response remains available while a replacement is generated.</Text>
          <Divider />
          <Cluster>
            <Button
              size="sm"
              tone="quiet"
              disabled={regenerating}
              onClick={() => context.interactive && context.setActionResult("regenerating")}
            >
              <AtlasIcon name="RotateCcw" />{second}
            </Button>
            <Button
              size="sm"
              tone="quiet"
              onClick={() => context.interactive && context.setSecondarySelected("different-model")}
            >
              <AtlasIcon name="Settings" />Use different model
            </Button>
          </Cluster>
          {context.secondarySelected === "different-model" ? <Badge>Model options opened</Badge> : null}
          {regenerating ? <LoadingStatus label="Generating replacement response" /> : null}
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
                htmlId: "source-policy",
                primary: third,
                secondary: "Policy.pdf, page 4",
                leading: <AtlasIcon name="FileText" />,
                action: <IconButton label="Open source 1" size="sm"><AtlasIcon name="ExternalLink" /></IconButton>,
              },
              {
                id: "source-audit",
                htmlId: "source-audit",
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
    const attachmentIds = context.selectedIds;
    return (
      <ContextPage context={context}>
        <SettingSurface title="Attached context" description="Review exactly what the assistant can use.">
          <CollectionList
            label={context.labels[0]}
            items={[first, second].map((label, index) => ({ label, index })).filter(({ index }) =>
              attachmentIds.includes(index === 0 ? "attachment-1" : "attachment-2"),
            ).map(({ label, index }) => ({
              id: label,
              primary: label,
              secondary: index === 0 ? "Workspace scope, 1.8 MB" : "Conversation scope, 14 MB limit exceeded",
              leading: <AtlasIcon name="FileText" />,
              meta: index === 0
                ? <StatusBadge tone="success">Included</StatusBadge>
                : context.actionResult === "retried"
                  ? <StatusBadge tone="info">Retrying</StatusBadge>
                  : <StatusBadge tone="danger">Error</StatusBadge>,
              action: index === 0
                ? (
                  <IconButton
                    label={`Remove ${label}`}
                    size="sm"
                    onClick={() => context.interactive && context.setSelectedIds(
                      attachmentIds.filter((id) => id !== "attachment-1"),
                    )}
                  >
                    <AtlasIcon name="X" />
                  </IconButton>
                )
                : <Button size="sm" onClick={() => context.interactive && context.setActionResult("retried")}>Retry</Button>,
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
            {[second, third].map((label) => (
              <Button
                key={label}
                size="sm"
                aria-pressed={context.actionResult === label}
                onClick={() => context.interactive && context.setActionResult(label)}
              >
                {label}
              </Button>
            ))}
          </Cluster>
          <TextField
            label="Or answer in your own words"
            value={context.selected}
            onChange={(event) => context.interactive && context.setSelected(event.currentTarget.value)}
          />
          <Cluster justify="between">
            <Text role="status" tone="muted" size="xs">
              {context.actionResult ? `Answered: ${context.actionResult}` : "The task resumes after you answer."}
            </Text>
            <Button
              size="sm"
              disabled={!context.selected.trim()}
              onClick={() => context.interactive && context.setActionResult(context.selected.trim())}
            >
              Answer
            </Button>
          </Cluster>
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
            <Cluster justify="end">
              <Button size="sm" onClick={() => context.interactive && context.setActionResult("Preview opened")}>Preview</Button>
              <Button size="sm" tone="primary" onClick={() => context.interactive && context.setActionResult("Artifact applied")}>Apply</Button>
            </Cluster>
            {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
  const running = context.active && context.enabled;
  return (
    <ContextPage context={context}>
      <AgentActivity
        title={context.labels[0]}
        status={context.active ? (context.enabled ? "running" : "stopped") : "queued"}
        summary={context.labels[1]}
        onStop={context.interactive && running ? () => context.setEnabled(false) : undefined}
        steps={[0, 1, 2].map((index) => ({
          id: `step-${index}`,
          label: support(context, index, `Step ${index + 1}`),
          summary: index === 0 ? "Completed with 3 records" : undefined,
          status: index === 0
            ? context.active ? "completed" : "pending"
            : index === 1 && running
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
        description={context.active
          ? context.labels[1]
          : "Preparing the affected objects and recovery details for review."}
        action={support(context, 0, "Apply changes")}
        affectedObjects={context.active ? [support(context, 1, "3 records")] : []}
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
  if (context.actionResult) {
    return (
      <ContextPage context={context}>
        <SettingSurface title="Assistant">
          <InlineAlert tone="success" title={context.actionResult}>
            The failed attempt made no changes. You remain in control of the next step.
          </InlineAlert>
        </SettingSurface>
      </ContextPage>
    );
  }
  return (
    <ContextPage context={context}>
      <SettingSurface title="Assistant">
        <InlineAlert
          tone="danger"
          title={support(context, 0, "Source unavailable")}
          actions={context.active ? (
            <Cluster>
              <Button
                size="sm"
                tone="primary"
                onClick={() => context.interactive && context.setActionResult("Retry started")}
              >
                {support(context, 1, "Retry")}
              </Button>
              <Button
                size="sm"
                tone="quiet"
                onClick={() => context.interactive && context.setActionResult("Continued without the unavailable source")}
              >
                {support(context, 2, "Continue without source")}
              </Button>
            </Cluster>
          ) : undefined}
        >
          {context.active
            ? `${context.labels[1]} No changes were made.`
            : "Checking what can be retried safely. No changes have been made."}
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
            { id: "view", header: support(context, 3, "Read"), cell: (row) => <Switch aria-label={`${row.primary}: Read permission`} defaultChecked /> },
            { id: "edit", header: support(context, 4, "Write"), cell: (row) => <Switch aria-label={`${row.primary}: Write permission`} /> },
            { id: "manage", header: support(context, 5, "Manage"), cell: (row) => <Switch aria-label={`${row.primary}: Manage permission`} /> },
          ]}
        />
      </ContextPage>
    );
  }
  if (context.entryId === "rule-builder") {
    const attribute = context.secondarySelected || "department";
    const operator = context.query || "is";
    const access = context.invokedCommand || "allow";
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]} description={context.labels[1]}>
          <Cluster align="end">
            <Badge>IF</Badge>
            <SelectField
              label="Attribute"
              value={attribute}
              onChange={(event) => context.interactive && context.setSecondarySelected(event.currentTarget.value)}
              options={[
                { value: "department", label: support(context, 1, "department") },
                { value: "location", label: "location" },
                { value: "employment", label: "employment type" },
              ]}
            />
            <SelectField
              label="Operator"
              value={operator}
              onChange={(event) => context.interactive && context.setQuery(event.currentTarget.value)}
              options={[
                { value: "is", label: support(context, 2, "is") },
                { value: "is-not", label: "is not" },
                { value: "contains", label: "contains" },
              ]}
            />
            <TextField label="Value" value={context.selected} onChange={(event) => context.interactive && context.setSelected(event.currentTarget.value)} />
          </Cluster>
          <Cluster align="end">
            <Badge tone="info">THEN</Badge>
            <SelectField
              label="Access"
              value={access}
              onChange={(event) => context.interactive && context.setInvokedCommand(event.currentTarget.value)}
              options={[
                { value: "allow", label: support(context, 5, "allow") },
                { value: "deny", label: "deny" },
                { value: "review", label: "require review" },
              ]}
            />
          </Cluster>
          <Cluster justify="between">
            <Button size="sm" tone="quiet" onClick={() => context.interactive && context.setSelectedIds([...context.selectedIds, `condition-${context.selectedIds.length + 2}`])}>
              Add condition
            </Button>
            <Button size="sm" tone="primary" onClick={() => context.interactive && context.setActionResult("Rule saved")}>Save rule</Button>
          </Cluster>
          {context.selectedIds.length > 0 ? <Text tone="muted" size="xs">{context.selectedIds.length + 1} conditions</Text> : null}
          {context.actionResult ? <Text role="status" tone="muted" size="xs">{context.actionResult}</Text> : null}
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
    const selectedReview = context.actionResult;
    return (
      <ContextPage context={context} actions={<Button size="sm">Queue settings</Button>}>
        <CollectionList
          label={context.labels[0]}
          items={collectionItems(context, 3).map((item, index) => ({
            ...item,
            leading: <Badge tone={index === 0 ? "danger" : index === 1 ? "warning" : "neutral"}>{index + 1}</Badge>,
            secondary: [support(context, 0, "High risk"), support(context, 1, "Due today"), support(context, 2, "Needs context")][index],
            meta: index === 0 ? <StatusBadge tone="danger">Urgent</StatusBadge> : "2h",
            action: (
              <Button
                size="sm"
                onClick={() => context.interactive && context.setActionResult(String(item.primary))}
              >
                Review
              </Button>
            ),
          }))}
        />
        {selectedReview ? (
          <InlineAlert tone="info" title={`Reviewing ${selectedReview}`}>
            The request details and decision controls are now in focus.
          </InlineAlert>
        ) : null}
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
    const saving = context.interactive
      ? context.actionResult === "saving"
      : !context.active;
    return (
      <ContextPage context={context}>
        <SettingSurface title={context.labels[0]}>
          <TextAreaField
            label="Brief"
            value={context.selected}
            onChange={(event) => {
              if (!context.interactive) return;
              context.setSelected(event.currentTarget.value);
              context.setActionResult("saving");
            }}
            onBlur={() => context.interactive && context.setActionResult("saved")}
          />
          <Cluster justify="between">
            <StatusBadge tone={saving ? "warning" : "success"}>
              <AtlasIcon name={saving ? "Clock" : "CircleCheck"} size="xs" />
              <span role="status" aria-live="polite">{saving ? "Saving…" : "Saved"}</span>
            </StatusBadge>
            <Text tone="muted" size="xs">Drafts are restored after reconnecting.</Text>
          </Cluster>
        </SettingSurface>
      </ContextPage>
    );
  }
  if (context.entryId === "version-history") {
    const revisions = [
      { id: "revision-3", primary: "Revision 3: Current", secondary: "Morgan Lee, today 10:42", current: true, change: "Security review completed; launch date confirmed." },
      { id: "revision-2", primary: "Revision 2: Updated launch dates", secondary: "Sam Kim, yesterday at 16:20", current: false, change: "Launch date moved to September 18; security review added." },
      { id: "revision-1", primary: "Revision 1: Initial plan", secondary: "Morgan Lee, Monday", current: false, change: "Initial owners, milestones, and rollout plan created." },
    ];
    const selectedRevision = revisions.find(({ id }) => id === context.selected) ?? revisions[1];
    return (
      <ContextPage context={context}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(10rem, 0.8fr) minmax(12rem, 1.2fr)", gap: "0.5rem" }}>
          <CollectionList
            label={context.labels[0]}
            items={revisions.map((item) => ({
              id: item.id,
              leading: <AtlasIcon name="Clock" />,
              primary: (
                <Button
                  size="sm"
                  tone="quiet"
                  aria-pressed={selectedRevision.id === item.id}
                  onClick={() => context.interactive && context.setSelected(item.id)}
                >
                  {item.primary}
                </Button>
              ),
              secondary: item.secondary,
              meta: selectedRevision.id === item.id
                ? <Badge tone="info">Viewing</Badge>
                : item.current
                  ? <Badge>Current</Badge>
                  : undefined,
            }))}
          />
          <Surface as="section" elevation="raised">
            <Stack gap="sm">
              <Cluster justify="between">
                <Heading level={4} size="sm">{selectedRevision.primary}</Heading>
                <Button size="sm" disabled={selectedRevision.current}>Restore this version</Button>
              </Cluster>
              <Text tone="muted" size="xs">{selectedRevision.secondary}</Text>
              <Divider />
              <InlineAlert tone="info" title="Revision summary">{selectedRevision.change}</InlineAlert>
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
  const editing = context.interactive
    ? context.actionResult !== "saved" && context.actionResult !== "cancelled"
    : context.active;
  return (
    <ContextPage context={context}>
      <SettingSurface title="Project details">
        {editing ? (
          <>
            <TextField
              label={support(context, 0, "Name")}
              value={context.selected}
              onChange={(event) =>
                context.interactive && context.setSelected(event.currentTarget.value)}
            />
            <Cluster justify="end">
              <Button
                size="sm"
                tone="quiet"
                onClick={() => {
                  if (!context.interactive) return;
                  context.setSelected(support(context, 1, "Atlas redesign"));
                  context.setActionResult("cancelled");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                tone="primary"
                onClick={() => context.interactive && context.setActionResult("saved")}
              >
                Save
              </Button>
            </Cluster>
          </>
        ) : (
          <Cluster justify="between">
            <Stack gap="xs">
              <Text tone="muted" size="xs">Project name</Text>
              <Text>{context.selected}</Text>
            </Stack>
            <Button size="sm" onClick={() => context.interactive && context.setActionResult("editing")}>Edit</Button>
          </Cluster>
        )}
        {context.actionResult === "saved" ? <Text role="status" tone="muted" size="xs">Saved</Text> : null}
      </SettingSurface>
    </ContextPage>
  );
}

function MemoryPreview(context: PreviewContext) {
  const cleared = context.actionResult === "cleared";
  const confirming = context.actionResult === "confirm-clear";
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
          <Badge>Scope: Launch workspace</Badge>
          <Badge>{support(context, 1, "30 days")}</Badge>
        </Cluster>
        <CollectionList
          label="Remembered context"
          items={cleared ? [] : [
            { id: "launch", primary: "Launch date", secondary: "September 18", action: <Button size="sm">{support(context, 2, "Review")}</Button> },
            { id: "owner", primary: "Release owner", secondary: "Morgan Lee", action: <Button size="sm">Review</Button> },
          ]}
        />
        {cleared ? <Text role="status" tone="muted" size="xs">Workspace memory cleared.</Text> : null}
        {confirming ? (
          <InlineAlert
            tone="danger"
            title="Clear workspace memory?"
            actions={
              <Cluster>
                <Button size="sm" tone="quiet" onClick={() => context.interactive && context.setActionResult("")}>Cancel</Button>
                <Button size="sm" tone="danger" onClick={() => context.interactive && context.setActionResult("cleared")}>
                  {support(context, 3, "Clear")}
                </Button>
              </Cluster>
            }
          >
            This permanently removes two remembered facts from the workspace.
          </InlineAlert>
        ) : !cleared ? (
          <Cluster justify="end">
            <Button size="sm" tone="danger" onClick={() => context.interactive && context.setActionResult("confirm-clear")}>
              Clear workspace memory
            </Button>
          </Cluster>
        ) : null}
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
  const resolvedState = resolvePreviewState(
    registryRecord.states,
    normalizedPhase,
    state,
  );
  const active = resolvePreviewActiveState(resolvedState, normalizedPhase);
  const interactive = mode === "interactive";
  const initialValue = initialSelection(
    entryId,
    registryRecord.labels,
    registryRecord.title,
  );
  const [selected, setSelected] = React.useState(initialValue);
  const [query, setQuery] = React.useState("");
  const [activeOptionIndex, setActiveOptionIndex] = React.useState(0);
  const [invokedCommand, setInvokedCommand] = React.useState("");
  const [numericValue, setNumericValue] = React.useState(
    entryId === "pagination"
      ? 2
      : entryId === "multi-step-flow" || entryId === "approval-workflow"
        ? 1
        : 68,
  );
  const [actionResult, setActionResult] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>(
    entryId === "filter-bar"
      ? registryRecord.labels.slice(2, 4)
      : entryId === "search-and-filtering"
        ? registryRecord.labels.slice(2, 3)
        : entryId === "context-attachment"
          ? ["attachment-1", "attachment-2"]
          : [],
  );
  const [secondarySelected, setSecondarySelected] = React.useState(
    entryId === "notification-center"
      ? "All"
      : entryId === "sorting"
        ? "newest"
        : "",
  );
  const phaseDrivenEnabled = resolvePreviewEnabledState(entryId, active);
  const [enabled, setEnabled] = React.useState(phaseDrivenEnabled);
  const [approved, setApproved] = React.useState(false);
  const [expandedIds, setExpandedIds] = React.useState<readonly string[]>([
    "src",
    "components",
  ]);
  const [splitPercent, setSplitPercent] = React.useState(42);
  const labels = registryRecord.labels as readonly [string, string, ...string[]];
  const renderer = templateRenderers[registryRecord.template];

  React.useEffect(() => {
    if (!interactive) setEnabled(phaseDrivenEnabled);
  }, [entryId, interactive, phaseDrivenEnabled]);

  React.useEffect(() => {
    setSelected(initialValue);
    setQuery("");
    setActiveOptionIndex(0);
    setInvokedCommand("");
    setNumericValue(
      entryId === "pagination"
        ? 2
        : entryId === "multi-step-flow" || entryId === "approval-workflow"
          ? 1
          : 68,
    );
    setActionResult("");
    setSelectedIds(
      entryId === "filter-bar"
        ? registryRecord.labels.slice(2, 4)
        : entryId === "search-and-filtering"
          ? registryRecord.labels.slice(2, 3)
          : entryId === "context-attachment"
            ? ["attachment-1", "attachment-2"]
          : [],
    );
    setSecondarySelected(
      entryId === "notification-center"
        ? "All"
        : entryId === "sorting"
          ? "newest"
          : "",
    );
    setEnabled(phaseDrivenEnabled);
    setApproved(false);
    setExpandedIds(["src", "components"]);
    setSplitPercent(42);
  }, [entryId, initialValue]);

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
          query,
          setQuery,
          activeOptionIndex,
          setActiveOptionIndex,
          invokedCommand,
          setInvokedCommand,
          numericValue,
          setNumericValue,
          actionResult,
          setActionResult,
          selectedIds,
          setSelectedIds,
          secondarySelected,
          setSecondarySelected,
          enabled,
          setEnabled,
          approved,
          setApproved,
          expandedIds,
          setExpandedIds,
          splitPercent,
          setSplitPercent,
        })}
      </Surface>
    </AtlasRoot>
  );
}
