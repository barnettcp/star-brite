// Pure hit-testing for pixel-space selection.

import type { HitCandidate } from './types';

export function hitTest(
  stars: readonly HitCandidate[],
  pointX: number,
  pointY: number,
  hitRadiusPx: number,
): string | null {
  let bestId: string | null = null;
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  for (const star of stars) {
    const dx = pointX - star.x;
    const dy = pointY - star.y;
    const radius = Math.max(hitRadiusPx, star.radius);
    const distanceSquared = dx * dx + dy * dy;
    const allowedDistanceSquared = radius * radius;

    if (distanceSquared <= allowedDistanceSquared) {
      if (bestId === null || distanceSquared < bestDistanceSquared || (distanceSquared === bestDistanceSquared && star.id < bestId)) {
        bestId = star.id;
        bestDistanceSquared = distanceSquared;
      }
    }
  }

  return bestId;
}
