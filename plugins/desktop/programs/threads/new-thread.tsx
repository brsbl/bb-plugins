import { experimental_NewThreadComposer as NewThreadComposer, type NewThreadRequest } from "@get-bb/plugin-sdk/app";
import type { ReactNode } from "react";
import { NewAppArt, NewThreadArt } from "../../art";
import { useDesktop } from "../../shell/data";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";

/** Matches bb's own New plugin prompt, so the agent reaches for its plugin-authoring and desktop-apps skills. */
export const NEW_APP_PROMPT = "Create a new bb plugin that opens as a Desktop app and ";

/**
 * Starts a thread in a folder, section or project. Drafts persist under `desktop:new-thread:<group>`,
 * a stored key that must not change.
 */
export function NewThreadWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string | null }) {
  const desktop = useDesktop();
  const group = groupKey === null ? null : (desktop.groupByKey.get(groupKey) ?? null);
  return (
    <ComposerWindow
      window={desktopWindow}
      title={group === null ? "New thread" : `New thread in ${group.name}`}
      icon={<NewThreadArt size={16} />}
      draftKey={`desktop:new-thread:${groupKey ?? "desktop"}`}
      placeholder="What should this thread do?"
      {...(group?.kind === "project" && group.id !== null ? { defaultProjectId: group.id } : {})}
      extra={{
        ...(group?.kind === "section" && group.id !== null ? { sectionId: group.id } : {}),
      }}
      {...(group?.kind === "folder" ? { folderId: group.folder.id } : {})}
    />
  );
}

/** Starts a thread that builds a bb plugin registered as a Desktop app. Its draft persists under `desktop:new-app`. */
export function NewAppWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  return (
    <ComposerWindow
      window={desktopWindow}
      title="New app"
      icon={<NewAppArt size={16} />}
      draftKey="desktop:new-app"
      initialPrompt={NEW_APP_PROMPT}
      placeholder="What should the app do?"
    />
  );
}

function ComposerWindow({
  window: desktopWindow,
  title,
  icon,
  draftKey,
  placeholder,
  initialPrompt,
  defaultProjectId,
  extra = {},
  folderId,
}: {
  window: DesktopWindow;
  title: string;
  icon: ReactNode;
  draftKey: string;
  placeholder: string;
  initialPrompt?: string;
  defaultProjectId?: string;
  extra?: { sectionId?: string };
  folderId?: string;
}) {
  const desktop = useDesktop();
  const manager = useWindowManager();

  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", {
      request: { ...request, ...extra },
      ...(folderId === undefined ? {} : { folderId }),
    });
    manager.close(desktopWindow.id);
    manager.open({ kind: "thread", threadId });
  };

  return (
    <WindowFrame window={desktopWindow} title={title} icon={icon}>
      <div className="h-full overflow-auto bg-background p-3">
        <NewThreadComposer
          onSubmit={submit}
          {...(defaultProjectId === undefined ? {} : { defaultProjectId })}
          {...(initialPrompt === undefined ? {} : { initialPrompt })}
          draftKey={draftKey}
          placeholder={placeholder}
        />
      </div>
    </WindowFrame>
  );
}
