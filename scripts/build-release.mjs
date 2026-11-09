import { execSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicConstellationsPath = path.join(repoRoot, 'public', 'constellations');
const manifestPath = path.join(publicConstellationsPath, 'manifest.json');
const distConstellationsPath = path.join(repoRoot, 'dist', 'constellations');
const distManifestPath = path.join(distConstellationsPath, 'manifest.json');

execSync('npx vite build --emptyOutDir', { cwd: repoRoot, stdio: 'inherit' });

const manifestText = await readFile(manifestPath, 'utf8');
const manifest = JSON.parse(manifestText);
const files = Array.isArray(manifest?.files) ? manifest.files.filter((entry) => typeof entry === 'string') : [];
const distFiles = [];

await mkdir(distConstellationsPath, { recursive: true });

for (const file of files) {
  const sourcePath = path.join(publicConstellationsPath, file);
  const sourceText = await readFile(sourcePath, 'utf8');
  const sourceRecord = JSON.parse(sourceText);
  const constellations = Array.isArray(sourceRecord?.constellations) ? sourceRecord.constellations : [];
  const filteredConstellations = constellations.filter((item) => item && item.aiGenerated !== true);

  if (filteredConstellations.length === 0) {
    const distFilePath = path.join(distConstellationsPath, file);
    await rm(distFilePath, { force: true });
    continue;
  }

  const filteredRecord = { constellations: filteredConstellations };
  const distFilePath = path.join(distConstellationsPath, file);
  await writeFile(distFilePath, `${JSON.stringify(filteredRecord, null, 2)}\n`, 'utf8');
  distFiles.push(file);
}

const distManifest = { files: distFiles };
await writeFile(distManifestPath, `${JSON.stringify(distManifest, null, 2)}\n`, 'utf8');

console.log(`Release build written with ${distFiles.length} constellation files.`);
