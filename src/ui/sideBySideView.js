import { makeSky } from '../analysis/scoring.js';
import { sampleSite } from '../analysis/sampling.js';
import { t } from '../i18n.js';
import { dataQualityLabel, siteProgram } from '../topography/lunarData.js';
import { SkyDomeRadar } from './skyDomeRadar.js';

let radarA = null;
let radarB = null;

function toDatetimeLocal(ms) {
  return new Date(ms).toISOString().slice(0, 16);
}

function formatOutage(metrics) {
  const windowHours = metrics.sampleCount * metrics.stepHours;
  const days = metrics.gMaxHours / 24;
  const capped = metrics.gMaxHours >= windowHours;
  return `${capped ? '≥' : ''}${capped ? days.toFixed(0) : days.toFixed(1)} ${t('common.days')}`;
}

function formatSlope(site) {
  return site.maxSlopeDeg == null
    ? '—'
    : `${Number(site.maxSlopeDeg).toFixed(1)}°`;
}

function formatDelta(value, unit) {
  if (!Number.isFinite(value)) return '—';
  const zeroUnit =
    unit === 'pp'
      ? t('ab.percentPoints')
      : unit === 'kWh'
        ? 'kWh/m²'
        : unit === 'pts'
          ? t('ab.points')
          : unit;
  if (Math.abs(value) < 1e-9) return `0 ${zeroUnit}`;
  const sign = value > 0 ? '+' : '−';
  const abs = Math.abs(value);
  if (unit === 'pp') return `${sign}${abs.toFixed(0)} ${t('ab.percentPoints')}`;
  if (unit === 'kWh') return `${sign}${abs.toFixed(1)} kWh/m²`;
  if (unit === 'pts') return `${sign}${abs.toFixed(0)} ${t('ab.points')}`;
  return `${sign}${abs.toFixed(1)} ${unit}`;
}

function deltaClass(value, better) {
  if (!Number.isFinite(value) || Math.abs(value) < 1e-9) return '';
  if (better === 'high') return value > 0 ? 'metric-good' : 'metric-danger';
  return value < 0 ? 'metric-good' : 'metric-danger';
}

function isReferenceSite(site) {
  return site.role === 'reference' || site.role === 'international';
}

function card(analysis, key) {
  const site = analysis.site;
  const m = analysis.metrics;
  const reference = isReferenceSite(site);
  return `
    <article class="ab-card">
      <div class="ab-card-head">
        <div class="ab-card-title">
          <span class="ab-scenario-label">${t(key === 'a' ? 'ab.scenarioA' : 'ab.scenarioB')}</span>
          <h3>${site.name}</h3>
          <span class="ab-site-meta">${siteProgram(site)} · ${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E</span>
          <span class="ab-site-meta">${dataQualityLabel(site)}</span>
        </div>
        <span class="verdict-status ${analysis.badgeClass}">${analysis.status}</span>
      </div>
      <div class="ab-radar-box">
        <canvas data-ab-radar="${key}" role="img" aria-label="${t('ab.radarAria', {
          site: site.name,
          date: `${toDatetimeLocal(analysis.startMs)} UTC`
        })}"></canvas>
      </div>
      <div class="ab-metrics">
        <div><span class="ab-metric-label">${t('ab.metrics.sun')}</span><strong>${m.sunlitPct.toFixed(0)}%</strong></div>
        <div><span class="ab-metric-label">${t('ab.metrics.dte')}</span><strong>${m.dteCenterPct.toFixed(0)}%</strong></div>
        <div><span class="ab-metric-label">${t('ab.metrics.outage')}</span><strong>${formatOutage(m)}</strong></div>
        <div><span class="ab-metric-label">${t('ab.metrics.eclipse')}</span><strong>${m.dMaxHours.toFixed(1)} h</strong></div>
        <div><span class="ab-metric-label">${t('ab.metrics.energy')}</span><strong>${(m.energyWhM2 / 1000).toFixed(1)} kWh/m²</strong></div>
        <div><span class="ab-metric-label">${t('ab.metrics.slope')}</span><strong>${formatSlope(site)}</strong></div>
      </div>
      <div class="ab-card-foot">
        <div class="ab-score">
          <span class="ab-metric-label">${t('ab.metrics.score')}</span>
          <strong>${reference ? t('common.reference') : `${analysis.scorePercent}/100`}</strong>
        </div>
        <button class="nav-action-btn" type="button" data-ab-load="${key}">${t('ab.load')}</button>
      </div>
    </article>
  `;
}

function scenarioOptions(sites, selectedId) {
  return sites
    .map((site) => {
      const selected = site.id === selectedId ? ' selected' : '';
      return `<option value="${site.id}"${selected}>${site.name} · ${dataQualityLabel(site)}</option>`;
    })
    .join('');
}

function deltaTable(left, right) {
  const lm = left.metrics;
  const rm = right.metrics;
  const leftRef = isReferenceSite(left.site);
  const rightRef = isReferenceSite(right.site);
  const rows = [
    {
      label: t('ab.metrics.sun'),
      a: `${lm.sunlitPct.toFixed(0)}%`,
      b: `${rm.sunlitPct.toFixed(0)}%`,
      delta: rm.sunlitPct - lm.sunlitPct,
      unit: 'pp',
      better: 'high'
    },
    {
      label: t('ab.metrics.dte'),
      a: `${lm.dteCenterPct.toFixed(0)}%`,
      b: `${rm.dteCenterPct.toFixed(0)}%`,
      delta: rm.dteCenterPct - lm.dteCenterPct,
      unit: 'pp',
      better: 'high'
    },
    {
      label: t('ab.metrics.outage'),
      a: formatOutage(lm),
      b: formatOutage(rm),
      delta: (rm.gMaxHours - lm.gMaxHours) / 24,
      unit: 'd',
      better: 'low'
    },
    {
      label: t('ab.metrics.eclipse'),
      a: `${lm.dMaxHours.toFixed(1)} h`,
      b: `${rm.dMaxHours.toFixed(1)} h`,
      delta: rm.dMaxHours - lm.dMaxHours,
      unit: 'h',
      better: 'low'
    },
    {
      label: t('ab.metrics.energy'),
      a: `${(lm.energyWhM2 / 1000).toFixed(1)}`,
      b: `${(rm.energyWhM2 / 1000).toFixed(1)}`,
      delta: (rm.energyWhM2 - lm.energyWhM2) / 1000,
      unit: 'kWh',
      better: 'high'
    },
    {
      label: t('ab.metrics.score'),
      a: leftRef ? t('common.reference') : `${left.scorePercent}`,
      b: rightRef ? t('common.reference') : `${right.scorePercent}`,
      delta: leftRef || rightRef ? NaN : right.scorePercent - left.scorePercent,
      unit: 'pts',
      better: 'high'
    }
  ];

  return `
    <div class="ab-delta-wrap">
      <table class="ab-delta">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">${t('ab.scenarioA')}</th>
            <th scope="col">${t('ab.scenarioB')}</th>
            <th scope="col">${t('ab.delta')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
            <tr>
              <th scope="row">${row.label}</th>
              <td>${row.a}</td>
              <td>${row.b}</td>
              <td class="${deltaClass(row.delta, row.better)}">${Number.isFinite(row.delta) ? formatDelta(row.delta, row.unit) : '—'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
}

export function renderSideBySide(container, { sites, left, right, context, onCompare, onLoad }) {
  if (!container) return;
  radarA?.destroy();
  radarB?.destroy();
  radarA = null;
  radarB = null;

  container.innerHTML = `
    <div class="ab-toolbar">
      <div class="ab-controls">
        <div class="ab-control">
          <span class="ab-scenario-label">${t('ab.scenarioA')}</span>
          <label class="sr-only" for="ab-site-a">${t('ab.site')}</label>
          <select id="ab-site-a" data-ab-site="a">${scenarioOptions(sites, left.site.id)}</select>
          <label class="ab-date-label" for="ab-date-a">${t('ab.date')}</label>
          <input id="ab-date-a" data-ab-date="a" type="datetime-local" min="2026-01-01T00:00" max="2035-12-01T00:00" value="${toDatetimeLocal(left.startMs)}" />
        </div>
        <div class="ab-control">
          <span class="ab-scenario-label">${t('ab.scenarioB')}</span>
          <label class="sr-only" for="ab-site-b">${t('ab.site')}</label>
          <select id="ab-site-b" data-ab-site="b">${scenarioOptions(sites, right.site.id)}</select>
          <label class="ab-date-label" for="ab-date-b">${t('ab.date')}</label>
          <input id="ab-date-b" data-ab-date="b" type="datetime-local" min="2026-01-01T00:00" max="2035-12-01T00:00" value="${toDatetimeLocal(right.startMs)}" />
        </div>
        <button class="nav-action-btn ab-compare-btn" id="ab-compare-btn" type="button">${t('ab.compare')}</button>
      </div>
      <p class="ab-context">${t('ab.context')} ${t('common.profile')}: ${t(context.profile.nameKey)} · ${t('common.panel')}: ${context.panelLabel} · ${t('common.mast')}: ${context.mastHeightM.toFixed(1)} m</p>
    </div>
    <div class="ab-grid">
      ${card(left, 'a')}
      ${card(right, 'b')}
    </div>
    ${deltaTable(left, right)}
  `;

  const canvasA = container.querySelector('[data-ab-radar="a"]');
  const canvasB = container.querySelector('[data-ab-radar="b"]');
  if (canvasA) {
    radarA = new SkyDomeRadar(canvasA);
    const sky = makeSky(
      left.site,
      sampleSite(left.site, left.startMs),
      context.mastHeightM
    );
    radarA.update(
      left.site,
      {
        sun: { az: sky.sun.azDeg, el: sky.sun.elDeg },
        earth: { az: sky.earth.azDeg, el: sky.earth.elDeg }
      },
      left.series
    );
  }
  if (canvasB) {
    radarB = new SkyDomeRadar(canvasB);
    const sky = makeSky(
      right.site,
      sampleSite(right.site, right.startMs),
      context.mastHeightM
    );
    radarB.update(
      right.site,
      {
        sun: { az: sky.sun.azDeg, el: sky.sun.elDeg },
        earth: { az: sky.earth.azDeg, el: sky.earth.elDeg }
      },
      right.series
    );
  }

  const compare = () => {
    const siteA = container.querySelector('[data-ab-site="a"]')?.value;
    const siteB = container.querySelector('[data-ab-site="b"]')?.value;
    const dateA = Date.parse(
      `${container.querySelector('[data-ab-date="a"]')?.value || ''}:00Z`
    );
    const dateB = Date.parse(
      `${container.querySelector('[data-ab-date="b"]')?.value || ''}:00Z`
    );
    if (!siteA || !siteB || !Number.isFinite(dateA) || !Number.isFinite(dateB)) {
      return;
    }
    onCompare?.({
      a: { siteId: siteA, startMs: dateA },
      b: { siteId: siteB, startMs: dateB }
    });
  };
  container.querySelector('#ab-compare-btn')?.addEventListener('click', compare);

  container.querySelectorAll('[data-ab-load]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.getAttribute('data-ab-load');
      const analysis = key === 'a' ? left : right;
      if (analysis) onLoad?.(analysis.site.id, analysis.startMs);
    });
  });
}
