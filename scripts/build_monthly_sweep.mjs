import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { horizonElevationAt } from '../src/topography/lunarData.js';
import { decodeEphemeris, ephemerisEndUtcMs } from '../src/ephemeris/jplEphemeris.js';
import { evaluateSiteScenario, sampleSite } from '../src/analysis/sampling.js';
import {
  makeSky,
  panelAzimuthFor,
  panelIrradianceWm2,
  PANELS,
  STEP_HOURS,
  WINDOW_DAYS
} from '../src/analysis/scoring.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'public', 'data');
const MAST_M = 2;
const PANEL = 'vertical_tracker';
const PROFILE = 'technology_demo';
const SAMPLE_COUNT = (WINDOW_DAYS * 24) / STEP_HOURS;

const REFERENCE_EPHEM_IDS = new Set([
  'site01', 'site04', 'site07', 'site11', 'site20', 'site23', 'control_eq'
]);

const args = process.argv.slice(2);
const argValue = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const onlySite = argValue('--site');
const selfCheck = args.includes('--self-check');
const outDir = path.resolve(ROOT, argValue('--out-dir') ?? path.join('public', 'data', 'sweep'));

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readArrayBuffer = (file) => {
  const buffer = fs.readFileSync(file);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};
const iso = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
const round1 = (value) => Math.round(value * 10) / 10;
const round2 = (value) => Math.round(value * 100) / 100;

function dataQualityFor(record) {
  if (record.dataQuality) return record.dataQuality;
  if (record.horizonMode === 'lola_hybrid') return 'LOLA 5 m/px + 80 m/px';
  if (record.horizonMode === 'lola_regional_80m') return 'LOLA 80 m/px regional';
  if (record.horizonMode === 'analytic_flat') return 'Horizonte analítico';
  return 'Aproximado';
}

function adaptSite(record, horizon) {
  const site = {
    ...record,
    id: record.id,
    name: record.name,
    role: record.role ?? (record.id === 'control_eq' ? 'reference' : 'candidate'),
    lat: record.latDeg,
    lon: record.lonEastDeg,
    elevationKm: (record.elevationM ?? 0) / 1000,
    elevationM: record.elevationM ?? 0,
    maxSlopeDeg: record.slopeDeg ?? 0,
    optimalPanelAzimuthDeg: record.optimalPanelAzimuthDeg ?? 0,
    dataQuality: dataQualityFor(record),
    horizonSource: record.horizonSource ?? record.horizonMode ?? 'unknown',
    ephemSource:
      record.ephemSource ??
      (REFERENCE_EPHEM_IDS.has(record.id) ? 'jpl_horizons' : 'iau2000_local'),
    mastHeightM: MAST_M,
    horizon,
    ephem: null
  };
  site.horizonAt = (azimuthDeg, height = site.mastHeightM) =>
    site.horizon ? horizonElevationAt(site.horizon, azimuthDeg, height) : 0;
  site.horizonProfile = (azimuthDeg) => site.horizonAt(azimuthDeg, site.mastHeightM);
  return site;
}

function monthlyStarts() {
  const starts = [];
  for (let year = 2026; year <= 2028; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      starts.push(Date.UTC(year, month, 1, 0, 0, 0));
    }
  }
  return starts;
}

function energyKWhM2ByPanel(site, series) {
  const result = {};
  for (const panelType of Object.keys(PANELS)) {
    const panelAzimuthDeg = panelAzimuthFor(site, panelType);
    let energyWhM2 = 0;
    for (const point of series) {
      energyWhM2 +=
        panelIrradianceWm2(
          panelType,
          point.sunAz,
          point.sunEl,
          point.sunDistance,
          point.sunVisibleFraction,
          panelAzimuthDeg
        ) * STEP_HOURS;
    }
    result[panelType] = round1(energyWhM2 / 1000);
  }
  return result;
}

function firstEarthset(series, site, sampleAt) {
  const earthVisibleAtStart = Boolean(series[0]?.dteCenter);
  let previous = earthVisibleAtStart;
  for (let i = 1; i < series.length; i += 1) {
    const current = series[i].dteCenter;
    if (current === previous) continue;
    if (previous && !current) {
      let lo = series[i - 1].timeMs;
      let hi = series[i].timeMs;
      for (let step = 0; step < 8; step += 1) {
        const mid = (lo + hi) / 2;
        const bodies = sampleAt(mid);
        const visible = bodies ? makeSky(site, bodies, MAST_M).dteCenter : true;
        if (visible) lo = mid;
        else hi = mid;
      }
      return { earthVisibleAtStart, earthsetMs: hi };
    }
    previous = current;
  }
  return { earthVisibleAtStart, earthsetMs: null };
}

function assertFinite(value, label) {
  if (!Number.isFinite(value)) throw new Error(`Valor no finito en ${label}: ${value}`);
}

function buildPoint(site, startMs, sampleAt) {
  const analysis = evaluateSiteScenario({
    site,
    startMs,
    mastHeightM: MAST_M,
    panelType: PANEL,
    profileId: PROFILE,
    stepHours: STEP_HOURS,
    windowDays: WINDOW_DAYS
  });
  const metrics = analysis.metrics;
  const energy = energyKWhM2ByPanel(site, analysis.series);
  const defaultEnergy = round1(metrics.energyWhM2 / 1000);
  if (Math.abs(energy[PANEL] - defaultEnergy) > 0.2) {
    throw new Error(
      `Energía inconsistente para ${site.id} ${iso(startMs)}: ` +
        `panel=${energy[PANEL]} kWh/m², analysis=${defaultEnergy} kWh/m²`
    );
  }
  const { earthVisibleAtStart, earthsetMs } = firstEarthset(analysis.series, site, sampleAt);
  const point = {
    startUtc: iso(startMs),
    energyKWhM2ByPanel: energy,
    sunlitPct: round1(metrics.sunlitPct),
    dMaxHours: round1(metrics.dMaxHours),
    dteCenterPct: round1(metrics.dteCenterPct),
    dtePartialPct: round1(metrics.dtePartialPct),
    gMaxHours: round1(metrics.gMaxHours),
    earthVisibleAtStart,
    earthsetUtc: earthsetMs == null ? null : iso(earthsetMs),
    earthsetHoursFromStart: earthsetMs == null ? null : round2((earthsetMs - startMs) / 3_600_000)
  };
  assertFinite(point.sunlitPct, 'sunlitPct');
  assertFinite(point.dMaxHours, 'dMaxHours');
  assertFinite(point.dteCenterPct, 'dteCenterPct');
  assertFinite(point.dtePartialPct, 'dtePartialPct');
  assertFinite(point.gMaxHours, 'gMaxHours');
  for (const [panel, value] of Object.entries(point.energyKWhM2ByPanel)) {
    assertFinite(value, `energyKWhM2ByPanel.${panel}`);
  }
  return point;
}

function validateSweep(sweep) {
  if (sweep.points.length !== 36) {
    throw new Error(`${sweep.siteId}: se esperaban 36 puntos, hay ${sweep.points.length}`);
  }
  let previous = 0;
  for (const point of sweep.points) {
    const startMs = Date.parse(point.startUtc);
    if (!Number.isFinite(startMs) || startMs <= previous) {
      throw new Error(`${sweep.siteId}: fechas no crecientes en ${point.startUtc}`);
    }
    previous = startMs;
    if (point.earthsetHoursFromStart != null) {
      if (point.earthsetHoursFromStart < 0 || point.earthsetHoursFromStart > SAMPLE_COUNT * STEP_HOURS) {
        throw new Error(`${sweep.siteId}: Earthset fuera de ventana en ${point.startUtc}`);
      }
    }
  }
}

function selfCheckPoint(site, point, sampleAt) {
  const analysis = evaluateSiteScenario({
    site,
    startMs: Date.parse(point.startUtc),
    mastHeightM: MAST_M,
    panelType: PANEL,
    profileId: PROFILE,
    stepHours: STEP_HOURS,
    windowDays: WINDOW_DAYS
  });
  const expected = [
    ['energy', analysis.metrics.energyWhM2 / 1000, point.energyKWhM2ByPanel[PANEL], 0.2],
    ['dMaxHours', analysis.metrics.dMaxHours, point.dMaxHours, 0.05],
    ['gMaxHours', analysis.metrics.gMaxHours, point.gMaxHours, 0.05],
    ['dteCenterPct', analysis.metrics.dteCenterPct, point.dteCenterPct, 0.15]
  ];
  for (const [label, actual, stored, tolerance] of expected) {
    if (Math.abs(actual - stored) > tolerance) {
      throw new Error(
        `${site.id} self-check ${label}: actual=${actual}, stored=${stored}`
      );
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });

const catalog = readJson(path.join(DATA, 'sites.json'));
const extra = readJson(path.join(DATA, 'sites-extra.json'));
const international = readJson(path.join(DATA, 'sites-international.json'));
const records = [
  ...catalog.sites,
  ...extra.sites,
  ...international.sites
].filter((record) => (onlySite ? record.id === onlySite : true));
if (records.length === 0) {
  console.error(`No hay sitios para el filtro --site ${onlySite}`);
  process.exitCode = 1;
}

const starts = monthlyStarts();
const generatedUtc = iso(Date.now());
let failures = 0;

for (const record of records) {
  const started = Date.now();
  try {
    const horizonRelative = record.horizonFile ?? `horizon/${record.id}.json`;
    const horizon = readJson(path.join(DATA, horizonRelative));
    const site = adaptSite(record, horizon);
    if (site.ephemSource === 'jpl_horizons') {
      const ephemFile = path.join(DATA, 'ephem', `${site.id}.bin`);
      if (!fs.existsSync(ephemFile)) {
        throw new Error(`Falta ${ephemFile}`);
      }
      site.ephem = decodeEphemeris(readArrayBuffer(ephemFile));
    }
    const sampleAt = (ms) => sampleSite(site, ms);
    const endMs = site.ephem ? ephemerisEndUtcMs(site.ephem) : Date.UTC(2029, 1, 1);
    const points = [];
    for (const startMs of starts) {
      const lastSampleMs = startMs + (SAMPLE_COUNT - 1) * STEP_HOURS * 3_600_000;
      if (lastSampleMs > endMs) {
        throw new Error(`${site.id}: ventana fuera de cobertura en ${iso(startMs)}`);
      }
      points.push(buildPoint(site, startMs, sampleAt));
    }
    const sweep = {
      schemaVersion: 1,
      kind: 'monthly-date-sweep',
      generatedUtc,
      siteId: site.id,
      siteName: site.name,
      role: site.role,
      ephemSource: site.ephemSource,
      horizonSource: site.horizonSource,
      dataQuality: site.dataQuality,
      assumptions: {
        windowDays: WINDOW_DAYS,
        stepHours: STEP_HOURS,
        sampleCount: SAMPLE_COUNT,
        mastHeightM: MAST_M,
        panelType: PANEL,
        profileId: PROFILE,
        shadowThreshold: 0.05
      },
      coverage: {
        startUtc: iso(starts[0]),
        lastWindowStartUtc: iso(starts[starts.length - 1]),
        ephemEndUtc: iso(endMs)
      },
      points
    };
    validateSweep(sweep);
    if (selfCheck) selfCheckPoint(site, points[0], sampleAt);
    const output = path.join(outDir, `${site.id}.json`);
    fs.writeFileSync(output, JSON.stringify(sweep));
    const energy = points.map((point) => point.energyKWhM2ByPanel[PANEL]);
    const dte = points.map((point) => point.dteCenterPct);
    const cut = points.map((point) => point.gMaxHours);
    console.log(
      `${site.id}: ${points.length}/36 ventanas, ` +
        `energía ${Math.min(...energy).toFixed(1)}–${Math.max(...energy).toFixed(1)} kWh/m², ` +
        `DTE ${Math.min(...dte).toFixed(1)}–${Math.max(...dte).toFixed(1)}%, ` +
        `corte ${Math.min(...cut).toFixed(1)}–${Math.max(...cut).toFixed(1)} h, ` +
        `${((Date.now() - started) / 1000).toFixed(1)} s -> ${path.relative(ROOT, output)}`
    );
  } catch (error) {
    failures += 1;
    console.error(`${record.id}: ${error.message}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} sitio(s) fallaron.`);
  process.exitCode = 1;
} else {
  console.log('\nBarrido mensual generado.');
}
