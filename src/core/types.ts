// Shared domain types for the Starbrite game model.

export type StarId = string;
export type StarKind = 'member' | 'decoy';
export type GameStatus = 'playing' | 'won';

export interface Vec2 {
  x: number;
  y: number;
}

export interface StarDefinition {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface Constellation {
  id: string;
  name: string;
  stars: StarDefinition[];
  edges: Array<[string, string]>;
  aiGenerated?: boolean;
}

export interface NormalizedConstellation extends Constellation {
  centroid: Vec2;
  boundingRadius: number;
}

export interface SkyStar {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind: StarKind;
  constellationId?: string;
  localId?: string;
}

export interface PlacementInfo {
  rotation: number;
  scale: number;
  centerX: number;
  centerY: number;
}

export interface TargetView {
  constellationId: string;
  name: string;
  starIds: string[];
  edges: Array<[string, string]>;
  placement: PlacementInfo;
}

export interface SkyModel {
  seed: string;
  widthUnits: number;
  heightUnits: number;
  stars: SkyStar[];
  target: TargetView;
}

export interface GameState {
  seed: string;
  sky: SkyModel;
  selectedId: string | null;
  committed: Record<string, StarKind>;
  moves: number;
  status: GameStatus;
}

export type GameIntent =
  | { type: 'tapStar'; starId: string }
  | { type: 'tapEmpty' }
  | { type: 'newGame'; seed: string };

export interface HitCandidate {
  id: string;
  x: number;
  y: number;
  radius: number;
}
