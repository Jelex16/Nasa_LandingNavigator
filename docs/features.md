# Feature reference

**Lua Navigator — NASA Space Apps Challenge 2026.**

A static Vite web app that compares lunar landing sites and dates using real NASA LOLA terrain and
JPL Horizons ephemerides. It is decision-support and educational software, not a flight-certified
landing analysis. The UI defaults to English; the EN/ES selector in the top bar switches to Spanish
and remembers the choice.

- [Feature reference (English)](features.md) · [Referencia de features (Español)](features.es.md)
- [README (English)](../README.md) · [README (Español)](../README.es.md)

## 1. Site catalog

28 curated sites plus custom coordinates: 8 polar, 13 historical, 4 CLPS/commercial and 3
international references. The table below lists the polar candidates and the main reference entries;
the remaining sites are summarized after it. Candidate sites are scored; reference sites are shown
as context and are not ranked as candidates.

| Site | Role | Horizon | Ephemerides |
|---|---|---|---|
| Malapert Massif | Artemis III candidate | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| Connecting Ridge | Artemis III candidate | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| Shackleton Rim (LOLA) | Non-official analysis point | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| Peak near Shackleton | Artemis III candidate | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| de Gerlache Rim | Artemis III candidate | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| Mons Mouton (Leibnitz Beta) | Artemis III candidate | LOLA 5 m/px + 80 m/px hybrid | JPL Horizons DE441 |
| Nobile Rim 1 | Artemis III candidate | LOLA 80 m/px regional | local IAU 2000 |
| Haworth (interior) | Region reference point | LOLA 80 m/px regional | local IAU 2000 |
| Apollo 11 (Mare Tranquillitatis) | Historical equatorial reference | Analytic flat | JPL Horizons DE441 |
| Chandrayaan-3 (Shiv Shakti) | International reference | Analytic flat (approx.) | local IAU 2000 |
| SLIM (Shioli) | International reference | Analytic flat (approx.) | local IAU 2000 |
| Chang'e 4 (Von Kármán) | International reference, far side | Analytic flat (approx.) | local IAU 2000 |

- **Historical and other programs**: Apollo 12, 14, 15, 16, 17; Luna 9, 16, 17, 21; Chang'e 3, 5, 6.
  Real coordinates, analytic flat horizons and local IAU 2000 ephemerides. They are labeled
  `REFERENCE`, not Artemis III candidates.
- **CLPS and commercial**: IM-1 Odysseus and IM-2 Athena use a regional 80 m/px LOLA horizon; Blue
  Ghost 1 and the future IM-3 Reiner Gamma target use an analytic flat horizon. IM-1 is near the
  northern edge of the 80S DEM, so distant relief may be underrepresented to the north.
- **Site input mode**: a Catalog / Coordinates toggle next to the site selector switches between the
  curated site list and manual coordinates, keeping location input separate from the mission profile.
- **Custom coordinates**: latitude/longitude validation; the app uses the nearest real LOLA horizon
  within 10 km and labels the distance. If no site is within 10 km it uses a flat analytic horizon.
  Slope and elevation are shown as “—”; the result is explicitly approximate.
- **International references** are included for comparison and education only. They use real mission
  coordinates but **not** LOLA terrain at those points; their horizon is analytic flat and their
  ephemerides are the local IAU 2000 engine. The UI, the data modal, the manifest and this document
  state this explicitly. Chandrayaan-3 at 69.4°S is a simplification because polar illumination is
  terrain-sensitive. Chang'e 4 is on the far side, so its DTE is 0% and a relay is required; this is a
  deliberate educational case.

## 2. Mission profile, verdict and metrics

- **Mission profile first**: the profile selector (with its thresholds and custom panel) sits above the
  verdict, because the decision is evaluated against those assumptions.
- **Provenance note**: the verdict card states that Sun, DTE, outage and eclipse come from NASA data
  (LOLA + JPL Horizons), while the status and mission index derive from the mission-profile thresholds,
  which are team or user assumptions, not NASA requirements.
- **Verdict card**: status, active profile name, three KPIs (Sun, DTE, outage), a plain-language
  summary and a PASS/FAIL checklist of the four profile thresholds (energy, eclipse, DTE, outage).
  Reference and international sites hide the checklist because they are context, not candidates.
- **Sunlit %**: fraction of hours with at least 5% of the solar disk above the LOLA horizon.
- **DTE %**: fraction of hours with the Earth's center above the local horizon (direct-to-Earth).
  The partial-disk fraction is computed and shown but does not enter the score.
- **Longest DTE outage**: longest continuous blackout inside the 28-day window.
- **Longest continuous eclipse**: longest solar eclipse inside the window.
- **Energy**: accumulated Wh/m² for the selected panel and mast, with DNI corrected by the
  Sun–Moon distance and the visible solar-disk fraction.
- **Mission index**: a secondary weighted decision index; it is not a probability of success. It now
  lives inside the collapsible verdict detail, below the checklist.
- **View index and breakdown**: per-term points, raw metric and threshold, plus the mission index.
- **View model**: formula, component values, weights, thresholds, profile description and limits,
  available in the Model tab of the unified help panel.

Statuses and hard limits:

- slope >15° adds a limit; slope >25° is `NO-GO`;
- severe DTE outage, continuous eclipse or DTE below half the requirement forces `NO-GO`;
- reference and international sites always show `REFERENCE`, with an explanatory note.

## 3. Visualizations

- **Polar LOLA radar**: horizon mask, Sun and Earth positions, 28-day trajectories, below-horizon
  state and source badge (`Real LOLA`, `Analytic`, `Approximate`).
- **2.5D horizon panorama**: 360° LOLA silhouette, shaded relief, Sun/Earth finite disks,
  24-hour solar path, 28-day Earth libration loop, horizon markers, “below the horizon” labels,
  horizon/full-sky modes and true-scale/enlarged disks. The vertical range adapts to the site horizon.
- **28-day timeline**: Sun and Earth elevation curves, LOLA horizon at each azimuth, shaded
  visibility bands, hover tooltip with az/el/horizon/fractions/energy, and click-to-jump.
- **3D globe**: LROC/LOLA preview layers, relief 1x/2.5x/5x/plane, site pins (curated and custom),
  Sun/Earth sightlines and south-pole/site/global camera presets. Clicking a pin loads that site in
  the evaluation panel and shows a short description anchored to the pin. The globe and the
  Sun/Earth spheres are illustrative and not to scale; they do not enter the score.
- **Telemetry cards**: Sun/Earth elevation, panel irradiance, LOLA horizon and clearance, DTE status.
- **Countdowns**: next solar sunset/sunrise, next DTE loss/Earthrise, continuous DTE.

## 4. Dates, time and launch slip

- Mission date/time in UTC, with a custom date option.
- Presets: example window (Nov 2026), southern summer solstice (Dec 2026), southern winter solstice
  (Jun 2026), real time (clamped to the 2026–2036 coverage) and custom date.
- ±1 hour / ±1 day steps, a 28-day scrubber, and playback at 1x/10x/60x.
- The 28-day evaluation window starts at the mission date; playback changes only the displayed
  instant, not the evaluation window.
- **Launch-slip sweep**: 120 monthly 28-day windows from 2026 to 2035, with energy for the current
  panel, Sun %, DTE %, longest outage, next Earthset and score. Click a month or a table date to load
  it in the main view. DTE/outage are precomputed with a 2 m mast; the UI warns if the current mast
  differs.

## 5. Comparisons

- **Comparison matrix**: all 28 sites with the same start date, window, profile, panel and mast.
  Columns: score/status, energy, continuous eclipse, DTE center, DTE outage and local slope. Rows are
  clickable; references carry a `REFERENCE` badge. Export CSV.
- **Side-by-side A/B**: a visual comparison of two site/date scenarios with the current profile,
  panel and mast. Each card shows the verdict, a compact LOLA radar, Sun/DTE/outage/eclipse/energy/
  slope and the mission index (references show `REFERENCE`). A delta table shows B−A, coloured by
  direction. “Load in main view” opens either scenario. A/B is visual; use Share/Export after loading
  a scenario.
- **Site × date matrix**: 28 sites × 120 months with a metric selector (Score, Sun %, DTE %, outage).
  Reference rows are marked; the note explains they are context, not ranked candidates. Click a cell
  to load that site and date. Export CSV.

## 6. Mission profiles and score

Profiles and their assumptions are visible and selectable:

| Profile | Energy requirement | Eclipse tolerance | DTE requirement | DTE outage tolerance |
|---|---|---|---|---|
| Direct DTE demo | 300 kWh/m² | 160 h | 60% | 24 h |
| Night-surviving rover | 400 kWh/m² | 380 h | 30% | 48 h |
| Crewed outpost with direct DTE | 450 kWh/m² | 120 h | 90% | 12 h |
| Relay / store-and-forward | 300 kWh/m² | 200 h | 20% | 400 h |
| Custom | user-defined | user-defined | user-defined | user-defined |

- Panels: horizontal, vertical fixed and vertical tracker.
- Mast heights: 0.5, 2, 5, 10 and 20 m.
- Score: `100 · (wE·E + wD·D + wC·C + wG·G) / Σw`, with visible weights and thresholds.
- A relay profile only relaxes DTE/outage tolerances; it does not simulate a concrete relay.
- **Custom profile**: set the four thresholds in the mission panel and apply. The tool rescores the
  current site, comparison, sweep and matrix with those thresholds. The custom profile uses equal
  weights (1/1/1/1). Meeting all four thresholds is `GO`. In strict mode (default), any unmet
  threshold forces `NO-GO`; without strict mode, a missed threshold is `CAUTION` when the index is
  ≥50, otherwise `NO-GO`. The index is a margin indicator, not the pass/fail rule.
- **Provenance**: the LOLA horizons and JPL Horizons ephemerides are NASA/JPL data. The built-in
  profile thresholds and weights are team assumptions, **not NASA requirements**. The custom
  thresholds are user assumptions. The energy metric is accumulated panel-plane irradiance, not a
  full electrical power budget (no panel efficiency or load model).

## 7. Bilingual UI

- English is the default; the EN/ES selector in the top bar switches the whole UI, including charts,
  tables, tooltips, the guide and generated values.
- The choice is persisted in `localStorage`; a URL `lang=en|es` overrides it for a shared link.
- The `<html lang>`, document title, meta description and ARIA labels follow the language.
- The README and this feature reference are available in both English and Spanish; English is the
  submission language.

## 8. Share and export

### Shareable scenario link

The current scenario is encoded in the URL and kept up to date:

```text
/?site=site23&date=2026-11-14T00:00:00.000Z&profile=technology_demo&panel=vertical_tracker&mast=2&lang=en
```

| Parameter | Meaning | Values |
|---|---|---|
| `site` | Curated site id | e.g. `site23`, `nobile_rim_1`, `change4`, `control_eq` |
| `lat`, `lon` | Custom coordinates (takes precedence over `site`) | lat −90…90, lon 0…360 |
| `date` | Mission start, ISO UTC | 2026-01-01 … 2035-12-01 |
| `profile` | Mission profile id | `technology_demo`, `night_survivor`, `crewed_outpost`, `relay_store_forward` |
| `panel` | Solar panel | `horizontal`, `vertical_fixed`, `vertical_tracker` |
| `mast` | Mast height in metres | `0.5`, `2`, `5`, `10`, `20` |
| `lang` | UI language | `en`, `es` |

The **Share** button copies the full link. Opening the link restores the site, date, profile, panel,
mast and language. The URL reflects site/date/profile/panel/mast changes; playback and the scrubber
do not rewrite it.

### Exports

All exports are client-side downloads; no server or account is required.

- **Export JSON** (panel footer): the current scenario with site metadata, profile, panel, mast,
  metrics, components, status and the full 672-point series (az/el, horizons, visible fractions,
  flags and energy).
- **Export CSV** (comparison): one row per site with role, coordinates, score, energy, eclipse, DTE,
  outage, slope and data sources.
- **Export CSV** (sweep): 120 monthly rows with energy for the current panel, Sun %, DTE %, outage,
  Earthset and score.
- **Export CSV** (site × date matrix): 28 site rows × 120 monthly scores, with the role column.

## 9. Educational guide

**¿Cómo funciona?** in the verdict card opens one help panel with tabs **Guide / Model / Sources**:

- **Quick start**: site/date, verdict, radar/panorama, Dates, Compare, Share.
- **What the metrics mean**: Sun %, DTE %, outage, eclipse, energy and mission index.
- **Why the south pole is hard**: Sun/Earth near the horizon, terrain, PSRs/ice, far-side relay.
- **Glossary**: LOLA, DEM, horizon, DTE, PSR, libration, CLPS/HLS, Artemis III.
- **Try this**: Malapert Nov 2026 → May 2027 → A/B with Chang'e 4 → Share/Export.
- **Limits**: the declared limitations and the data caveats.

## 10. Data, validation and provenance

- **LOLA 5 m/px landing-site DEMs**: near field for six sites.
- **LOLA 80S 80 m/px regional DEM**: far field to 100 km and Nobile, Haworth, IM-1 and IM-2.
- **JPL Horizons DE441**: apparent topocentric Sun/Earth az/el/distance, 1 h step, 2026-01-01 to
  2036-01-01, cubic Hermite interpolation in the browser.
- **Horizon model**: 720 azimuth bins (0.5°), five mast heights, lunar curvature `r²/(2R_M)`,
  airless horizon (no atmospheric refraction).
- **Validation**: 4,032 off-grid samples against Horizons; RMS 5×10⁻⁶°, maximum 1.22×10⁻⁴° (the UI
  rounds to 1×10⁻⁵° and 1.2×10⁻⁴°). The local IAU 2000 engine is used for sites without precomputed
  Horizons ephemerides and as a fallback; it was spot-checked against Horizons and is not covered by
  the full 4,032-sample validation.
- **Terrain cross-validation**: `public/data/terrain-validation.json` compares the 5 m/px near-field
  DEM with the 80 m/px regional DEM over each site's near-field range (24 azimuths, 2 m mast).
  Aggregate RMS 0.51°, maximum 2.18°. It measures cross-product agreement, not absolute terrain
  accuracy: both products derive from LOLA and do not resolve rocks below their pixel size.
- **Data manifest**: `public/data/manifest.json` lists 70 derived files with sizes and SHA-256
  checksums; `npm run data:manifest` regenerates it. The original DEMs (~0.5 GB) are not distributed.
- **International references**: analytic flat horizons and local IAU 2000; not LOLA terrain analyses.
  The manifest carries a `referenceSitesNote`, and the data modal states it.
- **Historical and CLPS references**: Apollo, Luna and Chang'e use analytic flat horizons and local
  IAU 2000. IM-1/IM-2 use regional 80 m/px LOLA; Blue Ghost 1 and IM-3 are analytic flat. They are
  reference points, not Artemis III candidates.
- **3D textures**: LROC WAC and LOLA previews (2k/1k); they are visual only and are not used for the
  score.

## 11. Accessibility, responsiveness and tests

- Keyboard-operable controls, skip link, focus trap in modals, labelled form controls, `aria-live`
  verdict/toast, visible focus styles and `prefers-reduced-motion` support.
- Axe WCAG A/AA audit: **0 violations** in English and Spanish, including the guide, comparison and
  A/B views.
- Responsive layout: mobile header, scrollable camera rail, single-column A/B cards, horizontally
  scrollable matrices, sticky 28-day timeline toggle.
- Tests: engine, geometry, real-data decode, 28-day Malapert regression, i18n key parity,
  interpolation and JSON/CSV export. Run `npm test`.
- Production build: Vite; current bundle ~838 KB minified / ~226 KB gzip. The >500 KB chunk warning
  remains; code-splitting is a future optimization.

## 12. Limits

- Decision-support and educational software; **not flight-certified**.
- No rocks below DEM resolution, thermal state, batteries, rover mobility, relay constellations or
  Monte Carlo uncertainty.
- The horizon is a 1D profile per azimuth; the 2.5D panorama is a shaded representation, not a 3D
  mesh.
- Nobile, Haworth, IM-1 and IM-2 use 80 m/px regional terrain; historical, international and
  non-polar CLPS/commercial reference sites use analytic flat horizons.
- The score is a decision index, not a probability of success. `gMaxHours` is a lower bound inside
  the 28-day window.
- The 3D globe, Sun/Earth spheres and preview textures are illustrative and not to scale.
- Ephemeris coverage is 2026-01-01 to 2036-01-01; there is no live Horizons query in the app.

## 13. Commands

```bash
npm install
npm run dev            # http://localhost:5173
npm run build
npm run preview
npm test               # engine, data, i18n and export tests

npm run data:ephemerides       # 10-year JPL Horizons ephemerides (network)
npm run data:sweep             # 120 monthly windows for all sites
npm run data:flat-horizons     # flat horizons for historical, CLPS and international references
npm run data:terrain-validation # 5 m/px vs 80 m/px cross-DEM validation
npm run data:si-metadata       # AI-disclosure metadata in every derived JSON
npm run data:manifest          # sizes and SHA-256 for public/data
npm run data:fix-azimuth       # idempotent azimuth correction
npm run data:regional-horizons # Nobile/Haworth from the regional DEM
npm run data:clps-horizons     # IM-1/IM-2 from the regional DEM
```

## 14. Key files

| Path | Purpose |
|---|---|
| `src/main.js` | application state, controls, URL state, share/export wiring |
| `src/analysis/` | geometry, sampling, scoring and status |
| `src/ephemeris/` | Horizons binary decoder/interpolation and IAU 2000 fallback |
| `src/topography/lunarData.js` | site catalog, horizon lookup, localised site helpers |
| `src/ui/` | radar, timeline, panorama, comparison, sweep, matrix, A/B and guide |
| `src/i18n.js`, `src/i18n-static.js` | EN/ES messages and static HTML translation |
| `src/export.js` | JSON/CSV serialization and downloads |
| `public/data/` | sites, horizons, ephemerides, sweeps, validation, manifest |
| `scripts/` | data generation and manifest maintenance |
| `tests/` | engine, data, i18n and export regression tests |
