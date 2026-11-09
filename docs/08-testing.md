# 08 — Testing

Tests are how the parameter ranges get established **[Decided]**. The core is pure, so most behavior is testable without a browser. Tool: **Vitest**.

## What we test and what we do not

| Test | Do not test |
|------|-------------|
| RNG, geometry, validation, generation, game rules, hit testing, data files, release output | Canvas pixels, fonts, exact colors (check by eye) |

## 1. RNG

- Same seed → same sequence; different seeds → different sequences.
- Named streams (`pick`, `place`, `decoys`) are independent: consuming one does not change another.
- Seed string hashing is stable (a few fixed seeds with known first values act as a regression guard).

## 2. Constellation validation and normalization

- Every error and warning case in 03 has a test (duplicate ids, unknown edge endpoint, self-edge, duplicate edge in either order, size out of range, too few stars, unknown extra fields ignored).
- Normalization: centroid ends at the origin; canonical pairwise distances are unchanged.
- **Every shipped file in `public/constellations/` validates**, including the three AI starters.
- The AI-generated policy is enforced: anything with `aiGenerated: true` has an `ai-` id and `(AI Generated)` in its name.

## 3. Generation invariants (property-style sweep)

For many seeds (start with 1,000), across a grid of viewports and configs, assert every invariant in 05:

- deterministic output; unique ids
- all stars inside the sky minus edge margin; none in applicable exclusion zones
- decoy–decoy and decoy–member spacing at or above the effective minimums
- placed members are a **similarity transform** of canonical: distance ratios preserved, and orientation preserved (the signed area/cross product has the same sign: no reflection)
- member count and edges equal the authored data
- final scale multiplier within `[scaleFloor, scaleMax]`

Plus targeted cases:

- Impossible config (huge `scaleMin` on a tiny sky) throws the typed placement error and never returns a broken sky.
- Density above feasibility produces a shortfall report and a warning, not a hang. (Verify the attempt cap terminates.)
- Changing `sky.density` does not move the constellation for the same seed (stream independence).
- `constellation.randomRotation = false` yields rotation 0.

## 4. Game rules

- The two-tap table in 02, row by row: select, commit, move selection, clear selection, no-op on committed, no-op when nothing selected and empty tap.
- Moves counts commits only; selecting and re-tapping committed stars never changes it.
- Member commit → found; decoy commit → ruled out.
- An edge becomes visible only when both endpoints are found; two found stars with no authored edge never show a line.
- Game ends exactly when the last member is found; par equals the member count; further input is ignored.
- A perfect run (commit each member once) gives moves = par.

## 5. Hit testing

- Nearest star within `max(hitRadiusPx, drawnRadiusPx)` wins; ties break by lower id.
- A tap outside every radius is "empty".
- A committed star is hit but yields a no-op intent.
- At each calibration viewport, with defaults, the effective spacing between any two stars is at least `hitRadiusPx`.

## 6. Purity guard

A test reads the sources under `src/core/` and fails if they reference `document`, `window`, `fetch`, `Math.random`, `Date.now` or `new Date`. This keeps the core testable.

## 7. Calibration sweep **[Decided]**

A runnable test (or script) that sweeps config space and **prints the table that goes into 04 "Calibration results"**:

- Viewports: 390×844, 600×800, 1280×800.
- `sky.widthUnits`: 100, 150, 200, 300, 400.
- `sky.density`: 0.5, 1, 2, 3, 4, 6.
- `decoys.minDistanceUnits`: 4, 6, 8, 10, 12.
- Constellation scale ranges: the default plus a narrower and a wider one.
- 200 seeds per cell. Record: placement success rate, shrink rate, decoy fill ratio (actual ÷ target), minimum star spacing in px, count of warnings.

Acceptance targets: 100% placement success, fill ratio ≥ 0.95, minimum spacing ≥ `input.hitRadiusPx`. Cells that fail define the edge of the valid range. The agent updates the defaults in 04 only if the sweep shows the starting values are bad, and records the change in 10.

## 8. Release checks

- `build:release` output contains no AI-generated constellation entries and a rewritten manifest.
- `check:release` scans `dist/` for `"aiGenerated": true` and `(AI Generated)` and fails if found.
- With an empty pool the app shows the friendly "no constellations available" message.

## 9. Manual playtest checklist

- Phone (portrait) and desktop: the first tap selects, the second commits; tapping empty sky clears.
- Stars are comfortably tappable at the default `sky.widthUnits`; try `?w=300` and `?w=400` to feel the limits.
- Found vs idle vs ruled-out are distinguishable at a glance.
- The card is readable and never overlaps stars.
- Rotating the device or resizing the window does not break the game.
- The same `?seed=` gives the same sky on reload.
- Try each starter several times: is the constellation findable but not trivial? Note any accidental look-alike patterns (09).
