import test from 'node:test';
import assert from 'node:assert/strict';

import {
  comparisonToCsv,
  scenarioToJson,
  sweepToCsv,
  toCsv
} from '../src/export.js';
import { PROFILE_BY_ID } from '../src/analysis/scoring.js';

test('toCsv escapes commas, quotes and newlines', () => {
  assert.equal(
    toCsv([['a', 'b,c', 'q"x', 'line\nbreak']]),
    'a,"b,c","q""x","line\nbreak"'
  );
});

test('scenarioToJson serializes the site, profile, panel and series', () => {
  const analysis = {
    site: {
      id: 'site23',
      name: 'Malapert Massif',
      shortName: 'Malapert',
      role: 'candidate',
      programKey: 'program.artemis3',
      descriptionKey: 'description.site23',
      lat: -85.9948,
      lon: 359.7642,
      elevationKm: 4.7836,
      maxSlopeDeg: 5.028,
      horizonSource: 'lola_hybrid',
      ephemSource: 'jpl_horizons'
    },
    startMs: Date.UTC(2026, 10, 14),
    panelType: 'vertical_tracker',
    panelAzimuthDeg: 0,
    mastHeightM: 2,
    profile: {
      id: 'technology_demo',
      nameKey: 'profile.technology_demo.name',
      descriptionKey: 'profile.technology_demo.description'
    },
    metrics: {
      windowDays: 28,
      stepHours: 1,
      sampleCount: 672,
      energyWhM2: 423800,
      dMaxHours: 180,
      dteCenterPct: 42.4,
      dtePartialPct: 46.9,
      gMaxHours: 289,
      sunlitPct: 49.7
    },
    components: { energy: 1, dark: 0, dte: 0.7, comms: 0 },
    scorePercent: 48,
    status: 'NO-GO - UNSAFE',
    statusText: 'test',
    series: [
      {
        timeMs: Date.UTC(2026, 10, 14),
        sunAz: 126,
        sunEl: -0.8,
        earthAz: 359,
        earthEl: -0.6,
        sunHorizon: -1.7,
        earthHorizon: 4.35,
        sunVisibleFraction: 1,
        earthVisibleFraction: 1,
        sunlit: true,
        dteCenter: false,
        energyWm2: 1394
      }
    ]
  };

  const payload = JSON.parse(scenarioToJson(analysis));
  assert.equal(payload.site.id, 'site23');
  assert.equal(payload.profile.id, 'technology_demo');
  assert.equal(payload.panel.id, 'vertical_tracker');
  assert.equal(payload.scorePercent, 48);
  assert.equal(payload.series.length, 1);
  assert.equal(payload.series[0].timeUtc, '2026-11-14T00:00:00.000Z');
});

test('comparisonToCsv writes one row per site', () => {
  const analyses = [
    {
      site: {
        name: 'Malapert',
        role: 'candidate',
        lat: -85.99,
        lon: 359.76,
        maxSlopeDeg: 5,
        horizonSource: 'lola_hybrid',
        ephemSource: 'jpl_horizons'
      },
      metrics: {
        energyWhM2: 423800,
        dMaxHours: 180,
        dteCenterPct: 42.4,
        gMaxHours: 289
      },
      scorePercent: 48
    },
    {
      site: {
        name: 'Apollo 11',
        role: 'reference',
        lat: 0.67,
        lon: 23.47,
        maxSlopeDeg: 0.5,
        horizonSource: 'analytic_flat',
        ephemSource: 'jpl_horizons'
      },
      metrics: {
        energyWhM2: 316000,
        dMaxHours: 290,
        dteCenterPct: 100,
        gMaxHours: 0
      },
      scorePercent: 75
    }
  ];
  const lines = comparisonToCsv(analyses, {}).split('\n');
  assert.equal(lines.length, 3);
  assert.match(lines[1], /Malapert/);
  assert.match(lines[2], /Apollo 11/);
});

test('sweepToCsv writes one row per month with the score', () => {
  const sweep = {
    points: [
      {
        startUtc: '2026-11-01T00:00:00Z',
        energyKWhM2ByPanel: {
          horizontal: 10,
          vertical_fixed: 200,
          vertical_tracker: 400
        },
        sunlitPct: 50,
        dMaxHours: 180,
        dteCenterPct: 42,
        gMaxHours: 289,
        earthsetHoursFromStart: 149.88
      }
    ]
  };
  const lines = sweepToCsv(sweep, {
    profile: PROFILE_BY_ID.technology_demo,
    panelType: 'vertical_tracker'
  }).split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[1], /^2026-11-01,400\.0,50\.0,42\.0,289\.0,6\.25,48$/);
});
