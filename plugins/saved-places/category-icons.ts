import type { IconSvgElement } from "@hugeicons/react";
import Airplane01 from "@hugeicons/core-free-icons/Airplane01Icon";
import Beach from "@hugeicons/core-free-icons/BeachIcon";
import BedDouble from "@hugeicons/core-free-icons/BedDoubleIcon";
import Beer from "@hugeicons/core-free-icons/BeerIcon";
import Binoculars from "@hugeicons/core-free-icons/BinocularsIcon";
import Books01 from "@hugeicons/core-free-icons/Books01Icon";
import BottleWine from "@hugeicons/core-free-icons/BottleWineIcon";
import Camera01 from "@hugeicons/core-free-icons/Camera01Icon";
import Castle from "@hugeicons/core-free-icons/CastleIcon";
import ChinaTemple from "@hugeicons/core-free-icons/ChinaTempleIcon";
import Church from "@hugeicons/core-free-icons/ChurchIcon";
import Coffee02 from "@hugeicons/core-free-icons/Coffee02Icon";
import Croissant from "@hugeicons/core-free-icons/CroissantIcon";
import Drink from "@hugeicons/core-free-icons/DrinkIcon";
import Dumbbell01 from "@hugeicons/core-free-icons/Dumbbell01Icon";
import FerrisWheel from "@hugeicons/core-free-icons/FerrisWheelIcon";
import FerryBoat from "@hugeicons/core-free-icons/FerryBoatIcon";
import Film01 from "@hugeicons/core-free-icons/Film01Icon";
import FishFood from "@hugeicons/core-free-icons/FishFoodIcon";
import Flower from "@hugeicons/core-free-icons/FlowerIcon";
import Football from "@hugeicons/core-free-icons/FootballIcon";
import Hamburger01 from "@hugeicons/core-free-icons/Hamburger01Icon";
import HotTube from "@hugeicons/core-free-icons/HotTubeIcon";
import IceCream02 from "@hugeicons/core-free-icons/IceCream02Icon";
import Landmark from "@hugeicons/core-free-icons/LandmarkIcon";
import Library from "@hugeicons/core-free-icons/LibraryIcon";
import City02 from "@hugeicons/core-free-icons/City02Icon";
import Location01 from "@hugeicons/core-free-icons/Location01Icon";
import Mailbox01 from "@hugeicons/core-free-icons/Mailbox01Icon";
import Mosque01 from "@hugeicons/core-free-icons/Mosque01Icon";
import Mountain from "@hugeicons/core-free-icons/MountainIcon";
import MusicNote01 from "@hugeicons/core-free-icons/MusicNote01Icon";
import Noodles from "@hugeicons/core-free-icons/NoodlesIcon";
import PaintBoard from "@hugeicons/core-free-icons/PaintBoardIcon";
import Pizza01 from "@hugeicons/core-free-icons/Pizza01Icon";
import Restaurant01 from "@hugeicons/core-free-icons/Restaurant01Icon";
import ShoppingBag01 from "@hugeicons/core-free-icons/ShoppingBag01Icon";
import ShoppingBasket01 from "@hugeicons/core-free-icons/ShoppingBasket01Icon";
import Steak from "@hugeicons/core-free-icons/SteakIcon";
import Stethoscope from "@hugeicons/core-free-icons/StethoscopeIcon";
import Sushi01 from "@hugeicons/core-free-icons/Sushi01Icon";
import TShirt from "@hugeicons/core-free-icons/TShirtIcon";
import Taco01 from "@hugeicons/core-free-icons/Taco01Icon";
import TeaPod from "@hugeicons/core-free-icons/TeaPodIcon";
import Tent from "@hugeicons/core-free-icons/TentIcon";
import Theater from "@hugeicons/core-free-icons/TheaterIcon";
import TorriGate from "@hugeicons/core-free-icons/TorriGateIcon";
import Train01 from "@hugeicons/core-free-icons/Train01Icon";
import Tree06 from "@hugeicons/core-free-icons/Tree06Icon";
import Vynil01 from "@hugeicons/core-free-icons/Vynil01Icon";
import type { CategoryId } from "./categories";

export const categoryIcons: Record<CategoryId, IconSvgElement> = {
  ramen: Noodles,
  sushi: Sushi01,
  food: Restaurant01,
  coffee: Coffee02,
  bars: Drink,
  records: Vynil01,
  music: MusicNote01,
  culture: Camera01,
  outdoors: Tree06,
  stays: BedDouble,
  other: Location01,
  neighborhood: City02,
  address: Mailbox01,
  pizza: Pizza01,
  burger: Hamburger01,
  tacos: Taco01,
  grill: Steak,
  seafood: FishFood,
  market: ShoppingBasket01,
  tea: TeaPod,
  bakery: Croissant,
  dessert: IceCream02,
  wine: BottleWine,
  beer: Beer,
  museum: Landmark,
  gallery: PaintBoard,
  temple: ChinaTemple,
  shrine: TorriGate,
  church: Church,
  mosque: Mosque01,
  castle: Castle,
  theater: Theater,
  cinema: Film01,
  library: Library,
  garden: Flower,
  beach: Beach,
  viewpoint: Binoculars,
  nature: Mountain,
  camping: Tent,
  shop: ShoppingBag01,
  books: Books01,
  fashion: TShirt,
  spa: HotTube,
  fitness: Dumbbell01,
  sports: Football,
  amusement: FerrisWheel,
  transit: Train01,
  airport: Airplane01,
  ferry: FerryBoat,
  health: Stethoscope,
};

const attr = (name: string) => name.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
export function iconSvg(icon: IconSvgElement, { color = "currentColor", size = 24, strokeWidth = 1.8 }: { color?: string; size?: number; strokeWidth?: number } = {}) {
  const body = icon.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => {
    const value = k === "strokeWidth" ? strokeWidth : v === "currentColor" ? color : v;
    return `${attr(k)}="${String(value)}"`;
  }).join(" ")}/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">${body}</svg>`;
}

export function drawIcon(context: CanvasRenderingContext2D, icon: IconSvgElement, color: string, size: number, strokeWidth = 1.8) {
  context.save();
  context.scale(size / 24, size / 24);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const [tag, a] of icon) {
    const n = (k: string) => Number(a[k] ?? 0);
    const path = new Path2D();
    if (tag === "path") path.addPath(new Path2D(String(a.d)));
    else if (tag === "circle") path.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
    else if (tag === "ellipse") path.ellipse(n("cx"), n("cy"), n("rx"), n("ry"), 0, 0, Math.PI * 2);
    else if (tag === "rect") path.roundRect(n("x"), n("y"), n("width"), n("height"), n("rx"));
    else if (tag === "line") { path.moveTo(n("x1"), n("y1")); path.lineTo(n("x2"), n("y2")); }
    else continue;
    if (a.fill && a.fill !== "none") { context.fillStyle = color; context.fill(path, a.fillRule === "evenodd" ? "evenodd" : "nonzero"); }
    if (a.stroke && a.stroke !== "none") { context.strokeStyle = color; context.lineWidth = strokeWidth; context.stroke(path); }
  }
  context.restore();
}
