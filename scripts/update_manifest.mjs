import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const MANIFEST = path.join(DATA, 'manifest.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');

function walk(dir, prefix = '') {
  const entries = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      entries.push(...walk(path.join(dir, entry.name), `${relative}/`));
    } else if (relative !== 'manifest.json') {
      entries.push(relative);
    }
  }
  return entries;
}

function sourceFor(relative) {
  if (relative.startsWith('sweep/')) {
    const sweep = readJson(path.join(DATA, relative));
    return {
      source: 'Monthly launch-slip sweep (28-day windows) from LOLA horizons and JPL Horizons/IAU 2000 ephemerides',
      sourceUrl: 'https://ssd-api.jpl.nasa.gov/doc/horizons.html',
      generatedUtc: sweep.generatedUtc ?? iso(fs.statSync(path.join(DATA, relative)).mtimeMs)
    };
  }
  if (relative === 'sites-extra.json') {
    const extra = readJson(path.join(DATA, relative));
    return {
      source: 'Regional LOLA 80 m/px site metadata',
      sourceUrl: 'https://pgda.gsfc.nasa.gov/products/90',
      generatedUtc: extra.generatedUtc ?? iso(fs.statSync(path.join(DATA, relative)).mtimeMs)
    };
  }
  return {
    source: 'SUNDIAL pipeline; NASA PGDA LOLA data and JPL Horizons DE441',
    sourceUrl: 'https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/',
    generatedUtc: iso(fs.statSync(path.join(DATA, relative)).mtimeMs)
  };
}

const manifest = readJson(MANIFEST);
const previous = new Map((manifest.files ?? []).map((file) => [file.path, file]));
const actual = walk(DATA).sort();

const files = actual.map((relative) => {
  const fullPath = path.join(DATA, relative);
  const existing = previous.get(relative);
  const metadata = existing ?? sourceFor(relative);
  return {
    path: relative,
    bytes: fs.statSync(fullPath).size,
    sha256: sha256(fullPath),
    source: metadata.source,
    sourceUrl: metadata.sourceUrl,
    generatedUtc: metadata.generatedUtc
  };
});

const removed = [...previous.keys()].filter((relative) => !actual.includes(relative));
const added = actual.filter((relative) => !previous.has(relative));

const next = {
  ...manifest,
  version: manifest.version === '1.0.1' ? '1.0.2' : manifest.version,
  generatedUtc: iso(Date.now()),
  files
};

fs.writeFileSync(MANIFEST, `${JSON.stringify(next, null, 2)}\n`);
console.log(
  JSON.stringify(
    { files: files.length, added, removed, version: next.version, generatedUtc: next.generatedUtc },
    null,
    2
  )
);
