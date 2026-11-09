# Starbrite — Documentation

Starbrite is a small, procedural, in-browser constellation-finding game. The player is shown a card with the stars of a constellation, then has to find those stars in a sky full of decoys. Lines between found stars appear as the pattern is discovered.

**Status:** pre-implementation. These documents describe decisions made during design; no code exists yet.
**Last updated:** 2026-11-08

## Reading order

| # | Document | Answers |
|---|----------|---------|
| 01 | [Overview](01-overview.md) | What are we building, for whom, and what is explicitly *not* in v1? |
| 02 | [Gameplay](02-gameplay.md) | Rules, the two-tap select/commit mechanic, scoring, game over. |
| 03 | [Data model](03-data-model.md) | Constellation JSON format, validation, the three AI-generated starters, authoring guide. |
| 04 | [World units & scale](04-world-units-and-scale.md) | How size and density work, every tunable parameter and its starting value. |
| 05 | [Sky generation](05-sky-generation.md) | Seeded RNG, constellation placement, decoy scattering, invariants. |
| 06 | [Architecture](06-architecture.md) | Stack, module layout, pure-vs-DOM split, extension seams. |
| 07 | [Visual spec](07-visual-spec.md) | Layout, colors, star states, HUD, reference card, theme. |
| 08 | [Testing](08-testing.md) | Test strategy, invariants, the calibration sweep, release checks. |
| 09 | [Roadmap & deferred](09-roadmap-and-deferred.md) | What we are designing *for* but not building, and a learning-friendly build order. |
| 10 | [Decisions log](10-decisions.md) | Every decision, who made it, and what is still open. |

## Conventions used in these docs

- **[Decided]**: a decision made explicitly by the project owner.
- **[Default]**: a starting value or recommendation. Change freely; the calibration sweep (see 08) is the intended way to settle numeric ranges.
- **[Deferred]**: intentionally not built in v1; a seam is left for it.
- **Axes:** x increases to the right, y increases **downward**, everywhere (data, world, screen).
- **Three coordinate spaces:** *canonical* (a constellation's authored 0–100 box), *world units* (the sky; all generation happens here), *screen pixels* (rendering and input only). See 04.

## Glossary

| Term | Meaning |
|------|---------|
| **Constellation** | An authored pattern: a few stars plus an explicit edge list. |
| **Target** | A constellation the player must find in the current game. v1 has exactly one. |
| **Member star** | A star in the sky that belongs to a target. |
| **Decoy** | A star in the sky that belongs to no target. |
| **Card** | The reference panel showing a target's stars only, always in canonical orientation. |
| **Select** | First tap on a star. Free. Marks it as armed. |
| **Commit** | Second tap on the selected star. Counts as a move. |
| **Moves** | The score: number of commits. Lower is better. |
| **Par** | Number of distinct member stars across all targets. A perfect game has moves = par. |
| **Idle / Found / Ruled out** | Player-facing star states: untouched / committed member / committed decoy. |
| **Seed** | A string that fully determines a generated sky (for a given viewport shape and config). |
