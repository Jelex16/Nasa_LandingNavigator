import { PANELS, scoreComponents } from './analysis/scoring.js';
import { t } from './i18n.js';
import {
  dataQualityLabel,
  siteDescription,
  siteProgram
} from './topography/lunarData.js';

export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? '' : String(cell);
          return /[",\n\r]/.test(value)
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadText(filename, mime, content) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function scenarioToJson(analysis) {
  const site = analysis.site;
  const profile = analysis.profile;
  const payload = {
    generatedUtc: new Date().toISOString(),
    site: {
      id: site.id,
      name: site.name,
      shortName: site.shortName,
      role: site.role,
      program: siteProgram(site),
      description: siteDescription(site),
      latDeg: site.lat,
      lonEastDeg: site.lon,
      elevationKm: site.elevationKm,
      maxSlopeDeg: site.maxSlopeDeg,
      dataQuality: dataQualityLabel(site),
      horizonSource: site.horizonSource,
      ephemSource: site.ephemSource
    },
    startUtc: new Date(analysis.startMs).toISOString(),
    windowDays: analysis.metrics.windowDays,
    stepHours: analysis.metrics.stepHours,
    profile: {
      id: profile.id,
      name: t(profile.nameKey),
      description: t(profile.descriptionKey),
      basis: profile.basisKey ? t(profile.basisKey) : '',
      thresholds: {
        energyReqKWhM2: profile.energyReqKWhM2,
        dMaxTolHours: profile.dMaxTolHours,
        dteReqPct: profile.dteReqPct,
        gMaxTolHours: profile.gMaxTolHours
      },
      weights: profile.weights,
      strict: Boolean(profile.strict)
    },
    panel: {
      id: analysis.panelType,
      label: t(PANELS[analysis.panelType].labelKey),
      azimuthDeg: analysis.panelAzimuthDeg
    },
    mastHeightM: analysis.mastHeightM,
    metrics: analysis.metrics,
    components: analysis.components,
    scorePercent: analysis.scorePercent,
    status: analysis.status,
    statusText: analysis.statusText,
    series: analysis.series.map((point) => ({
      timeUtc: new Date(point.timeMs).toISOString(),
      sunAzDeg: point.sunAz,
      sunElDeg: point.sunEl,
      earthAzDeg: point.earthAz,
      earthElDeg: point.earthEl,
      sunHorizonDeg: point.sunHorizon,
      earthHorizonDeg: point.earthHorizon,
      sunVisibleFraction: point.sunVisibleFraction,
      earthVisibleFraction: point.earthVisibleFraction,
      sunlit: point.sunlit,
      dteCenter: point.dteCenter,
      energyWm2: point.energyWm2
    }))
  };
  return JSON.stringify(payload, null, 2);
}

export function comparisonToCsv(analyses, context) {
  const headers = [
    t('comparison.headerSite'),
    'role',
    'latDeg',
    'lonEastDeg',
    t('comparison.headerScore'),
    t('comparison.headerEnergy'),
    t('comparison.headerEclipse'),
    t('comparison.headerDte'),
    t('comparison.headerComms'),
    t('comparison.headerSlope'),
    'horizonSource',
    'ephemSource'
  ];
  const rows = analyses.map((analysis) => {
    const site = analysis.site;
    const metrics = analysis.metrics;
    return [
      site.name,
      site.role,
      site.lat.toFixed(5),
      site.lon.toFixed(5),
      analysis.scorePercent,
      (metrics.energyWhM2 / 1000).toFixed(1),
      metrics.dMaxHours.toFixed(1),
      metrics.dteCenterPct.toFixed(1),
      metrics.gMaxHours.toFixed(1),
      site.maxSlopeDeg == null ? '' : Number(site.maxSlopeDeg).toFixed(1),
      site.horizonSource,
      site.ephemSource
    ];
  });
  return toCsv([headers, ...rows]);
}

function pointScore(point, context) {
  const energyKWh =
    point.energyKWhM2ByPanel[context.panelType] ??
    point.energyKWhM2ByPanel.vertical_tracker;
  return Math.round(
    scoreComponents(
      {
        energyWhM2: energyKWh * 1000,
        dMaxHours: point.dMaxHours,
        dteCenterPct: point.dteCenterPct,
        gMaxHours: point.gMaxHours
      },
      context.profile
    ).total
  );
}

export function sweepToCsv(sweep, context) {
  const headers = [
    t('sweep.headerMonth'),
    `${t('sweep.headerEnergy')} (kWh/m²)`,
    `${t('sweep.headerSun')} (%)`,
    `${t('sweep.headerDte')} (%)`,
    `${t('sweep.headerCut')} (h)`,
    `${t('sweep.headerEarthset')} (d)`,
    t('sweep.headerScore')
  ];
  const rows = sweep.points.map((point) => {
    const energy =
      point.energyKWhM2ByPanel[context.panelType] ??
      point.energyKWhM2ByPanel.vertical_tracker;
    return [
      point.startUtc.slice(0, 10),
      energy.toFixed(1),
      point.sunlitPct.toFixed(1),
      point.dteCenterPct.toFixed(1),
      point.gMaxHours.toFixed(1),
      point.earthsetHoursFromStart == null
        ? ''
        : (point.earthsetHoursFromStart / 24).toFixed(2),
      pointScore(point, context)
    ];
  });
  return toCsv([headers, ...rows]);
}

export function matrixToCsv(sweeps, context) {
  const points = sweeps[0]?.sweep?.points ?? [];
  const headers = [
    t('matrix.site'),
    'role',
    ...points.map((point) => point.startUtc.slice(0, 10))
  ];
  const rows = sweeps.map(({ siteName, role, sweep }) => [
    siteName,
    role,
    ...sweep.points.map((point) => pointScore(point, context))
  ]);
  return toCsv([headers, ...rows]);
}
