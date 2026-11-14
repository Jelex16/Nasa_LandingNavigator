import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LunarTextureManager } from './lunarTextureManager.js';

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
    // Matches the active 2.5x control: 0.22 * 2.5.
    this.displacementScale = 0.55;
    this.displacementEnabled = true;
    this.currentLayerId = 'lroc';
    this.textureManager = new LunarTextureManager();

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
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduceMotion.addEventListener('change', (event) => {
      this.motionReduced = event.matches;
    });
    this.motionReduced = this.reduceMotion.matches;
  }

  initScene() {
    this.scene.background = new THREE.Color(0x0b0a09);
  }

  initLighting() {
    // Ambient light simulating subtle starlight & earthshine
    this.ambientLight = new THREE.AmbientLight(0x232a30, 0.42);
    this.scene.add(this.ambientLight);

    // Dynamic Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfff6ea, 2.6);
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

  async initMoon() {
    // High tessellation sphere to support true vertex displacement for craters and mountains
    const moonGeom = new THREE.SphereGeometry(this.moonRadius, 192, 192);

    this.moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.04,
      displacementScale: this.displacementScale,
      displacementBias: -this.displacementScale * 0.45,
      bumpScale: 0.12
    });

    this.moonMesh = new THREE.Mesh(moonGeom, this.moonMaterial);
    this.moonMesh.receiveShadow = true;
    this.moonMesh.castShadow = true;

    // Three.js SphereGeometry maps texture u=0.5 to +X, the same convention as
    // latLonToVector3's lon=0. Rotating the mesh here would shift the photo
    // layer 90° away from the landing-site pins.
    this.scene.add(this.moonMesh);

    // Polar axis ring indicator (Subtle dashed line)
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -this.moonRadius * 1.35, 0),
      new THREE.Vector3(0, this.moonRadius * 1.35, 0)
    ]);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0x5c5348,
      dashSize: 0.4,
      gapSize: 0.3,
      transparent: true,
      opacity: 0.5
    });
    this.axisLine = new THREE.Line(axisGeom, axisMat);
    this.axisLine.computeLineDistances();
    this.scene.add(this.axisLine);

    // Load initial NASA elevation and photographic textures
    try {
      const [dispTex, colorTex] = await Promise.all([
        this.textureManager.loadDisplacementTexture(),
        this.textureManager.getLayerTexture(this.currentLayerId)
      ]);

      if (dispTex) {
        this.moonMaterial.displacementMap = dispTex;
        this.moonMaterial.bumpMap = dispTex;
      }
      if (colorTex) {
        this.moonMaterial.map = colorTex;
      }
      this.moonMaterial.needsUpdate = true;
    } catch (err) {
      console.warn('Falling back on basic texture initialization:', err);
    }
  }

  /**
   * Switches the active lunar map layer (LROC Photo, LOLA Topography DEM, LOLA Hillshade, LOLA Slope).
   */
  async setLayer(layerId) {
    this.currentLayerId = layerId;
    try {
      const tex = await this.textureManager.getLayerTexture(layerId);
      if (tex && this.moonMaterial) {
        this.moonMaterial.map = tex;
        this.moonMaterial.needsUpdate = true;
      }
    } catch (err) {
      console.error('Failed to switch layer to:', layerId, err);
    }
  }

  /**
   * Sets the 3D surface elevation exaggeration multiplier (1x = real scale, 2.5x, 5x, 0 = flat).
   */
  setElevationExaggeration(multiplier) {
    if (!this.moonMaterial) return;

    if (multiplier <= 0) {
      this.displacementEnabled = false;
      this.moonMaterial.displacementScale = 0;
      this.moonMaterial.displacementBias = 0;
    } else {
      this.displacementEnabled = true;
      this.displacementScale = 0.22 * multiplier;
      this.moonMaterial.displacementScale = this.displacementScale;
      this.moonMaterial.displacementBias = -this.displacementScale * 0.45;
    }
    this.moonMaterial.needsUpdate = true;

    // Reposition markers to float cleanly above displaced relief
    if (this.currentSitesList) {
      this.setLandingSites(this.currentSitesList, this.onSelectCallback);
    }
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
      color: 0xe8b45c,
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
      color: 0x8fb6d1,
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
  latLonToVector3(lat, lon, altitudeOffset = 0.12) {
    // Offset accounts for displacement and ensures pin hovers visibly above terrain
    const totalOffset = altitudeOffset + (this.displacementEnabled ? this.displacementScale * 0.4 : 0);
    const r = this.moonRadius + totalOffset;
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = -r * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Adds or updates 3D pins for all landing sites.
   */
  setLandingSites(sites, onSelectCallback) {
    this.currentSitesList = sites;
    this.onSelectCallback = onSelectCallback;

    // Clear old markers
    this.siteMarkers.forEach((group) => {
      this.scene.remove(group);
    });
    this.siteMarkers.clear();

    sites.forEach((site) => {
      const group = new THREE.Group();
      const pos = this.latLonToVector3(site.lat, site.lon, 0.08);
      group.position.copy(pos);

      // Normal vector pointing outwards from Moon center
      const normal = pos.clone().normalize();
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      // Pin base disc / ring
      const ringGeom = new THREE.RingGeometry(0.2, 0.35, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x8a7f72,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      group.add(ringMesh);

      // Vertical beacon pin
      const pinGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x5a5147 });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.y = 0.4;
      group.add(pinMesh);

      // Beacon tip sphere
      const tipGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x8a7f72 });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.position.y = 0.8;
      group.add(tipMesh);

      group.userData = { site, ringMesh, tipMesh };
      this.scene.add(group);
      this.siteMarkers.set(site.id, group);
    });

    if (this.currentSite) {
      this.setActiveSite(this.currentSite);
    }
  }

  /**
   * Updates marker color based on the transparent decision score.
   */
  updateSiteStatus(siteId, scorePercent) {
    const group = this.siteMarkers.get(siteId);
    if (!group) return;

    let hexColor = 0x7fa96b; // Safe
    if (scorePercent < 50) {
      hexColor = 0xd2695a; // Danger
    } else if (scorePercent < 75) {
      hexColor = 0xd9a441; // Caution
    }

    group.userData.ringMesh.material.color.setHex(hexColor);
    group.userData.tipMesh.material.color.setHex(hexColor);
  }

  /**
   * Selects an active landing site and moves the camera / vectors.
   */
  setActiveSite(site) {
    this.currentSite = site;
    const sitePos = this.latLonToVector3(site.lat, site.lon, 0.15);

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
      const sitePos = this.latLonToVector3(site.lat, site.lon, 0.12);

      // Sun vector
      const sunPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(sX, sY, sZ).normalize().multiplyScalar(10))];
      this.sunRayLine.geometry.setFromPoints(sunPoints);

      // Earth vector
      const earthPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(eX, eY, eZ).normalize().multiplyScalar(9))];
      this.earthRayLine.geometry.setFromPoints(earthPoints);

      // Sightline colors: amber for Sun, steel for Earth, dimmed when blocked
      const sunVisible = ephData.sun.el > (site.horizonProfile ? site.horizonProfile(ephData.sun.az) : 0);
      this.sunRayLine.material.color.setHex(sunVisible ? 0xe8b45c : 0x4a4030);

      const earthVisible = ephData.earth.el > (site.horizonProfile ? site.horizonProfile(ephData.earth.az) : 0);
      this.earthRayLine.material.color.setHex(earthVisible ? 0x8fb6d1 : 0x3d454c);
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
    if (this.earthMesh && !this.motionReduced) {
      this.earthMesh.rotation.y += 0.002;
    }

    // Pulse active site pin — a static ring when motion is reduced
    const time = performance.now() * 0.004;
    this.siteMarkers.forEach((group) => {
      const ring = group.userData.ringMesh;
      if (ring) {
        ring.material.opacity = this.motionReduced ? 0.75 : 0.5 + 0.4 * Math.sin(time);
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
