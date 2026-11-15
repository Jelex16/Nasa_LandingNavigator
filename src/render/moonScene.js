import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LunarTextureManager } from './lunarTextureManager.js';
import { siteDescription, siteProgram } from '../topography/lunarData.js';

const POINTER_DRAG_TOLERANCE_PX = 6;
const POINTER_CLICK_MAX_MS = 700;
const PIN_POPUP_TIMEOUT_MS = 8000;

function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d2b45';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2d5a27';

  ctx.beginPath();
  ctx.ellipse(540, 260, 90, 120, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(680, 160, 160, 80, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(260, 170, 70, 90, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(320, 340, 60, 100, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(820, 360, 45, 35, 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 470, canvas.width, 42);

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
    this.cameraTween = null;
    this.controls.addEventListener('start', () => {
      this.cameraTween = null;
    });

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownInfo = null;
    this.pinHitMeshes = [];
    this.pinPopup = null;
    this.pinPopupAnchor = null;
    this.pinPopupTimer = null;
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove);

    this.moonRadius = 10;
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
    this.ambientLight = new THREE.AmbientLight(0x2a3238, 0.5);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x8fb6d1, 0x1a1512, 0.4);
    this.scene.add(this.hemiLight);

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

    const sunGeom = new THREE.SphereGeometry(1.6, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea88 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

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

    this.scene.add(this.moonMesh);

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

  latLonToVector3(lat, lon, altitudeOffset = 0.12) {
    const totalOffset = altitudeOffset + (this.displacementEnabled ? this.displacementScale * 0.4 : 0);
    const r = this.moonRadius + totalOffset;
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = -r * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  setLandingSites(sites, onSelectCallback) {
    this.currentSitesList = sites;
    this.onSelectCallback = onSelectCallback;

    this.siteMarkers.forEach((group) => {
      this.scene.remove(group);
    });
    this.siteMarkers.clear();
    this.pinHitMeshes = [];
    this.hidePinPopup();

    sites.forEach((site) => {
      const group = new THREE.Group();
      const pos = this.latLonToVector3(site.lat, site.lon, 0.08);
      group.position.copy(pos);

      const normal = pos.clone().normalize();
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

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

      const pinGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x5a5147 });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.y = 0.4;
      group.add(pinMesh);

      const tipGeom = new THREE.SphereGeometry(0.14, 16, 16);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x8a7f72 });
      const tipMesh = new THREE.Mesh(tipGeom, tipMat);
      tipMesh.position.y = 0.8;
      group.add(tipMesh);

      const hitGeom = new THREE.SphereGeometry(0.55, 10, 10);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.y = 0.45;
      group.add(hitMesh);

      group.userData = { site, ringMesh, tipMesh, hitMesh };
      for (const mesh of [ringMesh, pinMesh, tipMesh, hitMesh]) {
        mesh.userData.siteId = site.id;
        this.pinHitMeshes.push(mesh);
      }
      this.scene.add(group);
      this.siteMarkers.set(site.id, group);
    });

    if (this.currentSite) {
      this.setActiveSite(this.currentSite);
    }
  }

  updateSiteStatus(siteId, scorePercent) {
    const group = this.siteMarkers.get(siteId);
    if (!group) return;

    let hexColor = 0x7fa96b;
    if (scorePercent < 50) {
      hexColor = 0xd2695a;
    } else if (scorePercent < 75) {
      hexColor = 0xd9a441;
    }

    group.userData.ringMesh.material.color.setHex(hexColor);
    group.userData.tipMesh.material.color.setHex(hexColor);
  }

  setActiveSite(site) {
    this.currentSite = site;
    const sitePos = this.latLonToVector3(site.lat, site.lon, 0.15);

    this.siteMarkers.forEach((group, id) => {
      const isSelected = id === site.id;
      group.userData.ringMesh.scale.set(isSelected ? 1.6 : 1.0, isSelected ? 1.6 : 1.0, 1.0);
    });

    return sitePos;
  }

  animateCameraTo(position, target, duration = 850) {
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      toPos: position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
      start: performance.now(),
      duration: Math.max(1, duration)
    };
  }

  viewSouthPole() {
    this.cameraTween = null;
    this.controls.target.set(0, -this.moonRadius, 0);
    this.camera.position.set(0, -this.moonRadius * 2.3, 3);
    this.controls.update();
  }

  viewGlobal() {
    this.cameraTween = null;
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(22, 10, 22);
    this.controls.update();
  }

  viewSite(site, { animate = true, duration = 850 } = {}) {
    const target = this.latLonToVector3(site.lat, site.lon, 0);
    const targetDir = target.clone().normalize();
    const focusDistance = Math.max(this.controls.minDistance, this.moonRadius * 0.6);
    const camPos = target.clone().addScaledVector(targetDir, focusDistance);
    if (animate && !this.motionReduced) {
      this.animateCameraTo(camPos, target, duration);
      return;
    }
    this.cameraTween = null;
    this.controls.target.copy(target);
    this.camera.position.copy(camPos);
    this.controls.update();
  }

  updateEphemeris(ephData, site) {
    if (!ephData) return;

    const sunDist = 38;
    const sX = ephData.sunDirMCMF[0];
    const sY = ephData.sunDirMCMF[2];
    const sZ = -ephData.sunDirMCMF[1];

    const sunPos = new THREE.Vector3(sX, sY, sZ).normalize().multiplyScalar(sunDist);
    this.sunLight.position.copy(sunPos);
    this.sunMesh.position.copy(sunPos);

    const earthDist = 30;
    const eX = ephData.earthDirMCMF[0];
    const eY = ephData.earthDirMCMF[2];
    const eZ = -ephData.earthDirMCMF[1];
    const earthPos = new THREE.Vector3(eX, eY, eZ).normalize().multiplyScalar(earthDist);
    this.earthMesh.position.copy(earthPos);

    if (site) {
      const sitePos = this.latLonToVector3(site.lat, site.lon, 0.12);

      const sunPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(sX, sY, sZ).normalize().multiplyScalar(10))];
      this.sunRayLine.geometry.setFromPoints(sunPoints);

      const earthPoints = [sitePos, sitePos.clone().add(new THREE.Vector3(eX, eY, eZ).normalize().multiplyScalar(9))];
      this.earthRayLine.geometry.setFromPoints(earthPoints);

      const sunVisible = ephData.sun.el > (site.horizonProfile ? site.horizonProfile(ephData.sun.az) : 0);
      this.sunRayLine.material.color.setHex(sunVisible ? 0xe8b45c : 0x4a4030);

      const earthVisible = ephData.earth.el > (site.horizonProfile ? site.horizonProfile(ephData.earth.az) : 0);
      this.earthRayLine.material.color.setHex(earthVisible ? 0x8fb6d1 : 0x3d454c);
    }
  }

  handlePointerDown(event) {
    if (event.button !== 0) return;
    this.pointerDownInfo = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now()
    };
  }

  handlePointerUp(event) {
    if (event.button !== 0) return;
    const down = this.pointerDownInfo;
    this.pointerDownInfo = null;
    if (!down) return;

    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    if (moved > POINTER_DRAG_TOLERANCE_PX) return;
    if (performance.now() - down.time > POINTER_CLICK_MAX_MS) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pinHitMeshes, false);
    if (!hits.length) {
      this.hidePinPopup();
      return;
    }

    const moonHits = this.raycaster.intersectObject(this.moonMesh, false);
    if (moonHits.length && moonHits[0].distance < hits[0].distance) {
      this.hidePinPopup();
      return;
    }

    const siteId = hits[0].object.userData.siteId;
    if (!siteId) return;
    this.onSelectCallback?.(siteId);
    const group = this.siteMarkers.get(siteId);
    if (group?.userData.site) this.showPinPopup(group.userData.site, group);
  }

  handlePointerMove(event) {
    if (this.pointerDownInfo) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.pinHitMeshes, false);
    let selectable = hits.length > 0;
    if (selectable) {
      const moonHits = this.raycaster.intersectObject(this.moonMesh, false);
      if (moonHits.length && moonHits[0].distance < hits[0].distance) selectable = false;
    }
    this.renderer.domElement.style.cursor = selectable ? 'pointer' : '';
  }

  shortPinDescription(site) {
    const full = siteDescription(site) || site.targetMission || '';
    const cut = full.search(/[.!?](\s|$)/);
    const sentence = cut === -1 ? full : full.slice(0, cut + 1);
    return sentence.length > 180 ? `${sentence.slice(0, 177).trimEnd()}…` : sentence;
  }

  showPinPopup(site, anchor) {
    if (!this.pinPopup) {
      const el = document.createElement('div');
      el.className = 'pin-popup';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
      this.pinPopup = el;
    }

    const title = document.createElement('strong');
    title.className = 'pin-popup-title';
    title.textContent = site.name;
    const meta = document.createElement('span');
    meta.className = 'pin-popup-meta';
    meta.textContent = siteProgram(site);
    const text = document.createElement('p');
    text.className = 'pin-popup-text';
    text.textContent = this.shortPinDescription(site);

    this.pinPopup.replaceChildren(title, meta, text);
    this.pinPopup.hidden = false;
    this.pinPopupAnchor = anchor ?? null;
    this.positionPinPopup();

    clearTimeout(this.pinPopupTimer);
    this.pinPopupTimer = setTimeout(() => this.hidePinPopup(), PIN_POPUP_TIMEOUT_MS);
  }

  hidePinPopup() {
    clearTimeout(this.pinPopupTimer);
    this.pinPopupTimer = null;
    this.pinPopupAnchor = null;
    if (this.pinPopup) this.pinPopup.hidden = true;
  }

  positionPinPopup() {
    if (!this.pinPopup || this.pinPopup.hidden || !this.pinPopupAnchor) return;
    this.camera.updateMatrixWorld();

    const world = new THREE.Vector3();
    this.pinPopupAnchor.getWorldPosition(world);
    world.addScaledVector(world.clone().normalize(), 1.0);
    world.project(this.camera);

    const rect = this.renderer.domElement.getBoundingClientRect();
    const screenX = (world.x * 0.5 + 0.5) * rect.width + rect.left;
    const screenY = (-world.y * 0.5 + 0.5) * rect.height + rect.top;

    const popup = this.pinPopup;
    popup.style.visibility = 'hidden';
    popup.style.left = '0px';
    popup.style.top = '0px';
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;

    const margin = 8;
    let left = screenX + 16;
    if (left + pw > rect.right - margin) left = screenX - pw - 16;
    left = Math.max(rect.left + margin, Math.min(left, rect.right - pw - margin));

    let top = screenY - ph - 14;
    if (top < rect.top + margin) top = screenY + 18;
    top = Math.max(rect.top + margin, Math.min(top, rect.bottom - ph - margin));

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.style.visibility = 'visible';
    popup.style.opacity = world.z > 1 ? '0' : '1';
  }

  handleResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate(now = performance.now()) {
    this.animId = requestAnimationFrame(this.animate);

    if (this.earthMesh && !this.motionReduced) {
      this.earthMesh.rotation.y += 0.002;
    }

    if (this.cameraTween) {
      const progress = Math.min(1, (now - this.cameraTween.start) / this.cameraTween.duration);
      const ease = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      this.camera.position.lerpVectors(
        this.cameraTween.fromPos,
        this.cameraTween.toPos,
        ease
      );
      this.controls.target.lerpVectors(
        this.cameraTween.fromTarget,
        this.cameraTween.toTarget,
        ease
      );
      if (progress >= 1) this.cameraTween = null;
    }

    const time = now * 0.004;
    this.siteMarkers.forEach((group) => {
      const ring = group.userData.ringMesh;
      if (ring) {
        ring.material.opacity = this.motionReduced ? 0.75 : 0.5 + 0.4 * Math.sin(time);
      }
    });

    this.positionPinPopup();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.handleResize);
    this.hidePinPopup();
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
      this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
      this.renderer.domElement.removeEventListener('pointermove', this.handlePointerMove);
      this.container.removeChild(this.renderer.domElement);
    }
    if (this.pinPopup) {
      this.pinPopup.remove();
      this.pinPopup = null;
    }
  }
}
