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
  CUSTOM_PROFILE_ID,
  buildStatus,
  createCustomProfile,
  resolveProfile,
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

test('custom profiles clamp values and resolve through the profile id', () => {
  const custom = createCustomProfile({
    energyReqKWhM2: -10,
    dMaxTolHours: 99999,
    dteReqPct: 150,
    gMaxTolHours: 10,
    strict: false
  });
  assert.equal(custom.energyReqKWhM2, 0);
  assert.equal(custom.dMaxTolHours, 2000);
  assert.equal(custom.dteReqPct, 100);
  assert.equal(custom.gMaxTolHours, 10);
  assert.equal(custom.strict, false);
  assert.equal(resolveProfile(CUSTOM_PROFILE_ID, custom).id, 'custom');
  assert.equal(resolveProfile('technology_demo').id, 'technology_demo');
});

test('zero custom thresholds produce a finite score', () => {
  const custom = createCustomProfile({
    energyReqKWhM2: 0,
    dMaxTolHours: 0,
    dteReqPct: 0,
    gMaxTolHours: 0,
    strict: true
  });
  const components = scoreComponents(
    { energyWhM2: 0, dMaxHours: 0, dteCenterPct: 0, gMaxHours: 0 },
    custom
  );
  assert.ok(Number.isFinite(components.total));
  assert.equal(components.total, 100);
});

test('strict custom profile turns any unmet threshold into NO-GO', () => {
  const custom = createCustomProfile({
    energyReqKWhM2: 100,
    dMaxTolHours: 10,
    dteReqPct: 90,
    gMaxTolHours: 5,
    strict: true
  });
  const metrics = {
    energyWhM2: 200000,
    dMaxHours: 0,
    dteCenterPct: 50,
    gMaxHours: 0
  };
  const components = scoreComponents(metrics, custom);
  const failed = buildStatus({ role: 'candidate', slopeDeg: 2 }, metrics, components, custom);
  assert.match(failed.status, /NO-GO/);
  assert.match(failed.statusText, /DTE/);

  const metMetrics = { ...metrics, dteCenterPct: 95 };
  const metComponents = scoreComponents(metMetrics, custom);
  const met = buildStatus(
    { role: 'candidate', slopeDeg: 2 },
    metMetrics,
    metComponents,
    custom
  );
  assert.match(met.status, /GO/);

  const relaxed = createCustomProfile({ ...custom, strict: false });
  const relaxedStatus = buildStatus(
    { role: 'candidate', slopeDeg: 2 },
    metrics,
    components,
    relaxed
  );
  assert.match(relaxedStatus.status, /CAUTION/);
});

test('custom profile GO is threshold-based even with a low margin index', () => {
  const custom = createCustomProfile({
    energyReqKWhM2: 300,
    dMaxTolHours: 200,
    dteReqPct: 20,
    gMaxTolHours: 400,
    strict: true
  });
  const metrics = {
    energyWhM2: 423800,
    dMaxHours: 180,
    dteCenterPct: 42.4,
    gMaxHours: 289
  };
  const components = scoreComponents(metrics, custom);
  const status = buildStatus({ role: 'candidate', slopeDeg: 5 }, metrics, components, custom);
  assert.ok(components.total < 75);
  assert.match(status.status, /GO/);
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
