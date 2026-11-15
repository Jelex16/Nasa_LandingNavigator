import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const DATA = new URL('../public/data/', import.meta.url);

const readJson = (relative) =>
  JSON.parse(readFileSync(new URL(relative, DATA), 'utf8'));

const catalogs = [
  readJson('sites.json'),
  readJson('sites-extra.json'),
  readJson('sites-international.json'),
  readJson('sites-historical.json'),
  readJson('sites-clps.json')
];
const allSites = catalogs.flatMap((catalog) => catalog.sites ?? []);
const historical = readJson('sites-historical.json').sites;
const clps = readJson('sites-clps.json').sites;
const newSites = [...historical, ...clps];

test('the curated catalog covers historical, international and CLPS sites', () => {
  assert.equal(historical.length, 12);
  assert.equal(clps.length, 4);
  assert.equal(allSites.length, 28);
  const ids = allSites.map((site) => site.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const site of newSites) {
    assert.equal(site.role, 'reference');
    assert.ok(site.category === 'historical' || site.category === 'clps');
    assert.ok(Number.isFinite(site.latDeg));
    assert.ok(site.latDeg >= -90 && site.latDeg <= 90);
    assert.ok(site.lonEastDeg >= 0 && site.lonEastDeg <= 360);
    assert.ok(site.horizonFile);
  }
});

test('every new site has a valid horizon profile', () => {
  for (const site of newSites) {
    const path = new URL(site.horizonFile, DATA);
    assert.ok(existsSync(path), `${site.id}: missing horizon`);
    const horizon = JSON.parse(readFileSync(path, 'utf8'));
    assert.equal(horizon.schemaVersion, 1);
    assert.equal(horizon.siteId, site.id);
    assert.equal(horizon.binCount, 720);
    assert.equal(horizon.binWidthDeg, 0.5);
    assert.equal(horizon.elevationsDegByHeight.length, 5);
    assert.ok(horizon.elevationsDegByHeight.every((row) => row.length === 720));
    if (site.horizonMode === 'analytic_flat') {
      assert.equal(horizon.provenance, 'analytic_flat');
      assert.ok(
        horizon.elevationsDegByHeight.every((row) => row.every((value) => value === 0))
      );
    } else {
      assert.equal(horizon.provenance, 'lola_regional_80m');
      assert.equal(horizon.nearFieldRadiusKm, 0);
      assert.equal(horizon.farFieldRadiusKm, 100);
      assert.ok(
        horizon.elevationsDegByHeight.every((row) =>
          row.every((value) => Number.isFinite(value))
        )
      );
    }
  }
});

test('IM-1 and IM-2 use the regional LOLA horizon inside the 80S DEM', () => {
  for (const id of ['im1_odysseus', 'im2_athena']) {
    const site = clps.find((entry) => entry.id === id);
    assert.ok(site);
    assert.equal(site.horizonMode, 'lola_regional_80m');
    assert.equal(site.ephemSource, 'iau2000_local');
    assert.ok(site.latDeg <= -80);
    assert.ok(Number.isFinite(site.elevationM));
    assert.ok(Number.isFinite(site.slopeDeg));
  }
});

test('the new sites have 36-month sweeps for the comparison matrix', () => {
  for (const site of newSites) {
    const sweepUrl = new URL(`sweep/${site.id}.json`, DATA);
    assert.ok(existsSync(sweepUrl), `${site.id}: missing sweep`);
    const sweep = JSON.parse(readFileSync(sweepUrl, 'utf8'));
    assert.equal(sweep.siteId, site.id);
    assert.equal(sweep.points.length, 36);
    assert.equal(sweep.assumptions.windowDays, 28);
  }
});
