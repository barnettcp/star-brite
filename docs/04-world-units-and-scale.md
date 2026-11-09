# 04 — World units and scale

This is the document that answers "how big is everything, and what do I turn to change it?"

## The principle **[Decided]**

Everything is authored in **world units**. Generation never knows about pixels. A single knob decides how much world fits on screen. A smaller scale (more world visible) means **more stars on screen and each star smaller**. The player never pans or zooms; all of it is always visible.

## Three coordinate spaces

| Space | Used for | Range |
|-------|----------|-------|
| **Canonical** | authoring a constellation | 0–100 box, y down |
| **World units** | generation: positions, radii, spacing, density | `0..widthUnits` × `0..heightUnits` |
| **Screen pixels** | rendering, hit testing, a few legibility floors | the viewport |

Conversions:

- canonical → world: multiply by `constellation.baseSizeUnits / 100` and by the random scale multiplier, then rotate and translate.
- world → screen: **one uniform scale** plus translate (identity-style transform in v1). All drawing and input go through this single transform, so adding camera features later would only change this transform. We do not plan to.

## The one knob: `sky.widthUnits` **[Decided]**

- `widthUnits` = number of world units across the viewport's width at game start.
- `heightUnits = widthUnits × (viewportHeightPx / viewportWidthPx)`.
- `pxPerUnit = viewportWidthPx / widthUnits`.

### Worked example: a 600×800 screen, defaults otherwise

| | `widthUnits` 150 | `widthUnits` 200 | `widthUnits` 300 |
|--|--|--|--|
| px per unit | 4 | 3 | 2 |
| Sky size (units) | 150 × 200 | 200 × 266.7 | 300 × 400 |
| Decoys at density 2.0 | 60 | ~107 | 240 |
| Constellation width at scale 1.0 (60 units) | 240 px | 180 px | 120 px |
| Star radius range (0.9–2.7 units) | 3.6–10.8 px | 2.7–8.1 px | 2.0–5.4 px (floor applies) |
| Effective decoy spacing | 8 units | 8 units | 11 units (tap-spacing floor applies) |

Wider sky: more stars, smaller stars, smaller constellation: the behavior we want.

## Exceptions: things measured in pixels

Legibility beats purity in exactly these places **[Decided]**:

- `input.hitRadiusPx`: tap target size.
- `stars.minDrawnRadiusPx`: no star is drawn smaller than this.
- Tap-spacing floor (below): decoy spacing never drops below the hit radius, measured in pixels.

## Parameters **[Default]**

All values are starting points. The calibration sweep (08) is what establishes real ranges.

### sky

| Key | Default | Meaning |
|-----|---------|---------|
| `sky.widthUnits` | 200 | World units across the viewport width. The main scale knob. |
| `sky.density` | 2.0 | Target **decoys per 1,000 square world units**. |
| `sky.edgeMarginUnits` | 4 | Stars (member and decoy) keep at least this distance from the sky edge, so none are cut off. |

### decoys

| Key | Default | Meaning |
|-----|---------|---------|
| `decoys.minDistanceUnits` | 8 | Minimum distance between two decoys. **Tunable per request [Decided].** |
| `decoys.minDistanceFromMembersUnits` | 10 | Minimum distance from any decoy to any member star. |
| `decoys.enforceTapSpacing` | true | Effective minimums = `max(configured, input.hitRadiusPx / pxPerUnit)`. |
| `decoys.sizeMin` / `decoys.sizeMax` | 1.0 / 3.0 | Same range as authored member sizes, so size is not a giveaway. |
| `decoys.sizeSkew` | 1.0 | Decoy size = `sizeMin + (sizeMax − sizeMin) × u^skew`, `u` uniform in [0,1). 1.0 = uniform; above 1 favors small stars. |
| `decoys.maxAttemptsFactor` | 30 | Placement attempts allowed = factor × target decoy count. |

### constellation

| Key | Default | Meaning |
|-----|---------|---------|
| `constellation.baseSizeUnits` | 60 | World units spanned by the canonical 100-box at multiplier 1.0. |
| `constellation.scaleMin` / `constellation.scaleMax` | 0.8 / 1.3 | Random uniform multiplier range. **[Decided]** (random scale within bounds) |
| `constellation.randomRotation` | true | Random rotation 0–360°. Turn off for debugging. **[Decided]** |
| `constellation.maxPlacementAttempts` | 200 | Attempts per scale level before shrinking. |
| `constellation.shrinkFactor` | 0.9 | Multiply the scale by this when placement keeps failing. |
| `constellation.scaleFloor` | 0.5 | Never shrink below this multiplier; fail loudly instead. |

### stars

| Key | Default | Meaning |
|-----|---------|---------|
| `stars.radiusPerSizeUnits` | 0.9 | World-unit radius per point of `size`. Size 1 → 0.9, size 3 → 2.7. |
| `stars.minDrawnRadiusPx` | 2 | Drawn radius floor. |

Star radius depends on `size` only; it does **not** scale with the constellation multiplier. This keeps member and decoy stars directly comparable.

### input

| Key | Default | Meaning |
|-----|---------|---------|
| `input.hitRadiusPx` | 22 | Minimum tap radius around a star. |
| `input.tapMovePx` | 10 | Max pointer movement for a press to still count as a tap. |

### layout (HUD; used to reserve space in generation, see 05 and 07)

| Key | Default | Meaning |
|-----|---------|---------|
| `layout.scoreZonePx` | 240 × 96 | Top-left region reserved for the score. |
| `layout.cardFraction` | 0.28 | Card side length as a fraction of the shorter viewport side… |
| `layout.cardMinPx` / `layout.cardMaxPx` | 120 / 180 | …clamped to this range. Card sits top-right. |
| `layout.hudInsetPx` | 12 | Gap between HUD elements and the viewport edge. |

### render

| Key | Default | Meaning |
|-----|---------|---------|
| `render.maxDpr` | 3 | Cap on device pixel ratio for the canvas backing store. |

## Derived guardrails

These are checked at generation time and reported as warnings or hard errors.

1. **Density feasibility.** Randomly packing discs with minimum distance *d* saturates near **0.7 / d² stars per square unit** (≈ `700 / d²` per 1,000 square units). Warn if `sky.density` exceeds **40%** of that. With the default *d* = 8 the ceiling is ≈ 10.9 per 1,000, so warn above ≈ 4.4.
2. **Decoy shortfall.** If attempts run out before the target count, accept the smaller count and report the actual/target ratio.
3. **Placement failure.** If the constellation cannot be placed above `scaleFloor`, raise a clear typed error. Never produce a sky with a missing or clipped constellation.
4. **Member spacing preflight.** For each constellation, `(smallest canonical star distance) × baseSizeUnits/100 × scaleMin` should be at least the effective decoy minimum. Otherwise warn that members may be tighter than the decoy field.
5. **Tap spacing.** Effective minimum spacing in pixels should be at least `input.hitRadiusPx` (the tap-spacing floor enforces this for decoys; members are warned about in 4).

## Aspect ratio and seeds **[Default]**

`heightUnits` follows the viewport's aspect ratio, so the **same seed on a different-shaped screen yields a different sky**. That is fine for play. For "try this seed" sharing later, a fixed-aspect mode is a deferred option (09). The knob is width-based as discussed; on a wide desktop window this means a larger px-per-unit and bigger stars. If that feels wrong, switching to a "short side" knob is a one-function change.

## Resizing mid-game **[Default]**

The world rectangle is fixed when a game starts. On resize or rotation the renderer re-fits the same world into the new viewport with a uniform scale (letterboxed with the background color if the aspect changed). The sky is not regenerated mid-game. HUD zones are reserved at generation time only; after a drastic resize the HUD may overlap stars slightly, which is acceptable for v1. A new game always uses the current viewport.

## Calibration results

To be filled in by the calibration sweep (08). The sweep covers viewports 390×844, 600×800 and 1280×800.

| widthUnits | density | min distance | placement success | decoy fill ratio | min star spacing (px) | verdict |
|-----------|---------|--------------|-------------------|------------------|-----------------------|---------|
| _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

Acceptance targets: placement success 100% (no failures after shrink), fill ratio ≥ 0.95, minimum star spacing ≥ `input.hitRadiusPx`.
