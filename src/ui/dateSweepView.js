import { PANELS, scoreComponents } from '../analysis/scoring.js';
import { getLanguage, t } from '../i18n.js';

const VIEW_W = 1000;
const VIEW_H = 370;
const MARGIN = { left: 64, right: 18 };
const PLOT_W = VIEW_W - MARGIN.left - MARGIN.right;
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
};

const STRIPS = [
  { key: 'energy', titleKey: 'sweep.strip.energy', top: 22, height: 84, color: 'var(--data-sun)' },
  { key: 'dte', titleKey: 'sweep.strip.dte', top: 126, height: 74, color: 'var(--data-earth)' },
  { key: 'cut', titleKey: 'sweep.strip.cut', top: 220, height: 84, color: 'var(--bad)' }
];

function monthsFor(language) {
  return language === 'en' ? MONTHS.en : MONTHS.es;
}

function monthLabel(ms) {
  const date = new Date(ms);
  return `${monthsFor(getLanguage())[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`;
}

function fullDateLabel(ms) {
  const date = new Date(ms);
  return `${date.getUTCDate()} ${monthsFor(getLanguage())[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function niceMax(value, step) {
  return Math.max(step, Math.ceil(value / step) * step);
}

function formatDays(hours) {
  if (hours >= 672) return '≥28.0 d';
  return `${(hours / 24).toFixed(1)} d`;
}

function earthsetLabel(point) {
  if (point.earthsetHoursFromStart == null) {
    return point.earthVisibleAtStart ? t('sweep.noEarthset') : t('sweep.earthHidden');
  }
  return `${(point.earthsetHoursFromStart / 24).toFixed(1)} d`;
}

function pointMetrics(point, context) {
  const energyKWh = point.energyKWhM2ByPanel[context.panelType] ?? point.energyKWhM2ByPanel.vertical_tracker;
  return {
    energyKWh,
    metrics: {
      energyWhM2: energyKWh * 1000,
      dMaxHours: point.dMaxHours,
      dteCenterPct: point.dteCenterPct,
      gMaxHours: point.gMaxHours
    }
  };
}

function pointScore(point, context) {
  const { metrics } = pointMetrics(point, context);
  return Math.round(scoreComponents(metrics, context.profile).total);
}

function pointValues(point, context) {
  const { energyKWh } = pointMetrics(point, context);
  return {
    energyKWh,
    sunlitPct: point.sunlitPct,
    dteCenterPct: point.dteCenterPct,
    gMaxHours: point.gMaxHours,
    score: pointScore(point, context)
  };
}

function thresholdFor(key, profile) {
  if (key === 'energy') {
    return {
      value: profile.energyReqKWhM2,
      label: t('sweep.thresholdEnergy', { value: profile.energyReqKWhM2 })
    };
  }
  if (key === 'dte') {
    return {
      value: profile.dteReqPct,
      label: t('sweep.thresholdDte', { value: profile.dteReqPct })
    };
  }
  return {
    value: profile.gMaxTolHours,
    label: t('sweep.thresholdCut', { value: profile.gMaxTolHours })
  };
}

function stripMax(strip, points, context) {
  if (strip.key === 'energy') {
    const values = points.map((point) => point.energyKWhM2ByPanel[context.panelType] ?? 0);
    return niceMax(Math.max(...values, context.profile.energyReqKWhM2), 100);
  }
  if (strip.key === 'dte') return 100;
  const values = points.map((point) => point.gMaxHours);
  return niceMax(Math.max(...values, context.profile.gMaxTolHours), 48);
}

export function renderDateSweep(container, { sweep, context, onSelectDate }) {
  if (!container || !sweep?.points?.length) return;

  const points = sweep.points;
  const startMs = Date.parse(points[0].startUtc);
  const endMs = Date.parse(points[points.length - 1].startUtc);
  const xFor = (index) => MARGIN.left + (index / (points.length - 1)) * PLOT_W;
  const maxes = Object.fromEntries(STRIPS.map((strip) => [strip.key, stripMax(strip, points, context)]));
  const yFor = (strip, value) =>
    strip.top + strip.height - (Math.max(0, Math.min(value, maxes[strip.key])) / maxes[strip.key]) * strip.height;

  const valueFor = (strip, point) => {
    if (strip.key === 'energy') return point.energyKWhM2ByPanel[context.panelType] ?? 0;
    if (strip.key === 'dte') return point.dteCenterPct;
    return point.gMaxHours;
  };

  const paths = STRIPS.map((strip) => {
    const line = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index).toFixed(1)} ${yFor(strip, valueFor(strip, point)).toFixed(1)}`)
      .join(' ');
    const area = `${line} L ${xFor(points.length - 1).toFixed(1)} ${strip.top + strip.height} L ${xFor(0).toFixed(1)} ${strip.top + strip.height} Z`;
    return { strip, line, area };
  });

  const grid = STRIPS.map((strip) => {
    const max = maxes[strip.key];
    const ticks = [0, max / 2, max];
    return ticks
      .map((tick) => {
        const y = yFor(strip, tick);
        return `
          <line x1="${MARGIN.left}" x2="${VIEW_W - MARGIN.right}" y1="${y}" y2="${y}" stroke="var(--line-faint)" stroke-width="1" />
          <text x="${MARGIN.left - 8}" y="${y + 3}" text-anchor="end" class="sweep-axis-text">${Math.round(tick)}</text>
        `;
      })
      .join('');
  }).join('');

  const thresholds = STRIPS.map((strip) => {
    const threshold = thresholdFor(strip.key, context.profile);
    const y = yFor(strip, threshold.value);
    return `
      <line x1="${MARGIN.left}" x2="${VIEW_W - MARGIN.right}" y1="${y}" y2="${y}"
        stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="4 4" opacity="0.8" />
      <text x="${VIEW_W - MARGIN.right}" y="${y - 4}" text-anchor="end" class="sweep-threshold-text">${threshold.label}</text>
    `;
  }).join('');

  const labelEvery = Math.max(1, Math.ceil(points.length / 12));
  const xTicks = points
    .map((point, index) => {
      if (index % labelEvery !== 0 && index !== points.length - 1) return '';
      return `<text x="${xFor(index)}" y="${VIEW_H - 12}" text-anchor="middle" class="sweep-axis-text">${monthLabel(Date.parse(point.startUtc))}</text>`;
    })
    .join('');

  const currentMarker = (() => {
    if (!Number.isFinite(context.currentDateMs) || context.currentDateMs < startMs || context.currentDateMs > endMs) {
      return '';
    }
    const fraction = ((context.currentDateMs - startMs) / (endMs - startMs)) * (points.length - 1);
    const x = xFor(fraction);
    return `
      <line x1="${x}" x2="${x}" y1="${STRIPS[0].top}" y2="${STRIPS[2].top + STRIPS[2].height}"
        stroke="var(--accent)" stroke-width="1" stroke-dasharray="3 4" opacity="0.55" />
      <text x="${x + 4}" y="${STRIPS[0].top + 10}" class="sweep-current-text">${t('sweep.current')}</text>
    `;
  })();

  const hitRects = points
    .map((point, index) => {
      const left = index === 0 ? MARGIN.left : (xFor(index - 1) + xFor(index)) / 2;
      const right = index === points.length - 1 ? VIEW_W - MARGIN.right : (xFor(index) + xFor(index + 1)) / 2;
      const values = pointValues(point, context);
      const label =
        `${fullDateLabel(Date.parse(point.startUtc))}: ${values.energyKWh.toFixed(1)} kWh/m², ` +
        `${values.sunlitPct.toFixed(0)}% ${t('common.sun')}, ${values.dteCenterPct.toFixed(0)}% DTE, ` +
        `${t('common.outage')} ${formatDays(values.gMaxHours)}, ${t('common.score')} ${values.score}/100`;
      return `<rect class="sweep-hit" data-index="${index}" x="${left}" y="${STRIPS[0].top}"
        width="${right - left}" height="${STRIPS[2].top + STRIPS[2].height - STRIPS[0].top}"
        tabindex="0" role="button" aria-label="${label}" />`;
    })
    .join('');

  const tableRows = points
    .map((point, index) => {
      const values = pointValues(point, context);
      return `<tr>
        <td><button type="button" class="sweep-date-btn" data-index="${index}">${fullDateLabel(Date.parse(point.startUtc))}</button></td>
        <td>${values.energyKWh.toFixed(1)}</td>
        <td>${values.sunlitPct.toFixed(0)}%</td>
        <td>${values.dteCenterPct.toFixed(0)}%</td>
        <td>${formatDays(values.gMaxHours)}</td>
        <td>${earthsetLabel(point)}</td>
        <td>${values.score}/100</td>
      </tr>`;
    })
    .join('');

  const mastWarning =
    context.mastHeightM !== sweep.assumptions.mastHeightM
      ? `<p class="sweep-warning">${t('sweep.mastWarning', {
          pre: sweep.assumptions.mastHeightM.toFixed(1),
          current: context.mastHeightM.toFixed(1)
        })}</p>`
      : '';

  container.innerHTML = `
    <div class="sweep-assumptions">
      <span>${t('sweep.assumptions.site', { name: context.siteName })}</span>
      <span>${t('sweep.assumptions.sampling')}</span>
      <span>${t('sweep.assumptions.profile', { name: t(context.profile.nameKey) })}</span>
      <span>${t('sweep.assumptions.panel', { name: t(PANELS[context.panelType].labelKey) })}</span>
      <span>${t('sweep.assumptions.mast', { mast: context.mastHeightM.toFixed(1) })}</span>
    </div>
    ${mastWarning}
    <div class="sweep-toolbar">
      <button class="nav-action-btn" id="export-sweep-csv" type="button">${t('export.csv')}</button>
    </div>
    <div class="sweep-chart-wrap" id="sweep-chart-wrap">
      <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img"
        aria-label="${t('sweep.chartAria', { site: context.siteName })}">
        ${grid}
        ${thresholds}
        ${currentMarker}
        ${paths.map(({ strip, area }) => `<path d="${area}" fill="${strip.color}" opacity="0.12" />`).join('')}
        ${paths.map(({ strip, line }) => `<path d="${line}" fill="none" stroke="${strip.color}" stroke-width="2" />`).join('')}
        ${STRIPS.map((strip) => `<text x="${MARGIN.left}" y="${strip.top - 6}" class="sweep-strip-title">${t(strip.titleKey)}</text>`).join('')}
        ${xTicks}
        ${hitRects}
        <line id="sweep-hover-line" x1="0" x2="0" y1="${STRIPS[0].top}" y2="${STRIPS[2].top + STRIPS[2].height}"
          stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 3" visibility="hidden" />
      </svg>
      <div class="sweep-tooltip" id="sweep-tooltip" hidden></div>
    </div>
    <div class="sweep-legend">
      <span><i style="background: var(--data-sun)"></i>${t('sweep.legend.energy')}</span>
      <span><i style="background: var(--data-earth)"></i>${t('sweep.legend.dte')}</span>
      <span><i style="background: var(--bad)"></i>${t('sweep.legend.cut')}</span>
      <span class="sweep-legend-note">${t('sweep.legendNote')}</span>
    </div>
    <p class="sweep-note">${t('sweep.note')}</p>
    <details class="sweep-table-details">
      <summary>${t('sweep.tableSummary')}</summary>
      <div class="table-responsive">
        <table class="comparison-table sweep-table">
          <thead>
            <tr>
              <th scope="col">${t('sweep.headerMonth')}</th>
              <th scope="col">${t('sweep.headerEnergy')}</th>
              <th scope="col">${t('sweep.headerSun')}</th>
              <th scope="col">${t('sweep.headerDte')}</th>
              <th scope="col">${t('sweep.headerCut')}</th>
              <th scope="col">${t('sweep.headerEarthset')}</th>
              <th scope="col">${t('sweep.headerScore')}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </details>
  `;

  const wrapper = container.querySelector('#sweep-chart-wrap');
  const tooltip = container.querySelector('#sweep-tooltip');
  const hoverLine = container.querySelector('#sweep-hover-line');
  const hits = [...container.querySelectorAll('.sweep-hit')];
  if (!wrapper || !tooltip || !hoverLine) return;

  const placeTooltip = (index, clientX, clientY) => {
    const point = points[index];
    const values = pointValues(point, context);
    tooltip.innerHTML = `
      <div class="sweep-tip-date">${fullDateLabel(Date.parse(point.startUtc))}</div>
      <div class="sweep-tip-grid">
        <span>${t('sweep.tooltip.energy')}</span><strong>${values.energyKWh.toFixed(1)} kWh/m²</strong>
        <span>${t('sweep.tooltip.sun')}</span><strong>${values.sunlitPct.toFixed(0)}%</strong>
        <span>${t('sweep.tooltip.dte')}</span><strong>${values.dteCenterPct.toFixed(0)}%</strong>
        <span>${t('sweep.tooltip.cut')}</span><strong>${formatDays(values.gMaxHours)}</strong>
        <span>${t('sweep.tooltip.earthset')}</span><strong>${earthsetLabel(point)}</strong>
        <span>${t('sweep.tooltip.score')}</span><strong>${values.score}/100</strong>
      </div>
      <div class="sweep-tip-hint">${t('sweep.tooltip.hint')}</div>
    `;
    tooltip.hidden = false;
    const rect = wrapper.getBoundingClientRect();
    const baseX = clientX == null ? (xFor(index) / VIEW_W) * rect.width : clientX - rect.left;
    const baseY = clientY == null ? 20 : clientY - rect.top;
    const maxLeft = Math.max(8, rect.width - 236);
    const left = Math.min(Math.max(8, baseX + 14), maxLeft);
    const top = Math.min(Math.max(8, baseY + 14), Math.max(8, rect.height - 150));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    hoverLine.setAttribute('x1', String(xFor(index)));
    hoverLine.setAttribute('x2', String(xFor(index)));
    hoverLine.setAttribute('visibility', 'visible');
  };

  const hideTooltip = () => {
    tooltip.hidden = true;
    hoverLine.setAttribute('visibility', 'hidden');
  };

  container.querySelectorAll('.sweep-date-btn').forEach((button) => {
    const index = Number(button.getAttribute('data-index'));
    button.addEventListener('click', () => {
      if (onSelectDate) onSelectDate(Date.parse(points[index].startUtc));
    });
  });

  hits.forEach((hit) => {
    const index = Number(hit.getAttribute('data-index'));
    hit.addEventListener('mouseenter', (event) => placeTooltip(index, event.clientX, event.clientY));
    hit.addEventListener('mousemove', (event) => placeTooltip(index, event.clientX, event.clientY));
    hit.addEventListener('mouseleave', hideTooltip);
    hit.addEventListener('focus', () => placeTooltip(index));
    hit.addEventListener('blur', hideTooltip);
    hit.addEventListener('click', () => {
      if (onSelectDate) onSelectDate(Date.parse(points[index].startUtc));
    });
    hit.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (onSelectDate) onSelectDate(Date.parse(points[index].startUtc));
      }
    });
  });
}
