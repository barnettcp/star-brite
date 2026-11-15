// Render the target pattern card with a board-game framing.

import { config } from '../core/config';
import type { Constellation, GameState } from '../core/types';
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
  constellation?: Constellation | null,
): void {
  const candidate = constellation ?? {
    id: state.sky.target.constellationId,
    name: state.sky.target.name,
    stars: state.sky.stars.filter((star) => star.kind === 'member').map((star) => ({
      id: star.localId ?? star.id,
      x: star.x,
      y: star.y,
      size: Math.max(1, Math.round(star.radius / 3)),
    })),
    edges: state.sky.target.edges.map(([first, second]) => [first.replace(/^m:[^:]+:/, ''), second.replace(/^m:[^:]+:/, '')]),
  };

  if (candidate.stars.length === 0) {
    return;
  }

  const box = getCardBox(viewportWidth, viewportHeight);
  const inset = 16;
  const patternInset = 22;
  const contentWidth = box.size - inset * 2;
  const minX = Math.min(...candidate.stars.map((star) => star.x));
  const maxX = Math.max(...candidate.stars.map((star) => star.x));
  const minY = Math.min(...candidate.stars.map((star) => star.y));
  const maxY = Math.max(...candidate.stars.map((star) => star.y));
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const patternSize = Math.min(contentWidth - patternInset * 2, box.size - 54);
  const xScale = patternSize / spanX;
  const yScale = patternSize / spanY;
  const fitScale = Math.min(xScale, yScale);

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
  ctx.fillText((candidate.name || 'Pattern').toUpperCase(), box.x + 18, box.y + 18);

  const patternX = box.x + inset + (contentWidth - patternSize) / 2;
  const patternY = box.y + 38 + (contentWidth - patternSize) / 2;

  for (const [firstId, secondId] of candidate.edges) {
    const firstStar = candidate.stars.find((star) => star.id === firstId);
    const secondStar = candidate.stars.find((star) => star.id === secondId);
    if (!firstStar || !secondStar) {
      continue;
    }

    const startX = patternX + (firstStar.x - minX) * fitScale;
    const startY = patternY + (firstStar.y - minY) * fitScale;
    const endX = patternX + (secondStar.x - minX) * fitScale;
    const endY = patternY + (secondStar.y - minY) * fitScale;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'rgba(235, 217, 141, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  for (const star of candidate.stars) {
    const x = patternX + (star.x - minX) * fitScale;
    const y = patternY + (star.y - minY) * fitScale;
    const radius = Math.max(config.stars.minDrawnRadiusPx, star.size * 2.5);

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
