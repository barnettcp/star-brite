import '../style.css';

import { generateSkyModel } from '../core/generate';
import { createGameState } from '../core/game';
import type { Constellation, GameState } from '../core/types';
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

const context = canvas.getContext('2d');
if (context === null) {
  throw new Error('Canvas 2D context is unavailable.');
}

const ctx = context;

const { sky } = generateSkyModel('demo-seed', [demoConstellation], 1280, 800);
let state: GameState = createGameState('demo-seed', sky);

function fitCanvas(): void {
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
}

window.addEventListener('resize', fitCanvas);
fitCanvas();
