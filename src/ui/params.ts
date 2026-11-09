// Query-string helpers for UI tuning and seed overrides.

import { config, type Config } from '../core/config';

export function parseQueryParams(search = window.location.search): Record<string, string> {
  const params = new URLSearchParams(search);
  const entries: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    entries[key] = value;
  }

  return entries;
}

export function getRuntimeConfigOverrides(search = window.location.search): Partial<Config> {
  const params = parseQueryParams(search);
  const overrides: Partial<Config> = {};

  const widthUnits = Number(params.w);
  if (Number.isFinite(widthUnits) && widthUnits > 0) {
    overrides.sky = { ...config.sky, widthUnits };
  }

  const density = Number(params.d);
  if (Number.isFinite(density) && density > 0) {
    overrides.sky = { ...(overrides.sky ?? config.sky), density };
  }

  if (params.rot === '0') {
    overrides.constellation = { ...config.constellation, randomRotation: false };
  }

  return overrides;
}

export function getSeedFromSearch(search = window.location.search): string {
  const params = parseQueryParams(search);
  const seed = params.seed;

  if (typeof seed === 'string' && seed.trim().length > 0) {
    return seed;
  }

  return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
}

export function getConstellationOverride(search = window.location.search): string | null {
  const params = parseQueryParams(search);
  const candidate = params.c;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate.trim() : null;
}
