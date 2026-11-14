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
      return `
        <tr class="comparison-row" data-site-id="${site.id}" tabindex="0" role="button"
            aria-label="Seleccionar ${site.name}">
          <td>
            <div class="site-cell-name"><strong>${site.name}</strong></div>
            <div class="site-cell-program">${site.program} · ${Math.abs(site.lat).toFixed(2)}°${site.lat < 0 ? 'S' : 'N'}, ${site.lon.toFixed(2)}°E</div>
            <div class="site-cell-quality">${site.dataQuality} · ${site.ephemSource === 'jpl_horizons' ? 'Horizons' : 'IAU 2000'}</div>
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
          </td>
          <td class="${limitClass(metrics.gMaxHours, profile.gMaxTolHours)}">
            <strong>${metrics.gMaxHours.toFixed(1)} h</strong>
            <div class="site-cell-meta">tol ${profile.gMaxTolHours} h · ${Math.round(comps.comms * 100)}/100</div>
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
              <th>Sitio / datos</th>
              <th>Score</th>
              <th>Energía (28 d)</th>
              <th>Eclipse continuo</th>
              <th>DTE centro</th>
              <th>Corte DTE</th>
              <th>Pendiente local</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  containerElement.querySelectorAll('.comparison-row').forEach((row) => {
    const select = () => {
      const siteId = row.getAttribute('data-site-id');
      if (siteId && onSelectSite) onSelectSite(siteId);
    };
    row.addEventListener('click', select);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select();
      }
    });
  });
}
