// Seeded random number generation with named streams.

export interface RngStreamSet {
  pick: () => number;
  place: () => number;
  decoys: () => number;
}

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: string): RngStreamSet {
  const base = hashSeed(seed);

  const pick = () => {
    const value = Math.sin(base * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  };

  const place = () => {
    const value = Math.sin(base * 25.123 + 11.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const decoys = () => {
    const value = Math.sin(base * 34.5 + 91.9) * 43758.5453;
    return value - Math.floor(value);
  };

  return { pick, place, decoys };
}
