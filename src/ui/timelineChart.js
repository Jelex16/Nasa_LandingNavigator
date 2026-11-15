import { getLanguage, t } from '../i18n.js';


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

    this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
    this.canvas.addEventListener('click', () => this.handleClick());
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

  handleMouseMove(event) {
    if (!this.series || this.series.length === 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) * this.dpr;
    if (mouseX >= this.padding.left && mouseX <= this.padding.left + this.plotWidth) {
      const fraction = (mouseX - this.padding.left) / this.plotWidth;
      const idx = Math.min(
        this.series.length - 1,
        Math.max(0, Math.round(fraction * (this.series.length - 1)))
      );
      this.hoverPoint = {
        point: this.series[idx],
        canvasX: mouseX,
        canvasY: (event.clientY - rect.top) * this.dpr
      };
      this.draw();
    } else {
      this.hoverPoint = null;
      this.draw();
    }
  }

  handleClick() {
    if (!this.hoverPoint || !this.onTimeSelect) return;
    this.onTimeSelect(new Date(this.hoverPoint.point.timeMs));
  }

  horizonFor(point, body) {
    if (Number.isFinite(point[`${body}Horizon`])) return point[`${body}Horizon`];
    if (this.site?.horizonProfile) {
      const az = body === 'sun' ? point.sunAz : point.earthAz;
      return this.site.horizonProfile(az);
    }
    return 0;
  }

  drawVisibilityBand(ctx, points, timeToX, elToY, body, fillStyle) {
    const visible = (point) =>
      body === 'sun' ? point.sunlit ?? point.sunEl > this.horizonFor(point, 'sun') : point.dteCenter ?? point.earthEl > this.horizonFor(point, 'earth');
    const elevation = (point) => (body === 'sun' ? point.sunEl : point.earthEl);
    const horizon = (point) => this.horizonFor(point, body);
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    let started = false;
    let lastX = 0;
    let lastY = 0;
    for (const point of points) {
      const x = timeToX(point.timeMs);
      const y = elToY(elevation(point));
      const baseY = elToY(horizon(point));
      lastX = x;
      lastY = baseY;
      if (visible(point)) {
        if (!started) {
          ctx.moveTo(x, baseY);
          started = true;
        }
        ctx.lineTo(x, y);
      } else if (started) {
        ctx.lineTo(x, baseY);
        started = false;
      }
    }
    if (started) ctx.lineTo(lastX, lastY);
    ctx.closePath();
    ctx.fill();
  }

  drawHorizonLine(ctx, points, timeToX, elToY, body, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2 * this.dpr;
    ctx.setLineDash([3 * this.dpr, 3 * this.dpr]);
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = timeToX(point.timeMs);
      const y = elToY(this.horizonFor(point, body));
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    ctx.clearRect(0, 0, width, this.canvas.height);
    if (!this.series || this.series.length < 2) return;

    let minEl = -6;
    let maxEl = 10;
    for (const point of this.series) {
      minEl = Math.min(minEl, point.sunEl, point.earthEl, this.horizonFor(point, 'sun'), this.horizonFor(point, 'earth'));
      maxEl = Math.max(maxEl, point.sunEl, point.earthEl, this.horizonFor(point, 'sun'), this.horizonFor(point, 'earth'));
    }
    minEl = Math.floor(minEl - 1);
    maxEl = Math.ceil(maxEl + 1);

    const timeStart = this.series[0].timeMs;
    const timeEnd = this.series[this.series.length - 1].timeMs;
    const timeSpan = Math.max(1, timeEnd - timeStart);
    const timeToX = (ms) => this.padding.left + ((ms - timeStart) / timeSpan) * this.plotWidth;
    const elToY = (el) => this.padding.top + (1 - (el - minEl) / (maxEl - minEl)) * this.plotHeight;

    ctx.font = `${10 * this.dpr}px monospace`;
    ctx.fillStyle = 'rgba(138, 127, 114, 0.95)';
    ctx.strokeStyle = 'rgba(242, 236, 228, 0.07)';
    ctx.lineWidth = 1 * this.dpr;
    const stepCandidates = [1, 2, 5, 10, 20, 50];
    const idealStep = (maxEl - minEl) / 5;
    const stepEl = stepCandidates.find((step) => step >= idealStep) ?? 50;
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

    const zeroY = elToY(0);
    ctx.strokeStyle = 'rgba(242, 236, 228, 0.24)';
    ctx.lineWidth = 1.5 * this.dpr;
    ctx.beginPath();
    ctx.moveTo(this.padding.left, zeroY);
    ctx.lineTo(this.padding.left + this.plotWidth, zeroY);
    ctx.stroke();

    this.drawHorizonLine(ctx, this.series, timeToX, elToY, 'sun', 'rgba(176,138,90,0.7)');
    this.drawHorizonLine(ctx, this.series, timeToX, elToY, 'earth', 'rgba(143,182,209,0.45)');
    this.drawVisibilityBand(ctx, this.series, timeToX, elToY, 'sun', 'rgba(232,180,92,0.16)');
    this.drawVisibilityBand(ctx, this.series, timeToX, elToY, 'earth', 'rgba(143,182,209,0.1)');

    ctx.strokeStyle = '#8fb6d1';
    ctx.lineWidth = 2 * this.dpr;
    ctx.beginPath();
    this.series.forEach((point, index) => {
      const x = timeToX(point.timeMs);
      const y = elToY(point.earthEl);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#e8b45c';
    ctx.lineWidth = 2.2 * this.dpr;
    ctx.beginPath();
    this.series.forEach((point, index) => {
      const x = timeToX(point.timeMs);
      const y = elToY(point.sunEl);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    if (this.currentTimeMs) {
      const cursorX = timeToX(this.currentTimeMs);
      if (cursorX >= this.padding.left && cursorX <= this.padding.left + this.plotWidth) {
        ctx.strokeStyle = '#f2ece4';
        ctx.lineWidth = 2 * this.dpr;
        ctx.beginPath();
        ctx.moveTo(cursorX, this.padding.top);
        ctx.lineTo(cursorX, this.padding.top + this.plotHeight);
        ctx.stroke();
        ctx.fillStyle = '#f2ece4';
        ctx.beginPath();
        ctx.moveTo(cursorX - 5 * this.dpr, this.padding.top - 2);
        ctx.lineTo(cursorX + 5 * this.dpr, this.padding.top - 2);
        ctx.lineTo(cursorX, this.padding.top + 5 * this.dpr);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(138, 127, 114, 0.95)';
    ctx.font = `${9 * this.dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const numTimeMarks = 8;
    for (let index = 0; index < numTimeMarks; index += 1) {
      const frac = index / (numTimeMarks - 1);
      const ms = timeStart + frac * timeSpan;
      const date = new Date(ms);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const label = getLanguage() === 'en' ? `${month}/${day}` : `${day}/${month}`;
      ctx.fillText(label, timeToX(ms), this.padding.top + this.plotHeight + 6 * this.dpr);
    }

    if (this.hoverPoint) {
      const point = this.hoverPoint.point;
      const date = new Date(point.timeMs);
      const x = this.hoverPoint.canvasX;
      const sunHorizon = this.horizonFor(point, 'sun');
      const earthHorizon = this.horizonFor(point, 'earth');

      ctx.strokeStyle = 'rgba(242,236,228,0.32)';
      ctx.lineWidth = 1 * this.dpr;
      ctx.setLineDash([2 * this.dpr, 2 * this.dpr]);
      ctx.beginPath();
      ctx.moveTo(x, this.padding.top);
      ctx.lineTo(x, this.padding.top + this.plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      const tipW = 220 * this.dpr;
      const tipH = 98 * this.dpr;
      let tipX = x + 10 * this.dpr;
      if (tipX + tipW > this.canvas.width - 10) tipX = x - tipW - 10 * this.dpr;
      const tipY = this.padding.top + 10 * this.dpr;
      ctx.fillStyle = 'rgba(26,23,21,0.97)';
      ctx.strokeStyle = '#453c34';
      ctx.lineWidth = 1.2 * this.dpr;
      ctx.beginPath();
      ctx.roundRect(tipX, tipY, tipW, tipH, 3 * this.dpr);
      ctx.fill();
      ctx.stroke();

      const dateStr = `${date.toISOString().replace('T', ' ').slice(0, 16)} UTC`;
      ctx.fillStyle = '#f2ece4';
      ctx.font = `bold ${10 * this.dpr}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(dateStr, tipX + 8 * this.dpr, tipY + 16 * this.dpr);
      ctx.fillStyle = '#e8b45c';
      ctx.font = `${9.5 * this.dpr}px monospace`;
      ctx.fillText(
        t('timeline.sun', {
          el: point.sunEl.toFixed(2),
          horizon: sunHorizon.toFixed(2)
        }),
        tipX + 8 * this.dpr,
        tipY + 32 * this.dpr
      );
      ctx.fillStyle = '#8fb6d1';
      ctx.fillText(
        t('timeline.earth', {
          el: point.earthEl.toFixed(2),
          horizon: earthHorizon.toFixed(2)
        }),
        tipX + 8 * this.dpr,
        tipY + 48 * this.dpr
      );
      ctx.fillStyle = '#7fa96b';
      ctx.fillText(
        t('timeline.fraction', {
          sun: (point.sunVisibleFraction * 100).toFixed(0),
          earth: (point.earthVisibleFraction * 100).toFixed(0)
        }),
        tipX + 8 * this.dpr,
        tipY + 64 * this.dpr
      );
      ctx.fillStyle = '#b3a99c';
      ctx.fillText(
        t('timeline.energy', { value: point.energyWm2?.toFixed(0) ?? '—' }),
        tipX + 8 * this.dpr,
        tipY + 80 * this.dpr
      );
    }
  }
}
