import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { decodeEphemeris, sampleEphemeris } from '../src/ephemeris/jplEphemeris.js';
import { horizonElevationAt } from '../src/topography/lunarData.js';
import { evaluateSiteScenario } from '../src/analysis/sampling.js';
import { createCustomProfile } from '../src/analysis/scoring.js';

const DATA = new URL('../public/data/', import.meta.url);
const records = JSON.parse(readFileSync(new URL('sites.json', DATA), 'utf8')).sites;
const record = records.find((site) => site.id === 'site23');
const horizon = JSON.parse(readFileSync(new URL('horizon/site23.json', DATA), 'utf8'));
const buffer = readFileSync(new URL('ephem/site23.bin', DATA));
const ephem = decodeEphemeris(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
);

test('site23 ephemeris decodes with the expected header and Horizons values', () => {
  assert.equal(ephem.siteId, 'site23');
  assert.equal(ephem.stepHours, 1);
  assert.equal(ephem.count, 87649);

  const sample = sampleEphemeris(ephem, Date.UTC(2026, 10, 14, 0, 0, 0));
  assert.ok(Math.abs(sample.sun.azDeg - 126.8731) < 0.001);
  assert.ok(Math.abs(sample.sun.elDeg - -0.8468) < 0.001);
  assert.ok(Math.abs(sample.earth.azDeg - 359.0113) < 0.001);
  assert.ok(Math.abs(sample.earth.elDeg - -0.6451) < 0.001);
});

test('28-day Malapert regression matches the published metrics', () => {
  const site = {
    id: 'site23',
    name: 'Malapert Massif',
    role: 'candidate',
    lat: record.latDeg,
    lon: record.lonEastDeg,
    slopeDeg: record.slopeDeg,
    maxSlopeDeg: record.slopeDeg,
    optimalPanelAzimuthDeg: record.optimalPanelAzimuthDeg,
    dataQuality: 'LOLA 5 m/px + 80 m/px',
    horizonSource: 'lola_hybrid',
    ephemSource: 'jpl_horizons',
    isRealLola: true,
    mastHeightM: 2,
    horizon,
    ephem
  };
  site.horizonAt = (azimuthDeg, height = 2) =>
    horizonElevationAt(horizon, azimuthDeg, height);

  const analysis = evaluateSiteScenario({
    site,
    startMs: Date.UTC(2026, 10, 14, 0, 0, 0),
    mastHeightM: 2,
    panelType: 'vertical_tracker',
    profileId: 'technology_demo'
  });

  assert.equal(analysis.series.length, 672);
  assert.ok(Math.abs(analysis.metrics.sunlitPct - 49.7) < 0.05);
  assert.ok(Math.abs(analysis.metrics.dteCenterPct - 42.4) < 0.05);
  assert.ok(Math.abs(analysis.metrics.dMaxHours - 180) < 0.001);
  assert.ok(Math.abs(analysis.metrics.gMaxHours - 289) < 0.001);
  assert.ok(Math.abs(analysis.metrics.energyWhM2 - 423800) < 100);
  assert.equal(analysis.scorePercent, 48);
  assert.match(analysis.status, /NO-GO/);

  const custom = createCustomProfile({
    energyReqKWhM2: 0,
    dMaxTolHours: 1000,
    dteReqPct: 0,
    gMaxTolHours: 1000,
    strict: true
  });
  const customAnalysis = evaluateSiteScenario({
    site,
    startMs: Date.UTC(2026, 10, 14, 0, 0, 0),
    mastHeightM: 2,
    panelType: 'vertical_tracker',
    profileId: 'custom',
    profile: custom
  });
  assert.match(customAnalysis.status, /GO/);
  assert.equal(customAnalysis.profile.id, 'custom');
});
