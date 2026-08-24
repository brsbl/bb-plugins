import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  MoreHorizontalIcon,
  PlusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { definePluginApp, useRealtime, useRpc } from "@get-bb/plugin-sdk/app";

import {
  SECTION_ICON_OPTIONS,
  WORKFLOW_CONFIG_VERSION,
  createStageKey,
  editableWorkflowConfig,
  normalizeEditableWorkflowConfig,
  type EditableWorkflowConfig,
  type EditableWorkflowStage,
} from "./core.js";
import { SectionIcon, sectionIconLabel } from "./section-icon.js";
import type { rpcContract } from "./server.js";
import {
  cacheWorkflowConfig,
  mountThreadOrganizerSidebar,
} from "./sidebar-controller.js";

const fieldClass =
  "min-w-0 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-foreground/45 disabled:cursor-not-allowed disabled:opacity-60";
const quietFieldClass =
  "min-w-0 w-full rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background disabled:cursor-not-allowed disabled:opacity-60";
const buttonBaseClass =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
const outlineButtonClass = `${buttonBaseClass} border border-input bg-transparent text-foreground hover:bg-muted`;
const primaryButtonClass = `${buttonBaseClass} bg-foreground text-background hover:bg-foreground/90`;
const iconButtonClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40";
const stageRowClass =
  "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] items-start gap-x-2 gap-y-0 lg:grid-cols-[2rem_2rem_minmax(7rem,9rem)_minmax(0,1fr)_2rem]";
const stageRuleLayoutClass =
  "col-span-2 col-start-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-4 lg:row-start-1";
const workflowSettingsDescription =
  "Rename, re-icon, reorder, and define the workflow your agents follow.";
// Align the visible R to the rounded-lg panel's top-left tangent. Inter's
// capital R starts 180/2048 em inside its advance box, so hang that sidebearing
// back out of the shared radius inset rather than introducing a pixel nudge.
// The fallback matches the host's rounded-lg token in isolated plugin roots.
const workflowSettingsDescriptionClass =
  "ps-[var(--radius-lg,0.5rem)] [text-indent:-0.088em] text-sm leading-5 text-muted-foreground";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function uniqueNewStageTitle(stages: readonly EditableWorkflowStage[]): string {
  const titles = new Set(
    stages.map((stage) => stage.title.toLocaleLowerCase()),
  );
  if (!titles.has("new stage")) return "New Stage";
  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const title = `New Stage ${suffix}`;
    if (!titles.has(title.toLocaleLowerCase())) return title;
  }
  return "Untitled Stage";
}

function IconPicker({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange(value: EditableWorkflowStage["icon"]): void;
  value: EditableWorkflowStage["icon"];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredIcons = SECTION_ICON_OPTIONS.filter((icon) =>
    sectionIconLabel(icon).toLocaleLowerCase().includes(normalizedQuery),
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Choose icon for ${label}`}
        className={`${iconButtonClass} border border-border bg-background text-foreground`}
        onClick={() => {
          setQuery("");
          setOpen((current) => !current);
        }}
        title={`Choose icon for ${label}`}
        type="button"
      >
        <SectionIcon className="size-4" name={value} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 grid w-72 max-w-[calc(100vw-2rem)] gap-2 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg">
          <input
            aria-label="Search icons"
            autoFocus
            className={fieldClass}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search icons"
            type="search"
            value={query}
          />
          <div
            aria-label={`Icons for ${label}`}
            className="grid max-h-72 grid-cols-6 gap-1 overflow-y-auto pr-1"
            role="listbox"
          >
            {filteredIcons.map((icon) => {
              const iconLabel = sectionIconLabel(icon);
              return (
                <button
                  aria-label={iconLabel}
                  aria-selected={icon === value}
                  className={`inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${
                    icon === value
                      ? "bg-muted text-foreground ring-1 ring-foreground/35"
                      : "text-muted-foreground"
                  }`}
                  key={icon}
                  onClick={() => {
                    onChange(icon);
                    setOpen(false);
                  }}
                  role="option"
                  title={iconLabel}
                  type="button"
                >
                  <SectionIcon className="size-4" name={icon} />
                </button>
              );
            })}
            {filteredIcons.length === 0 ? (
              <p className="col-span-6 py-3 text-center text-xs text-muted-foreground">
                No matching icons
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StageActions({
  index,
  onMove,
  onRemove,
  stage,
  stageCount,
}: Pick<
  StageCardProps,
  "index" | "onMove" | "onRemove" | "stage" | "stageCount"
>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      className="relative col-start-3 row-start-1 shrink-0 lg:col-start-5"
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`More actions for ${stage.title}`}
        className={iconButtonClass}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        title={`More actions for ${stage.title}`}
        type="button"
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="size-4"
          icon={MoreHorizontalIcon}
        />
      </button>
      {open ? (
        <div
          aria-label={`Actions for ${stage.title}`}
          className="absolute right-0 top-full z-20 mt-1 grid w-40 gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          role="menu"
        >
          <button
            className="flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40"
            disabled={index <= 1}
            onClick={() => {
              setOpen(false);
              onMove(index, -1);
            }}
            role="menuitem"
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={ArrowUp02Icon}
            />
            Move up
          </button>
          <button
            className="flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40"
            disabled={index >= stageCount - 1}
            onClick={() => {
              setOpen(false);
              onMove(index, 1);
            }}
            role="menuitem"
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={ArrowDown02Icon}
            />
            Move down
          </button>
          <button
            className="flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-destructive hover:bg-destructive/10"
            onClick={() => {
              setOpen(false);
              onRemove(index);
            }}
            role="menuitem"
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={Delete02Icon}
            />
            Remove stage
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface StageCardProps {
  index: number;
  onChange(stage: EditableWorkflowStage): void;
  onDragStart(index: number): void;
  onDrop(index: number): void;
  onMove(index: number, direction: -1 | 1): void;
  onRemove(index: number): void;
  stage: EditableWorkflowStage;
  stageCount: number;
}

function StageCard({
  index,
  onChange,
  onDragStart,
  onDrop,
  onMove,
  onRemove,
  stage,
  stageCount,
}: StageCardProps) {
  const inbox = stage.role === "inbox";
  const update = <Key extends keyof EditableWorkflowStage>(
    key: Key,
    value: EditableWorkflowStage[Key],
  ) => onChange({ ...stage, [key]: value });

  return (
    <article
      className="min-w-0 border-b border-border bg-background px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg last:border-b-0 lg:p-3"
      onDragOver={(event) => {
        if (!inbox) event.preventDefault();
      }}
      onDrop={(event: DragEvent) => {
        event.preventDefault();
        if (!inbox) onDrop(index);
      }}
    >
      <div className={stageRowClass}>
        {inbox ? (
          <span aria-hidden="true" className="hidden size-8 lg:block" />
        ) : (
          <span className="hidden shrink-0 lg:inline-flex">
            <button
              aria-label={`Drag ${stage.title} to reorder`}
              className={`${iconButtonClass} cursor-grab active:cursor-grabbing`}
              draggable
              onDragStart={() => onDragStart(index)}
              title={`Drag ${stage.title} to reorder`}
              type="button"
            >
              <HugeiconsIcon
                aria-hidden="true"
                className="size-4"
                icon={DragDropVerticalIcon}
              />
            </button>
          </span>
        )}
        <IconPicker
          label={stage.title || "untitled stage"}
          onChange={(icon) => update("icon", icon)}
          value={stage.icon}
        />
        <input
          aria-label={`${stage.title || "Untitled stage"} section title`}
          className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background"
          maxLength={80}
          onChange={(event) => update("title", event.target.value)}
          value={stage.title}
        />
        {inbox ? (
          <span
            aria-hidden="true"
            className="col-start-3 row-start-1 size-8 lg:col-start-5"
          />
        ) : (
          <StageActions
            index={index}
            onMove={onMove}
            onRemove={onRemove}
            stage={stage}
            stageCount={stageCount}
          />
        )}
        {inbox ? (
          <p
            className={`${stageRuleLayoutClass} px-2.5 py-1.5 text-sm leading-5 text-muted-foreground`}
          >
            {stage.rule}
          </p>
        ) : (
          <label className={`${stageRuleLayoutClass} grid gap-1`}>
            <span className="sr-only">What belongs in {stage.title}</span>
            <textarea
              aria-label={`What belongs in ${stage.title}`}
              className={`${quietFieldClass} min-h-8 max-h-24 resize-none overflow-y-auto leading-5`}
              maxLength={240}
              onChange={(event) => update("rule", event.target.value)}
              rows={1}
              style={{ fieldSizing: "content" }}
              value={stage.rule}
            />
          </label>
        )}
      </div>
    </article>
  );
}

export function WorkflowSettings() {
  const rpc = useRpc<typeof rpcContract>();
  const [config, setConfig] = useState<EditableWorkflowConfig | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const editRevisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    if (dirtyRef.current || savingRef.current) return;
    const requestedRevision = editRevisionRef.current;
    setError(null);
    try {
      const full = await rpc.call("getConfig", {});
      if (
        dirtyRef.current ||
        savingRef.current ||
        editRevisionRef.current !== requestedRevision
      ) {
        return;
      }
      setConfig(editableWorkflowConfig(full));
      cacheWorkflowConfig(full);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);

  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("workflow-config-changed", () => {
    if (!dirtyRef.current && !savingRef.current) void load();
  });

  const markEdited = () => {
    editRevisionRef.current += 1;
    dirtyRef.current = true;
    setSaved(false);
  };

  const replaceStage = (index: number, stage: EditableWorkflowStage) => {
    markEdited();
    setConfig((current) =>
      current === null
        ? null
        : {
            ...current,
            stages: current.stages.map((candidate, candidateIndex) =>
              candidateIndex === index ? stage : candidate,
            ),
          },
    );
  };

  const moveStage = (from: number, to: number) => {
    if (from <= 0 || to <= 0 || config === null) return;
    const stages = [...config.stages];
    const [stage] = stages.splice(from, 1);
    if (stage === undefined) return;
    stages.splice(Math.min(to, stages.length), 0, stage);
    markEdited();
    setConfig({ ...config, stages });
  };

  const removeStage = (index: number) => {
    if (index <= 0 || config === null) return;
    const stages = config.stages.filter(
      (_, stageIndex) => stageIndex !== index,
    );
    markEdited();
    setConfig({ ...config, stages });
  };

  const addStage = () => {
    if (config === null || config.stages.length >= 12) return;
    const title = uniqueNewStageTitle(config.stages);
    const key = createStageKey(
      title,
      config.stages.map((stage) => stage.key),
    );
    markEdited();
    setConfig({
      ...config,
      stages: [
        ...config.stages,
        {
          key,
          role: "stage",
          title,
          icon: "Circle",
          rule: "Describe the work that belongs in this stage.",
        },
      ],
    });
  };

  const save = async () => {
    if (config === null) return;
    const submittedRevision = editRevisionRef.current;
    const normalized = normalizeEditableWorkflowConfig(config);
    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const full = await rpc.call("saveConfig", normalized);
      cacheWorkflowConfig(full);
      if (editRevisionRef.current === submittedRevision) {
        dirtyRef.current = false;
        setConfig(editableWorkflowConfig(full));
        setSaved(true);
      }
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading workflow…</p>;
  }
  if (config === null) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Couldn’t load the workflow."}
        </p>
        <button
          className={`${outlineButtonClass} w-fit`}
          onClick={() => void load()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 w-full max-w-3xl gap-4">
      <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3">
        <div className="min-w-60 flex-1">
          <p className={workflowSettingsDescriptionClass}>
            {workflowSettingsDescription}
          </p>
        </div>
        <div
          aria-label="Workflow actions"
          className="ml-auto flex shrink-0 items-center justify-end gap-2"
          role="group"
        >
          <button
            className={outlineButtonClass}
            disabled={config.stages.length >= 12}
            onClick={addStage}
            type="button"
          >
            <HugeiconsIcon aria-hidden icon={PlusSignIcon} />
            Add stage
          </button>
          <button
            className={primaryButtonClass}
            disabled={saving}
            onClick={() => void save()}
            type="button"
          >
            <HugeiconsIcon aria-hidden icon={Tick02Icon} />
            {saving ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="min-w-0 overflow-visible rounded-lg border border-border">
        {config.stages.map((stage, index) => (
          <StageCard
            index={index}
            key={stage.key}
            onChange={(next) => replaceStage(index, next)}
            onDragStart={setDraggedIndex}
            onDrop={(target) => {
              if (draggedIndex !== null) moveStage(draggedIndex, target);
              setDraggedIndex(null);
            }}
            onMove={(stageIndex, direction) =>
              moveStage(stageIndex, stageIndex + direction)
            }
            onRemove={removeStage}
            stage={stage}
            stageCount={config.stages.length}
          />
        ))}
      </div>
    </div>
  );
}

export default definePluginApp((app) => {
  app.contentScripts.register({
    id: "workflow-sidebar",
    mount: ({ pluginId, signal }) =>
      mountThreadOrganizerSidebar({ pluginId, signal }),
  });

  app.slots.settingsSection({
    id: "workflow-sections",
    component: WorkflowSettings,
  });
});

export const workflowConfigVersion = WORKFLOW_CONFIG_VERSION;
