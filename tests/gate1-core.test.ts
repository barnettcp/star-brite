import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { config } from '../src/core/config';
import { validateConstellation, normalizeConstellation } from '../src/core/constellation';
import { createRng, hashSeed } from '../src/core/rng';
import { generateSkyModel } from '../src/core/generate';
import { applyIntent, createGameState, getVisibleEdges } from '../src/core/game';
import { hitTest } from '../src/core/hit';
import type { Constellation } from '../src/core/types';

const exampleConstellation: Constellation = {
  id: 'example',
  name: 'Example',
  stars: [
    { id: 'a', x: 20, y: 30, size: 2 },
    { id: 'b', x: 60, y: 30, size: 3 },
    { id: 'c', x: 40, y: 70, size: 2.5 },
  ],
  edges: [['a', 'b'], ['b', 'c']],
};

describe('core rng', () => {
  it('creates stable streams for the same seed', () => {
    const first = createRng('demo-seed');
    const second = createRng('demo-seed');

    expect(first.pick()).toBe(second.pick());
    expect(first.place()).toBe(second.place());
    expect(first.decoys()).toBe(second.decoys());
  });

  it('hashes a seed deterministically', () => {
    expect(hashSeed('alpha')).toBe(hashSeed('alpha'));
    expect(hashSeed('alpha')).not.toBe(hashSeed('beta'));
  });
});

describe('constellation validation', () => {
  it('accepts a valid constellation and normalizes it', () => {
    const valid = validateConstellation(exampleConstellation);
    const normalized = normalizeConstellation(valid);

    expect(valid.id).toBe('example');
    expect(normalized.centroid.x).toBeCloseTo(40, 5);
    expect(normalized.boundingRadius).toBeGreaterThan(0);
  });

  it('rejects duplicate or invalid star ids', () => {
    expect(() =>
      validateConstellation({
        ...exampleConstellation,
        stars: [
          { id: 'same', x: 10, y: 10, size: 2 },
          { id: 'same', x: 30, y: 30, size: 2.5 },
          { id: 'z', x: 50, y: 50, size: 1.5 },
        ],
      }),
    ).toThrow();
  });
});

describe('generation invariants', () => {
  it('produces a deterministic sky model and keeps star ids unique', () => {
    const first = generateSkyModel('seed-123', [exampleConstellation], 800, 600);
    const second = generateSkyModel('seed-123', [exampleConstellation], 800, 600);

    expect(first.sky).toEqual(second.sky);
    expect(new Set(first.sky.stars.map((star) => star.id)).size).toBe(first.sky.stars.length);
    expect(first.sky.target.starIds.length).toBe(exampleConstellation.stars.length);
    expect(first.sky.stars.some((star) => star.kind === 'member')).toBe(true);
  });

  it('keeps member stars within the world rectangle', () => {
    const { sky } = generateSkyModel('seed-456', [exampleConstellation], 600, 800);
    const margin = config.sky.edgeMarginUnits;

    for (const star of sky.stars) {
      expect(star.x).toBeGreaterThanOrEqual(margin);
      expect(star.x).toBeLessThanOrEqual(config.sky.widthUnits - margin);
      expect(star.y).toBeGreaterThanOrEqual(margin);
      expect(star.y).toBeLessThanOrEqual(sky.heightUnits - margin);
    }
  });

  it('keeps a wide target constellation inside the sky for many seeds', () => {
    const wideConstellation: Constellation = {
      id: 'wide',
      name: 'Wide',
      stars: [
        { id: 'a', x: 0, y: 35, size: 2 },
        { id: 'b', x: 100, y: 30, size: 2.5 },
        { id: 'c', x: 50, y: 100, size: 2 },
        { id: 'd', x: 100, y: 80, size: 1.5 },
      ],
      edges: [['a', 'b'], ['b', 'c'], ['c', 'd']],
    };
    const margin = config.sky.edgeMarginUnits;

    for (let i = 0; i < 100; i += 1) {
      const { sky } = generateSkyModel(`placement-check-${i}`, [wideConstellation], 600, 800);
      for (const star of sky.stars.filter((candidate) => candidate.kind === 'member')) {
        expect(star.x).toBeGreaterThanOrEqual(margin);
        expect(star.x).toBeLessThanOrEqual(config.sky.widthUnits - margin);
        expect(star.y).toBeGreaterThanOrEqual(margin);
        expect(star.y).toBeLessThanOrEqual(sky.heightUnits - margin);
      }
    }
  });
});

describe('game flow', () => {
  it('matches the two-tap select and commit behavior', () => {
    const sky = generateSkyModel('game-seed', [exampleConstellation], 800, 600).sky;
    const initial = createGameState('game-seed', sky);

    const selected = applyIntent(initial, { type: 'tapStar', starId: sky.stars[0].id });
    expect(selected.selectedId).toBe(sky.stars[0].id);

    const committed = applyIntent(selected, { type: 'tapStar', starId: sky.stars[0].id });
    expect(committed.moves).toBe(1);
    expect(committed.selectedId).toBeNull();
    expect(committed.committed[sky.stars[0].id]).toBe('member');

    const empty = applyIntent(committed, { type: 'tapEmpty' });
    expect(empty.selectedId).toBeNull();
  });

  it('reveals edges only when both endpoints are committed', () => {
    const sky = generateSkyModel('edge-seed', [exampleConstellation], 800, 600).sky;
    const memberIdA = sky.target.starIds[0];
    const memberIdB = sky.target.starIds[1];
    const start = createGameState('edge-seed', sky);

    const afterFirst = applyIntent(start, { type: 'tapStar', starId: memberIdA });
    const afterCommitA = applyIntent(afterFirst, { type: 'tapStar', starId: memberIdA });
    const afterSecond = applyIntent(afterCommitA, { type: 'tapStar', starId: memberIdB });
    const afterCommitB = applyIntent(afterSecond, { type: 'tapStar', starId: memberIdB });

    expect(getVisibleEdges(afterCommitB)).toEqual([[memberIdA, memberIdB]]);
  });
});

describe('hit testing', () => {
  it('picks the nearest star within the hit radius', () => {
    const stars = [
      { id: 'a', x: 10, y: 10, radius: 10 },
      { id: 'b', x: 25, y: 10, radius: 8 },
    ];

    expect(hitTest(stars, 12, 10, 8)).toBe('a');
    expect(hitTest(stars, 30, 10, 8)).toBe('b');
    expect(hitTest(stars, 100, 100, 8)).toBeNull();
  });
});

describe('purity guard', () => {
  it('keeps core sources free of DOM, network, and nondeterministic globals', () => {
    const coreDir = new URL('../src/core/', import.meta.url);
    const files = readdirSync(coreDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => new URL(entry.name, coreDir));

    const bannedPatterns = ['document', 'window', 'fetch', 'Math.random', 'Date.now', 'new Date'];
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of bannedPatterns) {
        if (source.includes(pattern)) {
          offenders.push(`${path.relative(process.cwd(), file.pathname)} contains ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
