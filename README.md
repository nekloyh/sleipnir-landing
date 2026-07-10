# Sleipnir — Landing

React/Vite marketing site for **Sleipnir**, the autonomous last-mile delivery
service for gated communities (the product built in `../C2-App-154`). The layout
scaffold started as a landing clone, but the content, brand system and UI have
been rebuilt around Sleipnir's own identity — *"the courier that never
stumbles."*

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Design system

- **Palette** — the product's palette-v3 (`docs/palette-color.md` in C2-App-154):
  botanical greens (`--pine` → `--green`) carrying a calm field, with **one**
  rationed bright (`--lime #CBF96E`) reserved for "live" signals only.
- **Type** — Space Grotesk (display) · Inter (body) · Space Mono (telemetry /
  coordinate labels), for a wayfinding + precision-instrument feel.
- **Signature** — the *gait track*: a thin route line with a live lime node that
  threads the page, echoing the product thesis.

## Content sourcing

Facts are drawn from the Sleipnir docs (`PROJECT_OVERVIEW.md`, `fleet.json`,
`DESIGN_LANGUAGE.md`): the Ocean Park beachhead numbers, the five-step delivery
flow, the two merchant gates, the pickup-code confirmation, and the live fleet
roster (R-01 Library Runner, R-02 Vincom Scout, R-03 VinUni Courier).

Anything **not yet verified against hardware** is shown as an explicit
placeholder — the chassis specs in the specification drawer render as `TBD`
badges and the field-note cards carry a "Coming soon" tag.

## Assets

The six robot renders ship as WebP (`public/robots/*.webp`). The original PNG
masters live in `assets-src/robots/` and are **not** bundled into `dist/`.
Regenerate the derived assets from the masters with:

```bash
for f in assets-src/robots/*.png; do magick "$f" -quality 82 "public/robots/$(basename "${f%.png}").webp"; done
magick -size 1200x630 xc:"#09231B" \( assets-src/robots/robot-hero.png -resize 700x \) -gravity center -composite -quality 84 public/og.jpg
```

No third-party media is bundled.

The coverage map (`src/map-data.js`) is real geography — the boundary, lakes
and street network of Vinhomes Ocean Park 1, projected from OpenStreetMap data
(© OpenStreetMap contributors, ODbL). The route simulation runs on the actual
street graph (Dijkstra, with the detour recomputed around the blocked edge).
Regenerate with:

```bash
# fetch fresh OSM data, then rebuild src/map-data.js
curl -X POST --data-urlencode "data@assets-src/overpass.ql" https://overpass-api.de/api/interpreter -o /tmp/osm.json
node assets-src/build-map.mjs   # reads osm.json (adjust the path inside if needed)
```

## Sections

Loader · hero (robot + live telemetry) · thesis · Ocean Park stat band · product
anatomy (interactive hotspots) · five-step flow · fleet roster · coverage map
with a scroll-scrubbed route simulation · field notes · book-a-pilot contact ·
footer — plus a specification drawer and a privacy page.
