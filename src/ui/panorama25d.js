/**
 * Panorama 2.5D del horizonte lunar.
 *
 * Vanilla Canvas 2D port of SUNDIAL's SkyPanorama, adapted to the Vite app:
 *   - 360° azimuth x elevation panorama with the real LOLA horizon callback
 *   - 2.5D relief fill (gradient + ridge highlight + offset depth layer)
 *   - Sun path (24 h) and Earth libration loop (28 d)
 *   - current finite Sun/Earth disks, below-horizon labels and horizon ticks
 *
 * The class does not fetch data. The host passes a site with
 * site.horizonAt(azimuthDeg, mastHeightM) and the precomputed 28-day series.
 */

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const FONT_SANS = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
const FONT_MONO = '"IBM Plex Mono", ui-monospace, Consolas, monospace';
const PADDING = { top: 28, right: 18, bottom: 32, left: 52 };
const TERRAIN_BINS = 720;
const CARDINALS = [
  { az: 0, label: 'N' },
  { az: 90, label: 'E' },
  { az: 180, label: 'S' },
  { az: 270, label: 'W' }
];
const CARDINAL_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function normalizeAzimuth(value) {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function rgba(hex, alpha) {
  if (hex.length !== 7 || hex[0] !== '#') return hex;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cardinalName(az) {
  return CARDINAL_NAMES[Math.round(normalizeAzimuth(az) / 45) % 8];
}

export class Panorama25D {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.preferredHeight = options.height ?? 380;
    this.height = this.preferredHeight;
    this.colors = {
      sun: options.sunColor ?? '#e8b45c',
      earth: options.earthColor ?? '#8fb6d1',
      horizon: options.horizonColor ?? '#cfc2ae',
      terrainTop: options.terrainTop ?? '#4e443a',
      terrainBottom: options.terrainBottom ?? '#0a0807',
      ...options.colors
    };
    this.mode = 'zoom';
    this.diskScale = 'enlarged';
    this.site = null;
    this.sky = null;
    this.series = [];
    this.currentTimeMs = null;
    this.mastHeightM = 2;
    this.dateLabel = '';
    this.width = 900;
    this.dpr = 1;

    this.resize();
    this._observer = null;
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      this._observer = new ResizeObserver(() => this.resize());
      this._observer.observe(canvas.parentElement);
    }
    window.addEventListener('resize', () => this.resize());
  }

  setMode(mode) {
    this.mode = mode === 'full' ? 'full' : 'zoom';
    this.draw();
  }

  setDiskScale(scale) {
    this.diskScale = scale === 'true' ? 'true' : 'enlarged';
    this.draw();
  }

  update({ site, sky, series, currentTimeMs, mastHeightM, dateLabel }) {
    this.site = site ?? null;
    this.sky = sky ?? null;
    this.series = Array.isArray(series) ? series : [];
    this.currentTimeMs = currentTimeMs ?? null;
    this.mastHeightM = Number.isFinite(mastHeightM) ? mastHeightM : 2;
    this.dateLabel = dateLabel ?? '';
    this.draw();
  }

  resize() {
    const parent = this.canvas.parentElement;
    const width = parent ? Math.max(280, Math.round(parent.clientWidth)) : 900;
    const parentHeight = parent ? parent.clientHeight : 0;
    this.height = parentHeight > 120 ? parentHeight : this.preferredHeight;
    const dpr = window.devicePixelRatio || 1;
    this.width = width;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.draw();
  }

  elevationRange() {
    return this.mode === 'full' ? { min: -12, max: 90 } : { min: -10, max: 14 };
  }

  plotRect() {
    return {
      left: PADDING.left,
      top: PADDING.top,
      right: Math.max(PADDING.left + 140, this.width - PADDING.right),
      bottom: Math.max(PADDING.top + 100, this.height - PADDING.bottom)
    };
  }

  xFor(plot, az) {
    return plot.left + (normalizeAzimuth(az) / 360) * (plot.right - plot.left);
  }

  yFor(plot, range, elevation) {
    const frac = (elevation - range.min) / (range.max - range.min);
    return plot.bottom - frac * (plot.bottom - plot.top);
  }

  horizonAt(az) {
    if (!this.site || typeof this.site.horizonAt !== 'function') return 0;
    return this.site.horizonAt(normalizeAzimuth(az), this.mastHeightM);
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    if (!ctx) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!this.site) {
      this.drawEmpty();
      return;
    }

    const plot = this.plotRect();
    const range = this.elevationRange();
    const step = this.mode === 'full' ? 15 : 5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);
    ctx.clip();
    this.drawSky(plot, width);
    this.drawGrid(plot, range, step);
    this.drawPaths(plot, range);
    this.drawTerrain(plot, range);
    this.drawBodyHorizon(plot, range, 'sun');
    this.drawBodyHorizon(plot, range, 'earth');
    this.drawBody(plot, range, 'earth');
    this.drawBody(plot, range, 'sun');
    ctx.restore();

    this.drawAxes(plot, range, step);
    this.drawBorder(plot);
  }

  drawEmpty() {
    const ctx = this.ctx;
    const plot = this.plotRect();
    ctx.fillStyle = '#0b0a09';
    ctx.fillRect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);
    ctx.fillStyle = 'rgba(138,127,114,0.9)';
    ctx.font = `12px ${FONT_SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('Panorama LOLA no disponible', (plot.left + plot.right) / 2, (plot.top + plot.bottom) / 2);
  }

  drawSky(plot, width) {
    const ctx = this.ctx;
    const centerX = (plot.left + plot.right) / 2;
    const gradient = ctx.createRadialGradient(
      centerX,
      plot.top - 40,
      10,
      centerX,
      plot.bottom,
      Math.max(width, 540) * 0.9
    );
    gradient.addColorStop(0, '#2a241d');
    gradient.addColorStop(0.45, '#17130f');
    gradient.addColorStop(0.8, '#0e0c0a');
    gradient.addColorStop(1, '#0b0a09');
    ctx.fillStyle = gradient;
    ctx.fillRect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top);
  }

  drawGrid(plot, range, step) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 1;
    const first = Math.ceil(range.min / step) * step;
    for (let elevation = first; elevation <= range.max + 1e-9; elevation += step) {
      const y = Math.round(this.yFor(plot, range, elevation)) + 0.5;
      const isZero = Math.abs(elevation) < 1e-9;
      ctx.strokeStyle = isZero ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)';
      ctx.setLineDash(isZero ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    for (let azimuth = 0; azimuth <= 360; azimuth += 30) {
      const x = Math.round(this.xFor(plot, azimuth)) + 0.5;
      ctx.strokeStyle = azimuth % 90 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.055)';
      ctx.beginPath();
      ctx.moveTo(x, plot.top);
      ctx.lineTo(x, plot.bottom);
      ctx.stroke();
    }
    ctx.restore();
  }

  splitOnWrap(points, getAz) {
    const segments = [];
    let current = [];
    let previous = null;
    for (const point of points) {
      const az = getAz(point);
      if (previous !== null && Math.abs(az - previous) > 180) {
        if (current.length > 1) segments.push(current);
        current = [];
      }
      current.push(point);
      previous = az;
    }
    if (current.length > 1) segments.push(current);
    return segments;
  }

  drawPaths(plot, range) {
    if (!this.series.length) return;
    const ctx = this.ctx;
    const currentTime = this.currentTimeMs ?? this.series[0].timeMs;
    const sunStart = currentTime;
    const sunEnd = currentTime + 24 * 3_600_000;
    let sunPoints = this.series.filter((point) => point.timeMs >= sunStart && point.timeMs <= sunEnd);
    if (sunPoints.length < 2) sunPoints = this.series.slice(0, Math.min(24, this.series.length));
    const earthPoints = this.series;

    for (const segment of this.splitOnWrap(earthPoints, (point) => point.earthAz)) {
      this.strokePath(plot, range, segment, (point) => point.earthAz, (point) => point.earthEl, {
        color: rgba(this.colors.earth, 0.42),
        dash: [1.5, 3.5],
        width: 1.3
      });
    }
    for (const segment of this.splitOnWrap(sunPoints, (point) => point.sunAz)) {
      this.strokePath(plot, range, segment, (point) => point.sunAz, (point) => point.sunEl, {
        color: rgba(this.colors.sun, 0.62),
        dash: [6, 5],
        width: 1.4
      });
    }

    const first = earthPoints[0];
    const last = earthPoints[earthPoints.length - 1];
    if (first && last && Math.abs(last.earthAz - first.earthAz) < 40) {
      this.strokePath(plot, range, [last, first], (point) => point.earthAz, (point) => point.earthEl, {
        color: rgba(this.colors.earth, 0.28),
        dash: [1.5, 3.5],
        width: 1.2
      });
    }
  }

  strokePath(plot, range, points, getAz, getEl, style) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.setLineDash(style.dash);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    let started = false;
    for (const point of points) {
      const x = this.xFor(plot, getAz(point));
      const y = this.yFor(plot, range, getEl(point));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (started) ctx.stroke();
    ctx.restore();
  }

  drawTerrain(plot, range) {
    const ctx = this.ctx;
    const profile = new Float64Array(TERRAIN_BINS);
    for (let index = 0; index < TERRAIN_BINS; index += 1) {
      profile[index] = this.horizonAt((index * 360) / TERRAIN_BINS);
    }
    const silhouetteY = (index) => {
      const value = index === TERRAIN_BINS ? profile[0] : profile[index];
      return this.yFor(plot, range, clamp(value, range.min - 8, range.max));
    };
    const silhouetteX = (index) => this.xFor(plot, (index * 360) / TERRAIN_BINS);

    const gradient = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
    gradient.addColorStop(0, rgba(this.colors.terrainTop, 0.96));
    gradient.addColorStop(0.45, 'rgba(52,44,37,0.97)');
    gradient.addColorStop(1, this.colors.terrainBottom);

    // Main 2.5D relief fill.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(plot.left, plot.bottom);
    for (let index = 0; index <= TERRAIN_BINS; index += 1) {
      ctx.lineTo(silhouetteX(index), silhouetteY(index));
    }
    ctx.lineTo(plot.right, plot.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Depth layer: a slightly offset, darker silhouette reads as a near ridge.
    ctx.save();
    ctx.translate(0, 7);
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (let index = 0; index <= TERRAIN_BINS; index += 1) {
      const x = silhouetteX(index);
      const y = silhouetteY(index) + 2;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Ridge shading: light catches west-facing slopes.
    ctx.beginPath();
    for (let index = 1; index < TERRAIN_BINS; index += 1) {
      const previous = profile[index - 1];
      const next = profile[index + 1];
      const derivative = next - previous;
      if (Math.abs(derivative) < 0.08) continue;
      const x = silhouetteX(index);
      const y = silhouetteY(index);
      const height = clamp(Math.abs(derivative) * 2.4, 1, 7);
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height);
    }
    ctx.strokeStyle = 'rgba(255, 235, 210, 0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top edge highlight and crisp silhouette.
    ctx.beginPath();
    for (let index = 0; index <= TERRAIN_BINS; index += 1) {
      const x = silhouetteX(index);
      const y = silhouetteY(index);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(245,185,66,0.12)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.strokeStyle = rgba(this.colors.horizon, 0.75);
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }

  drawBodyHorizon(plot, range, body) {
    const sky = this.sky;
    if (!sky) return;
    const data = sky[body];
    const horizon = body === 'sun' ? sky.sunHorizonDeg : sky.earthHorizonDeg;
    if (!Number.isFinite(horizon)) return;
    const ctx = this.ctx;
    const x = this.xFor(plot, data.azDeg);
    const y = clamp(this.yFor(plot, range, horizon), plot.top + 1, plot.bottom - 1);
    const color = body === 'sun' ? this.colors.sun : this.colors.earth;
    ctx.save();
    ctx.strokeStyle = rgba(color, 0.95);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x + 7, y);
    ctx.stroke();
    ctx.strokeStyle = rgba(color, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 5);
    ctx.stroke();
    ctx.restore();
  }

  drawBody(plot, range, body) {
    const sky = this.sky;
    if (!sky) return;
    const data = sky[body];
    const horizon = body === 'sun' ? sky.sunHorizonDeg : sky.earthHorizonDeg;
    if (!Number.isFinite(data?.azDeg) || !Number.isFinite(data?.elDeg) || !Number.isFinite(horizon)) return;
    const ctx = this.ctx;
    const color = body === 'sun' ? this.colors.sun : this.colors.earth;
    const label = body === 'sun' ? 'Sol' : 'Tierra';
    const x = this.xFor(plot, data.azDeg);
    const y = this.yFor(plot, range, data.elDeg);
    const pixelsPerDegree = (plot.bottom - plot.top) / (range.max - range.min);
    const trueRadius = Math.max(0.1, data.angularRadiusDeg ?? 0.5) * pixelsPerDegree;
    const radius =
      this.diskScale === 'enlarged'
        ? Math.max(body === 'sun' ? 5 : 4, trueRadius)
        : Math.max(0.8, trueRadius);
    const below = data.elDeg < horizon;

    ctx.save();
    if (below) ctx.globalAlpha = 0.42;

    const glow = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 3.4);
    glow.addColorStop(0, rgba(color, below ? 0.12 : 0.34));
    glow.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.4, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    if (below) {
      ctx.fillStyle = rgba(color, 0.18);
      ctx.fill();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = rgba(color, 0.9);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = color;
      ctx.fill();
      const highlight = ctx.createRadialGradient(
        x - radius * 0.32,
        y - radius * 0.34,
        0,
        x - radius * 0.32,
        y - radius * 0.34,
        radius * 1.2
      );
      highlight.addColorStop(0, 'rgba(255,255,255,0.45)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fill();
      ctx.strokeStyle = rgba(color, 0.9);
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    const compact = this.width < 480;
    const text = below ? (compact ? `${label} ↓` : `${label} · bajo el horizonte`) : label;
    ctx.font = `600 ${compact ? 9.5 : 10.5}px ${FONT_SANS}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(color, 0.95);
    const labelY = clamp(y, plot.top + 9, plot.bottom - 9);
    if (plot.right - (x + radius) > 108) {
      ctx.textAlign = 'left';
      ctx.fillText(text, x + radius + 7, labelY);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(text, x - radius - 7, labelY);
    }
    ctx.restore();
  }

  drawAxes(plot, range, step) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `10px ${FONT_MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    const first = Math.ceil(range.min / step) * step;
    for (let elevation = first; elevation <= range.max + 1e-9; elevation += step) {
      const y = this.yFor(plot, range, elevation);
      if (y < plot.top - 2 || y > plot.bottom + 2) continue;
      const isZero = Math.abs(elevation) < 1e-9;
      ctx.fillStyle = isZero ? 'rgba(232,236,244,0.78)' : 'rgba(152,162,179,0.7)';
      ctx.fillText(`${elevation > 0 ? '+' : ''}${Math.round(elevation)}°`, plot.left - 9, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 11px ${FONT_SANS}`;
    ctx.fillStyle = 'rgba(232,236,244,0.88)';
    ctx.strokeStyle = 'rgba(232,236,244,0.4)';
    ctx.lineWidth = 1;
    for (const cardinal of CARDINALS) {
      const tickX = clamp(this.xFor(plot, cardinal.az), plot.left, plot.right);
      ctx.fillText(cardinal.label, clamp(tickX, plot.left + 8, plot.right - 8), plot.top - 10);
      ctx.beginPath();
      ctx.moveTo(tickX, plot.top);
      ctx.lineTo(tickX, plot.top - 5);
      ctx.stroke();
    }

    ctx.font = `10px ${FONT_MONO}`;
    ctx.fillStyle = 'rgba(152,162,179,0.7)';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let azimuth = 0; azimuth <= 360; azimuth += 60) {
      const rawX = clamp(this.xFor(plot, azimuth), plot.left, plot.right);
      ctx.fillText(`${azimuth}°`, clamp(rawX, plot.left + 12, plot.right - 12), plot.bottom + 16);
      ctx.beginPath();
      ctx.moveTo(rawX, plot.bottom);
      ctx.lineTo(rawX, plot.bottom + 4);
      ctx.stroke();
    }

    if (this.sky?.sun) {
      ctx.textAlign = 'left';
      ctx.font = `9px ${FONT_SANS}`;
      ctx.fillStyle = 'rgba(245,185,66,0.9)';
      ctx.fillText(`${cardinalName(this.sky.sun.azDeg)} · Sol`, plot.left + 4, plot.top + 12);
    }
    if (this.sky?.earth) {
      ctx.textAlign = 'right';
      ctx.font = `9px ${FONT_SANS}`;
      ctx.fillStyle = 'rgba(90,169,230,0.9)';
      ctx.fillText(`Tierra · ${cardinalName(this.sky.earth.azDeg)}`, plot.right - 4, plot.top + 12);
    }
    ctx.restore();
  }

  drawBorder(plot) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      plot.left + 0.5,
      plot.top + 0.5,
      plot.right - plot.left - 1,
      plot.bottom - plot.top - 1
    );
    ctx.restore();
  }

  destroy() {
    this._observer?.disconnect();
    this._observer = null;
  }
}
