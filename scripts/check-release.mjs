import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  try {
    const fileStats = await stat(distRoot);
    if (!fileStats.isDirectory()) {
      console.error('Release check expected dist/ to exist.');
      process.exit(1);
    }

    const files = await walk(distRoot);
    const offenders = [];

    for (const file of files) {
      const buffer = await readFile(file);
      const text = buffer.toString('utf8');
      if (/(AI Generated)|("aiGenerated"\s*:\s*true)/i.test(text)) {
        offenders.push(file);
      }
    }

    if (offenders.length > 0) {
      console.error('AI-generated markers remain in release output:');
      for (const offender of offenders) {
        console.error(`- ${path.relative(repoRoot, offender)}`);
      }
      process.exit(1);
    }

    console.log('Release check passed: no AI-generated markers found in dist/.');
  } catch (error) {
    console.error('Release check failed: dist/ not built yet.');
    process.exit(1);
  }
}

await main();
