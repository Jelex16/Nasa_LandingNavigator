import { t } from '../i18n.js';

/**
 * Polar Sky Dome Radar Visualization.
 * Projects the local lunar sky in stereographic/polar coordinates:
 * - Center = Zenith (90° elevation)
 * - Outer boundary = Horizon / Sub-horizon (-2° to 0°)
 * - Renders local LOLA topographic obstruction polygon (crater rims, massifs)
 * - Renders Sun path and live position
 * - Renders Earth libration path and live position
 */

export class SkyDomeRadar {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.site = null;
    this.ephemeris = null;
    this.series = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 320;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.radius = (size * this.dpr) / 2 - 24 * this.dpr;
    this.centerX = (size * this.dpr) / 2;
    this.centerY = (size * this.dpr) / 2;
    this.draw();
  }

  /**
   * Converts azimuth (0-360 deg, 0=North, 90=East) and elevation (-2 to 90 deg)
   * to canvas Cartesian (x, y) coordinates on the polar radar.
   */
  azElToXY(azDeg, elDeg) {
    // Elevation mapping: 90 deg -> r = 0 (zenith), -2 deg -> r = this.radius
    // Clamped between -2 and 90
    const clampedEl = Math.max(-2, Math.min(90, elDeg));
    const r = this.radius * (1 - (clampedEl - (-2)) / (90 - (-2)));

    // Azimuth: 0 = North (top, -Y), 90 = East (+X), 180 = South (+Y), 270 = West (-X)
    const rad = (azDeg - 90) * (Math.PI / 180);
    const x = this.centerX + r * Math.cos(rad);
    const y = this.centerY + r * Math.sin(rad);
    return { x, y, r };
  }

  update(site, ephemeris, series = []) {
    this.site = site;
    this.ephemeris = ephemeris;
    this.series = series;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!this.site) return;

    // Background sky gradient
    const skyGrad = ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, this.radius);
    skyGrad.addColorStop(0, '#17130f');
    skyGrad.addColorStop(0.8, '#100d0a');
    skyGrad.addColorStop(1, '#0b0a09');
    ctx.fillStyle = skyGrad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Concentric elevation rings
    const elRings = [0, 10, 20, 45];
    ctx.lineWidth = 1 * this.dpr;

    elRings.forEach((el) => {
      const { r } = this.azElToXY(0, el);
      ctx.strokeStyle = el === 0 ? 'rgba(143, 182, 209, 0.35)' : 'rgba(242, 236, 228, 0.09)';
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Elevation label
      ctx.fillStyle = 'rgba(138, 127, 114, 0.9)';
      ctx.font = `${9 * this.dpr}px monospace`;
      ctx.fillText(`${el}°`, this.centerX + 4 * this.dpr, this.centerY - r + 10 * this.dpr);
    });

    // Crosshairs & Cardinal directions
    const cardinal = [
      { name: 'N', az: 0 },
      { name: 'E', az: 90 },
      { name: 'S', az: 180 },
      { name: 'W', az: 270 }
    ];

    ctx.strokeStyle = 'rgba(242, 236, 228, 0.1)';
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY - this.radius);
    ctx.lineTo(this.centerX, this.centerY + this.radius);
    ctx.moveTo(this.centerX - this.radius, this.centerY);
    ctx.lineTo(this.centerX + this.radius, this.centerY);
    ctx.stroke();

    ctx.fillStyle = '#8a7f72';
    ctx.font = `bold ${11 * this.dpr}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    cardinal.forEach((c) => {
      const rad = (c.az - 90) * (Math.PI / 180);
      const lx = this.centerX + (this.radius + 14 * this.dpr) * Math.cos(rad);
      const ly = this.centerY + (this.radius + 14 * this.dpr) * Math.sin(rad);
      ctx.fillText(c.name, lx, ly);
    });

    // Draw Topographic Horizon Obstruction Mask (LOLA)
    if (this.site.horizonProfile) {
      ctx.strokeStyle = '#b08a5a';
      ctx.lineWidth = 1.5 * this.dpr;

      // Obstruction mask: fill the region between the terrain profile and the
      // outer radar boundary (lower elevations), leaving the visible sky clear.
      ctx.fillStyle = 'rgba(46, 38, 30, 0.55)';
      ctx.beginPath();
      for (let az = 0; az <= 360; az += 2) {
        const { x, y } = this.azElToXY(az, this.site.horizonProfile(az));
        if (az === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let az = 360; az >= 0; az -= 2) {
        const { x, y } = this.azElToXY(az, -2);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Terrain rim.
      ctx.beginPath();
      for (let az = 0; az <= 360; az += 2) {
        const { x, y } = this.azElToXY(az, this.site.horizonProfile(az));
        if (az === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Outer ring stroke for radar boundary
      ctx.strokeStyle = 'rgba(176, 138, 90, 0.5)';
      ctx.lineWidth = 1.8 * this.dpr;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Trajectories from series
    if (this.series && this.series.length > 1) {
      // Sun Trajectory (Warm Arc)
      ctx.strokeStyle = 'rgba(232, 180, 92, 0.45)';
      ctx.lineWidth = 1.5 * this.dpr;
      ctx.setLineDash([4 * this.dpr, 3 * this.dpr]);
      ctx.beginPath();
      this.series.forEach((pt, i) => {
        const { x, y } = this.azElToXY(pt.sunAz, pt.sunEl);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Earth Libration Loop (Steel Curve)
      ctx.strokeStyle = 'rgba(143, 182, 209, 0.5)';
      ctx.lineWidth = 1.5 * this.dpr;
      ctx.setLineDash([2 * this.dpr, 2 * this.dpr]);
      ctx.beginPath();
      this.series.forEach((pt, i) => {
        const { x, y } = this.azElToXY(pt.earthAz, pt.earthEl);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Live Current Sun & Earth Positions
    if (this.ephemeris) {
      const sun = this.ephemeris.sun;
      const earth = this.ephemeris.earth;

      const sunPos = this.azElToXY(sun.az, sun.el);
      const earthPos = this.azElToXY(earth.az, earth.el);

      const topoSunEl = this.site.horizonProfile ? this.site.horizonProfile(sun.az) : 0;
      const topoEarthEl = this.site.horizonProfile ? this.site.horizonProfile(earth.az) : 0;

      const sunIsUp = sun.el > topoSunEl;
      const earthIsUp = earth.el > topoEarthEl;

      // Draw Sun
      ctx.save();
      ctx.translate(sunPos.x, sunPos.y);

      // Glow if above horizon
      if (sunIsUp) {
        const sGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 * this.dpr);
        sGrad.addColorStop(0, 'rgba(232, 180, 92, 0.9)');
        sGrad.addColorStop(0.4, 'rgba(232, 180, 92, 0.35)');
        sGrad.addColorStop(1, 'rgba(232, 180, 92, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 16 * this.dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = sunIsUp ? '#e8b45c' : '#5a5147';
      ctx.beginPath();
      ctx.arc(0, 0, 5 * this.dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = sunIsUp ? '#f2ece4' : '#3a332c';
      ctx.lineWidth = 1 * this.dpr;
      ctx.stroke();

      // Sun Label
      ctx.fillStyle = sunIsUp ? '#e8b45c' : '#6b6156';
      ctx.font = `bold ${9 * this.dpr}px monospace`;
      ctx.fillText(t('radar.sunLabel', { el: sun.el.toFixed(1) }), 0, -8 * this.dpr);
      ctx.restore();

      // Draw Earth
      ctx.save();
      ctx.translate(earthPos.x, earthPos.y);

      // Radio waves if Earth DTE is active
      if (earthIsUp) {
        ctx.strokeStyle = 'rgba(143, 182, 209, 0.7)';
        ctx.lineWidth = 1.2 * this.dpr;
        ctx.beginPath();
        ctx.arc(0, 0, 11 * this.dpr, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = earthIsUp ? '#8fb6d1' : '#5a5147';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5 * this.dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = earthIsUp ? '#f2ece4' : '#3a332c';
      ctx.lineWidth = 1 * this.dpr;
      ctx.stroke();

      // Earth Label
      ctx.fillStyle = earthIsUp ? '#8fb6d1' : '#6b6156';
      ctx.font = `bold ${9 * this.dpr}px monospace`;
      ctx.fillText(
        t('radar.earthLabel', { el: earth.el.toFixed(1) }),
        0,
        14 * this.dpr
      );
      ctx.restore();
    }
  }
}
