// Render the sky, lines, and star states in world coordinates.

import { config } from '../core/config';
import { getVisibleEdges } from '../core/game';
import type { GameState } from '../core/types';
import { theme } from './theme';
import type { ScreenTransform } from './transform';
import { worldToScreen } from './transform';

export function renderSky(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  transform: ScreenTransform,
  viewportWidth: number,
  viewportHeight: number,
): void {
  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.lineColor;
  ctx.globalAlpha = theme.lineOpacity;

  for (const [first, second] of getVisibleEdges(state)) {
    const firstStar = state.sky.stars.find((star) => star.id === first);
    const secondStar = state.sky.stars.find((star) => star.id === second);
    if (!firstStar || !secondStar) {
      continue;
    }

    const start = worldToScreen(firstStar.x, firstStar.y, transform);
    const end = worldToScreen(secondStar.x, secondStar.y, transform);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.restore();

  const selectedId = state.selectedId;
  for (const star of state.sky.stars) {
    const point = worldToScreen(star.x, star.y, transform);
    const radius = Math.max(config.stars.minDrawnRadiusPx, star.radius * transform.scale);
    const committed = state.committed[star.id];

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);

    if (committed === 'member') {
      ctx.fillStyle = theme.starFound;
    } else if (committed === 'decoy') {
      ctx.fillStyle = theme.starRuledOut;
    } else {
      ctx.fillStyle = theme.starIdle;
    }
    ctx.fill();

    if (selectedId === star.id) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.starSelectedRing;
      ctx.stroke();
    }
  }
}
