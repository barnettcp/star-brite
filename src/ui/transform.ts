// World-to-screen transforms for the sky and card layout.

import type { SkyModel } from '../core/types';

export interface ScreenTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function getWorldTransform(sky: SkyModel, viewportWidth: number, viewportHeight: number): ScreenTransform {
  const scale = Math.min(viewportWidth / sky.widthUnits, viewportHeight / sky.heightUnits);
  return {
    scale,
    offsetX: (viewportWidth - sky.widthUnits * scale) / 2,
    offsetY: (viewportHeight - sky.heightUnits * scale) / 2,
  };
}

export function worldToScreen(x: number, y: number, transform: ScreenTransform): { x: number; y: number } {
  return { x: transform.offsetX + x * transform.scale, y: transform.offsetY + y * transform.scale };
}

export function getCardBox(viewportWidth: number, viewportHeight: number): { x: number; y: number; size: number } {
  const side = Math.min(viewportWidth, viewportHeight) * 0.28;
  const size = Math.min(Math.max(side, 120), 180);
  return {
    x: viewportWidth - size - 18,
    y: 18,
    size,
  };
}
