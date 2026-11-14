import '../style.css';

import { config } from '../core/config';
import { applyIntent, createGameState } from '../core/game';
import { generateSkyModel } from '../core/generate';
import type { Constellation, GameState } from '../core/types';
import { loadConstellations } from '../data/load';
import { hitStarAt } from './input';
import { getConstellationOverride, getDebugFlags, getRuntimeConfigOverrides, getSeedFromSearch } from './params';
import { renderCard } from './renderCard';
import { renderHud } from './renderHud';
import { renderOverlay } from './overlay';
import { renderSky } from './renderSky';
import { getWorldTransform } from './transform';

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

const constellationToggle = document.createElement('button');
constellationToggle.type = 'button';
constellationToggle.id = 'starbrite-toggle-constellation';
constellationToggle.hidden = true;
constellationToggle.setAttribute('aria-pressed', 'false');
app.appendChild(constellationToggle);

const context = canvas.getContext('2d');
if (context === null) {
  throw new Error('Canvas 2D context is unavailable.');
}

const ctx = context;
const startupSeed = getSeedFromSearch();
const forcedConstellationId = getConstellationOverride();
const debugFlags = getDebugFlags();
let constellationPool: Constellation[] = [];
let loadingError: string | null = null;
let state: GameState | null = null;
let pointerStart: { x: number; y: number } | null = null;
let highlightConstellation = debugFlags.highlightConstellation;

function generateState(seed: string, constellations: Constellation[]): GameState {
  const { sky } = generateSkyModel(
    seed,
    constellations,
    window.innerWidth || 1280,
    window.innerHeight || 800,
    getRuntimeConfigOverrides(),
  );
  return createGameState(seed, sky);
}

function renderLoadingMessage(message: string): void {
  const width = Math.max(document.documentElement.clientWidth || window.innerWidth, 1);
  const height = Math.max(document.documentElement.clientHeight || window.innerHeight, 1);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#091728';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#eaf3ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 28px sans-serif';
  ctx.fillText('Starbrite', width / 2, height / 2 - 20);
  ctx.font = '400 18px sans-serif';
  ctx.fillText(message, width / 2, height / 2 + 20);
}

function updateConstellationToggle(): void {
  constellationToggle.textContent = highlightConstellation ? 'Hide debug highlight' : 'Highlight constellation';
  constellationToggle.setAttribute('aria-pressed', String(highlightConstellation));
}

function logConstellationPlacement(currentState: GameState): void {
  const members = currentState.sky.stars.filter((star) => star.kind === 'member');
  if (members.length === 0) {
    return;
  }

  console.groupCollapsed(`Constellation placement: ${currentState.sky.target.constellationId}`);
  console.log('seed', currentState.seed);
  console.log('placement', { ...currentState.sky.target.placement, center: { x: currentState.sky.target.placement.centerX, y: currentState.sky.target.placement.centerY } });
  console.table(members.map((star) => ({
    id: star.localId ?? star.id,
    x: Number(star.x.toFixed(3)),
    y: Number(star.y.toFixed(3)),
    radius: Number(star.radius.toFixed(3)),
  })));
  console.groupEnd();
}

function renderFrame(): void {
  const width = Math.max(document.documentElement.clientWidth || window.innerWidth, 1);
  const height = Math.max(document.documentElement.clientHeight || window.innerHeight, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, Math.min(config.render.maxDpr, 2));

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (loadingError !== null || state === null) {
    renderLoadingMessage(loadingError ?? 'Loading constellations...');
    newSkyButton.hidden = true;
    constellationToggle.hidden = !debugFlags.debugEnabled;
    return;
  }

  const transform = getWorldTransform(state.sky, width, height);
  renderSky(ctx, state, transform, width, height, highlightConstellation);
  renderCard(ctx, state, width, height);
  renderHud(ctx, state, width);
  renderOverlay(ctx, state, width, height);

  updateConstellationToggle();
  newSkyButton.hidden = state.status !== 'won';
  constellationToggle.hidden = !debugFlags.debugEnabled;
}

function newGame(seed = getSeedFromSearch()) {
  if (constellationPool.length === 0) {
    loadingError = 'No constellations available. Check the manifest and data files.';
    state = null;
    renderFrame();
    return;
  }

  const pool = forcedConstellationId !== null
    ? constellationPool.filter((constellation) => constellation.id === forcedConstellationId)
    : constellationPool;

  if (pool.length === 0) {
    loadingError = `Constellation ${forcedConstellationId} was not found.`;
    state = null;
    renderFrame();
    return;
  }

  state = generateState(seed, pool);
  if (debugFlags.logPlacement) {
    logConstellationPlacement(state);
  }
  renderFrame();
}

canvas.addEventListener('pointerdown', (event) => {
  if (state === null) {
    return;
  }
  pointerStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener('pointerup', (event) => {
  if (state === null || !pointerStart) {
    return;
  }

  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  pointerStart = null;

  if (Math.hypot(dx, dy) > config.input.tapMovePx) {
    return;
  }

  const transform = getWorldTransform(
    state.sky,
    canvas.width / Math.min(window.devicePixelRatio || 1, Math.min(config.render.maxDpr, 2)),
    canvas.height / Math.min(window.devicePixelRatio || 1, Math.min(config.render.maxDpr, 2)),
  );
  const hitId = hitStarAt(state, event.clientX, event.clientY, transform);
  state = applyIntent(state, hitId === null ? { type: 'tapEmpty' } : { type: 'tapStar', starId: hitId });
  renderFrame();
});

canvas.addEventListener('pointerleave', () => {
  pointerStart = null;
});

newSkyButton.addEventListener('click', () => newGame(getSeedFromSearch()));
constellationToggle.addEventListener('click', () => {
  highlightConstellation = !highlightConstellation;
  updateConstellationToggle();
  renderFrame();
});
window.addEventListener('resize', renderFrame);

void (async () => {
  try {
    constellationPool = await loadConstellations();
    if (constellationPool.length === 0) {
      loadingError = 'No constellations are available. Add entries to public/constellations/manifest.json.';
    } else if (forcedConstellationId !== null && !constellationPool.some((constellation) => constellation.id === forcedConstellationId)) {
      loadingError = `The constellation ${forcedConstellationId} does not exist in the loaded pool.`;
    } else {
      loadingError = null;
      newGame(startupSeed);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown constellation loading error.';
    loadingError = `Unable to load constellations: ${message}`;
  }

  renderFrame();
})();

renderFrame();
