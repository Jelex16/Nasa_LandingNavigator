import { analyzeSite } from './scoring.js';
import { sampleEphemeris, AU_KM, SUN_RADIUS_KM, EARTH_RADIUS_KM } from '../ephemeris/jplEphemeris.js';
import { calculateLunarEphemeris } from '../ephemeris/astronomy.js';
import { angularRadiusDeg } from './geometry.js';

export function localSample(site, timeMs) {
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

export function sampleSite(site, timeMs) {
  if (site.ephem) {
    const sample = sampleEphemeris(site.ephem, timeMs);
    if (sample) return sample;
  }
  return localSample(site, timeMs);
}

export function evaluateSiteScenario({
  site,
  startMs,
  mastHeightM,
  panelType,
  profileId,
  profile,
  stepHours,
  windowDays
}) {
  return analyzeSite({
    site,
    startMs,
    mastHeightM,
    panelType,
    profileId,
    profile,
    stepHours,
    windowDays,
    sampleAt: (ms) => sampleSite(site, ms)
  });
}
