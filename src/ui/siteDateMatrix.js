import { scoreComponents } from '../analysis/scoring.js';

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function monthLabel(ms) {
  const date = new Date(ms);
  return `${MONTHS_ES[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(2)}`;
}

function fullDateLabel(ms) {
  const date = new Date(ms);
  return `${date.getUTCDate()} ${MONTHS_ES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatDays(hours) {
  if (hours >= 672) return '≥28.0 d';
  return `${(hours / 24).toFixed(1)} d`;
}

function cellDays(hours) {
  if (hours >= 672) return '≥28';
  return `${(hours / 24).toFixed(0)}`;
}

function pointMetrics(point, context) {
  const energyKWh =
    point.energyKWhM2ByPanel[context.panelType] ?? point.energyKWhM2ByPanel.vertical_tracker;
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
  return Math.round(scoreComponents(pointMetrics(point, context).metrics, context.profile).total);
}

function metricValue(point, context, metric) {
  if (metric === 'sun') return point.sunlitPct;
  if (metric === 'dte') return point.dteCenterPct;
  if (metric === 'cut') return point.gMaxHours;
  return pointScore(point, context);
}

function metricClass(value, metric, context) {
  if (metric === 'sun') {
    return value >= 60 ? 'matrix-good' : value >= 30 ? 'matrix-warn' : 'matrix-bad';
  }
  if (metric === 'dte') {
    const req = context.profile.dteReqPct;
    return value >= req ? 'matrix-good' : value >= req / 2 ? 'matrix-warn' : 'matrix-bad';
  }
  if (metric === 'cut') {
    const tol = context.profile.gMaxTolHours;
    return value <= tol ? 'matrix-good' : value <= tol * 2 ? 'matrix-warn' : 'matrix-bad';
  }
  return value >= 75 ? 'matrix-good' : value >= 50 ? 'matrix-warn' : 'matrix-bad';
}

function metricDisplay(value, metric) {
  if (metric === 'sun' || metric === 'dte') return `${Math.round(value)}%`;
  if (metric === 'cut') return cellDays(value);
  return `${Math.round(value)}`;
}

function cellTitle({ siteName, point, context }) {
  const { energyKWh } = pointMetrics(point, context);
  const score = pointScore(point, context);
  return (
    `${siteName} · ${fullDateLabel(Date.parse(point.startUtc))}: ` +
    `score ${score}/100, ${point.sunlitPct.toFixed(0)}% Sol, ` +
    `${point.dteCenterPct.toFixed(0)}% DTE, corte ${formatDays(point.gMaxHours)}, ` +
    `${energyKWh.toFixed(1)} kWh/m²`
  );
}

function isCurrentMonth(point, currentDateMs) {
  if (!Number.isFinite(currentDateMs)) return false;
  const pointDate = new Date(Date.parse(point.startUtc));
  const current = new Date(currentDateMs);
  return (
    pointDate.getUTCFullYear() === current.getUTCFullYear() &&
    pointDate.getUTCMonth() === current.getUTCMonth()
  );
}

function buildHtml(sweeps, context, metric) {
  const points = sweeps[0].sweep.points;
  const header = points
    .map((point, index) => {
      const ms = Date.parse(point.startUtc);
      const label = index % 3 === 0 || index === points.length - 1 ? monthLabel(ms) : '';
      const major = index % 3 === 0 ? ' is-major' : '';
      return `<th scope="col" class="matrix-month${major}" title="${fullDateLabel(ms)}">${label}</th>`;
    })
    .join('');

  const rows = sweeps
    .map(({ siteId, siteName, sweep }) => {
      const cells = sweep.points
        .map((point, index) => {
          const value = metricValue(point, context, metric);
          const cls = metricClass(value, metric, context);
          const current = isCurrentMonth(point, context.currentDateMs) ? ' is-current' : '';
          const title = cellTitle({ siteName, point, context });
          return `<td><button type="button" class="matrix-cell ${cls}${current}"
            data-site-id="${siteId}" data-index="${index}"
            title="${title}" aria-label="${title}">${metricDisplay(value, metric)}</button></td>`;
        })
        .join('');
      return `<tr><th scope="row" class="matrix-site">${siteName}</th>${cells}</tr>`;
    })
    .join('');

  const mastWarning =
    context.mastHeightM !== 2
      ? `<p class="sweep-warning">DTE y corte están precalculados con mástil 2.0 m; el panel principal usa ${context.mastHeightM.toFixed(1)} m.</p>`
      : '';

  return `
    <div class="matrix-toolbar">
      <label for="matrix-metric">Métrica</label>
      <select id="matrix-metric">
        <option value="score"${metric === 'score' ? ' selected' : ''}>Score</option>
        <option value="sun"${metric === 'sun' ? ' selected' : ''}>Sol (%)</option>
        <option value="dte"${metric === 'dte' ? ' selected' : ''}>DTE (%)</option>
        <option value="cut"${metric === 'cut' ? ' selected' : ''}>Corte DTE</option>
      </select>
      <div class="matrix-legend">
        <span><i class="matrix-good"></i>cumple</span>
        <span><i class="matrix-warn"></i>marginal</span>
        <span><i class="matrix-bad"></i>no cumple</span>
      </div>
    </div>
    ${mastWarning}
    <div class="matrix-scroll">
      <table class="matrix-table">
        <thead><tr><th scope="col" class="matrix-corner">Sitio</th>${header}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="data-note">
      Cada celda es una ventana de 28 días desde el día 1 del mes. Score con el perfil actual;
      energía con el panel actual; DTE y corte con mástil 2 m. Haz clic en una celda para cargar
      ese sitio y esa fecha en la vista principal.
    </p>
  `;
}

export function renderSiteDateMatrix(container, { sweeps, context, onSelect }) {
  if (!container || !sweeps?.length || !sweeps[0].sweep?.points?.length) return;

  const draw = (metric) => {
    container.innerHTML = buildHtml(sweeps, context, metric);
    container.querySelector('#matrix-metric')?.addEventListener('change', (event) => {
      draw(event.target.value);
    });
    container.querySelectorAll('.matrix-cell').forEach((button) => {
      button.addEventListener('click', () => {
        const siteId = button.getAttribute('data-site-id');
        const index = Number(button.getAttribute('data-index'));
        const entry = sweeps.find((item) => item.siteId === siteId);
        if (entry && onSelect) {
          onSelect(siteId, Date.parse(entry.sweep.points[index].startUtc));
        }
      });
    });
  };

  draw(context.metric ?? 'score');
}
