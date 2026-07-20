import * as React from "react";

import { ActionApproval, AgentActivity } from "./agent-surfaces.js";
import { CollectionList, DataTable, EmptyState } from "./collections.js";
import { Button } from "./controls.js";
import { InlineAlert, ProgressBar, StatusBadge, ToastRegion } from "./feedback.js";
import {
  BooleanField,
  FormActions,
  FormSection,
  SelectField,
  TextAreaField,
  TextField,
} from "./forms.js";
import { AtlasRoot, Cluster, Heading, Stack, Surface, Text } from "./foundation.js";
import { Breadcrumbs, SideNavigation, Tabs } from "./navigation.js";
import {
  ConfirmationFooter,
  PreviewStage,
  StageDialog,
  StagePopover,
} from "./overlays.js";

const noop = () => {};

export interface ExampleProps {
  inert?: boolean;
}

export function FormExample({ inert = true }: ExampleProps) {
  return (
    <AtlasRoot inert={inert}>
      <Surface as="section" className="atlas-example-card">
        <form>
          <Stack gap="lg">
            <FormSection
              title="Workspace defaults"
              description="Defaults apply to new sessions and remain editable."
            >
              <TextField
                label="Workspace name"
                value="Pattern research"
                onChange={noop}
                description="Visible to collaborators."
              />
              <SelectField
                label="Review policy"
                value="important"
                onChange={noop}
                options={[
                  { value: "always", label: "Always ask" },
                  { value: "important", label: "Important actions" },
                  { value: "never", label: "Never ask" },
                ]}
              />
              <TextAreaField
                label="Instructions"
                value="Keep examples concise and deterministic."
                onChange={noop}
              />
              <BooleanField
                variant="switch"
                label="Show compact metadata"
                description="Keeps supporting details available without leading."
                checked
                onChange={noop}
              />
            </FormSection>
            <FormActions>
              <Button size="sm" tone="quiet">
                Reset
              </Button>
              <Button size="sm" tone="primary" type="submit">
                Save defaults
              </Button>
            </FormActions>
          </Stack>
        </form>
      </Surface>
    </AtlasRoot>
  );
}

export function NavigationAndCollectionExample({
  inert = true,
}: ExampleProps) {
  const records = [
    { id: "dialog", name: "Dialog", kind: "Surface", status: "Ready" },
    { id: "tabs", name: "Tabs", kind: "Composite", status: "Review" },
    { id: "toast", name: "Toast", kind: "Element", status: "Ready" },
  ] as const;

  return (
    <AtlasRoot inert={inert}>
      <Surface as="section" className="atlas-example-card">
        <Stack gap="md">
          <Breadcrumbs
            items={[
              { id: "atlas", label: "Atlas", href: "#atlas" },
              { id: "components", label: "Components", href: "#components" },
              { id: "collections", label: "Collections" },
            ]}
          />
          <div className="atlas-example-split">
            <SideNavigation
              label="Component families"
              activeId="collections"
              onNavigate={noop}
              items={[
                { id: "forms", label: "Forms", badge: 6 },
                { id: "navigation", label: "Navigation", badge: 3 },
                { id: "collections", label: "Collections", badge: 4 },
              ]}
            />
            <Tabs
              label="Collection views"
              selectedId="table"
              onSelectionChange={noop}
              items={[
                {
                  id: "table",
                  label: "Table",
                  panel: (
                    <DataTable
                      caption="Pattern components"
                      items={records}
                      getRowId={(record) => record.id}
                      columns={[
                        {
                          id: "name",
                          header: "Name",
                          rowHeader: true,
                          cell: (record) => record.name,
                        },
                        {
                          id: "kind",
                          header: "Kind",
                          cell: (record) => record.kind,
                        },
                        {
                          id: "status",
                          header: "Status",
                          cell: (record) => (
                            <StatusBadge
                              tone={
                                record.status === "Ready" ? "success" : "warning"
                              }
                            >
                              {record.status}
                            </StatusBadge>
                          ),
                        },
                      ]}
                    />
                  ),
                },
                {
                  id: "list",
                  label: "List",
                  panel: (
                    <CollectionList
                      label="Pattern components"
                      items={records.map((record) => ({
                        id: record.id,
                        primary: record.name,
                        secondary: record.kind,
                        meta: record.status,
                      }))}
                    />
                  ),
                },
                {
                  id: "empty",
                  label: "Empty",
                  panel: (
                    <EmptyState
                      title="No saved views"
                      description="Save the current filters when they are useful again."
                      action={{ label: "Save view", onAction: noop }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Stack>
      </Surface>
    </AtlasRoot>
  );
}

export function OverlayExample({ inert = true }: ExampleProps) {
  return (
    <AtlasRoot>
      <PreviewStage label="Overlay component examples" inert={inert}>
        <Stack gap="md">
          <Heading level={3} size="sm">
            Stage-local overlays
          </Heading>
          <Cluster>
            <Button size="sm">Dialog trigger</Button>
            <Button size="sm" tone="quiet">
              Popover trigger
            </Button>
          </Cluster>
        </Stack>
        <StageDialog
          open
          onOpenChange={noop}
          title="Apply saved view?"
          description="This changes the filters in the current preview only."
          footer={
            <ConfirmationFooter onCancel={noop} onConfirm={noop} />
          }
        >
          <Text>The preview remains clipped to this stage.</Text>
        </StageDialog>
        <StagePopover
          open
          label="View details"
          onOpenChange={noop}
          placement="top-end"
        >
          <Stack gap="xs">
            <strong>3 filters</strong>
            <Text tone="muted">Component · Ready · Overlay</Text>
          </Stack>
        </StagePopover>
      </PreviewStage>
    </AtlasRoot>
  );
}

export function FeedbackExample({ inert = true }: ExampleProps) {
  return (
    <AtlasRoot inert={inert}>
      <Surface as="section" className="atlas-example-card">
        <Stack gap="md">
          <InlineAlert title="Draft preserved" tone="info">
            The last valid values remain available while this field is fixed.
          </InlineAlert>
          <ProgressBar
            label="Catalog validation"
            value={28}
            max={37}
            valueText="28 of 37"
          />
          <ToastRegion
            toasts={[
              {
                id: "saved",
                title: "View saved",
                description: "Available from Collections.",
                tone: "success",
              },
            ]}
            onDismiss={noop}
          />
        </Stack>
      </Surface>
    </AtlasRoot>
  );
}

export function AgentAndApprovalExample({ inert = true }: ExampleProps) {
  return (
    <AtlasRoot inert={inert}>
      <div className="atlas-example-grid">
        <AgentActivity
          title="Build component examples"
          status="running"
          summary="Observable work only; implementation reasoning stays private."
          onStop={noop}
          steps={[
            {
              id: "inventory",
              label: "Map scene families",
              status: "completed",
              summary: "37 templates grouped into six reusable families.",
            },
            {
              id: "render",
              label: "Render semantic examples",
              status: "running",
              summary: "Collections and feedback are in progress.",
              details: "Rendering typed React components in an inert stage.",
            },
            {
              id: "verify",
              label: "Verify accessibility contracts",
              status: "pending",
            },
          ]}
        />
        <ActionApproval
          title="Allow file edits?"
          description="The agent is waiting before changing workspace files."
          action="Write generated component examples"
          affectedObjects={[
            "atlas-ds/examples.tsx",
            "atlas-ds/tokens.css",
          ]}
          risk="high"
          reversible
          state="pending"
          confirmation={{
            label: "I reviewed the affected files",
            checked: false,
            onCheckedChange: noop,
          }}
          onApprove={noop}
          onReject={noop}
        />
      </div>
    </AtlasRoot>
  );
}

export function AtlasFoundationExamples(props: ExampleProps) {
  return (
    <Stack gap="lg">
      <FormExample {...props} />
      <NavigationAndCollectionExample {...props} />
      <OverlayExample {...props} />
      <FeedbackExample {...props} />
      <AgentAndApprovalExample {...props} />
    </Stack>
  );
}
