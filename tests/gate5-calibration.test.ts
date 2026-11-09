import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { config } from '../src/core/config';
import { generateSkyModel } from '../src/core/generate';
import { getWorldTransform, worldToScreen } from '../src/ui/transform';

const seededConstellations = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public', 'constellations', 'ai-starters.json'), 'utf8'),
).constellations;

const defaultViewportCells = [
  { viewport: [390, 844], widthUnits: 200, density: 2 },
  { viewport: [600, 800], widthUnits: 200, density: 2 },
  { viewport: [1280, 800], widthUnits: 200, density: 2 },
] as const;

function computeMetricsForCell(viewport: [number, number], widthUnits: number, density: number, seeds = 200) {
  const targetDecoyCount = Math.max(0, Math.round(density * (widthUnits * (viewport[1] / Math.max(viewport[0], 1))) / 1000));
  let successCount = 0;
  let fillTotal = 0;
  let minSpacingPx = Number.POSITIVE_INFINITY;

  for (let i = 0; i < seeds; i += 1) {
    const seed = `calibration-${i}`;
    const { sky, report } = generateSkyModel(seed, seededConstellations, viewport[0], viewport[1], {
      sky: { ...config.sky, widthUnits, density },
      constellation: { ...config.constellation, randomRotation: true },
    });

    successCount += 1;
    fillTotal += report.decoyCount / Math.max(targetDecoyCount, 1);

    const transform = getWorldTransform(sky, viewport[0], viewport[1]);
    for (let left = 0; left < sky.stars.length; left += 1) {
      for (let right = left + 1; right < sky.stars.length; right += 1) {
        const aStar = sky.stars[left];
        const bStar = sky.stars[right];
        if (aStar.kind === 'member' && bStar.kind === 'member') {
          continue;
        }

        const a = worldToScreen(aStar.x, aStar.y, transform);
        const b = worldToScreen(bStar.x, bStar.y, transform);
        const spacing = Math.hypot(a.x - b.x, a.y - b.y);
        if (spacing < minSpacingPx) {
          minSpacingPx = spacing;
        }
      }
    }
  }

  return {
    viewport,
    widthUnits,
    density,
    placementSuccess: successCount / seeds,
    fillRatio: fillTotal / seeds,
    minSpacingPx: Number.isFinite(minSpacingPx) ? minSpacingPx : 0,
  };
}

describe('gate 5 calibration', () => {
  it('meets the acceptance targets for the default default parameters across the required viewports', () => {
    const metrics = defaultViewportCells.map((cell) => computeMetricsForCell(cell.viewport, cell.widthUnits, cell.density, 50));

    for (const metric of metrics) {
      console.log(JSON.stringify(metric));
      expect(metric.placementSuccess).toBe(1);
      expect(metric.fillRatio).toBeGreaterThanOrEqual(0.95);
      expect(metric.minSpacingPx).toBeGreaterThanOrEqual(config.input.hitRadiusPx);
    }
  });
});
