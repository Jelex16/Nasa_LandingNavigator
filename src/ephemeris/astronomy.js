import { GeoVector, Body, Libration } from 'astronomy-engine';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function jd(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function sin(x) { return Math.sin(x); }
function cos(x) { return Math.cos(x); }

/**
 * IAU 2000 / SOFA lunar orientation model.
 * Computes the selenographic orientation of the Moon (pole RA/Dec and prime meridian angle W)
 * including 13 major nutation and physical libration terms.
 */
export function moonOrientation(date) {
  const d = jd(date) - 2451545.0;
  const T = d / 36525;
  const E1 = (125.045 - 0.0529921 * d) * D2R;
  const E2 = (250.089 - 0.1059842 * d) * D2R;
  const E3 = (260.008 + 13.0120009 * d) * D2R;
  const E4 = (176.625 + 13.3407154 * d) * D2R;
  const E5 = (357.529 + 0.9856003 * d) * D2R;
  const E6 = (311.589 + 26.4057084 * d) * D2R;
  const E7 = (134.963 + 13.064993 * d) * D2R;
  const E8 = (276.617 + 0.3287146 * d) * D2R;
  const E9 = (34.226 + 1.7484877 * d) * D2R;
  const E10 = (15.134 - 0.1589763 * d) * D2R;
  const E11 = (119.743 + 0.0036096 * d) * D2R;
  const E12 = (239.961 + 0.1643573 * d) * D2R;
  const E13 = (25.053 + 12.9590088 * d) * D2R;

  const alpha = (269.9949 + 0.0031 * T
    - 3.8787 * sin(E1) - 0.1204 * sin(E2) + 0.07 * sin(E3)
    - 0.0172 * sin(E4) + 0.0072 * sin(E6) - 0.0052 * sin(E10)
    + 0.0043 * sin(E13)) * D2R;

  const delta = (66.5392 + 0.013 * T
    + 1.5419 * cos(E1) + 0.0239 * cos(E2) - 0.0278 * cos(E3)
    + 0.0068 * cos(E4) - 0.0029 * cos(E6) + 0.0009 * cos(E7)
    + 0.0008 * cos(E10) - 0.0009 * cos(E13)) * D2R;

  const W = (38.3213 + 13.17635815 * d - 1.4e-12 * d * d
    + 3.561 * sin(E1) + 0.1208 * sin(E2) - 0.0642 * sin(E3)
    + 0.0158 * sin(E4) + 0.0252 * sin(E5) - 0.0066 * sin(E6)
    - 0.0047 * sin(E7) - 0.0046 * sin(E8) + 0.0028 * sin(E9)
    + 0.0052 * sin(E10) + 0.004 * sin(E11) + 0.0019 * sin(E12)
    - 0.0044 * sin(E13)) * D2R;

  return { alpha, delta, W };
}

function Rz(th) {
  const c = cos(th), s = sin(th);
  return [[c, s, 0], [-s, c, 0], [0, 0, 1]];
}

function Rx(th) {
  const c = cos(th), s = sin(th);
  return [[1, 0, 0], [0, c, s], [0, -s, c]];
}

function mul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      C[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
    }
  }
  return C;
}

function apply(M, v) {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

function norm(a) {
  const n = Math.hypot(a[0], a[1], a[2]);
  if (n === 0) return [0, 0, 0];
  return [a[0] / n, a[1] / n, a[2] / n];
}

export function bodyMatrix(date) {
  const { alpha, delta, W } = moonOrientation(date);
  return mul(Rz(W), mul(Rx(Math.PI / 2 - delta), Rz(Math.PI / 2 + alpha)));
}

/**
 * Calculates topocentric positions of Sun and Earth for a lunar observer at (lat, lon).
 * Returns azimuth (0-360, where 0=North, 90=East) and elevation in degrees.
 */
export function calculateLunarEphemeris(date, lat, lon) {
  const R = bodyMatrix(date);
  const sunG = GeoVector(Body.Sun, date, false);
  const moonG = GeoVector(Body.Moon, date, false);
  const AU = 149597870.7; // km
  const RM = 1737.4; // lunar mean radius in km

  const moonKm = [moonG.x * AU, moonG.y * AU, moonG.z * AU];
  const sunKm = [sunG.x * AU, sunG.y * AU, sunG.z * AU];

  const phi = lat * D2R;
  const lam = lon * D2R;
  const up = [cos(phi) * cos(lam), cos(phi) * sin(lam), sin(phi)];
  const site = [up[0] * RM, up[1] * RM, up[2] * RM];

  // Moon-centric J2000 to Selenographic (MCMF)
  const sunC = apply(R, [sunKm[0] - moonKm[0], sunKm[1] - moonKm[1], sunKm[2] - moonKm[2]]);
  const earthC = apply(R, [-moonKm[0], -moonKm[1], -moonKm[2]]);

  // Site topocentric vectors
  const sun = [sunC[0] - site[0], sunC[1] - site[1], sunC[2] - site[2]];
  const earth = [earthC[0] - site[0], earthC[1] - site[1], earthC[2] - site[2]];

  // Local horizon coordinate frame
  const pole = [0, 0, 1];
  let east = cross(pole, up);
  if (Math.hypot(east[0], east[1], east[2]) < 1e-6) {
    // Exactly at pole
    east = [0, 1, 0];
  } else {
    east = norm(east);
  }
  const north = norm(cross(up, east));

  function toAzEl(v) {
    const u = norm(v);
    const el = Math.asin(Math.max(-1, Math.min(1, dot(u, up)))) * R2D;
    const az = Math.atan2(dot(u, east), dot(u, north)) * R2D;
    return {
      az: (az + 360) % 360,
      el,
      distanceKm: Math.hypot(v[0], v[1], v[2])
    };
  }

  const sunAzEl = toAzEl(sun);
  const earthAzEl = toAzEl(earth);

  // Sub-Earth and Sub-Solar selenographic coordinates (libration)
  const eu = norm(earthC);
  const su = norm(sunC);
  const subEarth = {
    lat: Math.asin(eu[2]) * R2D,
    lon: Math.atan2(eu[1], eu[0]) * R2D
  };
  const subSun = {
    lat: Math.asin(su[2]) * R2D,
    lon: Math.atan2(su[1], su[0]) * R2D
  };

  // 3D unit vectors in lunar Moon-Centered coordinate system (for Three.js)
  const sunDirMCMF = norm(sunC);
  const earthDirMCMF = norm(earthC);

  // Solar power potential factor: P = sin(elevation) if elevation > 0 else 0
  const solarPowerEfficiency = sunAzEl.el > 0 ? Math.sin(sunAzEl.el * D2R) : 0;

  return {
    date: new Date(date),
    sun: sunAzEl,
    earth: earthAzEl,
    subEarth,
    subSun,
    sunDirMCMF,
    earthDirMCMF,
    siteUp: up,
    solarPowerEfficiency
  };
}

/**
 * Calculates ephemeris time series across a time span (e.g. 7, 14, or 30 days)
 * at stepHours resolution.
 */
export function calculateEphemerisSeries(startDate, lat, lon, durationDays = 30, stepHours = 2) {
  const points = [];
  const startMs = startDate.getTime();
  const totalSteps = Math.floor((durationDays * 24) / stepHours);

  for (let i = 0; i <= totalSteps; i++) {
    const curDate = new Date(startMs + i * stepHours * 3600000);
    const eph = calculateLunarEphemeris(curDate, lat, lon);
    points.push({
      time: curDate,
      timeMs: curDate.getTime(),
      hoursFromStart: i * stepHours,
      sunEl: eph.sun.el,
      sunAz: eph.sun.az,
      earthEl: eph.earth.el,
      earthAz: eph.earth.az,
      subEarthLat: eph.subEarth.lat,
      subEarthLon: eph.subEarth.lon,
      powerEff: eph.solarPowerEfficiency
    });
  }
  return points;
}

/**
 * Calculates event countdowns: time until next sunset, next sunrise, next earthset, next earthrise,
 * taking into account local topographic horizon.
 */
export function calculateEventCountdowns(currentDate, lat, lon, getHorizonElevationFn) {
  const stepMinutes = 30;
  const maxSearchSteps = (45 * 24 * 60) / stepMinutes; // search up to 45 days
  const nowMs = currentDate.getTime();

  const curEph = calculateLunarEphemeris(currentDate, lat, lon);
  const curSunHorizon = getHorizonElevationFn ? getHorizonElevationFn(curEph.sun.az) : 0;
  const curEarthHorizon = getHorizonElevationFn ? getHorizonElevationFn(curEph.earth.az) : 0;

  const sunIsUp = curEph.sun.el > curSunHorizon;
  const earthIsUp = curEph.earth.el > curEarthHorizon;

  let nextSunset = null;
  let nextSunrise = null;
  let nextEarthset = null;
  let nextEarthrise = null;

  let prevSunUp = sunIsUp;
  let prevEarthUp = earthIsUp;

  for (let step = 1; step <= maxSearchSteps; step++) {
    const d = new Date(nowMs + step * stepMinutes * 60000);
    const eph = calculateLunarEphemeris(d, lat, lon);
    const sunHoriz = getHorizonElevationFn ? getHorizonElevationFn(eph.sun.az) : 0;
    const earthHoriz = getHorizonElevationFn ? getHorizonElevationFn(eph.earth.az) : 0;

    const sunUp = eph.sun.el > sunHoriz;
    const earthUp = eph.earth.el > earthHoriz;

    if (prevSunUp && !sunUp && !nextSunset) {
      nextSunset = { date: d, msRemaining: d.getTime() - nowMs };
    }
    if (!prevSunUp && sunUp && !nextSunrise) {
      nextSunrise = { date: d, msRemaining: d.getTime() - nowMs };
    }
    if (prevEarthUp && !earthUp && !nextEarthset) {
      nextEarthset = { date: d, msRemaining: d.getTime() - nowMs };
    }
    if (!prevEarthUp && earthUp && !nextEarthrise) {
      nextEarthrise = { date: d, msRemaining: d.getTime() - nowMs };
    }

    prevSunUp = sunUp;
    prevEarthUp = earthUp;

    if (nextSunset && nextSunrise && (nextEarthset || !earthIsUp) && (nextEarthrise || earthIsUp)) {
      break;
    }
  }

  return {
    sunIsUp,
    earthIsUp,
    nextSunset,
    nextSunrise,
    nextEarthset,
    nextEarthrise
  };
}
