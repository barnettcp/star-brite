// Vector, rotation, and scaling helpers for pure world math.

export interface Point2D {
  x: number;
  y: number;
}

export function distanceSquared(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt(distanceSquared(a, b));
}

export function rotatePoint(point: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function scalePoint(point: Point2D, scale: number): Point2D {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

export function translatePoint(point: Point2D, offset: Point2D): Point2D {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

export function centroid(points: readonly Point2D[]): Point2D {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
