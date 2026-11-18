import { useRealtime, useRpc } from "@get-bb/plugin-sdk/app";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import type { Preferences } from "./core";
import { setDesktopEnabled, useCompact, useDesktopSwitch } from "./enabled";
import { useDesktopApps } from "./programs/app-window";
import { LAUNCHER_IDS, LAUNCHER_LABELS, appLauncherId } from "./programs/launcher-ids";
import type { rpcContract } from "./server";
import { errorMessage } from "./shell/data";

/**
 * The saved desktop preferences, outside the desktop itself, for the Quick Launch choices this page edits.
 */
function usePreferences() {
  const rpc = useRpc<typeof rpcContract>();
  const rpcRef = useRef(rpc);
  rpcRef.current = rpc;
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only the newest load may land, and none while a save is in flight: an older response would put back a choice
  // the person just changed, and their next change would build on it.
  const latestLoad = useRef(0);
  const savesInFlight = useRef(0);

  const load = useCallback(() => {
    const request = ++latestLoad.current;
    rpcRef.current.call("snapshot").then(
      (snapshot) => {
        if (request !== latestLoad.current || savesInFlight.current > 0) return;
        setPreferences(snapshot.preferences);
        setError(null);
      },
      (loadError) => setError(errorMessage(loadError)),
    );
  }, []);

  useEffect(load, [load]);
  useRealtime("changed", (payload) => {
    if ((payload as { scope?: unknown } | null)?.scope === "preferences") load();
  });

  const save = (patch: Partial<Preferences>) => {
    setPreferences((current) => (current === null ? current : { ...current, ...patch }));
    savesInFlight.current += 1;
    rpcRef.current
      .call("setPreferences", patch)
      .catch((saveError) => setError(errorMessage(saveError)))
      .finally(() => {
        savesInFlight.current -= 1;
        load();
      });
  };

  return { preferences, error, save };
}

function SettingRow({
  label,
  description,
  htmlFor,
  control,
  layout = "inline",
}: {
  label: string;
  description: string;
  htmlFor?: string;
  control: ReactNode;
  layout?: "inline" | "trailing" | "below";
}) {
  const row =
    layout === "trailing"
      ? "flex items-start justify-between gap-5"
      : layout === "below"
        ? "flex flex-col gap-2.5"
        : "flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-5";
  return (
    <div className={`${row} py-3 first:pt-0 last:pb-0`}>
      <div className="min-w-0 flex-1">
        {htmlFor === undefined ? (
          <p className="min-w-0 text-sm text-foreground">{label}</p>
        ) : (
          <label htmlFor={htmlFor} className="min-w-0 text-sm text-foreground">
            {label}
          </label>
        )}
        <p className="mt-0.5 text-xs leading-snug text-subtle-foreground/75">{description}</p>
      </div>
      <div className={layout === "below" ? "w-full min-w-0" : "shrink-0"}>{control}</div>
    </div>
  );
}

function Switch({ id, checked, onChange }: { id: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const state = checked ? "checked" : "unchecked";
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={state}
      className="inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=checked]:bg-foreground data-[state=unchecked]:border-input data-[state=unchecked]:bg-muted"
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden
        data-state={state}
        className="pointer-events-none block size-3 rounded-full bg-background transition-transform data-[state=checked]:translate-x-3 data-[state=unchecked]:bg-foreground"
      />
    </button>
  );
}

/** Desktop's section on its plugin settings page, the one surface a phone can reach. */
export function DesktopSettings() {
  const id = useId();
  const compact = useCompact();
  const shown = useDesktopSwitch();
  const apps = useDesktopApps();
  const { preferences, error, save } = usePreferences();
  const quickLaunchItems = [
    ...apps.map((app) => ({ id: appLauncherId(app.key), label: app.title })),
    ...LAUNCHER_IDS.map((launcherId) => ({ id: launcherId, label: LAUNCHER_LABELS[launcherId] })),
  ];
  const chosen = preferences?.quickLaunch ?? [];
  return (
    <div className="grid gap-2">
      {compact ? (
        <p className="text-xs leading-snug text-subtle-foreground/75">
          The desktop isn't available on phones. Open bb in a window at least 768 px wide to use it.
        </p>
      ) : null}
      <div className="divide-y divide-border rounded-lg border border-border bg-card px-4 py-3.5">
        <SettingRow
          label="Show the desktop"
          description="Replaces the home page in this browser."
          htmlFor={`${id}-shown`}
          layout="trailing"
          control={<Switch id={`${id}-shown`} checked={shown} onChange={setDesktopEnabled} />}
        />
        <SettingRow
          label="Quick Launch"
          description="Shortcuts beside the bb button on the taskbar, in the order you add them."
          layout="below"
          control={
            <fieldset className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3" disabled={preferences === null} aria-label="Quick Launch">
              {quickLaunchItems.map((item) => (
                <label key={item.id} className="flex min-w-0 cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-3.5 shrink-0 cursor-pointer accent-foreground"
                    checked={chosen.includes(item.id)}
                    onChange={() =>
                      save({
                        quickLaunch: chosen.includes(item.id)
                          ? chosen.filter((launcherId) => launcherId !== item.id)
                          : [...chosen, item.id],
                      })
                    }
                  />
                  <span className="truncate">{item.label}</span>
                </label>
              ))}
            </fieldset>
          }
        />
      </div>
      {error === null ? null : (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
