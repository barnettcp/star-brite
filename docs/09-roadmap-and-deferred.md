# 09 — Roadmap and deferred features

v1 is a single constellation, a two-tap loop, and a procedurally generated sky. Everything here is **designed for but not built**: leave a seam, then stop.

## Deferred features **[Deferred]**

| Feature | What it means | Seam already in v1 |
|---------|---------------|--------------------|
| **Horizon** | A black silhouette along the bottom of the sky. Constellation stars must never sit behind it; decoys may. | Exclusion zones with `appliesTo: constellation` (05); a drawing function can be added in `ui/`. |
| **Multiple constellations per sky** | Several targets in a larger or denser sky. | `targets` is a list; placement loops over it (05); par is a sum over targets. |
| **Card deck + timer** | Ticket-to-Ride-style: draw cards (constellations), find them within a time limit. | Game state holds a list of targets and which are found; `renderCard` is box-based (06). A draw pile and a clock wrap around it. |
| **Shared stars** | One star belongs to several constellations. | Opaque sky-level ids; local ids in data; plan is a sky-level star table that constellations reference (03). |
| **Sound** | Chimes for found/ruled-out, ambience. | Core intents return outcomes; a sound hook subscribes there. |
| **Visual polish** | Twinkle, glow, halos on found stars, pulse on selection, nicer fonts. | Animation-capable render loop; theme object. |
| **Constellation picture reveal** | Show a drawn image of the thing once found. | Unknown JSON fields are ignored; a future `image` field is reserved by convention. |
| **Name label in the sky** | Show the name near the constellation when found. | Placement stores the center and scale. |
| **In-browser editor** | Click to place stars, click pairs for edges, export JSON. | Same schema and validator. |
| **Seed sharing** | "Try this seed" links across devices. | `?seed=` already works; a fixed-aspect mode would be needed because height follows aspect (04). |
| **Best scores** | Per-device best moves. | `localStorage`, no back-end. |
| **Accessibility** | Keyboard play, high-contrast theme, reduced motion. | Core intents are input-agnostic; theme object. |
| **Ambiguity checker** | Detect decoys accidentally forming the pattern and re-roll. | Generator is pure and seeded; a check can wrap it. |
| **Leaderboards, accounts** | Server features. | Intentionally none; would be the first back-end work. |
| **Theme variants** | A light, colorful, playful look. | Theme object. |

## Non-goals

- **Pan and zoom.** The player always sees and can tap everything (04).
- **A realistic or fixed star catalog.** Skies change every game.
- **Mirrored constellations.** Scale and rotation only.

## Suggested build order (learning-friendly)

Each step ends with something you can see and play with.

1. **Scaffold.** Vite + TypeScript + Vitest. A full-screen navy canvas that handles pixel ratio and resize.
2. **A sky.** Seeded RNG; scatter decoys with a minimum distance; draw them as circles of varying size. Play with `?w=` and `?d=`.
3. **One constellation.** Load JSON, validate, place it with random rotation and scale; draw the card.
4. **Tapping.** Pointer events, hit testing, select ring, commit, colors.
5. **Discovery.** Edges appear when both ends are found; score and par; game-over overlay; New sky.
6. **Tuning.** Run the calibration sweep and fill in the table in 04.
7. **Your own constellation.** Draw one on graph paper, write the JSON, add it to the manifest.
8. **Release hygiene.** Exclude AI-generated files from release builds; deploy the static `dist/`.

After that, pick from the deferred list. The horizon, name labels, and a few polish items (glow, selection pulse) are good small wins; decks and timers are the first big feature.

## Open questions to revisit after first playtests

- Is the default `sky.widthUnits` right on phones and on desktop? Should the knob key off the shorter side instead of the width?
- Are 4–7 stars the right range, or is the Zigzag-style 4-star pattern too easy among 100+ decoys?
- Does size as a matching cue help or frustrate?
- Does the card feel right at the top-right on small phones?
