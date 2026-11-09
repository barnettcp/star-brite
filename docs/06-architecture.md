# 06 — Architecture

## Stack **[Decided]**

| Choice | Why |
|--------|-----|
| **TypeScript** (strict) | Wanted for learning; the data schema and config are natural things to type. |
| **HTML Canvas 2D** | Circles and lines only. No scene graph or engine needed. |
| **Vite** | Dev server and static build. Output is plain files that drop onto any web host. |
| **Vitest** | Same config as Vite; the core is pure functions, which are easy to test. |
| **Pointer Events** | One input path for mouse and touch. |
| **No runtime dependencies** | Nothing to ship but our own code. |

Why not Godot or another engine: its HTML5 export is a large WASM bundle that loads slowly on phones and embeds awkwardly in an existing site, and the strengths of an engine (physics, animation, scenes, audio) are not needed. A lighter library (PixiJS) is the natural step up if effects like glow and twinkle outgrow Canvas 2D. Game logic would be unchanged.

**No back-end.** Constellations are static JSON fetched at startup. `localStorage` can hold small per-device things later.

Tooling defaults **[Default]**: Node LTS, npm, `tsc --noEmit` for type checks, ESLint and Prettier optional.

## Repository layout **[Default]**

```
starbrite/
  .local/star-bootstrap.md        # build driver (whether to commit is your call)
  docs/                           # this documentation
  public/
    constellations/
      manifest.json
      ai-starters.json
  scripts/                        # release filtering and checks (Node)
  src/
    core/                         # PURE: no DOM, no fetch, no Math.random
      types.ts  config.ts  rng.ts  geometry.ts
      constellation.ts            # validate + normalize
      generate.ts                 # place constellation, scatter decoys
      game.ts                     # state + intents → new state
      hit.ts                      # pick the star under a tap
    data/
      load.ts                     # fetch manifest + files (network)
    ui/
      main.ts  canvas.ts  transform.ts
      renderSky.ts  renderCard.ts  renderHud.ts  overlay.ts
      input.ts  theme.ts  params.ts  # params = URL overrides
  tests/
  index.html  vite.config.ts  tsconfig.json  package.json
```

## Layering rules

1. `core/` imports nothing from `ui/` or `data/` and never touches `document`, `window`, `fetch`, `Math.random` or `Date`. A test scans `core/` for these (08).
2. `data/` may use the network and calls core validation.
3. `ui/` owns the DOM, canvas, input and drawing. It never decides game rules; it sends **intents** to the core and draws the resulting state.
4. Config and theme are plain objects passed in; nothing reads globals.

## Data flow

```
manifest.json ─► load.ts ─► validate/normalize (core/constellation)
                                   │
 seed + config + viewport ─────────┼─► generate (core) ─► SkyModel
                                   │
                          game.ts: GameState = { sky, selectedId | none,
                                    committed: id → found | ruledOut, moves, status }
                                   ▲                                │
   input.ts ─ pointer → hit.ts ─ intent ─┘            renderSky / renderCard / renderHud
```

- **Game state** holds the sky, the current selection, the committed map, and derived values (moves, par, which targets are found, which edges are visible).
- **Intents:** `tapStar(id)`, `tapEmpty`, `newGame(seed)`. The core exposes one function that takes the current state and an intent and returns the next state. UI code never mutates state directly.
- **Edge visibility and "target found"** are computed from the committed map and authored edges; never stored.
- **Rendering** is a function of (state, config, theme, transform). A `requestAnimationFrame` loop redraws only when the state or viewport is dirty, leaving a seam for animation without burning battery.

## Startup sequence

1. Parse URL overrides (below).
2. Load and validate constellations; in a release build the AI-generated ones are already gone.
3. Choose a seed (URL `?seed=` or fresh), build the config (defaults + overrides), generate the sky from the current viewport.
4. Size the canvas for the device pixel ratio (cap `render.maxDpr`), draw, attach input.
5. On generation error, show a readable message on screen instead of a blank page.

## URL overrides **[Default]**

A cheap tuning path for working with your daughter, no panel needed:

| Param | Effect |
|-------|--------|
| `?seed=abc` | Use this seed. |
| `?c=ai-kite` | Force this constellation. |
| `?w=300` | Override `sky.widthUnits`. |
| `?d=3` | Override `sky.density`. |
| `?rot=0` | Disable random rotation. |

Unknown or invalid params are ignored with a console warning.

## Canvas and device notes

- Backing store = CSS size × device pixel ratio (capped); reset the transform on resize.
- The canvas uses `touch-action: none` so taps and drags never scroll or zoom the page, and so a fast second tap is not treated as double-tap zoom.
- Respect safe-area insets (notches) for the HUD.
- A tap is press + release with little movement (`input.tapMovePx`).

## Build and deploy

- `npm run dev`, `build`, `preview`, `test`, `typecheck`.
- `build` produces static files in `dist/`, with a relative base path so the site can live in a subfolder of an existing website.
- `build:release` additionally **removes AI-generated constellation entries** from `dist/constellations` and rewrites the manifest. `check:release` scans `dist/` and fails if it finds `"aiGenerated": true` or the text `(AI Generated)`. **[Decided]**

## Extension seams

These are the places the deferred ideas (09) plug in. None are built in v1, but the code should not make them hard.

| Future idea | Seam |
|-------------|------|
| Horizon | Exclusion zone with `appliesTo: constellation`, plus a drawing function. |
| Multiple constellations / decks / timers | `targets` is already a list; add a draw pile and a clock around game state. |
| Card hand | `renderCard` draws any constellation in canonical orientation into any box. |
| Shared stars | Sky-level star table that constellations reference; ids are already opaque. |
| Themes | `theme.ts` holds all colors, line opacity, fonts, labels. |
| Sound | Hook on intent results (commit outcome), not in render code. |
| Editor | Reuses the constellation schema and validator. |
| Camera | World→screen transform is the only place to change; non-goal. |

## Conventions **[Default]**

- `strict` TypeScript, no `any`, prefer small pure functions and plain data over classes.
- Every tunable number lives in `config.ts`; every color in `theme.ts`.
- Short files, named exports, a one-line comment at the top of each file explaining its job. Friendly to learners.
