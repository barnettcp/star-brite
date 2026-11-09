import '../style.css';

import { config } from '../core/config';
import { applyIntent, createGameState } from '../core/game';
import { generateSkyModel } from '../core/generate';
import type { Constellation, GameState } from '../core/types';
import { hitStarAt } from './input';
import { renderCard } from './renderCard';
import { renderHud } from './renderHud';
import { renderOverlay } from './overlay';
import { renderSky } from './renderSky';
import { getWorldTransform } from './transform';

const demoConstellation: Constellation = {
  id: 'demo-constellation',
  name: 'Aurora',
  stars: [
    { id: 'a', x: 0, y: 0, size: 2.2 },
    { id: 'b', x: 18, y: 8, size: 2.6 },
    { id: 'c', x: 32, y: 0, size: 2.4 },
    { id: 'd', x: 50, y: 20, size: 2 },
    { id: 'e', x: 26, y: 30, size: 2.8 },
  ],
  edges: [
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'd'],
    ['d', 'e'],
    ['e', 'a'],
  ],
};

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('App root not found.');
}

const canvas = document.createElement('canvas');
canvas.id = 'starbrite-canvas';
canvas.setAttribute('aria-label', 'Starbrite sky');
app.appendChild(canvas);

const newSkyButton = document.createElement('button');
newSkyButton.type = 'button';
newSkyButton.id = 'starbrite-new-sky';
newSkyButton.textContent = 'New sky';
newSkyButton.hidden = true;
app.appendChild(newSkyButton);

const context = canvas.getContext('2d');
if (context === null) {
  throw new Error('Canvas 2D context is unavailable.');
}

const ctx = context;

function generateState(seed: string): GameState {
  const { sky } = generateSkyModel(seed, [demoConstellation], window.innerWidth || 1280, window.innerHeight || 800);
  return createGameState(seed, sky);
}

let state: GameState = generateState('demo-seed');
let pointerStart: { x: number; y: number } | null = null;

function renderFrame(): void {
  const width = Math.max(document.documentElement.clientWidth || window.innerWidth, 1);
  const height = Math.max(document.documentElement.clientHeight || window.innerHeight, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const transform = getWorldTransform(state.sky, width, height);
  renderSky(ctx, state, transform, width, height);
  renderCard(ctx, state, width, height);
  renderHud(ctx, state, width);
  renderOverlay(ctx, state, width, height);

  newSkyButton.hidden = state.status !== 'won';
}

function newGame(seed = crypto.getRandomValues(new Uint32Array(1))[0].toString(36)) {
  state = generateState(seed);
  renderFrame();
}

canvas.addEventListener('pointerdown', (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener('pointerup', (event) => {
  if (!pointerStart) {
    return;
  }

  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;

  if (Math.hypot(dx, dy) > config.input.tapMovePx) {
    return;
  }

  const transform = getWorldTransform(state.sky, canvas.width / Math.min(window.devicePixelRatio || 1, 2), canvas.height / Math.min(window.devicePixelRatio || 1, 2));
  const hitId = hitStarAt(state, event.clientX, event.clientY, transform);
  state = applyIntent(state, hitId === null ? { type: 'tapEmpty' } : { type: 'tapStar', starId: hitId });
  renderFrame();
});

canvas.addEventListener('pointerleave', () => {
  pointerStart = null;
});

newSkyButton.addEventListener('click', () => newGame());
window.addEventListener('resize', renderFrame);
renderFrame();
