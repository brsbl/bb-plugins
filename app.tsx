import { useCallback, useEffect, useRef, useState } from "react";
import {
  definePluginApp,
  experimental_Icon as Icon,
  useRealtime,
  useRpc,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./contract.js";
import {
  CHANGED, stateSchema,
  type DelegationSettings, type DelegationState, type SettingKey, type SettingsOverrides,
} from "./settings.js";
import { DISPATCH_ACTION_ID, DispatchHeaderButton, DispatchPanel } from "./dispatch-app.js";
import "./app.css";

interface Option { value: string; label: string }

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Couldn't save. Try again.";
}

function shown(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  return value === "" ? "blank" : String(value);
}

function Select({ value, options, onChange, label, disabled }: {
  value: string; options: Option[]; onChange: (value: string) => void; label: string; disabled?: boolean;
}) {
  return (
    <select className="dl-select" aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function TextField({ value, onSave, label, placeholder, disabled }: {
  value: string; onSave: (value: string) => void; label: string; placeholder: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // Follow a new saved value during render, not in an effect: an effect runs after mount and can wipe what
  // the user already typed.
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setDraft(value);
  }
  return (
    <input className="dl-input" aria-label={label} value={draft} placeholder={placeholder} disabled={disabled}
      onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft.trim() !== value) onSave(draft.trim()); }}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  );
}

const SPAWN_POLICIES: Option[] = [
  { value: "ask", label: "Only when you ask" },
  { value: "followthrough", label: "Follow-through only" },
  { value: "approved", label: "Within approved scope" },
  { value: "free", label: "Whenever it helps" },
];
const SPAWN_NOTES: Record<DelegationSettings["spawnPolicy"], string> = {
  ask: "Every new worker is a proposal card first.",
  followthrough: "QA, review, and CI on approved work; new scope is a proposal card.",
  approved: "Anything inside approved scope; new scope is a proposal card.",
  free: "Whenever delegating helps.",
};
const REASONING: Option[] = [
  { value: "", label: "Default" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
  { value: "max", label: "Max" },
];

interface Role {
  id: "lead" | "parent" | "worker" | "qa";
  label: string;
  /** When a lead creates this role. Only the worker rule is a setting (spawnPolicy); the others are fixed by the skills. */
  when: string | null;
  keys: { provider: SettingKey; model: SettingKey; reasoning: SettingKey };
  /** What a blank provider or model means for this role. */
  inherit: string;
}

const ROLES: Role[] = [
  { id: "lead", label: "Lead", when: "Only when you ask", keys: { provider: "leadProvider", model: "leadModel", reasoning: "leadReasoningLevel" }, inherit: "Same as workers" },
  { id: "parent", label: "Parent", when: "When a worker will have its own reports", keys: { provider: "parentProvider", model: "parentModel", reasoning: "parentReasoningLevel" }, inherit: "Same as workers" },
  { id: "worker", label: "Worker", when: null, keys: { provider: "provider", model: "model", reasoning: "reasoningLevel" }, inherit: "Provider's default" },
  { id: "qa", label: "QA", when: "QA and smoke checks on approved work", keys: { provider: "qaProvider", model: "qaModel", reasoning: "qaReasoningLevel" }, inherit: "Same as workers" },
];

/** Where a role's values come from, on hover only: your instructions, or your override (click to reset). */
function Provenance({ keys, state, onReset }: { keys: SettingKey[]; state: DelegationState; onReset: (keys: SettingKey[]) => void }) {
  const entries = keys.map((key) => [key, state.explain[key]] as const);
  const sources = [...new Map(entries.flatMap(([, entry]) => (entry?.origin === "source" && entry.source ? [[entry.source, entry.quote ?? ""] as const] : []))).entries()];
  const overridden = entries.filter(([, entry]) => entry?.origin === "override").map(([key]) => key);
  const ignored = entries.filter(([, entry]) => entry?.ignoredOverride !== undefined);
  return (
    <span className="dl-hint">
      {sources.length > 0 ? (
        <span className="dl-hint-icon" role="img" aria-label="Set by your instructions" title={sources.map(([source, quote]) => `From ${source}: “${quote}”`).join("\n")}>
          <Icon name="Info" aria-hidden />
        </span>
      ) : null}
      {overridden.length > 0 ? (
        <button type="button" className="dl-hint-icon dl-hint-button" aria-label="Reset your override" title="Your override; your instructions don't set this. Click to reset." onClick={() => onReset(overridden)}>
          <Icon name="RotateCcw" aria-hidden />
        </button>
      ) : null}
      {ignored.length > 0 ? (
        <button type="button" className="dl-hint-icon dl-hint-button dl-hint-warn" aria-label="Remove ignored override"
          title={`${ignored.map(([key, entry]) => `Your ${key} override (${shown(entry!.ignoredOverride!)}) is ignored; your instructions win.`).join("\n")} Click to remove.`}
          onClick={() => onReset(ignored.map(([key]) => key))}>
          <Icon name="AlertTriangle" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

export function DelegationSettingsForm() {
  const rpc = useRpc<typeof rpcContract>();
  const sdk = useSdk();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [state, setState] = useState<DelegationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Option[]>([]);

  useEffect(() => {
    let live = true;
    rpcRef.current.call("getState", {}).then((next) => { if (live) setState(next); }, (cause) => { if (live) setError(errorMessage(cause)); });
    void sdk.providers.list().then((list) => {
      if (live) setProviders(list.filter((entry) => entry.available).map((entry) => ({ value: entry.id, label: entry.displayName })));
    }, () => undefined);
    return () => { live = false; };
  }, [sdk]);

  useRealtime(CHANGED, (payload) => {
    const parsed = stateSchema.safeParse(payload);
    if (parsed.success) setState(parsed.data);
  });

  const save = useCallback((values: SettingsOverrides, reset?: string[]) => {
    setError(null);
    rpcRef.current.call("saveSettings", { values, ...(reset ? { reset } : {}) })
      .then(setState, (cause) => setError(errorMessage(cause)));
  }, []);

  if (!state) {
    return error ? <p className="dl-error" role="alert">{error}</p> : <p className="dl-description" role="status">Loading…</p>;
  }
  const settings = state.settings;
  const locked = (key: SettingKey) => state.explain[key]?.origin === "source";
  const withCurrent = (options: Option[], value: string, missing: string) =>
    value && !options.some((option) => option.value === value) ? [...options, { value, label: `${value} (${missing})` }] : options;
  const checked = state.checkedAt === null ? null : new Date(state.checkedAt).toLocaleString();

  return (
    <div className="dl-settings">
      <p className="dl-description">
        Which model each role runs, and when a lead creates one. Values in your AGENTS.md, CLAUDE.md, skills, and memory win; set the rest here. Agents read these with <code>bb delegation settings</code>.
      </p>
      {error ? <p className="dl-error" role="alert">{error}</p> : null}
      <table className="dl-roles">
        <thead>
          <tr><th scope="col">Role</th><th scope="col">When to create</th><th scope="col">Provider</th><th scope="col">Model</th><th scope="col">Reasoning</th></tr>
        </thead>
        <tbody>
          {ROLES.map((role) => {
            const provider = settings[role.keys.provider] as string;
            const model = settings[role.keys.model] as string;
            const reasoning = settings[role.keys.reasoning] as string;
            const rowKeys = [role.keys.provider, role.keys.model, role.keys.reasoning, ...(role.when === null ? ["spawnPolicy" as const] : [])];
            return (
              <tr key={role.id}>
                <th scope="row">
                  <span className="dl-role">{role.label}</span>{" "}
                  <Provenance keys={rowKeys} state={state} onReset={(keys) => save({}, keys)} />
                </th>
                <td className="dl-when">
                  {role.when ?? (
                    <>
                      <Select label="When to create workers" value={settings.spawnPolicy} options={SPAWN_POLICIES} disabled={locked("spawnPolicy")}
                        onChange={(spawnPolicy) => save({ spawnPolicy: spawnPolicy as DelegationSettings["spawnPolicy"] })} />
                      <p className="dl-note">{SPAWN_NOTES[settings.spawnPolicy]}</p>
                    </>
                  )}
                </td>
                <td>
                  <Select label={`${role.label} provider`} value={provider} disabled={locked(role.keys.provider)}
                    options={withCurrent([{ value: "", label: role.id === "worker" ? "Project default" : "Same as workers" }, ...providers], provider, "unavailable")}
                    onChange={(next) => save({ [role.keys.provider]: next } as SettingsOverrides, [role.keys.model])} />
                </td>
                <td>
                  <TextField label={`${role.label} model`} placeholder={role.inherit} value={model} disabled={locked(role.keys.model)}
                    onSave={(next) => save({ [role.keys.model]: next } as SettingsOverrides)} />
                </td>
                <td>
                  <Select label={`${role.label} reasoning`} value={reasoning} disabled={locked(role.keys.reasoning)}
                    options={withCurrent(REASONING, reasoning, "custom")}
                    onChange={(next) => save({ [role.keys.reasoning]: next } as SettingsOverrides)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="dl-description">
        {checked ? <>Instructions last read {checked}.</> : <>Your instructions haven't been read yet.</>}{" "}
        Ask any thread to “refresh the delegation defaults” after you change them.
      </p>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.settingsSection({
    id: "delegation",
    component: DelegationSettingsForm,
  });
  // Agent Channels: this thread's conversations with other agents, in the right panel.
  app.slots.threadPanelAction({
    id: DISPATCH_ACTION_ID,
    title: "Agent Channels",
    icon: "delegation/agent-channels",
    layout: "flush",
    component: DispatchPanel,
  });
  app.slots.experimental_threadHeaderAction({
    id: "dispatch-open",
    title: "Agent Channels",
    component: DispatchHeaderButton,
  });
});
