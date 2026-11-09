import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'public', 'constellations', 'manifest.json');
const distManifestPath = path.join(repoRoot, 'dist', 'constellations', 'manifest.json');

execSync('npx vite build --emptyOutDir', { cwd: repoRoot, stdio: 'inherit' });

const manifestText = await readFile(manifestPath, 'utf8');
const entries = JSON.parse(manifestText);
const filtered = Array.isArray(entries)
  ? entries.filter((item) => item && item.aiGenerated !== true)
  : [];

await mkdir(path.dirname(distManifestPath), { recursive: true });
await writeFile(distManifestPath, `${JSON.stringify(filtered, null, 2)}\n`, 'utf8');

console.log(`Release build written with ${filtered.length} constellation entries.`);
