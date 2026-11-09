// Tunable defaults for generation, spacing, and interaction.

export const config = {
  sky: {
    widthUnits: 200,
    density: 2,
    edgeMarginUnits: 4,
  },
  decoys: {
    minDistanceUnits: 11,
    minDistanceFromMembersUnits: 11,
    enforceTapSpacing: true,
    sizeMin: 1,
    sizeMax: 3,
    sizeSkew: 1,
    maxAttemptsFactor: 30,
  },
  constellation: {
    baseSizeUnits: 60,
    scaleMin: 1,
    scaleMax: 1,
    randomRotation: true,
    maxPlacementAttempts: 200,
    shrinkFactor: 0.9,
    scaleFloor: 0.5,
  },
  stars: {
    radiusPerSizeUnits: 0.9,
    minDrawnRadiusPx: 2,
  },
  input: {
    hitRadiusPx: 22,
    tapMovePx: 10,
  },
  layout: {
    scoreZonePx: { width: 240, height: 96 },
    cardFraction: 0.28,
    cardMinPx: 120,
    cardMaxPx: 180,
    hudInsetPx: 12,
  },
  render: {
    maxDpr: 3,
  },
};

export type Config = typeof config;
