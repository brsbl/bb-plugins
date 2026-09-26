import { createContext, useContext } from "react";
import type { CategoryId } from "../categories";
import type { CustomList, SavedList, SavedPlace } from "../model";
import type { Ring, TravelMode } from "../routing";
import type { SavedStore } from "../use-saved-state";
import type { RouteStore } from "../use-route";

export interface ListFilter { categories: CategoryId[]; notes: boolean; query: string; inView: boolean }
export const emptyFilter: ListFilter = { categories: [], notes: false, query: "", inView: false };
export interface ComposeScope { id: string; label: string; keys: string[] }
export interface ComposeDraft { sourceIds: string[]; scopes: ComposeScope[]; editing?: CustomList; title?: string; color?: string }
export type View =
  | { kind: "library"; query: string }
  | { kind: "lists"; ids: string[]; filter: ListFilter }
  | { kind: "place"; key: string }
  | { kind: "route" }
  | { kind: "compose"; draft: ComposeDraft };

export interface Bounds { west: number; south: number; east: number; north: number }
export const inBounds = (place: SavedPlace, b: Bounds) => place.latitude >= b.south && place.latitude <= b.north && (b.west <= b.east ? place.longitude >= b.west && place.longitude <= b.east : place.longitude >= b.west || place.longitude <= b.east);

export interface RingState { owner: string; mode: TravelMode; features: Ring[]; loading: boolean; error: string | null }

export interface AppApi {
  store: SavedStore;
  route: RouteStore;
  wide: boolean;
  bounds: Bounds | null;
  zoom: number;
  rings: RingState | null;
  canGoBack: boolean;
  getList: (id: string) => SavedList | undefined;
  push: (view: View) => void;
  pop: () => void;
  replace: (view: View) => void;
  openPlace: (key: string) => void;
  openLists: (ids: string[]) => void;
  hover: (key: string | null) => void;
  fitKeys: (keys: string[]) => void;
  showRings: (owner: string, points: SavedPlace[], mode: TravelMode, minutes: number[]) => void;
  clearRings: () => void;
  compose: (draft: ComposeDraft) => void;
  openUrl: (url: string) => void;
  expand: () => void;
}

export const AppContext = createContext<AppApi | null>(null);
export function useApp() {
  const app = useContext(AppContext);
  if (!app) throw new Error("Saved Places views need the map context.");
  return app;
}
