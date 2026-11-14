import { angularRadiusDeg, normalizeAzimuthDeg } from '../analysis/geometry.js';

const MAGIC = 'SUNEPH01';
const SCHEMA_VERSION = 1;
const HEADER_BYTES_WITHOUT_SITE = 34;
export const AU_KM = 149_597_870.7;
export const SUN_RADIUS_KM = 695_700;
export const EARTH_RADIUS_KM = 6_371;

const ephemCache = new Map();

/** Decodes the compact SUNDIAL/JPL Horizons binary ephemeris. */
export function decodeEphemeris(buffer) {
  if (buffer.byteLength < HEADER_BYTES_WITHOUT_SITE) {
    throw new Error('Ephemeris buffer is truncated');
  }
  const view = new DataView(buffer);
  const magic = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, 8));
  if (magic !== MAGIC) throw new Error(`Invalid ephemeris magic: ${magic}`);
  const version = view.getUint32(8, true);
  if (version !== SCHEMA_VERSION) throw new Error(`Unsupported ephemeris schema ${version}`);
  const count = view.getUint32(12, true);
  const startUtcMs = view.getFloat64(16, true);
  const stepHours = view.getFloat64(24, true);
  const siteIdLength = view.getUint16(32, true);
  const siteId = new TextDecoder('utf-8').decode(new Uint8Array(buffer, 34, siteIdLength));
  const payloadStart = HEADER_BYTES_WITHOUT_SITE + siteIdLength;
  const expected = payloadStart + count * 6 * 4;
  if (buffer.byteLength < expected) {
    throw new Error(`Ephemeris payload truncated: ${buffer.byteLength} < ${expected}`);
  }
  const read = (index) => {
    const offset = payloadStart + index * count * 4;
    return new Float32Array(buffer.slice(offset, offset + count * 4));
  };
  return {
    siteId,
    startUtcMs,
    stepHours,
    count,
    sunAzDeg: read(0),
    sunElDeg: read(1),
    sunDistanceAu: read(2),
    earthAzDeg: read(3),
    earthElDeg: read(4),
    earthDistanceKm: read(5)
  };
}

export function ephemerisEndUtcMs(series) {
  return series.startUtcMs + (series.count - 1) * series.stepHours * 3_600_000;
}

export function ephemerisIndexAt(series, timeMs) {
  const raw = (timeMs - series.startUtcMs) / (series.stepHours * 3_600_000);
  if (raw < 0 || raw > series.count - 1) return null;
  return raw;
}

function cubicHermite(p0, p1, m0, m1, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * p1 +
    (t3 - t2) * m1
  );
}

function sampleAtIndices(values, k, t) {
  const n = values.length;
  if (n === 1) return values[0];
  const k1 = Math.max(0, Math.min(n - 1, k));
  const kPrev = Math.max(0, k1 - 1);
  const kNext = Math.min(n - 1, k1 + 1);
  const p0 = values[k1];
  const p1 = values[Math.min(n - 1, k1 + 1)];
  const m0 = (values[kNext] - values[kPrev]) / Math.max(1, kNext - kPrev);
  const mPrev = k1;
  const mNext = Math.min(n - 1, k1 + 2);
  const m1 = (values[mNext] - values[mPrev]) / Math.max(1, mNext - mPrev);
  return cubicHermite(p0, p1, m0, m1, t);
}

const trigCache = new WeakMap();

function trigValues(values) {
  let entry = trigCache.get(values);
  if (!entry) {
    const sin = new Float64Array(values.length);
    const cos = new Float64Array(values.length);
    for (let i = 0; i < values.length; i += 1) {
      const radians = (values[i] * Math.PI) / 180;
      sin[i] = Math.sin(radians);
      cos[i] = Math.cos(radians);
    }
    entry = { sin, cos };
    trigCache.set(values, entry);
  }
  return entry;
}

function azimuthFromTrig(trig, k, t) {
  const s = sampleAtIndices(trig.sin, k, t);
  const c = sampleAtIndices(trig.cos, k, t);
  return normalizeAzimuthDeg((Math.atan2(s, c) * 180) / Math.PI);
}

/**
 * Cubic Hermite interpolation of the hourly Horizons samples at any instant.
 * Azimuths are interpolated through (sin Az, cos Az) to avoid the 360 -> 0
 * discontinuity. Returns null outside the precomputed coverage.
 */
export function sampleEphemeris(series, timeMs) {
  const raw = ephemerisIndexAt(series, timeMs);
  if (raw === null) return null;
  const k = Math.max(0, Math.min(series.count - 2, Math.floor(raw)));
  const t = series.count === 1 ? 0 : Math.min(1, raw - k);
  const sunTrig = trigValues(series.sunAzDeg);
  const earthTrig = trigValues(series.earthAzDeg);

  const sunAz = azimuthFromTrig(sunTrig, k, t);
  const sunEl = sampleAtIndices(series.sunElDeg, k, t);
  const sunDistAu = sampleAtIndices(series.sunDistanceAu, k, t);
  const earthAz = azimuthFromTrig(earthTrig, k, t);
  const earthEl = sampleAtIndices(series.earthElDeg, k, t);
  const earthDistKm = sampleAtIndices(series.earthDistanceKm, k, t);

  return {
    timeMs,
    sun: {
      azDeg: normalizeAzimuthDeg(sunAz),
      elDeg: sunEl,
      distance: sunDistAu,
      angularRadiusDeg: angularRadiusDeg(SUN_RADIUS_KM, sunDistAu * AU_KM)
    },
    earth: {
      azDeg: normalizeAzimuthDeg(earthAz),
      elDeg: earthEl,
      distance: earthDistKm,
      angularRadiusDeg: angularRadiusDeg(EARTH_RADIUS_KM, earthDistKm)
    }
  };
}

export async function loadEphemeris(siteId) {
  if (ephemCache.has(siteId)) return ephemCache.get(siteId);
  const promise = (async () => {
    const url = `${import.meta.env.BASE_URL}data/ephem/${siteId}.bin`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ephemeris ${siteId}: HTTP ${response.status}`);
    return decodeEphemeris(await response.arrayBuffer());
  })();
  ephemCache.set(siteId, promise);
  try {
    return await promise;
  } catch (error) {
    ephemCache.delete(siteId);
    throw error;
  }
}

export function hasEphemeris(siteId) {
  return ephemCache.has(siteId);
}
