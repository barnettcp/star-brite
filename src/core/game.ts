// Gameplay state transitions and intent handling for the core model.

import type { GameIntent, GameState, SkyModel, StarKind } from './types';

export function createGameState(seed: string, sky: SkyModel): GameState {
  return {
    seed,
    sky,
    selectedId: null,
    committed: {},
    moves: 0,
    status: 'playing',
  };
}

export function isMemberFound(state: GameState, starId: string): boolean {
  return state.committed[starId] === 'member';
}

export function allMembersFound(state: GameState): boolean {
  for (const star of state.sky.stars) {
    if (star.kind === 'member' && state.committed[star.id] !== 'member') {
      return false;
    }
  }
  return true;
}

export function getVisibleEdges(state: GameState): Array<[string, string]> {
  const visible: Array<[string, string]> = [];
  for (const [first, second] of state.sky.target.edges) {
    if (state.committed[first] === 'member' && state.committed[second] === 'member') {
      visible.push([first, second]);
    }
  }
  return visible;
}

export function applyIntent(state: GameState, intent: GameIntent): GameState {
  if (intent.type === 'newGame') {
    return createGameState(intent.seed, state.sky);
  }

  if (intent.type === 'tapEmpty') {
    if (state.status === 'won') {
      return state;
    }
    return {
      ...state,
      selectedId: null,
    };
  }

  if (state.status === 'won') {
    return state;
  }

  const targetStar = state.sky.stars.find((star) => star.id === intent.starId);
  if (!targetStar) {
    return state;
  }

  if (state.committed[intent.starId] !== undefined) {
    return state;
  }

  if (state.selectedId === intent.starId) {
    const committed: Record<string, StarKind> = { ...state.committed, [intent.starId]: targetStar.kind };
    const nextMoves = state.moves + 1;
    const nextState: GameState = {
      ...state,
      committed,
      moves: nextMoves,
      selectedId: null,
      status: allMembersFound({ ...state, committed, moves: nextMoves }) ? 'won' : 'playing',
    };
    return nextState;
  }

  if (state.selectedId !== null && state.selectedId !== intent.starId) {
    return {
      ...state,
      selectedId: intent.starId,
    };
  }

  return {
    ...state,
    selectedId: intent.starId,
  };
}
