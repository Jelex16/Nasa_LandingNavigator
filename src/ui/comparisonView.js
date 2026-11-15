import { t } from '../i18n.js';
import { dataQualityLabel, siteProgram } from '../topography/lunarData.js';

function formatDateUtc(ms) {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function badgeClass(analysis) {
  if (
    analysis.site.role === 'reference' ||
    analysis.site.role === 'international'
  ) {
    return 'badge-reference';
  }
  if (analysis.badgeClass === 'status-safe') return 'badge-safe';
  if (analysis.badgeClass === 'status-warning') return 'badge-warning';
  return 'badge-danger';
}

function termClass(value, threshold = 0.5) {
  if (value >= 0.75) return 'metric-good';
  if (value >= threshold) return 'metric-warn';
  return 'metric-danger';
}

function limitClass(value, limit) {
  return value > limit ? 'metric-danger' : 'metric-good';
}

function commsState(metrics, profile, comps) {
  const out = metrics.gMaxHours >= profile.gMaxTolHours;
  const pct = Math.round(comps.comms * 100);
  return {
    className: out ? 'metric-danger' : 'metric-good',
    label: out
      ? t('comparison.outOfTolerance')
      : t('comparison.withinTolerance', { pct }),
    title: out
      ? t('comparison.commsOutTitle', {
          outage: metrics.gMaxHours.toFixed(1),
          tol: profile.gMaxTolHours
        })
      : t('comparison.commsInTitle', {
          outage: metrics.gMaxHours.toFixed(1),
          tol: profile.gMaxTolHours,
          pct
        })
  };
}

export function renderComparisonTable(containerElement, analyses, context, onSelectSite) {
  if (!containerElement) return;
  const profile = context.profile;
  const profileName = t(profile.nameKey);
  const rows = analyses
    .map((analysis) => {
      const site = analysis.site;
      const metrics = analysis.metrics;
      const comps = analysis.components;
      const isReference =
        site.role === 'reference' || site.role === 'international';
      const statusShort = analysis.status.split(' ')[0];
      const scoreLabel = isReference
        ? t('comparison.refScore')
        : t('comparison.statusScore', {
            status: statusShort,
            score: analysis.scorePercent
          });
      const comms = commsState(metrics, profile, comps);
      const slope = site.maxSlopeDeg == null ? null : Number(site.maxSlopeDeg);
      const elevation = site.elevationKm == null ? null : Number(site.elevationKm);
      const slopeClass =
        slope == null
          ? ''
          : slope < 10
            ? 'metric-good'
            : slope < 20
              ? 'metric-warn'
              : 'metric-danger';
      const slopeLabel = slope == null ? '—' : `${slope.toFixed(1)}°`;
      const elevationLabel =
        elevation == null
          ? t('comparison.noDem')
          : `${elevation >= 0 ? '+' : ''}${elevation.toFixed(2)} km`;
      const ephemShort =
        site.ephemSource === 'jpl_horizons'
          ? t('comparison.ephemHorizons')
          : t('comparison.ephemIau');
      return `
        <tr class="comparison-row" data-site-id="${site.id}">
          <td>
            <button class="site-cell-btn" type="button" data-site-id="${site.id}" aria-label="${t('comparison.selectSite', { site: site.name })}">
              <span class="site-cell-name"><strong>${site.name}</strong></span>
              <span class="site-cell-program">${siteProgram(site)} · ${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E</span>
              <span class="site-cell-quality">${dataQualityLabel(site)} · ${ephemShort}</span>
            </button>
          </td>
          <td><span class="badge ${badgeClass(analysis)}">${scoreLabel}</span></td>
          <td class="${termClass(comps.energy)}">
            <strong>${(metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²</strong>
            <div class="site-cell-meta">${Math.round(comps.energy * 100)}/100 · ${t('comparison.req', { value: profile.energyReqKWhM2 })}</div>
          </td>
          <td class="${limitClass(metrics.dMaxHours, profile.dMaxTolHours)}">
            <strong>${metrics.dMaxHours.toFixed(1)} h</strong>
            <div class="site-cell-meta">${t('comparison.tol', { value: profile.dMaxTolHours })} · ${Math.round(comps.dark * 100)}/100</div>
          </td>
          <td class="${termClass(comps.dte)}">
            <strong>${metrics.dteCenterPct.toFixed(0)}%</strong>
            <div class="site-cell-meta">${t('comparison.req', { value: `${profile.dteReqPct}%` })} · ${Math.round(comps.dte * 100)}/100</div>
            <div class="site-cell-meta">${t('comparison.partial', { pct: metrics.dtePartialPct.toFixed(0) })}</div>
          </td>
          <td class="comms-cell ${comms.className}" title="${comms.title}" aria-label="${comms.title}">
            <strong>${metrics.gMaxHours.toFixed(1)} h</strong>
            <div class="site-cell-meta">${t('comparison.tol', { value: profile.gMaxTolHours })} · ${comms.label}</div>
          </td>
          <td class="${slopeClass}">
            <strong>${slopeLabel}</strong>
            <div class="site-cell-meta">${elevationLabel}</div>
          </td>
        </tr>
      `;
    })
    .join('');

  containerElement.innerHTML = `
    <div class="comparison-card">
      <div class="comparison-header">
        <div class="title-with-badge">
          <h3>${t('comparison.tableTitle')}</h3>
          <span class="matrix-badge">${t('comparison.tableBadge')}</span>
        </div>
        <div class="comparison-context">
          <span>${t('comparison.window', {
            days: context.windowDays,
            start: formatDateUtc(context.startMs)
          })}</span>
          <span><b>${t('common.profile')}:</b> ${profileName}</span>
          <span><b>${t('common.panel')}:</b> ${context.panelLabel}</span>
          <span><b>${t('common.mast')}:</b> ${context.mastHeightM.toFixed(1)} m</span>
        </div>
        <p class="comparison-note">${t('comparison.note')}</p>
        <div class="comparison-actions">
          <button class="nav-action-btn" id="open-ab-btn" type="button">
            ${t('comparison.abButton')}
          </button>
          <button class="nav-action-btn" id="open-matrix-btn" type="button">
            ${t('comparison.matrixButton')}
          </button>
          <button class="btn-link" id="export-comparison-csv" type="button">
            ${t('export.csv')}
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="comparison-table">
          <thead>
            <tr>
              <th scope="col">${t('comparison.headerSite')}</th>
              <th scope="col">${t('comparison.headerScore')}</th>
              <th scope="col">${t('comparison.headerEnergy')}</th>
              <th scope="col">${t('comparison.headerEclipse')}</th>
              <th scope="col">${t('comparison.headerDte')}</th>
              <th scope="col">${t('comparison.headerComms')}</th>
              <th scope="col">${t('comparison.headerSlope')}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <p class="comparison-footnote">${t('comparison.footnote')}</p>
    </div>
  `;

  containerElement.querySelectorAll('.comparison-row').forEach((row) => {
    const select = () => {
      const siteId = row.getAttribute('data-site-id');
      if (siteId && onSelectSite) onSelectSite(siteId);
    };
    row.addEventListener('click', select);
  });
}
