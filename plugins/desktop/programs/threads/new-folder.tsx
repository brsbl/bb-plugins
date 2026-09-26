import { useState } from "react";
import { toast } from "sonner";
import { NewFolderArt } from "../../art";
import { sortThreads } from "../../core";
import { errorMessage, useDesktop } from "../../shell/data";
import { WindowFrame, useWindowManager, type DesktopWindow } from "../../windows";

/** Creates a sidebar section or a desktop-only folder, optionally filing threads into it. */
export function NewFolderWindow({ window: desktopWindow }: { window: DesktopWindow }) {
  const desktop = useDesktop();
  const manager = useWindowManager();
  const [name, setName] = useState("New folder");
  const [kind, setKind] = useState<"section" | "folder">(
    desktop.effective.organize === "section" ? "section" : "folder",
  );
  const [hide, setHide] = useState(false);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const needle = query.trim().toLocaleLowerCase();
  const candidates = sortThreads(
    desktop.threads.filter(
      (thread) => !thread.isArchived && (needle === "" || thread.title.toLocaleLowerCase().includes(needle)),
    ),
    desktop.sort.key,
    desktop.sort.direction,
  ).slice(0, 200);

  const create = async () => {
    setBusy(true);
    try {
      const trimmed = name.trim() || "New folder";
      let key: string;
      if (kind === "section") {
        const section = await desktop.call("createSection", { name: trimmed });
        if (picked.size > 0) {
          await desktop.call("moveToSection", { threadIds: [...picked], sectionId: section.id });
        }
        key = `section:${section.id}`;
      } else {
        const folder = await desktop.call("createFolder", {
          name: trimmed,
          hideFromSidebar: hide,
          position: null,
        });
        if (picked.size > 0) {
          await desktop.call("addToFolder", { folderId: folder.id, threadIds: [...picked], fromFolderId: null });
        }
        key = `folder:${folder.id}`;
      }
      desktop.refresh();
      manager.close(desktopWindow.id);
      manager.open({ kind: "finder", key });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WindowFrame window={desktopWindow} title="New folder" icon={<NewFolderArt size={16} />}>
      <form
        className="flex h-full flex-col gap-3 overflow-auto p-3 text-xs"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <label className="flex items-center gap-2">
          Name
          <input
            className="bbd-field bbd-sunken flex-1"
            value={name}
            autoFocus
            onFocus={(event) => event.target.select()}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <fieldset className="bbd-fieldset space-y-1">
          <legend>Kind</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" checked={kind === "section"} onChange={() => setKind("section")} />
            Sidebar section — shows up in bb’s sidebar too
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" checked={kind === "folder"} onChange={() => setKind("folder")} />
            Desktop folder — only on this desktop
          </label>
          {kind === "folder" ? (
            <label className="ml-5 flex items-center gap-2">
              <input type="checkbox" checked={hide} onChange={(event) => setHide(event.target.checked)} />
              Hide its threads from the sidebar thread list
            </label>
          ) : null}
        </fieldset>
        <fieldset className="bbd-fieldset flex min-h-32 flex-1 flex-col gap-1">
          <legend>{kind === "section" ? "Move threads in" : "Add threads"} ({picked.size})</legend>
          <input
            className="bbd-field bbd-sunken"
            placeholder="Search"
            aria-label="Search threads to add"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="bbd-sunken min-h-0 flex-1 overflow-auto py-1">
            {candidates.map((thread) => (
              <label key={thread.id} className="bbd-row grid-cols-[14px_1fr]">
                <input
                  type="checkbox"
                  checked={picked.has(thread.id)}
                  onChange={(event) => {
                    const next = new Set(picked);
                    if (event.target.checked) next.add(thread.id);
                    else next.delete(thread.id);
                    setPicked(next);
                  }}
                />
                <span className="truncate">{thread.title}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-auto flex justify-end gap-2">
          <button type="button" className="bbd-button bbd-bevel min-w-20 justify-center" onClick={() => manager.close(desktopWindow.id)}>
            Cancel
          </button>
          <button type="submit" className="bbd-button bbd-bevel min-w-20 justify-center font-semibold" disabled={busy}>
            Create
          </button>
        </div>
      </form>
    </WindowFrame>
  );
}

