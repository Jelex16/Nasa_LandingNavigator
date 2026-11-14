export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function normalizeAzimuthDeg(azDeg) {
  const wrapped = azDeg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

export function angularRadiusDeg(radiusKm, distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= radiusKm) return 90;
  return Math.asin(radiusKm / distanceKm) * RAD_TO_DEG;
}

/**
 * Fraction of a finite disk above a locally horizontal horizon segment.
 * rho is the angular radius of the body; x is the normalized distance from
 * the disk centre to the horizon.
 */
export function diskVisibleFraction(centerElDeg, horizonElDeg, angularRadius) {
  const rho = Math.max(angularRadius, 1e-9);
  const x = clamp((horizonElDeg - centerElDeg) / rho, -1, 1);
  if (x <= -1) return 1;
  if (x >= 1) return 0;
  return (Math.acos(x) - x * Math.sqrt(1 - x * x)) / Math.PI;
}

export function localUnitVectors(latDeg, lonEastDeg) {
  const lat = latDeg * DEG_TO_RAD;
  const lon = lonEastDeg * DEG_TO_RAD;
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosLon = Math.cos(lon);
  const sinLon = Math.sin(lon);
  return {
    up: [cosLat * cosLon, cosLat * sinLon, sinLat],
    east: [-sinLon, cosLon, 0],
    north: [-sinLat * cosLon, -sinLat * sinLon, cosLat]
  };
}

export function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function azElFromVector(direction, latDeg, lonEastDeg) {
  const { up, east, north } = localUnitVectors(latDeg, lonEastDeg);
  const e = dot(direction, east);
  const n = dot(direction, north);
  const u = dot(direction, up);
  return {
    azDeg: normalizeAzimuthDeg(Math.atan2(e, n) * RAD_TO_DEG),
    elDeg: Math.asin(clamp(u, -1, 1)) * RAD_TO_DEG
  };
}

/**
 * Converts a topocentric az/el direction into the Moon-centered,
 * Moon-fixed (MCMF) frame used by the Three.js scene.
 */
export function azElToMcmf(latDeg, lonEastDeg, azDeg, elDeg) {
  const { up, east, north } = localUnitVectors(latDeg, lonEastDeg);
  const az = azDeg * DEG_TO_RAD;
  const el = elDeg * DEG_TO_RAD;
  const c = Math.cos(el);
  const s = Math.sin(el);
  const e = c * Math.sin(az);
  const n = c * Math.cos(az);
  return [
    e * east[0] + n * north[0] + s * up[0],
    e * east[1] + n * north[1] + s * up[1],
    e * east[2] + n * north[2] + s * up[2]
  ];
}

export function longestTrueRunHours(flags, stepHours) {
  let longest = 0;
  let current = 0;
  for (let i = 0; i < flags.length; i += 1) {
    if (flags[i]) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest * stepHours;
}

export function sphericalSeparationDeg(az1Deg, el1Deg, az2Deg, el2Deg) {
  const a1 = az1Deg * DEG_TO_RAD;
  const e1 = el1Deg * DEG_TO_RAD;
  const a2 = az2Deg * DEG_TO_RAD;
  const e2 = el2Deg * DEG_TO_RAD;
  const cosSep =
    Math.sin(e1) * Math.sin(e2) + Math.cos(e1) * Math.cos(e2) * Math.cos(a1 - a2);
  return Math.acos(clamp(cosSep, -1, 1)) * RAD_TO_DEG;
}
