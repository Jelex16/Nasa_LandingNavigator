import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CUSTOM_HORIZON_MAX_KM,
  findHorizonReference
} from '../src/topography/lunarData.js';

const DATA = new URL('../public/data/', import.meta.url);

function candidate(id, lat, lon, overrides = {}) {
  return {
    id,
    shortName: id,
    lat,
    lon,
    horizon: { elevationsDegByHeight: [] },
    isRealLola: true,
    ...overrides
  };
}

test('custom coordinates reuse the nearest real LOLA profile within 10 km', () => {
  assert.equal(CUSTOM_HORIZON_MAX_KM, 10);
  const reference = findHorizonReference(
    -89.8,
    0,
    [candidate('near', -89.9, 0), candidate('far', -89.0, 0)]
  );
  assert.equal(reference.site.id, 'near');
  assert.ok(reference.distanceKm < CUSTOM_HORIZON_MAX_KM);
});

test('custom coordinates fall back to a flat horizon beyond 10 km', () => {
  const reference = findHorizonReference(
    -89.5,
    0,
    [candidate('near', -89.9, 0)]
  );
  assert.equal(reference, null);
});

test('custom coordinates ignore candidates without a real LOLA horizon', () => {
  const reference = findHorizonReference(
    -89.8,
    0,
    [
      candidate('flat', -89.85, 0, { horizon: null }),
      candidate('approx', -89.85, 0, { isRealLola: false })
    ]
  );
  assert.equal(reference, null);
});

test('terrain validation JSON covers the six hybrid sites', () => {
  const data = JSON.parse(
    readFileSync(new URL('terrain-validation.json', DATA), 'utf8')
  );
  assert.equal(data.schemaVersion, 1);
  assert.equal(data.azimuthSamples, 24);
  assert.equal(data.sites.length, 6);
  assert.equal(data.aggregate.samples, data.sites.length * data.azimuthSamples);
  assert.ok(Number.isFinite(data.aggregate.rmsDeg));
  assert.ok(Number.isFinite(data.aggregate.maxDeg));
  assert.ok(data.aggregate.maxDeg >= data.aggregate.rmsDeg);
  for (const site of data.sites) {
    assert.ok(site.azimuthSamples > 0);
    assert.ok(Number.isFinite(site.rmsDeg));
    assert.ok(Number.isFinite(site.maxDeg));
    assert.ok(site.maxDeg >= site.rmsDeg);
    assert.ok(site.maxDeg <= 90);
  }
});
