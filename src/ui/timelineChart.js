/**
 * Interactive Elevation Timeline Chart.
 * Displays Sun and Earth elevation curves over time with:
 * - Local topographic horizon cutoff
 * - Solar power generation daylight windows (shaded gold)
 * - Direct-to-Earth (DTE) communication visibility windows (shaded cyan)
 * - Interactive synchronized current time cursor
 */

export class TimelineChart {
  constructor(canvasElement, onTimeSelectCallback) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onTimeSelect = onTimeSelectCallback;
    this.series = [];
    this.site = null;
    this.currentTimeMs = null;
    this.hoverPoint = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse / Touch interaction
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPoint = null;
      this.draw();
    });
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 600;
    this.height = rect.height || 180;
    this.dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.padding = {
      left: 45 * this.dpr,
      right: 20 * this.dpr,
      top: 20 * this.dpr,
      bottom: 25 * this.dpr
    };

    this.plotWidth = this.canvas.width - this.padding.left - this.padding.right;
    this.plotHeight = this.canvas.height - this.padding.top - this.padding.bottom;

    this.draw();
  }

  update(series, site, currentTimeMs) {
    this.series = series;
    this.site = site;
    this.currentTimeMs = currentTimeMs;
    this.draw();
  }

  handleMouseMove(e) {
    if (!this.series || this.series.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * this.dpr;

    if (mouseX >= this.padding.left && mouseX <= this.padding.left + this.plotWidth) {
      const fraction = (mouseX - this.padding.left) / this.plotWidth;
      const idx = Math.min(this.series.length - 1, Math.max(0, Math.round(fraction * (this.series.length - 1))));
      this.hoverPoint = {
        point: this.series[idx],
        canvasX: mouseX,
        canvasY: (e.clientY - rect.top) * this.dpr
      };
      this.draw();
    } else {
      this.hoverPoint = null;
      this.draw();
    }
  }

  handleClick(e) {
    if (!this.hoverPoint || !this.onTimeSelect) return;
    this.onTimeSelect(new Date(this.hoverPoint.point.timeMs));
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!this.series || this.series.length === 0) return;

    // Determine Y-range (min/max elevation with padding)
    let minEl = -4;
    let maxEl = 8;
    this.series.forEach((pt) => {
      minEl = Math.min(minEl, pt.sunEl, pt.earthEl);
      maxEl = Math.max(maxEl, pt.sunEl, pt.earthEl);
    });
    minEl = Math.floor(minEl - 1);
    maxEl = Math.ceil(maxEl + 1);

    const timeStart = this.series[0].timeMs;
    const timeEnd = this.series[this.series.length - 1].timeMs;
    const timeSpan = timeEnd - timeStart;

    const timeToX = (tMs) => this.padding.left + ((tMs - timeStart) / timeSpan) * this.plotWidth;
    const elToY = (el) => this.padding.top + (1 - (el - minEl) / (maxEl - minEl)) * this.plotHeight;

    // Draw Grid Lines & Elevation Labels
    ctx.font = `${10 * this.dpr}px monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * this.dpr;

    const stepEl = maxEl - minEl > 20 ? 5 : 2;
    for (let el = Math.ceil(minEl / stepEl) * stepEl; el <= maxEl; el += stepEl) {
      const y = elToY(el);
      ctx.beginPath();
      ctx.moveTo(this.padding.left, y);
      ctx.lineTo(this.padding.left + this.plotWidth, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${el}°`, this.padding.left - 6 * this.dpr, y);
    }

    // Zero-degree Horizon line (Highlighted)
    const zeroY = elToY(0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5 * this.dpr;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, zeroY);
    ctx.lineTo(this.padding.left + this.plotWidth, zeroY);
    ctx.stroke();

    // Topographic horizon cutoff line for Sun azimuth
    if (this.site && this.site.horizonProfile) {
      ctx.strokeStyle = 'rgba(255, 64, 129, 0.5)';
      ctx.lineWidth = 1.2 * this.dpr;
      ctx.setLineDash([3 * this.dpr, 3 * this.dpr]);
      ctx.beginPath();
      this.series.forEach((pt, i) => {
        const topoEl = this.site.horizonProfile(pt.sunAz);
        const x = timeToX(pt.timeMs);
        const y = elToY(topoEl);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Shaded Sunlight Window (Area where Sun > local terrain)
    ctx.fillStyle = 'rgba(255, 213, 79, 0.12)';
    ctx.beginPath();
    let inSunlight = false;
    this.series.forEach((pt, i) => {
      const topoEl = this.site && this.site.horizonProfile ? this.site.horizonProfile(pt.sunAz) : 0;
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.sunEl);
      const isUp = pt.sunEl > topoEl;

      if (isUp) {
        if (!inSunlight) {
          ctx.moveTo(x, zeroY);
          inSunlight = true;
        }
        ctx.lineTo(x, y);
      } else {
        if (inSunlight) {
          ctx.lineTo(x, zeroY);
          inSunlight = false;
        }
      }
    });
    if (inSunlight) {
      ctx.lineTo(timeToX(timeEnd), zeroY);
    }
    ctx.fill();

    // Earth Elevation Curve (Cyan)
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2 * this.dpr;
    ctx.beginPath();
    this.series.forEach((pt, i) => {
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.earthEl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Sun Elevation Curve (Gold)
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.2 * this.dpr;
    ctx.beginPath();
    this.series.forEach((pt, i) => {
      const x = timeToX(pt.timeMs);
      const y = elToY(pt.sunEl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Current Time Cursor
    if (this.currentTimeMs) {
      const cursorX = timeToX(this.currentTimeMs);
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2 * this.dpr;
      ctx.beginPath();
      ctx.moveTo(cursorX, this.padding.top);
      ctx.lineTo(cursorX, this.padding.top + this.plotHeight);
      ctx.stroke();

      // Top triangle indicator
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(cursorX - 5 * this.dpr, this.padding.top - 2);
      ctx.lineTo(cursorX + 5 * this.dpr, this.padding.top - 2);
      ctx.lineTo(cursorX, this.padding.top + 5 * this.dpr);
      ctx.fill();
    }

    // Time Axis Labels (Every ~3-5 days)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = `${9 * this.dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const numTimeMarks = 6;
    for (let i = 0; i < numTimeMarks; i++) {
      const frac = i / (numTimeMarks - 1);
      const tMs = timeStart + frac * timeSpan;
      const d = new Date(tMs);
      const x = timeToX(tMs);
      const label = `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
      ctx.fillText(label, x, this.padding.top + this.plotHeight + 6 * this.dpr);
    }

    // Hover Tooltip
    if (this.hoverPoint) {
      const pt = this.hoverPoint.point;
      const d = new Date(pt.timeMs);
      const x = this.hoverPoint.canvasX;

      // Vertical guide
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1 * this.dpr;
      ctx.setLineDash([2 * this.dpr, 2 * this.dpr]);
      ctx.beginPath();
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.padding.top + this.plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip Card
      const dateStr = d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
      const sunStr = `Sol: ${pt.sunEl.toFixed(2)}° (Az: ${pt.sunAz.toFixed(1)}°)`;
      const earthStr = `Tierra: ${pt.earthEl.toFixed(2)}° (Az: ${pt.earthAz.toFixed(1)}°)`;
      const powerStr = `Eficiencia Solar: ${Math.round(pt.powerEff * 100)}%`;

      const tipW = 200 * this.dpr;
      const tipH = 75 * this.dpr;
      let tipX = x + 10 * this.dpr;
      if (tipX + tipW > this.canvas.width - 10) {
        tipX = x - tipW - 10 * this.dpr;
      }
      const tipY = this.padding.top + 10 * this.dpr;

      ctx.fillStyle = 'rgba(10, 16, 28, 0.92)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2 * this.dpr;
      ctx.beginPath();
      ctx.roundRect(tipX, tipY, tipW, tipH, 6 * this.dpr);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${10 * this.dpr}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(dateStr, tipX + 8 * this.dpr, tipY + 16 * this.dpr);

      ctx.fillStyle = '#ffd54f';
      ctx.font = `${9.5 * this.dpr}px monospace`;
      ctx.fillText(sunStr, tipX + 8 * this.dpr, tipY + 32 * this.dpr);

      ctx.fillStyle = '#00e5ff';
      ctx.fillText(earthStr, tipX + 8 * this.dpr, tipY + 47 * this.dpr);

      ctx.fillStyle = '#69f0ae';
      ctx.fillText(powerStr, tipX + 8 * this.dpr, tipY + 62 * this.dpr);
    }
  }
}
