import { useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { categoryIcons } from "./category-icons";
import { useMapSnapshot } from "./cover-snapshots";
import { placesByKey, type SavedList, type SavedPlace } from "./model";
import { AppContext } from "./views/context";

export function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function IconButton({ icon, label, onClick, pressed, tone = "plain", disabled }: { icon: IconSvgElement; label: string; onClick: () => void; pressed?: boolean; tone?: "plain" | "glass"; disabled?: boolean }) {
  return <button type="button" className={`sp-icon-button sp-icon-button-${tone}`} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}><Icon icon={icon} /></button>;
}

const coverCache = new Map<string, SavedPlace[]>();
const popularity = (p: SavedPlace) => p.rating === null ? 0 : p.rating * Math.log10((p.reviewCount ?? 0) + 10);
export function coverPhotos(list: SavedList, count = 4) {
  const cacheKey = `${list.id}:${list.placeKeys.length}:${list.placeKeys[0] ?? ""}:${count}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;
  const result = list.placeKeys.map((key, index) => ({ place: placesByKey.get(key), index }))
    .filter((e): e is { place: SavedPlace; index: number } => Boolean(e.place?.photoUrl))
    .sort((a, b) => popularity(b.place) - popularity(a.place) || a.index - b.index)
    .slice(0, count)
    .map(e => e.place);
  coverCache.set(cacheKey, result);
  return result;
}

function CoverPhoto({ place }: { place: SavedPlace }) {
  const [failed, setFailed] = useState(false);
  return <span className="sp-cover-tile">{!failed && <img src={place.photoUrl ?? ""} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}</span>;
}

export function ListCover({ list, size = 44 }: { list: SavedList; size?: number }) {
  const dark = useContext(AppContext)?.dark ?? false;
  const small = size < 32;
  const photos = coverPhotos(list, small ? 1 : 4);
  const tiles = photos.length >= 4 ? photos : photos.slice(0, 1);
  const places = useMemo(() => tiles.length ? [] : list.placeKeys.map(key => placesByKey.get(key)).filter((p): p is SavedPlace => Boolean(p)), [tiles.length, list.placeKeys]);
  const element = useRef<HTMLSpanElement>(null);
  const snapshot = useMapSnapshot(element, places, dark);
  return <span ref={element} className="sp-cover" data-count={Math.max(1, tiles.length)} style={{ width: size, height: size, "--list-color": list.color } as React.CSSProperties} aria-hidden="true">
    {tiles.length
      ? tiles.map(place => <CoverPhoto key={place.key} place={place} />)
      : <span className="sp-cover-tile">{snapshot && <img className="sp-cover-map" src={snapshot} alt="" />}</span>}
  </span>;
}

export function PlaceAvatar({ place, color, size = 40 }: { place: SavedPlace; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (place.photoUrl && !failed) return <span className="sp-avatar sp-avatar-photo" style={{ width: size, height: size }}><img src={place.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
  return <span className="sp-avatar sp-orb" style={{ width: size, height: size, "--orb-color": color } as React.CSSProperties} aria-hidden="true"><Icon icon={categoryIcons[place.category]} size={Math.round(size * 0.45)} /></span>;
}

export function Chip({ pressed, onClick, children, color }: { pressed: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return <button type="button" className="sp-chip" aria-pressed={pressed} onClick={onClick} style={color ? { "--chip-color": color } as React.CSSProperties : undefined}>{children}</button>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="sp-section-title"><h3>{children}</h3>{action}</div>;
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n.toLocaleString()} ${n === 1 ? word : many}`;
