import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Generates a procedural lunar albedo/bump texture for the background globe.
 * It is deliberately decorative: the real LOLA topography is rendered in the
 * 2.5D panorama and the polar horizon radar, not in this Three.js sphere.
 * Crater positions are approximate context markers, not a LOLA mesh.
 */
function createProceduralMoonTextures() {
  const width = 2048;
  const height = 1024;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bctx = bumpCanvas.getContext('2d');

  // Base background: Lunar anorthositic highlands
  ctx.fillStyle = '#9b9da0';
  ctx.fillRect(0, 0, width, height);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, width, height);

  // Micro-noise for regolith texture
  const imgData = ctx.getImageData(0, 0, width, height);
  const bumpData = bctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const bdata = bumpData.data;

  // Simple pseudo-random hash
  function noise(x, y) {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const n = (noise(x * 0.1, y * 0.1) * 0.5 + noise(x * 0.02, y * 0.02) * 0.5) * 35;
      const v = Math.max(0, Math.min(255, 150 + n - 17));
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v + 2; // subtle cool tone
      bdata[idx] = v;
      bdata[idx + 1] = v;
      bdata[idx + 2] = v;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  bctx.putImageData(bumpData, 0, 0);

  // Helper to convert selenographic (lat, lon) to canvas (x, y)
  // lon: 0..360 -> x: 0..width, lat: 90..-90 -> y: 0..height
  function coordToXY(lat, lon) {
    const x = ((lon % 360) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }

  // Draw Lunar Maria (Dark basaltic plains)
  const maria = [
    { name: 'Mare Tranquillitatis', lat: 8, lon: 31, rx: 110, ry: 75, angle: 0.1 },
    { name: 'Mare Serenitatis', lat: 28, lon: 17, rx: 95, ry: 70, angle: -0.2 },
    { name: 'Mare Imbrium', lat: 32, lon: 344, rx: 160, ry: 110, angle: 0 },
    { name: 'Oceanus Procellarum', lat: 18, lon: 302, rx: 210, ry: 190, angle: 0.3 },
    { name: 'Mare Crisium', lat: 17, lon: 59, rx: 70, ry: 50, angle: 0.1 },
    { name: 'South Pole-Aitken Basin', lat: -53, lon: 191, rx: 250, ry: 130, angle: -0.1 }
  ];

  maria.forEach((m) => {
    const { x, y } = coordToXY(m.lat, m.lon);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(m.angle);
    const grad = ctx.createRadialGradient(0, 0, m.rx * 0.2, 0, 0, m.rx);
    grad.addColorStop(0, 'rgba(45, 48, 52, 0.88)');
    grad.addColorStop(0.7, 'rgba(65, 68, 72, 0.75)');
    grad.addColorStop(1, 'rgba(155, 157, 160, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bump depression
    bctx.save();
    bctx.translate(x, y);
    bctx.rotate(m.angle);
    const bgrad = bctx.createRadialGradient(0, 0, m.rx * 0.2, 0, 0, m.rx);
    bgrad.addColorStop(0, 'rgba(40, 40, 40, 0.8)');
    bgrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bctx.fillStyle = bgrad;
    bctx.beginPath();
    bctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
  });

  // Major craters & South Pole features
  const craters = [
    // South Pole craters
    { name: 'Shackleton', lat: -89.9, lon: 124, r: 14, rim: 3, rays: false },
    { name: 'Haworth', lat: -87.4, lon: 354, r: 24, rim: 4, rays: false },
    { name: 'Shoemaker', lat: -88.1, lon: 45, r: 28, rim: 5, rays: false },
    { name: 'Faustini', lat: -87.3, lon: 84, r: 22, rim: 4, rays: false },
    { name: 'Nobile', lat: -85.2, lon: 36, r: 35, rim: 6, rays: false },
    { name: 'Amundsen', lat: -84.5, lon: 82, r: 42, rim: 7, rays: false },
    { name: 'Malapert Massif', lat: -85.9, lon: 357, r: 30, rim: 8, rays: false },
    // Rayed landmark craters
    { name: 'Tycho', lat: -43.3, lon: 348.8, r: 32, rim: 8, rays: true, rayLen: 450 },
    { name: 'Copernicus', lat: 9.6, lon: 339.9, r: 36, rim: 9, rays: true, rayLen: 280 },
    { name: 'Kepler', lat: 8.1, lon: 322.0, r: 20, rim: 5, rays: true, rayLen: 160 }
  ];

  craters.forEach((c) => {
    const { x, y } = coordToXY(c.lat, c.lon);

    // Ejecta rays
    if (c.rays) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = 'rgba(235, 238, 245, 0.35)';
      ctx.lineWidth = 1.8;
      for (let a = 0; a < Math.PI * 2; a += 0.25) {
        const rayL = c.rayLen * (0.6 + noise(a * 10, c.lat) * 0.8);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * rayL, Math.sin(a) * rayL);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Crater Rim highlight
    ctx.strokeStyle = 'rgba(230, 235, 240, 0.85)';
    ctx.lineWidth = c.rim;
    ctx.beginPath();
    ctx.arc(x, y, c.r, 0, Math.PI * 2);
    ctx.stroke();

    // Crater interior shadow / floor
    const floorGrad = ctx.createRadialGradient(x, y, 0, x, y, c.r);
    floorGrad.addColorStop(0, 'rgba(40, 42, 45, 0.95)');
    floorGrad.addColorStop(0.85, 'rgba(65, 68, 72, 0.9)');
    floorGrad.addColorStop(1, 'rgba(120, 125, 130, 0.3)');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(x, y, c.r, 0, Math.PI * 2);
    ctx.fill();

    // Bump map crater: high rim, depressed floor
    bctx.strokeStyle = '#ffffff';
    bctx.lineWidth = c.rim;
    bctx.beginPath();
    bctx.arc(x, y, c.r, 0, Math.PI * 2);
    bctx.stroke();

    bctx.fillStyle = '#222222';
    bctx.beginPath();
    bctx.arc(x, y, c.r * 0.85, 0, Math.PI * 2);
    bctx.fill();
  });

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.ClampToEdgeWrapping;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

  return { colorTexture, bumpTexture };
}

/**
 * Creates a procedural Earth sphere texture with oceans, continents, and atmosphere.
 */
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep Blue Oceans
  ctx.fillStyle = '#0d2b45';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continents (Americas, Eurasia, Africa, Australia, Antarctica)
  ctx.fillStyle = '#2d5a27';

  // Africa / Europe
  ctx.beginPath();
  ctx.ellipse(540, 260, 90, 120, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia
  ctx.beginPath();
  ctx.ellipse(680, 160, 160, 80, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Americas
  ctx.beginPath();
  ctx.ellipse(260, 170, 70, 90, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(320, 340, 60, 100, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(820, 360, 45, 35, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica
  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 470, canvas.width, 42);

  // Cloud swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    const cx = (i * 55) % canvas.width;
    const cy = 100 + (Math.sin(i) * 150 + 150);
    ctx.ellipse(cx, cy, 80 + (i % 5) * 20, 25, 0.2 * (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class MoonScene {
  constructor(containerElement) {
    this.container = containerElement;
    this.width = containerElement.clientWidth || 800;
    this.height = containerElement.clientHeight || 600;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 70;

    this.moonRadius = 10;
    this.siteMarkers = new Map();
    this.currentSite = null;
    this.activeSitePin = null;

    this.initScene();
    this.initLighting();
    this.initMoon();
    this.initEarth();
    this.initVectors();
    this.initStarfield();

    this.animate = this.animate.bind(this);
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // Initial camera position (angled towards South Pole)
    this.camera.position.set(0, -22, 18);
    this.controls.target.set(0, -3, 0);
    this.controls.update();

    this.animId = requestAnimationFrame(this.animate);
  }

  initScene() {
    this.scene.background = new THREE.Color(0x040810);
  }

  initLighting() {
    // Ambient light simulating subtle starlight, earthshine and enough
    // base visibility for the site markers even when the Sun is below the
    // local horizon. The real lighting model remains the directional Sun.
    this.ambientLight = new THREE.AmbientLight(0x22344f, 0.55);
    this.scene.add(this.ambientLight);

    // Dynamic Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 2.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -15;
    this.sunLight.shadow.camera.right = 15;
    this.sunLight.shadow.camera.top = 15;
    this.sunLight.shadow.camera.bottom = -15;
    this.scene.add(this.sunLight);

    // Sun visual orb in the distance
    const sunGeom = new THREE.SphereGeometry(1.6, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea88 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Sun corona glow sprite
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 128;
    spriteCanvas.height = 128;
    const sctx = spriteCanvas.getContext('2d');
    const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 240, 160, 1)');
    grad.addColorStop(0.3, 'rgba(255, 200, 80, 0.6)');
    grad.addColorStop(1, 'rgba(255, 180, 50, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 128, 128);

    const coronaTexture = new THREE.CanvasTexture(spriteCanvas);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      blending: THREE.AdditiveBlending,
      color: 0xffeedd
    });
    this.sunCorona = new THREE.Sprite(coronaMat);
    this.sunCorona.scale.set(10, 10, 1);
    this.sunMesh.add(this.sunCorona);
  }

  initMoon() {
    const { colorTexture, bumpTexture } = createProceduralMoonTextures();

    const moonGeom = new THREE.SphereGeometry(this.moonRadius, 96, 96);
    this.moonMaterial = new THREE.MeshStandardMaterial({
      map: colorTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.18,
      roughness: 0.88,
      metalness: 0.05
    });

    this.moonMesh = new THREE.Mesh(moonGeom, this.moonMaterial);
    this.moonMesh.receiveShadow = true;
    this.moonMesh.castShadow = true;
    this.scene.add(this.moonMesh);

    // Polar axis ring indicator (Subtle dashed line)
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -this.moonRadius * 1.3, 0),
      new THREE.Vector3(0, this.moonRadius * 1.3, 0)
    ]);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0x4a6f94,
      dashSize: 0.4,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.4
    });
    this.axisLine = new THREE.Line(axisGeom, axisMat);
    this.axisLine.computeLineDistances();
    this.scene.add(this.axisLine);
  }

  initEarth() {
    const earthTexture = createProceduralEarthTexture();
    const earthGeom = new THREE.SphereGeometry(1.4, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.6,
      metalness: 0.1
    });

    this.earthMesh = new THREE.Mesh(earthGeom, earthMat);
    this.scene.add(this.earthMesh);

    // Earth atmosphere halo
    const haloGeom = new THREE.SphereGeometry(1.55, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x64b5f6,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide
    });
    this.earthHalo = new THREE.Mesh(haloGeom, haloMat);
    this.earthMesh.add(this.earthHalo);
  }

  initVectors() {
    // Ray to Sun
    const sunRayMat = new THREE.LineBasicMaterial({
      color: 0xffd54f,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const sunRayGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    this.sunRayLine = new THREE.Line(sunRayGeom, sunRayMat);
    this.scene.add(this.sunRayLine);

    // Ray to Earth (DTE Comm link)
    const earthRayMat = new THREE.LineBasicMaterial({
      color: 0x00e5ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    const earthRayGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    this.earthRayLine = new THREE.Line(earthRayGeom, earthRayMat);
    this.scene.add(this.earthRayLine);
  }

  initStarfield() {
    const starsCount = 1800;
    const starGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount; i++) {
      const radius = 90 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const tint = 0.8 + Math.random() * 0.2;
      colors[i * 3] = tint;
      colors[i * 3 + 1] = tint * (0.9 + Math.random() * 0.1);
      colors[i * 3 + 2] = 1.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.7,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    this.starfield = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starfield);
  }

  /**
   * Converts Selenographic coordinates (lat, lon) to 3D Cartesian position on Moon sphere.
   * Coordinate convention: Y is lunar spin axis (North = +Y, South = -Y)
   * X and Z lie on equatorial plane. Prime meridian (0 lon) along +X.
   */
  latLonToVector3(lat, lon, altitudeOffset = 0.08) {
    const r = this.moonRadius + altitudeOffset;
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    // Selenographic standard:
    // Y = sin(phi) (Pole axis)
    // X = cos(phi) * cos(theta) (Prime meridian towards Earth center)
    // Z = -cos(phi) * sin(theta) (East/West)
    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = -r * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Adds or updates 3D pins for all landing sites.
   */
  setLandingSites(sites, onSelectCallback) {
    this.onSelectCallback = onSelectCallback;

    // Clear old markers
    this.siteMarkers.forEach((group) => {
      this.scene.remove(group);
    });
    this.siteMarkers.clear();

    sites.forEach((site) => {
      const group = new THREE.Group();
      const pos = this.latLonToVector3(site.lat, site.lon, 0.05);
      group.position.copy(pos);

      // Normal vector pointing outwards from Moon center
      const normal = pos.clone().normalize();
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Pin base disc / ring
      const ringGeom = new THREE.RingGeometry(0.2, 0.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);

      // Vertical beacon pin
      const pinGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.y = 0.4;
      group.add(pinMesh);

      // Beacon tip sphere
      const tipGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.position.y = 0.8;
      group.add(tipMesh);

      group.userData = { site, ringMesh, tipMesh };
      this.scene.add(group);
      this.siteMarkers.set(site.id, group);
    });
  }

  /**
   * Updates marker color based on Neural Network classification score.
   */
  updateSiteStatus(siteId, scorePercent) {
    const group = this.siteMarkers.get(siteId);
    if (!group) return;

    let hexColor = 0x00e676; // Safe green
    if (scorePercent < 50) {
      hexColor = 0xff1744; // Danger red
    } else if (scorePercent < 75) {
      hexColor = 0xff9100; // Caution orange
    }

    group.userData.ringMesh.material.color.setHex(hexColor);
    group.userData.tipMesh.material.color.setHex(hexColor);
  }

  /**
   * Selects an active landing site and moves the camera / vectors.
   */
  setActiveSite(site) {
    this.currentSite = site;
    const sitePos = this.latLonToVector3(site.lat, site.lon, 0.1);

    // Highlight active pin
    this.siteMarkers.forEach((group, id) => {
      const isSelected = id === site.id;
      group.userData.ringMesh.scale.set(isSelected ? 1.6 : 1.0, isSelected ? 1.6 : 1.0, 1.0);
    });

    return sitePos;
  }

  /**
   * Camera View Presets
   */
  viewSouthPole() {
    this.controls.target.set(0, -this.moonRadius, 0);
    this.camera.position.set(0, -this.moonRadius * 2.3, 3);
    this.controls.update();
  }

  viewGlobal() {
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(22, 10, 22);
    this.controls.update();
  }

  viewSite(site) {
    const target = this.latLonToVector3(site.lat, site.lon, 0);
    this.controls.target.copy(target);
    const camPos = target.clone().multiplyScalar(1.6);
    this.camera.position.copy(camPos);
    this.controls.update();
  }

  /**
   * Updates Sun and Earth 3D positions and sightline vectors from ephemeris data.
   */
  updateEphemeris(ephData, site) {
    if (!ephData) return;

    // Ephemeris vectors are in Selenographic (MCMF) unit coordinates:
    // sunDirMCMF = [x, y, z] where Y is pole (lat), X is 0 lon, Z is 90 lon.
    // In our Three.js coordinate system:
    // Three.js Y = MCMF Z (pole), Three.js X = MCMF X, Three.js Z = -MCMF Y
    const sunDist = 38;
    const sX = ephData.sunDirMCMF[0];
    const sY = ephData.sunDirMCMF[2]; // pole in MCMF
    const sZ = -ephData.sunDirMCMF[1];

    const sunPos = new THREE.Vector3(sX, sY, sZ).normalize().multiplyScalar(sunDist);
    this.sunLight.position.copy(sunPos);
    this.sunMesh.position.copy(sunPos);

    // Earth position
    const earthDist = 30;
    const eX = ephData.earthDirMCMF[0];
    const eY = ephData.earthDirMCMF[2];
    const eZ = -ephData.earthDirMCMF[1];
    const earthPos = new THREE.Vector3(eX, eY, eZ).normalize().multiplyScalar(earthDist);
    this.earthMesh.position.copy(earthPos);

    // Update Sightlines from selected landing site
    if (site) {
      const sitePos = this.latLonToVector3(site.lat, site.lon, 0.1);

      // Sun vector
      const sunPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(sX, sY, sZ).normalize().multiplyScalar(10))];
      this.sunRayLine.geometry.setFromPoints(sunPoints);

      // Earth vector
      const earthPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(eX, eY, eZ).normalize().multiplyScalar(9))];
      this.earthRayLine.geometry.setFromPoints(earthPoints);

      // Sightline colors: gold/dim for Sun, cyan/red for Earth
      const sunVisible = ephData.sun.el > (site.horizonProfile ? site.horizonProfile(ephData.sun.az) : 0);
      this.sunRayLine.material.color.setHex(sunVisible ? 0xffd54f : 0x554422);

      const earthVisible = ephData.earth.el > (site.horizonProfile ? site.horizonProfile(ephData.earth.az) : 0);
      this.earthRayLine.material.color.setHex(earthVisible ? 0x00e5ff : 0xd50000);
    }
  }

  handleResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);

    // Subtle Earth rotation
    if (this.earthMesh) {
      this.earthMesh.rotation.y += 0.002;
    }

    // Pulse active site pin
    const time = performance.now() * 0.004;
    this.siteMarkers.forEach((group) => {
      const ring = group.userData.ringMesh;
      if (ring) {
        ring.material.opacity = 0.5 + 0.4 * Math.sin(time);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
