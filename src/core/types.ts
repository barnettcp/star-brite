// Shared domain types for the Starbrite game model.

export type StarId = string;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Star {
  id: StarId;
  x: number;
  y: number;
  radius: number;
  weight: number;
}

export interface Constellation {
  id: string;
  name: string;
  stars: Star[];
  edges: Array<[number, number]>;
  aiGenerated?: boolean;
}
