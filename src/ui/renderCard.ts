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

function wrapCardTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const normalized = text.trim() || 'PATTERN';
  const words = normalized.toUpperCase().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      continue;
    }
    current = candidate;
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > 2) {
    return [lines[0], `${lines[1].slice(0, 12)}…`];
  }

  return lines;
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
  const headerHeight = 46;
  const footerHeight = 28;
  const patternInset = 20;
  const mainArea = box.size - headerHeight - footerHeight - 18;
  const patternSize = Math.max(72, mainArea - patternInset * 2);
  const minX = Math.min(...candidate.stars.map((star) => star.x));
  const maxX = Math.max(...candidate.stars.map((star) => star.x));
  const minY = Math.min(...candidate.stars.map((star) => star.y));
  const maxY = Math.max(...candidate.stars.map((star) => star.y));
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const xScale = patternSize / spanX;
  const yScale = patternSize / spanY;
  const fitScale = Math.min(xScale, yScale);

  ctx.save();
  const gradient = ctx.createLinearGradient(box.x, box.y, box.x + box.size, box.y + box.size);
  gradient.addColorStop(0, 'rgba(18, 28, 44, 0.98)');
  gradient.addColorStop(1, 'rgba(9, 14, 25, 0.99)');
  ctx.shadowColor = 'rgba(110, 156, 255, 0.18)';
  ctx.shadowBlur = 22;
  roundedRect(ctx, box.x, box.y, box.size, box.size + 6, 18);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = theme.cardInner;
  roundedRect(ctx, box.x + 8, box.y + 8, box.size - 16, box.size - 16, 14);
  ctx.fill();

  ctx.fillStyle = 'rgba(18, 31, 52, 0.82)';
  roundedRect(ctx, box.x + 10, box.y + 10, box.size - 20, headerHeight - 8, 12);
  ctx.fill();

  ctx.strokeStyle = 'rgba(140, 170, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x + 18, box.y + 38);
  ctx.lineTo(box.x + box.size - 18, box.y + 38);
  ctx.stroke();

  ctx.fillStyle = theme.cardTitle;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 12px ${theme.fontFamily}`;
  const titleLines = wrapCardTitle(ctx, candidate.name || 'Pattern', box.size - 32);
  const titleLineHeight = 12;
  titleLines.forEach((line, index) => {
    const y = box.y + 18 + index * (titleLineHeight + 1);
    ctx.fillText(line, box.x + 18, y);
  });

  const patternX = box.x + (box.size - patternSize) / 2;
  const patternY = box.y + headerHeight + 8 + (mainArea - patternSize) / 2;

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

  ctx.fillStyle = 'rgba(13, 23, 38, 0.88)';
  roundedRect(ctx, box.x + 8, box.y + box.size - footerHeight - 6, box.size - 16, footerHeight, 10);
  ctx.fill();

  ctx.fillStyle = theme.hudMuted;
  ctx.font = `600 10px ${theme.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText('reference pattern', box.x + 18, box.y + box.size - 12);
  ctx.restore();
}
