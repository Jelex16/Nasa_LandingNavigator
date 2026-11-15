function formatDateUtc(ms) {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function badgeClass(analysis) {
  if (analysis.site.role === 'reference') return 'badge-reference';
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
    label: out ? '0/100 · fuera de tolerancia' : `${pct}/100`,
    title: out
      ? `Corte DTE ${metrics.gMaxHours.toFixed(1)} h ≥ tolerancia ${profile.gMaxTolHours} h: 0/100, fuera de tolerancia. No falta el dato.`
      : `Corte DTE ${metrics.gMaxHours.toFixed(1)} h dentro de la tolerancia de ${profile.gMaxTolHours} h: ${pct}/100.`
  };
}

export function renderComparisonTable(containerElement, analyses, context, onSelectSite) {
  if (!containerElement) return;
  const profile = context.profile;
  const rows = analyses
    .map((analysis) => {
      const site = analysis.site;
      const metrics = analysis.metrics;
      const comps = analysis.components;
      const isReference = site.role === 'reference';
      const statusShort = analysis.status.split(' ')[0];
      const scoreLabel = isReference ? 'REFERENCIA' : `${statusShort} · ${analysis.scorePercent}%`;
      const comms = commsState(metrics, profile, comps);
      return `
        <tr class="comparison-row" data-site-id="${site.id}">
          <td>
            <button class="site-cell-btn" type="button" data-site-id="${site.id}" aria-label="Seleccionar ${site.name}">
              <span class="site-cell-name"><strong>${site.name}</strong></span>
              <span class="site-cell-program">${site.program} · ${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E</span>
              <span class="site-cell-quality">${site.dataQuality} · ${site.ephemSource === 'jpl_horizons' ? 'Horizons' : 'IAU 2000'}</span>
            </button>
          </td>
          <td><span class="badge ${badgeClass(analysis)}">${scoreLabel}</span></td>
          <td class="${termClass(comps.energy)}">
            <strong>${(metrics.energyWhM2 / 1000).toFixed(1)} kWh/m²</strong>
            <div class="site-cell-meta">${Math.round(comps.energy * 100)}/100 · req ${profile.energyReqKWhM2}</div>
          </td>
          <td class="${limitClass(metrics.dMaxHours, profile.dMaxTolHours)}">
            <strong>${metrics.dMaxHours.toFixed(1)} h</strong>
            <div class="site-cell-meta">tol ${profile.dMaxTolHours} h · ${Math.round(comps.dark * 100)}/100</div>
          </td>
          <td class="${termClass(comps.dte)}">
            <strong>${metrics.dteCenterPct.toFixed(0)}%</strong>
            <div class="site-cell-meta">req ${profile.dteReqPct}% · ${Math.round(comps.dte * 100)}/100</div>
            <div class="site-cell-meta">disco parcial ${metrics.dtePartialPct.toFixed(0)}%</div>
          </td>
          <td class="comms-cell ${comms.className}" title="${comms.title}" aria-label="${comms.title}">
            <strong>${metrics.gMaxHours.toFixed(1)} h</strong>
            <div class="site-cell-meta">tol ${profile.gMaxTolHours} h · ${comms.label}</div>
          </td>
          <td class="${site.maxSlopeDeg < 10 ? 'metric-good' : site.maxSlopeDeg < 20 ? 'metric-warn' : 'metric-danger'}">
            <strong>${site.maxSlopeDeg.toFixed(1)}°</strong>
            <div class="site-cell-meta">${site.elevationKm >= 0 ? '+' : ''}${site.elevationKm.toFixed(2)} km</div>
          </td>
        </tr>
      `;
    })
    .join('');

  containerElement.innerHTML = `
    <div class="comparison-card">
      <div class="comparison-header">
        <div class="title-with-badge">
          <h3>Matriz comparativa de sitios de alunizaje</h3>
          <span class="matrix-badge">LOLA + Horizons · modelo transparente</span>
        </div>
        <div class="comparison-context">
          <span><b>Ventana:</b> ${context.windowDays} días desde ${formatDateUtc(context.startMs)}</span>
          <span><b>Perfil:</b> ${profile.name}</span>
          <span><b>Panel:</b> ${context.panelLabel}</span>
          <span><b>Mástil:</b> ${context.mastHeightM.toFixed(1)} m</span>
        </div>
        <p class="comparison-note">
          Todas las filas usan la misma fecha de inicio, ventana, perfil, panel y altura de mástil que el panel principal.
          El score es un índice de decisión, no una certificación de aterrizaje. Haz clic en una fila para seleccionar el sitio.
        </p>
      </div>

      <div class="table-responsive">
        <table class="comparison-table">
          <thead>
            <tr>
              <th scope="col">Sitio / datos</th>
              <th scope="col">Score</th>
              <th scope="col">Energía (28 d)</th>
              <th scope="col">Eclipse continuo</th>
              <th scope="col">DTE centro</th>
              <th scope="col">Comms (corte DTE)</th>
              <th scope="col">Pendiente local</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <p class="comparison-footnote">
        <b>Comms</b> = 1 − corte DTE máximo / tolerancia. Un 0/100 indica que el corte iguala o
        supera la tolerancia del perfil, no que falte el dato. El corte se mide dentro de la
        ventana de 28 días; si dura más, el valor es una cota inferior. DTE usa el centro de la
        Tierra; el disco parcial se muestra como referencia y no entra en el score. Cambia el
        perfil a “Relé / store-and-forward” para ver valores distintos de 0.
      </p>
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
