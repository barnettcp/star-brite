// Load and validate constellation data from the public manifest.

import { normalizeConstellation, validateConstellation } from '../core/constellation';
import type { Constellation } from '../core/types';

export interface ManifestDescriptor {
  files: string[];
}

function getManifestFiles(manifest: unknown): string[] {
  if (Array.isArray(manifest)) {
    return manifest.filter((entry): entry is string => typeof entry === 'string');
  }

  if (manifest !== null && typeof manifest === 'object') {
    const record = manifest as Partial<ManifestDescriptor>;
    const files = Array.isArray(record.files) ? record.files : [];
    return files.filter((entry): entry is string => typeof entry === 'string');
  }

  return [];
}

export async function loadConstellations(basePath = '/constellations'): Promise<Constellation[]> {
  const manifestResponse = await fetch(`${basePath}/manifest.json`);
  if (!manifestResponse.ok) {
    throw new Error(`Unable to load constellation manifest from ${basePath}/manifest.json.`);
  }

  const manifest = await manifestResponse.json();
  const files = getManifestFiles(manifest);

  if (files.length === 0) {
    return [];
  }

  const allConstellations: Constellation[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const fileResponse = await fetch(`${basePath}/${file}`);
    if (!fileResponse.ok) {
      throw new Error(`Unable to load constellation file ${file}.`);
    }

    const record = (await fileResponse.json()) as { constellations?: unknown[] };
    const entries = Array.isArray(record.constellations) ? record.constellations : [];

    for (const entry of entries) {
      const constellation = normalizeConstellation(validateConstellation(entry));
      if (seenIds.has(constellation.id)) {
        throw new Error(`Duplicate constellation id encountered: ${constellation.id}`);
      }
      seenIds.add(constellation.id);
      allConstellations.push(constellation);
    }
  }

  return allConstellations;
}
