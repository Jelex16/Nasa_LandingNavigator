import { ATTR_EN, STATIC_EN } from "./i18n-static.js";

const STORAGE_KEY = "lunar.lang";
const DEFAULT_LANGUAGE = "en";
const SUPPORTED = ["en", "es"];

const MESSAGES = {
  en: {
    "meta.title": "Lunar Landing Site Navigator | NASA Space Apps 2026",
    "meta.description":
      "Lunar Landing Site Navigator: compare lunar landing sites with LOLA topography and JPL Horizons ephemerides.",
    "common.sun": "Sun",
    "common.earth": "Earth",
    "common.sunUpper": "SUN",
    "common.earthUpper": "EARTH",
    "common.horizon": "Horizon",
    "common.score": "Score",
    "common.approx": "approx.",
    "common.hours": "hours",
    "common.days": "days",
    "common.day": "Day",
    "common.window": "Window",
    "common.site": "Site",
    "common.noData": "No data",
    "common.energy": "Energy",
    "common.eclipse": "Eclipse",
    "common.comms": "Comms",
    "common.outage": "Outage",
    "common.sunShort": "Sun",
    "common.partialDisk": "partial disk",
    "common.reference": "REFERENCE",
    "common.outOfTolerance": "out of tolerance",
    "common.sinDte": "no DTE",
    "common.verticalTracker": "Vertical tracker",
    "common.mast": "Mast",
    "common.panel": "Panel",
    "common.profile": "Profile",
    "common.date": "Date",
    "status.go": "GO - SAFE",
    "status.caution": "CAUTION - MARGINAL",
    "status.noGo": "NO-GO - UNSAFE",
    "status.reference": "REFERENCE",
    "status.estimate": "ESTIMATE",
    "status.loading": "LOADING",
    "status.noData": "NO DATA",
    "status.referenceText":
      "Equatorial control site with historical significance; not a polar landing candidate.",
    "status.internationalText":
      "International reference site with an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis or a certified landing candidate.",
    "status.customText":
      "User-defined site with an approximate horizon. The score is an estimate; it does not use a LOLA DEM at the point and does not certify the terrain.",
    "status.slopeDanger":
      "Local slope {slope}°: the terrain is not suitable for the selected profile.",
    "status.severe":
      "Does not meet the profile: {limits}. Another profile, date, or communications relay is required.",
    "status.goText":
      "Meets the mission profile under the selected assumptions; review the raw metrics before deciding.",
    "status.cautionLimits": "Viable with reservations: {limits}.",
    "status.cautionGeneric": "Intermediate score; compare another date or site.",
    "status.noGoLimits": "Does not meet the profile: {limits}.",
    "status.noGoGeneric":
      "Low score; the site-date combination is not viable with this profile.",
    "limit.eclipse": "eclipse {hours} h > {tol} h",
    "limit.dte": "DTE {pct}% < {req}%",
    "limit.outage": "DTE outage {hours} h > {tol} h",
    "limit.slope": "local slope {slope}° > 15°",
    "profile.technology_demo.name": "Short technology demo",
    "profile.technology_demo.description":
      "28-day demonstration; tolerates a moderate eclipse but is sensitive to energy and long radio outages.",
    "profile.technology_demo.basis":
      "Team assumption for a short direct-DTE demo; not a NASA requirement.",
    "profile.night_survivor.name": "Night-surviving rover",
    "profile.night_survivor.description":
      "Battery-limited rover that must survive the longest continuous eclipse; energy dominates the decision.",
    "profile.night_survivor.basis":
      "Team assumption for a battery-limited rover; not a NASA requirement.",
    "profile.crewed_outpost.name": "Crewed outpost with direct DTE",
    "profile.crewed_outpost.description":
      "Crewed outpost with strict Earth-link continuity and a short tolerated solar eclipse.",
    "profile.crewed_outpost.basis":
      "Team assumption for a crewed outpost; not a NASA requirement.",
    "profile.relay_store_forward.name": "Relay / store-and-forward",
    "profile.relay_store_forward.description":
      "Profile for a mission with a relay or on-board storage: tolerates long DTE outages and does not require continuous direct visibility. It is not pure direct DTE; it is shown to compare alternatives.",
    "profile.relay_store_forward.basis":
      "Team assumption for a mission with a relay or on-board storage; the relay itself is not simulated.",
    "profile.custom.name": "Custom profile",
    "profile.custom.description":
      "User-defined thresholds; the system scores and classifies sites against them.",
    "profile.custom.basis":
      "User-defined thresholds, not a NASA requirement. All four thresholds met = GO; in strict mode, any unmet threshold is NO-GO.",
    "panel.horizontal.label": "Horizontal",
    "panel.horizontal.description":
      "Normal to zenith. Irradiance proportional to sin(solar elevation).",
    "panel.vertical_fixed.label": "Vertical fixed",
    "panel.vertical_fixed.description":
      "Vertical panel oriented to the site's optimal azimuth.",
    "panel.vertical_tracker.label": "Vertical tracker",
    "panel.vertical_tracker.description":
      "Vertical panel whose azimuth follows the Sun; maximizes capture at the pole.",
    "verdict.referenceSummary":
      "Reference site: {dte}% DTE and {sun}% of hours with Sun. Not a polar candidate.",
    "verdict.customSummary":
      "Approximate-horizon estimate: {sun}% of hours with Sun, {dte}% DTE, and a maximum outage of {outage}.",
    "verdict.internationalSummary":
      "International reference: {sun}% of hours with Sun and {dte}% DTE. Analytic flat horizon; not a LOLA terrain analysis.",
    "verdict.summary": "{sun}% of hours with Sun, {dte}% DTE and {comms}.",
    "verdict.commsOut":
      "no continuous DTE link: the longest outage is {outage} and the tolerance is {tol} h",
    "verdict.commsOk": "DTE link within tolerance: the longest outage is {outage}",
    "verdict.window": "Window: {days} d from {start} · instant {now}",
    "verdict.profile": "Profile: {name}",
    "check.energy": "Energy",
    "check.eclipse": "Eclipse",
    "check.dte": "DTE",
    "check.outage": "DTE outage",
    "check.req": "req.",
    "check.pass": "PASS",
    "check.fail": "FAIL",
    "term.energy": "Energy",
    "term.eclipse": "Eclipse",
    "term.dte": "DTE",
    "term.comms": "Comms",
    "term.energyTitle":
      "Required {req} kWh/m²; the score saturates when reached.",
    "term.eclipseTitle": "Tolerance {tol} h of continuous eclipse.",
    "term.dteTitle": "Required {req}%; partial disk {partial}%.",
    "term.commsTitle": "Tolerance {tol} h; {state}",
    "term.commsOut": "out of tolerance: 0/100.",
    "term.commsIn": "within tolerance.",
    "term.points": "{label}: {points} of {max} points",
    "telemetry.irradiance":
      "Panel irradiance: {value} W/m² · f☉ {fraction}%",
    "telemetry.horizon":
      "LOLA horizon: {horizon}° · clearance {clearance}°",
    "telemetry.dteCenter": "DTE: Earth center visible",
    "telemetry.dteBlocked": "DTE: blocked by the horizon",
    "countdown.nextSolarEvent": "Next solar event:",
    "countdown.nextDteEvent": "Next DTE event:",
    "countdown.nextSunset": "Next solar sunset:",
    "countdown.sunsetAt": "Sunset at {time} UTC",
    "countdown.noSunset": "No sunset",
    "countdown.noSunsetWindow": "No solar sunset in the 28-day window.",
    "countdown.nextSunrise": "Next sunrise:",
    "countdown.sunriseAt": "Sunrise at {time} UTC",
    "countdown.noSunrise": "No sunrise",
    "countdown.noSunriseWindow": "No solar sunrise in the 28-day window.",
    "countdown.nextDteLoss": "Next DTE loss:",
    "countdown.dteLossAt": "Loss at {time} UTC",
    "countdown.dteContinuous": "DTE continuous",
    "countdown.dteContinuousWindow": "No loss of the Earth center in 28 days.",
    "countdown.nextEarthrise": "Next Earthrise:",
    "countdown.earthriseAt": "Reappearance at {time} UTC",
    "countdown.noEarthrise": "No Earthrise",
    "countdown.noEarthriseWindow":
      "No reappearance of the Earth center in the 28-day window.",
    "countdown.noEvents": "No event data.",
    "model.profile":
      "{name}: energy ≥ {energy} kWh/m²; eclipse ≤ {eclipse} h; DTE ≥ {dte}%; DTE outage ≤ {outage} h. Panel: {panel}; mast: {mast} m.",
    "model.commsNote":
      "Comms = 1 − max DTE outage / tolerance. In this profile, an outage ≥ {tol} h gives 0/100; it does not mean the data is missing. DTE uses the Earth center ({dte}% of the time); the partial disk ({partial}%) is computed but not part of the score.",
    "model.customNote":
      "Custom profile: equal weights (1/1/1/1). Meeting all four thresholds is GO; the index is a margin indicator. In strict mode, any unmet threshold is NO-GO. Without strict mode, a missed threshold is CAUTION when the index is ≥50, otherwise NO-GO.",
    "customProfile.energy": "Required energy (kWh/m²)",
    "customProfile.eclipse": "Maximum eclipse (h)",
    "customProfile.dte": "Required DTE (%)",
    "customProfile.outage": "Maximum DTE outage (h)",
    "customProfile.range": "{field} must be between {min} and {max}.",
    "customProfile.applied": "Custom thresholds applied.",
    "site.source": "Horizon: {horizon} · Ephemerides: {ephem}",
    "site.customName": "Custom site",
    "site.customDescription.lola":
      "User-defined site. Evaluated with local ephemerides and the LOLA horizon from {site}, {km} km away (nearest real LOLA profile within 10 km); it is not a DEM at the point. Slope and elevation are not available.",
    "site.customDescription.flat":
      "User-defined site. Evaluated with local ephemerides and an approximate flat horizon because there is no real LOLA profile within 10 km. It must not be interpreted as terrain certification.",
    "horizon.hybrid": "LOLA hybrid (5 m + 80 m/px)",
    "horizon.regional": "LOLA 80 m/px regional",
    "horizon.analytic": "analytic flat",
    "horizon.nearest": "LOLA from {site} (approx.)",
    "horizon.flat": "approximate flat",
    "horizon.approx": "approximate",
    "horizon.unavailable": "no data",
    "horizon.unknown": "unclassified",
    "ephem.horizons": "JPL Horizons DE441",
    "ephem.iau": "local IAU 2000",
    "radar.real": "Real LOLA",
    "radar.analytic": "Analytic",
    "radar.approx": "Approximate",
    "quality.hybrid": "LOLA 5 m/px + 80 m/px",
    "quality.regional": "LOLA 80 m/px regional",
    "quality.analytic": "Analytic horizon",
    "quality.unavailable": "No LOLA DEM available",
    "quality.customLola": "Approximate · LOLA horizon from {site}",
    "quality.customFlat": "Approximate · flat horizon (no LOLA within 10 km)",
    "quality.approx": "Approximate",
    "terrain.title": "Terrain validation (cross-DEM)",
    "terrain.method":
      "5 m/px near-field DEM vs 80 m/px regional DEM over each site's near-field radial range ({minKm}–{maxKm} km), {azimuths} azimuths, 2 m mast. It measures cross-product agreement, not absolute accuracy: both products derive from LOLA and do not resolve rocks below their pixel size.",
    "terrain.aggregate": "{samples} azimuth comparisons · RMS {rms}° · max {max}°",
    "terrain.caption":
      "Per-site angular difference between the near-field and regional horizons.",
    "terrain.colSite": "Site",
    "terrain.colRms": "RMS (°)",
    "terrain.colMax": "Max (°)",
    "terrain.colSamples": "Azimuths",
    "group.candidates": "Artemis III candidates",
    "group.historical": "Historical & other programs",
    "group.clps": "CLPS & commercial",
    "group.international": "International references",
    "group.custom": "Custom coordinates",
    "program.artemis3": "Artemis III",
    "program.nonOfficial": "Non-official point",
    "program.haworthReference": "Haworth · reference",
    "program.historicalReference": "Historical reference",
    "program.nasaApollo": "NASA · Apollo",
    "program.ussrLuna": "USSR · Luna",
    "program.isro": "ISRO · reference",
    "program.jaxa": "JAXA · reference",
    "program.cnsa": "CNSA · Chang'e",
    "program.intuitiveMachines": "Intuitive Machines · CLPS",
    "program.firefly": "Firefly · CLPS",
    "program.custom": "User-defined coordinates",
    "description.site23":
      "Elevated massif with a hybrid LOLA horizon: 5 m/px in the near field and 80 m/px out to 100 km. Its geometry favors Earth visibility, but the Sun stays low and local relief controls the energy windows.",
    "description.site01":
      "Ridge connecting Shackleton with de Gerlache. It combines relatively high solar exposure with a short path to permanently shadowed terrain; the real LOLA horizon shows nearby ridges blocking part of the low sky.",
    "description.site04":
      "Analysis point on the rim of Shackleton crater, less than one degree from the south pole. It is not an official Artemis III candidate region; it is included for its extreme slope and grazing-light regime. The hybrid LOLA horizon includes the crater wall.",
    "description.site07":
      "Elevated promontory near Shackleton with a relatively open horizon over a wide azimuth range. The 5 m/px LOLA DEM resolves nearby ridges that a global model would miss.",
    "description.site11":
      "Elevated rim with a mixed illumination and DTE visibility regime. It is a useful case for studying sensitivity to landing delay with the real LOLA horizon.",
    "description.site20":
      "Broad, moderate-slope plateau suitable for heavy landers. The hybrid LOLA horizon combines the 5 m/px local DEM with the 80 m/px regional DEM.",
    "description.nobile_rim_1":
      "Nobile Rim 1 region, on the high plateau west of Nobile. The 80 m/px regional LOLA DEM shows high, rough relief; there is no 5 m/px local DEM, so the horizon is real but lower resolution.",
    "description.haworth_rim":
      "Reference coordinate inside Haworth crater, next to one of the coldest regions in the solar system. The 80 m/px regional LOLA DEM shows the crater walls dominating the horizon; it is not a certified rim point.",
    "description.control_eq":
      "Equatorial control site. Its analytic flat horizon isolates the effect of the Moon's axial tilt and provides a contrast with polar geometry. It is shown as a reference, not a landing candidate.",
    "description.chandrayaan3":
      "India's Chandrayaan-3 Vikram lander touched down at Shiv Shakti Point (69.37°S, 32.32°E) in August 2023. This reference uses an analytic flat horizon and local IAU 2000 ephemerides; the polar terrain horizon is not modeled with LOLA here.",
    "description.slim":
      "Japan's SLIM lander touched down at Shioli (13.32°S, 25.25°E) in January 2024. This equatorial reference uses an analytic flat horizon and local IAU 2000 ephemerides; the local terrain horizon is not modeled with LOLA here.",
    "description.change4":
      "China's Chang'e 4 landed in Von Kármán crater on the lunar far side (45.46°S, 177.59°E) in January 2019. From the far side the Earth is not directly visible, so the mission relies on a relay. This reference uses an analytic flat horizon and local IAU 2000 ephemerides.",
    "description.apollo12":
      "Apollo 12 landed in Oceanus Procellarum on 19 November 1969, near Surveyor 3. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.apollo14":
      "Apollo 14 landed in the Fra Mauro highlands on 5 February 1971. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.apollo15":
      "Apollo 15 landed at Hadley–Apennine on 30 July 1971. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.apollo16":
      "Apollo 16 landed in the Descartes highlands on 21 April 1972. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.apollo17":
      "Apollo 17 landed in Taurus–Littrow on 11 December 1972, the last crewed lunar landing. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.luna9":
      "Luna 9 made the first soft landing on the Moon on 3 February 1966 in Oceanus Procellarum. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides.",
    "description.luna16":
      "Luna 16 made the first robotic lunar sample return in September 1970 in Mare Fecunditatis. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides.",
    "description.luna17":
      "Luna 17 delivered the Lunokhod 1 rover to Mare Imbrium in November 1970. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides.",
    "description.luna21":
      "Luna 21 delivered the Lunokhod 2 rover to Le Monnier in January 1973. Historical reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides.",
    "description.change3":
      "Chang'e 3 landed in northern Mare Imbrium in December 2013 and deployed the Yutu rover. International reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.change5":
      "Chang'e 5 returned lunar samples from northern Oceanus Procellarum in December 2020. International reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.change6":
      "Chang'e 6 returned the first samples from the lunar far side, in Apollo Basin (South Pole–Aitken), in June 2024. Earth is not directly visible, so a relay is required. International reference with real coordinates, an analytic flat horizon and local IAU 2000 ephemerides; not a LOLA terrain analysis.",
    "description.im1_odysseus":
      "Intuitive Machines' IM-1 Odysseus landed near Malapert A at 80.13°S, 1.44°E on 22 February 2024, the first commercial soft landing. This reference uses a regional 80 m/px LOLA horizon (no 5 m/px near-field DEM) and local IAU 2000 ephemerides. IM-1 lies near the northern edge of the 80S DEM, so distant relief may be underrepresented to the north.",
    "description.im2_athena":
      "Intuitive Machines' IM-2 Athena landed in the Mons Mouton region at 84.7906°S, 29.1957°E on 6 March 2025 and came to rest on its side. This reference uses a regional 80 m/px LOLA horizon and local IAU 2000 ephemerides.",
    "description.blue_ghost_1":
      "Firefly's Blue Ghost Mission 1 landed near Mons Latreille in Mare Crisium (18.56°N, 61.81°E) on 2 March 2025. This reference uses an analytic flat horizon and local IAU 2000 ephemerides; it is not a LOLA terrain analysis.",
    "description.im3_reiner_gamma":
      "Intuitive Machines' IM-3 (PRISM) is a future CLPS target in the Reiner Gamma region (representative point 7.5°N, 59.0°W). This reference uses an analytic flat horizon and local IAU 2000 ephemerides; the site is not yet occupied.",
    "action.simulate": "Simulate",
    "action.pause": "Pause",
    "action.compare": "Compare",
    "action.dates": "Dates",
    "action.loading.compare":
      "Evaluating all sites with the same window and assumptions…",
    "action.loading.sweep": "Loading the monthly date sweep…",
    "action.loading.matrix": "Loading monthly sweeps for the sites…",
    "action.loading.evaluate": "Computing the 28-day window with LOLA + Horizons…",
    "action.error.compare": "Could not complete the comparison: {message}",
    "action.error.sweep": "Could not load the sweep: {message}",
    "action.error.matrix": "Could not load the matrix: {message}",
    "action.noSweep":
      "No precomputed sweep for {site}. Run <code>npm run data:sweep</code> to generate it.",
    "action.noMatrix":
      "No precomputed sweeps. Run <code>npm run data:sweep</code> to generate them.",
    "action.noSweepBadge": "No precomputed data",
    "action.sweepTitle": "Date sweep · {site}",
    "action.sweepBadge": "{count} monthly windows · 2026–2028",
    "action.matrixBadge": "{sites} sites × {months} months · 2026–2028",
    "action.loadFailed": "Could not evaluate: {message}",
    "action.bootstrapFailed": "Could not load the LOLA data: {message}",
    "action.loadingErrorTitle": "Error loading LOLA + Horizons",
    "action.loadingTitle": "Loading LOLA + Horizons",
    "action.loadingSubtitle":
      "Reading the real horizons and precomputed ephemerides…",
    "error.noEphemeris": "No ephemeris for {time} ({site})",
    "custom.numeric": "Enter numeric latitude and longitude.",
    "custom.latRange":
      "Latitude must be between -90° and 90°. You entered {value}°.",
    "custom.lonRange":
      "Longitude must be between 0° and 360°. You entered {value}°.",
    "comparison.title": "Site decision matrix and comparison",
    "comparison.badge": "Same window · same assumptions",
    "comparison.tableTitle": "Landing-site comparison matrix",
    "comparison.tableBadge": "LOLA + Horizons · transparent model",
    "comparison.headerSite": "Site / data",
    "comparison.headerScore": "Score",
    "comparison.headerEnergy": "Energy (28 d)",
    "comparison.headerEclipse": "Continuous eclipse",
    "comparison.headerDte": "DTE center",
    "comparison.headerComms": "Comms (DTE outage)",
    "comparison.headerSlope": "Local slope",
    "comparison.window": "Window: {days} days from {start}",
    "comparison.profile": "Profile: {name}",
    "comparison.panel": "Panel: {name}",
    "comparison.mast": "Mast: {mast} m",
    "comparison.note":
      "All rows use the same start date, window, profile, panel and mast height as the main panel. The score is a decision index, not a landing certification. Click a row to select the site.",
    "comparison.matrixButton": "Site × date matrix",
    "comparison.abButton": "Side-by-side A/B",
    "comparison.footnote":
      "Comms = 1 − max DTE outage / tolerance. A 0/100 indicates that the outage equals or exceeds the profile tolerance, not that data is missing. The outage is measured within the 28-day window; if it lasts longer, the value is a lower bound. DTE uses the Earth center; the partial disk is shown for reference and is not part of the score. Switch the profile to “Relay / store-and-forward” to see non-zero values.",
    "comparison.req": "req {value}",
    "comparison.tol": "tol {value} h",
    "comparison.partial": "partial disk {pct}%",
    "comparison.outOfTolerance": "0/100 · out of tolerance",
    "comparison.withinTolerance": "{pct}/100",
    "comparison.noDem": "no DEM",
    "comparison.selectSite": "Select {site}",
    "comparison.refScore": "REFERENCE",
    "comparison.statusScore": "{status} · {score}%",
    "comparison.commsOutTitle":
      "DTE outage {outage} h ≥ tolerance {tol} h: 0/100, out of tolerance. The data is present.",
    "comparison.commsInTitle":
      "DTE outage {outage} h within the {tol} h tolerance: {pct}/100.",
    "comparison.ephemHorizons": "Horizons",
    "comparison.ephemIau": "IAU 2000",
    "sweep.title": "Date sweep · launch slip",
    "sweep.chartAria": "Monthly sweep of energy, DTE and outage for {site}",
    "sweep.strip.energy": "Energy (kWh/m²)",
    "sweep.strip.dte": "DTE (%)",
    "sweep.strip.cut": "DTE outage (h)",
    "sweep.current": "current date",
    "sweep.thresholdEnergy": "req {value}",
    "sweep.thresholdDte": "≥{value}%",
    "sweep.thresholdCut": "tol {value} h",
    "sweep.legend.energy": "Energy",
    "sweep.legend.dte": "DTE",
    "sweep.legend.cut": "Outage",
    "sweep.legendNote": "Dashed lines: profile thresholds",
    "sweep.note":
      "Monthly sampling of 28-day windows. The outage is a lower bound if it lasts longer than the window. Earthset = first loss of the Earth center after the start; “—” if it does not occur in the window. Click a month in the chart or a date in the table to load that date in the main view.",
    "sweep.tableSummary": "Show the 36-month table",
    "sweep.headerMonth": "Month",
    "sweep.headerEnergy": "Energy",
    "sweep.headerSun": "Sun",
    "sweep.headerDte": "DTE",
    "sweep.headerCut": "Outage",
    "sweep.headerEarthset": "Earthset",
    "sweep.headerScore": "Score",
    "sweep.noEarthset": "no Earthset",
    "sweep.earthHidden": "Earth hidden",
    "sweep.assumptions.site": "Site: {name}",
    "sweep.assumptions.sampling": "Sampling: 36 monthly windows · 2026–2028",
    "sweep.assumptions.profile": "Profile: {name}",
    "sweep.assumptions.panel": "Panel: {name}",
    "sweep.assumptions.mast": "Mast: {mast} m",
    "sweep.mastWarning":
      "DTE and outage are precomputed with a {pre} m mast; the main panel uses {current} m.",
    "sweep.tooltip.hint": "Click to load this date",
    "sweep.tooltip.energy": "Energy",
    "sweep.tooltip.sun": "Sun",
    "sweep.tooltip.dte": "DTE",
    "sweep.tooltip.cut": "Outage",
    "sweep.tooltip.earthset": "Earthset",
    "sweep.tooltip.score": "Score",
    "matrix.title": "Site × date matrix",
    "matrix.metric": "Metric",
    "matrix.metric.score": "Score",
    "matrix.metric.sun": "Sun (%)",
    "matrix.metric.dte": "DTE (%)",
    "matrix.metric.cut": "DTE outage",
    "matrix.legend.good": "meets",
    "matrix.legend.warn": "marginal",
    "matrix.legend.bad": "does not meet",
    "matrix.note":
      "Each cell is a 28-day window from the first day of the month. Score with the current profile; energy with the current panel; DTE and outage with a 2 m mast. Click a cell to load that site and date in the main view. Rows marked REFERENCE are context, not ranked candidates; international references use an analytic flat horizon.",
    "matrix.mastWarning":
      "DTE and outage are precomputed with a 2.0 m mast; the main panel uses {current} m.",
    "matrix.site": "Site",
    "ab.title": "Side-by-side A/B comparison",
    "ab.badge": "Same profile · panel · mast",
    "ab.scenarioA": "Scenario A",
    "ab.scenarioB": "Scenario B",
    "ab.site": "Site",
    "ab.date": "Date (UTC)",
    "ab.compare": "Compare",
    "ab.load": "Load in main view",
    "ab.context":
      "Both scenarios use the current profile, panel and mast.",
    "ab.metrics.sun": "Sun",
    "ab.metrics.dte": "DTE",
    "ab.metrics.outage": "Outage",
    "ab.metrics.eclipse": "Eclipse",
    "ab.metrics.energy": "Energy",
    "ab.metrics.slope": "Local slope",
    "ab.metrics.score": "Mission index",
    "ab.delta": "Δ (B − A)",
    "ab.loading": "Evaluating scenarios A and B…",
    "ab.error": "Could not compare the scenarios: {message}",
    "ab.radarAria": "LOLA horizon radar for {site} on {date}",
    "ab.points": "pts",
    "ab.percentPoints": "pp",
    "guide.title": "How to read this tool",
    "guide.badge": "Decision-support · not flight-certified",
    "guide.intro":
      "This tool compares lunar landing sites and dates using real LOLA terrain and JPL Horizons ephemerides. It is decision-support and educational software, not a flight-certified landing analysis.",
    "guide.quickStart.title": "Quick start",
    "guide.quickStart.body":
      "<ol><li>Pick a curated site or enter custom coordinates.</li><li>Pick a date; the 28-day evaluation window starts there.</li><li>Read the verdict: Sun %, DTE % and the longest DTE outage, then the PASS/FAIL checklist against your profile thresholds.</li><li>If the built-in profiles do not match your mission, choose <strong>Custom</strong> and set the energy, eclipse, DTE and outage thresholds.</li><li>Use the polar radar and the 2.5D panorama to see the Sun and Earth against the LOLA horizon.</li><li>Use <strong>Dates</strong> to sweep 36 months, <strong>Compare</strong> for the site matrix or side-by-side A/B, and <strong>Share</strong> to copy a scenario link.</li></ol>",
    "guide.metrics.title": "What the metrics mean",
    "guide.metrics.body":
      "<dl><dt>Sunlit %</dt><dd>Fraction of hours with at least 5% of the solar disk above the LOLA horizon. It is not necessarily full Sun.</dd><dt>DTE %</dt><dd>Fraction of hours with the Earth's center above the local horizon (direct-to-Earth).</dd><dt>Outage</dt><dd>Longest continuous DTE blackout inside the 28-day window.</dd><dt>Eclipse</dt><dd>Longest continuous solar eclipse inside the window.</dd><dt>Energy</dt><dd>Solar energy accumulated over 28 days for the selected panel and mast.</dd><dt>Mission index</dt><dd>A weighted decision index from energy, eclipse, DTE and outage. It is not a probability of success.</dd></dl>",
    "guide.pole.title": "Why the south pole is hard",
    "guide.pole.body":
      "<p>The Sun and the Earth stay close to the horizon at the south pole. A ridge a few degrees high can hide them, so a small change in site or date can flip the verdict.</p><p>Permanently shadowed regions (PSRs) can hold ice but produce no solar power. On the far side the Earth is not directly visible; those missions need a relay, which is why Chang'e 4 shows 0% DTE here.</p>",
    "guide.glossary.title": "Glossary",
    "guide.glossary.body":
      "<dl><dt>LOLA</dt><dd>Lunar Orbiter Laser Altimeter; the laser altimeter behind the DEMs used here.</dd><dt>DEM</dt><dd>Digital elevation model; a grid of terrain heights.</dd><dt>Horizon</dt><dd>The local skyline; here a 1D profile of the maximum elevation per azimuth.</dd><dt>DTE</dt><dd>Direct-to-Earth; a radio link with the Earth above the local horizon.</dd><dt>PSR</dt><dd>Permanently shadowed region; terrain that never receives direct sunlight.</dd><dt>Libration</dt><dd>The Moon's slight wobble, which moves the Earth's apparent position over a month.</dd><dt>CLPS / HLS</dt><dd>NASA's Commercial Lunar Payload Services and Human Landing System programs.</dd><dt>Artemis III</dt><dd>NASA's crewed landing mission and its candidate regions.</dd></dl>",
    "guide.try.title": "Try this",
    "guide.try.body":
      "<ol><li>Select Malapert Massif, 14 Nov 2026: about 50% Sun, 42% DTE, 12-day outage.</li><li>Open <strong>Dates</strong> and click May 2027: 0% Sun, 47% DTE, 14.8-day outage.</li><li>Open <strong>Compare</strong> → <strong>Side-by-side A/B</strong> and choose Chang'e 4: a far-side reference with 0% DTE, which shows why a relay is needed.</li><li>Use <strong>Share</strong> to copy the scenario link, or <strong>Export JSON/CSV</strong> for the data.</li></ol>",
    "guide.limits.title": "Limits",
    "guide.limits.body":
      "Decision-support and educational software, not flight-certified. It does not model rocks below DEM resolution, thermal state, batteries, rover mobility, relay constellations, or Monte Carlo uncertainty. The horizon is a 1D profile per azimuth; the 2.5D panorama is a shaded representation. Nobile/Haworth use 80 m/px; custom and international reference sites use approximate or analytic flat horizons.",
    "matrix.cellTitle":
      "{site} · {date}: score {score}/100, {sun}% Sun, {dte}% DTE, outage {outage}, {energy} kWh/m²",
    "panorama.sun": "Sun",
    "panorama.earth": "Earth",
    "panorama.horizon": "Horizon",
    "panorama.fullSky": "Full sky",
    "panorama.realDisks": "True-scale disks",
    "panorama.enlargedDisks": "Enlarged disks",
    "panorama.readout.sun": "Sun az/el",
    "panorama.readout.earth": "Earth az/el",
    "panorama.readout.sunHorizon": "Sun horizon",
    "panorama.readout.earthHorizon": "Earth horizon",
    "panorama.readout.mast": "Mast",
    "panorama.belowHorizon": "below the horizon",
    "panorama.empty": "LOLA panorama not available",
    "panorama.sunPath": "24 h solar path",
    "panorama.earthLoop": "28 d Earth loop",
    "radar.sunLabel": "SUN ({el}°)",
    "radar.earthLabel": "EARTH ({el}°)",
    "timeline.sun": "Sun: {el}° · horizon {horizon}°",
    "timeline.earth": "Earth: {el}° · horizon {horizon}°",
    "timeline.fraction": "f☉ {sun}% · f⊕ {earth}%",
    "timeline.energy": "Energy: {value} W/m²",
    "sim.day": "Day {day} of {total}",
    "sim.dayShort": "Day {day} / {total}",
    "sim.dayAria": "Day {day} of {total}, {time}",
    "play.simulate": "Simulate",
    "play.pause": "Pause",
    "share.button": "Share",
    "share.copied": "Link copied",
    "share.copyPrompt": "Copy this scenario link:",
    "export.json": "Export JSON",
    "export.csv": "Export CSV",
    "export.downloaded": "Downloaded",
    "export.error": "Could not export: {message}",
    "scenario.customDate": "Custom date"
  },
  es: {
    "meta.title": "Lunar Landing Site Navigator | NASA Space Apps 2026",
    "meta.description":
      "Lunar Landing Site Navigator: compara sitios de alunizaje con topografía LOLA y efemérides JPL Horizons.",
    "common.sun": "Sol",
    "common.earth": "Tierra",
    "common.sunUpper": "SOL",
    "common.earthUpper": "TIERRA",
    "common.horizon": "Horizonte",
    "common.score": "Score",
    "common.approx": "aprox.",
    "common.hours": "horas",
    "common.days": "días",
    "common.day": "Día",
    "common.window": "Ventana",
    "common.site": "Sitio",
    "common.noData": "Sin datos",
    "common.energy": "Energía",
    "common.eclipse": "Eclipse",
    "common.comms": "Comms",
    "common.outage": "Corte",
    "common.sunShort": "Sol",
    "common.partialDisk": "disco parcial",
    "common.reference": "REFERENCIA",
    "common.outOfTolerance": "fuera de tolerancia",
    "common.sinDte": "sin DTE",
    "common.verticalTracker": "Vertical con seguimiento",
    "common.mast": "Mástil",
    "common.panel": "Panel",
    "common.profile": "Perfil",
    "common.date": "Fecha",
    "status.go": "GO - SEGURO",
    "status.caution": "PRECAUCIÓN - MARGINAL",
    "status.noGo": "NO-GO - PELIGROSO",
    "status.reference": "REFERENCIA",
    "status.estimate": "ESTIMACIÓN",
    "status.loading": "CARGANDO",
    "status.noData": "SIN DATOS",
    "status.referenceText":
      "Sitio ecuatorial de control histórico; no es un candidato polar de aterrizaje.",
    "status.internationalText":
      "Sitio internacional de referencia con horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis de terreno LOLA ni un candidato certificado.",
    "status.customText":
      "Sitio definido por el usuario con horizonte aproximado. El score es una estimación; no usa un DEM LOLA en el punto y no certifica el terreno.",
    "status.slopeDanger":
      "Pendiente local {slope}°: el terreno no es apto para el perfil seleccionado.",
    "status.severe":
      "No cumple el perfil: {limits}. Se requiere otro perfil, otra fecha o un relé de comunicaciones.",
    "status.goText":
      "Cumple el perfil de misión con los supuestos seleccionados; revisar las métricas crudas antes de decidir.",
    "status.cautionLimits": "Viable con reservas: {limits}.",
    "status.cautionGeneric": "Score intermedio; conviene comparar otra fecha o sitio.",
    "status.noGoLimits": "No cumple el perfil: {limits}.",
    "status.noGoGeneric":
      "Score bajo; la combinación sitio-fecha no es viable con este perfil.",
    "limit.eclipse": "eclipse {hours} h > {tol} h",
    "limit.dte": "DTE {pct}% < {req}%",
    "limit.outage": "corte DTE {hours} h > {tol} h",
    "limit.slope": "pendiente local {slope}° > 15°",
    "profile.technology_demo.name": "Demo tecnológica de corta duración",
    "profile.technology_demo.description":
      "Demostración de 28 días; tolera un eclipse moderado pero es sensible a la energía y a cortes de radio largos.",
    "profile.technology_demo.basis":
      "Supuesto del equipo para una demo corta con DTE directo; no es un requisito NASA.",
    "profile.night_survivor.name": "Rover superviviente de noche lunar",
    "profile.night_survivor.description":
      "Rover limitado por baterías que debe sobrevivir al eclipse continuo más largo; la energía domina la decisión.",
    "profile.night_survivor.basis":
      "Supuesto del equipo para un rover limitado por baterías; no es un requisito NASA.",
    "profile.crewed_outpost.name": "Puesto tripulado con DTE directo",
    "profile.crewed_outpost.description":
      "Puesto tripulado con continuidad estricta de enlace a Tierra y eclipse solar corto tolerado.",
    "profile.crewed_outpost.basis":
      "Supuesto del equipo para un puesto tripulado; no es un requisito NASA.",
    "profile.relay_store_forward.name": "Relé / store-and-forward",
    "profile.relay_store_forward.description":
      "Perfil para una misión con relé o almacenamiento a bordo: tolera outages DTE largos y no exige visibilidad directa continua. No es DTE directo puro; se muestra para comparar alternativas.",
    "profile.relay_store_forward.basis":
      "Supuesto del equipo para una misión con relé o almacenamiento a bordo; el relé no se simula.",
    "profile.custom.name": "Perfil personalizado",
    "profile.custom.description":
      "Umbrales definidos por el usuario; el sistema puntúa y clasifica los sitios con ellos.",
    "profile.custom.basis":
      "Umbrales definidos por el usuario, no un requisito NASA. Cumplir los cuatro es GO; en modo estricto, cualquier umbral incumplido es NO-GO.",
    "panel.horizontal.label": "Horizontal",
    "panel.horizontal.description":
      "Normal al cenit. Irradiancia proporcional a sin(elevación solar).",
    "panel.vertical_fixed.label": "Vertical fijo",
    "panel.vertical_fixed.description":
      "Panel vertical orientado al azimut óptimo del sitio.",
    "panel.vertical_tracker.label": "Vertical con seguimiento",
    "panel.vertical_tracker.description":
      "Panel vertical cuyo azimut sigue al Sol; maximiza la captura en el polo.",
    "verdict.referenceSummary":
      "Sitio de referencia: {dte}% de DTE y {sun}% de horas con Sol. No es un candidato polar.",
    "verdict.customSummary":
      "Estimación con horizonte aproximado: {sun}% de horas con Sol, {dte}% de DTE y un corte máximo de {outage}.",
    "verdict.internationalSummary":
      "Referencia internacional: {sun}% de horas con Sol y {dte}% de DTE. Horizonte analítico plano; no es un análisis de terreno LOLA.",
    "verdict.summary":
      "{sun}% de las horas con Sol, {dte}% de DTE y {comms}.",
    "verdict.commsOut":
      "sin enlace DTE continuo: el corte más largo es de {outage} y la tolerancia es {tol} h",
    "verdict.commsOk":
      "enlace DTE dentro de tolerancia: el corte más largo es de {outage}",
    "verdict.window":
      "Ventana: {days} d desde {start} · instante {now}",
    "verdict.profile": "Perfil: {name}",
    "check.energy": "Energía",
    "check.eclipse": "Eclipse",
    "check.dte": "DTE",
    "check.outage": "Corte DTE",
    "check.req": "req.",
    "check.pass": "CUMPLE",
    "check.fail": "NO CUMPLE",
    "term.energy": "Energía",
    "term.eclipse": "Eclipse",
    "term.dte": "DTE",
    "term.comms": "Comms",
    "term.energyTitle":
      "Requerido {req} kWh/m²; el score se satura al alcanzarlo.",
    "term.eclipseTitle": "Tolerancia {tol} h de eclipse continuo.",
    "term.dteTitle": "Requerido {req}%; disco parcial {partial}%.",
    "term.commsTitle": "Tolerancia {tol} h; {state}",
    "term.commsOut": "fuera de tolerancia: 0/100.",
    "term.commsIn": "dentro de tolerancia.",
    "term.points": "{label}: {points} de {max} puntos",
    "telemetry.irradiance":
      "Irradiancia panel: {value} W/m² · f☉ {fraction}%",
    "telemetry.horizon":
      "Horizonte LOLA: {horizon}° · despeje {clearance}°",
    "telemetry.dteCenter": "DTE: centro de Tierra visible",
    "telemetry.dteBlocked": "DTE: bloqueada por el horizonte",
    "countdown.nextSolarEvent": "Próximo evento solar:",
    "countdown.nextDteEvent": "Próximo evento DTE:",
    "countdown.nextSunset": "Próximo ocaso solar:",
    "countdown.sunsetAt": "Ocaso a las {time} UTC",
    "countdown.noSunset": "Sin ocaso",
    "countdown.noSunsetWindow": "No hay ocaso solar en la ventana de 28 días.",
    "countdown.nextSunrise": "Próximo amanecer:",
    "countdown.sunriseAt": "Amanecer a las {time} UTC",
    "countdown.noSunrise": "Sin amanecer",
    "countdown.noSunriseWindow": "No hay amanecer solar en la ventana de 28 días.",
    "countdown.nextDteLoss": "Próxima pérdida DTE:",
    "countdown.dteLossAt": "Pérdida a las {time} UTC",
    "countdown.dteContinuous": "DTE continua",
    "countdown.dteContinuousWindow":
      "Sin pérdida del centro de la Tierra en 28 días.",
    "countdown.nextEarthrise": "Próximo Earthrise:",
    "countdown.earthriseAt": "Reaparición a las {time} UTC",
    "countdown.noEarthrise": "Sin Earthrise",
    "countdown.noEarthriseWindow":
      "Sin reaparición del centro de la Tierra en la ventana de 28 días.",
    "countdown.noEvents": "Sin datos de eventos.",
    "model.profile":
      "{name}: energía ≥ {energy} kWh/m²; eclipse ≤ {eclipse} h; DTE ≥ {dte}%; corte DTE ≤ {outage} h. Panel: {panel}; mástil: {mast} m.",
    "model.commsNote":
      "Comms = 1 − corte DTE máximo / tolerancia. En este perfil, un corte ≥ {tol} h da 0/100; no significa que falte el dato. DTE usa el centro de la Tierra ({dte}% del tiempo); el disco parcial ({partial}%) se calcula pero no entra en el score.",
    "model.customNote":
      "Perfil personalizado: pesos iguales (1/1/1/1). Cumplir los cuatro umbrales es GO; el índice es un indicador de margen. En modo estricto, cualquier umbral incumplido es NO-GO. Sin modo estricto, un umbral incumplido es PRECAUCIÓN si el índice es ≥50; si no, NO-GO.",
    "customProfile.energy": "Energía requerida (kWh/m²)",
    "customProfile.eclipse": "Eclipse máximo (h)",
    "customProfile.dte": "DTE requerido (%)",
    "customProfile.outage": "Corte DTE máximo (h)",
    "customProfile.range": "{field} debe estar entre {min} y {max}.",
    "customProfile.applied": "Umbrales personalizados aplicados.",
    "site.source": "Horizonte: {horizon} · Efemérides: {ephem}",
    "site.customName": "Sitio personalizado",
    "site.customDescription.lola":
      "Sitio definido por el usuario. Se evalúa con efemérides locales y el horizonte LOLA de {site}, a {km} km (el perfil LOLA real más cercano dentro de 10 km); no es un DEM del punto. Pendiente y elevación no están disponibles.",
    "site.customDescription.flat":
      "Sitio definido por el usuario. Se evalúa con efemérides locales y un horizonte plano aproximado porque no hay un perfil LOLA real a ≤10 km. No debe interpretarse como una certificación del terreno.",
    "horizon.hybrid": "LOLA híbrido (5 m + 80 m/px)",
    "horizon.regional": "LOLA regional 80 m/px",
    "horizon.analytic": "analítico plano",
    "horizon.nearest": "LOLA de {site} (aprox.)",
    "horizon.flat": "plano aproximado",
    "horizon.approx": "aproximado",
    "horizon.unavailable": "sin datos",
    "horizon.unknown": "sin clasificar",
    "ephem.horizons": "JPL Horizons DE441",
    "ephem.iau": "IAU 2000 local",
    "radar.real": "LOLA real",
    "radar.analytic": "Analítico",
    "radar.approx": "Aproximado",
    "quality.hybrid": "LOLA 5 m/px + 80 m/px",
    "quality.regional": "LOLA 80 m/px regional",
    "quality.analytic": "Horizonte analítico",
    "quality.unavailable": "Sin DEM LOLA disponible",
    "quality.customLola": "Aproximado · horizonte LOLA de {site}",
    "quality.customFlat": "Aproximado · horizonte plano (sin LOLA a ≤10 km)",
    "quality.approx": "Aproximado",
    "terrain.title": "Validación del terreno (entre DEM)",
    "terrain.method":
      "DEM de 5 m/px en campo cercano frente al DEM regional de 80 m/px en el rango radial de campo cercano de cada sitio ({minKm}–{maxKm} km), {azimuths} azimuts, mástil de 2 m. Mide la concordancia entre productos, no la precisión absoluta: ambos derivan de LOLA y no resuelven rocas por debajo de su píxel.",
    "terrain.aggregate":
      "{samples} comparaciones por azimut · RMS {rms}° · máximo {max}°",
    "terrain.caption":
      "Diferencia angular por sitio entre el horizonte de campo cercano y el regional.",
    "terrain.colSite": "Sitio",
    "terrain.colRms": "RMS (°)",
    "terrain.colMax": "Máx (°)",
    "terrain.colSamples": "Azimuts",
    "group.candidates": "Candidatos Artemis III",
    "group.historical": "Históricos y otros programas",
    "group.clps": "CLPS y comerciales",
    "group.international": "Referencias internacionales",
    "group.custom": "Coordenadas personalizadas",
    "program.artemis3": "Artemis III",
    "program.nonOfficial": "Punto no oficial",
    "program.haworthReference": "Haworth · referencia",
    "program.historicalReference": "Referencia histórica",
    "program.nasaApollo": "NASA · Apollo",
    "program.ussrLuna": "URSS · Luna",
    "program.isro": "ISRO · referencia",
    "program.jaxa": "JAXA · referencia",
    "program.cnsa": "CNSA · Chang'e",
    "program.intuitiveMachines": "Intuitive Machines · CLPS",
    "program.firefly": "Firefly · CLPS",
    "program.custom": "Coordenadas definidas por el usuario",
    "description.site23":
      "Macizo elevado con un horizonte LOLA híbrido de 5 m/px en el campo cercano y 80 m/px hasta 100 km. Su geometría favorece la visibilidad de la Tierra, pero el Sol permanece bajo y el relieve local condiciona las ventanas de energía.",
    "description.site01":
      "Cresta que conecta Shackleton con de Gerlache. Combina una exposición solar relativamente alta con un acceso corto a terreno permanentemente sombreado; el horizonte LOLA real muestra crestas cercanas que bloquean parte del cielo bajo.",
    "description.site04":
      "Punto de análisis en el borde del cráter Shackleton, a menos de un grado del polo sur. No es una región candidata oficial de Artemis III; se incluye por su pendiente extrema y su régimen de iluminación rasante. El horizonte LOLA híbrido incluye el muro del cráter.",
    "description.site07":
      "Promontorio elevado cerca de Shackleton con un horizonte relativamente abierto en un amplio rango de azimuts. El DEM LOLA 5 m/px permite resolver crestas cercanas que un modelo global no vería.",
    "description.site11":
      "Borde elevado con un régimen mixto de iluminación y visibilidad DTE. Es un caso útil para estudiar la sensibilidad al retraso de aterrizaje con el horizonte LOLA real.",
    "description.site20":
      "Meseta amplia y de pendiente moderada, adecuada para landers pesados. El horizonte LOLA híbrido combina el DEM local de 5 m/px con el DEM regional de 80 m/px.",
    "description.nobile_rim_1":
      "Región Nobile Rim 1, en la meseta alta al oeste de Nobile. El DEM regional LOLA de 80 m/px muestra relieve alto y rugoso; no hay DEM local de 5 m/px, así que el horizonte es real pero de menor resolución.",
    "description.haworth_rim":
      "Coordenada de referencia en el interior del cráter Haworth, junto a una de las regiones más frías del sistema solar. El DEM regional LOLA de 80 m/px muestra las paredes del cráter dominando el horizonte; no es un punto de borde certificado.",
    "description.control_eq":
      "Sitio ecuatorial de control. Su horizonte analítico plano aísla el efecto de la inclinación axial lunar y sirve para contrastar la geometría polar. Se muestra como referencia, no como candidato de aterrizaje.",
    "description.chandrayaan3":
      "Sitio de referencia de la misión india Chandrayaan-3 en Shiv Shakti Point (69.37°S, 32.32°E), 2023. Usa un horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno polar.",
    "description.slim":
      "Sitio de referencia de la misión japonesa SLIM en Shioli (13.32°S, 25.25°E), 2024. Usa un horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.change4":
      "Sitio de referencia de la misión china Chang'e 4 en Von Kármán (45.46°S, 177.59°E), 2019, en la cara oculta. La Tierra no es visible directamente; la misión depende de un relé. Usa un horizonte analítico plano y efemérides IAU 2000 locales.",
    "description.apollo12":
      "Apollo 12 aterrizó en Oceanus Procellarum el 19 de noviembre de 1969, cerca de Surveyor 3. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.apollo14":
      "Apollo 14 aterrizó en las tierras altas de Fra Mauro el 5 de febrero de 1971. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.apollo15":
      "Apollo 15 aterrizó en Hadley–Apennine el 30 de julio de 1971. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.apollo16":
      "Apollo 16 aterrizó en las tierras altas de Descartes el 21 de abril de 1972. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.apollo17":
      "Apollo 17 aterrizó en Taurus–Littrow el 11 de diciembre de 1972, el último alunizaje tripulado. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.luna9":
      "Luna 9 logró el primer aterrizaje suave en la Luna el 3 de febrero de 1966 en Oceanus Procellarum. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales.",
    "description.luna16":
      "Luna 16 logró el primer retorno robótico de muestras lunares en septiembre de 1970 en Mare Fecunditatis. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales.",
    "description.luna17":
      "Luna 17 entregó el rover Lunokhod 1 en Mare Imbrium en noviembre de 1970. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales.",
    "description.luna21":
      "Luna 21 entregó el rover Lunokhod 2 en Le Monnier en enero de 1973. Referencia histórica con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales.",
    "description.change3":
      "Chang'e 3 aterrizó en el norte de Mare Imbrium en diciembre de 2013 y desplegó el rover Yutu. Referencia internacional con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.change5":
      "Chang'e 5 retornó muestras del norte de Oceanus Procellarum en diciembre de 2020. Referencia internacional con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.change6":
      "Chang'e 6 retornó las primeras muestras de la cara oculta lunar, en la cuenca Apollo (South Pole–Aitken), en junio de 2024. La Tierra no es visible directamente, así que requiere un relé. Referencia internacional con coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.im1_odysseus":
      "El IM-1 Odysseus de Intuitive Machines aterrizó cerca de Malapert A a 80.13°S, 1.44°E el 22 de febrero de 2024, el primer alunizaje comercial suave. Esta referencia usa un horizonte LOLA regional de 80 m/px (sin DEM de 5 m/px en el punto) y efemérides IAU 2000 locales. IM-1 está cerca del borde norte del DEM 80S, así que el relieve lejano hacia el norte puede estar subrepresentado.",
    "description.im2_athena":
      "El IM-2 Athena de Intuitive Machines aterrizó en la región de Mons Mouton a 84.7906°S, 29.1957°E el 6 de marzo de 2025 y quedó sobre un costado. Esta referencia usa un horizonte LOLA regional de 80 m/px y efemérides IAU 2000 locales.",
    "description.blue_ghost_1":
      "El Blue Ghost 1 de Firefly aterrizó cerca de Mons Latreille en Mare Crisium (18.56°N, 61.81°E) el 2 de marzo de 2025. Esta referencia usa un horizonte analítico plano y efemérides IAU 2000 locales; no es un análisis LOLA del terreno.",
    "description.im3_reiner_gamma":
      "El IM-3 (PRISM) de Intuitive Machines es un objetivo CLPS futuro en la región de Reiner Gamma (punto representativo 7.5°N, 59.0°O). Esta referencia usa un horizonte analítico plano y efemérides IAU 2000 locales; el sitio aún no ha sido ocupado.",
    "action.simulate": "Simular",
    "action.pause": "Pausa",
    "action.compare": "Comparar",
    "action.dates": "Fechas",
    "action.loading.compare":
      "Evaluando todos los sitios con la misma ventana y supuestos…",
    "action.loading.sweep": "Cargando barrido mensual de fechas…",
    "action.loading.matrix": "Cargando barridos mensuales de los sitios…",
    "action.loading.evaluate": "Calculando ventana de 28 días con LOLA + Horizons…",
    "action.error.compare": "No se pudo completar la comparación: {message}",
    "action.error.sweep": "No se pudo cargar el barrido: {message}",
    "action.error.matrix": "No se pudo cargar la matriz: {message}",
    "action.noSweep":
      "No hay barrido precalculado para {site}. Ejecuta <code>npm run data:sweep</code> para generarlo.",
    "action.noMatrix":
      "No hay barridos precalculados. Ejecuta <code>npm run data:sweep</code> para generarlos.",
    "action.noSweepBadge": "Sin datos precalculados",
    "action.sweepTitle": "Barrido de fechas · {site}",
    "action.sweepBadge": "{count} ventanas mensuales · 2026–2028",
    "action.matrixBadge": "{sites} sitios × {months} meses · 2026–2028",
    "action.loadFailed": "No se pudo evaluar: {message}",
    "action.bootstrapFailed": "No se pudieron cargar los datos LOLA: {message}",
    "action.loadingErrorTitle": "Error cargando LOLA + Horizons",
    "action.loadingTitle": "Cargando LOLA + Horizons",
    "action.loadingSubtitle":
      "Leyendo los horizontes reales y las efemérides precalculadas…",
    "error.noEphemeris": "Sin efemérides para {time} ({site})",
    "custom.numeric": "Introduce una latitud y una longitud numéricas.",
    "custom.latRange":
      "La latitud debe estar entre -90° y 90°. Has escrito {value}°.",
    "custom.lonRange":
      "La longitud debe estar entre 0° y 360°. Has escrito {value}°.",
    "comparison.title": "Matriz de decisión y comparación de sitios",
    "comparison.badge": "Misma ventana · mismos supuestos",
    "comparison.tableTitle": "Matriz comparativa de sitios de alunizaje",
    "comparison.tableBadge": "LOLA + Horizons · modelo transparente",
    "comparison.headerSite": "Sitio / datos",
    "comparison.headerScore": "Score",
    "comparison.headerEnergy": "Energía (28 d)",
    "comparison.headerEclipse": "Eclipse continuo",
    "comparison.headerDte": "DTE centro",
    "comparison.headerComms": "Comms (corte DTE)",
    "comparison.headerSlope": "Pendiente local",
    "comparison.window": "Ventana: {days} días desde {start}",
    "comparison.profile": "Perfil: {name}",
    "comparison.panel": "Panel: {name}",
    "comparison.mast": "Mástil: {mast} m",
    "comparison.note":
      "Todas las filas usan la misma fecha de inicio, ventana, perfil, panel y altura de mástil que el panel principal. El score es un índice de decisión, no una certificación de aterrizaje. Haz clic en una fila para seleccionar el sitio.",
    "comparison.matrixButton": "Matriz sitio × fecha",
    "comparison.abButton": "Comparación A/B",
    "comparison.footnote":
      "Comms = 1 − corte DTE máximo / tolerancia. Un 0/100 indica que el corte iguala o supera la tolerancia del perfil, no que falte el dato. El corte se mide dentro de la ventana de 28 días; si dura más, el valor es una cota inferior. DTE usa el centro de la Tierra; el disco parcial se muestra como referencia y no entra en el score. Cambia el perfil a “Relé / store-and-forward” para ver valores distintos de 0.",
    "comparison.req": "req {value}",
    "comparison.tol": "tol {value} h",
    "comparison.partial": "disco parcial {pct}%",
    "comparison.outOfTolerance": "0/100 · fuera de tolerancia",
    "comparison.withinTolerance": "{pct}/100",
    "comparison.noDem": "sin DEM",
    "comparison.selectSite": "Seleccionar {site}",
    "comparison.refScore": "REFERENCIA",
    "comparison.statusScore": "{status} · {score}%",
    "comparison.commsOutTitle":
      "Corte DTE {outage} h ≥ tolerancia {tol} h: 0/100, fuera de tolerancia. No falta el dato.",
    "comparison.commsInTitle":
      "Corte DTE {outage} h dentro de la tolerancia de {tol} h: {pct}/100.",
    "comparison.ephemHorizons": "Horizons",
    "comparison.ephemIau": "IAU 2000",
    "sweep.title": "Barrido de fechas · launch slip",
    "sweep.chartAria": "Barrido mensual de energía, DTE y corte para {site}",
    "sweep.strip.energy": "Energía (kWh/m²)",
    "sweep.strip.dte": "DTE (%)",
    "sweep.strip.cut": "Corte DTE (h)",
    "sweep.current": "fecha actual",
    "sweep.thresholdEnergy": "req {value}",
    "sweep.thresholdDte": "≥{value}%",
    "sweep.thresholdCut": "tol {value} h",
    "sweep.legend.energy": "Energía",
    "sweep.legend.dte": "DTE",
    "sweep.legend.cut": "Corte",
    "sweep.legendNote": "Líneas discontinuas: umbral del perfil",
    "sweep.note":
      "Muestreo mensual de ventanas de 28 días. El corte es una cota inferior si dura más que la ventana. Earthset = primera pérdida del centro de Tierra después del inicio; “—” si no ocurre en la ventana. Haz clic en un mes del gráfico o en una fecha de la tabla para cargar esa fecha en la vista principal.",
    "sweep.tableSummary": "Ver tabla de 36 meses",
    "sweep.headerMonth": "Mes",
    "sweep.headerEnergy": "Energía",
    "sweep.headerSun": "Sol",
    "sweep.headerDte": "DTE",
    "sweep.headerCut": "Corte",
    "sweep.headerEarthset": "Earthset",
    "sweep.headerScore": "Score",
    "sweep.noEarthset": "sin Earthset",
    "sweep.earthHidden": "Tierra oculta",
    "sweep.assumptions.site": "Sitio: {name}",
    "sweep.assumptions.sampling": "Muestreo: 36 ventanas mensuales · 2026–2028",
    "sweep.assumptions.profile": "Perfil: {name}",
    "sweep.assumptions.panel": "Panel: {name}",
    "sweep.assumptions.mast": "Mástil: {mast} m",
    "sweep.mastWarning":
      "La curva de DTE y corte está precalculada con mástil {pre} m; el panel principal usa {current} m.",
    "sweep.tooltip.hint": "Clic para cargar esta fecha",
    "sweep.tooltip.energy": "Energía",
    "sweep.tooltip.sun": "Sol",
    "sweep.tooltip.dte": "DTE",
    "sweep.tooltip.cut": "Corte",
    "sweep.tooltip.earthset": "Earthset",
    "sweep.tooltip.score": "Score",
    "matrix.title": "Matriz sitio × fecha",
    "matrix.metric": "Métrica",
    "matrix.metric.score": "Score",
    "matrix.metric.sun": "Sol (%)",
    "matrix.metric.dte": "DTE (%)",
    "matrix.metric.cut": "Corte DTE",
    "matrix.legend.good": "cumple",
    "matrix.legend.warn": "marginal",
    "matrix.legend.bad": "no cumple",
    "matrix.note":
      "Cada celda es una ventana de 28 días desde el día 1 del mes. Score con el perfil actual; energía con el panel actual; DTE y corte con mástil 2 m. Haz clic en una celda para cargar ese sitio y esa fecha en la vista principal. Las filas marcadas REFERENCIA son contexto, no candidatos clasificados; las referencias internacionales usan un horizonte analítico plano.",
    "matrix.mastWarning":
      "DTE y corte están precalculados con mástil 2.0 m; el panel principal usa {current} m.",
    "matrix.site": "Sitio",
    "ab.title": "Comparación A/B lado a lado",
    "ab.badge": "Mismo perfil · panel · mástil",
    "ab.scenarioA": "Escenario A",
    "ab.scenarioB": "Escenario B",
    "ab.site": "Sitio",
    "ab.date": "Fecha (UTC)",
    "ab.compare": "Comparar",
    "ab.load": "Cargar en vista principal",
    "ab.context":
      "Ambos escenarios usan el perfil, panel y mástil actuales.",
    "ab.metrics.sun": "Sol",
    "ab.metrics.dte": "DTE",
    "ab.metrics.outage": "Corte",
    "ab.metrics.eclipse": "Eclipse",
    "ab.metrics.energy": "Energía",
    "ab.metrics.slope": "Pendiente local",
    "ab.metrics.score": "Índice de misión",
    "ab.delta": "Δ (B − A)",
    "ab.loading": "Evaluando los escenarios A y B…",
    "ab.error": "No se pudo comparar los escenarios: {message}",
    "ab.radarAria": "Radar del horizonte LOLA para {site} el {date}",
    "ab.points": "pts",
    "ab.percentPoints": "pp",
    "guide.title": "Cómo leer esta herramienta",
    "guide.badge": "Apoyo a decisiones · no certificado para vuelo",
    "guide.intro":
      "Esta herramienta compara sitios y fechas de alunizaje con topografía LOLA real y efemérides JPL Horizons. Es apoyo a decisiones y software educativo, no un análisis de aterrizaje certificado.",
    "guide.quickStart.title": "Inicio rápido",
    "guide.quickStart.body":
      "<ol><li>Elige un sitio curado o introduce coordenadas personalizadas.</li><li>Elige una fecha; la ventana de evaluación de 28 días empieza ahí.</li><li>Lee el veredicto: % Sol, % DTE y el corte DTE más largo, y después la checklist PASS/FAIL contra los umbrales de tu perfil.</li><li>Si los perfiles predefinidos no representan tu misión, elige <strong>Personalizado</strong> y define los umbrales de energía, eclipse, DTE y corte.</li><li>Usa el radar polar y el panorama 2.5D para ver el Sol y la Tierra contra el horizonte LOLA.</li><li>Usa <strong>Fechas</strong> para barrer 36 meses, <strong>Comparar</strong> para la matriz o el A/B, y <strong>Compartir</strong> para copiar un enlace del escenario.</li></ol>",
    "guide.metrics.title": "Qué significan las métricas",
    "guide.metrics.body":
      "<dl><dt>Sol %</dt><dd>Fracción de horas con al menos el 5% del disco solar sobre el horizonte LOLA; no implica Sol pleno.</dd><dt>DTE %</dt><dd>Fracción de horas con el centro de la Tierra sobre el horizonte local (directo a Tierra).</dd><dt>Corte</dt><dd>Corte DTE continuo más largo dentro de la ventana de 28 días.</dd><dt>Eclipse</dt><dd>Eclipse solar continuo más largo de la ventana.</dd><dt>Energía</dt><dd>Energía solar acumulada en 28 días para el panel y mástil seleccionados.</dd><dt>Índice de misión</dt><dd>Índice ponderado de energía, eclipse, DTE y corte; no es una probabilidad de éxito.</dd></dl>",
    "guide.pole.title": "Por qué el polo sur es difícil",
    "guide.pole.body":
      "<p>En el polo sur el Sol y la Tierra permanecen cerca del horizonte. Una cresta de pocos grados puede ocultarlos, así que un cambio pequeño de sitio o fecha puede cambiar el veredicto.</p><p>Las regiones permanentemente sombreadas (PSR) pueden contener hielo pero no generan energía solar. En la cara oculta la Tierra no se ve directamente; esas misiones necesitan un relé, por eso Chang'e 4 muestra 0% de DTE.</p>",
    "guide.glossary.title": "Glosario",
    "guide.glossary.body":
      "<dl><dt>LOLA</dt><dd>Lunar Orbiter Laser Altimeter; el altímetro láser de los DEM usados aquí.</dd><dt>DEM</dt><dd>Modelo digital de elevación; una malla de alturas del terreno.</dd><dt>Horizonte</dt><dd>La silueta local del terreno; aquí un perfil 1D de la elevación máxima por azimut.</dd><dt>DTE</dt><dd>Directo a Tierra; enlace de radio con la Tierra sobre el horizonte local.</dd><dt>PSR</dt><dd>Región permanentemente sombreada; terreno que nunca recibe luz solar directa.</dd><dt>Libración</dt><dd>El ligero balanceo de la Luna, que mueve la posición aparente de la Tierra a lo largo del mes.</dd><dt>CLPS / HLS</dt><dd>Programas de NASA Commercial Lunar Payload Services y Human Landing System.</dd><dt>Artemis III</dt><dd>Misión tripulada de NASA y sus regiones candidatas.</dd></dl>",
    "guide.try.title": "Prueba esto",
    "guide.try.body":
      "<ol><li>Selecciona Malapert Massif, 14 nov 2026: ~50% Sol, 42% DTE, corte de 12 días.</li><li>Abre <strong>Fechas</strong> y haz clic en may 2027: 0% Sol, 47% DTE, corte de 14.8 días.</li><li>Abre <strong>Comparar</strong> → <strong>Comparación A/B</strong> y elige Chang'e 4: referencia de la cara oculta con 0% DTE, que muestra por qué se necesita un relé.</li><li>Usa <strong>Compartir</strong> para copiar el enlace del escenario o <strong>Exportar JSON/CSV</strong> para los datos.</li></ol>",
    "guide.limits.title": "Límites",
    "guide.limits.body":
      "Apoyo a decisiones y software educativo, no certificado para vuelo. No modela rocas bajo la resolución del DEM, estado térmico, baterías, movilidad del rover, constelaciones de relé ni incertidumbre Monte Carlo. El horizonte es un perfil 1D por azimut; el panorama 2.5D es una representación sombreada. Nobile/Haworth usan 80 m/px; los sitios personalizados y las referencias internacionales usan horizontes aproximados o analíticos planos.",
    "matrix.cellTitle":
      "{site} · {date}: score {score}/100, {sun}% Sol, {dte}% DTE, corte {outage}, {energy} kWh/m²",
    "panorama.sun": "Sol",
    "panorama.earth": "Tierra",
    "panorama.horizon": "Horizonte",
    "panorama.fullSky": "Cielo completo",
    "panorama.realDisks": "Discos a escala real",
    "panorama.enlargedDisks": "Discos ampliados",
    "panorama.readout.sun": "Sol az/el",
    "panorama.readout.earth": "Tierra az/el",
    "panorama.readout.sunHorizon": "Horizonte Sol",
    "panorama.readout.earthHorizon": "Horizonte Tierra",
    "panorama.readout.mast": "Mástil",
    "panorama.belowHorizon": "bajo el horizonte",
    "panorama.empty": "Panorama LOLA no disponible",
    "panorama.sunPath": "Trayectoria solar 24 h",
    "panorama.earthLoop": "Bucle terrestre 28 d",
    "radar.sunLabel": "SOL ({el}°)",
    "radar.earthLabel": "TIERRA ({el}°)",
    "timeline.sun": "Sol: {el}° · horizonte {horizon}°",
    "timeline.earth": "Tierra: {el}° · horizonte {horizon}°",
    "timeline.fraction": "f☉ {sun}% · f⊕ {earth}%",
    "timeline.energy": "Energía: {value} W/m²",
    "sim.day": "Día {day} de {total}",
    "sim.dayShort": "Día {day} / {total}",
    "sim.dayAria": "Día {day} de {total}, {time}",
    "play.simulate": "Simular",
    "play.pause": "Pausa",
    "share.button": "Compartir",
    "share.copied": "Enlace copiado",
    "share.copyPrompt": "Copia este enlace del escenario:",
    "export.json": "Exportar JSON",
    "export.csv": "Exportar CSV",
    "export.downloaded": "Descargado",
    "export.error": "No se pudo exportar: {message}",
    "scenario.customDate": "Fecha personalizada"
  }
};

let currentLanguage = DEFAULT_LANGUAGE;

const reverse = (map) =>
  Object.fromEntries(Object.entries(map).map(([source, target]) => [target, source]));

const STATIC_ES = reverse(STATIC_EN);
const ATTR_ES = Object.fromEntries(
  Object.entries(ATTR_EN).map(([attr, map]) => [attr, reverse(map)])
);

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  if (!SUPPORTED.includes(language)) return;
  currentLanguage = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
    const select = document.getElementById("language-select");
    if (select) select.value = language;
  }
}

export function initLanguage() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }
  let fromUrl = null;
  if (typeof location !== "undefined") {
    try {
      fromUrl = new URLSearchParams(location.search).get("lang");
    } catch {
      fromUrl = null;
    }
  }
  currentLanguage = SUPPORTED.includes(fromUrl)
    ? fromUrl
    : SUPPORTED.includes(stored)
      ? stored
      : DEFAULT_LANGUAGE;
  if (typeof document !== "undefined") {
    document.documentElement.lang = currentLanguage;
    const select = document.getElementById("language-select");
    if (select) select.value = currentLanguage;
  }
  return currentLanguage;
}

export function languageName(language = currentLanguage) {
  return language === "es" ? "Español" : "English";
}

export function t(key, vars = {}) {
  const template = MESSAGES[currentLanguage]?.[key] ?? MESSAGES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) =>
    vars[name] == null ? "" : String(vars[name])
  );
}

export function applyStaticTranslations() {
  if (typeof document === "undefined") return;
  const lang = currentLanguage;
  const map = lang === "en" ? STATIC_EN : STATIC_ES;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    if (
      parent.closest("script, style, code, pre, svg, noscript, [data-no-translate]")
    ) {
      continue;
    }
    const value = node.nodeValue;
    if (!value || !value.trim()) continue;
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    const core = value.trim();
    const translated = map[core] ?? map[core.replace(/\s+/g, " ")];
    if (translated) {
      node.nodeValue = `${leading}${translated}${trailing}`;
    }
  }

  for (const attr of ["title", "aria-label", "placeholder", "alt"]) {
    const attrMap = lang === "en" ? ATTR_EN[attr] : ATTR_ES[attr];
    if (!attrMap) continue;
    for (const element of document.querySelectorAll(`[${attr}]`)) {
      if (element.closest("[data-no-translate]")) continue;
      const value = element.getAttribute(attr);
      const translated = attrMap[value];
      if (translated) element.setAttribute(attr, translated);
    }
  }

  document.documentElement.lang = lang;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", t("meta.description"));
  document.title = t("meta.title");
}

export function initLanguageSwitcher(onChange) {
  const select = document.getElementById("language-select");
  if (!select) return;
  select.value = currentLanguage;
  select.addEventListener("change", () => {
    setLanguage(select.value);
    applyStaticTranslations();
    onChange?.(currentLanguage);
  });
}

export { DEFAULT_LANGUAGE, MESSAGES };
