import * as React from "react";

import { BooleanField } from "./forms.js";
import { Button } from "./controls.js";
import { StatusBadge, type StatusTone } from "./feedback.js";
import { Cluster, cx, Heading, Stack, Surface, Text } from "./foundation.js";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "stopped";
export type AgentStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

const agentStatusTone: Record<AgentRunStatus | AgentStepStatus, StatusTone> = {
  queued: "neutral",
  pending: "neutral",
  running: "info",
  completed: "success",
  failed: "danger",
  stopped: "warning",
  skipped: "neutral",
};

export interface AgentStepRecord {
  id: string;
  label: React.ReactNode;
  status: AgentStepStatus;
  summary?: React.ReactNode;
  details?: React.ReactNode;
}

export interface AgentActivityProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  status: AgentRunStatus;
  steps: readonly AgentStepRecord[];
  summary?: React.ReactNode;
  onStop?: () => void;
}

export function AgentActivity({
  title,
  status,
  steps,
  summary,
  onStop,
  className,
  ...props
}: AgentActivityProps) {
  const running = status === "running" || status === "queued";
  return (
    <Surface
      as="section"
      className={cx("atlas-agent-activity", className)}
      aria-live={running ? "polite" : "off"}
      {...props}
    >
      <header className="atlas-agent-activity__header">
        <Stack gap="xs">
          <Heading level={3} size="sm">
            {title}
          </Heading>
          {summary ? <Text tone="muted">{summary}</Text> : null}
        </Stack>
        <StatusBadge tone={agentStatusTone[status]}>{status}</StatusBadge>
      </header>
      <ol className="atlas-agent-steps">
        {steps.map((step) => (
          <li key={step.id} data-status={step.status}>
            <span className="atlas-agent-step__mark" aria-hidden="true" />
            <div>
              <Cluster gap="sm">
                <span className="atlas-agent-step__label">{step.label}</span>
                <StatusBadge tone={agentStatusTone[step.status]}>
                  {step.status}
                </StatusBadge>
              </Cluster>
              {step.summary ? <Text tone="muted">{step.summary}</Text> : null}
              {step.details ? (
                <details className="atlas-agent-step__details">
                  <summary>Details</summary>
                  <div>{step.details}</div>
                </details>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {running && onStop ? (
        <footer className="atlas-agent-activity__footer">
          <Button size="sm" tone="quiet" onClick={onStop}>
            Stop
          </Button>
        </footer>
      ) : null}
    </Surface>
  );
}

export type ApprovalRisk = "low" | "medium" | "high";
export type ApprovalState = "pending" | "approved" | "rejected";

export interface ApprovalConfirmation {
  label: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface ActionApprovalProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  action: React.ReactNode;
  affectedObjects: readonly React.ReactNode[];
  risk: ApprovalRisk;
  reversible: boolean;
  state: ApprovalState;
  description?: React.ReactNode;
  confirmation?: ApprovalConfirmation;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
  rejectLabel?: string;
}

export function ActionApproval({
  title,
  action,
  affectedObjects,
  risk,
  reversible,
  state,
  description,
  confirmation,
  onApprove,
  onReject,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  className,
  ...props
}: ActionApprovalProps) {
  const titleId = React.useId();
  const pending = state === "pending";
  const confirmationRequired = risk === "high";
  const approveDisabled =
    !pending || (confirmationRequired && !confirmation?.checked);
  const tone: StatusTone =
    state === "approved"
      ? "success"
      : state === "rejected"
        ? "danger"
        : risk === "high"
          ? "warning"
          : "neutral";

  return (
    <Surface
      as="section"
      className={cx("atlas-approval", className)}
      elevation="raised"
      aria-labelledby={titleId}
      {...props}
    >
      <header className="atlas-approval__header">
        <Stack gap="xs">
          <Heading id={titleId} level={3} size="sm">
            {title}
          </Heading>
          {description ? <Text tone="muted">{description}</Text> : null}
        </Stack>
        <StatusBadge tone={tone}>{state}</StatusBadge>
      </header>
      <dl className="atlas-approval__facts">
        <div>
          <dt>Action</dt>
          <dd>{action}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{risk}</dd>
        </div>
        <div>
          <dt>Recovery</dt>
          <dd>{reversible ? "Reversible" : "Permanent"}</dd>
        </div>
        <div>
          <dt>Affected</dt>
          <dd>
            <ul>
              {affectedObjects.map((object, index) => (
                <li key={index}>{object}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {confirmationRequired && confirmation ? (
        <BooleanField
          label={confirmation.label}
          checked={confirmation.checked}
          onChange={(event) =>
            confirmation.onCheckedChange(event.currentTarget.checked)
          }
        />
      ) : null}
      <footer className="atlas-approval__footer">
        <Button
          size="sm"
          tone="quiet"
          disabled={!pending}
          onClick={onReject}
        >
          {rejectLabel}
        </Button>
        <Button
          size="sm"
          tone={risk === "high" ? "danger" : "primary"}
          disabled={approveDisabled}
          onClick={onApprove}
        >
          {approveLabel}
        </Button>
      </footer>
    </Surface>
  );
}
