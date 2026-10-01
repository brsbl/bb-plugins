import { experimental_NewThreadComposer as NewThreadComposer, type NewThreadRequest } from "@get-bb/plugin-sdk/app";
import { NewThreadArt } from "../../art";
import { useDesktop } from "../../shell/data";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";

/**
 * Starts a thread in a folder, section or project. Drafts persist under `desktop:new-thread:<group>`,
 * a stored key that must not change.
 */
export function NewThreadWindow({ window: desktopWindow, groupKey }: { window: DesktopWindow; groupKey: string | null }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const group = groupKey === null ? null : (desktop.groupByKey.get(groupKey) ?? null);

  const submit = async (request: NewThreadRequest) => {
    const { threadId } = await desktop.call("spawnThread", {
      request: {
        ...request,
        ...(group?.kind === "section" && group.id !== null ? { sectionId: group.id } : {}),
      },
    });
    if (group?.kind === "folder") {
      await desktop.call("addToFolder", { folderId: group.folder.id, threadIds: [threadId], fromFolderId: null });
    }
    manager.close(desktopWindow.id);
    manager.open({ kind: "thread", threadId });
  };

  return (
    <WindowFrame
      window={desktopWindow}
      title={group === null ? "New thread" : `New thread in ${group.name}`}
      icon={<NewThreadArt size={16} />}
    >
      <div className="h-full overflow-auto bg-background p-3">
        <NewThreadComposer
          onSubmit={submit}
          {...(group?.kind === "project" && group.id !== null ? { defaultProjectId: group.id } : {})}
          draftKey={`desktop:new-thread:${groupKey ?? "desktop"}`}
          placeholder="What should this thread do?"
        />
      </div>
    </WindowFrame>
  );
}
