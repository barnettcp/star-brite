// Helpers for translating pointer positions into world-space hits.

import { config } from '../core/config';
import { hitTest } from '../core/hit';
import type { GameState } from '../core/types';
import type { ScreenTransform } from './transform';

export function screenToWorld(x: number, y: number, transform: ScreenTransform): { x: number; y: number } {
  return {
    x: (x - transform.offsetX) / transform.scale,
    y: (y - transform.offsetY) / transform.scale,
  };
}

export function hitStarAt(
  state: GameState,
  screenX: number,
  screenY: number,
  transform: ScreenTransform,
): string | null {
  const worldPoint = screenToWorld(screenX, screenY, transform);
  const candidates = state.sky.stars.map((star) => ({
    id: star.id,
    x: star.x,
    y: star.y,
    radius: Math.max(config.stars.minDrawnRadiusPx, star.radius),
  }));

  return hitTest(candidates, worldPoint.x, worldPoint.y, config.input.hitRadiusPx);
}
