# Lakefront Trail

An original, continuous illustrated atlas of Chicago’s lakefront. The map is the homepage; guide, history, and place pages support the journey.

## Run and build

Requires Node 20+ and Python 3; no npm dependencies.

```sh
npm run build
npm run check
npm run dev
```

Preview: http://127.0.0.1:4179. Static deploy output: `dist/`. `vercel.json` supports a Vercel static deployment. The Sites deployment identity is in `.openai/hosting.json`.

## Structure

- `data/geography.json`: OpenStreetMap geometry, retrieved November 18, 2026; source URLs and original way IDs retained. Raw download cache is excluded from Git.
- `data/places.json`: 38 coordinate-anchored places and 14 extended destination stories. Minor destinations remain substantive entries in the collection rather than thin standalone pages.
- `data/photos.json`: licensed photographs, creator attribution, license and source links.
- `data/home-template.html`: editable homepage markup. `dist/index.html` is rebuilt from this template.
- `scripts/build-map.mjs`: shared coordinate projection, continuous geographic shapes, separate trail styles, original artwork, ten adjacent SVG sections.
- `scripts/build-home.mjs`: eager first-section image, accessible hotspot buttons, client data. Detailed SVG tiles embed their own landmark assets and render as images, keeping the larger geography out of the interactive DOM.
- `scripts/build-pages.mjs`: destination pages, collection, guide, history, credits, sitemap and robots.
- `dist/app.js`: native-scroll camera, lazy map loading, search, filters, section jumps, shareable positions and accessible dialogs.
- `dist/styles.css`, `dist/editorial.css`: responsive presentation, local fonts, reduced-motion support.
- `data/artwork/`: original generated PNGs and prompt record. Optimized transparent WebP assets are in `dist/assets/`.

## Updating the atlas

Edit the structured content and rerun the build. Preserve stable place IDs so shared links continue to resolve. Update official sources, review dates, and photographic attribution together. Never promote a dated repair notice into a live closure indicator.

The first fetch script obtains small OSM API extracts, combines Lake Michigan shoreline relation members, and preserves path geometry. `fetch-geo.py` requires network access. The script reconnects shoreline relation members into a continuous chain. The committed processed geometry supports ordinary offline builds.

Photography scripts are acquisition tools, not unattended content feeds. Search candidates must be reviewed for the actual subject and license before publication. `data/reviewed-photos.json` specifies exact reviewed Commons files; both acquisition scripts use this manifest. `data/photo-audit.json` records subject and license review for every place. Missing photographs use a location header, never a generic landmark image.

## Art direction and geography

The map layers use a shared latitude/longitude projection. The east–west map scale is expanded to expose city context, while small landmark vignettes share the same coordinate anchors as their places. `scripts/map-coordinates.mjs` is the common projection used by map artwork and interactive markers. This is an illustrated atlas, not turn-by-turn navigation or a survey. Official Park District maps and on-site signs take precedence. The public credits page explains the simplification.

The November 18 geography revision was visually checked against five north-up Cook County GIS aerial panels and five USGS/USDA NAIP panels. `data/aerial-reference-audit.json` records sources, geographic bounds, acquisition-date limitations and regional findings. These are references, not shipped basemaps. Real building footprints, local roads, sports areas, paved grounds, railway corridors and mapped trees remain visible. Only mapped wood/scrub polygons receive dense canopy; generic forest and marina stamps are removed. `data/map-render-audit.json` records the resulting layer counts, landmark anchors and offshore lake-label positions.

New art should use a high aerial viewpoint, fine ink, muted watercolor, sage/olive vegetation, warm limestone, terracotta details, and soft shadows toward the lower right. Generate isolated objects with transparent backgrounds; do not ask an image model to invent an accurate map. Place each illustration over sourced geography, preserve the shared coordinates and neighboring tile boundaries, and inspect desktop/mobile alignment. Keep native geographic features visible and avoid using generic architecture for named landmarks.

## Verification

`npm run check` verifies local links, metadata, coordinate ranges, image credits, section continuity, actual river/harbor water probes, missing-beach regressions, offshore lake labels and shared marker projection. Browser checks cover desktop/mobile rendering, search-to-card flows, close-and-return behavior, category filtering, section jumps, shareable URLs, reduced motion, keyboard access, and the southern endpoint. Browser checks require the installed `agent-browser` CLI and a local preview server; `scripts/browser-check.mjs` records results.

The site has no analytics, accounts, user database, or live conditions service. New Sites are private by default. Canonical URLs use the requested future domain `lakefronttrail.org`; custom-domain connection is separate from this implementation.

The revised photo-based South Shore and 63rd Street illustrations are saved in `data/artwork/*-v2.png`, with optimized copies in `dist/assets/*-v2.webp`. `data/artwork/revision-prompts.json` retains the exact built-in image-generation prompts, reference photographs, creator credits and derivative licenses.
