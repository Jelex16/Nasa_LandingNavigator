import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');

const API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const AU_KM = 149_597_870.7;
const MAGIC = 'SUNEPH01';
const SCHEMA_VERSION = 1;
const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

const args = process.argv.slice(2);
const argValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const onlySites = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === '--site' && args[index + 1]) onlySites.push(args[index + 1]);
}
const startIso = argValue('--start') ?? '2026-01-01T00:00:00Z';
const endIso = argValue('--end') ?? '2036-01-01T00:00:00Z';
const stepHours = Number(argValue('--step-hours') ?? 1);
const chunkDays = Number(argValue('--chunk-days') ?? 366);
const pauseMs = Number(argValue('--pause-ms') ?? 300);
const outDir = path.resolve(ROOT, argValue('--out-dir') ?? path.join('public', 'data', 'ephem'));

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hhmm = (ms) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ');

function horizonsUrl(site, target, startMs, stopMs) {
  const params = new URLSearchParams({
    format: 'text',
    COMMAND: `'${target}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${site.lonEastDeg},${site.latDeg},${(site.elevationM ?? 0) / 1000}'`,
    START_TIME: `'${hhmm(startMs)}'`,
    STOP_TIME: `'${hhmm(stopMs)}'`,
    STEP_SIZE: `'${stepHours}h'`,
    QUANTITIES: "'4,20'",
    CSV_FORMAT: "'YES'",
    TIME_DIGITS: "'MINUTES'",
    EXTRA_PREC: "'YES'"
  });
  return `${API}?${params.toString()}`;
}

function parseDate(text) {
  const match = text.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return Date.UTC(Number(year), MONTHS[month], Number(day), Number(hour), Number(minute));
}

function parseRows(text) {
  const start = text.indexOf('$$SOE');
  const end = text.indexOf('$$EOE');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Respuesta sin bloque $$SOE/$$EOE: ${text.slice(-400)}`);
  }
  const rows = [];
  for (const line of text.slice(start + 6, end).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(',').map((field) => field.trim());
    const timeMs = parseDate(fields[0]);
    if (timeMs == null) throw new Error(`Fila no reconocida: ${trimmed}`);
    const numbers = fields
      .slice(1)
      .filter((field) => /^-?(?:\d+\.?\d*|\.\d+)(?:[Ee][+-]?\d+)?$/.test(field))
      .map(Number);
    if (numbers.length < 4) throw new Error(`Fila incompleta (${numbers.length} columnas): ${trimmed}`);
    const [azDeg, elDeg, delta, deldot] = numbers.slice(-4);
    rows.push({ timeMs, azDeg, elDeg, delta, deldot });
  }
  if (rows.length === 0) throw new Error('Bloque $$SOE vacío');
  return rows;
}

async function fetchHorizons(url, label) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'lua-navigator-ephemeris-builder/1.0' }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        const wait = 2_000 * attempt * attempt;
        console.warn(`  ${label}: ${error.message}; reintento ${attempt}/3 en ${wait / 1000}s`);
        await sleep(wait);
      }
    }
  }
  throw new Error(`${label}: ${lastError.message}`);
}

async function collectSeries(site, target, startMs, endMs) {
  const byTime = new Map();
  let chunkStart = startMs;
  while (chunkStart < endMs) {
    const chunkStop = Math.min(endMs, chunkStart + chunkDays * 86_400_000);
    const label = `${site.id} target ${target} ${hhmm(chunkStart)}..${hhmm(chunkStop)}`;
    const text = await fetchHorizons(horizonsUrl(site, target, chunkStart, chunkStop), label);
    for (const row of parseRows(text)) {
      if (row.timeMs >= startMs && row.timeMs <= endMs) byTime.set(row.timeMs, row);
    }
    chunkStart = chunkStop;
    await sleep(pauseMs);
  }

  const times = [...byTime.keys()].sort((a, b) => a - b);
  const expected = Math.round((endMs - startMs) / (stepHours * 3_600_000)) + 1;
  if (times.length !== expected) {
    throw new Error(`${site.id} target ${target}: ${times.length} muestras, se esperaban ${expected}`);
  }
  for (let i = 1; i < times.length; i += 1) {
    if (times[i] - times[i - 1] !== stepHours * 3_600_000) {
      throw new Error(
        `${site.id} target ${target}: hueco entre ${new Date(times[i - 1]).toISOString()} y ${new Date(times[i]).toISOString()}`
      );
    }
  }
  return {
    times,
    azDeg: Float32Array.from(times.map((time) => byTime.get(time).azDeg)),
    elDeg: Float32Array.from(times.map((time) => byTime.get(time).elDeg)),
    distance: Float64Array.from(times.map((time) => byTime.get(time).delta))
  };
}

function writeEphemeris(siteId, startMs, sun, earth) {
  const count = sun.times.length;
  const siteBytes = Buffer.from(siteId, 'utf8');
  const header = Buffer.alloc(34 + siteBytes.length);
  header.write(MAGIC, 0, 'ascii');
  header.writeUInt32LE(SCHEMA_VERSION, 8);
  header.writeUInt32LE(count, 12);
  header.writeDoubleLE(startMs, 16);
  header.writeDoubleLE(stepHours, 24);
  header.writeUInt16LE(siteBytes.length, 32);
  siteBytes.copy(header, 34);

  const arrays = [
    sun.azDeg,
    sun.elDeg,
    Float32Array.from(sun.distance),
    earth.azDeg,
    earth.elDeg,
    Float32Array.from(earth.distance, (delta) => delta * AU_KM)
  ];
  const payload = Buffer.alloc(count * arrays.length * 4);
  arrays.forEach((array, index) => {
    Buffer.from(array.buffer, array.byteOffset, count * 4).copy(payload, index * count * 4);
  });

  const file = path.join(outDir, `${siteId}.bin`);
  fs.writeFileSync(file, Buffer.concat([header, payload]));
  return { file, count, bytes: header.length + payload.length };
}

const sites = readJson(path.join(DATA, 'sites.json')).sites;
const jplSites = sites.filter(
  (record) =>
    ['site01', 'site04', 'site07', 'site11', 'site20', 'site23', 'control_eq'].includes(record.id) &&
    (onlySites.length === 0 || onlySites.includes(record.id))
);
if (jplSites.length === 0) {
  console.error('No hay sitios JPL para generar.');
  process.exit(1);
}

const startMs = Date.parse(startIso);
const endMs = Date.parse(endIso);
if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
  console.error(`Rango inválido: ${startIso} .. ${endIso}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
console.log(
  `Generando ${jplSites.length} efemérides ${new Date(startMs).toISOString()} .. ` +
    `${new Date(endMs).toISOString()} paso ${stepHours} h`
);

for (const site of jplSites) {
  const started = Date.now();
  const sun = await collectSeries(site, 10, startMs, endMs);
  const earth = await collectSeries(site, 399, startMs, endMs);
  const { file, count, bytes } = writeEphemeris(site.id, startMs, sun, earth);
  console.log(
    `${site.id}: ${count} muestras, ${(bytes / 1024 / 1024).toFixed(2)} MiB, ` +
      `${((Date.now() - started) / 1000).toFixed(1)} s -> ${path.relative(ROOT, file)}`
  );
}

console.log('Efemérides JPL generadas.');
