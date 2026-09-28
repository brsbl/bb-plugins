import { useState, type ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import Location01 from "@hugeicons/core-free-icons/Location01Icon";
import { categoryIcons } from "./category-icons";
import { placesByKey, type SavedList, type SavedPlace } from "./model";

export function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function IconButton({ icon, label, onClick, pressed, tone = "plain", disabled }: { icon: IconSvgElement; label: string; onClick: () => void; pressed?: boolean; tone?: "plain" | "glass"; disabled?: boolean }) {
  return <button type="button" className={`sp-icon-button sp-icon-button-${tone}`} aria-label={label} title={label} aria-pressed={pressed} disabled={disabled} onClick={onClick}><Icon icon={icon} /></button>;
}

const coverCache = new Map<string, SavedPlace[]>();
const popularity = (p: SavedPlace) => p.rating === null ? 0 : p.rating * Math.log10((p.reviewCount ?? 0) + 10);
export function coverPlaces(list: SavedList, count = 4) {
  const cacheKey = `${list.id}:${list.placeKeys.length}:${list.placeKeys[0] ?? ""}:${count}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;
  const ranked = list.placeKeys.map((key, index) => ({ place: placesByKey.get(key), index }))
    .filter((e): e is { place: SavedPlace; index: number } => Boolean(e.place))
    .sort((a, b) => Number(Boolean(b.place.photoUrl)) - Number(Boolean(a.place.photoUrl)) || popularity(b.place) - popularity(a.place) || a.index - b.index)
    .map(e => e.place);
  const photos = ranked.filter(p => p.photoUrl).slice(0, count);
  const counts = new Map<string, number>();
  for (const place of ranked) counts.set(place.category, (counts.get(place.category) ?? 0) + 1);
  const seen = new Set<string>();
  const byCategory = ranked.filter(p => !seen.has(p.category) && Boolean(seen.add(p.category)))
    .sort((a, b) => (counts.get(b.category) ?? 0) - (counts.get(a.category) ?? 0));
  const typed = byCategory.filter(p => p.category !== "other");
  const result = photos.length ? photos : (typed.length ? typed : byCategory).slice(0, count);
  coverCache.set(cacheKey, result);
  return result;
}

function CoverTile({ place, index }: { place: SavedPlace; index: number }) {
  const [failed, setFailed] = useState(false);
  if (place.photoUrl && !failed) return <span className="sp-cover-tile sp-cover-photo"><img src={place.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
  return <span className="sp-cover-tile" data-shade={index % 4}><HugeiconsIcon icon={categoryIcons[place.category]} size="46%" strokeWidth={1.8} aria-hidden="true" /></span>;
}

export function ListCover({ list, size = 44 }: { list: SavedList; size?: number }) {
  const tiles = coverPlaces(list, size < 32 ? 1 : 4);
  return <span className="sp-cover" data-count={Math.max(1, tiles.length)} style={{ width: size, height: size, "--list-color": list.color } as React.CSSProperties} aria-hidden="true">
    {!tiles.length
      ? <span className="sp-cover-tile" data-shade="1"><HugeiconsIcon icon={Location01} size="46%" strokeWidth={1.8} aria-hidden="true" /></span>
      : tiles.map((place, i) => <CoverTile key={place.key} place={place} index={i} />)}
  </span>;
}

export function PlaceAvatar({ place, color, size = 40 }: { place: SavedPlace; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (place.photoUrl && !failed) return <span className="sp-avatar sp-avatar-photo" style={{ width: size, height: size }}><img src={place.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} /></span>;
  return <span className="sp-avatar" style={{ width: size, height: size, "--list-color": color } as React.CSSProperties} aria-hidden="true"><Icon icon={categoryIcons[place.category]} size={Math.round(size * 0.45)} /></span>;
}

export function Chip({ pressed, onClick, children, color }: { pressed: boolean; onClick: () => void; children: ReactNode; color?: string }) {
  return <button type="button" className="sp-chip" aria-pressed={pressed} onClick={onClick} style={color ? { "--chip-color": color } as React.CSSProperties : undefined}>{children}</button>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="sp-section-title"><h3>{children}</h3>{action}</div>;
}

export const plural = (n: number, word: string, many = `${word}s`) => `${n.toLocaleString()} ${n === 1 ? word : many}`;
