// Render the top HUD strip and compact score panel.

import type { GameState } from '../core/types';
import { theme } from './theme';

const logoImage = typeof Image !== 'undefined' ? new Image() : null;
if (logoImage) {
  logoImage.src = '/assets/logo.svg';
}

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

export function renderHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewportWidth: number,
  _viewportHeight: number,
): void {
  const barX = 18;
  const barY = 18;
  const barWidth = Math.max(viewportWidth - 36, 240);
  const barHeight = 76;
  const scoreWidth = 176;
  const scoreX = Math.max(barX + barWidth - scoreWidth - 18, 0);
  const scoreY = barY + 12;
  const parText = `Par ${Math.max(5, Math.ceil(state.sky.target.starIds.length / 2))}`;

  ctx.save();
  ctx.shadowColor = 'rgba(110, 156, 255, 0.18)';
  ctx.shadowBlur = 18;
  roundedRect(ctx, barX, barY, barWidth, barHeight, 18);
  ctx.fillStyle = theme.panelBackground;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = theme.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  const logoX = barX + 20;
  const logoY = barY + 18;
  const logoSize = 34;
  if (logoImage && logoImage.complete) {
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
  } else {
    ctx.fillStyle = theme.accentGold;
    roundedRect(ctx, logoX, logoY, logoSize, logoSize, 10);
    ctx.fill();
    ctx.fillStyle = '#0b1220';
    ctx.font = `700 18px ${theme.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', logoX + logoSize / 2, logoY + logoSize / 2 + 1);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 28px ${theme.fontFamily}`;
  ctx.fillStyle = theme.hudText;
  ctx.fillText('STAR BRITE', logoX + logoSize + 16, barY + 27);

  roundedRect(ctx, scoreX, scoreY, scoreWidth, barHeight - 24, 14);
  ctx.fillStyle = 'rgba(18, 28, 47, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(146, 180, 255, 0.18)';
  ctx.stroke();

  const scoreText = `${state.moves}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 26px ${theme.fontFamily}`;
  ctx.fillStyle = theme.accentGold;
  ctx.fillText(scoreText, scoreX + 18, scoreY + 18);

  ctx.font = `600 11px ${theme.fontFamily}`;
  ctx.fillStyle = theme.hudMuted;
  ctx.fillText('moves', scoreX + 18, scoreY + 39);

  ctx.font = `700 18px ${theme.fontFamily}`;
  ctx.fillStyle = theme.hudText;
  ctx.fillText(parText, scoreX + 96, scoreY + 18);

  ctx.font = `600 11px ${theme.fontFamily}`;
  ctx.fillStyle = theme.hudMuted;
  ctx.fillText('goal', scoreX + 96, scoreY + 38);

  ctx.restore();
}
