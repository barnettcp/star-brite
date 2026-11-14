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
  const scaleFloor = mergedConfig.constellation.scaleFloor;
  const scaleMin = mergedConfig.constellation.scaleMin;
  const scaleMax = mergedConfig.constellation.scaleMax;
  const maxPlacementAttempts = Math.max(1, mergedConfig.constellation.maxPlacementAttempts);
  const shrinkFactor = mergedConfig.constellation.shrinkFactor;

  let placementScale = Math.max(scaleFloor, Math.min(scaleMax, scaleMin + (scaleMax - scaleMin) * rng.place()));
  let placementRotation = mergedConfig.constellation.randomRotation ? rng.place() * Math.PI * 2 : 0;
  let placementCenterX = widthUnits / 2;
  let placementCenterY = heightUnits / 2;
  let memberStars: SkyStar[] | null = null;

  while (memberStars === null) {
    for (let attempt = 0; attempt < maxPlacementAttempts; attempt += 1) {
      const rotation = mergedConfig.constellation.randomRotation ? rng.place() * Math.PI * 2 : 0;
      const transformedStars = target.stars.map((star) => {
        const relative = {
          x: star.x - targetCentroid.x,
          y: star.y - targetCentroid.y,
        };

        return rotatePoint(scalePoint(relative, baseScale * placementScale), rotation);
      });

      const minX = Math.min(...transformedStars.map((point, index) => point.x - (target.stars[index].size * mergedConfig.stars.radiusPerSizeUnits) - margin));
      const maxX = Math.max(...transformedStars.map((point, index) => point.x + (target.stars[index].size * mergedConfig.stars.radiusPerSizeUnits) + margin));
      const minY = Math.min(...transformedStars.map((point, index) => point.y - (target.stars[index].size * mergedConfig.stars.radiusPerSizeUnits) - margin));
      const maxY = Math.max(...transformedStars.map((point, index) => point.y + (target.stars[index].size * mergedConfig.stars.radiusPerSizeUnits) + margin));

      const xRangeStart = margin - minX;
      const xRangeEnd = widthUnits - margin - maxX;
      const yRangeStart = margin - minY;
      const yRangeEnd = heightUnits - margin - maxY;

      if (xRangeStart <= xRangeEnd && yRangeStart <= yRangeEnd) {
        const centerX = xRangeStart + rng.place() * Math.max(0, xRangeEnd - xRangeStart);
        const centerY = yRangeStart + rng.place() * Math.max(0, yRangeEnd - yRangeStart);

        memberStars = target.stars.map((star, index) => {
          const relative = rotatePoint(scalePoint({
            x: star.x - targetCentroid.x,
            y: star.y - targetCentroid.y,
          }, baseScale * placementScale), rotation);
          const radius = star.size * mergedConfig.stars.radiusPerSizeUnits;

          return {
            id: `m:${target.id}:${star.id}`,
            x: relative.x + centerX,
            y: relative.y + centerY,
            radius,
            kind: 'member',
            constellationId: target.id,
            localId: star.id,
          };
        });

        placementRotation = rotation;
        placementCenterX = centerX;
        placementCenterY = centerY;
        break;
      }
    }

    if (memberStars !== null) {
      break;
    }

    placementScale *= shrinkFactor;
    if (placementScale < scaleFloor) {
      throw new Error(`Unable to place constellation ${target.id} within the sky with scale floor ${scaleFloor}; scale range was ${scaleMin}..${scaleMax}.`);
    }
  }

  if (memberStars === null) {
    throw new Error(`Unable to place constellation ${target.id} within the sky.`);
  }

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
        rotation: placementRotation,
        scale: placementScale,
        centerX: placementCenterX,
        centerY: placementCenterY,
      },
    },
  };

  const report: GenerationReport = {
    seed,
    targetId: target.id,
    decoyCount: decoyStars.length,
    scale: placementScale,
    rotation: placementRotation,
    warnings: [],
  };

  if (decoyStars.length < targetDecoys) {
    report.warnings.push(`Only ${decoyStars.length} of ${targetDecoys} decoys could be placed.`);
  }

  return { sky, report };
}
