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
- `scripts/build-home.mjs`: prerendered first section, accessible hotspot buttons, client data.
- `scripts/build-pages.mjs`: destination pages, collection, guide, history, credits, sitemap and robots.
- `dist/app.js`: native-scroll camera, lazy map loading, search, filters, section jumps, shareable positions and accessible dialogs.
- `dist/styles.css`, `dist/editorial.css`: responsive presentation, local fonts, reduced-motion support.
- `data/artwork/`: original generated PNGs and prompt record. Optimized transparent WebP assets are in `dist/assets/`.

## Updating the atlas

Edit the structured content and rerun the build. Preserve stable place IDs so shared links continue to resolve. Update official sources, review dates, and photographic attribution together. Never promote a dated repair notice into a live closure indicator.

The first fetch script obtains small OSM API extracts, combines Lake Michigan shoreline relation members, and preserves path geometry. `fetch-geo.py` requires network access. The script reconnects shoreline relation members into a continuous chain. The committed processed geometry supports ordinary offline builds.

Photography scripts are acquisition tools, not unattended content feeds. Search candidates must be reviewed for the actual subject and license before publication. `refine-photos.py` downloads the exact reviewed Field Museum and 63rd Street pavilion files.

## Art direction and geography

The map layers use a shared latitude/longitude projection. North-south scale is intentionally stretched, while landmark vignettes are enlarged. This is an illustrated atlas, not turn-by-turn navigation or a survey. Official Park District maps and on-site signs take precedence. The public credits page explains the simplification.

New art should use a high aerial viewpoint, fine ink, muted watercolor, sage/olive vegetation, warm limestone, terracotta details, and soft shadows toward the lower right. Generate isolated objects with transparent backgrounds; do not ask an image model to invent an accurate map. Place each illustration over sourced geography, preserve the shared coordinates and neighboring tile boundaries, and inspect desktop/mobile alignment. Keep native geographic features visible and avoid using generic architecture for named landmarks.

## Verification

`npm run check` verifies local links, metadata, coordinate ranges, image credits and section continuity. Browser checks cover desktop/mobile rendering, search-to-card flows, close-and-return behavior, category filtering, section jumps, shareable URLs, reduced motion, keyboard access, and the southern endpoint. Browser checks require the installed `agent-browser` CLI and a local preview server; `scripts/browser-check.mjs` records results.

The site has no analytics, accounts, user database, or live conditions service. New Sites are private by default. Canonical URLs use the requested future domain `lakefronttrail.org`; custom-domain connection is separate from this implementation.
