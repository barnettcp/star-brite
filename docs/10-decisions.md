# 10 — Decisions log

A running record. **Decided** = made by the project owner. **Default** = recommended starting point, change freely. **Open** = needs a call, or a first playtest. New decisions are appended; superseded ones are marked, not deleted.

## Decided by the project owner

| # | Topic | Decision |
|---|-------|----------|
| D1 | Name | Repository `starbrite`; playful, light, colorful direction later. |
| D2 | Language | TypeScript. Plain Canvas 2D, Vite, no framework or engine. |
| D3 | Platform | In-browser, mobile or desktop, static hosting on the owner's site; no back-end. |
| D4 | v1 scope | A single constellation of roughly 4–7 stars, simple build, with flexibility preserved for the future. |
| D5 | Reference image | Card shows stars only, always in the same orientation, proportionally correct distances and star sizes. Sky copy is placed at random rotation and a random scale within bounds. |
| D6 | Transforms | Rotation and uniform scale only. **No mirroring.** |
| D7 | Star sizes | Stars vary in size, including within constellations. Constellation stars carry their own size in the data. |
| D8 | Decoys | Minimum spacing is mandatory and a tunable parameter. |
| D9 | Procedural | Skies are procedural and seeded. Realism is not a goal. |
| D10 | Scoring | Score = number of commits, lower is better. Par = number of member stars. |
| D11 | Two-tap | Tap selects (free); tap the same star again commits. Different star moves the selection; empty sky clears it; only commits count. Re-tapping a committed star is a no-op with no penalty. |
| D12 | Edges | Edges are authored explicitly; a line appears only when both endpoints are found. |
| D13 | Feedback | Color only in v1. Sound is for later. |
| D14 | Colors | Navy background, white-yellow idle stars, vivid yellow when found, slightly grayed when ruled out, faint lines. |
| D15 | HUD | Score top-left in a large font. |
| D16 | Game over | When all constellations are found. |
| D17 | Scale model | World units; a single knob decides how much world fits on screen; smaller scale shows more, smaller stars. No pan or zoom. |
| D18 | Horizon | **Deferred.** Documented as a future feature (09). |
| D19 | Starter data | Three AI-generated starter constellations, clearly named so they are never public. |
| D20 | Tests | Tests establish the valid ranges of world-unit parameters (08, calibration sweep). |
| D21 | Docs vs code | Documentation first; the bootstrap file drives a one-shot build later. |

## Defaults chosen as recommendations

| # | Topic | Default |
|---|-------|---------|
| R1 | Scale knob | `sky.widthUnits` (width-based); height follows aspect. Alternative: short-side. |
| R2 | Tap spacing | Hit radius in pixels (22) with a tap-spacing floor on decoy spacing, so wide skies stay playable. |
| R3 | Star radius | Depends on `size` only, not on the constellation's scale multiplier. |
| R4 | Decoy sizes | Same range as authored member sizes (1–3), uniform by default, with a skew parameter. |
| R5 | RNG streams | Separate `pick`, `place`, `decoys` streams so tuning one thing does not reshuffle another. |
| R6 | Coordinate rounding | World coordinates rounded to 3 decimals at creation for cross-engine consistency. |
| R7 | Decoy method | Dart throwing with a spatial grid. |
| R8 | Shrink-on-failure | Constellation scale shrinks by 10% steps down to a floor of 0.5, then fails loudly. |
| R9 | Exclusion zones | HUD regions are reserved at generation time as exclusion zones; the horizon later reuses the mechanism. |
| R10 | Resize | World fixed per game; renderer re-fits with a uniform scale (letterboxed); no mid-game regeneration. |
| R11 | Card placement | Top-right, `layout.cardFraction` of the shorter side, clamped to 120–180 px. |
| R12 | Score label | "Moves" with a small "par N". |
| R13 | Game-over overlay | Name, moves and par, seed, New sky button. |
| R14 | Loading | Static JSON via `manifest.json`; target chosen by seed unless `?c=`. |
| R15 | URL overrides | `?seed=`, `?c=`, `?w=`, `?d=`, `?rot=` for tuning. |
| R16 | Release exclusion | `aiGenerated` flag, `ai-` prefix, `(AI Generated)` suffix; `build:release` strips them and `check:release` verifies. |
| R17 | Render loop | `requestAnimationFrame`, redraw on dirty state only. |

## Open

| # | Question | Notes |
|---|----------|-------|
| O1 | Should the scale knob be width-based or short-side-based? | Width-based makes stars larger on wide desktop windows. Revisit after trying desktop. |
| O2 | Is "Moves" the right label? | Alternatives: "Guesses", "Taps". Theme string, trivial to change. |
| O3 | Do HUD exclusion zones matter enough to keep? | Prevents stars hiding under the card and score. Cost: slightly fewer stars in the top corners. |
| O4 | Is a 4-star pattern too easy or too hard among 100+ decoys? | Playtest. |
| O5 | Does the ambiguity checker (09) become necessary? | Depends on how often decoys accidentally form look-alikes. |
| O6 | Should `.local/` be committed? | Owner's call; docs do not depend on it. |

## Change history

- 2026-11-08: Initial decisions recorded from the design conversation.
