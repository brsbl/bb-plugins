# Saved Places

Your saved places on a map that gets clearer as you zoom. Browse lists, build your own, leave notes, see what's within a 5/10/15-minute walk, plan a route, and hand the current map view to an agent with **Ask agent**.

It ships with a small sample of public places in Tokyo. Import your own Google Maps lists or any CSV to make it yours.

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
- **Custom lists.** Build a list from one or more lists, the current filter, or what's in view.
- **Notes.** A short note on any place; notes show on rows, pins, and clusters.
- **Walking reach.** 5/10/15-minute walking rings around a place, with everything outside dimmed.
- **Routes.** Add stops, pick walk, bike, or drive, find the quickest order, and open it in Google Maps.
- **Ask agent.** Starts a new thread with a snapshot of the current map view (camera, filters, places in view, notes) attached as a mention.

Agents can read the same data with `bb saved-places list|collections|lists|notes --json`.

## Use your own places

Custom lists and notes live in bb's plugin storage. Places come from `data/saved-places.json`, which is gitignored; the first build copies `data/sample.json` there.

1. Export your lists from [Google Takeout](https://takeout.google.com) by selecting **Saved** (lists as CSV) and **Maps (your places)** (starred places as `Saved Places.json`).
2. Import them, one list per file:

   ```bash
   npm run import --workspace=bb-plugin-saved-places -- --geocode \
     ~/Downloads/Takeout/Saved/*.csv \
     "~/Downloads/Takeout/Maps (your places)/Saved Places.json"
   ```

3. Install from source (see [Develop](#develop)).

Takeout list CSVs contain names and links but no coordinates, so `--geocode` looks them up with [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/api/Search/) at one request per second and caches the results in `data/.geocode-cache.json`. Places it can't find are skipped and listed.

Any CSV with `name`, `latitude`, and `longitude` columns also works, with optional `address`, `url`, `list`, `category`, and `type` columns. A `list` column splits one file into several lists. GeoJSON files of Point features work too.

Each place is assigned a category from its name and type. To change the categories, edit `categories.ts` (ids, labels, colors), `category-icons.ts` (map icons), and the matching `CATEGORY_RULES` in `scripts/import.mjs`, then re-import. Lists titled "Favorite places", "Want to go", or "Starred places" are grouped as saved by Google; see `groupFor` in `model.ts`.

## Map services

The map uses free, keyless services. Check their usage policies before heavy use.

| Service | Used for | Change it in |
| --- | --- | --- |
| [OpenFreeMap](https://openfreemap.org) | Basemap tiles | `basemap.ts` |
| [Valhalla](https://valhalla1.openstreetmap.de) public server (FOSSGIS) | Walking rings, travel times, routes | `ENDPOINT` in `routing.ts` |

Point `ENDPOINT` at your own [Valhalla](https://github.com/valhalla/valhalla) instance for heavier routing. Map data © OpenStreetMap contributors.

## Develop

From the monorepo root:

```bash
npm ci
npm run check --workspace=bb-plugin-saved-places
bb plugin install "path:$PWD/plugins/saved-places" --yes
```
