/**
 * Multi-Site Trade-Off Comparison View.
 * Enables mission planners to rapidly compare candidate sites side-by-side.
 */

export function renderComparisonTable(containerElement, siteEvaluations, onSelectSite) {
  if (!containerElement) return;

  const html = `
    <div class="comparison-card">
      <div class="comparison-header">
        <div class="title-with-badge">
          <h3>Matriz Comparativa de Sitios de Alunizaje (Trade-Off Matrix)</h3>
          <span class="matrix-badge">Evaluación Red Neuronal LOLA + Horizons</span>
        </div>
        <p class="comparison-subtitle">
          Análisis comparativo multi-criterio para selección de sitios de contingencia ante retrasos de lanzamiento o restricciones térmicas y de telemetría.
        </p>
      </div>

      <div class="table-responsive">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Sitio / Misión</th>
              <th>Puntuación Red Neuronal</th>
              <th>Pendiente Máx. (LOLA)</th>
              <th>Ventana Solar (%)</th>
              <th>Comms Tierra DTE (%)</th>
              <th>Brecha Sombra Máx.</th>
              <th>Dist. Hielo Volátil</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${siteEvaluations
              .map((item) => {
                const s = item.site;
                const e = item.evaluation;
                const statusBadge =
                  e.scorePercent >= 75
                    ? `<span class="badge badge-safe">GO (${e.scorePercent}%)</span>`
                    : e.scorePercent >= 50
                    ? `<span class="badge badge-warning">CAUTION (${e.scorePercent}%)</span>`
                    : `<span class="badge badge-danger">NO-GO (${e.scorePercent}%)</span>`;

                const slopeClass = s.maxSlopeDeg < 8 ? 'metric-good' : s.maxSlopeDeg < 12 ? 'metric-warn' : 'metric-danger';
                const solarClass = item.solarCoverage > 0.65 ? 'metric-good' : item.solarCoverage > 0.4 ? 'metric-warn' : 'metric-danger';
                const commClass = item.earthCoverage > 0.75 ? 'metric-good' : item.earthCoverage > 0.4 ? 'metric-warn' : 'metric-danger';

                return `
                <tr class="comparison-row" data-site-id="${s.id}">
                  <td>
                    <div class="site-cell-name"><strong>${s.name}</strong></div>
                    <div class="site-cell-program">${s.program} (${s.lat.toFixed(1)}°, ${s.lon.toFixed(1)}°)</div>
                  </td>
                  <td>${statusBadge}</td>
                  <td class="${slopeClass}"><strong>${s.maxSlopeDeg.toFixed(1)}°</strong> <small>(avg ${s.avgSlopeDeg.toFixed(1)}°)</small></td>
                  <td class="${solarClass}"><strong>${Math.round(item.solarCoverage * 100)}%</strong></td>
                  <td class="${commClass}"><strong>${Math.round(item.earthCoverage * 100)}%</strong></td>
                  <td>${Math.round(item.maxShadowGapHours)}h</td>
                  <td><strong>${s.distToIceTrapKm.toFixed(1)} km</strong></td>
                  <td>
                    <button class="btn btn-sm btn-outline select-site-btn" data-site-id="${s.id}">
                      Seleccionar
                    </button>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  // Add click handlers
  containerElement.querySelectorAll('.select-site-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const siteId = e.currentTarget.getAttribute('data-site-id');
      if (onSelectSite) onSelectSite(siteId);
    });
  });
}
