import './style.css';
import { MoonScene } from './render/moonScene.js';
import { SkyDomeRadar } from './ui/skyDomeRadar.js';
import { TimelineChart } from './ui/timelineChart.js';
import { Panorama25D } from './ui/panorama25d.js';
import { renderComparisonTable } from './ui/comparisonView.js';
import {
  loadLandingSites,
  setMastHeight,
  getCustomSite,
  getQuickMapUrl,
  getMoonTrekUrl
} from './topography/lunarData.js';
import { calculateLunarEphemeris } from './ephemeris/astronomy.js';
import {
  loadEphemeris,
  sampleEphemeris,
  AU_KM,
  SUN_RADIUS_KM,
  EARTH_RADIUS_KM
} from './ephemeris/jplEphemeris.js';
import {
  analyzeSite,
  findNextEvents,
  makeSky,
  panelIrradianceWm2,
  PROFILE_BY_ID,
  PANELS,
  DEFAULT_PROFILE_ID,
  WINDOW_DAYS
} from './analysis/scoring.js';
import { angularRadiusDeg, azElToMcmf, clamp } from './analysis/geometry.js';

const DAY_MS = 86_400_000;
const WINDOW_MS = WINDOW_DAYS * DAY_MS;
const WINDOW_HOURS = WINDOW_DAYS * 24;

const state = {
  sites: [],
  customSite: null,
  currentSite: null,
  baseDate: new Date(Date.UTC(2026, 10, 14, 0, 0, 0)),
  currentDate: new Date(Date.UTC(2026, 10, 14, 0, 0, 0)),
  mastHeightM: 2,
  panelType: 'vertical_tracker',
  profileId: DEFAULT_PROFILE_ID,
  series: [],
  analysis: null,
  currentSky: null,
  events: null,
  isPlaying: false,
  playbackSpeed: 1,
  evaluationToken: 0,
  panoramaMode: 'zoom',
  panoramaDiskScale: 'enlarged',
  panoramaOpen: false
};

const $ = (id) => document.getElementById(id);

const siteSelect = $('site-select');
const cameraBar = document.querySelector('.floating-camera-bar');
const siteProgramBadge = $('site-program-badge');
const siteDescription = $('site-description');
const siteSlopeVal = $('site-slope-val');
const siteElevVal = $('site-elev-val');
const siteDataQuality = $('site-data-quality');
const siteDataSource = $('site-data-source');
const hudSiteName = $('hud-site-name');
const hudCoords = $('hud-coords');
const mastSelect = $('mast-select');
const panelSelect = $('panel-select');
const profileSelect = $('profile-select');

const scoreNumber = $('score-number');
const classificationBadge = $('classification-badge');
const classificationText = $('classification-text');
const verdictBar = $('verdict-bar');
const verdictRows = $('verdict-rows');
const scoreWindowLabel = $('score-window-label');

const hudSunElev = $('hud-sun-elev');
const hudEarthElev = $('hud-earth-elev');
const solarEffVal = $('solar-eff-val');
const commLinkStatus = $('comm-link-status');
const sunHorizonVal = $('sun-horizon-val');
const earthHorizonVal = $('earth-horizon-val');
const sunsetLabel = $('sunset-label');
const sunsetCountdown = $('sunset-countdown');
const sunsetSub = $('sunset-sub');
const earthsetLabel = $('earthset-label');
const earthsetCountdown = $('earthset-countdown');
const earthsetSub = $('earthset-sub');

const clockDisplay = $('clock-display');
const presetSelect = $('preset-select');
const datetimeInput = $('datetime-input');
const timeScrubber = $('time-scrubber');
const scrubberDayLabel = $('scrubber-day-label');
const playPauseBtn = $('play-pause-btn');
const playIcon = $('play-icon');
const playText = $('play-text');

const comparisonModal = $('comparison-modal');
const comparisonModalBody = $('comparison-modal-body');
const closeComparisonModal = $('close-comparison-modal');
const openComparisonBtn = $('open-comparison-btn');
const horizonsModal = $('horizons-modal');
const closeHorizonsModal = $('close-horizons-modal');
const openHorizonsBtn = $('open-horizons-btn');
const nnModal = $('nn-modal');
const closeNnModal = $('close-nn-modal');
const toggleNnViewBtn = $('toggle-nn-view-btn');
const panoramaModal = $('panorama-modal');
const closePanoramaModal = $('close-panorama-modal');
const openPanoramaBtn = $('open-panorama-btn');
const panoramaSiteLabel = $('panorama-site-label');
const panoramaZoomBtn = $('panorama-zoom-btn');
const panoramaFullBtn = $('panorama-full-btn');
const panoramaDiskBtn = $('panorama-disk-btn');
const panoramaSun = $('panorama-sun');
const panoramaEarth = $('panorama-earth');
const panoramaSunHorizon = $('panorama-sun-horizon');
const panoramaEarthHorizon = $('panorama-earth-horizon');
const panoramaMast = $('panorama-mast');

const chartDrawer = $('chart-drawer');
const timelineToggleBtn = $('timeline-toggle-btn');
const closeChartBtn = $('close-chart-btn');
const timelineArrow = $('timeline-arrow');
const loadingOverlay = $('loading-overlay');

const moonScene = new MoonScene($('three-container'));
const skyDomeRadar = new SkyDomeRadar($('sky-dome-canvas'));
const timelineChart = new TimelineChart($('timeline-chart-canvas'), (selectedDate) => {
  state.currentDate = clampDate(selectedDate, state.baseDate, addDays(state.baseDate, WINDOW_DAYS));
  updateSimulation();
});
let panorama = null;

function clampDate(date, min, max) {
  const ms = date.getTime();
  return new Date(Math.max(min.getTime(), Math.min(max.getTime(), ms)));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function formatAzEl(az, el) {
  return `${Math.round(((az % 360) + 360) % 360)}° / ${el >= 0 ? '+' : ''}${el.toFixed(1)}°`;
}

function formatDurationMs(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0h 00m';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${String(minutes).padStart(2, '0')}m`;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function utcLabel(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

function updateDateTimeInput() {
  const d = state.currentDate;
  const pad = (n) => String(n).padStart(2, '0');
  datetimeInput.value = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function setLoading(visible, message) {
  if (message) {
    const text = loadingOverlay.querySelector('.loading-card span:last-child');
    if (text) text.textContent = message;
  }
  loadingOverlay.classList.toggle('hidden', !visible);
}

function localSample(site, timeMs) {
  const eph = calculateLunarEphemeris(new Date(timeMs), site.lat, site.lon);
  const sunDistanceKm = eph.sun.distanceKm;
  return {
    timeMs,
    sun: {
      azDeg: eph.sun.az,
      elDeg: eph.sun.el,
      distance: sunDistanceKm / AU_KM,
      angularRadiusDeg: angularRadiusDeg(SUN_RADIUS_KM, sunDistanceKm)
    },
    earth: {
      azDeg: eph.earth.az,
      elDeg: eph.earth.el,
      distance: eph.earth.distanceKm,
      angularRadiusDeg: angularRadiusDeg(EARTH_RADIUS_KM, eph.earth.distanceKm)
    }
  };
}

function sampleSite(site, timeMs) {
  if (site.ephem) {
    const sample = sampleEphemeris(site.ephem, timeMs);
    if (sample) return sample;
  }
  return localSample(site, timeMs);
}

async function ensureEphemeris(site) {
  if (site.ephemSource !== 'jpl_horizons' || site.ephem) return;
  try {
    site.ephem = await loadEphemeris(site.id);
  } catch (error) {
    site.ephem = null;
    site.ephemSource = 'iau2000_local';
    console.warn(`Horizons no disponible para ${site.id}; usando motor IAU 2000.`, error);
  }
}

function allSites() {
  return state.customSite ? [...state.sites, state.customSite] : [...state.sites];
}

const HORIZON_SOURCE_LABELS = {
  lola_hybrid: 'LOLA híbrido (5 m + 80 m/px)',
  lola_80m_regional: 'LOLA regional 80 m/px',
  analytic_flat: 'analítico plano',
  approx: 'aproximado',
  unavailable: 'sin datos',
  unknown: 'sin clasificar'
};

function updateSitePanel(site) {
  hudSiteName.textContent = site.name;
  siteProgramBadge.textContent = site.program;
  siteDescription.textContent = site.description;
  siteSlopeVal.textContent = `${Number(site.maxSlopeDeg).toFixed(1)}°`;
  siteElevVal.textContent = `${site.elevationKm >= 0 ? '+' : ''}${site.elevationKm.toFixed(2)} km`;
  hudCoords.textContent = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`;
  siteDataQuality.textContent = site.dataQuality;
  const horizonLabel = HORIZON_SOURCE_LABELS[site.horizonSource] ?? site.horizonSource;
  siteDataSource.textContent = `Horizonte: ${horizonLabel} · Efemérides: ${site.ephemSource === 'jpl_horizons' ? 'JPL Horizons DE441' : 'IAU 2000 local'}`;
  const radarLabel =
    site.horizonSource === 'analytic_flat'
      ? 'Analítico'
      : site.isRealLola
        ? 'LOLA real'
        : 'Aproximado';
  $('radar-source-badge').textContent = radarLabel;

  const quickMapUrl = getQuickMapUrl(site);
  const moonTrekUrl = getMoonTrekUrl(site);
  const quickMapLink = $('btn-open-quickmap');
  const moonTrekLink = $('btn-open-moontrek');
  if (quickMapLink) quickMapLink.href = quickMapUrl;
  if (moonTrekLink) moonTrekLink.href = moonTrekUrl;
  updateTrekModalContent(site, quickMapUrl, moonTrekUrl);

  siteSelect.value = site.id;
  mastSelect.value = String(state.mastHeightM);
  panelSelect.value = state.panelType;
  profileSelect.value = state.profileId;
}

function updateTrekModalContent(site, quickMapUrl, moonTrekUrl) {
  if (!site) return;
  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };
  setText('trek-modal-site-name', site.name);
  setText('trek-modal-program', site.program);
  setText(
    'trek-modal-coords',
    `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`
  );
  setText('trek-modal-elev', `${site.elevationKm >= 0 ? '+' : ''}${site.elevationKm.toFixed(2)} km`);
  setText('trek-modal-slope', `${Number(site.maxSlopeDeg).toFixed(1)}°`);
  setText('trek-modal-ice', `${site.distToIceTrapKm.toFixed(1)} km`);
  setText('trek-modal-geology', site.geology ?? site.description);
  const quickMapButton = $('trek-modal-quickmap-btn');
  const moonTrekButton = $('trek-modal-moontrek-btn');
  if (quickMapButton) quickMapButton.href = quickMapUrl;
  if (moonTrekButton) moonTrekButton.href = moonTrekUrl;
}

function initModelLayerControls() {
  const layerButtons = document.querySelectorAll('.layer-btn');
  layerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      layerButtons.forEach((other) => other.classList.remove('active'));
      button.classList.add('active');
      moonScene.setLayer(button.dataset.layer);
    });
  });

  const reliefButtons = document.querySelectorAll('.relief-btn');
  reliefButtons.forEach((button) => {
    button.addEventListener('click', () => {
      reliefButtons.forEach((other) => other.classList.remove('active'));
      button.classList.add('active');
      moonScene.setElevationExaggeration(Number.parseFloat(button.dataset.relief));
      if (state.currentSite && state.analysis) {
        moonScene.updateSiteStatus(state.currentSite.id, state.analysis.scorePercent);
      }
    });
  });
}

function updateDecisionUI(analysis) {
  scoreNumber.textContent = analysis.scorePercent;
  classificationBadge.className = `verdict-status ${analysis.badgeClass}`;
  classificationBadge.textContent = analysis.status;
  classificationText.textContent = analysis.statusText;

  const weights = analysis.profile.weights;
  const weightSum = weights.energy + weights.dark + weights.dte + weights.comms;
  const terms = [
    { label: 'Energía', metric: `${(analysis.metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²`, weight: weights.energy, share: analysis.components.energy },
    { label: 'Eclipse', metric: `${analysis.metrics.dMaxHours.toFixed(1)} h`, weight: weights.dark, share: analysis.components.dark },
    { label: 'DTE', metric: `${analysis.metrics.dteCenterPct.toFixed(0)}%`, weight: weights.dte, share: analysis.components.dte },
    { label: 'Comms', metric: `${analysis.metrics.gMaxHours.toFixed(1)} h`, weight: weights.comms, share: analysis.components.comms }
  ];

  verdictBar.innerHTML = '';
  verdictRows.innerHTML = '';
  for (const term of terms) {
    const maxPoints = (100 * term.weight) / weightSum;
    const points = maxPoints * term.share;
    const pct = Math.round(term.share * 100);
    const level = pct >= 75 ? 'good' : pct >= 50 ? 'watch' : 'bad';

    const segment = document.createElement('span');
    segment.className = `verdict-bar-seg verdict-level-${level}`;
    segment.style.width = `${points}%`;
    segment.title = `${term.label}: ${points.toFixed(1)} de ${maxPoints.toFixed(1)} puntos`;
    verdictBar.appendChild(segment);

    const row = document.createElement('li');
    row.className = `verdict-row verdict-level-${level}`;
    row.innerHTML = `
      <span class="verdict-row-label">${term.label}</span>
      <span class="verdict-row-metric">${term.metric}</span>
      <span class="verdict-row-points"><strong>${points.toFixed(1)}</strong><span>/${maxPoints.toFixed(1)}</span></span>
    `;
    verdictRows.appendChild(row);
  }

  renderDecisionModel(analysis);
  moonScene.updateSiteStatus(analysis.site.id, analysis.scorePercent);
}

function renderDecisionModel(analysis) {
  const components = [
    ['Energía', `${(analysis.metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²`, analysis.profile.weights.energy, analysis.components.energy],
    ['Eclipse', `${analysis.metrics.dMaxHours.toFixed(1)} h`, analysis.profile.weights.dark, analysis.components.dark],
    ['DTE', `${analysis.metrics.dteCenterPct.toFixed(0)}%`, analysis.profile.weights.dte, analysis.components.dte],
    ['Comms', `${analysis.metrics.gMaxHours.toFixed(1)} h`, analysis.profile.weights.comms, analysis.components.comms]
  ];
  const container = $('decision-components');
  if (container) {
    container.innerHTML = components
      .map(([name, raw, weight, term]) => {
        const pct = Math.round(term * 100);
        return `<div class="decision-row">
          <span class="name">${name}</span>
          <span class="raw">${raw}</span>
          <span class="weight">w=${weight}</span>
          <span class="term ${term >= 0.75 ? 'good' : term >= 0.5 ? '' : 'bad'}">${pct}/100</span>
        </div>`;
      })
      .join('');
  }
  const profileEl = $('decision-profile');
  if (profileEl) {
    profileEl.textContent = `${analysis.profile.name}: energía ≥ ${analysis.profile.energyReqKWhM2} kWh/m²; eclipse ≤ ${analysis.profile.dMaxTolHours} h; DTE ≥ ${analysis.profile.dteReqPct}%; corte DTE ≤ ${analysis.profile.gMaxTolHours} h. Panel: ${PANELS[analysis.panelType].label}; mástil: ${analysis.mastHeightM.toFixed(1)} m.`;
  }
}

function updateSimulation() {
  if (!state.currentSite || !state.analysis) return;
  const site = state.currentSite;
  const bodies = sampleSite(site, state.currentDate.getTime());
  const sky = makeSky(site, bodies, state.mastHeightM);
  state.currentSky = sky;

  clockDisplay.textContent = utcLabel(state.currentDate);
  scoreWindowLabel.textContent = `Ventana: ${WINDOW_DAYS} d desde ${utcLabel(state.baseDate)} · instante ${utcLabel(state.currentDate)}`;
  hudSunElev.textContent = `${sky.sun.elDeg >= 0 ? '+' : ''}${sky.sun.elDeg.toFixed(2)}° Elev`;
  hudEarthElev.textContent = `${sky.earth.elDeg >= 0 ? '+' : ''}${sky.earth.elDeg.toFixed(2)}° Elev`;

  const panelAzimuth = analysisPanelAzimuth(state.analysis);
  const irradiance = panelIrradianceWm2(
    state.panelType,
    sky.sun.azDeg,
    sky.sun.elDeg,
    sky.sun.distance,
    sky.sunVisibleFraction,
    panelAzimuth
  );
  solarEffVal.textContent = `Irradiancia panel: ${irradiance.toFixed(0)} W/m² · f☉ ${(sky.sunVisibleFraction * 100).toFixed(0)}%`;
  sunHorizonVal.textContent = `Horizonte LOLA: ${sky.sunHorizonDeg.toFixed(2)}° · despeje ${(sky.sun.elDeg - sky.sunHorizonDeg).toFixed(2)}°`;
  earthHorizonVal.textContent = `Horizonte LOLA: ${sky.earthHorizonDeg.toFixed(2)}° · despeje ${(sky.earth.elDeg - sky.earthHorizonDeg).toFixed(2)}°`;
  commLinkStatus.textContent = sky.dteCenter ? 'DTE: centro de Tierra visible' : 'DTE: bloqueada por el horizonte';
  commLinkStatus.style.color = sky.dteCenter ? 'var(--color-cyan)' : 'var(--color-red)';

  state.events = findNextEvents(
    state.series,
    state.currentDate.getTime(),
    site,
    state.mastHeightM,
    (ms) => sampleSite(site, ms)
  );
  formatCountdowns(state.events);

  skyDomeRadar.update(
    site,
    { sun: { az: sky.sun.azDeg, el: sky.sun.elDeg }, earth: { az: sky.earth.azDeg, el: sky.earth.elDeg } },
    state.series
  );
  timelineChart.update(state.series, site, state.currentDate.getTime());

  moonScene.updateEphemeris(
    {
      sunDirMCMF: azElToMcmf(site.lat, site.lon, sky.sun.azDeg, sky.sun.elDeg),
      earthDirMCMF: azElToMcmf(site.lat, site.lon, sky.earth.azDeg, sky.earth.elDeg),
      sun: { az: sky.sun.azDeg, el: sky.sun.elDeg },
      earth: { az: sky.earth.azDeg, el: sky.earth.elDeg },
      sunHorizonDeg: sky.sunHorizonDeg,
      earthHorizonDeg: sky.earthHorizonDeg
    },
    site
  );

  if (state.panoramaOpen) updatePanorama();

  updateDateTimeInput();
  const hoursFromBase = (state.currentDate.getTime() - state.baseDate.getTime()) / 3_600_000;
  timeScrubber.value = String(clamp(Math.round(hoursFromBase), 0, WINDOW_HOURS));
  const day = Math.min(WINDOW_DAYS, Math.floor(hoursFromBase / 24) + 1);
  scrubberDayLabel.textContent = `Día ${day} / ${WINDOW_DAYS}`;
}

function analysisPanelAzimuth(analysis) {
  if (!analysis) return 0;
  if (state.panelType === 'vertical_fixed') return analysis.site.optimalPanelAzimuthDeg || 0;
  return 0;
}

function formatCountdowns(events) {
  if (!events) {
    sunsetLabel.textContent = 'Próximo evento solar:';
    sunsetCountdown.textContent = '—';
    sunsetSub.textContent = 'Sin datos de eventos.';
    earthsetLabel.textContent = 'Próximo evento DTE:';
    earthsetCountdown.textContent = '—';
    earthsetSub.textContent = 'Sin datos de eventos.';
    return;
  }

  if (events.sunIsUp) {
    sunsetLabel.textContent = 'Próximo ocaso solar:';
    if (events.nextSunset) {
      sunsetCountdown.textContent = formatDurationMs(events.nextSunset.msRemaining);
      sunsetSub.textContent = `Ocaso a las ${utcLabel(events.nextSunset.date).slice(11)} UTC`;
    } else {
      sunsetCountdown.textContent = 'Sin ocaso';
      sunsetSub.textContent = 'No hay ocaso solar en la ventana de 28 días.';
    }
  } else {
    sunsetLabel.textContent = 'Próximo amanecer:';
    if (events.nextSunrise) {
      sunsetCountdown.textContent = formatDurationMs(events.nextSunrise.msRemaining);
      sunsetSub.textContent = `Amanecer a las ${utcLabel(events.nextSunrise.date).slice(11)} UTC`;
    } else {
      sunsetCountdown.textContent = 'Sin amanecer';
      sunsetSub.textContent = 'No hay amanecer solar en la ventana de 28 días.';
    }
  }

  if (events.earthIsUp) {
    earthsetLabel.textContent = 'Próxima pérdida DTE:';
    if (events.nextEarthset) {
      earthsetCountdown.textContent = formatDurationMs(events.nextEarthset.msRemaining);
      earthsetSub.textContent = `Pérdida a las ${utcLabel(events.nextEarthset.date).slice(11)} UTC`;
    } else {
      earthsetCountdown.textContent = 'DTE continua';
      earthsetSub.textContent = 'Sin pérdida del centro de la Tierra en 28 días.';
    }
  } else {
    earthsetLabel.textContent = 'Próximo Earthrise:';
    if (events.nextEarthrise) {
      earthsetCountdown.textContent = formatDurationMs(events.nextEarthrise.msRemaining);
      earthsetSub.textContent = `Reaparición a las ${utcLabel(events.nextEarthrise.date).slice(11)} UTC`;
    } else {
      earthsetCountdown.textContent = 'Sin Earthrise';
      earthsetSub.textContent = 'Sin reaparición del centro de la Tierra en 28 días.';
    }
  }
}

async function calculateSeriesAndEvaluate() {
  if (!state.currentSite) return;
  const token = ++state.evaluationToken;
  setLoading(true, 'Calculando ventana de 28 días con LOLA + Horizons…');
  await ensureEphemeris(state.currentSite);
  if (token !== state.evaluationToken) return;
  try {
    const analysis = analyzeSite({
      site: state.currentSite,
      startMs: state.baseDate.getTime(),
      mastHeightM: state.mastHeightM,
      panelType: state.panelType,
      profileId: state.profileId,
      sampleAt: (ms) => sampleSite(state.currentSite, ms)
    });
    if (token !== state.evaluationToken) return;
    state.analysis = analysis;
    state.series = analysis.series;
    updateDecisionUI(analysis);
    updateSimulation();
  } catch (error) {
    console.error('No se pudo evaluar el sitio.', error);
    classificationBadge.textContent = 'SIN DATOS';
    classificationBadge.className = 'verdict-status status-danger';
    classificationText.textContent = `No se pudo evaluar: ${error.message}`;
    scoreNumber.textContent = '—';
  } finally {
    if (token === state.evaluationToken) setLoading(false);
  }
}

function populateSiteSelector(sites) {
  siteSelect.innerHTML = '';
  for (const site of sites) {
    const option = document.createElement('option');
    option.value = site.id;
    option.textContent = `${site.name} · ${site.dataQuality}`;
    siteSelect.appendChild(option);
  }
  if (state.customSite) {
    const option = document.createElement('option');
    option.value = 'custom-site';
    option.textContent = `${state.customSite.name} · aproximado`;
    siteSelect.appendChild(option);
  }
}

function initScrollAffordances() {
  updateScrollAffordance(cameraBar);
  window.addEventListener('resize', () => updateScrollAffordance(cameraBar));
}

function updateScrollAffordance(element) {
  if (!element) return;
  element.classList.toggle('is-scrollable', element.scrollWidth > element.clientWidth + 1);
}

async function prepareSite(site) {
  if (!site) return;
  state.currentSite = site;
  state.evaluationToken += 1;
  setMastHeight(allSites(), state.mastHeightM);
  updateSitePanel(site);
  const sitesForScene = allSites();
  moonScene.setLandingSites(sitesForScene, (siteId) => {
    const found = allSites().find((s) => s.id === siteId);
    if (found) prepareSite(found);
  });
  moonScene.setActiveSite(site);
  moonScene.viewSite(site);
  await calculateSeriesAndEvaluate();
}

function initSiteSelector(sites) {
  populateSiteSelector(sites);
  siteSelect.addEventListener('change', () => {
    const found = allSites().find((s) => s.id === siteSelect.value);
    if (found) prepareSite(found);
  });
  const customError = $('custom-coords-error');
  const latInput = $('custom-lat');
  const lonInput = $('custom-lon');
  $('apply-custom-btn').addEventListener('click', () => {
    const lat = Number.parseFloat(latInput.value);
    const lon = Number.parseFloat(lonInput.value);
    let message = '';
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      message = 'Introduce una latitud y una longitud numéricas.';
    } else if (lat < -90 || lat > 90) {
      message = `La latitud debe estar entre -90° y 90°. Has escrito ${lat}°.`;
    } else if (lon < 0 || lon > 360) {
      message = `La longitud debe estar entre 0° y 360°. Has escrito ${lon}°.`;
    }
    if (message) {
      customError.textContent = message;
      customError.hidden = false;
      const invalid = !Number.isFinite(lat) || lat < -90 || lat > 90 ? latInput : lonInput;
      invalid.setAttribute('aria-invalid', 'true');
      invalid.focus();
      return;
    }
    customError.hidden = true;
    latInput.removeAttribute('aria-invalid');
    lonInput.removeAttribute('aria-invalid');
    state.customSite = getCustomSite(lat, lon);
    populateSiteSelector(state.sites);
    siteSelect.value = 'custom-site';
    prepareSite(state.customSite);
  });
}

function initConfigControls() {
  mastSelect.addEventListener('change', () => {
    state.mastHeightM = Number.parseFloat(mastSelect.value);
    setMastHeight(allSites(), state.mastHeightM);
    calculateSeriesAndEvaluate();
  });
  panelSelect.addEventListener('change', () => {
    state.panelType = panelSelect.value;
    calculateSeriesAndEvaluate();
  });
  profileSelect.addEventListener('change', () => {
    state.profileId = profileSelect.value;
    calculateSeriesAndEvaluate();
  });
}

function initTimeControls() {
  updateDateTimeInput();
  datetimeInput.min = '2026-01-01T00:00';
  datetimeInput.max = '2029-01-01T00:00';

  datetimeInput.addEventListener('change', (event) => {
    if (!event.target.value) return;
    const next = new Date(`${event.target.value}:00Z`);
    if (Number.isNaN(next.getTime())) return;
    state.baseDate = next;
    state.currentDate = new Date(next);
    calculateSeriesAndEvaluate();
  });

  presetSelect.addEventListener('change', () => {
    const value = presetSelect.value;
    if (value === 'artemis-2026') state.baseDate = new Date(Date.UTC(2026, 10, 14, 0, 0, 0));
    else if (value === 'clps-summer') state.baseDate = new Date(Date.UTC(2026, 11, 21, 12, 0, 0));
    else if (value === 'clps-winter') state.baseDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
    else state.baseDate = new Date();
    state.currentDate = new Date(state.baseDate);
    calculateSeriesAndEvaluate();
  });

  const stepCurrent = (hours) => {
    const max = addDays(state.baseDate, WINDOW_DAYS);
    state.currentDate = clampDate(new Date(state.currentDate.getTime() + hours * 3_600_000), state.baseDate, max);
    if (state.currentDate.getTime() >= max.getTime()) state.currentDate = new Date(max);
    updateSimulation();
  };

  $('step-back-day').addEventListener('click', () => stepCurrent(-24));
  $('step-back-hour').addEventListener('click', () => stepCurrent(-1));
  $('step-fwd-hour').addEventListener('click', () => stepCurrent(1));
  $('step-fwd-day').addEventListener('click', () => stepCurrent(24));

  timeScrubber.addEventListener('input', () => {
    const hours = Number.parseInt(timeScrubber.value, 10);
    state.currentDate = new Date(state.baseDate.getTime() + hours * 3_600_000);
    updateSimulation();
  });

  playPauseBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    playIcon.textContent = state.isPlaying ? '⏸' : '▶';
    playText.textContent = state.isPlaying ? 'Pausa' : 'Simular';
  });

  for (const button of document.querySelectorAll('.speed-chip')) {
    button.addEventListener('click', () => {
      for (const other of document.querySelectorAll('.speed-chip')) other.classList.remove('active');
      button.classList.add('active');
      state.playbackSpeed = Number.parseInt(button.dataset.speed, 10);
    });
  }

  const toggleChart = (open) => {
    const shouldOpen = open ?? chartDrawer.classList.contains('hidden');
    chartDrawer.classList.toggle('hidden', !shouldOpen);
    timelineToggleBtn.setAttribute('aria-expanded', String(shouldOpen));
    timelineArrow.classList.toggle('rotated', shouldOpen);
    if (shouldOpen) setTimeout(() => timelineChart.resize(), 50);
  };
  timelineToggleBtn.addEventListener('click', () => toggleChart());
  closeChartBtn.addEventListener('click', () => toggleChart(false));

  let lastTick = performance.now();
  function simulationLoop(now) {
    const deltaMs = now - lastTick;
    lastTick = now;
    if (state.isPlaying && state.analysis) {
      const simulatedHours = (deltaMs / 2000) * state.playbackSpeed;
      const max = addDays(state.baseDate, WINDOW_DAYS);
      let next = new Date(state.currentDate.getTime() + simulatedHours * 3_600_000);
      if (next.getTime() >= max.getTime()) next = new Date(max);
      state.currentDate = next;
      updateSimulation();
      if (next.getTime() >= max.getTime()) {
        state.isPlaying = false;
        playIcon.textContent = '▶';
        playText.textContent = 'Simular';
      }
    }
    requestAnimationFrame(simulationLoop);
  }
  requestAnimationFrame(simulationLoop);
}

function initCameraHUDControls() {
  const cameraButtons = [
    { id: 'hud-view-south-pole', action: () => moonScene.viewSouthPole() },
    { id: 'hud-view-site', action: () => moonScene.viewSite(state.currentSite) },
    { id: 'hud-view-global', action: () => moonScene.viewGlobal() }
  ];
  for (const { id, action } of cameraButtons) {
    const button = $(id);
    if (!button) continue;
    button.addEventListener('click', () => {
      for (const other of cameraButtons) $(other.id)?.classList.remove('active');
      button.classList.add('active');
      action();
    });
  }
}

function initPanorama() {
  const canvas = $('panorama-canvas');
  if (!canvas) return;
  panorama = new Panorama25D(canvas);
  panorama.setMode(state.panoramaMode);
  panorama.setDiskScale(state.panoramaDiskScale);

  const setPressed = (button, pressed) => button.setAttribute('aria-pressed', String(pressed));
  panoramaZoomBtn.addEventListener('click', () => {
    state.panoramaMode = 'zoom';
    panorama.setMode('zoom');
    setPressed(panoramaZoomBtn, true);
    setPressed(panoramaFullBtn, false);
    updatePanorama();
  });
  panoramaFullBtn.addEventListener('click', () => {
    state.panoramaMode = 'full';
    panorama.setMode('full');
    setPressed(panoramaZoomBtn, false);
    setPressed(panoramaFullBtn, true);
    updatePanorama();
  });
  panoramaDiskBtn.addEventListener('click', () => {
    state.panoramaDiskScale = state.panoramaDiskScale === 'enlarged' ? 'true' : 'enlarged';
    panorama.setDiskScale(state.panoramaDiskScale);
    setPressed(panoramaDiskBtn, state.panoramaDiskScale === 'true');
    panoramaDiskBtn.textContent = state.panoramaDiskScale === 'true' ? 'Discos ampliados' : 'Discos a escala real';
    updatePanorama();
  });

  openPanoramaBtn.addEventListener('click', () => {
    openModal(panoramaModal);
    state.panoramaOpen = true;
    panorama.resize();
    updatePanorama();
  });
  closePanoramaModal.addEventListener('click', () => {
    closeModal(panoramaModal);
    state.panoramaOpen = false;
  });
  window.addEventListener('resize', () => {
    if (state.panoramaOpen) panorama.resize();
  });
}

function updatePanorama() {
  if (!panorama || !state.currentSite || !state.currentSky) return;
  panorama.update({
    site: state.currentSite,
    sky: state.currentSky,
    series: state.series,
    currentTimeMs: state.currentDate.getTime(),
    mastHeightM: state.mastHeightM,
    dateLabel: utcLabel(state.currentDate)
  });
  panoramaSiteLabel.textContent = `${state.currentSite.name} · ${utcLabel(state.currentDate)} · ${state.currentSite.dataQuality}`;
  panoramaSun.textContent = formatAzEl(state.currentSky.sun.azDeg, state.currentSky.sun.elDeg);
  panoramaEarth.textContent = formatAzEl(state.currentSky.earth.azDeg, state.currentSky.earth.elDeg);
  panoramaSunHorizon.textContent = `${state.currentSky.sunHorizonDeg.toFixed(2)}°`;
  panoramaEarthHorizon.textContent = `${state.currentSky.earthHorizonDeg.toFixed(2)}°`;
  panoramaMast.textContent = `${state.mastHeightM.toFixed(1)} m`;
}

async function openComparison() {
  if (!state.currentSite) return;
  setLoading(true, 'Evaluando todos los sitios con la misma ventana y supuestos…');
  try {
    const sites = allSites();
    await Promise.all(sites.map(ensureEphemeris));
    const analyses = sites.map((site) =>
      analyzeSite({
        site,
        startMs: state.baseDate.getTime(),
        mastHeightM: state.mastHeightM,
        panelType: state.panelType,
        profileId: state.profileId,
        sampleAt: (ms) => sampleSite(site, ms)
      })
    );
    renderComparisonTable(
      comparisonModalBody,
      analyses,
      {
        startMs: state.baseDate.getTime(),
        windowDays: WINDOW_DAYS,
        profile: PROFILE_BY_ID[state.profileId],
        mastHeightM: state.mastHeightM,
        panelType: state.panelType,
        panelLabel: PANELS[state.panelType].label
      },
      (siteId) => {
        const found = allSites().find((site) => site.id === siteId);
        if (found) {
          closeModal(comparisonModal);
          prepareSite(found);
        }
      }
    );
    openModal(comparisonModal);
  } catch (error) {
    console.error('No se pudo comparar los sitios.', error);
    comparisonModalBody.innerHTML = `<p class="data-note">No se pudo completar la comparación: ${error.message}</p>`;
    openModal(comparisonModal);
  } finally {
    setLoading(false);
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
let lastFocusedElement = null;

function openModal(modal) {
  if (!modal) return;
  lastFocusedElement = document.activeElement;
  modal.classList.remove('hidden');
  for (const other of document.querySelectorAll('.modal-backdrop')) {
    if (other !== modal && !other.classList.contains('hidden')) other.classList.add('hidden');
  }
  const first = modal.querySelector(FOCUSABLE);
  (first ?? modal).focus({ preventScroll: true });
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  if (lastFocusedElement instanceof HTMLElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus({ preventScroll: true });
  }
  lastFocusedElement = null;
}

function initModalKeys() {
  document.addEventListener('keydown', (event) => {
    const modal = document.querySelector('.modal-backdrop:not(.hidden)');
    if (!modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(modal);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = [...modal.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function initPanelCollapse() {
  for (const button of document.querySelectorAll('[data-panel-toggle]')) {
    const panel = $(button.dataset.panelToggle);
    if (!panel) continue;
    const name = button.dataset.label ?? 'panel';
    button.addEventListener('click', () => {
      const collapsed = panel.classList.toggle('is-collapsed');
      const label = `${collapsed ? 'Expandir' : 'Contraer'} ${name}`;
      button.setAttribute('aria-expanded', String(!collapsed));
      button.setAttribute('aria-label', label);
      button.title = label;
      if (!collapsed) {
        // Redibuja canvas (radar) al volver a mostrarse
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
          updateSimulation();
        });
      }
    });
  }
}

function initModals() {
  openComparisonBtn.addEventListener('click', openComparison);
  closeComparisonModal.addEventListener('click', () => closeModal(comparisonModal));
  openHorizonsBtn.addEventListener('click', () => openModal(horizonsModal));
  closeHorizonsModal.addEventListener('click', () => closeModal(horizonsModal));
  toggleNnViewBtn.addEventListener('click', () => {
    if (state.analysis) renderDecisionModel(state.analysis);
    openModal(nnModal);
  });
  closeNnModal.addEventListener('click', () => closeModal(nnModal));

  const trekModal = $('trek-modal');
  const closeTrekModal = $('close-trek-modal');
  const openTrek = () => {
    if (!state.currentSite || !trekModal) return;
    updateTrekModalContent(
      state.currentSite,
      getQuickMapUrl(state.currentSite),
      getMoonTrekUrl(state.currentSite)
    );
    openModal(trekModal);
  };
  $('btn-open-dossier')?.addEventListener('click', openTrek);
  $('open-trek-modal-btn')?.addEventListener('click', openTrek);
  closeTrekModal?.addEventListener('click', () => closeModal(trekModal));

  for (const modal of [comparisonModal, horizonsModal, nnModal, panoramaModal, trekModal].filter(Boolean)) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
  }
}

async function bootstrap() {
  try {
    const sites = await loadLandingSites();
    state.sites = sites;
    state.currentSite = sites.find((site) => site.id === 'site23') ?? sites[0];
    initSiteSelector(sites);
    initConfigControls();
    initTimeControls();
    initCameraHUDControls();
    initModelLayerControls();
    initModals();
    initPanelCollapse();
    initModalKeys();
    initPanorama();
    initScrollAffordances();
    await ensureEphemeris(state.currentSite);
    updateSitePanel(state.currentSite);
    moonScene.setLandingSites(allSites(), (siteId) => {
      const found = allSites().find((site) => site.id === siteId);
      if (found) prepareSite(found);
    });
    moonScene.setActiveSite(state.currentSite);
    moonScene.viewSite(state.currentSite);
    await calculateSeriesAndEvaluate();
    setLoading(false);
  } catch (error) {
    console.error('No se pudo inicializar la aplicación.', error);
    // An error is not progress: stop the scan and say what failed.
    loadingOverlay.classList.add('is-error');
    setLoading(true, `No se pudieron cargar los datos LOLA: ${error.message}`);
    const strong = loadingOverlay.querySelector('strong');
    if (strong) strong.textContent = 'Error cargando LOLA + Horizons';
    classificationBadge.textContent = 'SIN DATOS';
    classificationText.textContent = error.message;
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
