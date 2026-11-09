// Render the win overlay for the completed constellation.

import type { GameState } from '../core/types';
import { theme } from './theme';

export function renderOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewportWidth: number,
  viewportHeight: number,
): void {
  if (state.status !== 'won') {
    return;
  }

  const panelWidth = Math.min(viewportWidth * 0.68, 420);
  const panelHeight = 140;
  const x = (viewportWidth - panelWidth) / 2;
  const y = (viewportHeight - panelHeight) / 2;

  ctx.save();
  ctx.fillStyle = theme.overlayScrim;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.fillStyle = 'rgba(7, 16, 33, 0.9)';
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x, y, panelWidth, panelHeight);
  ctx.strokeRect(x, y, panelWidth, panelHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.hudText;
  ctx.font = `700 28px ${theme.fontFamily}`;
  ctx.fillText(state.sky.target.name, viewportWidth / 2, y + 42);

  ctx.font = `500 18px ${theme.fontFamily}`;
  ctx.fillText(`Moves ${state.moves} · Par 5`, viewportWidth / 2, y + 78);

  ctx.font = `500 14px ${theme.fontFamily}`;
  ctx.fillText(`Seed ${state.seed}`, viewportWidth / 2, y + 104);
  ctx.restore();
}
