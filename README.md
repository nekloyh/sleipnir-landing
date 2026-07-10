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
badges, the field-note cards carry a "Placeholder" tag, and the contact form
states it does not store or send submissions.

## Assets

The six robot renders (`public/robots/*.png`) are the product's own transparent
hero images. No third-party media is bundled.

## Sections

Loader · hero (robot + live telemetry) · thesis · Ocean Park stat band · product
anatomy (interactive hotspots) · five-step flow · fleet roster · coverage map ·
field notes · book-a-pilot contact · footer — plus a specification drawer and a
placeholder privacy page.
