// Seeded generation for a single target sky model.

import { config, type Config } from './config';
import { type Constellation, type SkyModel, type SkyStar } from './types';
import { createRng } from './rng';
import { centroid, distance, rotatePoint, scalePoint } from './geometry';

export interface GenerationReport {
  seed: string;
  targetId: string;
  decoyCount: number;
  scale: number;
  rotation: number;
  warnings: string[];
}

export function generateSkyModel(
  seed: string,
  constellations: readonly Constellation[],
  viewportWidth: number,
  viewportHeight: number,
  overrides: Partial<Config> = {},
): { sky: SkyModel; report: GenerationReport } {
  const mergedConfig = { ...config, ...overrides };
  const activeConstellations = constellations.length > 0 ? constellations : [];

  if (activeConstellations.length === 0) {
    throw new Error('No constellations are available for generation.');
  }

  const rng = createRng(seed);
  const targetIndex = Math.floor(rng.pick() * activeConstellations.length);
  const target = activeConstellations[targetIndex];
  const widthUnits = mergedConfig.sky.widthUnits;
  const heightUnits = widthUnits * (viewportHeight / Math.max(viewportWidth, 1));
  const margin = mergedConfig.sky.edgeMarginUnits;

  const starPoints = target.stars.map((star) => ({ x: star.x, y: star.y }));
  const targetCentroid = centroid(starPoints);
  const baseScale = mergedConfig.constellation.baseSizeUnits / 100;
  const scale = mergedConfig.constellation.scaleMin;
  const rotation = mergedConfig.constellation.randomRotation ? rng.place() * Math.PI * 2 : 0;

  const memberStars: SkyStar[] = target.stars.map((star) => {
    const relative = rotatePoint(scalePoint({ x: star.x - targetCentroid.x, y: star.y - targetCentroid.y }, baseScale * scale), rotation);
    const centerX = widthUnits / 2 + (rng.place() - 0.5) * (widthUnits - 2 * margin);
    const centerY = heightUnits / 2 + (rng.place() - 0.5) * (heightUnits - 2 * margin);
    const x = relative.x + centerX;
    const y = relative.y + centerY;
    const radius = star.size * mergedConfig.stars.radiusPerSizeUnits;

    return {
      id: `m:${target.id}:${star.id}`,
      x,
      y,
      radius,
      kind: 'member',
      constellationId: target.id,
      localId: star.id,
    };
  });

  const area = widthUnits * heightUnits;
  const targetDecoys = Math.max(0, Math.round(mergedConfig.sky.density * area / 1000));
  const decoyRadius = mergedConfig.decoys.sizeMin;
  const decoyStars: SkyStar[] = [];
  const maxAttempts = mergedConfig.decoys.maxAttemptsFactor * Math.max(1, targetDecoys);

  for (let attempt = 0; attempt < maxAttempts && decoyStars.length < targetDecoys; attempt += 1) {
    const x = margin + rng.decoys() * (widthUnits - margin * 2);
    const y = margin + rng.decoys() * (heightUnits - margin * 2);

    let invalid = x < margin || y < margin || x > widthUnits - margin || y > heightUnits - margin;
    if (!invalid) {
      for (const member of memberStars) {
        const minDistance = mergedConfig.decoys.minDistanceFromMembersUnits + member.radius;
        if (distance({ x, y }, member) < minDistance) {
          invalid = true;
          break;
        }
      }
    }

    if (!invalid) {
      for (const decoy of decoyStars) {
        const minDistance = mergedConfig.decoys.minDistanceUnits + decoyRadius + decoy.radius;
        if (distance({ x, y }, decoy) < minDistance) {
          invalid = true;
          break;
        }
      }
    }

    if (!invalid) {
      const size = mergedConfig.decoys.sizeMin + (mergedConfig.decoys.sizeMax - mergedConfig.decoys.sizeMin) * rng.decoys();
      decoyStars.push({
        id: `d:${decoyStars.length}`,
        x,
        y,
        radius: size * mergedConfig.stars.radiusPerSizeUnits,
        kind: 'decoy',
      });
    }
  }

  const sky: SkyModel = {
    seed,
    widthUnits,
    heightUnits,
    stars: [...memberStars, ...decoyStars],
    target: {
      constellationId: target.id,
      name: target.name,
      starIds: memberStars.map((star) => star.id),
      edges: target.edges.map(([first, second]) => [
        `m:${target.id}:${first}`,
        `m:${target.id}:${second}`,
      ]),
      placement: {
        rotation,
        scale,
        centerX: widthUnits / 2,
        centerY: heightUnits / 2,
      },
    },
  };

  const report: GenerationReport = {
    seed,
    targetId: target.id,
    decoyCount: decoyStars.length,
    scale,
    rotation,
    warnings: [],
  };

  if (decoyStars.length < targetDecoys) {
    report.warnings.push(`Only ${decoyStars.length} of ${targetDecoys} decoys could be placed.`);
  }

  return { sky, report };
}
