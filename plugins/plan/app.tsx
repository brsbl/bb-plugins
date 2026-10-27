import { useCallback, useState, type ComponentType } from "react";
import { definePluginApp } from "@get-bb/plugin-sdk/app";
import type { OpenRecord } from "./model.js";
import { useOpenRecord, usePlanData, useSave } from "./components/data.js";
import { InvestmentScreen, OwnerScreen, PlanScreen, PortfolioScreen, TeamsScreen, type Editing, type Panel, type Screen } from "./components/screens.js";
import "./app.css";

function openRecordFor(screen: Screen): OpenRecord | null {
  if (screen.kind === "portfolio") return { kind: "objective", id: screen.objectiveId };
  if (screen.kind === "investment") return { kind: "investment", id: screen.investmentId };
  return null;
}

function screenKey(screen: Screen): string {
  if (screen.kind === "portfolio") return `portfolio:${screen.objectiveId}`;
  if (screen.kind === "investment") return `investment:${screen.investmentId}`;
  if (screen.kind === "owner") return `owner:${screen.owner.kind}:${screen.owner.threadId}`;
  return screen.kind;
}

export function PlanPanel({ threadId }: { threadId: string }) {
  const data = usePlanData();
  const [screen, setScreen] = useState<Screen>({ kind: "plan" });
  const [editing, setEditing] = useState<Editing>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const save = useSave(data.reload, setNotice);
  const go = useCallback((next: Screen) => { setScreen(next); setEditing(null); setNotice(null); }, []);
  const edit = useCallback((next: Editing) => { setEditing(next); if (next) setNotice(null); }, []);
  useOpenRecord(data.rpc, threadId, openRecordFor(screen), data.connection);

  if (!data.snapshot) {
    return <div className="pl">
      <div className="pl-top"><span className="pl-ttl">Plan</span></div>
      <div className="pl-body">
        {data.loadError
          ? <p className="pl-msg" role="alert">{data.loadError} <button type="button" className="pl-lk" onClick={() => void data.reload()}>Retry</button></p>
          : <p className="pl-hintbox" role="status">Loading…</p>}
      </div>
    </div>;
  }

  const panel: Panel = { snapshot: data.snapshot, rpc: data.rpc, editing, edit, save, notice, notify: setNotice, go };
  const key = screenKey(screen);
  return <div className="pl">
    {screen.kind === "plan" ? <PlanScreen key={key} panel={panel} />
      : screen.kind === "portfolio" ? <PortfolioScreen key={key} panel={panel} objectiveId={screen.objectiveId} origin={screen.origin} />
        : screen.kind === "investment" ? <InvestmentScreen key={key} panel={panel} objectiveId={screen.objectiveId} investmentId={screen.investmentId} origin={screen.origin} />
          : screen.kind === "teams" ? <TeamsScreen key={key} panel={panel} />
            : <OwnerScreen key={key} panel={panel} owner={screen.owner} />}
  </div>;
}

function PlanTab({ threadId }: { threadId: string }) {
  return <PlanPanel threadId={threadId} />;
}

interface ThreadTabRegistration {
  id: string;
  title: string;
  icon: "Layers";
  layout: "flush";
  context: { kind: "thread" };
  availability: "action";
  component: ComponentType<{ threadId: string }>;
}

export default definePluginApp((app) => {
  const slots = app.slots;
  if ("experimental_tab" in slots && typeof slots.experimental_tab === "function") {
    const registration: ThreadTabRegistration = { id: "plan", title: "Plan", icon: "Layers", layout: "flush", context: { kind: "thread" }, availability: "action", component: PlanTab };
    slots.experimental_tab(registration);
  } else {
    app.slots.threadPanelAction({ id: "plan", title: "Plan", icon: "Layers", layout: "flush", component: PlanTab });
  }
});
