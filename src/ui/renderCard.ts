// Render the target pattern card with a board-game framing.

import { config } from '../core/config';
import type { GameState } from '../core/types';
import { theme } from './theme';
import { getCardBox } from './transform';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

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
  const margin = 16;
  const innerWidth = box.size - margin * 2;
  const minX = Math.min(...memberStars.map((star) => star.x));
  const maxX = Math.max(...memberStars.map((star) => star.x));
  const minY = Math.min(...memberStars.map((star) => star.y));
  const maxY = Math.max(...memberStars.map((star) => star.y));
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = Math.min((innerWidth - 16) / width, (innerWidth - 16) / height);

  ctx.save();
  ctx.shadowColor = 'rgba(110, 156, 255, 0.16)';
  ctx.shadowBlur = 18;
  roundedRect(ctx, box.x, box.y, box.size, box.size + 8, 18);
  ctx.fillStyle = theme.cardBackground;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(132, 167, 255, 0.08)';
  roundedRect(ctx, box.x + 8, box.y + 8, box.size - 16, box.size - 16, 14);
  ctx.fill();

  ctx.fillStyle = theme.cardTitle;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 13px ${theme.fontFamily}`;
  ctx.fillText((state.sky.target.name || 'Pattern').toUpperCase(), box.x + 18, box.y + 18);

  const patternX = box.x + margin;
  const patternY = box.y + 34;
  const patternSize = innerWidth;

  for (const [first, second] of state.sky.target.edges) {
    const firstStar = memberStars.find((star) => star.id === first);
    const secondStar = memberStars.find((star) => star.id === second);
    if (!firstStar || !secondStar) {
      continue;
    }

    const startX = patternX + ((firstStar.x - minX) / width) * patternSize;
    const startY = patternY + ((firstStar.y - minY) / height) * patternSize;
    const endX = patternX + ((secondStar.x - minX) / width) * patternSize;
    const endY = patternY + ((secondStar.y - minY) / height) * patternSize;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(235, 217, 141, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  for (const star of memberStars) {
    const x = patternX + ((star.x - minX) / width) * patternSize;
    const y = patternY + ((star.y - minY) / height) * patternSize;
    const radius = Math.max(config.stars.minDrawnRadiusPx, star.radius * scale * 0.9);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = theme.starIdle;
    ctx.fill();
  }

  ctx.fillStyle = theme.hudMuted;
  ctx.font = `600 10px ${theme.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText('reference pattern', box.x + 18, box.y + box.size - 16);
  ctx.restore();
}
