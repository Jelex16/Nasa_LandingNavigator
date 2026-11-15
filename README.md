# Lua Navigator

**A decision-support web app that compares lunar south-pole landing sites and dates using real NASA LOLA terrain and JPL Horizons ephemerides.**

NASA Space Apps Challenge 2026 · [Leer en español](README.es.md)

Lua Navigator turns NASA terrain and ephemeris data into a fast, auditable site/date trade-off:
sunlight, eclipses, direct-to-Earth (DTE) visibility, communication blackouts, slope and a
transparent multi-criteria index. It is educational and decision-support software, **not** a
flight-certified landing analysis.

## The problem

Missions to the Moon's south pole face extreme lighting and communication constraints. A ridge a few
degrees high can decide whether a lander gets solar power, a direct radio link to Earth, both, or
neither. Existing tools (QuickMap, Moon Trek, Horizons) are built for detailed analysis, not for
rapid scenario comparison. When a launch date slips, planners need to re-evaluate sites and dates
quickly.

## What it does

- **Pick a site and a date**: 28 curated sites — eight polar sites (Malapert, Connecting Ridge,
  Shackleton, Peak near Shackleton, de Gerlache, Mons Mouton, Nobile, Haworth), thirteen historical
  sites (Apollo 11–17, Luna 9/16/17/21, Chang'e 3/5/6), four CLPS/commercial sites (IM-1 Odysseus,
  IM-2 Athena, Blue Ghost 1, IM-3 Reiner Gamma) and three international references (Chandrayaan-3,
  SLIM, Chang'e 4) — or custom lunar coordinates. The selector groups them by category.
- **See Sun and Earth against the real LOLA horizon**: a 2.5D horizon panorama, a polar radar, and a
  28-day Sun/Earth elevation timeline.
- **Read a plain-language verdict first**: percent of hours with sunlight, percent of time the Earth's
  center is visible (DTE), the longest continuous DTE blackout, and a secondary mission index.
- **Run a launch-slip sweep**: 36 monthly 28-day windows from 2026 to 2028 with energy, DTE, longest
  outage, and next Earthset. Click a month to load that date in the main view.
- **Compare sites with the same assumptions**: a 28-site comparison matrix with energy, eclipse,
  DTE, comms/outage, slope, and a transparent multi-criteria score.
- **Side-by-side A/B**: two site/date scenarios with compact LOLA radars, verdicts, metrics, a B−A
  delta table and “load in main view” for either scenario.
- **Site × date matrix**: 28 sites × 36 months with a metric selector (score, Sun, DTE, outage);
  reference rows are marked. Click a cell to load that site and date in the main view.
- **Share and export**: the scenario is encoded in the URL and copied by **Share**; export scenario
  JSON (with the 672-point series) and CSV for the comparison, sweep and site × date matrix.
- **Educational guide**: **How to read** opens a bilingual quick start, metric definitions, why the
  south pole is hard, a glossary, “try this” examples and limits.
- **Explore mission profiles**: direct-to-Earth demo, night-surviving rover, crewed outpost,
  relay/store-and-forward, and a custom profile. All weights and thresholds are visible.
- **Set your own thresholds**: the custom profile lets you define energy, eclipse, DTE and outage
  requirements. The tool rescores the current site, comparison, sweep and matrix. Meeting all four
  thresholds is GO. In strict mode (default), any unmet threshold is NO-GO; without strict mode, a
  missed threshold is CAUTION when the index is ≥50, otherwise NO-GO.
- **Bilingual UI**: English by default with an EN/ES selector; the choice is persisted locally.

The LOLA horizons and JPL Horizons ephemerides are NASA/JPL data. The built-in profile thresholds and
weights are team assumptions, **not NASA requirements**; custom thresholds are user assumptions. The
energy metric is accumulated panel-plane irradiance, not a full electrical power budget.

## AI (SI) usage

This project used a Gemini-family AI coding assistant as a development aid for code drafting and
refactoring, tests, documentation and the scripts that generate derived data products. The team
defined the challenge idea, scientific scope, site selection, mission profiles and interpretation of
results; AI was not used to conceive the solution. NASA LOLA DEMs and JPL Horizons ephemerides are
authentic NASA/JPL source data; no measurements were generated with AI. No AI-generated images,
video or audio are included.

The full disclosure is in [`docs/SI_USAGE.md`](docs/SI_USAGE.md) (Spanish:
[`docs/SI_USAGE.es.md`](docs/SI_USAGE.es.md)). `package.json` and `public/data/manifest.json`
include `siDisclosure`, and every derived JSON under `public/data` includes a top-level `si` object.

## NASA data and validation

| Source | Use |
|---|---|
| NASA PGDA LOLA 5 m/px landing-site DEMs | Near-field horizon for six sites |
| NASA PGDA LOLA 80S 80 m/px regional DEM | Far field to 100 km; Nobile, Haworth, IM-1 and IM-2 only |
| NASA/JPL Horizons DE441 | Apparent topocentric Sun/Earth azimuth, elevation, and distance, 1 h step |
| NASA LRO / ASU LROC QuickMap | Official site links and preview textures |
| NASA Solar System Treks (Moon Trek) | Official site links and LOLA layers |

- Horizon profiles: 720 azimuth bins (0.5°), five mast heights (0.5, 2, 5, 10, 20 m), lunar
  curvature correction.
- Ephemerides: JPL Horizons DE441, 2026-01-01 to 2029-02-01, cubic Hermite interpolation in the
  browser.
- Validation: 4,032 off-grid samples against Horizons; **RMS 5e-6°** (shown as 1e-5° in the UI),
  maximum error **1.22e-4°** (shown as 1.2e-4°).
- Terrain cross-validation: `public/data/terrain-validation.json` compares the 5 m/px near-field DEM
  with the 80 m/px regional DEM over each site's near-field range (24 azimuths, 2 m mast). Aggregate
  RMS 0.51°, maximum 2.18° over 144 comparisons. It measures cross-product agreement, not absolute
  accuracy; both products derive from LOLA.
- Azimuth provenance: the inherited hybrid horizons used the direction toward the lunar south pole as
  “north”. They were rotated by 180° (360 bins) so that bin 0 is true north and matches Horizons
  azimuths; the correction is recorded in the manifest and in each horizon's notes.
- Nobile, Haworth, IM-1 and IM-2 use the regional 80 m/px DEM and the local IAU 2000 engine for
  ephemerides; this is labeled in the UI. IM-1 is near the northern edge of the 80S DEM, so distant
  relief may be underrepresented to the north.
- Historical, international and non-polar CLPS/commercial reference sites use analytic flat horizons
  and the local IAU 2000 engine; they are labeled `REFERENCE` and are not Artemis III candidates.
- The 3D globe textures are previews only, and the Sun/Earth spheres in the 3D scene are illustrative
  and not to scale. The analysis uses the LOLA horizon files and the Horizons ephemerides, not the
  textures.
- **International reference sites** (Chandrayaan-3, SLIM, Chang'e 4) use real mission coordinates but
  **not** LOLA terrain at those points: their horizon is analytic flat and their ephemerides are the
  local IAU 2000 engine. They are labeled `REFERENCE` and are not ranked as candidates. Chang'e 4 is
  on the far side, so its DTE is 0% and a relay is required; Chandrayaan-3 at 69.4°S is a
  simplification because polar illumination is terrain-sensitive.
- **Data manifest**: `public/data/manifest.json` lists 70 derived files with sizes and SHA-256
  checksums. The manifest includes `referenceSitesNote` for the international references. The
  original DEMs (~0.5 GB) are not distributed.

## Quick start

```bash
npm install
npm run dev
# http://localhost:5173
```

Production build:

```bash
npm run build
npm run preview
```

Regenerate the monthly sweep and data manifest (optional; the generated files are versioned):

```bash
npm run data:sweep
npm run data:flat-horizons
npm run data:manifest
```

Regression tests (engine, catalog, data, i18n and export):

```bash
npm test
```

## Documentation

- **Feature reference:** [English](docs/features.md) · [Español](docs/features.es.md)
- **AI (SI) usage disclosure:** [English](docs/SI_USAGE.md) · [Español](docs/SI_USAGE.es.md)
- **Data manifest and checksums:** `public/data/manifest.json`
- The application UI defaults to English and can switch to Spanish from the EN/ES selector; the
  choice is persisted locally. The submission page and this README are in English.

## Project structure

| Path | Purpose |
|---|---|
| `index.html` | Single-page shell: header, verdict panel, radar, timeline, dock and modals |
| `src/main.js` | Application state, controls, URL state, share/export wiring |
| `src/analysis/` | Horizon geometry, sampling, scoring and status logic |
| `src/ephemeris/` | Horizons decoder/interpolation and local IAU 2000 fallback |
| `src/topography/` | Site catalog, horizon lookup and localized site helpers |
| `src/render/` | 3D lunar globe rendering |
| `src/ui/` | Radar, timeline, panorama, comparison, sweep, matrix, A/B and guide |
| `src/i18n.js`, `src/i18n-static.js` | EN/ES messages and static HTML translation |
| `src/export.js` | JSON/CSV serialization and downloads |
| `public/data/` | Sites, horizons, ephemerides, sweeps, validation and manifest |
| `scripts/` | Data generation and manifest maintenance |
| `tests/` | Analysis, catalog, custom-site, data, i18n, export and SI regression tests |

## Limitations

This is decision-support and educational software, **not flight-certified**. It does not model rocks
below the DEM resolution, thermal state, batteries, rover mobility, relay constellations, or a
certified landing point. The horizon is a 1D profile per azimuth; the 2.5D panorama is a shaded
representation. `gMaxHours` is a lower bound because it is measured inside a 28-day window. Nobile,
Haworth, IM-1 and IM-2 use 80 m/px regional terrain; custom coordinates use the nearest real LOLA
horizon within 10 km or a flat horizon. International references use analytic flat horizons and local
IAU 2000; they are context, not LOLA analyses. The 3D globe and Sun/Earth spheres are illustrative
and not to scale. Ephemeris coverage is 2026-01-01 to 2029-02-01. The score is a decision index, not
a probability of success.

## References

- NASA PGDA LOLA 5 m/px landing-site DEMs: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/
- NASA PGDA LOLA 80S 80 m/px regional DEM: https://pgda.gsfc.nasa.gov/products/90
- NASA/JPL Horizons System (DE441): https://ssd.jpl.nasa.gov/horizons/
- NASA LRO / ASU LROC QuickMap: https://quickmap.lroc.asu.edu/
- NASA Solar System Treks (Moon Trek): https://trek.nasa.gov/moon/
- Barker et al. (2021), Improved LOLA Elevation Maps for South Pole Landing Sites:
  https://doi.org/10.1016/j.pss.2020.105119
- Mazarico et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography:
  https://doi.org/10.1016/j.icarus.2010.10.030

This project is independent and is not endorsed by NASA.
