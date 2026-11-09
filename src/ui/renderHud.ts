// Render the HUD score and par labels.

import type { GameState } from '../core/types';
import { theme } from './theme';

export function renderHud(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  viewportWidth: number,
): void {
  const left = 18;
  const top = 18;
  const scoreText = `${state.moves}`;
  const parText = `par ${Math.max(5, Math.ceil(state.sky.target.starIds.length / 2))}`;

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.hudText;
  ctx.font = `600 34px ${theme.fontFamily}`;
  ctx.fillText(scoreText, left, top);

  ctx.font = `500 14px ${theme.fontFamily}`;
  const movesWidth = ctx.measureText('Moves').width;
  ctx.fillText('Moves', left + 8, top + 38);
  const parX = Math.min(left + movesWidth + 18, viewportWidth * 0.35);
  ctx.fillText(parText, parX, top + 40);
  ctx.restore();
}
