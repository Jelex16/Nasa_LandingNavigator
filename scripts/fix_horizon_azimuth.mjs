/**
 * Correct the azimuth origin of the legacy SUNDIAL hybrid horizons.
 *
 * The reference pipeline `build_horizons.py` computed `pole_planar_north_angle`
 * as the direction toward the projected lunar south pole and then treated that
 * direction as north. For a southern site, that is geographic *south*. The
 * resulting 720-bin rows are therefore rotated by 180 degrees relative to the
 * compass azimuths returned by JPL Horizons / the local ephemeris engine.
 *
 * This script rotates each legacy polar horizon by 360 bins (180 degrees) so
 * bin 0 = true north, and updates the manifest hashes. It is idempotent: files
 * already carrying `azimuthCorrection` are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const dataDir = path.join(root, 'public', 'data');
const horizonDir = path.join(dataDir, 'horizon');
const legacyIds = ['site01', 'site04', 'site07', 'site11', 'site20', 'site23'];

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function rotate(values, shift) {
  const n = values.length;
  return values.map((_, index) => values[(index + shift) % n]);
}

const changed = [];
for (const id of legacyIds) {
  const file = path.join(horizonDir, `${id}.json`);
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (profile.azimuthCorrection) {
    console.log(`${id}: already corrected`);
    continue;
  }
  const shift = Math.round(profile.binCount / 2);
  profile.elevationsDegByHeight = profile.elevationsDegByHeight.map((row) => rotate(row, shift));
  profile.dominantDistanceKm = rotate(profile.dominantDistanceKm, shift);
  profile.sourceTier = rotate(profile.sourceTier, shift);
  profile.azimuthCorrection =
    'rotated +360 bins (+180 deg): source pipeline used the direction toward the lunar south pole as north; bin 0 is now true north / compass azimuth 0.';
  profile.notes = `${profile.notes} Azimuth origin corrected by +180 deg (360 bins) in this app: the source pipeline used the direction toward the lunar south pole as "north"; Horizons azimuths are compass north/east.`;
  fs.writeFileSync(file, JSON.stringify(profile));
  changed.push(id);
  const row = profile.elevationsDegByHeight[1];
  console.log(
    `${id}: rotated ${shift} bins; 2 m horizon min/mean/max ${Math.min(...row).toFixed(3)}/${(row.reduce((a, b) => a + b, 0) / row.length).toFixed(3)}/${Math.max(...row).toFixed(3)} deg`
  );
}

const manifestPath = path.join(dataDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const horizonIds = [...legacyIds, 'nobile_rim_1', 'haworth_rim'];
for (const id of horizonIds) {
  const relative = `horizon/${id}.json`;
  const absolute = path.join(dataDir, relative);
  if (!fs.existsSync(absolute)) continue;
  const bytes = fs.statSync(absolute).size;
  const hash = sha256(absolute);
  let entry = manifest.files.find((file) => file.path === relative);
  if (!entry) {
    entry = {
      path: relative,
      bytes,
      sha256: hash,
      source:
        id === 'nobile_rim_1' || id === 'haworth_rim'
          ? 'Regional LOLA 80 m/px; true-north azimuth'
          : 'SUNDIAL pipeline; NASA PGDA LOLA hybrid DEM; true-north azimuth correction',
      sourceUrl:
        id === 'nobile_rim_1' || id === 'haworth_rim'
          ? 'https://pgda.gsfc.nasa.gov/products/90'
          : 'https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/',
      generatedUtc: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    };
    manifest.files.push(entry);
  } else {
    entry.bytes = bytes;
    entry.sha256 = hash;
    entry.source = entry.source.includes('true-north')
      ? entry.source
      : `${entry.source}; true-north azimuth correction`;
  }
}
const extraPath = path.join(dataDir, 'sites-extra.json');
if (fs.existsSync(extraPath) && !manifest.files.some((file) => file.path === 'sites-extra.json')) {
  manifest.files.push({
    path: 'sites-extra.json',
    bytes: fs.statSync(extraPath).size,
    sha256: sha256(extraPath),
    source: 'Regional LOLA 80 m/px site metadata',
    sourceUrl: 'https://pgda.gsfc.nasa.gov/products/90',
    generatedUtc: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  });
}
manifest.version = '1.0.1';
manifest.generatedUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
manifest.transformations = manifest.transformations ?? [];
const correction = 'Azimuth origin corrected by +180 deg (360 bins) for all LOLA horizon rows: the source pipeline used the pole-facing direction as north, which is geographic south at the lunar south pole. Bin 0 = true north.';
if (!manifest.transformations.includes(correction)) manifest.transformations.push(correction);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Updated ${manifestPath}; corrected ${changed.length} legacy horizon files.`);
