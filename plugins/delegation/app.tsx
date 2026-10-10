import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  definePluginApp,
  experimental_ProviderModelPicker as ProviderModelPicker,
  useRealtime,
  useRpc,
  useSdk,
} from "@get-bb/plugin-sdk/app";
import type { rpcContract } from "./contract.js";
import { CHANGED, settingsSchema, type DelegationSettings, type SettingsOverrides } from "./settings.js";
import { Switch } from "./components/ui/switch.js";
import "./app.css";

interface Option { value: string; label: string }
type ReasoningLevel = ComponentProps<typeof ProviderModelPicker>["value"]["reasoningLevel"];

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Couldn't save. Try again.";
}

function Row({ label, description, control, below, htmlFor }: {
  label: string; description: string; control: ReactNode; below?: ReactNode; htmlFor?: string;
}) {
  return (
    <div className="dl-row">
      <div className="dl-row-main">
        <div className="dl-row-text">
          <label className="dl-label" htmlFor={htmlFor}>{label}</label>
          <p className="dl-description">{description}</p>
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

function NumberField({ id, value, min, max, onSave, label }: {
  id?: string; value: number; min: number; max: number; onSave: (value: number) => void; label: string;
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
      min={min} max={max} step={1} value={draft}
      onChange={(event) => setDraft(event.target.value)} onBlur={commit}
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

export function DelegationSettingsForm() {
  const rpc = useRpc<typeof rpcContract>();
  const sdk = useSdk();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [settings, setSettings] = useState<DelegationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Option[]>([]);
  const [machines, setMachines] = useState<Array<Option & { connected: boolean }>>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const ids = { provider: useId(), machine: useId(), environment: useId(), section: useId(), lines: useId(), bullets: useId(), style: useId(), relay: useId(), retries: useId() };

  useEffect(() => {
    let live = true;
    rpcRef.current.call("getSettings", {}).then((next) => { if (live) setSettings(next); }, (cause) => { if (live) setError(errorMessage(cause)); });
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
    const parsed = settingsSchema.safeParse(payload);
    if (parsed.success) setSettings(parsed.data);
  });

  const save = useCallback((values: SettingsOverrides, reset?: string[]) => {
    setSettings((current) => (current ? { ...current, ...values } : current));
    setError(null);
    rpcRef.current.call("saveSettings", { values, ...(reset ? { reset } : {}) })
      .then(setSettings, (cause) => setError(errorMessage(cause)));
  }, []);

  // Models come from the machine workers run on: the chosen one, else the first connected one.
  const routingHost = settings?.machine || machines.find((machine) => machine.connected)?.value || null;
  const routing = routingHost ? { kind: "host" as const, hostId: routingHost } : undefined;

  // Picking "Choose a model" starts from the provider's default model.
  const [loadingModel, setLoadingModel] = useState<"model" | "qaModel" | null>(null);
  const chooseModel = useCallback(async (field: "model" | "qaModel", providerId: string) => {
    setLoadingModel(field);
    try {
      const catalog = await sdk.providers.models(routingHost ? { providerId, hostId: routingHost } : { providerId });
      const model = catalog.models.find((entry) => entry.isDefault) ?? catalog.models[0];
      if (!model) {
        setError(catalog.modelLoadError ? `Couldn't load this provider's models (${catalog.modelLoadError.code.replaceAll("_", " ")}).` : "This provider has no models to choose from.");
        return;
      }
      save(field === "model"
        ? { model: model.model, reasoningLevel: model.defaultReasoningEffort }
        : { qaModel: model.model });
    } catch (cause) { setError(errorMessage(cause)); } finally { setLoadingModel(null); }
  }, [routingHost, save, sdk]);

  if (!settings) {
    return error ? <p className="dl-error" role="alert">{error}</p> : <p className="dl-description" role="status">Loading…</p>;
  }

  const withCurrent = (options: Option[], value: string, missing: string) =>
    value && !options.some((option) => option.value === value) ? [...options, { value, label: `${value} (${missing})` }] : options;
  const providerOptions = withCurrent(providers, settings.provider, "unavailable");

  return (
    <div className="dl-settings">
      <p className="dl-description">The Delegation skills follow these, and agents read them with <code>bb delegation settings</code>. Anything you say in a request wins.</p>
      {error ? <p className="dl-error" role="alert">{error}</p> : null}
      <Group title="Workers">
        <Row label="Provider" htmlFor={ids.provider}
          description="Runs new workers unless you name another provider in the request."
          control={<Select id={ids.provider} label="Provider" value={settings.provider} options={providerOptions}
            onChange={(provider) => save({ provider }, ["model", "reasoningLevel", "qaModel"])} />} />
        <Row label="Model"
          description="The model new workers use. Spawn's normal tier picks the provider's current everyday model."
          control={<Select label="Model" value={settings.model || loadingModel === "model" ? "chosen" : "tier"} disabled={loadingModel === "model"}
            options={[{ value: "tier", label: "Spawn's normal tier" }, { value: "chosen", label: loadingModel === "model" ? "Loading models…" : "Choose a model" }]}
            onChange={(mode) => (mode === "tier" ? save({ model: "", reasoningLevel: "" }) : void chooseModel("model", settings.provider))} />}
          below={settings.model ? (
            <div className="dl-below">
              <ProviderModelPicker allowProviderChange={false} align="end" {...(routing ? { routing } : {})}
                value={{ providerId: settings.provider, model: settings.model, reasoningLevel: (settings.reasoningLevel || "high") as ReasoningLevel }}
                onChange={(next) => {
                  // The picker re-emits its normalized value (service tier, a supported reasoning
                  // level) on every render; save only fields this form stores, and only on change.
                  if (next.model !== settings.model || next.reasoningLevel !== settings.reasoningLevel) save({ model: next.model, reasoningLevel: next.reasoningLevel });
                }} />
            </div>
          ) : null} />
        <Row label="QA and smoke-test model"
          description="For QA, smoke tests, and other mechanical checks."
          control={<Select label="QA and smoke-test model" value={settings.qaModel !== "cheapest" || loadingModel === "qaModel" ? "chosen" : "cheapest"} disabled={loadingModel === "qaModel"}
            options={[{ value: "cheapest", label: "Cheapest available" }, { value: "chosen", label: loadingModel === "qaModel" ? "Loading models…" : "Choose a model" }]}
            onChange={(mode) => (mode === "cheapest" ? save({ qaModel: "cheapest" }) : void chooseModel("qaModel", settings.provider))} />}
          below={settings.qaModel !== "cheapest" ? (
            <div className="dl-below">
              <ProviderModelPicker allowProviderChange={false} align="end" {...(routing ? { routing } : {})}
                value={{ providerId: settings.provider, model: settings.qaModel, reasoningLevel: "low" }}
                onChange={(next) => { if (next.model !== settings.qaModel) save({ qaModel: next.model }); }} />
            </div>
          ) : null} />
        <Row label="Machine" htmlFor={ids.machine}
          description="Where new workers run. The lead's machine is used unless the spawn skill's capacity check moves the job."
          control={<Select id={ids.machine} label="Machine" value={settings.machine}
            options={withCurrent([{ value: "", label: "The lead's machine" }, ...machines], settings.machine, "removed")}
            onChange={(machine) => save({ machine })} />} />
        <Row label="Environment" htmlFor={ids.environment}
          description="Review and QA of another thread's change still attach to that thread's environment."
          control={<Select id={ids.environment} label="Environment" value={settings.environment} options={ENVIRONMENTS}
            onChange={(environment) => save({ environment: environment as DelegationSettings["environment"] })} />} />
        <Row label="Section" htmlFor={ids.section}
          description="The sidebar section new workers are filed into."
          control={<Select id={ids.section} label="Section" value={settings.section}
            options={withCurrent([{ value: "", label: "The lead's section" }, ...sections], settings.section, "deleted")}
            onChange={(section) => save({ section })} />} />
        <Row label="Parent workers to the lead"
          description="bb tells the lead when a parented worker finishes, fails, or needs input."
          control={<Switch aria-label="Parent workers to the lead" checked={settings.parentWorkers} onCheckedChange={(parentWorkers) => save({ parentWorkers })} />} />
      </Group>

      <Group title="Reports">
        <Row label="Worker report length" htmlFor={ids.lines}
          description="Most lines in a worker's final reply: the result, a PR link, and any blocker."
          control={<NumberField id={ids.lines} label="Worker report length" value={settings.workerReportLines} min={1} max={20} onSave={(workerReportLines) => save({ workerReportLines })} />} />
        <Row label="Report length" htmlFor={ids.bullets}
          description="Most bullets in a report to you, after a one-line outcome."
          control={<NumberField id={ids.bullets} label="Report length" value={settings.reportMaxBullets} min={1} max={20} onSave={(reportMaxBullets) => save({ reportMaxBullets })} />} />
        <Row label="Report style" htmlFor={ids.style}
          description="How the lead writes what its workers found."
          control={<Select id={ids.style} label="Report style" value={settings.reportStyle} options={REPORT_STYLES}
            onChange={(reportStyle) => save({ reportStyle: reportStyle as DelegationSettings["reportStyle"] })} />} />
        <Row label="Ask for decisions with action cards"
          description="Every decision you owe arrives as an inline card instead of a question in prose."
          control={<Switch aria-label="Ask for decisions with action cards" checked={settings.decisionsAsActionCards} onCheckedChange={(decisionsAsActionCards) => save({ decisionsAsActionCards })} />} />
        <Row label="Show evidence inline"
          description="Screenshots and videos appear in the report instead of being described or linked."
          control={<Switch aria-label="Show evidence inline" checked={settings.evidenceInline} onCheckedChange={(evidenceInline) => save({ evidenceInline })} />} />
      </Group>

      <Group title="Relays and retries">
        <Row label="Relay batching" htmlFor={ids.relay}
          description="How your decisions and requests reach a thread that is already working."
          control={<Select id={ids.relay} label="Relay batching" value={settings.relayBatching} options={RELAYS}
            onChange={(relayBatching) => save({ relayBatching: relayBatching as DelegationSettings["relayBatching"] })} />} />
        <Row label="Automatic retries" htmlFor={ids.retries}
          description="Retries of a worker's failed turn, such as a provider 429, before it's reported as blocked."
          control={<NumberField id={ids.retries} label="Automatic retries" value={settings.retryLimit} min={0} max={10} onSave={(retryLimit) => save({ retryLimit })} />} />
      </Group>

      <Group title="Archiving">
        <Row label="Agents may archive or stop threads"
          description="Off: no agent archives or stops a thread unless you ask for that thread."
          control={<Switch aria-label="Agents may archive or stop threads" checked={settings.mayArchiveOrStop} onCheckedChange={(mayArchiveOrStop) => save({ mayArchiveOrStop })} />} />
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
