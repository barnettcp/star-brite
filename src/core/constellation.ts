// Validate and normalize authored constellation data.

import type { Constellation, NormalizedConstellation, Vec2 } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateConstellation(value: unknown): Constellation {
  if (value === null || typeof value !== 'object') {
    throw new Error('Constellation data must be an object.');
  }

  const candidate = value as Record<string, unknown>;
  const id = candidate.id;
  const name = candidate.name;
  const stars = candidate.stars;
  const edges = candidate.edges;

  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Constellation id is required.');
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Constellation name is required.');
  }
  if (!Array.isArray(stars) || stars.length < 2) {
    throw new Error(`Constellation ${id} must contain at least two stars.`);
  }
  if (!Array.isArray(edges)) {
    throw new Error(`Constellation ${id} must contain an edges array.`);
  }

  const seenStarIds = new Set<string>();
  const normalizedStars: Constellation['stars'] = [];

  for (const star of stars) {
    if (star === null || typeof star !== 'object') {
      throw new Error(`Constellation ${id} contains invalid star data.`);
    }

    const starCandidate = star as Record<string, unknown>;
    const starId = starCandidate.id;
    const x = starCandidate.x;
    const y = starCandidate.y;
    const size = starCandidate.size;

    if (typeof starId !== 'string' || starId.length === 0) {
      throw new Error(`Constellation ${id} contains a star without an id.`);
    }
    if (seenStarIds.has(starId)) {
      throw new Error(`Constellation ${id} contains duplicate star id ${starId}.`);
    }
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(size)) {
      throw new Error(`Constellation ${id} star ${starId} has non-finite coordinates or size.`);
    }
    if (size <= 0 || size > 5) {
      throw new Error(`Constellation ${id} star ${starId} has an out-of-range size.`);
    }

    seenStarIds.add(starId);
    normalizedStars.push({ id: starId, x, y, size });
  }

  const knownStarIds = new Set(normalizedStars.map((star) => star.id));
  const seenEdges = new Set<string>();
  const normalizedEdges: Array<[string, string]> = [];

  for (const edge of edges) {
    if (!Array.isArray(edge) || edge.length !== 2) {
      throw new Error(`Constellation ${id} has an invalid edge entry.`);
    }

    const [left, right] = edge as [unknown, unknown];
    if (typeof left !== 'string' || typeof right !== 'string') {
      throw new Error(`Constellation ${id} has a non-string edge endpoint.`);
    }
    if (!knownStarIds.has(left) || !knownStarIds.has(right)) {
      throw new Error(`Constellation ${id} edge references a missing star id.`);
    }
    if (left === right) {
      throw new Error(`Constellation ${id} contains a self-edge.`);
    }

    const sortedEdge = [left, right].sort();
    const key = `${sortedEdge[0]}::${sortedEdge[1]}`;
    if (seenEdges.has(key)) {
      throw new Error(`Constellation ${id} contains a duplicate edge.`);
    }
    seenEdges.add(key);
    normalizedEdges.push([left, right]);
  }

  return {
    id,
    name: String(name),
    stars: normalizedStars,
    edges: normalizedEdges,
    aiGenerated: Boolean(candidate.aiGenerated),
  };
}

export function normalizeConstellation(constellation: Constellation): NormalizedConstellation {
  const points: Vec2[] = constellation.stars.map((star) => ({ x: star.x, y: star.y }));
  const centroidX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const centroidY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const centroid = { x: centroidX, y: centroidY };

  let boundingRadius = 0;
  for (const point of points) {
    const dx = point.x - centroid.x;
    const dy = point.y - centroid.y;
    const distance = Math.hypot(dx, dy);
    if (distance > boundingRadius) {
      boundingRadius = distance;
    }
  }

  return {
    ...constellation,
    centroid,
    boundingRadius,
  };
}
