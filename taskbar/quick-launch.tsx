import { ChevronsRightGlyph } from "../art";
import type { Launcher } from "../programs/launchers";
import { useDesktop, type DesktopContextValue } from "../shell/data";
import { useMenu, type MenuEntry } from "../shell/menu";

/** Quick Launch keeps launcher ids in `preferences.quickLaunch`, in the order they show. */

function toggleQuickLaunch(desktop: DesktopContextValue, itemId: string) {
  const chosen = desktop.snapshot.preferences.quickLaunch;
  desktop.setPreferences({
    quickLaunch: chosen.includes(itemId) ? chosen.filter((id) => id !== itemId) : [...chosen, itemId],
  });
}

export function quickLaunchToggleEntry(desktop: DesktopContextValue, itemId: string): MenuEntry {
  const pinned = desktop.snapshot.preferences.quickLaunch.includes(itemId);
  return {
    label: pinned ? "Remove from Quick Launch" : "Add to Quick Launch",
    run: () => toggleQuickLaunch(desktop, itemId),
  };
}

export function quickLaunchMenu(
  desktop: DesktopContextValue,
  catalog: readonly Launcher[],
  itemId: string | null,
): MenuEntry[] {
  const known = new Set(catalog.map((item) => item.id));
  // Ids for programs that aren't loaded (a plugin app not registered yet, say) keep their place but are skipped when
  // moving; ids nothing could ever load are dropped on save.
  const chosen = desktop.snapshot.preferences.quickLaunch;
  const shown = chosen.filter((id) => known.has(id));
  const save = (quickLaunch: string[]) =>
    desktop.setPreferences({ quickLaunch: quickLaunch.filter((id) => known.has(id) || id.startsWith("app:")) });
  const index = itemId === null ? -1 : shown.indexOf(itemId);
  const move = (offset: number) => {
    const neighbor = shown[index + offset];
    if (itemId === null || neighbor === undefined) return;
    save(chosen.map((id) => (id === itemId ? neighbor : id === neighbor ? itemId : id)));
  };
  return [
    ...(index === -1
      ? []
      : [
          quickLaunchToggleEntry(desktop, shown[index]!),
          "separator" as const,
          { label: "Move left", disabled: index === 0, run: () => move(-1) },
          { label: "Move right", disabled: index === shown.length - 1, run: () => move(1) },
          "separator" as const,
        ]),
    { heading: "Show in Quick Launch" },
    ...catalog.map((item) => ({
      label: item.label,
      checked: chosen.includes(item.id),
      run: () =>
        save(chosen.includes(item.id) ? chosen.filter((id) => id !== item.id) : [...chosen, item.id]),
    })),
  ];
}

export function QuickLaunch({
  shown,
  hidden,
  catalog,
}: {
  shown: readonly Launcher[];
  hidden: readonly Launcher[];
  catalog: readonly Launcher[];
}) {
  const desktop = useDesktop();
  const menu = useMenu();
  return (
    <div className="bbd-quick" role="toolbar" aria-label="Quick Launch">
      {shown.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bbd-quick-item"
          aria-label={item.label}
          title={item.label}
          onClick={item.run}
          onContextMenu={(event) => menu.open(event, quickLaunchMenu(desktop, catalog, item.id))}
        >
          {item.art(item.quickSize)}
        </button>
      ))}
      <button
        type="button"
        className="bbd-quick-more"
        aria-label={hidden.length > 0 ? "More Quick Launch items" : "Choose Quick Launch items"}
        title={hidden.length > 0 ? "More Quick Launch items" : "Choose Quick Launch items"}
        aria-haspopup="menu"
        onClick={(event) =>
          menu.open(event, [
            ...hidden.map((item): MenuEntry => ({ label: item.label, icon: item.art(item.quickSize), run: item.run })),
            ...(hidden.length > 0 ? ["separator" as const] : []),
            ...quickLaunchMenu(desktop, catalog, null),
          ])
        }
      >
        <ChevronsRightGlyph className="size-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}
