import { z } from "zod";

export const categoryIdSchema = z.enum([
  "ramen", "sushi", "food", "coffee", "bars", "records", "music", "culture", "outdoors", "stays", "other",
  "pizza", "burger", "tacos", "grill", "seafood", "market",
  "tea", "bakery", "dessert",
  "wine", "beer",
  "museum", "gallery", "temple", "shrine", "church", "mosque", "castle", "theater", "cinema", "library",
  "garden", "beach", "viewpoint", "nature", "camping",
  "shop", "books", "fashion",
  "spa", "fitness", "sports", "amusement",
  "transit", "airport", "ferry",
  "health",
]);
export type CategoryId = z.infer<typeof categoryIdSchema>;

export const groups = [
  { id: "food", label: "Food", color: "#e37725", icon: "food" },
  { id: "cafe", label: "Cafés & sweets", color: "#af7a31", icon: "coffee" },
  { id: "nightlife", label: "Nightlife", color: "#9260da", icon: "bars" },
  { id: "culture", label: "Culture", color: "#d45198", icon: "museum" },
  { id: "outdoors", label: "Outdoors", color: "#36a558", icon: "outdoors" },
  { id: "shopping", label: "Shopping", color: "#3986e4", icon: "shop" },
  { id: "stays", label: "Stays", color: "#289f9f", icon: "stays" },
  { id: "leisure", label: "Wellness & fun", color: "#dd5559", icon: "spa" },
  { id: "transport", label: "Getting around", color: "#697d92", icon: "transit" },
  { id: "other", label: "Other", color: "#82868e", icon: "other" },
] as const satisfies ReadonlyArray<{ id: string; label: string; color: string; icon: CategoryId }>;
export type GroupId = (typeof groups)[number]["id"];
export type Group = (typeof groups)[number];

export interface Category {
  id: CategoryId;
  label: string;
  group: GroupId;
  color: string;
  refines: boolean;
  match: RegExp | null;
  poi: string[];
}

type CategoryRow = [id: CategoryId, label: string, match: RegExp | null, poi?: string[], refines?: boolean];
const rows: Record<GroupId, CategoryRow[]> = {
  food: [
    ["ramen", "Ramen & noodles", /ramen|ラーメン|noodle|soba|udon|tsukemen|\bpho\b|laksa|la ?mian|\bmian\b|\bmee\b|kway teow|ramyun|kalguksu|myeon(?!g)|らーめん|ラーメン|うどん|そば/i],
    ["sushi", "Sushi", /sushi|zushi|寿司|鮨|omakase|sashimi/i],
    ["pizza", "Pizza", /pizz/i],
    ["burger", "Burgers & fast food", /burger|fast food|sandwich|hot ?dog/i, ["fast_food"]],
    ["tacos", "Tacos", /taco|taquer|mexican|burrito/i],
    ["grill", "Grill & BBQ", /yakitori|yakiniku|bbq|barbecue|steak|grill|kushiyaki|churrasc|asado|kebab|robata|roast (meat|duck)|peking duck|焼鳥|焼肉/i],
    ["seafood", "Seafood", /seafood|oyster|crab|lobster|unagi|\beel\b|fish restaurant|fish head|mariscos|poke\b/i],
    ["market", "Markets", /market(?! st(reet)?\b)|hawker|food hall|food court|grocery|supermarket|mercado|marché|depachika/i, ["food_court", "marketplace", "supermarket", "deli"]],
    ["food", "Food", /restaurant|food|kitchen(?! ?(supply|ware|store))|eatery|bistro|brasserie|trattoria|osteria|dining|\bdiner\b|\bdeli\b|cuisine|canteen|caterer|cha chaan teng|curry|dumpling|dim sum|gyoza|tempura|tonkatsu|okonomiyaki|izakaya|kappo|shabu|teishoku|yokocho|eating house|sikdang|食堂|chicken|tofu|idli|dosa|porridge|claypot|bento|onigiri|xiao ?long ?bao|bak kut teh/i, ["restaurant"], true],
  ],
  cafe: [
    ["bakery", "Bakeries", /baker|boulanger|pastry|p[aâ]tisserie|pasticceria|bagel|croissant|bread|\btarts?\b|パティスリー/i, ["bakery"]],
    ["dessert", "Desserts", /dessert|ice cream|gelat|cake|confection|sweets|wagashi|donut|doughnut|pancake|crêpe|crepe|chocolat|parfait|kakigori|かき氷|bingsu|beancurd/i, ["ice_cream", "confectionery", "chocolate"]],
    ["tea", "Tea", /\btea\b|teahouse|matcha|boba|tearoom/i, ["tea"]],
    ["coffee", "Cafés", /coffee|café|cafe|espresso|roaster|kissaten/i, ["cafe", "coffee"], true],
  ],
  nightlife: [
    ["wine", "Wine", /wine|vino|enoteca/i, ["wine"]],
    ["beer", "Beer & pubs", /\bbeers?\b|brew|\bpub\b|gastropub|taproom|biergarten|ale house/i, ["pub", "biergarten", "beer"]],
    ["music", "Live music", /jazz|blues|live music|live house|concert|music (venue|bar|club|hall)|nightclub|night club|dance club|disco|karaoke/i, ["nightclub"], true],
    ["bars", "Bars", /\bbars?\b|cocktail|drinking|lounge|speakeasy|tavern|\bsake\b|whisk(e)?y|nightlife/i, ["bar"], true],
  ],
  culture: [
    ["museum", "Museums", /museum|museo|museu|musée|planetarium|science cent/i, ["museum"]],
    ["gallery", "Galleries", /galler|art space|art cent(er|re)|kunsthalle/i, ["gallery", "arts_centre"]],
    ["temple", "Temples", /temple|buddhist|pagoda|monaster|stupa|\bwat\b/i],
    ["shrine", "Shrines", /shrine|jinja|jingu|\btaisha\b|shinto/i],
    ["church", "Churches", /church|cathedral|chapel|basilica|abbey/i],
    ["mosque", "Mosques", /mosque|masjid/i],
    ["castle", "Castles & palaces", /castle|palace|fortress|citadel|château|alcázar/i, ["castle"]],
    ["cinema", "Cinemas", /cin[eé]ma|movie|film|imax/i, ["cinema"]],
    ["theater", "Theaters", /theat(er|re)|playhouse|opera|kabuki|ballet|performing arts/i, ["theatre"]],
    ["library", "Libraries", /librar|biblioth/i, ["library"]],
    ["culture", "Sights", /landmark|attraction|monument|memorial|historic|heritage|tower|ruins|statue|sightseeing|tourist|^(sculpture|bridge|plaza|neighbo(u)?rhood)$/i, ["attraction", "monument", "ruins"], true],
  ],
  outdoors: [
    ["camping", "Camping", /campground|campsite|camping|glamping/i, ["campsite", "camp_site", "caravan_site"]],
    ["garden", "Gardens", /garden|botanic|arboretum|horticult/i, ["garden"]],
    ["beach", "Beaches", /beach|seaside|surf/i, ["beach"]],
    ["viewpoint", "Viewpoints", /viewpoint|view point|vista point|scenic|lookout|observation|overlook|panoram/i, ["viewpoint"]],
    ["nature", "Nature", /mountain|hik(e|ing)|trail|waterfall|\blake\b|\bbay\b|island|forest|national park|nature|volcano|gorge|canyon|valley|cave|ropeway|cable car|summit/i, ["nature_reserve"]],
    ["outdoors", "Parks", /(?<!theme |amusement |water |car |rv |trailer )\bpark\b|playground|promenade|waterfront/i, ["park"], true],
  ],
  shopping: [
    ["records", "Records", /record|vinyl|disk union|music store|\bcds?\b/i, ["music"]],
    ["books", "Books", /\bbooks?\b|bookstore|bookshop|manga|comic/i, ["books"]],
    ["fashion", "Fashion", /cloth|fashion|boutique|apparel|vintage|thrift|shoe|sneaker|jewel|kimono|tailor|alteration|denim|swimwear|leather|sunglass|eyewear|watches|horolog/i, ["clothing_store", "clothes", "boutique", "shoes", "jewelry", "bag"]],
    ["shop", "Shops", /\bshop|store|mall|department|outlet|shopping|souvenir|gift|craft|antique|homeware|furniture|stationer|florist|supplier/i, ["mall", "department_store", "gift"], true],
  ],
  stays: [
    ["stays", "Hotels", /hotel|hostel|\binn\b|ryokan|resort|lodge|motel|airbnb|guest ?house|b&b|bed and breakfast|capsule|minshuku|\bstay\b|ホテル|旅館|旅馆/i, ["lodging", "hotel", "hostel", "guest_house", "motel", "bed_and_breakfast"], true],
  ],
  leisure: [
    ["spa", "Spas & baths", /\bspa\b|onsen|hot spring|sento|sauna|bath ?house|public bath|massage|hammam|thermal/i, ["spa", "sauna", "public_bath"]],
    ["fitness", "Fitness", /\bgym\b|fitness|athletic|yoga|pilates|climbing|bouldering|crossfit|dojo/i, ["fitness_centre"]],
    ["amusement", "Theme parks & zoos", /theme park|amusement|\bzoo\b|aquarium|arcade|game cent(er|re)|ferris|water park|escape room/i, ["zoo", "aquarium", "theme_park", "water_park"]],
    ["sports", "Sports", /stadium|arena|sport|golf|tennis|\bski(s|ing)?\b|skate|bowling|swim|ballpark|baseball|basketball|soccer|football/i, ["stadium", "sports_centre", "golf"]],
  ],
  transport: [
    ["airport", "Airports", /airport|airfield/i, ["airport", "aerodrome"]],
    ["ferry", "Ferries & ports", /ferry|\bpier\b|\bport\b|harbou?r|marina|cruise|boat tour|yakatabune/i, ["ferry_terminal", "harbor"]],
    ["transit", "Stations", /station|train|subway|metro|railway|\btram\b|bus terminal|transit/i, ["rail", "station", "halt", "bus_station"], true],
  ],
  other: [
    ["health", "Health", /hospital|clinic|pharmac|drugstore|doctor|dentist|dental|medical|optician|optometr/i, ["hospital"]],
    ["other", "Other", null, [], true],
  ],
};

export const categories: Category[] = groups.flatMap(group => rows[group.id].map(([id, label, match, poi = [], refines = false]) => ({ id, label, group: group.id, color: group.color, refines, match, poi })));

const byId = new Map(categories.map(category => [category.id, category]));
const groupById = new Map<GroupId, Group>(groups.map(group => [group.id, group]));

export function categoryFor(id: CategoryId): Category {
  return byId.get(id) ?? byId.get("other")!;
}

const legacyFilters: Partial<Record<CategoryId, { group: GroupId; except: CategoryId[] }>> = {
  food: { group: "food", except: ["ramen", "sushi"] },
  coffee: { group: "cafe", except: [] },
  bars: { group: "nightlife", except: ["music"] },
  culture: { group: "culture", except: [] },
  outdoors: { group: "outdoors", except: [] },
  stays: { group: "stays", except: [] },
  other: { group: "other", except: [] },
};

export function includesCategory(filter: CategoryId, id: CategoryId): boolean {
  const legacy = legacyFilters[filter];
  return id === filter || (legacy !== undefined && categoryFor(id).group === legacy.group && !legacy.except.includes(id));
}

export function groupOf(id: CategoryId): Group {
  return groupById.get(categoryFor(id).group) ?? groups[groups.length - 1];
}

const venueKinds: Array<[RegExp, GroupId[]]> = [
  [/(restaurant|diner|eatery|steakhouse|bistro|brasserie|stall|canteen|food court|caterer)$/i, ["food", "cafe"]],
  [/(shop|store|boutique|supplier|market|mall|outlet)$/i, ["food", "cafe", "nightlife", "shopping"]],
  [/(bar|pub|club|lounge|taproom)$/i, ["nightlife", "food", "cafe"]],
];
const venueGroups: GroupId[] = ["food", "cafe", "nightlife", "stays", "shopping", "leisure", "other"];
const inVenueGroup = (category: Category) => venueGroups.includes(category.group);
const byNameOrder = [
  ...categories.filter(category => inVenueGroup(category) && !category.refines),
  ...categories.filter(category => inVenueGroup(category) && category.refines),
  ...categories.filter(category => !inVenueGroup(category)),
];
const specificFirst = [...categories.filter(category => !category.refines), ...categories.filter(category => category.refines)];

function matchType(type: string): Category | undefined {
  const kindGroups = venueKinds.find(([kind]) => kind.test(type.trim()))?.[1] ?? [];
  const rank = (category: Category) => (category.refines ? 1 + kindGroups.indexOf(category.group) : 0);
  const forKind = specificFirst.filter(category => kindGroups.includes(category.group)).sort((a, b) => rank(a) - rank(b));
  return [...forKind, ...specificFirst].find(category => category.match?.test(type));
}

function narrowByName(hit: Category, name: string): CategoryId {
  const siblings = categories.filter(category => category.group === hit.group);
  return siblings.slice(0, siblings.indexOf(hit)).find(category => category.id !== "market" && category.match?.test(name))?.id ?? hit.id;
}

export function resolveCategory(place: { category: CategoryId; placeType: string | null; name: string }): CategoryId {
  const stored = categoryFor(place.category);
  if (!stored.refines) return stored.id;
  const fromType = place.placeType ? matchType(place.placeType) : undefined;
  if (fromType) return fromType.refines ? narrowByName(fromType, place.name) : fromType.id;
  return byNameOrder.find(category => category.match?.test(place.name))?.id ?? stored.id;
}
