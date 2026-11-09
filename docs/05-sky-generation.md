# 05 — Sky generation

Generation is a **pure function**: config + seed + viewport shape + constellation pool in, `SkyModel` out (data model in 03). It uses no DOM, no `Math.random`, no clock.

## Determinism **[Decided]**

Seeded RNG, because the sky is procedural and we want reproducible skies for debugging, tuning and sharing.

- A seed is a string. It is hashed to a 32-bit integer by a stable string hash, then drives a small seedable PRNG (mulberry32 or sfc32 are suitable). **[Default]**
- **Separate streams per purpose**, derived by hashing `seed + "/" + streamName`:
  - `pick`: choosing the target constellation from the pool
  - `place`: rotation, scale, position of the constellation
  - `decoys`: everything about decoys
- Why: changing `sky.density` then does not move the constellation, and tuning the constellation scale does not reshuffle the decoys. This makes tuning by feel much easier.
- The only nondeterministic call in the whole app is creating a *new* seed for a new game (random bytes from the platform). Everything downstream is a function of that string.
- Cross-engine floating-point differences (trig functions) can differ in the last bits. **[Default]** Round generated world coordinates to 3 decimal places at creation, before any collision checks, so a given seed behaves the same everywhere.
- A seed reproduces a sky only for the same config **and the same viewport aspect ratio** (04).

## Inputs

- `config` (04), `seed`, viewport size in px (for aspect and `pxPerUnit`)
- the pool of validated, normalized constellations (03)
- **exclusion zones** (below)

## Steps

### 1. Choose the target(s)

v1 takes exactly one target. If `?c=` names one, use it; otherwise pick from the pool using the `pick` stream. Internally the generator takes a *list* of targets and loops over it; the list has one item. (Seam for decks and multi-constellation skies; see 09.)

### 2. Establish the world rectangle and exclusion zones

- `widthUnits` from config; `heightUnits` from the viewport aspect; `pxPerUnit` from the viewport width.
- **Exclusion zones** are rectangles in world units. v1 has the HUD zones (score top-left, card top-right), converted from `layout.*` pixel values using `pxPerUnit`. Each zone has an `appliesTo` field: `all` (no star of any kind) or `constellation` (members only).
- HUD zones apply to `all`. The deferred horizon (09) is simply another zone with `appliesTo: constellation`, which matches the requirement that constellation stars may not sit behind the horizon while background stars may.

### 3. Place the constellation

For each target, using the `place` stream:

1. Draw a rotation (uniform 0–360°, or 0 if `constellation.randomRotation` is false) and a scale multiplier (uniform in `scaleMin..scaleMax`).
2. Transform the normalized canonical stars: scale by `baseSizeUnits/100 × multiplier`, rotate about the centroid. **No mirroring.**
3. Compute the rotated extents including star radii and `sky.edgeMarginUnits`. The feasible range for the translation is exact: the sky rectangle minus those extents. If the range is empty, this attempt fails.
4. Draw a translation from the feasible range. Reject the attempt if any member star falls inside an exclusion zone.
5. Up to `constellation.maxPlacementAttempts` attempts per scale level. If all fail, multiply the multiplier by `constellation.shrinkFactor` and try again. Never go below `constellation.scaleFloor`; then throw a typed placement error that names the config values involved.
6. The final multiplier, rotation and center are stored in the target's `placement`.

Multiple targets (future): each is placed in turn with additional rejection against previously placed members. Not implemented in v1.

### 4. Scatter decoys

Using the `decoys` stream:

- **Target count** = round(`sky.density` × area ÷ 1000), where area = `widthUnits × heightUnits`.
- Method: **dart throwing with a spatial grid** (random candidate, reject if too close to anything, repeat). Chosen over a blue-noise generator because it looks more natural (slight clumping) and the density parameter maps onto it directly. **[Default]**
- A candidate is rejected if:
  - it is within `sky.edgeMarginUnits` of the sky edge,
  - it lies in an exclusion zone,
  - it is closer than the effective decoy–decoy minimum to an existing decoy,
  - it is closer than the effective decoy–member minimum to any member star.
  - *Effective minimum* = `max(configured, input.hitRadiusPx / pxPerUnit)` when `decoys.enforceTapSpacing` is true.
- Each accepted decoy gets a size from `[decoys.sizeMin, decoys.sizeMax]` with `decoys.sizeSkew` (04), then `radius = size × stars.radiusPerSizeUnits`.
- Stop at the target count or after `decoys.maxAttemptsFactor × target` attempts. A shortfall is allowed and reported as a ratio.

### 5. Assemble

- Member stars first (ids `m:<constellationId>:<localId>`), then decoys in creation order (`d:0`, `d:1`, …). Order is deterministic and doubles as draw order.
- Output the `SkyModel` plus a **generation report**: actual vs target decoys, final scale multiplier and whether shrinking occurred, effective minimum spacings, warnings.

## Invariants (asserted by tests, 08)

For every generated sky:

1. Same inputs → byte-identical output.
2. Every star lies inside the sky rectangle minus `sky.edgeMarginUnits`.
3. No star lies in an exclusion zone that applies to it.
4. Every decoy–decoy distance ≥ effective decoy minimum; every decoy–member distance ≥ effective member minimum.
5. The placed member set is a **similarity transform** of the canonical set: all pairwise distance ratios are preserved, and orientation is preserved (no reflection).
6. Member star count and edges equal the constellation's authored data.
7. All star ids are unique.
8. The final scale multiplier is within `[scaleFloor, scaleMax]`.

## Known limitation: accidental patterns

Random decoys can occasionally form something that resembles the constellation. v1 does not detect this. An "ambiguity checker" is listed in 09 as a deferred improvement. Playtesting will show whether it matters.
