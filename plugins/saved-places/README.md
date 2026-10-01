# Saved Places

Your saved places on a map that gets clearer as you zoom. Browse lists, build your own, leave notes, see what's within a 5/10/15-minute walk of a place or a whole list, and hand the current map view to an agent with **Ask agent**.

It ships with a small sample of public places in Tokyo. Ask an agent to import your saved Google Maps lists to make it yours.

![Saved Places library of sample Tokyo lists beside a map with category-colored pins and clusters](docs/screenshot.png)

## Install

```bash
bb plugin install git:https://github.com/brsbl/bb-plugins.git@plugin/saved-places --yes
```

Requires bb 0.43 or newer. The published build contains the sample data; install from source to use your own places.

## Use

Open Saved Places from a thread's panel menu or the sidebar.

- **Library.** Lists, custom lists, and notes, each with a cover. Search matches places, lists, and notes.
- **Lists.** Category chips, an "Only in view" filter, and a map chip with the in-view count.
- **Custom lists.** Tap + to start an empty list and fill it with Add places, or tap Select in any list (or filter it) and choose Add to list to put places into a new or existing list, with Undo. Lists can be duplicated, renamed in place, or opened together from the library.
- **Notes.** A short note on any place; notes show on rows, pins, and clusters.
- **Category fixes.** Tap the category on a place card to change it, or pick Automatic to undo. Fixes are saved with your notes, so re-importing never resets them.
- **Walking reach.** 5/10/15-minute walking rings around a place, with everything outside dimmed.
- **Walking distance.** On a list, shade a 5, 10, or 15-minute walk around each place (up to 12) to see which saves are walkable from each other.
- **Ask agent.** Starts a new thread with a snapshot of the current map view (camera, filters, places in view, notes) attached as a mention.

Agents can read the same data with `bb saved-places list|collections|lists|notes|categories --json`, and fix a category with `bb saved-places category <place> <category-id|auto>`.

## Use your own places

Custom lists and notes live in bb's plugin storage. Places come from `data/saved-places.json`, which is gitignored; the first build copies `data/sample.json` there.

1. Install from source (see [Develop](#develop)).
2. In a bb thread, ask: "Import all my saved Google Maps lists into Saved Places."
3. The agent opens Google Maps in a browser tab. Sign in to Google there and tell the agent when you're done.
4. The agent reads every non-empty saved list with its coordinates, writes `data/saved-places.json`, and rebuilds the plugin.

The import is a snapshot, not a live sync. Ask again to refresh it. Your notes, custom lists, and category fixes live in bb's plugin storage keyed by Google's place ID, so a re-import keeps them.

You can also import a file with `npm run import --workspace=bb-plugin-saved-places -- <file…>`. Any CSV with `name`, `latitude`, and `longitude` columns works, with optional `address`, `url`, `list`, `category`, and `type` columns; a `list` column splits one file into several lists. GeoJSON files of Point features work too. For rows without coordinates, `--geocode` looks them up with [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Search/) at one request per second.

Each place gets its category from its Google place type, narrowed by its name (a "Restaurant" named "Sushi Sho" is Sushi), or from its name alone when it has no type; addresses are never used. A specific `category` in your CSV, such as `museum`, overrides both. A place with no match whose name is a street address or coordinates is filed under Addresses. Your own fixes from the place card or CLI win over all of these. Categories belong to ten color groups (Food, Cafés & sweets, Nightlife, Culture, Outdoors, Shopping, Stays, Wellness & fun, Getting around, Other); a place takes its group's color and its category's icon, and the basemap's own points of interest use the same icons and colors. To add or change a category, edit its row in `categories.ts` (label, name/type pattern, and the OpenMapTiles POI classes it covers) and its icon in `category-icons.ts`. Lists without photos use a small map of their places as the cover. Lists titled "Favorites", "Want to go", or "Starred places" are grouped as saved by Google; see `groupFor` in `model.ts`.

## Map services

The map uses free, keyless services. Check their usage policies before heavy use.

| Service | Used for | Change it in |
| --- | --- | --- |
| [OpenFreeMap](https://openfreemap.org) | Vector tiles and fonts for the streets basemap and list-cover maps | `streetsStyle` in `basemap.ts` |
| [Valhalla](https://valhalla1.openstreetmap.de) public server (FOSSGIS) | Walking rings and walking distance | `ENDPOINT` in `routing.ts` |

Map data © OpenStreetMap contributors.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-saved-places
bb plugin install "path:$PWD/plugins/saved-places" --yes
```
