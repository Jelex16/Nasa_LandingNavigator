/**
 * NASA JPL Horizons REST API client and fallback orchestrator.
 * Endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
 *
 * For a lunar surface observer:
 *   COMMAND='10' (Sun) or '399' (Earth)
 *   CENTER='coord@301' (Observer on Moon)
 *   SITE_COORD='{lon},{lat},{height_km}'
 *   COORD_TYPE='CYLINDRICAL' or 'GEODETIC'
 *   QUANTITIES='4' (Apparent Azimuth and Elevation)
 */

export function buildHorizonsUrl({
  body = '10', // 10 = Sun, 399 = Earth
  lat = -89.5,
  lon = 0,
  altitudeKm = 0,
  startTime = new Date(),
  stopTime = new Date(Date.now() + 86400000 * 2),
  step = '1h'
}) {
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) =>
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

  const base = 'https://ssd.jpl.nasa.gov/api/horizons.api';
  const params = new URLSearchParams({
    format: 'json',
    COMMAND: `'${body}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${lon.toFixed(4)},${lat.toFixed(4)},${altitudeKm.toFixed(2)}'`,
    START_TIME: `'${fmt(startTime)}'`,
    STOP_TIME: `'${fmt(stopTime)}'`,
    STEP_SIZE: `'${step}'`,
    QUANTITIES: "'4'" // Azimuth and Elevation
  });

  return `${base}?${params.toString()}`;
}

/**
 * Parses JPL Horizons observer output table between $$SOE and $$EOE markers.
 */
export function parseHorizonsResponse(resultText) {
  const startIdx = resultText.indexOf('$$SOE');
  const endIdx = resultText.indexOf('$$EOE');
  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const table = resultText.substring(startIdx + 5, endIdx).trim();
  const lines = table.split('\n').map((l) => l.trim()).filter(Boolean);
  const records = [];

  for (const line of lines) {
    // Example: "2026-Nov-14 00:00 *m  126.6432   1.2572"
    // or space-separated tokens
    const tokens = line.split(/\s+/);
    if (tokens.length >= 4) {
      const dateStr = tokens[0] + ' ' + tokens[1];
      const az = parseFloat(tokens[tokens.length - 2]);
      const el = parseFloat(tokens[tokens.length - 1]);
      if (!isNaN(az) && !isNaN(el)) {
        records.push({
          dateStr,
          azimuth: az,
          elevation: el
        });
      }
    }
  }
  return records;
}

/**
 * Attempts to fetch live ephemeris from NASA JPL Horizons.
 * Returns { ok, data, raw, url, error, source }
 */
export async function queryHorizons({
  body = '10',
  lat = -89.5,
  lon = 0,
  altitudeKm = 0,
  startTime = new Date(),
  stopTime = new Date(Date.now() + 86400000 * 2),
  step = '2h'
}) {
  const url = buildHorizonsUrl({ body, lat, lon, altitudeKm, startTime, stopTime, step });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }

    const json = await resp.json();
    const parsed = json.result ? parseHorizonsResponse(json.result) : null;

    return {
      ok: true,
      data: parsed,
      raw: json.result || '',
      url,
      source: 'NASA JPL Horizons Live API'
    };
  } catch (err) {
    return {
      ok: false,
      data: null,
      raw: null,
      url,
      error: err.message,
      source: 'IAU 2000 Ephemeris Engine (Synchronized Fallback)'
    };
  }
}
