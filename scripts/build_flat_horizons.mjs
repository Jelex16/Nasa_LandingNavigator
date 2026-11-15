import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const HORIZON = path.join(DATA, 'horizon');
const catalog = JSON.parse(
  fs.readFileSync(path.join(DATA, 'sites-international.json'), 'utf8')
);

const BINS = 720;
const BIN_WIDTH = 0.5;
const HEIGHTS = [0.5, 2.0, 5.0, 10.0, 20.0];
const generatedUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const written = [];
for (const site of catalog.sites) {
  const record = {
    schemaVersion: 1,
    siteId: site.id,
    generatedUtc,
    provenance: 'analytic_flat',
    source: 'Analytic flat horizon (reference); no LOLA terrain at this location',
    sourceUrl: 'https://ssd.jpl.nasa.gov/horizons/',
    binCount: BINS,
    binWidthDeg: BIN_WIDTH,
    mastHeightsM: HEIGHTS,
    elevationsDegByHeight: HEIGHTS.map(() => Array(BINS).fill(0))
  };
  const file = path.join(HORIZON, `${site.id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(record)}\n`);
  written.push(path.relative(DATA, file));
}

console.log(JSON.stringify({ generatedUtc, written }, null, 2));
