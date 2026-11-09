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

function createStream(seed: string, tag: string): () => number {
  let state = hashSeed(`${seed}:${tag}`) + 1;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): RngStreamSet {
  return {
    pick: createStream(seed, 'pick'),
    place: createStream(seed, 'place'),
    decoys: createStream(seed, 'decoys'),
  };
}
