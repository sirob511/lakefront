# Lakefront Trail

An original, continuous illustrated atlas of Chicago’s lakefront. The map is the homepage; the attraction collection and individual place pages support the journey.

## Run and build

Requires Node 20+ and Python 3. Rendering changed map drawings also requires the `agent-browser` CLI with its Chromium browser installed. Unchanged map tiles are reused from the source-hash cache. The browser site has no framework dependencies.

```sh
npm run build
npm run check
npm run dev
```

Preview: http://127.0.0.1:4179. Static deploy output: `dist/`. `vercel.json` supports a Vercel static deployment. The Sites deployment identity is in `.openai/hosting.json`.

## Structure

- `data/geography.json`: OpenStreetMap geometry, retrieved November 18, 2026; source URLs and original way IDs retained. Raw download cache is excluded from Git.
- `data/places.json`: 185 source-audited places and 14 extended destination stories. Minor destinations remain substantive entries in the collection rather than thin standalone pages.
- `data/photos.json`: 151 subject-reviewed photographs with creator attribution, photo licenses and source links; 34 discoveries currently use accurate location headers.
- `data/home-template.html`: editable homepage markup. `dist/index.html` is rebuilt from this template.
- `scripts/build-map.mjs`: shared coordinate projection, continuous geographic shapes, separate trail styles, original artwork, ten adjacent SVG sections.
- `scripts/render-map.mjs`: pre-renders the ten source SVG rows into forty WebP display tiles, with a source-hash cache.
- `scripts/build-home.mjs`: lightweight geographic placeholders, accessible coordinate anchors and versioned client assets. Two-dimensional lazy loading fetches only tiles near the viewport.
- `data/location-audit.json`: source feature IDs, point meanings, verified coordinates and per-attraction evidence. North/south and original audits retain detailed methods.
- `scripts/build-pages.mjs`: destination pages, collection, credits, sitemap and robots.
- `scripts/site-chrome.mjs`: shared header, compact footer and search-dialog markup for every page.
- `dist/site.js`: shared discovery search, keyboard shortcuts and mobile navigation.
- `dist/app.js`: native-scroll camera, lazy map loading, filters, section jumps, shareable positions and accessible dialogs.
- `dist/styles.css`, `dist/editorial.css`: responsive presentation, local fonts, reduced-motion support.
- `data/artwork/`: original generated PNGs and prompt record. Optimized transparent WebP assets are in `dist/assets/`.

## Updating the atlas

Edit the structured content and rerun the build. Preserve stable place IDs so shared links continue to resolve. Update official sources, review dates, and photographic attribution together. Never promote a dated repair notice into a live closure indicator.

The first fetch script obtains small OSM API extracts, combines Lake Michigan shoreline relation members, and preserves path geometry. `fetch-geo.py` requires network access. The script reconnects shoreline relation members into a continuous chain. The committed processed geometry supports ordinary offline builds.

Photography scripts are acquisition tools, not unattended content feeds. Search candidates must be reviewed for the actual subject and license before publication. `data/reviewed-photos.json` specifies exact reviewed Commons files and individually reviewed Flickr sources; both acquisition scripts use this manifest. `data/photo-audit.json` records subject and license review for every place. Missing photographs use a location header, never a generic landmark image. `data/photo-gaps.json` keeps the outstanding acquisition list; `data/discoveries-audit-round2.json` records inventory coverage and deliberate exclusions. Context images carry visible captions, portrait subjects retain their full framing, and photos load on demand.

## Art direction and geography

The map layers use a shared latitude/longitude projection. The east–west map scale is expanded to expose city context, while small landmark vignettes use their actual building anchors, separately from beach-area pins where needed. `scripts/map-coordinates.mjs` is the common projection used by map artwork and interactive markers. This is an illustrated atlas, not turn-by-turn navigation or a survey. Official Park District maps and on-site signs take precedence. The public credits page explains the simplification.

The November 18 geography revision was visually checked against five north-up Cook County GIS aerial panels and five USGS/USDA NAIP panels. `data/aerial-reference-audit.json` records sources, geographic bounds, acquisition-date limitations and regional findings. These are references, not shipped basemaps. Real building footprints, local roads, sports areas, paved grounds, railway corridors and mapped trees remain visible. Only mapped wood/scrub polygons receive dense canopy; generic forest and marina stamps are removed. `data/map-render-audit.json` records the resulting layer counts, landmark anchors and offshore lake-label positions.

Label placement runs on layout, zoom or filter changes; the scroll loop does not measure or reposition each label. Small discoveries keep exact geographic anchors and reveal their labels on hover/focus when nearby labels need space. Zoom controls, art/culture filters and search support dense areas. Asset and data URLs are versioned so published HTML cannot reuse an incompatible older script.

New art should use a high aerial viewpoint, fine ink, muted watercolor, sage/olive vegetation, warm limestone, terracotta details, and soft shadows toward the lower right. Generate isolated objects with transparent backgrounds; do not ask an image model to invent an accurate map. Place each illustration over sourced geography, preserve the shared coordinates and neighboring tile boundaries, and inspect desktop/mobile alignment. Keep native geographic features visible and avoid using generic architecture for named landmarks.

## Verification

`npm run check` verifies local links, metadata, coordinate ranges, image credits, section continuity, actual river/harbor water probes, missing-beach regressions, offshore lake labels and shared marker projection. Browser checks cover desktop/mobile rendering, search-to-card flows, close-and-return behavior, category filtering, section jumps, shareable URLs, reduced motion, keyboard access, and the southern endpoint. Browser checks require the installed `agent-browser` CLI and a local preview server; `scripts/browser-check.mjs` records results. `scripts/check-site-chrome.mjs` verifies the shared header, footer and search across map, list, attraction and credits pages at four viewport sizes.

The site has no analytics, accounts, user database, or live conditions service. New Sites are private by default. Canonical URLs use the requested future domain `lakefronttrail.org`; custom-domain connection is separate from this implementation.

The revised photo-based South Shore and 63rd Street illustrations are saved in `data/artwork/*-v2.png`, with optimized copies in `dist/assets/*-v2.webp`. `data/artwork/revision-prompts.json` retains the exact built-in image-generation prompts, reference photographs, creator credits and derivative licenses.

The discovery audit expanded the collection from 120 to 169 stops. The second photo review brings verified coverage to 144 photographs, with 25 explicit gaps; see `data/photo-integration-audit.json` and `data/photo-gaps.json`.

Map controls support two-axis mouse and single-finger dragging; native pinch zoom remains available. Every discovery uses the same unnumbered dot. Place details are nonmodal, with a compact mobile sheet and a visible selected pin; the compact shared footer sits below the map. Opening and closing a card preserves the camera, and zoom preserves the geographic center after manual panning.

Both detailed trail lines and the overview derive from connected OSM route relations, including the Navy Pier Flyover. `data/trail-routes.json` is a reproducible extract from the cached geography download, `scripts/trail-geometry.mjs` builds the shared geometry, and `data/trail-render-audit.json` records source IDs and connectivity. The overview preserves geographic aspect and uses latitude-based position samples. The former inaccurate Navy Pier vignette is suppressed in favor of its actual mapped footprint. `scripts/street-labels.mjs` adds 35 selected street names along their source road centerlines in the atlas palette.

`npm run check` also validates trail connectivity, flyover rendering and overview interpolation. `scripts/check-map-interactions.mjs` verifies mouse dragging, compact nonmodal details, consistent dots and unobstructed endpoints across three viewport sizes; native Chromium touch verification is recorded in `data/touch-verification.json`.

The main navigation focuses on the map and attractions. The former Trail guide and History pages are retired and removed from build output and the sitemap. The opening card shows the official 18-mile bicycle and 18.5-mile walking distances, the live discovery count.

The final audit expanded the inventory to 185 discoveries, with 151 verified photos and 34 documented photo gaps. `data/discoveries-audit-round3.json`, `data/location-audit-round3.json`, and `data/location-audit-round3-additions.json` retain independent feature evidence; `data/photo-audit-round3.json` records the complete photo review. Photos preserve their full composition in every responsive frame. Nearby overlapping hit targets resolve to the closest geographic dot without shifting the markers; `scripts/check-hotspots.mjs` verifies each discovery at three viewport sizes.
