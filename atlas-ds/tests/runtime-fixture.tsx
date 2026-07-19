import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import * as Atlas from "../index.js";

const noop = () => {};

export const exportNames = Object.keys(Atlas).sort();
export const manifest = Atlas.atlasDesignSystemManifest;

export function renderFormFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.TextField
        id="name"
        label="Name"
        value=""
        onChange={noop}
        description="Public label"
        error="Enter a name"
      />
      <Atlas.SelectField
        id="policy"
        label="Policy"
        value="ask"
        onChange={noop}
        options={[{ value: "ask", label: "Always ask" }]}
      />
      <Atlas.BooleanField
        id="compact"
        variant="switch"
        label="Compact mode"
        checked
        onChange={noop}
      />
    </Atlas.AtlasRoot>,
  );
}

export function renderNavigationFixture() {
  const items = [{ id: "one", name: "Dialog", status: "Ready" }] as const;
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.Breadcrumbs
        items={[
          { id: "root", label: "Atlas", href: "#atlas" },
          { id: "current", label: "Components" },
        ]}
      />
      <Atlas.Tabs
        label="Views"
        selectedId="table"
        onSelectionChange={noop}
        items={[
          {
            id: "table",
            label: "Table",
            panel: (
              <Atlas.DataTable
                caption="Components"
                items={items}
                getRowId={(item) => item.id}
                columns={[
                  {
                    id: "name",
                    header: "Name",
                    rowHeader: true,
                    cell: (item) => item.name,
                  },
                  {
                    id: "status",
                    header: "Status",
                    cell: (item) => item.status,
                  },
                ]}
              />
            ),
          },
          { id: "list", label: "List", panel: "List panel" },
        ]}
      />
    </Atlas.AtlasRoot>,
  );
}

export function renderFeedbackFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.InlineAlert title="Fix the value" tone="danger" assertive>
        Enter a supported value.
      </Atlas.InlineAlert>
      <Atlas.ProgressBar label="Import" value={3} max={5} valueText="3 of 5" />
      <Atlas.ToastRegion
        toasts={[{ id: "saved", title: "Saved", tone: "success" }]}
        onDismiss={noop}
      />
    </Atlas.AtlasRoot>,
  );
}

export function renderAgentFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.AgentActivity
        title="Run"
        status="running"
        onStop={noop}
        steps={[
          {
            id: "inspect",
            label: "Inspect files",
            status: "completed",
            details: "Read only",
          },
        ]}
      />
      <Atlas.ActionApproval
        title="Write files?"
        action="Update examples"
        affectedObjects={["examples.tsx"]}
        risk="high"
        reversible
        state="pending"
        confirmation={{
          label: "I reviewed the file",
          checked: false,
          onCheckedChange: noop,
        }}
        onApprove={noop}
        onReject={noop}
      />
    </Atlas.AtlasRoot>,
  );
}

export function renderStageFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.PreviewStage label="Inert example" inert>
        <Atlas.Button>Cannot activate</Atlas.Button>
        <Atlas.StageDialog
          open
          onOpenChange={noop}
          title="Contained dialog"
        />
      </Atlas.PreviewStage>
    </Atlas.AtlasRoot>,
  );
}

export function renderOrphanPortalError() {
  try {
    renderToStaticMarkup(
      <Atlas.StagePortal>
        <div>Orphan</div>
      </Atlas.StagePortal>,
    );
    return "";
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function renderExpandedFoundationFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.ApplicationFrame
        title="Policy center"
        label="Policy center example"
        brand={<Atlas.AtlasIcon name="GridView" />}
        navigation={
          <Atlas.NavigationBar
            label="Primary"
            activeId="policies"
            onNavigate={noop}
            items={[
              { id: "policies", label: "Policies" },
              { id: "reports", label: "Reports" },
            ]}
          />
        }
      >
        <Atlas.PageHeader
          eyebrow="Workspace"
          title="Policies"
          description="Review and publish access rules."
        />
        <Atlas.Avatar name="Mina Patel" status="online" />
        <Atlas.Badge tone="success">Published</Atlas.Badge>
        <Atlas.Tag onRemove={noop} removeLabel="Remove Finance">Finance</Atlas.Tag>
        <Atlas.Chip selected>Needs review</Atlas.Chip>
        <div aria-busy="true" aria-label="Loading policy">
          <Atlas.Skeleton shape="block" animated={false} />
        </div>
      </Atlas.ApplicationFrame>
    </Atlas.AtlasRoot>,
  );
}

export function renderExpandedNavigationFixture() {
  return renderToStaticMarkup(
    <Atlas.AtlasRoot>
      <Atlas.NavigationRail
        label="Workspace"
        activeId="home"
        onNavigate={noop}
        items={[
          { id: "home", label: "Home", icon: <Atlas.AtlasIcon name="GridView" /> },
          { id: "files", label: "Files", icon: <Atlas.AtlasIcon name="Folder" /> },
        ]}
      />
      <Atlas.TabBar
        label="Mobile destinations"
        activeId="home"
        onNavigate={noop}
        items={[
          { id: "home", label: "Home", icon: <Atlas.AtlasIcon name="GridView" /> },
          { id: "settings", label: "Settings", icon: <Atlas.AtlasIcon name="Settings" /> },
        ]}
      />
      <Atlas.StepIndicator
        items={[
          { id: "account", label: "Account", status: "complete" },
          { id: "profile", label: "Profile", status: "current" },
          { id: "review", label: "Review", status: "upcoming" },
        ]}
      />
      <Atlas.TreeView
        label="Workspace files"
        expandedIds={["src"]}
        selectedId="app"
        onExpandedChange={noop}
        onSelectionChange={noop}
        nodes={[
          {
            id: "src",
            label: "src",
            children: [{ id: "app", label: "app.tsx" }],
          },
        ]}
      />
    </Atlas.AtlasRoot>,
  );
}
