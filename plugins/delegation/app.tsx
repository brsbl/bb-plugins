import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  definePluginApp,
  experimental_ProviderModelPicker as ProviderModelPicker,
  useRealtime,
  useRpc,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./contract.js";
import {
  CHANGED, FALLBACKS, stateSchema,
  type DelegationSettings, type DelegationState, type SettingKey, type SettingsOverrides,
} from "./settings.js";
import { Switch } from "./components/ui/switch.js";
import "./app.css";

interface Option { value: string; label: string }
type ReasoningLevel = ComponentProps<typeof ProviderModelPicker>["value"]["reasoningLevel"];

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Couldn't save. Try again.";
}

function shown(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "on" : "off";
  return value === "" ? "blank" : String(value);
}

/** Where a row's value comes from: the user's instructions, their override, or the fallback. */
function Origin({ settingKey, state, onReset }: { settingKey: SettingKey; state: DelegationState; onReset: () => void }) {
  const entry = state.explain[settingKey];
  if (!entry) return null;
  if (entry.origin === "source") {
    return (
      <div className="dl-origin">
        <p className="dl-origin-line"><span className="dl-origin-tag">From {entry.source}</span> “{entry.quote}”</p>
        {entry.note ? <p className="dl-origin-line">{entry.note}</p> : null}
        {entry.ignoredOverride !== undefined ? (
          <p className="dl-origin-line dl-origin-warn">
            Your override ({shown(entry.ignoredOverride)}) is ignored: your instructions win.{" "}
            <button type="button" className="dl-link" onClick={onReset}>Remove override</button>
          </p>
        ) : null}
      </div>
    );
  }
  if (entry.origin === "override") {
    return (
      <div className="dl-origin">
        <p className="dl-origin-line">
          <span className="dl-origin-tag">Your override.</span> Your instructions don't set this.{" "}
          <button type="button" className="dl-link" onClick={onReset}>Remove override</button>
        </p>
      </div>
    );
  }
  return <div className="dl-origin"><p className="dl-origin-line">Your instructions don't set this, so it uses the fallback.</p></div>;
}

function Row({ label, description, control, below, htmlFor, origin }: {
  label: string; description: string; control: ReactNode; below?: ReactNode; htmlFor?: string; origin: ReactNode;
}) {
  return (
    <div className="dl-row">
      <div className="dl-row-main">
        <div className="dl-row-text">
          <label className="dl-label" htmlFor={htmlFor}>{label}</label>
          <p className="dl-description">{description}</p>
          {origin}
        </div>
        <div className="dl-control">{control}</div>
      </div>
      {below}
    </div>
  );
}

function Select({ id, value, options, onChange, label, disabled }: {
  id?: string; value: string; options: Option[]; onChange: (value: string) => void; label: string; disabled?: boolean;
}) {
  return (
    <select id={id} className="dl-select" aria-label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function NumberField({ id, value, min, max, onSave, label, disabled }: {
  id?: string; value: number; min: number; max: number; onSave: (value: number) => void; label: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const next = Number(draft);
    if (Number.isInteger(next) && next >= min && next <= max) { if (next !== value) onSave(next); }
    else setDraft(String(value));
  };
  return (
    <input id={id} className="dl-input dl-number" type="number" inputMode="numeric" aria-label={label}
      min={min} max={max} step={1} value={draft} disabled={disabled}
      onChange={(event) => setDraft(event.target.value)} onBlur={commit}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  );
}

function TextField({ id, value, onSave, label, placeholder, disabled }: {
  id?: string; value: string; onSave: (value: string) => void; label: string; placeholder: string; disabled?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input id={id} className="dl-input dl-text" aria-label={label} value={draft} placeholder={placeholder} disabled={disabled}
      onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft.trim() !== value) onSave(draft.trim()); }}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dl-group" aria-label={title}>
      <h3 className="dl-group-title">{title}</h3>
      <div className="dl-panel">{children}</div>
    </section>
  );
}

const ENVIRONMENTS: Option[] = [
  { value: "", label: "Spawn's choice for the job" },
  { value: "worktree", label: "New worktree" },
  { value: "personal", label: "Personal workspace" },
  { value: "lead", label: "The lead's environment" },
];
const REPORT_STYLES: Option[] = [
  { value: "bullets", label: "Outcome, then bullets" },
  { value: "prose", label: "One short paragraph" },
];
const RELAYS: Option[] = [
  { value: "batch", label: "One message per thread" },
  { value: "each", label: "Each request as it comes" },
];
const REASONING: Option[] = [
  { value: "", label: "The model's default" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra high" },
  { value: "max", label: "Max" },
];

export function DelegationSettingsForm() {
  const rpc = useRpc<typeof rpcContract>();
  const sdk = useSdk();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [state, setState] = useState<DelegationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Option[]>([]);
  const [machines, setMachines] = useState<Array<Option & { connected: boolean }>>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const ids = {
    provider: useId(), qaProvider: useId(), reasoning: useId(), qaReasoning: useId(), avoid: useId(), machine: useId(),
    environment: useId(), section: useId(), lines: useId(), bullets: useId(), style: useId(), relay: useId(), retries: useId(),
  };

  useEffect(() => {
    let live = true;
    rpcRef.current.call("getState", {}).then((next) => { if (live) setState(next); }, (cause) => { if (live) setError(errorMessage(cause)); });
    void sdk.providers.list().then((list) => {
      if (live) setProviders(list.filter((entry) => entry.available).map((entry) => ({ value: entry.id, label: entry.displayName })));
    }, () => undefined);
    void sdk.hosts.list().then((list) => {
      if (live) setMachines(list.filter((host) => host.lifecycle.phase !== "destroyed").map((host) => ({
        value: host.id, connected: host.status === "connected",
        label: host.status === "connected" ? host.name : `${host.name} (offline)`,
      })));
    }, () => undefined);
    void sdk.threadSections.list().then((list) => {
      if (live) setSections(list.map((section) => ({ value: section.id, label: section.name })));
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

  const settings = state?.settings;
  // Models come from the machine workers run on: the chosen one, else the first connected one.
  const routingHost = settings?.machine || machines.find((machine) => machine.connected)?.value || null;
  const routing = routingHost ? { kind: "host" as const, hostId: routingHost } : undefined;

  // Picking "Choose a model" starts from the provider's default model.
  const [loadingModel, setLoadingModel] = useState<"model" | "qaModel" | null>(null);
  const chooseModel = useCallback(async (field: "model" | "qaModel", providerId: string) => {
    if (!providerId) { setError("Pick a provider first."); return; }
    setLoadingModel(field);
    try {
      const catalog = await sdk.providers.models(routingHost ? { providerId, hostId: routingHost } : { providerId });
      const model = catalog.models.find((entry) => entry.isDefault) ?? catalog.models[0];
      if (!model) {
        setError(catalog.modelLoadError ? `Couldn't load this provider's models (${catalog.modelLoadError.code.replaceAll("_", " ")}).` : "This provider has no models to choose from.");
        return;
      }
      save(field === "model" ? { model: model.model, reasoningLevel: model.defaultReasoningEffort } : { qaModel: model.model });
    } catch (cause) { setError(errorMessage(cause)); } finally { setLoadingModel(null); }
  }, [routingHost, save, sdk]);

  if (!state || !settings) {
    return error ? <p className="dl-error" role="alert">{error}</p> : <p className="dl-description" role="status">Loading…</p>;
  }

  const locked = (key: SettingKey) => state.explain[key]?.origin === "source";
  const origin = (...keys: SettingKey[]) => <Origin settingKey={keys[0]!} state={state} onReset={() => save({}, keys)} />;
  const withCurrent = (options: Option[], value: string, missing: string) =>
    value && !options.some((option) => option.value === value) ? [...options, { value, label: `${value} (${missing})` }] : options;
  const providerOptions = withCurrent([{ value: "", label: "The project's default" }, ...providers], settings.provider, "unavailable");
  const qaProvider = settings.qaProvider || settings.provider;
  const checked = state.checkedAt === null ? null : new Date(state.checkedAt).toLocaleString();

  return (
    <div className="dl-settings">
      <p className="dl-description">
        These come from your own instructions first: AGENTS.md, CLAUDE.md, your skills, and your memory. An agent reads them and records each value with a quote, and those win. An override you set here applies only where your instructions are silent. Agents read the result with <code>bb delegation settings</code>.
      </p>
      <p className="dl-description">
        {checked ? <>Instructions last read {checked}.</> : <>Your instructions haven't been read yet.</>}{" "}
        Ask any thread to “refresh the delegation defaults” after you change them.
      </p>
      {error ? <p className="dl-error" role="alert">{error}</p> : null}
      <Group title="Workers">
        <Row label="Provider" htmlFor={ids.provider} origin={origin("provider")}
          description="Runs new workers unless you name another provider in the request."
          control={<Select id={ids.provider} label="Provider" value={settings.provider} options={providerOptions} disabled={locked("provider")}
            onChange={(provider) => save({ provider }, ["model", "reasoningLevel"])} />} />
        <Row label="Model" origin={origin("model")}
          description="The model new workers use. Spawn's normal tier picks the provider's current everyday model."
          control={<Select label="Model" value={settings.model || loadingModel === "model" ? "chosen" : "tier"} disabled={locked("model") || loadingModel === "model"}
            options={[{ value: "tier", label: "Spawn's normal tier" }, { value: "chosen", label: loadingModel === "model" ? "Loading models…" : "Choose a model" }]}
            onChange={(mode) => (mode === "tier" ? save({ model: "" }) : void chooseModel("model", settings.provider))} />}
          below={settings.model && settings.provider ? (
            <div className="dl-below">
              <ProviderModelPicker allowProviderChange={false} align="end" disabled={locked("model")} {...(routing ? { routing } : {})}
                value={{ providerId: settings.provider, model: settings.model, reasoningLevel: (settings.reasoningLevel || "medium") as ReasoningLevel }}
                onChange={(next) => {
                  // The picker re-emits its normalized value (service tier, a supported reasoning
                  // level) on every render; save only fields this form stores, and only on change.
                  if (next.model !== settings.model) save({ model: next.model });
                  else if (!locked("reasoningLevel") && next.reasoningLevel !== settings.reasoningLevel && settings.reasoningLevel) save({ reasoningLevel: next.reasoningLevel });
                }} />
            </div>
          ) : null} />
        <Row label="Reasoning" htmlFor={ids.reasoning} origin={origin("reasoningLevel")}
          description="Reasoning level for new workers."
          control={<Select id={ids.reasoning} label="Reasoning" value={settings.reasoningLevel} options={withCurrent(REASONING, settings.reasoningLevel, "custom")}
            disabled={locked("reasoningLevel")} onChange={(reasoningLevel) => save({ reasoningLevel })} />} />
        <Row label="Models to avoid" htmlFor={ids.avoid} origin={origin("avoidModels")}
          description="Model IDs no worker should run, separated by commas."
          control={<TextField id={ids.avoid} label="Models to avoid" placeholder="None" value={settings.avoidModels}
            disabled={locked("avoidModels")} onSave={(avoidModels) => save({ avoidModels })} />} />
        <Row label="Machine" htmlFor={ids.machine} origin={origin("machine")}
          description="Where new workers run. The lead's machine is used unless the spawn skill's capacity check moves the job."
          control={<Select id={ids.machine} label="Machine" value={settings.machine} disabled={locked("machine")}
            options={withCurrent([{ value: "", label: "The lead's machine" }, ...machines], settings.machine, "removed")}
            onChange={(machine) => save({ machine })} />} />
        <Row label="Environment" htmlFor={ids.environment} origin={origin("environment")}
          description="Review and QA of another thread's change still attach to that thread's environment."
          control={<Select id={ids.environment} label="Environment" value={settings.environment} options={ENVIRONMENTS} disabled={locked("environment")}
            onChange={(environment) => save({ environment: environment as DelegationSettings["environment"] })} />} />
        <Row label="Section" htmlFor={ids.section} origin={origin("section")}
          description="The sidebar section new workers are filed into."
          control={<Select id={ids.section} label="Section" value={settings.section} disabled={locked("section")}
            options={withCurrent([{ value: "", label: "The lead's section" }, ...sections], settings.section, "deleted")}
            onChange={(section) => save({ section })} />} />
        <Row label="Parent workers to the lead" origin={origin("parentWorkers")}
          description="bb tells the lead when a parented worker finishes, fails, or needs input."
          control={<Switch aria-label="Parent workers to the lead" checked={settings.parentWorkers} disabled={locked("parentWorkers")}
            onCheckedChange={(parentWorkers) => save({ parentWorkers })} />} />
      </Group>

      <Group title="QA and smoke tests">
        <Row label="Provider" htmlFor={ids.qaProvider} origin={origin("qaProvider")}
          description="Runs threads that only exercise the product: QA fixtures and smoke tests."
          control={<Select id={ids.qaProvider} label="QA provider" value={settings.qaProvider} disabled={locked("qaProvider")}
            options={withCurrent([{ value: "", label: "Same as workers" }, ...providers], settings.qaProvider, "unavailable")}
            onChange={(next) => save({ qaProvider: next }, ["qaModel"])} />} />
        <Row label="Model" origin={origin("qaModel")}
          description="Cheapest available picks the lowest-cost model the provider lists."
          control={<Select label="QA model" disabled={locked("qaModel") || loadingModel === "qaModel"}
            value={loadingModel === "qaModel" || (settings.qaModel && settings.qaModel !== "cheapest") ? "chosen" : settings.qaModel === "cheapest" ? "cheapest" : "same"}
            options={[{ value: "same", label: "Same as workers" }, { value: "cheapest", label: "Cheapest available" }, { value: "chosen", label: loadingModel === "qaModel" ? "Loading models…" : "Choose a model" }]}
            onChange={(mode) => (mode === "same" ? save({ qaModel: "" }) : mode === "cheapest" ? save({ qaModel: "cheapest" }) : void chooseModel("qaModel", qaProvider))} />}
          below={settings.qaModel && settings.qaModel !== "cheapest" && qaProvider ? (
            <div className="dl-below">
              <ProviderModelPicker allowProviderChange={false} align="end" disabled={locked("qaModel")} {...(routing ? { routing } : {})}
                value={{ providerId: qaProvider, model: settings.qaModel, reasoningLevel: (settings.qaReasoningLevel || "low") as ReasoningLevel }}
                onChange={(next) => { if (next.model !== settings.qaModel) save({ qaModel: next.model }); }} />
            </div>
          ) : null} />
        <Row label="Reasoning" htmlFor={ids.qaReasoning} origin={origin("qaReasoningLevel")}
          description="Reasoning level for QA and smoke-test threads."
          control={<Select id={ids.qaReasoning} label="QA reasoning" value={settings.qaReasoningLevel} options={withCurrent(REASONING, settings.qaReasoningLevel, "custom")}
            disabled={locked("qaReasoningLevel")} onChange={(qaReasoningLevel) => save({ qaReasoningLevel })} />} />
      </Group>

      <Group title="Reports">
        <Row label="Worker report length" htmlFor={ids.lines} origin={origin("workerReportLines")}
          description="Most lines in a worker's final reply: the result, a PR link, and any blocker."
          control={<NumberField id={ids.lines} label="Worker report length" value={settings.workerReportLines} min={1} max={20} disabled={locked("workerReportLines")}
            onSave={(workerReportLines) => save({ workerReportLines })} />} />
        <Row label="Report length" htmlFor={ids.bullets} origin={origin("reportMaxBullets")}
          description="Most bullets in a report to you, after a one-line outcome."
          control={<NumberField id={ids.bullets} label="Report length" value={settings.reportMaxBullets} min={1} max={20} disabled={locked("reportMaxBullets")}
            onSave={(reportMaxBullets) => save({ reportMaxBullets })} />} />
        <Row label="Report style" htmlFor={ids.style} origin={origin("reportStyle")}
          description="How the lead writes what its workers found."
          control={<Select id={ids.style} label="Report style" value={settings.reportStyle} options={REPORT_STYLES} disabled={locked("reportStyle")}
            onChange={(reportStyle) => save({ reportStyle: reportStyle as DelegationSettings["reportStyle"] })} />} />
        <Row label="Ask for decisions with action cards" origin={origin("decisionsAsActionCards")}
          description="Every decision you owe arrives as an inline card instead of a question in prose."
          control={<Switch aria-label="Ask for decisions with action cards" checked={settings.decisionsAsActionCards} disabled={locked("decisionsAsActionCards")}
            onCheckedChange={(decisionsAsActionCards) => save({ decisionsAsActionCards })} />} />
        <Row label="Show evidence inline" origin={origin("evidenceInline")}
          description="Screenshots and videos appear in the report instead of being described or linked."
          control={<Switch aria-label="Show evidence inline" checked={settings.evidenceInline} disabled={locked("evidenceInline")}
            onCheckedChange={(evidenceInline) => save({ evidenceInline })} />} />
      </Group>

      <Group title="Relays and retries">
        <Row label="Relay batching" htmlFor={ids.relay} origin={origin("relayBatching")}
          description="How your decisions and requests reach a thread that is already working."
          control={<Select id={ids.relay} label="Relay batching" value={settings.relayBatching} options={RELAYS} disabled={locked("relayBatching")}
            onChange={(relayBatching) => save({ relayBatching: relayBatching as DelegationSettings["relayBatching"] })} />} />
        <Row label="Automatic retries" htmlFor={ids.retries} origin={origin("retryLimit")}
          description="Retries of a worker's failed turn, such as a provider 429, before it's reported as blocked."
          control={<NumberField id={ids.retries} label="Automatic retries" value={settings.retryLimit} min={0} max={10} disabled={locked("retryLimit")}
            onSave={(retryLimit) => save({ retryLimit })} />} />
      </Group>

      <Group title="Archiving">
        <Row label="Archive and stop finished workers" origin={origin("mayArchiveOrStop")}
          description={`On: a lead may stop and archive a worker once its work is handed back. Off: only when you ask. Fallback: ${FALLBACKS.mayArchiveOrStop ? "on" : "off"}.`}
          control={<Switch aria-label="Archive and stop finished workers" checked={settings.mayArchiveOrStop} disabled={locked("mayArchiveOrStop")}
            onCheckedChange={(mayArchiveOrStop) => save({ mayArchiveOrStop })} />} />
      </Group>
    </div>
  );
}

export default definePluginApp((app) => {
  app.slots.settingsSection({
    id: "delegation",
    component: DelegationSettingsForm,
  });
});
