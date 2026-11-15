
import { t } from '../i18n.js';

export let LANDING_SITES = [];

const REFERENCE_EPHEM_IDS = new Set([
  'site01',
  'site04',
  'site07',
  'site11',
  'site20',
  'site23',
  'control_eq'
]);

const SITE_UI = {
  site23: {
    displayName: 'Malapert Massif',
    shortName: 'Malapert',
    programKey: 'program.artemis3',
    targetMission: 'Malapert Massif candidate region',
    descriptionKey: 'description.site23'
  },
  site01: {
    displayName: 'Connecting Ridge',
    shortName: 'Connecting Ridge',
    programKey: 'program.artemis3',
    targetMission: 'Connecting Ridge candidate region',
    descriptionKey: 'description.site01'
  },
  site04: {
    displayName: 'Shackleton Rim (LOLA)',
    shortName: 'Shackleton',
    programKey: 'program.nonOfficial',
    targetMission: 'Shackleton rim analysis point (LOLA)',
    descriptionKey: 'description.site04'
  },
  site07: {
    displayName: 'Peak near Shackleton',
    shortName: 'Peak Shackleton',
    programKey: 'program.artemis3',
    targetMission: 'Peak near Shackleton candidate region',
    descriptionKey: 'description.site07'
  },
  site11: {
    displayName: 'de Gerlache Rim',
    shortName: 'de Gerlache',
    programKey: 'program.artemis3',
    targetMission: 'de Gerlache Rim candidate region',
    descriptionKey: 'description.site11'
  },
  site20: {
    displayName: 'Mons Mouton (Leibnitz Beta)',
    shortName: 'Mons Mouton',
    programKey: 'program.artemis3',
    targetMission: 'Mons Mouton / Leibnitz Beta candidate region',
    descriptionKey: 'description.site20'
  },
  nobile_rim_1: {
    displayName: 'Nobile Rim 1',
    shortName: 'Nobile',
    programKey: 'program.artemis3',
    targetMission: 'Nobile Rim 1 candidate region',
    descriptionKey: 'description.nobile_rim_1'
  },
  haworth_rim: {
    displayName: 'Haworth (interior)',
    shortName: 'Haworth',
    programKey: 'program.haworthReference',
    targetMission: 'Haworth interior reference point',
    descriptionKey: 'description.haworth_rim'
  },
  control_eq: {
    displayName: 'Apollo 11 (Mare Tranquillitatis)',
    shortName: 'Apollo 11',
    programKey: 'program.historicalReference',
    targetMission: 'Apollo 11, 1969',
    descriptionKey: 'description.control_eq'
  },
  chandrayaan3: {
    displayName: 'Chandrayaan-3 (Shiv Shakti)',
    shortName: 'Chandrayaan-3',
    programKey: 'program.isro',
    targetMission: 'Chandrayaan-3, Shiv Shakti Point, 2023',
    descriptionKey: 'description.chandrayaan3'
  },
  slim: {
    displayName: 'SLIM (Shioli)',
    shortName: 'SLIM',
    programKey: 'program.jaxa',
    targetMission: 'SLIM, Shioli, 2024',
    descriptionKey: 'description.slim'
  },
  change4: {
    displayName: "Chang'e 4 (Von Kármán)",
    shortName: "Chang'e 4",
    programKey: 'program.cnsa',
    targetMission: "Chang'e 4, Von Kármán, 2019",
    descriptionKey: 'description.change4'
  }
};

export function horizonElevationAt(profile, azimuthDeg, mastHeightM) {
  if (!profile || !profile.elevationsDegByHeight?.length) return 0;
  const heights = profile.mastHeightsM;
  const rows = profile.elevationsDegByHeight;
  const h = Math.max(heights[0], Math.min(heights[heights.length - 1], mastHeightM));
  let lo = 0;
  for (let i = 1; i < heights.length; i += 1) {
    if (heights[i] >= h) {
      lo = i - 1;
      break;
    }
    lo = i;
  }
  const hi = Math.min(heights.length - 1, lo + 1);
  const h0 = heights[lo];
  const h1 = heights[hi];
  const hFrac = h1 === h0 ? 0 : (h - h0) / (h1 - h0);
  const az = ((azimuthDeg % 360) + 360) % 360;
  const bins = profile.binCount;
  const raw = az / profile.binWidthDeg;
  const i0 = Math.floor(raw) % bins;
  const i1 = (i0 + 1) % bins;
  const frac = raw - Math.floor(raw);
  const rowLo = rows[lo];
  const rowHi = rows[hi];
  const loValue = rowLo[i0] * (1 - frac) + rowLo[i1] * frac;
  const hiValue = rowHi[i0] * (1 - frac) + rowHi[i1] * frac;
  return loValue * (1 - hFrac) + hiValue * hFrac;
}

function greatCircleKm(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * 1737.4 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function adaptSite(record) {
  const ui = SITE_UI[record.id] ?? {};
  const role = record.role ?? (record.id === 'control_eq' ? 'reference' : 'candidate');
  const isRealLola = Boolean(record.demSourceNear) || Boolean(record.horizonMode?.startsWith('lola'));
  const site = {
    ...record,
    id: record.id,
    name: ui.displayName ?? record.name,
    shortName: ui.shortName ?? record.shortName ?? record.name,
    programKey:
      ui.programKey ??
      (role === 'reference' ? 'program.historicalReference' : 'program.artemis3'),
    targetMission: ui.targetMission ?? record.name,
    descriptionKey: ui.descriptionKey ?? null,
    description: record.description,
    role,
    lat: record.latDeg,
    lon: record.lonEastDeg,
    elevationKm: record.elevationM == null ? null : record.elevationM / 1000,
    elevationM: record.elevationM ?? null,
    maxSlopeDeg: record.slopeDeg ?? null,
    avgSlopeDeg: record.slopeDeg ?? null,
    optimalPanelAzimuthDeg: record.optimalPanelAzimuthDeg ?? 0,
    dataQuality:
      record.dataQuality ??
      (record.horizonMode === 'lola_hybrid'
        ? 'LOLA 5 m/px + 80 m/px'
        : record.horizonMode === 'lola_regional_80m'
          ? 'LOLA 80 m/px regional'
          : record.horizonMode === 'analytic_flat'
            ? 'Horizonte analítico'
            : 'Aproximado'),
    horizonSource: record.horizonSource ?? record.horizonMode ?? 'unknown',
    ephemSource:
      record.ephemSource ??
      (REFERENCE_EPHEM_IDS.has(record.id) ? 'jpl_horizons' : 'iau2000_local'),
    isRealLola,
    mastHeightM: 2,
    horizon: null,
    ephem: null
  };
  site.horizonAt = (azimuthDeg, height = site.mastHeightM) => {
    if (site.horizon) return horizonElevationAt(site.horizon, azimuthDeg, height);
    return 0;
  };
  site.horizonProfile = (azimuthDeg) => site.horizonAt(azimuthDeg, site.mastHeightM);
  return site;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

const sweepCache = new Map();

export async function loadDateSweep(siteId) {
  if (sweepCache.has(siteId)) return sweepCache.get(siteId);
  const promise = (async () => {
    try {
      return await fetchJson(`${import.meta.env.BASE_URL}data/sweep/${siteId}.json`);
    } catch {
      return null;
    }
  })();
  sweepCache.set(siteId, promise);
  return promise;
}

export async function loadLandingSites() {
  const base = `${import.meta.env.BASE_URL}data/`;
  const catalog = await fetchJson(`${base}sites.json`);
  let extra = { sites: [] };
  try {
    extra = await fetchJson(`${base}sites-extra.json`);
  } catch {
    extra = { sites: [] };
  }
  let international = { sites: [] };
  try {
    international = await fetchJson(`${base}sites-international.json`);
  } catch {
    international = { sites: [] };
  }
  const records = [
    ...catalog.sites,
    ...(extra.sites ?? []),
    ...(international.sites ?? [])
  ];
  const sites = records.map(adaptSite);

  await Promise.all(
    sites.map(async (site) => {
      const file = site.horizonFile ?? `horizon/${site.id}.json`;
      try {
        site.horizon = await fetchJson(`${base}${file}`);
      } catch (error) {
        if (site.id !== 'nobile_rim_1' && site.id !== 'haworth_rim') throw error;
        site.horizon = null;
        site.dataQuality = 'Sin DEM LOLA disponible';
        site.isRealLola = false;
        site.horizonSource = 'unavailable';
      }
    })
  );

  const order = [
    'site23',
    'site01',
    'site04',
    'site07',
    'site11',
    'site20',
    'nobile_rim_1',
    'haworth_rim',
    'control_eq',
    'chandrayaan3',
    'slim',
    'change4'
  ];
  sites.sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  LANDING_SITES = sites;
  return sites;
}

export function setMastHeight(sites, heightM) {
  for (const site of sites) site.mastHeightM = heightM;
}

export function getQuickMapUrl(site) {
  if (site.lat < -75) {
    const radiusM = 1_737_400;
    const colatRad = ((90 - Math.abs(site.lat)) / 2) * (Math.PI / 180);
    const rho = 2 * radiusM * Math.tan(colatRad);
    const lonRad = (site.lon * Math.PI) / 180;
    const cx = rho * Math.sin(lonRad);
    const cy = -rho * Math.cos(lonRad);
    const halfWidth = 35_000;
    const extent = `${(cx - halfWidth).toFixed(1)},${(cy - halfWidth).toFixed(1)},${(cx + halfWidth).toFixed(1)},${(cy + halfWidth).toFixed(1)}`;
    return `https://quickmap.lroc.asu.edu/layers?prjExtent=${extent}&proj=10`;
  }
  const halfDeg = 1;
  return `https://quickmap.lroc.asu.edu/layers?extent=${(site.lon - halfDeg).toFixed(3)},${(site.lat - halfDeg).toFixed(3)},${(site.lon + halfDeg).toFixed(3)},${(site.lat + halfDeg).toFixed(3)}`;
}

export function getMoonTrekUrl(site) {
  return `https://trek.nasa.gov/moon/#v=0.1&x=${site.lon.toFixed(4)}&y=${site.lat.toFixed(4)}&z=6&p=urn:ogc:def:crs:EPSG::104903`;
}

export function getCustomSite(lat, lon, name = t('site.customName')) {
  const normLon = ((lon % 360) + 360) % 360;
  const nearest = LANDING_SITES
    .filter((candidate) => candidate.horizon && candidate.isRealLola)
    .map((candidate) => ({
      site: candidate,
      distanceKm: greatCircleKm(lat, normLon, candidate.lat, candidate.lon)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  const reference = nearest && nearest.distanceKm <= 300 ? nearest : null;
  const site = {
    id: 'custom-site',
    name: `${name} (${lat.toFixed(2)}°, ${normLon.toFixed(2)}°)`,
    shortName: t('site.customName'),
    programKey: 'program.custom',
    targetMission: 'Simulated mission',
    descriptionKey: reference
      ? 'site.customDescription.lola'
      : 'site.customDescription.flat',
    role: 'custom',
    lat,
    lon: normLon,
    latDeg: lat,
    lonEastDeg: normLon,
    elevationKm: null,
    elevationM: null,
    maxSlopeDeg: null,
    avgSlopeDeg: null,
    slopeDeg: null,
    optimalPanelAzimuthDeg: 0,
    description: '',
    dataQuality: reference
      ? `Aproximado · horizonte LOLA de ${reference.site.shortName}`
      : 'Aproximado · horizonte plano',
    horizonSource: reference ? 'lola_nearest' : 'approx_flat',
    horizonReferenceName: reference?.site.shortName ?? null,
    horizonReferenceKm: reference?.distanceKm ?? null,
    ephemSource: 'iau2000_local',
    isRealLola: false,
    mastHeightM: 2,
    horizon: null,
    ephem: null
  };
  site.horizonAt = (azimuthDeg, height = site.mastHeightM) =>
    reference ? reference.site.horizonAt(azimuthDeg, height) : 0;
  site.horizonProfile = (azimuthDeg) => site.horizonAt(azimuthDeg, site.mastHeightM);
  return site;
}

export function siteProgram(site) {
  return t(site.programKey ?? 'program.artemis3');
}

export function siteDescription(site) {
  if (site.descriptionKey === 'site.customDescription.lola') {
    return t(site.descriptionKey, {
      site: site.horizonReferenceName ?? '',
      km: site.horizonReferenceKm == null ? '' : site.horizonReferenceKm.toFixed(0)
    });
  }
  if (site.descriptionKey) return t(site.descriptionKey);
  return site.description ?? '';
}

export function dataQualityLabel(site) {
  switch (site.horizonSource) {
    case 'lola_hybrid':
      return t('quality.hybrid');
    case 'lola_80m_regional':
      return t('quality.regional');
    case 'analytic_flat':
      return t('quality.analytic');
    case 'unavailable':
      return t('quality.unavailable');
    case 'lola_nearest':
      return t('quality.customLola', { site: site.horizonReferenceName ?? '' });
    case 'approx_flat':
      return t('quality.customFlat');
    default:
      return t('quality.approx');
  }
}

export function horizonSourceLabel(site) {
  switch (site.horizonSource) {
    case 'lola_hybrid':
      return t('horizon.hybrid');
    case 'lola_80m_regional':
      return t('horizon.regional');
    case 'analytic_flat':
      return t('horizon.analytic');
    case 'lola_nearest':
      return t('horizon.nearest', { site: site.horizonReferenceName ?? '' });
    case 'approx_flat':
      return t('horizon.flat');
    case 'approx':
      return t('horizon.approx');
    case 'unavailable':
      return t('horizon.unavailable');
    default:
      return t('horizon.unknown');
  }
}
