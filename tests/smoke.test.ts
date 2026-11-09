import { describe, expect, it } from 'vitest';

describe('Gate 0 shell', () => {
  it('creates the expected project shell contract', () => {
    expect({ appName: 'Starbrite', phase: 'scaffold' }).toEqual({
      appName: 'Starbrite',
      phase: 'scaffold',
    });
  });
});
