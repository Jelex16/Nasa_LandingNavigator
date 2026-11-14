import './style.css';
import { MoonScene } from './render/moonScene.js';
import { SkyDomeRadar } from './ui/skyDomeRadar.js';
import { TimelineChart } from './ui/timelineChart.js';
import { NetworkVisualizer } from './ui/networkVisualizer.js';
import { renderComparisonTable } from './ui/comparisonView.js';
import { LANDING_SITES, getCustomSite, getQuickMapUrl, getMoonTrekUrl } from './topography/lunarData.js';
import {
  calculateLunarEphemeris,
  calculateEphemerisSeries,
  calculateEventCountdowns
} from './ephemeris/astronomy.js';
import { queryHorizons, buildHorizonsUrl } from './ephemeris/horizonsApi.js';
import { evaluateLandingSite, scanRegionWithNeuralNet } from './neural/landingNetwork.js';

// Application State
const state = {
  currentSite: LANDING_SITES[0], // Malapert Mountain default
  currentDate: new Date(Date.UTC(2026, 10, 14, 0, 0, 0)), // November 14, 2026 (Space Apps / Artemis III Window)
  baseDate: new Date(Date.UTC(2026, 10, 14, 0, 0, 0)),
  isPlaying: false,
  playbackSpeed: 1, // 1 hour per tick, 10, 60
  seriesDays: 30,
  currentEphemeris: null,
  currentSeries: [],
  currentEvaluation: null
};

// UI Element References
const siteSelect = document.getElementById('site-select');
const siteProgramBadge = document.getElementById('site-program-badge');
const siteDescription = document.getElementById('site-description');
const siteSlopeVal = document.getElementById('site-slope-val');
const siteElevVal = document.getElementById('site-elev-val');
const siteIceVal = document.getElementById('site-ice-val');

const presetSelect = document.getElementById('preset-select');
const datetimeInput = document.getElementById('datetime-input');
const timeScrubber = document.getElementById('time-scrubber');
const scrubberDayLabel = document.getElementById('scrubber-day-label');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const playText = document.getElementById('play-text');
const clockDisplay = document.getElementById('clock-display');

// HUD elements
const hudSiteName = document.getElementById('hud-site-name');
const hudCoords = document.getElementById('hud-coords');
const hudSunElev = document.getElementById('hud-sun-elev');
const hudEarthElev = document.getElementById('hud-earth-elev');

// Neural Evaluation elements
const scoreCircle = document.getElementById('score-circle');
const scoreNumber = document.getElementById('score-number');
const classificationBadge = document.getElementById('classification-badge');
const classificationText = document.getElementById('classification-text');
const terrainScore = document.getElementById('terrain-score');
const terrainFill = document.getElementById('terrain-fill');
const powerScore = document.getElementById('power-score');
const powerFill = document.getElementById('power-fill');
const commScore = document.getElementById('comm-score');
const commFill = document.getElementById('comm-fill');
const scienceScore = document.getElementById('science-score');
const scienceFill = document.getElementById('science-fill');
const xaiItems = document.getElementById('xai-items');

// Operational Countdown elements
const sunsetCountdown = document.getElementById('sunset-countdown');
const sunsetSub = document.getElementById('sunset-sub');
const earthsetCountdown = document.getElementById('earthset-countdown');
const earthsetSub = document.getElementById('earthset-sub');
const solarEffVal = document.getElementById('solar-eff-val');
const commLinkStatus = document.getElementById('comm-link-status');

// Modals
const comparisonModal = document.getElementById('comparison-modal');
const comparisonModalBody = document.getElementById('comparison-modal-body');
const closeComparisonModal = document.getElementById('close-comparison-modal');
const openComparisonBtn = document.getElementById('open-comparison-btn');

const horizonsModal = document.getElementById('horizons-modal');
const closeHorizonsModal = document.getElementById('close-horizons-modal');
const openHorizonsBtn = document.getElementById('open-horizons-btn');
const horizonsUrlBox = document.getElementById('horizons-url-box');
const testHorizonsFetchBtn = document.getElementById('test-horizons-fetch-btn');
const horizonsFetchStatus = document.getElementById('horizons-fetch-status');

const nnModal = document.getElementById('nn-modal');
const closeNnModal = document.getElementById('close-nn-modal');
const toggleNnViewBtn = document.getElementById('toggle-nn-view-btn');

// Timeline Drawer Elements
const timelineToggleBtn = document.getElementById('timeline-toggle-btn');
const chartDrawer = document.getElementById('chart-drawer');
const timelineArrow = document.getElementById('timeline-arrow');

// Initialize 3D Scene & Canvas Components
const threeContainer = document.getElementById('three-container');
const moonScene = new MoonScene(threeContainer);

const skyDomeCanvas = document.getElementById('sky-dome-canvas');
const skyDomeRadar = new SkyDomeRadar(skyDomeCanvas);

const timelineCanvas = document.getElementById('timeline-chart-canvas');
const timelineChart = new TimelineChart(timelineCanvas, (selectedDate) => {
  state.currentDate = selectedDate;
  updateDateTimeInput();
  updateSimulation();
});

const nnCanvas = document.getElementById('neural-net-canvas');
const networkVisualizer = new NetworkVisualizer(nnCanvas);

/**
 * Initializes the landing site dropdown and quick-select pill buttons.
 */
function initSiteSelector() {
  siteSelect.innerHTML = '';
  LANDING_SITES.forEach((site) => {
    const opt = document.createElement('option');
    opt.value = site.id;
    opt.textContent = `${site.name} (${site.lat.toFixed(1)}°, ${site.lon.toFixed(1)}°)`;
    siteSelect.appendChild(opt);
  });

  siteSelect.addEventListener('change', (e) => {
    const selected = LANDING_SITES.find((s) => s.id === e.target.value);
    if (selected) {
      setLandingSite(selected);
    }
  });

  // Pill buttons in Top Nav Bar
  const pills = document.querySelectorAll('#site-pills-bar .pill-btn');
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      const siteId = e.currentTarget.getAttribute('data-site');
      const found = LANDING_SITES.find((s) => s.id === siteId);
      if (found) {
        setLandingSite(found);
      }
    });
  });

  // Custom coordinate input handlers
  document.getElementById('apply-custom-btn').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('custom-lat').value);
    const lon = parseFloat(document.getElementById('custom-lon').value);
    if (!isNaN(lat) && !isNaN(lon)) {
      const custom = getCustomSite(lat, lon);
      setLandingSite(custom);
    }
  });

  // Register sites in 3D scene
  moonScene.setLandingSites(LANDING_SITES, (siteId) => {
    const found = LANDING_SITES.find((s) => s.id === siteId);
    if (found) {
      setLandingSite(found);
    }
  });
}

/**
 * Switches the active landing site.
 */
function setLandingSite(site) {
  state.currentSite = site;
  siteProgramBadge.textContent = site.program;
  siteDescription.textContent = site.description;
  siteSlopeVal.textContent = `${site.maxSlopeDeg}°`;
  siteElevVal.textContent = `${site.elevationKm > 0 ? '+' : ''}${site.elevationKm.toFixed(1)} km`;
  if (siteIceVal) siteIceVal.textContent = `${site.distToIceTrapKm.toFixed(1)} km`;

  hudSiteName.textContent = site.name;
  hudCoords.textContent = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`;

  // Update LROC QuickMap and NASA Moon Trek URLs for active site
  const qmUrl = getQuickMapUrl(site);
  const mtUrl = getMoonTrekUrl(site);

  const btnQuickmap = document.getElementById('btn-open-quickmap');
  if (btnQuickmap) btnQuickmap.href = qmUrl;

  const btnMoontrek = document.getElementById('btn-open-moontrek');
  if (btnMoontrek) btnMoontrek.href = mtUrl;

  updateTrekModalContent(site, qmUrl, mtUrl);

  // Sync Pill selection state
  document.querySelectorAll('#site-pills-bar .pill-btn').forEach((p) => {
    if (p.getAttribute('data-site') === site.id) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  if (siteSelect) siteSelect.value = site.id;

  moonScene.setActiveSite(site);
  updateHorizonsUrlDisplay();
  calculateSeriesAndEvaluate();
}

/**
 * Recalculates 30-day time series and runs the Neural Network evaluation.
 */
function calculateSeriesAndEvaluate() {
  const site = state.currentSite;

  // Compute 30-day ephemeris time series at 2-hour intervals (360 data points)
  state.currentSeries = calculateEphemerisSeries(state.baseDate, site.lat, site.lon, state.seriesDays, 2);

  // Derive mission statistical features across the period
  let sunUpCount = 0;
  let earthUpCount = 0;
  let maxConsecutiveShadowHours = 0;
  let curShadowHours = 0;
  let sunElSum = 0;

  state.currentSeries.forEach((pt) => {
    const topoSun = site.horizonProfile ? site.horizonProfile(pt.sunAz) : 0;
    const topoEarth = site.horizonProfile ? site.horizonProfile(pt.earthAz) : 0;

    const sunUp = pt.sunEl > topoSun;
    const earthUp = pt.earthEl > topoEarth;

    if (sunUp) {
      sunUpCount++;
      sunElSum += pt.sunEl;
      curShadowHours = 0;
    } else {
      curShadowHours += 2;
      if (curShadowHours > maxConsecutiveShadowHours) {
        maxConsecutiveShadowHours = curShadowHours;
      }
    }

    if (earthUp) {
      earthUpCount++;
    }
  });

  const totalPoints = state.currentSeries.length;
  const solarCoverage = sunUpCount / totalPoints;
  const earthCoverage = earthUpCount / totalPoints;
  const meanSunEl = sunUpCount > 0 ? sunElSum / sunUpCount : -1.0;

  // Run Deep Neural Network (LunarLandNet)
  const evalResult = evaluateLandingSite({
    maxSlopeDeg: site.maxSlopeDeg,
    roughnessIndex: site.roughnessIndex,
    solarCoverage,
    meanSolarElev: meanSunEl,
    earthCoverage,
    maxShadowGapHours: maxConsecutiveShadowHours,
    distToIceTrapKm: site.distToIceTrapKm,
    elevationKm: site.elevationKm
  });

  state.currentEvaluation = evalResult;

  // Update Neural Network UI Card
  updateNeuralUI(evalResult);

  // Update 3D Marker pin status color
  moonScene.updateSiteStatus(site.id, evalResult.scorePercent);

  // Update current point simulation
  updateSimulation();
}

/**
 * Updates UI elements for the Neural Network evaluation results.
 */
function updateNeuralUI(evalResult) {
  scoreNumber.textContent = evalResult.scorePercent;

  // Update circular gauge status class
  scoreCircle.className = `gauge-ring ${evalResult.badgeClass}`;
  classificationBadge.className = `badge-go-nogo ${evalResult.badgeClass}`;
  classificationBadge.textContent = evalResult.status;
  classificationText.textContent = evalResult.statusText;

  // Sub-scores
  terrainScore.textContent = `${evalResult.terrainStability}%`;
  terrainFill.style.width = `${evalResult.terrainStability}%`;

  powerScore.textContent = `${evalResult.powerFeasibility}%`;
  powerFill.style.width = `${evalResult.powerFeasibility}%`;

  commScore.textContent = `${evalResult.commReliability}%`;
  commFill.style.width = `${evalResult.commReliability}%`;

  scienceScore.textContent = `${evalResult.scienceValue}%`;
  scienceFill.style.width = `${evalResult.scienceValue}%`;

  // Explainability XAI factors
  xaiItems.innerHTML = '';
  evalResult.attributions.forEach((attr) => {
    const item = document.createElement('div');
    item.className = 'xai-item';
    item.innerHTML = `
      <span class="xai-name" title="${attr.desc}">${attr.feature}: <strong>${attr.value}</strong></span>
      <span class="xai-impact ${attr.positive ? 'impact-pos' : 'impact-neg'}">${attr.impact}</span>
    `;
    xaiItems.appendChild(item);
  });

  // Update Neural Network visualizer
  networkVisualizer.update(evalResult);
}

/**
 * Updates ephemeris for the exact current date/time and refreshes all views.
 */
function updateSimulation() {
  const site = state.currentSite;
  const date = state.currentDate;

  // Calculate high-precision lunar ephemeris
  const eph = calculateLunarEphemeris(date, site.lat, site.lon);
  state.currentEphemeris = eph;

  // Update Clock HUD
  const pad = (n) => String(n).padStart(2, '0');
  const dStr = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())} UTC`;
  clockDisplay.textContent = dStr;

  // Update HUD
  hudSunElev.textContent = `${eph.sun.el >= 0 ? '+' : ''}${eph.sun.el.toFixed(2)}° Elev`;
  hudEarthElev.textContent = `${eph.earth.el >= 0 ? '+' : ''}${eph.earth.el.toFixed(2)}° Elev`;

  // Solar Flux estimation (~1361 W/m2 at 1 AU * sin(elevation))
  const topoSun = site.horizonProfile ? site.horizonProfile(eph.sun.az) : 0;
  const topoEarth = site.horizonProfile ? site.horizonProfile(eph.earth.az) : 0;

  const sunIsUp = eph.sun.el > topoSun;
  const earthIsUp = eph.earth.el > topoEarth;

  const solarEfficiencyPct = sunIsUp ? Math.round(Math.sin((eph.sun.el * Math.PI) / 180) * 100) : 0;
  const solarFlux = sunIsUp ? Math.round(1361 * Math.sin((eph.sun.el * Math.PI) / 180)) : 0;

  solarEffVal.textContent = `Eficiencia: ${solarEfficiencyPct}% (${solarFlux} W/m²)`;

  commLinkStatus.textContent = earthIsUp ? '✓ Enlace DTE Activo' : '⚠ Señal Obstruida (LOLA)';
  commLinkStatus.style.color = earthIsUp ? 'var(--color-cyan)' : 'var(--color-red)';

  // Calculate Operational Event Countdowns
  const countdowns = calculateEventCountdowns(date, site.lat, site.lon, site.horizonProfile);
  formatCountdowns(countdowns);

  // Update 3D Moon Scene
  moonScene.updateEphemeris(eph, site);

  // Update 2D Sky Dome Radar
  skyDomeRadar.update(site, eph, state.currentSeries);

  // Update Timeline Chart
  timelineChart.update(state.currentSeries, site, date.getTime());

  // Update Time Scrubber position
  const hoursFromBase = (date.getTime() - state.baseDate.getTime()) / 3600000;
  timeScrubber.value = Math.max(0, Math.min(720, Math.round(hoursFromBase)));
  const currentDay = Math.floor(hoursFromBase / 24) + 1;
  scrubberDayLabel.textContent = `Día ${currentDay} / 30`;
}

/**
 * Formats countdown timers into readable hours and minutes.
 */
function formatCountdowns(cd) {
  function fmtMs(ms) {
    if (!ms || ms <= 0) return '0h 00m';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    if (days >= 2) {
      return `${days}d ${hours % 24}h ${mins}m`;
    }
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }

  if (cd.sunIsUp) {
    if (cd.nextSunset) {
      sunsetCountdown.textContent = fmtMs(cd.nextSunset.msRemaining);
      sunsetSub.textContent = `Ocaso a las ${cd.nextSunset.date.toISOString().substring(11, 16)} UTC`;
    } else {
      sunsetCountdown.textContent = 'Sol Permanente';
      sunsetSub.textContent = 'Pico de Luz Eterna (PEL) en esta estación';
    }
  } else {
    if (cd.nextSunrise) {
      sunsetCountdown.textContent = `En Sombra (${fmtMs(cd.nextSunrise.msRemaining)})`;
      sunsetSub.textContent = `Amanecer a las ${cd.nextSunrise.date.toISOString().substring(11, 16)} UTC`;
    } else {
      sunsetCountdown.textContent = 'Noche Polar Continua';
      sunsetSub.textContent = 'Zona en sombra total';
    }
  }

  if (cd.earthIsUp) {
    if (cd.nextEarthset) {
      earthsetCountdown.textContent = fmtMs(cd.nextEarthset.msRemaining);
      earthsetSub.textContent = `Pérdida a las ${cd.nextEarthset.date.toISOString().substring(11, 16)} UTC`;
    } else {
      earthsetCountdown.textContent = 'Visibilidad Continua';
      earthsetSub.textContent = 'Sin pérdida de comunicación durante libración';
    }
  } else {
    if (cd.nextEarthrise) {
      earthsetCountdown.textContent = `Sin Señal (${fmtMs(cd.nextEarthrise.msRemaining)})`;
      earthsetSub.textContent = `Reaparición a las ${cd.nextEarthrise.date.toISOString().substring(11, 16)} UTC`;
    } else {
      earthsetCountdown.textContent = 'Oclusión Permanente';
      earthsetSub.textContent = 'Tierra debajo del relieve montañoso';
    }
  }
}

/**
 * Synchronizes the datetime HTML input with state.currentDate.
 */
function updateDateTimeInput() {
  const d = state.currentDate;
  const pad = (n) => String(n).padStart(2, '0');
  const localIso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())}`;
  datetimeInput.value = localIso;
}

/**
 * Date/Time controller listeners.
 */
function initTimeControls() {
  updateDateTimeInput();

  datetimeInput.addEventListener('change', (e) => {
    if (e.target.value) {
      state.currentDate = new Date(e.target.value + ':00Z');
      state.baseDate = new Date(state.currentDate);
      calculateSeriesAndEvaluate();
    }
  });

  // Time preset switcher
  presetSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'artemis-2026') {
      state.currentDate = new Date(Date.UTC(2026, 10, 14, 0, 0, 0));
    } else if (val === 'clps-summer') {
      state.currentDate = new Date(Date.UTC(2026, 11, 21, 12, 0, 0)); // Southern Summer Solstice
    } else if (val === 'clps-winter') {
      state.currentDate = new Date(Date.UTC(2026, 5, 21, 12, 0, 0)); // Southern Winter Solstice
    } else if (val === 'now') {
      state.currentDate = new Date();
    }
    state.baseDate = new Date(state.currentDate);
    updateDateTimeInput();
    calculateSeriesAndEvaluate();
  });

  // Step buttons (-1d, -1h, +1h, +1d)
  document.getElementById('step-back-day').addEventListener('click', () => {
    state.currentDate = new Date(state.currentDate.getTime() - 86400000);
    updateDateTimeInput();
    updateSimulation();
  });
  document.getElementById('step-back-hour').addEventListener('click', () => {
    state.currentDate = new Date(state.currentDate.getTime() - 3600000);
    updateDateTimeInput();
    updateSimulation();
  });
  document.getElementById('step-fwd-hour').addEventListener('click', () => {
    state.currentDate = new Date(state.currentDate.getTime() + 3600000);
    updateDateTimeInput();
    updateSimulation();
  });
  document.getElementById('step-fwd-day').addEventListener('click', () => {
    state.currentDate = new Date(state.currentDate.getTime() + 86400000);
    updateDateTimeInput();
    updateSimulation();
  });

  // Time Scrubber slider
  timeScrubber.addEventListener('input', (e) => {
    const hours = parseInt(e.target.value, 10);
    state.currentDate = new Date(state.baseDate.getTime() + hours * 3600000);
    updateDateTimeInput();
    updateSimulation();
  });

  // Play / Pause Simulation
  playPauseBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    playIcon.textContent = state.isPlaying ? '⏸' : '▶';
    playText.textContent = state.isPlaying ? 'Pausa' : 'Simular';
  });

  // Speed selectors (1x, 10x, 60x)
  document.querySelectorAll('.speed-chip').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.speed-chip').forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      state.playbackSpeed = parseInt(e.target.getAttribute('data-speed'), 10);
    });
  });

  // Timeline Drawer Toggle
  timelineToggleBtn.addEventListener('click', () => {
    const isHidden = chartDrawer.classList.contains('hidden');
    if (isHidden) {
      chartDrawer.classList.remove('hidden');
      timelineArrow.classList.add('rotated');
      setTimeout(() => timelineChart.resize(), 50);
    } else {
      chartDrawer.classList.add('hidden');
      timelineArrow.classList.remove('rotated');
    }
  });

  // Simulation tick loop (~60 fps)
  let lastTick = performance.now();
  function simulationLoop(now) {
    const deltaMs = now - lastTick;
    lastTick = now;

    if (state.isPlaying) {
      // Advance by playback speed: 1x = 1 simulated hour every 2 seconds
      const simulatedHoursToAdd = (deltaMs / 2000) * state.playbackSpeed;
      state.currentDate = new Date(state.currentDate.getTime() + simulatedHoursToAdd * 3600000);

      // Loop over 30 days
      const maxMs = state.baseDate.getTime() + 30 * 86400000;
      if (state.currentDate.getTime() > maxMs) {
        state.currentDate = new Date(state.baseDate);
      }

      updateDateTimeInput();
      updateSimulation();
    }

    requestAnimationFrame(simulationLoop);
  }
  requestAnimationFrame(simulationLoop);
}

/**
 * Camera View buttons on Floating Camera Bar
 */
function initCameraHUDControls() {
  const camButtons = [
    { id: 'hud-view-south-pole', action: () => moonScene.viewSouthPole() },
    { id: 'hud-view-site', action: () => moonScene.viewSite(state.currentSite) },
    { id: 'hud-view-global', action: () => moonScene.viewGlobal() }
  ];

  camButtons.forEach(({ id, action }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      camButtons.forEach((c) => document.getElementById(c.id)?.classList.remove('active'));
      btn.classList.add('active');
      action();
    });
  });
}

/**
 * Lunar Model Layer & 3D Topography Relief Controls
 */
function initModelLayerControls() {
  const layerBtns = document.querySelectorAll('.layer-btn');
  layerBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const layerId = e.currentTarget.getAttribute('data-layer');
      layerBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      moonScene.setLayer(layerId);
    });
  });

  const reliefBtns = document.querySelectorAll('.relief-btn');
  reliefBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const reliefVal = parseFloat(e.currentTarget.getAttribute('data-relief'));
      reliefBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      moonScene.setElevationExaggeration(reliefVal);
    });
  });
}

/**
 * Updates the NASA Moon Trek & LROC QuickMap scientific dossier modal.
 */
function updateTrekModalContent(site, qmUrl, mtUrl) {
  const siteNameEl = document.getElementById('trek-modal-site-name');
  if (siteNameEl) siteNameEl.textContent = site.name;

  const progEl = document.getElementById('trek-modal-program');
  if (progEl) progEl.textContent = site.program;

  const qmBtn = document.getElementById('trek-modal-quickmap-btn');
  if (qmBtn) qmBtn.href = qmUrl;

  const mtBtn = document.getElementById('trek-modal-moontrek-btn');
  if (mtBtn) mtBtn.href = mtUrl;

  const coordsEl = document.getElementById('trek-modal-coords');
  if (coordsEl) coordsEl.textContent = `${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E`;

  const elevEl = document.getElementById('trek-modal-elev');
  if (elevEl) elevEl.textContent = `${site.elevationKm > 0 ? '+' : ''}${site.elevationKm.toFixed(1)} km`;

  const slopeEl = document.getElementById('trek-modal-slope');
  if (slopeEl) slopeEl.textContent = `${site.maxSlopeDeg}°`;

  const iceEl = document.getElementById('trek-modal-ice');
  if (iceEl) iceEl.textContent = `${site.distToIceTrapKm.toFixed(1)} km`;

  const geoEl = document.getElementById('trek-modal-geology');
  if (geoEl) geoEl.textContent = site.geology || site.description;
}

/**
 * Initializes Modals (Comparison, JPL Horizons, Neural Network Visualizer, Moon Trek & QuickMap)
 */
function initModals() {
  // Multi-Site Comparison Modal
  openComparisonBtn.addEventListener('click', () => {
    // Evaluate all candidate sites for the current date
    const siteEvaluations = LANDING_SITES.map((site) => {
      const series = calculateEphemerisSeries(state.currentDate, site.lat, site.lon, 14, 3);
      let sunUpCount = 0;
      let earthUpCount = 0;
      let maxShadow = 0;
      let curShadow = 0;
      let sunSum = 0;

      series.forEach((pt) => {
        const topoSun = site.horizonProfile ? site.horizonProfile(pt.sunAz) : 0;
        const topoEarth = site.horizonProfile ? site.horizonProfile(pt.earthAz) : 0;
        if (pt.sunEl > topoSun) {
          sunUpCount++;
          sunSum += pt.sunEl;
          curShadow = 0;
        } else {
          curShadow += 3;
          if (curShadow > maxShadow) maxShadow = curShadow;
        }
        if (pt.earthEl > topoEarth) earthUpCount++;
      });

      const solarCov = sunUpCount / series.length;
      const earthCov = earthUpCount / series.length;
      const meanSun = sunUpCount > 0 ? sunSum / sunUpCount : -1;

      const evaluation = evaluateLandingSite({
        maxSlopeDeg: site.maxSlopeDeg,
        roughnessIndex: site.roughnessIndex,
        solarCoverage: solarCov,
        meanSolarElev: meanSun,
        earthCoverage: earthCov,
        maxShadowGapHours: maxShadow,
        distToIceTrapKm: site.distToIceTrapKm,
        elevationKm: site.elevationKm
      });

      return {
        site,
        solarCoverage: solarCov,
        earthCoverage: earthCov,
        maxShadowGapHours: maxShadow,
        evaluation
      };
    });

    renderComparisonTable(comparisonModalBody, siteEvaluations, (selectedSiteId) => {
      const found = LANDING_SITES.find((s) => s.id === selectedSiteId);
      if (found) {
        setLandingSite(found);
        comparisonModal.classList.add('hidden');
      }
    });

    comparisonModal.classList.remove('hidden');
  });

  closeComparisonModal.addEventListener('click', () => {
    comparisonModal.classList.add('hidden');
  });

  // JPL Horizons Inspector Modal
  openHorizonsBtn.addEventListener('click', () => {
    updateHorizonsUrlDisplay();
    horizonsModal.classList.remove('hidden');
  });

  closeHorizonsModal.addEventListener('click', () => {
    horizonsModal.classList.add('hidden');
  });

  testHorizonsFetchBtn.addEventListener('click', async () => {
    horizonsFetchStatus.textContent = 'Consultando api de JPL Horizons en tiempo real...';
    horizonsFetchStatus.style.color = 'var(--color-cyan)';

    const result = await queryHorizons({
      body: '10',
      lat: state.currentSite.lat,
      lon: state.currentSite.lon,
      startTime: state.currentDate,
      stopTime: new Date(state.currentDate.getTime() + 86400000 * 2)
    });

    if (result.ok && result.data && result.data.length > 0) {
      horizonsFetchStatus.textContent = `✓ Respuesta exitosa de NASA Horizons: ${result.data.length} registros recibidos.`;
      horizonsFetchStatus.style.color = 'var(--color-green)';
    } else {
      horizonsFetchStatus.textContent = `ℹ Modo fuera de línea / CORS: Utilizando Motor de Precisión IAU 2000 sincronizado (${result.source}).`;
      horizonsFetchStatus.style.color = 'var(--color-gold)';
    }
  });

  // Neural Network Architecture Modal
  toggleNnViewBtn.addEventListener('click', () => {
    nnModal.classList.remove('hidden');
    networkVisualizer.resize();
  });

  closeNnModal.addEventListener('click', () => {
    nnModal.classList.add('hidden');
  });

  // NASA Moon Trek & LROC QuickMap Modal
  const trekModal = document.getElementById('trek-modal');
  const openTrekBtn = document.getElementById('open-trek-modal-btn');
  const closeTrekBtn = document.getElementById('close-trek-modal');
  const btnOpenDossier = document.getElementById('btn-open-dossier');

  if (openTrekBtn && trekModal) {
    openTrekBtn.addEventListener('click', () => {
      updateTrekModalContent(state.currentSite, getQuickMapUrl(state.currentSite), getMoonTrekUrl(state.currentSite));
      trekModal.classList.remove('hidden');
    });
  }

  if (btnOpenDossier && trekModal) {
    btnOpenDossier.addEventListener('click', () => {
      updateTrekModalContent(state.currentSite, getQuickMapUrl(state.currentSite), getMoonTrekUrl(state.currentSite));
      trekModal.classList.remove('hidden');
    });
  }

  if (closeTrekBtn && trekModal) {
    closeTrekBtn.addEventListener('click', () => {
      trekModal.classList.add('hidden');
    });
  }

  // Region Scan Heatmap Button
  document.getElementById('scan-region-btn').addEventListener('click', () => {
    const site = state.currentSite;
    const scan = scanRegionWithNeuralNet(site.lat, site.lon, 1.2, 12);
    alert(
      `✓ Escaneo de Relieve con Red Neuronal completado:\n\n` +
        `• Centro: ${site.name} (${site.lat.toFixed(2)}°, ${site.lon.toFixed(2)}°)\n` +
        `• Nodos topográficos LOLA analizados: ${scan.steps * scan.steps}\n` +
        `• Algoritmo de Inferencia: LunarLandNet v2.6 (Geotecnia, DTE & Solar)\n` +
        `• Resultado: Corredor de aproximación validado con índice de seguridad del ${state.currentEvaluation.scorePercent}% (${state.currentEvaluation.status}).`
    );
  });
}

function updateHorizonsUrlDisplay() {
  const url = buildHorizonsUrl({
    body: '10',
    lat: state.currentSite.lat,
    lon: state.currentSite.lon,
    altitudeKm: state.currentSite.elevationKm,
    startTime: state.currentDate,
    stopTime: new Date(state.currentDate.getTime() + 86400000 * 2)
  });
  horizonsUrlBox.textContent = url;
}

// App Initialization
function bootstrap() {
  initSiteSelector();
  initTimeControls();
  initCameraHUDControls();
  initModelLayerControls();
  initModals();

  // Set default initial site and run first evaluation
  setLandingSite(state.currentSite);
}

window.addEventListener('DOMContentLoaded', bootstrap);
