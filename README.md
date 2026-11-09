# Starbrite

Starbrite is a small, procedural in-browser constellation-finding game built with TypeScript, Vite, and Vitest.

The player sees a reference card with a hidden constellation in canonical orientation and then must find the matching stars in a sky full of decoys. The game is seeded, deterministic, and tuned around a simple, playable loop: select a star, commit it, reveal edges as matching stars are found, and finish when the full pattern is identified.

## Features

- Procedural sky generation from a seeded target constellation
- Deterministic star placement with decoy field generation
- Two-tap selection/commit interaction
- Reference card and on-screen HUD
- Responsive canvas rendering for desktop and phone-sized viewports
- Manifest-driven constellation loading and runtime overrides
- Build and release hygiene checks for generated-content filtering

## Project structure

- `src/core/` — pure game logic and generation rules
- `src/data/` — data loading and file validation
- `src/ui/` — rendering, input, canvas lifecycle, and UI state
- `public/constellations/` — constellation manifests and starter definitions
- `tests/` — automated validation, purity checks, and calibration sweep
- `scripts/` — release build and release validation tooling

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the test suite:

```bash
npm test
```

Run the TypeScript check:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

Run the release checks:

```bash
npm run build:release
npm run check:release
```

## Scripts

- `npm run dev` — local Vite development server
- `npm run build` — TypeScript validation + production bundle
- `npm run build:release` — release build that strips AI-generated entries
- `npm run preview` — preview the built app locally
- `npm test` — run Vitest tests
- `npm run typecheck` — strict TypeScript validation
- `npm run check:release` — verify the release output is clean

## Notes

This project follows a layered architecture that keeps the core game logic pure and separate from rendering and input. The generation pipeline uses world units and deterministic seeding so the same configuration and viewport produce consistent results.

## Disclaimer

This project was created with the assistance of AI tools. The implementation, structure, and documentation were developed with AI-supported workflows, and the project should be treated as an AI-assisted development effort rather than a manually authored codebase from a single human author.
