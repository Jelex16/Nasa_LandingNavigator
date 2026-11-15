import './style.css';
import { MoonScene } from './render/moonScene.js';
import { SkyDomeRadar } from './ui/skyDomeRadar.js';
import { TimelineChart } from './ui/timelineChart.js';
import { Panorama25D } from './ui/panorama25d.js';
import { renderComparisonTable } from './ui/comparisonView.js';
import { renderDateSweep } from './ui/dateSweepView.js';
import { renderSiteDateMatrix } from './ui/siteDateMatrix.js';
import { renderSideBySide } from './ui/sideBySideView.js';
import { renderGuide } from './ui/guideView.js';
import {
  comparisonToCsv,
  downloadText,
  matrixToCsv,
  scenarioToJson,
  sweepToCsv
} from './export.js';
import {
  loadLandingSites,
  loadDateSweep,
  setMastHeight,
  getCustomSite,
  getQuickMapUrl,
  getMoonTrekUrl,
  dataQualityLabel,
  siteProgram,
  siteDescription as localizedSiteDescription,
  horizonSourceLabel
} from './topography/lunarData.js';
import { loadEphemeris } from './ephemeris/jplEphemeris.js';
import {
  buildStatus,
  findNextEvents,
  makeSky,
  panelIrradianceWm2,
  PROFILE_BY_ID,
  PANELS,
  DEFAULT_PROFILE_ID,
  WINDOW_DAYS
} from './analysis/scoring.js';
import { azElToMcmf, clamp } from './analysis/geometry.js';
import { sampleSite, evaluateSiteScenario } from './analysis/sampling.js';
import {
  applyStaticTranslations,
  getLanguage,
  initLanguage,
  initLanguageSwitcher,
  t
} from './i18n.js';

initLanguage();
applyStaticTranslations();
initLanguageSwitcher(() => refreshLanguageUI());

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
const leftPanel = $('left-panel');
const mastSelect = $('mast-select');
const panelSelect = $('panel-select');
const profileSelect = $('profile-select');

const scoreNumber = $('score-number');
const classificationBadge = $('classification-badge');
const classificationText = $('classification-text');
const verdictSummary = $('verdict-summary');
const verdictBar = $('verdict-bar');
const verdictRows = $('verdict-rows');
const scoreWindowLabel = $('score-window-label');
const keySun = $('key-sun');
const keyDte = $('key-dte');
const keyOutage = $('key-outage');
const keyDteCard = $('key-dte-card');
const keyOutageCard = $('key-outage-card');
const keyDteSub = $('key-dte-sub');
const keyOutageSub = $('key-outage-sub');

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
const sweepModal = $('sweep-modal');
const sweepModalBody = $('sweep-modal-body');
const sweepModalTitle = $('sweep-modal-title');
const sweepModalBadge = $('sweep-modal-badge');
const closeSweepModal = $('close-sweep-modal');
const openSweepBtn = $('open-sweep-btn');
const matrixModal = $('matrix-modal');
const matrixModalBody = $('matrix-modal-body');
const matrixModalBadge = $('matrix-modal-badge');
const closeMatrixModal = $('close-matrix-modal');
const abModal = $('ab-modal');
const abModalBody = $('ab-modal-body');
const abModalTitle = $('ab-modal-title');
const abModalBadge = $('ab-modal-badge');
const closeAbModal = $('close-ab-modal');
const guideModal = $('guide-modal');
const guideModalBody = $('guide-modal-body');
const guideModalTitle = $('guide-modal-title');
const guideModalBadge = $('guide-modal-badge');
const closeGuideModal = $('close-guide-modal');
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

function scenarioParams() {
  const params = new URLSearchParams();
  const site = state.currentSite;
  if (!site) return params;
  if (site.role === 'custom') {
    params.set('lat', site.lat.toFixed(6));
    params.set('lon', site.lon.toFixed(6));
  } else {
    params.set('site', site.id);
  }
  params.set('date', new Date(state.baseDate.getTime()).toISOString());
  params.set('profile', state.profileId);
  params.set('panel', state.panelType);
  params.set('mast', String(state.mastHeightM));
  params.set('lang', getLanguage());
  return params;
}

function updateURLState() {
  if (!state.currentSite || typeof history === 'undefined') return;
  const next = `${location.pathname}?${scenarioParams().toString()}`;
  const current = `${location.pathname}${location.search}`;
  if (next !== current) history.replaceState(null, '', next);
}

function parseScenarioURL(sites) {
  if (typeof location === 'undefined') return null;
  const params = new URLSearchParams(location.search);
  if (![...params.keys()].length) return null;
  const result = {};
  const min = new Date(Date.UTC(2026, 0, 1));
  const max = new Date(Date.UTC(2029, 0, 1));
  const rawDate = params.get('date');
  const date = rawDate ? new Date(rawDate) : null;
  if (date && Number.isFinite(date.getTime())) {
    result.baseDate = clampDate(date, min, max);
  }
  const profile = params.get('profile');
  if (profile && PROFILE_BY_ID[profile]) result.profileId = profile;
  const panel = params.get('panel');
  if (panel && PANELS[panel]) result.panelType = panel;
  const mast = Number.parseFloat(params.get('mast'));
  if ([0.5, 2, 5, 10, 20].includes(mast)) result.mastHeightM = mast;
  const lat = Number.parseFloat(params.get('lat'));
  const lon = Number.parseFloat(params.get('lon'));
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= 0 &&
    lon <= 360
  ) {
    result.customSite = getCustomSite(lat, lon);
  }
  const siteId = params.get('site');
  if (siteId) {
    const site = sites.find((candidate) => candidate.id === siteId);
    if (site) result.site = site;
  }
  return result;
}

function syncPresetSelect() {
  const presets = {
    'artemis-2026': Date.UTC(2026, 10, 14, 0, 0, 0),
    'clps-summer': Date.UTC(2026, 11, 21, 12, 0, 0),
    'clps-winter': Date.UTC(2026, 5, 21, 12, 0, 0)
  };
  if (Math.abs(state.baseDate.getTime() - Date.now()) < 5 * 60 * 1000) {
    presetSelect.value = 'now';
    return;
  }
  const match = Object.entries(presets).find(
    ([, ms]) => Math.abs(state.baseDate.getTime() - ms) < 60_000
  );
  presetSelect.value = match ? match[0] : 'custom';
}

let toastTimeout = null;

function showToast(message) {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

async function copyShareLink() {
  updateURLState();
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
    showToast(t('share.copied'));
  } catch {
    window.prompt(t('share.copyPrompt'), url);
  }
}

function exportScenarioJson() {
  if (!state.analysis || !state.currentSite) return;
  try {
    const date = new Date(state.baseDate).toISOString().slice(0, 10);
    downloadText(
      `lunar-scenario-${state.currentSite.id}-${date}.json`,
      'application/json',
      scenarioToJson(state.analysis)
    );
    showToast(t('export.downloaded'));
  } catch (error) {
    showToast(t('export.error', { message: error.message }));
  }
}

function initShareExportControls() {
  $('share-btn')?.addEventListener('click', copyShareLink);
  $('export-json-btn')?.addEventListener('click', exportScenarioJson);
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

function updateSitePanel(site) {
  hudSiteName.textContent = site.name;
  siteProgramBadge.textContent = siteProgram(site);
  siteDescription.textContent = localizedSiteDescription(site);
  siteSlopeVal.textContent =
    site.maxSlopeDeg == null ? '—' : `${Number(site.maxSlopeDeg).toFixed(1)}°`;
  siteElevVal.textContent =
    site.elevationKm == null
      ? '—'
      : `${site.elevationKm >= 0 ? '+' : ''}${site.elevationKm.toFixed(2)} km`;
  hudCoords.textContent = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`;
  siteDataQuality.textContent = dataQualityLabel(site);
  const horizonLabel = horizonSourceLabel(site);
  const referenceNote =
    site.horizonReferenceKm == null ? '' : ` · ${site.horizonReferenceKm.toFixed(0)} km`;
  siteDataSource.textContent = t('site.source', {
    horizon: `${horizonLabel}${referenceNote}`,
    ephem: site.ephemSource === 'jpl_horizons' ? t('ephem.horizons') : t('ephem.iau')
  });
  const radarLabel =
    site.horizonSource === 'analytic_flat'
      ? t('radar.analytic')
      : site.isRealLola
        ? t('radar.real')
        : t('radar.approx');
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
  setText('trek-modal-program', siteProgram(site));
  setText(
    'trek-modal-coords',
    `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`
  );
  setText(
    'trek-modal-elev',
    site.elevationKm == null
      ? '—'
      : `${site.elevationKm >= 0 ? '+' : ''}${site.elevationKm.toFixed(2)} km`
  );
  setText(
    'trek-modal-slope',
    site.maxSlopeDeg == null ? '—' : `${Number(site.maxSlopeDeg).toFixed(1)}°`
  );
  setText('trek-modal-quality', dataQualityLabel(site));
  setText('trek-modal-geology', site.geology ?? localizedSiteDescription(site));
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

function formatOutage(metrics) {
  const windowHours = metrics.sampleCount * metrics.stepHours;
  const days = metrics.gMaxHours / 24;
  const capped = metrics.gMaxHours >= windowHours;
  return `${capped ? '≥' : ''}${capped ? days.toFixed(0) : days.toFixed(1)} ${t('common.days')}`;
}

function setOutageDisplay(element, metrics) {
  if (!element) return;
  const text = formatOutage(metrics);
  const split = text.lastIndexOf(' ');
  const value = split === -1 ? text : text.slice(0, split);
  const unit = split === -1 ? '' : text.slice(split + 1);
  const valueSpan = document.createElement('span');
  valueSpan.className = 'key-value';
  valueSpan.textContent = value;
  element.textContent = '';
  element.append(valueSpan);
  if (unit) {
    const unitSpan = document.createElement('span');
    unitSpan.className = 'key-unit';
    unitSpan.textContent = unit;
    element.append(document.createTextNode(' '), unitSpan);
  }
}

function buildVerdictSummary(analysis) {
  const { metrics: m, profile: p, site } = analysis;
  if (site.role === 'reference') {
    return t('verdict.referenceSummary', {
      dte: m.dteCenterPct.toFixed(0),
      sun: m.sunlitPct.toFixed(0)
    });
  }
  if (site.role === 'international') {
    return t('verdict.internationalSummary', {
      dte: m.dteCenterPct.toFixed(0),
      sun: m.sunlitPct.toFixed(0)
    });
  }
  if (site.role === 'custom') {
    return t('verdict.customSummary', {
      sun: m.sunlitPct.toFixed(0),
      dte: m.dteCenterPct.toFixed(0),
      outage: formatOutage(m)
    });
  }
  const commsText =
    m.gMaxHours >= p.gMaxTolHours
      ? t('verdict.commsOut', { outage: formatOutage(m), tol: p.gMaxTolHours })
      : t('verdict.commsOk', { outage: formatOutage(m) });
  return t('verdict.summary', {
    sun: m.sunlitPct.toFixed(0),
    dte: m.dteCenterPct.toFixed(0),
    comms: commsText
  });
}

function updateDecisionUI(analysis) {
  scoreNumber.textContent = analysis.scorePercent;
  classificationBadge.className = `verdict-status ${analysis.badgeClass}`;
  classificationBadge.textContent = analysis.status;
  classificationText.textContent = analysis.statusText;
  if (verdictSummary) verdictSummary.textContent = buildVerdictSummary(analysis);

  const profile = analysis.profile;
  const metrics = analysis.metrics;
  if (keySun) keySun.textContent = `${metrics.sunlitPct.toFixed(0)}%`;
  if (keyDte) keyDte.textContent = `${metrics.dteCenterPct.toFixed(0)}%`;
  if (keyOutage) setOutageDisplay(keyOutage, metrics);
  if (keyDteSub) keyDteSub.textContent = `≥ ${profile.dteReqPct}%`;
  if (keyOutageSub) keyOutageSub.textContent = `≤ ${profile.gMaxTolHours} h`;
  keyDteCard?.classList.toggle('is-good', metrics.dteCenterPct >= profile.dteReqPct);
  keyDteCard?.classList.toggle('is-bad', metrics.dteCenterPct < profile.dteReqPct);
  keyOutageCard?.classList.toggle('is-good', metrics.gMaxHours < profile.gMaxTolHours);
  keyOutageCard?.classList.toggle('is-bad', metrics.gMaxHours >= profile.gMaxTolHours);

  const weights = analysis.profile.weights;
  const weightSum = weights.energy + weights.dark + weights.dte + weights.comms;
  const terms = [
    {
      label: t('term.energy'),
      metric: `${(analysis.metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²`,
      weight: weights.energy,
      share: analysis.components.energy,
      title: t('term.energyTitle', { req: analysis.profile.energyReqKWhM2 })
    },
    {
      label: t('term.eclipse'),
      metric: `${analysis.metrics.dMaxHours.toFixed(1)} h`,
      weight: weights.dark,
      share: analysis.components.dark,
      title: t('term.eclipseTitle', { tol: analysis.profile.dMaxTolHours })
    },
    {
      label: t('term.dte'),
      metric: `${analysis.metrics.dteCenterPct.toFixed(0)}%`,
      weight: weights.dte,
      share: analysis.components.dte,
      title: t('term.dteTitle', {
        req: analysis.profile.dteReqPct,
        partial: analysis.metrics.dtePartialPct.toFixed(0)
      })
    },
    {
      label: t('term.comms'),
      metric: `${analysis.metrics.gMaxHours.toFixed(1)} h`,
      weight: weights.comms,
      share: analysis.components.comms,
      title: t('term.commsTitle', {
        tol: analysis.profile.gMaxTolHours,
        state:
          analysis.metrics.gMaxHours >= analysis.profile.gMaxTolHours
            ? t('term.commsOut')
            : t('term.commsIn')
      })
    }
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
    if (points <= 0) segment.classList.add('is-zero');
    segment.title = t('term.points', {
      label: term.label,
      points: points.toFixed(1),
      max: maxPoints.toFixed(1)
    });
    verdictBar.appendChild(segment);

    const row = document.createElement('li');
    row.className = `verdict-row verdict-level-${level}`;
    row.title = term.title ?? '';
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
    [t('term.energy'), `${(analysis.metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²`, analysis.profile.weights.energy, analysis.components.energy],
    [t('term.eclipse'), `${analysis.metrics.dMaxHours.toFixed(1)} h`, analysis.profile.weights.dark, analysis.components.dark],
    [t('term.dte'), `${analysis.metrics.dteCenterPct.toFixed(0)}%`, analysis.profile.weights.dte, analysis.components.dte],
    [t('term.comms'), `${analysis.metrics.gMaxHours.toFixed(1)} h`, analysis.profile.weights.comms, analysis.components.comms]
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
    profileEl.textContent = t('model.profile', {
      name: t(analysis.profile.nameKey),
      energy: analysis.profile.energyReqKWhM2,
      eclipse: analysis.profile.dMaxTolHours,
      dte: analysis.profile.dteReqPct,
      outage: analysis.profile.gMaxTolHours,
      panel: t(PANELS[analysis.panelType].labelKey),
      mast: analysis.mastHeightM.toFixed(1)
    });
  }
  const commsNote = $('decision-comms-note');
  if (commsNote) {
    const p = analysis.profile;
    const m = analysis.metrics;
    commsNote.textContent = t('model.commsNote', {
      tol: p.gMaxTolHours,
      dte: m.dteCenterPct.toFixed(0),
      partial: m.dtePartialPct.toFixed(0)
    });
  }
}

function updateSimulation() {
  if (!state.currentSite || !state.analysis) return;
  const site = state.currentSite;
  const bodies = sampleSite(site, state.currentDate.getTime());
  const sky = makeSky(site, bodies, state.mastHeightM);
  state.currentSky = sky;

  clockDisplay.textContent = utcLabel(state.currentDate);
  scoreWindowLabel.textContent = t('verdict.window', {
    days: WINDOW_DAYS,
    start: utcLabel(state.baseDate),
    now: utcLabel(state.currentDate)
  });
  hudSunElev.textContent = `${sky.sun.elDeg >= 0 ? '+' : ''}${sky.sun.elDeg.toFixed(2)}° Elev`;
  hudEarthElev.textContent = `${sky.earth.elDeg >= 0 ? '+' : ''}${sky.earth.elDeg.toFixed(2)}° Elev`;

  const panelAzimuth = state.analysis.panelAzimuthDeg ?? 0;
  const irradiance = panelIrradianceWm2(
    state.panelType,
    sky.sun.azDeg,
    sky.sun.elDeg,
    sky.sun.distance,
    sky.sunVisibleFraction,
    panelAzimuth
  );
  solarEffVal.textContent = t('telemetry.irradiance', {
    value: irradiance.toFixed(0),
    fraction: (sky.sunVisibleFraction * 100).toFixed(0)
  });
  sunHorizonVal.textContent = t('telemetry.horizon', {
    horizon: sky.sunHorizonDeg.toFixed(2),
    clearance: (sky.sun.elDeg - sky.sunHorizonDeg).toFixed(2)
  });
  earthHorizonVal.textContent = t('telemetry.horizon', {
    horizon: sky.earthHorizonDeg.toFixed(2),
    clearance: (sky.earth.elDeg - sky.earthHorizonDeg).toFixed(2)
  });
  commLinkStatus.textContent = sky.dteCenter
    ? t('telemetry.dteCenter')
    : t('telemetry.dteBlocked');
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
  scrubberDayLabel.textContent = t('sim.dayShort', { day, total: WINDOW_DAYS });
  timeScrubber.setAttribute(
    'aria-valuetext',
    t('sim.dayAria', {
      day,
      total: WINDOW_DAYS,
      time: utcLabel(state.currentDate)
    })
  );
}

function formatCountdowns(events) {
  if (!events) {
    sunsetLabel.textContent = t('countdown.nextSolarEvent');
    sunsetCountdown.textContent = '—';
    sunsetSub.textContent = t('countdown.noEvents');
    earthsetLabel.textContent = t('countdown.nextDteEvent');
    earthsetCountdown.textContent = '—';
    earthsetSub.textContent = t('countdown.noEvents');
    return;
  }

  if (events.sunIsUp) {
    sunsetLabel.textContent = t('countdown.nextSunset');
    if (events.nextSunset) {
      sunsetCountdown.textContent = formatDurationMs(events.nextSunset.msRemaining);
      sunsetSub.textContent = t('countdown.sunsetAt', {
        time: utcLabel(events.nextSunset.date).slice(11, 16)
      });
    } else {
      sunsetCountdown.textContent = t('countdown.noSunset');
      sunsetSub.textContent = t('countdown.noSunsetWindow');
    }
  } else {
    sunsetLabel.textContent = t('countdown.nextSunrise');
    if (events.nextSunrise) {
      sunsetCountdown.textContent = formatDurationMs(events.nextSunrise.msRemaining);
      sunsetSub.textContent = t('countdown.sunriseAt', {
        time: utcLabel(events.nextSunrise.date).slice(11, 16)
      });
    } else {
      sunsetCountdown.textContent = t('countdown.noSunrise');
      sunsetSub.textContent = t('countdown.noSunriseWindow');
    }
  }

  if (events.earthIsUp) {
    earthsetLabel.textContent = t('countdown.nextDteLoss');
    if (events.nextEarthset) {
      earthsetCountdown.textContent = formatDurationMs(events.nextEarthset.msRemaining);
      earthsetSub.textContent = t('countdown.dteLossAt', {
        time: utcLabel(events.nextEarthset.date).slice(11, 16)
      });
    } else {
      earthsetCountdown.textContent = t('countdown.dteContinuous');
      earthsetSub.textContent = t('countdown.dteContinuousWindow');
    }
  } else {
    earthsetLabel.textContent = t('countdown.nextEarthrise');
    if (events.nextEarthrise) {
      earthsetCountdown.textContent = formatDurationMs(events.nextEarthrise.msRemaining);
      earthsetSub.textContent = t('countdown.earthriseAt', {
        time: utcLabel(events.nextEarthrise.date).slice(11, 16)
      });
    } else {
      earthsetCountdown.textContent = t('countdown.noEarthrise');
      earthsetSub.textContent = t('countdown.noEarthriseWindow');
    }
  }
}

async function calculateSeriesAndEvaluate() {
  if (!state.currentSite) return;
  const token = ++state.evaluationToken;
  setLoading(true, t('action.loading.evaluate'));
  await ensureEphemeris(state.currentSite);
  if (token !== state.evaluationToken) return;
  try {
    const analysis = evaluateSiteScenario({
      site: state.currentSite,
      startMs: state.baseDate.getTime(),
      mastHeightM: state.mastHeightM,
      panelType: state.panelType,
      profileId: state.profileId
    });
    if (token !== state.evaluationToken) return;
    state.analysis = analysis;
    state.series = analysis.series;
    updateDecisionUI(analysis);
    updateSimulation();
    syncPresetSelect();
    updateURLState();
  } catch (error) {
    console.error('No se pudo evaluar el sitio.', error);
    classificationBadge.textContent = t('status.noData');
    classificationBadge.className = 'verdict-status status-danger';
    classificationText.textContent = t('action.loadFailed', { message: error.message });
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
    option.textContent = `${site.name} · ${dataQualityLabel(site)}`;
    siteSelect.appendChild(option);
  }
  if (state.customSite) {
    const option = document.createElement('option');
    option.value = 'custom-site';
    option.textContent = `${state.customSite.name} · ${dataQualityLabel(state.customSite)}`;
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
  if (leftPanel) leftPanel.scrollTop = 0;
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
      message = t('custom.numeric');
    } else if (lat < -90 || lat > 90) {
      message = t('custom.latRange', { value: lat });
    } else if (lon < 0 || lon > 360) {
      message = t('custom.lonRange', { value: lon });
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
    if (value === 'custom') return;
    if (value === 'artemis-2026') state.baseDate = new Date(Date.UTC(2026, 10, 14, 0, 0, 0));
    else if (value === 'clps-summer') state.baseDate = new Date(Date.UTC(2026, 11, 21, 12, 0, 0));
    else if (value === 'clps-winter') state.baseDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0));
    else {
      const minDate = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
      const maxDate = new Date(Date.UTC(2029, 0, 1, 0, 0, 0));
      state.baseDate = clampDate(new Date(), minDate, maxDate);
    }
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
    playText.textContent = state.isPlaying ? t('action.pause') : t('action.simulate');
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
        playText.textContent = t('action.simulate');
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
  panoramaSiteLabel.textContent = `${state.currentSite.name} · ${utcLabel(state.currentDate)} · ${dataQualityLabel(state.currentSite)}`;
  panoramaSun.textContent = formatAzEl(state.currentSky.sun.azDeg, state.currentSky.sun.elDeg);
  panoramaEarth.textContent = formatAzEl(state.currentSky.earth.azDeg, state.currentSky.earth.elDeg);
  panoramaSunHorizon.textContent = `${state.currentSky.sunHorizonDeg.toFixed(2)}°`;
  panoramaEarthHorizon.textContent = `${state.currentSky.earthHorizonDeg.toFixed(2)}°`;
  panoramaMast.textContent = `${state.mastHeightM.toFixed(1)} m`;
}

async function openComparison() {
  if (!state.currentSite) return;
  setLoading(true, t('action.loading.compare'));
  try {
    const sites = allSites();
    await Promise.all(sites.map(ensureEphemeris));
    const analyses = sites.map((site) =>
      evaluateSiteScenario({
        site,
        startMs: state.baseDate.getTime(),
        mastHeightM: state.mastHeightM,
        panelType: state.panelType,
        profileId: state.profileId
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
        panelLabel: t(PANELS[state.panelType].labelKey)
      },
      (siteId) => {
        const found = allSites().find((site) => site.id === siteId);
        if (found) {
          closeModal(comparisonModal);
          prepareSite(found);
        }
      }
    );
    comparisonModalBody.querySelector('#open-matrix-btn')?.addEventListener('click', () => {
      closeModal(comparisonModal);
      openSiteDateMatrix();
    });
    comparisonModalBody.querySelector('#open-ab-btn')?.addEventListener('click', () => {
      closeModal(comparisonModal);
      openABComparison();
    });
    comparisonModalBody.querySelector('#export-comparison-csv')?.addEventListener('click', () => {
      try {
        const date = new Date(state.baseDate).toISOString().slice(0, 10);
        downloadText(
          `lunar-comparison-${date}.csv`,
          'text/csv',
          comparisonToCsv(analyses, {})
        );
        showToast(t('export.downloaded'));
      } catch (error) {
        showToast(t('export.error', { message: error.message }));
      }
    });
    openModal(comparisonModal);
  } catch (error) {
    console.error('No se pudo comparar los sitios.', error);
    comparisonModalBody.innerHTML = `<p class="data-note">${t('action.error.compare', { message: error.message })}</p>`;
    openModal(comparisonModal);
  } finally {
    setLoading(false);
  }
}

async function openSweep() {
  if (!state.currentSite) return;
  setLoading(true, t('action.loading.sweep'));
  try {
    const sweep = await loadDateSweep(state.currentSite.id);
    if (sweepModalTitle) {
      sweepModalTitle.textContent = t('action.sweepTitle', {
        site: state.currentSite.name
      });
    }
    if (!sweep) {
      if (sweepModalBadge) sweepModalBadge.textContent = t('action.noSweepBadge');
      sweepModalBody.innerHTML = `<p class="data-note">${t('action.noSweep', {
        site: state.currentSite.name
      })}</p>`;
    } else {
      if (sweepModalBadge) {
        sweepModalBadge.textContent = t('action.sweepBadge', {
          count: sweep.points.length
        });
      }
      const sweepContext = {
        profile: PROFILE_BY_ID[state.profileId],
        panelType: state.panelType,
        mastHeightM: state.mastHeightM,
        currentDateMs: state.baseDate.getTime(),
        siteName: state.currentSite.name
      };
      renderDateSweep(sweepModalBody, {
        sweep,
        context: sweepContext,
        onSelectDate: (startMs) => {
          closeModal(sweepModal);
          state.baseDate = new Date(startMs);
          state.currentDate = new Date(startMs);
          calculateSeriesAndEvaluate();
        }
      });
      sweepModalBody.querySelector('#export-sweep-csv')?.addEventListener('click', () => {
        try {
          downloadText(
            `lunar-sweep-${state.currentSite.id}.csv`,
            'text/csv',
            sweepToCsv(sweep, sweepContext)
          );
          showToast(t('export.downloaded'));
        } catch (error) {
          showToast(t('export.error', { message: error.message }));
        }
      });
    }
    openModal(sweepModal);
  } catch (error) {
    console.error('No se pudo cargar el barrido de fechas.', error);
    sweepModalBody.innerHTML = `<p class="data-note">${t('action.error.sweep', {
      message: error.message
    })}</p>`;
    openModal(sweepModal);
  } finally {
    setLoading(false);
  }
}

function openGuide() {
  if (!guideModal) return;
  guideModalTitle.textContent = t('guide.title');
  guideModalBadge.textContent = t('guide.badge');
  renderGuide(guideModalBody);
  openModal(guideModal);
}

async function evaluateABScenario(site, startMs) {
  await ensureEphemeris(site);
  return evaluateSiteScenario({
    site,
    startMs,
    mastHeightM: state.mastHeightM,
    panelType: state.panelType,
    profileId: state.profileId
  });
}

async function openABComparison() {
  if (!state.currentSite) return;
  const sites = allSites();
  let leftSite = state.currentSite;
  let rightSite = sites.find((site) => site.id !== leftSite.id) ?? leftSite;
  let leftStart = state.baseDate.getTime();
  let rightStart = state.baseDate.getTime();

  abModalTitle.textContent = t('ab.title');
  abModalBadge.textContent = t('ab.badge');

  const show = async () => {
    setLoading(true, t('ab.loading'));
    try {
      const [left, right] = await Promise.all([
        evaluateABScenario(leftSite, leftStart),
        evaluateABScenario(rightSite, rightStart)
      ]);
      renderSideBySide(abModalBody, {
        sites,
        left,
        right,
        context: {
          profile: PROFILE_BY_ID[state.profileId],
          panelLabel: t(PANELS[state.panelType].labelKey),
          mastHeightM: state.mastHeightM
        },
        onCompare: async ({ a, b }) => {
          const siteA = sites.find((site) => site.id === a.siteId);
          const siteB = sites.find((site) => site.id === b.siteId);
          if (!siteA || !siteB) return;
          leftSite = siteA;
          rightSite = siteB;
          leftStart = a.startMs;
          rightStart = b.startMs;
          await show();
        },
        onLoad: (siteId, startMs) => {
          const site = sites.find((candidate) => candidate.id === siteId);
          if (!site) return;
          closeModal(abModal);
          state.baseDate = new Date(startMs);
          state.currentDate = new Date(startMs);
          prepareSite(site);
        }
      });
      if (abModal.classList.contains('hidden')) openModal(abModal);
    } catch (error) {
      console.error('No se pudo comparar A/B.', error);
      abModalBody.innerHTML = `<p class="data-note">${t('ab.error', {
        message: error.message
      })}</p>`;
      if (abModal.classList.contains('hidden')) openModal(abModal);
    } finally {
      setLoading(false);
    }
  };

  await show();
}

async function openSiteDateMatrix() {
  if (!state.currentSite) return;
  setLoading(true, t('action.loading.matrix'));
  try {
    const sites = allSites();
    const sweeps = (
      await Promise.all(
        sites.map(async (site) => {
          const sweep = await loadDateSweep(site.id);
          return sweep
            ? { siteId: site.id, siteName: site.name, role: site.role, sweep }
            : null;
        })
      )
    ).filter(Boolean);

    if (!sweeps.length) {
      matrixModalBody.innerHTML = `<p class="data-note">${t('action.noMatrix')}</p>`;
    } else {
      if (matrixModalBadge) {
        matrixModalBadge.textContent = t('action.matrixBadge', {
          sites: sweeps.length,
          months: sweeps[0].sweep.points.length
        });
      }
      const matrixContext = {
        profile: PROFILE_BY_ID[state.profileId],
        panelType: state.panelType,
        mastHeightM: state.mastHeightM,
        currentDateMs: state.baseDate.getTime()
      };
      renderSiteDateMatrix(matrixModalBody, {
        sweeps,
        context: matrixContext,
        onSelect: (siteId, startMs) => {
          const site = allSites().find((candidate) => candidate.id === siteId);
          if (!site) return;
          closeModal(matrixModal);
          state.baseDate = new Date(startMs);
          state.currentDate = new Date(startMs);
          prepareSite(site);
        },
        onExport: () => {
          try {
            downloadText(
              'lunar-site-date-matrix.csv',
              'text/csv',
              matrixToCsv(sweeps, matrixContext)
            );
            showToast(t('export.downloaded'));
          } catch (error) {
            showToast(t('export.error', { message: error.message }));
          }
        }
      });
    }
    openModal(matrixModal);
  } catch (error) {
    console.error('No se pudo cargar la matriz sitio × fecha.', error);
    matrixModalBody.innerHTML = `<p class="data-note">${t('action.error.matrix', {
      message: error.message
    })}</p>`;
    openModal(matrixModal);
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
  openSweepBtn?.addEventListener('click', openSweep);
  closeSweepModal?.addEventListener('click', () => closeModal(sweepModal));
  closeMatrixModal?.addEventListener('click', () => closeModal(matrixModal));
  closeAbModal?.addEventListener('click', () => closeModal(abModal));
  closeGuideModal?.addEventListener('click', () => closeModal(guideModal));
  $('open-guide-btn')?.addEventListener('click', openGuide);
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

  for (const modal of [
    comparisonModal,
    sweepModal,
    matrixModal,
    abModal,
    guideModal,
    horizonsModal,
    nnModal,
    panoramaModal,
    trekModal
  ].filter(Boolean)) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal(modal);
    });
  }
}

function refreshLanguageUI() {
  if (state.customSite) {
    state.customSite.name = `${t('site.customName')} (${state.customSite.lat.toFixed(2)}°, ${state.customSite.lon.toFixed(2)}°)`;
    state.customSite.shortName = t('site.customName');
  }
  populateSiteSelector(state.sites);
  if (state.currentSite) {
    updateSitePanel(state.currentSite);
    siteSelect.value = state.currentSite.id;
  }
  if (state.analysis) {
    Object.assign(
      state.analysis,
      buildStatus(
        state.analysis.site,
        state.analysis.metrics,
        state.analysis.components,
        state.analysis.profile
      )
    );
    updateDecisionUI(state.analysis);
    updateSimulation();
    if (state.panoramaOpen) updatePanorama();
  }
  playText.textContent = state.isPlaying ? t('action.pause') : t('action.simulate');
  const trekModal = $('trek-modal');
  if (trekModal && !trekModal.classList.contains('hidden') && state.currentSite) {
    updateTrekModalContent(
      state.currentSite,
      getQuickMapUrl(state.currentSite),
      getMoonTrekUrl(state.currentSite)
    );
  }
  updateURLState();
}

async function bootstrap() {
  try {
    const sites = await loadLandingSites();
    state.sites = sites;
    const urlState = parseScenarioURL(sites);
    if (urlState) {
      if (urlState.baseDate) {
        state.baseDate = urlState.baseDate;
        state.currentDate = new Date(urlState.baseDate);
      }
      if (urlState.profileId) state.profileId = urlState.profileId;
      if (urlState.panelType) state.panelType = urlState.panelType;
      if (urlState.mastHeightM != null) state.mastHeightM = urlState.mastHeightM;
      if (urlState.customSite) state.customSite = urlState.customSite;
    }
    state.currentSite =
      urlState?.customSite ??
      urlState?.site ??
      sites.find((site) => site.id === 'site23') ??
      sites[0];
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
    initShareExportControls();
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
    loadingOverlay.classList.add('is-error');
    setLoading(true, t('action.bootstrapFailed', { message: error.message }));
    const strong = loadingOverlay.querySelector('strong');
    if (strong) strong.textContent = t('action.loadingErrorTitle');
    classificationBadge.textContent = t('status.noData');
    classificationText.textContent = error.message;
  }
}

window.addEventListener('DOMContentLoaded', bootstrap);
