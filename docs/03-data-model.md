# 03 — Data model

Constellations are plain JSON files. Adding a constellation means adding data, never code. **[Decided]**

## File format

A constellation file contains an array under the key `constellations`, so one file can hold one or many.

### Constellation fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Unique across all loaded files. Lowercase letters, digits, hyphens. AI-generated ones start with `ai-`. |
| `name` | string | yes | Shown only after the constellation is found. AI-generated names end with `(AI Generated)`. |
| `aiGenerated` | boolean | no (default `false`) | Marks content that must never ship in a public release (see below). |
| `stars` | array | yes | 2 or more. 4–7 recommended for v1. |
| `edges` | array of `[id, id]` | yes | Explicit. Only listed pairs get lines. |

Unknown extra fields are **ignored** by the loader (room for a future `image`, `story`, etc.).

### Star fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Unique **within the constellation**. Letters/digits/`_`/`-`. |
| `x`, `y` | number | **Canonical coordinates** in a 0–100 box, **y down**. |
| `size` | number | Relative magnitude. 1 = small, 3 = large. Converted to a world-unit radius by config (04). |

Star ids are local in v1. In the generated sky each star gets an opaque sky-level id (see "Generated sky model").

### Edges

- Each edge is an unordered pair of star ids from the same constellation.
- Edges are **authored**, not computed: two stars with nothing between them can still have no edge.

## Validation rules (loader)

Errors (constellation rejected, clear message naming file and id):

- missing/empty `id` or `name`; duplicate constellation `id` across files
- fewer than 2 stars; duplicate star id within a constellation
- non-finite `x`, `y`, or `size`; `size` ≤ 0 or > 5
- an edge referencing an unknown star id; a self-edge; a duplicate edge (either order)

Warnings (constellation accepted):

- coordinates outside 0–100
- star count outside 4–7
- a star with no edges, or an edge graph that is not connected
- two stars closer than 15 canonical units (may be too tight at the smallest scale; see 04 preflight)
- `aiGenerated: true` without `(AI Generated)` in the name or without an `ai-` id prefix (this is an **error** in the release check; see 08)

## Normalization (after validation)

1. **Recenter** on the centroid (mean of star positions) so rotation and scaling pivot on it.
2. Compute the **bounding radius** (max distance from the centroid to any star) for quick feasibility checks.
3. Keep canonical distances **unchanged**: the card draws them as-is, and the sky applies one uniform scale and one rotation. **No mirroring, ever.**

## The three AI-generated starters **[Decided]**

These exist so we can see how constellations are built. They are marked so they can be excluded mechanically from public releases. Suggested location: `public/constellations/ai-starters.json`.

```json
{
  "constellations": [
    {
      "id": "ai-kite",
      "name": "The Kite (AI Generated)",
      "aiGenerated": true,
      "stars": [
        { "id": "k1", "x": 50, "y": 10, "size": 3.0 },
        { "id": "k2", "x": 80, "y": 40, "size": 2.0 },
        { "id": "k3", "x": 50, "y": 70, "size": 2.5 },
        { "id": "k4", "x": 20, "y": 40, "size": 1.5 },
        { "id": "k5", "x": 50, "y": 95, "size": 1.0 }
      ],
      "edges": [["k1","k2"],["k2","k3"],["k3","k4"],["k4","k1"],["k3","k5"]]
    },
    {
      "id": "ai-ladle",
      "name": "The Ladle (AI Generated)",
      "aiGenerated": true,
      "stars": [
        { "id": "l1", "x": 10, "y": 30, "size": 1.5 },
        { "id": "l2", "x": 38, "y": 34, "size": 2.0 },
        { "id": "l3", "x": 36, "y": 60, "size": 3.0 },
        { "id": "l4", "x": 8,  "y": 56, "size": 1.0 },
        { "id": "l5", "x": 60, "y": 70, "size": 1.5 },
        { "id": "l6", "x": 80, "y": 78, "size": 2.0 },
        { "id": "l7", "x": 95, "y": 95, "size": 1.0 }
      ],
      "edges": [["l1","l2"],["l2","l3"],["l3","l4"],["l4","l1"],["l3","l5"],["l5","l6"],["l6","l7"]]
    },
    {
      "id": "ai-zigzag",
      "name": "The Zigzag (AI Generated)",
      "aiGenerated": true,
      "stars": [
        { "id": "z1", "x": 15, "y": 15, "size": 2.0 },
        { "id": "z2", "x": 75, "y": 25, "size": 1.0 },
        { "id": "z3", "x": 25, "y": 65, "size": 3.0 },
        { "id": "z4", "x": 85, "y": 85, "size": 1.5 }
      ],
      "edges": [["z1","z2"],["z2","z3"],["z3","z4"]]
    }
  ]
}
```

What each one demonstrates:

- **The Kite (5 stars):** a closed loop plus a tail. The two side stars (`k2`, `k4`) have no edge between them even though nothing sits between them: the "edges are authored" case.
- **The Ladle (7 stars):** a loop with a branching handle; the top of the 4–7 range.
- **The Zigzag (4 stars):** an open chain with strong size contrast, so size is a major matching cue.

## AI-generated marker policy **[Decided]**

- Every AI-generated constellation has `aiGenerated: true`, an `ai-` id prefix, and `(AI Generated)` in its name.
- Dev builds include them. **Release builds must exclude them** (the file is removed from the output and the manifest is rewritten) and a release check fails if any remain (06, 08).
- If a release build ends up with zero constellations, the game shows a friendly "no constellations available" message rather than crashing.

## Manifest and loading **[Default]**

Static hosting cannot list directories, so constellation files are listed in a manifest:

- `public/constellations/manifest.json` — `{ "files": ["ai-starters.json", ...] }`
- At startup the app fetches the manifest, then each listed file, validates, normalizes, and builds the pool.
- v1 picks the target from the pool using the seeded RNG, unless `?c=<constellation-id>` is given (06).

Adding your own constellation = add a file and list it in the manifest. No rebuild logic changes.

## Authoring guide (graph paper → JSON)

1. Draw on a 10×10 grid; each square is 10 canonical units. Mark 4–7 stars.
2. Read off `x` (right) and `y` (down). Remember **y goes down**, like a screen.
3. Give each star a `size` from 1 (tiny) to 3 (big). Mix sizes; size is a clue.
4. Decide which pairs are connected and write the edges explicitly.
5. Keep stars at least ~15 units apart.
6. Prefer **asymmetric** shapes. A perfectly symmetric shape is still valid but has several equivalent matches, which is less fun.
7. Name it. Names are a reward, revealed only at the end.

## Generated sky model (runtime, not authored)

The generator turns config + seed + constellation(s) into this structure. All coordinates are **world units**.

| Object | Fields |
|--------|--------|
| **SkyModel** | `seed`, `widthUnits`, `heightUnits`, `stars[]`, `targets[]` |
| **SkyStar** | `id` (opaque, unique in the sky), `x`, `y`, `size`, `radius` (world units), `kind` (`member` or `decoy`), and for members: `constellationId`, `localId` |
| **Target** | `constellationId`, `name`, `starIds[]` (sky ids), `edges[]` (pairs of sky ids), `placement` (`rotation`, `scale`, `centerX`, `centerY`) |

Id scheme **[Default]**: members `m:<constellationId>:<localId>`; decoys `d:<n>`. Everything outside the generator treats ids as opaque strings.

`kind` is internal truth. The renderer only reveals it through the player-facing state (idle / found / ruled out).
