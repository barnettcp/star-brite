// Render the canonical reference card for the target constellation.

import { config } from '../core/config';
import type { GameState } from '../core/types';
import { theme } from './theme';
import { getCardBox } from './transform';

export function renderCard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewportWidth: number,
  viewportHeight: number,
): void {
  const memberStars = state.sky.stars.filter((star) => star.kind === 'member');
  if (memberStars.length === 0) {
    return;
  }

  const box = getCardBox(viewportWidth, viewportHeight);
  const margin = box.size * 0.12;
  const minX = Math.min(...memberStars.map((star) => star.x));
  const maxX = Math.max(...memberStars.map((star) => star.x));
  const minY = Math.min(...memberStars.map((star) => star.y));
  const maxY = Math.max(...memberStars.map((star) => star.y));
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = Math.min((box.size - margin * 2) / width, (box.size - margin * 2) / height);

  ctx.save();
  ctx.fillStyle = theme.cardBackground;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  ctx.fillRect(box.x, box.y, box.size, box.size);
  ctx.strokeRect(box.x, box.y, box.size, box.size);

  ctx.fillStyle = theme.hudText;
  ctx.font = `600 12px ${theme.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Find this pattern', box.x + 12, box.y + box.size - 12);

  for (const star of memberStars) {
    const relativeX = (star.x - minX) / width;
    const relativeY = (star.y - minY) / height;
    const x = box.x + margin + relativeX * (box.size - margin * 2);
    const y = box.y + margin + relativeY * (box.size - margin * 2);
    const radius = Math.max(config.stars.minDrawnRadiusPx, star.radius * scale);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.starIdle;
    ctx.fill();
  }
  ctx.restore();
}
