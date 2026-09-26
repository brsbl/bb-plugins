import { FolderArt } from "../art";
import { useDesktopEnabled } from "../enabled";
import { PLUGIN_SCOPE } from "../slots";
import { useDesktopSnapshot } from "./data";

/** Shown next to a thread's title in bb: the Desktop folders the thread is filed in. */
export function ThreadFolderChip({ threadId }: { threadId: string }) {
  const enabled = useDesktopEnabled();
  const { snapshot } = useDesktopSnapshot();
  const folders = (snapshot?.folders ?? []).filter((folder) => folder.threadIds.includes(threadId));
  const [first] = folders;
  if (!enabled || first === undefined) return null;
  const names = folders.map((folder) => folder.name).join(", ");
  return (
    <span
      className="bbd-root bbd-folder-chip"
      {...PLUGIN_SCOPE}
      title={`In Desktop ${folders.length === 1 ? "folder" : "folders"}: ${names}`}
      aria-label={`In Desktop ${folders.length === 1 ? "folder" : "folders"}: ${names}`}
    >
      <FolderArt kind="section" size={16} />
      <span className="truncate">{first.name}</span>
      {folders.length > 1 ? <span className="text-muted-foreground">+{folders.length - 1}</span> : null}
    </span>
  );
}
