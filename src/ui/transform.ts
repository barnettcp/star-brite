// World-to-screen transforms for the sky and card layout.

import type { SkyModel } from '../core/types';

export interface ScreenTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function getWorldTransform(sky: SkyModel, viewportWidth: number, viewportHeight: number): ScreenTransform {
  const reservedTop = 84;
  const reservedBottom = 24;
  const reservedLeft = 20;
  const reservedRight = Math.min(Math.max(viewportWidth * 0.24, 180), 260);
  const usableWidth = Math.max(viewportWidth - reservedLeft - reservedRight, viewportWidth * 0.62);
  const usableHeight = Math.max(viewportHeight - reservedTop - reservedBottom, viewportHeight * 0.68);
  const scale = Math.min(usableWidth / sky.widthUnits, usableHeight / sky.heightUnits);

  return {
    scale,
    offsetX: reservedLeft + (usableWidth - sky.widthUnits * scale) / 2,
    offsetY: reservedTop + (usableHeight - sky.heightUnits * scale) / 2,
  };
}

export function worldToScreen(x: number, y: number, transform: ScreenTransform): { x: number; y: number } {
  return { x: transform.offsetX + x * transform.scale, y: transform.offsetY + y * transform.scale };
}

export function getCardBox(viewportWidth: number, viewportHeight: number): { x: number; y: number; size: number } {
  const side = Math.min(viewportWidth, viewportHeight) * 0.24;
  const size = Math.min(Math.max(side, 150), 210);
  const topBarHeight = 76;
  const gap = 24;
  return {
    x: Math.max(18, viewportWidth - size - 22),
    y: topBarHeight + gap + 18,
    size,
  };
}
