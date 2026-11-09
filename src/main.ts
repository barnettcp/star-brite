import './style.css';

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

function renderSky(renderContext: CanvasRenderingContext2D, width: number, height: number): void {
  renderContext.clearRect(0, 0, width, height);
  renderContext.fillStyle = '#020b1a';
  renderContext.fillRect(0, 0, width, height);

  renderContext.fillStyle = '#8ad4ff';
  renderContext.textAlign = 'center';
  renderContext.textBaseline = 'middle';
  renderContext.font = '600 28px sans-serif';
  renderContext.fillText('Starbrite', width / 2, height / 2);
}

function fitCanvas(): void {
  const width = Math.max(document.documentElement.clientWidth || window.innerWidth, 1);
  const height = Math.max(document.documentElement.clientHeight || window.innerHeight, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  renderSky(ctx, width, height);
}

window.addEventListener('resize', fitCanvas);
fitCanvas();
