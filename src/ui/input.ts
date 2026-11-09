// Helpers for translating pointer positions into star hits in screen space.

import { config } from '../core/config';
import { hitTest } from '../core/hit';
import type { GameState } from '../core/types';
import { worldToScreen, type ScreenTransform } from './transform';

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
  const candidates = state.sky.stars.map((star) => {
    const point = worldToScreen(star.x, star.y, transform);
    return {
      id: star.id,
      x: point.x,
      y: point.y,
      radius: Math.max(config.input.hitRadiusPx, star.radius * transform.scale),
    };
  });

  return hitTest(candidates, screenX, screenY, config.input.hitRadiusPx);
}
