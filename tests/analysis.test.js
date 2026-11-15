import test from 'node:test';
import assert from 'node:assert/strict';

import {
  azElFromVector,
  azElToMcmf,
  diskVisibleFraction,
  longestTrueRunHours
} from '../src/analysis/geometry.js';
import {
  PROFILE_BY_ID,
  scoreComponents,
  panelIrradianceWm2
} from '../src/analysis/scoring.js';
import { horizonElevationAt } from '../src/topography/lunarData.js';

test('diskVisibleFraction covers full, half and hidden disks', () => {
  assert.equal(diskVisibleFraction(10, 0, 1), 1);
  assert.ok(Math.abs(diskVisibleFraction(0, 0, 1) - 0.5) < 1e-12);
  assert.equal(diskVisibleFraction(-2, 0, 1), 0);
});

test('longestTrueRunHours measures the longest continuous run', () => {
  assert.equal(longestTrueRunHours([true, true, false, true, true, true], 1), 3);
  assert.equal(longestTrueRunHours([false, false, false], 1), 0);
  assert.equal(longestTrueRunHours([true, true], 2), 4);
});

test('scoreComponents saturates at 100 when every requirement is met', () => {
  const profile = PROFILE_BY_ID.technology_demo;
  const perfect = {
    energyWhM2: profile.energyReqKWhM2 * 1000,
    dMaxHours: 0,
    dteCenterPct: profile.dteReqPct,
    gMaxHours: 0
  };
  assert.equal(Math.round(scoreComponents(perfect, profile).total), 100);

  const failed = {
    energyWhM2: 0,
    dMaxHours: profile.dMaxTolHours,
    dteCenterPct: 0,
    gMaxHours: profile.gMaxTolHours
  };
  assert.equal(scoreComponents(failed, profile).total, 0);
});

test('a vertical tracker outperforms a horizontal panel at grazing Sun', () => {
  const elevation = 1;
  const horizontal = panelIrradianceWm2('horizontal', 90, elevation, 1, 1, 0);
  const tracker = panelIrradianceWm2('vertical_tracker', 90, elevation, 1, 1, 0);
  assert.ok(tracker > horizontal);
  assert.ok(Math.abs(tracker - 1361 * Math.cos((elevation * Math.PI) / 180)) < 1e-9);
});

test('horizonElevationAt interpolates bins and wraps at 360 degrees', () => {
  const profile = {
    mastHeightsM: [2],
    elevationsDegByHeight: [[0, 10]],
    binCount: 2,
    binWidthDeg: 180
  };
  assert.equal(horizonElevationAt(profile, 0, 2), 0);
  assert.equal(horizonElevationAt(profile, 180, 2), 10);
  assert.equal(horizonElevationAt(profile, 90, 2), 5);
  assert.equal(horizonElevationAt(profile, 270, 2), 5);
});

test('azimuth/elevation vectors round-trip through the MCMF frame', () => {
  const vector = azElToMcmf(-85.99, 359.76, 127, -0.85);
  const back = azElFromVector(vector, -85.99, 359.76);
  assert.ok(Math.abs(back.azDeg - 127) < 1e-9);
  assert.ok(Math.abs(back.elDeg - -0.85) < 1e-9);
});
