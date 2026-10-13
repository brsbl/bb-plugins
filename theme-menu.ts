export type ThemeMenuPlacement = {
  side: "up" | "down";
  maxHeight: number;
};

type ThemeMenuBounds = {
  controlTop: number;
  controlBottom: number;
  boundaryTop: number;
  boundaryBottom: number;
};

const MENU_MAX_HEIGHT = 520;
const BOUNDARY_GAP = 8;

export function placeThemeMenu(bounds: ThemeMenuBounds): ThemeMenuPlacement {
  const above = Math.max(0, bounds.controlTop - bounds.boundaryTop - BOUNDARY_GAP);
  const below = Math.max(0, bounds.boundaryBottom - bounds.controlBottom - BOUNDARY_GAP);
  const side = below < MENU_MAX_HEIGHT && above > below ? "up" : "down";

  return {
    side,
    maxHeight: Math.min(MENU_MAX_HEIGHT, Math.floor(side === "up" ? above : below)),
  };
}
