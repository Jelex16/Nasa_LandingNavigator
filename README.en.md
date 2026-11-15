# Lunar Landing Site Navigator

**A decision-support tool that compares lunar south-pole landing sites and dates using real NASA LOLA terrain and JPL Horizons ephemerides.**

NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator.

## The problem

Missions to the Moon's south pole face extreme lighting and communication constraints. A ridge a few degrees high can decide whether a lander gets solar power, a direct radio link to Earth, both, or neither. Existing tools (QuickMap, Moon Trek, Horizons) are built for detailed analysis, not for rapid scenario comparison. When a launch date slips, planners need to re-evaluate sites and dates quickly.

## What it does

- **Pick a site and a date**: nine curated sites (Malapert, Connecting Ridge, Shackleton, Peak near Shackleton, de Gerlache, Mons Mouton, Nobile, Haworth, Apollo 11 as a reference) or custom lunar coordinates.
- **See Sun and Earth against the real LOLA horizon**: a 2.5D horizon panorama, a polar radar, and a 28-day Sun/Earth elevation timeline.
- **Read a plain-language verdict first**: percent of hours with sunlight, percent of time the Earth's center is visible (DTE), the longest continuous DTE blackout, and a secondary mission index.
- **Run a launch-slip sweep**: 36 monthly 28-day windows from 2026 to 2028 with energy, DTE, longest outage, and next Earthset. Click a month to load that date in the main view.
- **Compare sites with the same assumptions**: a comparison matrix with energy, eclipse, DTE, comms/outage, slope, and a transparent multi-criteria score.
- **Site × date matrix**: 9 sites × 36 months with a metric selector (score, Sun, DTE, outage); click a cell to load that site and date in the main view.
- **Explore mission profiles**: direct-to-Earth demo, night-surviving rover, crewed outpost, and relay/store-and-forward. All weights and thresholds are visible.

## Why it matters

The tool is designed for three audiences:

- **Mission planners** comparing sites and launch dates under schedule pressure.
- **Educators and students** exploring why polar lighting and communication are hard.
- **The public** seeing how NASA data translates into an engineering trade-off.

## NASA data and validation

| Source | Use |
|---|---|
| NASA PGDA LOLA 5 m/px landing-site DEMs | Near-field horizon for six sites |
| NASA PGDA LOLA 80S 80 m/px regional DEM | Far field to 100 km; Nobile and Haworth only |
| NASA/JPL Horizons DE441 | Apparent topocentric Sun/Earth azimuth, elevation, and distance, 1 h step |
| NASA LRO / ASU LROC QuickMap | Official site links and preview textures |
| NASA Solar System Treks (Moon Trek) | Official site links and LOLA layers |

- Horizon profiles: 720 azimuth bins (0.5°), five mast heights (0.5, 2, 5, 10, 20 m), lunar curvature correction.
- Ephemerides: JPL Horizons DE441, 2026-01-01 to 2029-02-01, cubic Hermite interpolation in the browser.
- Validation: 4,032 off-grid samples against Horizons; **RMS 1e-5°**, maximum error **1.2e-4°**.
- Nobile and Haworth use the regional 80 m/px DEM and the local IAU 2000 engine for ephemerides; this is labeled in the UI.
- The 3D globe textures are previews only, and the Sun/Earth spheres in the 3D scene are illustrative and not to scale. The analysis uses the LOLA horizon files and the Horizons ephemerides, not the textures.

## Run it

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

Regenerate the monthly sweep (optional; the generated files are versioned):

```bash
npm run data:sweep
npm run data:manifest
```

Regression tests (engine and data):

```bash
npm test
```

## Demo

- **30-second video script and 7-slide outline:** [docs/demo.md](docs/demo.md)
- **Demo video:** add the final link here before submission.
- The application UI is in Spanish. The submission page, this README, and the demo/subtitles are in English.

## Limitations

This is decision-support and educational software, **not flight-certified**. It does not model rocks below the DEM resolution, thermal state, batteries, rover mobility, relay constellations, or a certified landing point. The horizon is a 1D profile per azimuth; the 2.5D panorama is a shaded representation. `gMaxHours` is a lower bound because it is measured inside a 28-day window. Nobile and Haworth use 80 m/px regional terrain; custom coordinates use an approximate horizon. The score is a decision index, not a probability of success.

## References

- NASA PGDA LOLA 5 m/px landing-site DEMs: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/
- NASA PGDA LOLA 80S 80 m/px regional DEM: https://pgda.gsfc.nasa.gov/products/90
- NASA/JPL Horizons System (DE441): https://ssd.jpl.nasa.gov/horizons/
- NASA LRO / ASU LROC QuickMap: https://quickmap.lroc.asu.edu/
- NASA Solar System Treks (Moon Trek): https://trek.nasa.gov/moon/
- Barker et al. (2021), Improved LOLA Elevation Maps for South Pole Landing Sites: https://doi.org/10.1016/j.pss.2020.105119
- Mazarico et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography: https://doi.org/10.1016/j.icarus.2010.10.030

This project is independent and is not endorsed by NASA.
