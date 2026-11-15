import { t } from '../i18n.js';
import {
  diskVisibleFraction,
  longestTrueRunHours
} from './geometry.js';

export const LUNAR_RADIUS_M = 1_737_400;
export const SOLAR_CONSTANT_WM2 = 1361;
export const WINDOW_DAYS = 28;
export const STEP_HOURS = 1;
export const SHADOW_THRESHOLD = 0.05;

export const CUSTOM_PROFILE_ID = 'custom';
export const CUSTOM_PROFILE_DEFAULTS = {
  energyReqKWhM2: 300,
  dMaxTolHours: 160,
  dteReqPct: 60,
  gMaxTolHours: 24,
  weights: { energy: 1, dark: 1, dte: 1, comms: 1 },
  strict: true
};

export const CUSTOM_PROFILE_RANGES = {
  energyReqKWhM2: { min: 0, max: 5000 },
  dMaxTolHours: { min: 0, max: 2000 },
  dteReqPct: { min: 0, max: 100 },
  gMaxTolHours: { min: 0, max: 2000 },
  weight: { min: 0, max: 100 }
};

export const MISSION_PROFILES = [
  {
    id: 'technology_demo',
    nameKey: 'profile.technology_demo.name',
    descriptionKey: 'profile.technology_demo.description',
    basisKey: 'profile.technology_demo.basis',
    energyReqKWhM2: 300,
    dMaxTolHours: 160,
    dteReqPct: 60,
    gMaxTolHours: 24,
    weights: { energy: 1.2, dark: 1.0, dte: 1.0, comms: 0.8 }
  },
  {
    id: 'night_survivor',
    nameKey: 'profile.night_survivor.name',
    descriptionKey: 'profile.night_survivor.description',
    basisKey: 'profile.night_survivor.basis',
    energyReqKWhM2: 400,
    dMaxTolHours: 380,
    dteReqPct: 30,
    gMaxTolHours: 48,
    weights: { energy: 1.5, dark: 1.5, dte: 0.5, comms: 0.5 }
  },
  {
    id: 'crewed_outpost',
    nameKey: 'profile.crewed_outpost.name',
    descriptionKey: 'profile.crewed_outpost.description',
    basisKey: 'profile.crewed_outpost.basis',
    energyReqKWhM2: 450,
    dMaxTolHours: 120,
    dteReqPct: 90,
    gMaxTolHours: 12,
    weights: { energy: 1.0, dark: 1.2, dte: 1.6, comms: 1.6 }
  },
  {
    id: 'relay_store_forward',
    nameKey: 'profile.relay_store_forward.name',
    descriptionKey: 'profile.relay_store_forward.description',
    basisKey: 'profile.relay_store_forward.basis',
    energyReqKWhM2: 300,
    dMaxTolHours: 200,
    dteReqPct: 20,
    gMaxTolHours: 400,
    weights: { energy: 1.2, dark: 1.0, dte: 0.6, comms: 0.4 }
  }
];

export const PROFILE_BY_ID = Object.fromEntries(MISSION_PROFILES.map((p) => [p.id, p]));
export const DEFAULT_PROFILE_ID = 'technology_demo';

function finiteOr(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampProfileValue(value, range, fallback) {
  return Math.min(range.max, Math.max(range.min, finiteOr(value, fallback)));
}

export function createCustomProfile(input = {}) {
  const weights = input.weights ?? {};
  return {
    id: CUSTOM_PROFILE_ID,
    nameKey: 'profile.custom.name',
    descriptionKey: 'profile.custom.description',
    basisKey: 'profile.custom.basis',
    energyReqKWhM2: clampProfileValue(
      input.energyReqKWhM2,
      CUSTOM_PROFILE_RANGES.energyReqKWhM2,
      CUSTOM_PROFILE_DEFAULTS.energyReqKWhM2
    ),
    dMaxTolHours: clampProfileValue(
      input.dMaxTolHours,
      CUSTOM_PROFILE_RANGES.dMaxTolHours,
      CUSTOM_PROFILE_DEFAULTS.dMaxTolHours
    ),
    dteReqPct: clampProfileValue(
      input.dteReqPct,
      CUSTOM_PROFILE_RANGES.dteReqPct,
      CUSTOM_PROFILE_DEFAULTS.dteReqPct
    ),
    gMaxTolHours: clampProfileValue(
      input.gMaxTolHours,
      CUSTOM_PROFILE_RANGES.gMaxTolHours,
      CUSTOM_PROFILE_DEFAULTS.gMaxTolHours
    ),
    weights: {
      energy: clampProfileValue(
        weights.energy,
        CUSTOM_PROFILE_RANGES.weight,
        CUSTOM_PROFILE_DEFAULTS.weights.energy
      ),
      dark: clampProfileValue(
        weights.dark,
        CUSTOM_PROFILE_RANGES.weight,
        CUSTOM_PROFILE_DEFAULTS.weights.dark
      ),
      dte: clampProfileValue(
        weights.dte,
        CUSTOM_PROFILE_RANGES.weight,
        CUSTOM_PROFILE_DEFAULTS.weights.dte
      ),
      comms: clampProfileValue(
        weights.comms,
        CUSTOM_PROFILE_RANGES.weight,
        CUSTOM_PROFILE_DEFAULTS.weights.comms
      )
    },
    strict: input.strict !== false
  };
}

export function resolveProfile(profileId, customProfile) {
  if (profileId === CUSTOM_PROFILE_ID) return createCustomProfile(customProfile);
  return PROFILE_BY_ID[profileId] ?? PROFILE_BY_ID[DEFAULT_PROFILE_ID];
}

export const PANELS = {
  horizontal: {
    id: 'horizontal',
    labelKey: 'panel.horizontal.label',
    descriptionKey: 'panel.horizontal.description',
    shortLabel: 'H'
  },
  vertical_fixed: {
    id: 'vertical_fixed',
    labelKey: 'panel.vertical_fixed.label',
    descriptionKey: 'panel.vertical_fixed.description',
    shortLabel: 'V'
  },
  vertical_tracker: {
    id: 'vertical_tracker',
    labelKey: 'panel.vertical_tracker.label',
    descriptionKey: 'panel.vertical_tracker.description',
    shortLabel: 'V+'
  }
};

export function dniWm2(sunDistanceAu) {
  if (!Number.isFinite(sunDistanceAu) || sunDistanceAu <= 0) return 0;
  return SOLAR_CONSTANT_WM2 / (sunDistanceAu * sunDistanceAu);
}

export function panelIrradianceWm2(panelType, sunAzDeg, sunElDeg, sunDistanceAu, visibleFraction, panelAzimuthDeg) {
  const dni = dniWm2(sunDistanceAu);
  const elev = (sunElDeg * Math.PI) / 180;
  const cosEl = Math.cos(elev);
  const sinEl = Math.sin(elev);
  let projection = 0;
  if (panelType === 'horizontal') {
    projection = Math.max(0, sinEl);
  } else if (panelType === 'vertical_tracker') {
    projection = Math.max(0, cosEl);
  } else {
    const delta = ((sunAzDeg - panelAzimuthDeg) * Math.PI) / 180;
    projection = Math.max(0, cosEl * Math.cos(delta));
  }
  return dni * Math.max(0, visibleFraction) * projection;
}

export function panelAzimuthFor(site, panelType) {
  if (panelType === 'vertical_fixed') return Number(site.optimalPanelAzimuthDeg) || 0;
  return 0;
}

export function makeSky(site, bodies, mastHeightM) {
  const sunHorizonDeg = site.horizonAt(bodies.sun.azDeg, mastHeightM);
  const earthHorizonDeg = site.horizonAt(bodies.earth.azDeg, mastHeightM);
  const sunVisibleFraction = diskVisibleFraction(
    bodies.sun.elDeg,
    sunHorizonDeg,
    bodies.sun.angularRadiusDeg
  );
  const earthVisibleFraction = diskVisibleFraction(
    bodies.earth.elDeg,
    earthHorizonDeg,
    bodies.earth.angularRadiusDeg
  );
  return {
    timeMs: bodies.timeMs,
    sun: bodies.sun,
    earth: bodies.earth,
    sunHorizonDeg,
    earthHorizonDeg,
    sunVisibleFraction,
    earthVisibleFraction,
    sunlit: sunVisibleFraction >= SHADOW_THRESHOLD,
    dteCenter: bodies.earth.elDeg > earthHorizonDeg,
    dtePartial: earthVisibleFraction > 0
  };
}

export function scoreComponents(metrics, profile) {
  const energyReq = Number(profile.energyReqKWhM2);
  const dMaxTol = Number(profile.dMaxTolHours);
  const dteReq = Number(profile.dteReqPct);
  const gMaxTol = Number(profile.gMaxTolHours);
  const energy = energyReq > 0 ? Math.min(metrics.energyWhM2 / (energyReq * 1000), 1) : 1;
  const dark =
    dMaxTol > 0
      ? Math.max(0, Math.min(1, 1 - metrics.dMaxHours / dMaxTol))
      : metrics.dMaxHours <= 0
        ? 1
        : 0;
  const dte = dteReq > 0 ? Math.min(metrics.dteCenterPct / dteReq, 1) : 1;
  const comms =
    gMaxTol > 0
      ? Math.max(0, Math.min(1, 1 - metrics.gMaxHours / gMaxTol))
      : metrics.gMaxHours <= 0
        ? 1
        : 0;
  const weights = profile.weights ?? CUSTOM_PROFILE_DEFAULTS.weights;
  const weightSum =
    weights.energy + weights.dark + weights.dte + weights.comms;
  const safeWeightSum = weightSum > 0 ? weightSum : 1;
  const total =
    (100 *
      (weights.energy * energy +
        weights.dark * dark +
        weights.dte * dte +
        weights.comms * comms)) /
    safeWeightSum;
  return { energy, dark, dte, comms, total };
}

export function buildStatus(site, metrics, components, profile) {
  const limits = [];
  const slope = Number(site.slopeDeg ?? site.maxSlopeDeg ?? 0);
  if (metrics.dMaxHours > profile.dMaxTolHours) {
    limits.push(
      t("limit.eclipse", {
        hours: metrics.dMaxHours.toFixed(1),
        tol: profile.dMaxTolHours
      })
    );
  }
  if (metrics.dteCenterPct < profile.dteReqPct) {
    limits.push(
      t("limit.dte", {
        pct: metrics.dteCenterPct.toFixed(0),
        req: profile.dteReqPct
      })
    );
  }
  if (metrics.gMaxHours > profile.gMaxTolHours) {
    limits.push(
      t("limit.outage", {
        hours: metrics.gMaxHours.toFixed(1),
        tol: profile.gMaxTolHours
      })
    );
  }
  if (site.role !== "reference" && slope > 15) {
    limits.push(t("limit.slope", { slope: slope.toFixed(1) }));
  }

  if (site.role === "reference") {
    return {
      status: t("status.reference"),
      badgeClass: "status-reference",
      statusText: t("status.referenceText")
    };
  }
  if (site.role === "international") {
    return {
      status: t("status.reference"),
      badgeClass: "status-reference",
      statusText: t("status.internationalText")
    };
  }
  if (site.role === "custom") {
    return {
      status: t("status.estimate"),
      badgeClass: "status-warning",
      statusText: t("status.customText")
    };
  }
  if (slope > 25) {
    return {
      status: t("status.noGo"),
      badgeClass: "status-danger",
      statusText: t("status.slopeDanger", { slope: slope.toFixed(1) })
    };
  }

  if (profile.id === CUSTOM_PROFILE_ID) {
    if (limits.length === 0) {
      return {
        status: t("status.go"),
        badgeClass: "status-safe",
        statusText: t("status.goText")
      };
    }
    if (profile.strict) {
      return {
        status: t("status.noGo"),
        badgeClass: "status-danger",
        statusText: t("status.noGoLimits", { limits: limits.join("; ") })
      };
    }
    if (components.total >= 50) {
      return {
        status: t("status.caution"),
        badgeClass: "status-warning",
        statusText: t("status.cautionLimits", { limits: limits.join("; ") })
      };
    }
    return {
      status: t("status.noGo"),
      badgeClass: "status-danger",
      statusText: t("status.noGoLimits", { limits: limits.join("; ") })
    };
  }

  const severe =
    metrics.gMaxHours > profile.gMaxTolHours * 2 ||
    metrics.dMaxHours > profile.dMaxTolHours * 1.5 ||
    metrics.dteCenterPct < profile.dteReqPct * 0.5;
  if (severe) {
    return {
      status: t("status.noGo"),
      badgeClass: "status-danger",
      statusText: t("status.severe", { limits: limits.join("; ") })
    };
  }

  if (components.total >= 75 && limits.length === 0) {
    return {
      status: t("status.go"),
      badgeClass: "status-safe",
      statusText: t("status.goText")
    };
  }
  if (components.total >= 50) {
    return {
      status: t("status.caution"),
      badgeClass: "status-warning",
      statusText: limits.length
        ? t("status.cautionLimits", { limits: limits.join("; ") })
        : t("status.cautionGeneric")
    };
  }
  return {
    status: t("status.noGo"),
    badgeClass: "status-danger",
    statusText: limits.length
      ? t("status.noGoLimits", { limits: limits.join("; ") })
      : t("status.noGoGeneric")
  };
}

export function analyzeSite({
  site,
  startMs,
  mastHeightM,
  panelType,
  profileId,
  profile: profileOverride,
  sampleAt,
  stepHours = STEP_HOURS,
  windowDays = WINDOW_DAYS
}) {
  const profile = profileOverride ?? resolveProfile(profileId);
  const panelAzimuthDeg = panelAzimuthFor(site, panelType);
  const sampleCount = Math.round((windowDays * 24) / stepHours);
  const stepMs = stepHours * 3_600_000;
  const series = [];
  let illuminationSum = 0;
  let sunlitCount = 0;
  let fullDarkCount = 0;
  let energyWhM2 = 0;
  let centerCount = 0;
  let partialCount = 0;

  for (let i = 0; i < sampleCount; i += 1) {
    const timeMs = startMs + i * stepMs;
    const bodies = sampleAt(timeMs);
    if (!bodies) {
      throw new Error(
        t('error.noEphemeris', {
          time: new Date(timeMs).toISOString(),
          site: site.id
        })
      );
    }
    const sky = makeSky(site, bodies, mastHeightM);
    const energyWm2 = panelIrradianceWm2(
      panelType,
      sky.sun.azDeg,
      sky.sun.elDeg,
      sky.sun.distance,
      sky.sunVisibleFraction,
      panelAzimuthDeg
    );
    illuminationSum += sky.sunVisibleFraction;
    if (sky.sunlit) sunlitCount += 1;
    if (sky.sunVisibleFraction <= 1e-6) fullDarkCount += 1;
    if (sky.dteCenter) centerCount += 1;
    if (sky.dtePartial) partialCount += 1;
    energyWhM2 += energyWm2 * stepHours;
    series.push({
      timeMs,
      time: new Date(timeMs),
      sunAz: sky.sun.azDeg,
      sunEl: sky.sun.elDeg,
      earthAz: sky.earth.azDeg,
      earthEl: sky.earth.elDeg,
      sunHorizon: sky.sunHorizonDeg,
      earthHorizon: sky.earthHorizonDeg,
      sunVisibleFraction: sky.sunVisibleFraction,
      earthVisibleFraction: sky.earthVisibleFraction,
      sunlit: sky.sunlit,
      dteCenter: sky.dteCenter,
      dtePartial: sky.dtePartial,
      sunDistance: sky.sun.distance,
      earthDistance: sky.earth.distance,
      energyWm2,
      powerEff: sky.sunVisibleFraction * Math.max(0, Math.sin((sky.sun.elDeg * Math.PI) / 180))
    });
  }

  let dMaxHours = 0;
  let currentShadow = 0;
  for (const point of series) {
    if (point.sunlit) {
      currentShadow = 0;
    } else {
      currentShadow += stepHours;
      if (currentShadow > dMaxHours) dMaxHours = currentShadow;
    }
  }
  let gMaxHours = 0;
  let currentOutage = 0;
  for (const point of series) {
    if (point.dteCenter) {
      currentOutage = 0;
    } else {
      currentOutage += stepHours;
      if (currentOutage > gMaxHours) gMaxHours = currentOutage;
    }
  }

  const metrics = {
    windowDays: (sampleCount * stepHours) / 24,
    stepHours,
    sampleCount,
    illuminationPct: (100 * illuminationSum) / sampleCount,
    sunlitPct: (100 * sunlitCount) / sampleCount,
    energyWhM2,
    dteCenterPct: (100 * centerCount) / sampleCount,
    dtePartialPct: (100 * partialCount) / sampleCount,
    dMaxHours,
    gMaxHours,
    fullDarkPct: (100 * fullDarkCount) / sampleCount
  };
  const components = scoreComponents(metrics, profile);
  const status = buildStatus(site, metrics, components, profile);

  return {
    site,
    startMs,
    profile,
    panelType,
    panelAzimuthDeg,
    mastHeightM,
    series,
    metrics,
    components,
    scorePercent: Math.round(components.total),
    ...status
  };
}

function stateAt(site, timeMs, mastHeightM, sampleAt) {
  const bodies = sampleAt(timeMs);
  if (!bodies) return null;
  return makeSky(site, bodies, mastHeightM);
}

function refineCrossing(site, fromMs, toMs, mastHeightM, sampleAt, selector) {
  let lo = fromMs;
  let hi = toMs;
  const loState = selector(stateAt(site, lo, mastHeightM, sampleAt));
  for (let i = 0; i < 8; i += 1) {
    const mid = (lo + hi) / 2;
    const state = selector(stateAt(site, mid, mastHeightM, sampleAt));
    if (state === loState) lo = mid;
    else hi = mid;
  }
  return hi;
}

export function findNextEvents(series, fromMs, site, mastHeightM, sampleAt) {
  if (!series.length) return { sunIsUp: false, earthIsUp: false, nextSunrise: null, nextSunset: null, nextEarthrise: null, nextEarthset: null };
  const stepMs = series.length > 1 ? series[1].timeMs - series[0].timeMs : 3_600_000;
  let index = Math.floor((fromMs - series[0].timeMs) / stepMs);
  index = Math.max(0, Math.min(series.length - 1, index));
  const start = series[index];
  const sunIsUp = start.sunlit;
  const earthIsUp = start.dteCenter;
  let prevSun = sunIsUp;
  let prevEarth = earthIsUp;
  let nextSunrise = null;
  let nextSunset = null;
  let nextEarthrise = null;
  let nextEarthset = null;

  for (let i = index + 1; i < series.length; i += 1) {
    const point = series[i];
    if (point.sunlit !== prevSun) {
      const crossing = refineCrossing(
        site,
        series[i - 1].timeMs,
        point.timeMs,
        mastHeightM,
        sampleAt,
        (sky) => (sky ? sky.sunlit : prevSun)
      );
      if (point.sunlit && !nextSunrise) nextSunrise = { date: new Date(crossing), msRemaining: crossing - fromMs };
      if (!point.sunlit && !nextSunset) nextSunset = { date: new Date(crossing), msRemaining: crossing - fromMs };
      prevSun = point.sunlit;
    }
    if (point.dteCenter !== prevEarth) {
      const crossing = refineCrossing(
        site,
        series[i - 1].timeMs,
        point.timeMs,
        mastHeightM,
        sampleAt,
        (sky) => (sky ? sky.dteCenter : prevEarth)
      );
      if (point.dteCenter && !nextEarthrise) nextEarthrise = { date: new Date(crossing), msRemaining: crossing - fromMs };
      if (!point.dteCenter && !nextEarthset) nextEarthset = { date: new Date(crossing), msRemaining: crossing - fromMs };
      prevEarth = point.dteCenter;
    }
    if (nextSunrise && nextSunset && nextEarthrise && nextEarthset) break;
  }

  return { sunIsUp, earthIsUp, nextSunrise, nextSunset, nextEarthrise, nextEarthset };
}
