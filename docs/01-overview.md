# 01 — Overview

## Pitch

A quiet, tactile puzzle game. You are given a small card showing a handful of stars. Somewhere in a night sky full of other stars, the same pattern is hiding — rotated and resized. Find its stars. As you identify neighbors, faint lines connect them and the constellation appears.

The goal is **as few moves as possible**. A perfect game is one commit per member star and no wasted guesses.

## Goals (v1) **[Decided]**

- Runs in the browser on phone and desktop from one codebase.
- Simple, polished core loop: select, commit, discover.
- Almost no art: stars are circles, lines are lines. Visual style is data (a theme), not assets.
- **Procedural:** every game is a freshly generated sky from a seed. Realism is not a goal.
- **Data-driven constellations:** the owner can define and load their own constellations as JSON.
- Highly **tunable**: sky scale, density, minimum spacing, constellation scale range are all parameters.
- Static hosting only. No back-end.
- A friendly project to build together with a child: small files, pure logic that can be tested, fast feedback.

## Non-goals (v1)

| Not in v1 | Status |
|-----------|--------|
| Horizon silhouette | **[Deferred]** — see 09. |
| Multiple constellations per sky; decks of cards; timers | **[Deferred]** — architecture leaves seams. |
| Shared stars between constellations | **[Deferred]** — data model leaves room. |
| Sound effects | **[Deferred]** |
| In-browser constellation editor | **[Deferred]** |
| Leaderboards, accounts, any back-end | **[Deferred]** |
| Pan / zoom / a sky larger than the screen | **Non-goal** — everything is always visible and tappable. |
| Realistic star catalog / real sky positions | **Non-goal** |
| Mirrored constellations | **Non-goal** — only rotation and uniform scale vary. |

## Tone

The first build is deliberately plain: navy sky, warm white-yellow stars. The longer-term direction is light, colorful, and playful (hence the name *Starbrite*). Because all colors, line opacity and fonts live in a theme object (07), that direction is a data change rather than a rewrite.

## Principles

1. **Small first.** A simple, fun prototype beats a flexible framework. Where a future idea is mentioned, leave a seam and stop.
2. **Deterministic.** Same seed + same config + same viewport shape = same sky.
3. **Pure core, thin shell.** Game rules and generation are plain functions with no DOM. Rendering and input are a thin layer on top.
4. **Tunable by data.** Numbers belong in config, not in code.
5. **Tests establish the ranges.** Parameter ranges are discovered by a calibration sweep (08), not guessed once and forgotten.

## Naming

Repository: `starbrite`. Display name for v1: "Starbrite".
