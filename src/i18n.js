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
    "profile.night_survivor.name": "Night-surviving rover",
    "profile.night_survivor.description":
      "Battery-limited rover that must survive the longest continuous eclipse; energy dominates the decision.",
    "profile.crewed_outpost.name": "Crewed outpost with direct DTE",
    "profile.crewed_outpost.description":
      "Crewed outpost with strict Earth-link continuity and a short tolerated solar eclipse.",
    "profile.relay_store_forward.name": "Relay / store-and-forward",
    "profile.relay_store_forward.description":
      "Profile for a mission with a relay or on-board storage: tolerates long DTE outages and does not require continuous direct visibility. It is not pure direct DTE; it is shown to compare alternatives.",
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
    "verdict.summary": "{sun}% of hours with Sun, {dte}% DTE and {comms}.",
    "verdict.commsOut":
      "no continuous DTE link: the longest outage is {outage} and the tolerance is {tol} h",
    "verdict.commsOk": "DTE link within tolerance: the longest outage is {outage}",
    "verdict.window": "Window: {days} d from {start} · instant {now}",
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
    "site.source": "Horizon: {horizon} · Ephemerides: {ephem}",
    "site.customName": "Custom site",
    "site.customDescription.lola":
      "User-defined site. Evaluated with local ephemerides and the LOLA horizon from {site}, {km} km away; it is not a DEM at the point. Slope and elevation are not available.",
    "site.customDescription.flat":
      "User-defined site. Evaluated with local ephemerides and an approximate flat horizon because there is no LOLA profile within 300 km. It must not be interpreted as terrain certification.",
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
    "quality.customFlat": "Approximate · flat horizon",
    "quality.approx": "Approximate",
    "program.artemis3": "Artemis III",
    "program.nonOfficial": "Non-official point",
    "program.haworthReference": "Haworth · reference",
    "program.historicalReference": "Historical reference",
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
      "Each cell is a 28-day window from the first day of the month. Score with the current profile; energy with the current panel; DTE and outage with a 2 m mast. Click a cell to load that site and date in the main view.",
    "matrix.mastWarning":
      "DTE and outage are precomputed with a 2.0 m mast; the main panel uses {current} m.",
    "matrix.site": "Site",
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
    "play.pause": "Pause"
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
    "profile.night_survivor.name": "Rover superviviente de noche lunar",
    "profile.night_survivor.description":
      "Rover limitado por baterías que debe sobrevivir al eclipse continuo más largo; la energía domina la decisión.",
    "profile.crewed_outpost.name": "Puesto tripulado con DTE directo",
    "profile.crewed_outpost.description":
      "Puesto tripulado con continuidad estricta de enlace a Tierra y eclipse solar corto tolerado.",
    "profile.relay_store_forward.name": "Relé / store-and-forward",
    "profile.relay_store_forward.description":
      "Perfil para una misión con relé o almacenamiento a bordo: tolera outages DTE largos y no exige visibilidad directa continua. No es DTE directo puro; se muestra para comparar alternativas.",
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
    "verdict.summary":
      "{sun}% de las horas con Sol, {dte}% de DTE y {comms}.",
    "verdict.commsOut":
      "sin enlace DTE continuo: el corte más largo es de {outage} y la tolerancia es {tol} h",
    "verdict.commsOk":
      "enlace DTE dentro de tolerancia: el corte más largo es de {outage}",
    "verdict.window":
      "Ventana: {days} d desde {start} · instante {now}",
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
    "site.source": "Horizonte: {horizon} · Efemérides: {ephem}",
    "site.customName": "Sitio personalizado",
    "site.customDescription.lola":
      "Sitio definido por el usuario. Se evalúa con efemérides locales y el horizonte LOLA de {site}, a {km} km; no es un DEM del punto. Pendiente y elevación no están disponibles.",
    "site.customDescription.flat":
      "Sitio definido por el usuario. Se evalúa con efemérides locales y un horizonte plano aproximado porque no hay un perfil LOLA a menos de 300 km. No debe interpretarse como una certificación del terreno.",
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
    "quality.customFlat": "Aproximado · horizonte plano",
    "quality.approx": "Aproximado",
    "program.artemis3": "Artemis III",
    "program.nonOfficial": "Punto no oficial",
    "program.haworthReference": "Haworth · referencia",
    "program.historicalReference": "Referencia histórica",
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
      "Cada celda es una ventana de 28 días desde el día 1 del mes. Score con el perfil actual; energía con el panel actual; DTE y corte con mástil 2 m. Haz clic en una celda para cargar ese sitio y esa fecha en la vista principal.",
    "matrix.mastWarning":
      "DTE y corte están precalculados con mástil 2.0 m; el panel principal usa {current} m.",
    "matrix.site": "Sitio",
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
    "play.pause": "Pausa"
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
    // Storage can be blocked; the language still applies for this session.
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
  currentLanguage = SUPPORTED.includes(stored) ? stored : DEFAULT_LANGUAGE;
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
