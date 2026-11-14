import * as THREE from 'three';

/**
 * LunarTextureManager
 * Manages real NASA Lunar Reconnaissance Orbiter (LRO) datasets:
 * - LROC WAC Global Photographic Mosaic (Color Albedo)
 * - LOLA DEM Elevation Color Hillshade (NASA / USGS Topography)
 * - LOLA Shaded Relief (Crater Morpohology & Shadows)
 * - LOLA Slope Map (Landing Hazard & Traverse Safety)
 * - LOLA 8-bit Normalized Digital Elevation Model (Displacement & Bump)
 *
 * Supported services:
 * - NASA Solar System Treks (Moon Trek WMTS)
 * - Arizona State University / NASA LROC QuickMap
 */

const TEXTURE_BASE = `${import.meta.env.BASE_URL}textures/moon/`;

export const LUNAR_LAYERS = [
  {
    id: 'lroc',
    name: 'Fotografía Real LROC',
    shortName: 'LROC Foto',
    icon: '🛰️',
    description: 'Mosaico fotográfico global de albedo de la cámara de gran angular (LROC WAC). Captura la reflectancia visual real de la superficie lunar y los mares basálticos.',
    source: 'NASA LRO / Arizona State University (ASU)',
    resolution: 'Vista previa 2k (2048×1024); la capa LROC WAC completa está en QuickMap',
    trekLayer: 'LRO_WAC_Mosaic_Global_303ppd_v02',
    isSingleFile: true,
    url: `${TEXTURE_BASE}lroc_color_2k.jpg`
  },
  {
    id: 'lola_color',
    name: 'Topografía LOLA (DEM)',
    shortName: 'Topografía',
    icon: '🌈',
    description: 'Elevación topográfica codificada por colores por el altímetro láser LOLA. Azul/violeta para cuencas profundas, verde/amarillo para elevaciones medias y rojo/blanco para cumbres y macizos polares.',
    source: 'NASA Goddard Space Flight Center / LOLA Science Team',
    resolution: 'Vista previa 1024×512; el DEM LOLA 128 ppd completo está en Moon Trek',
    trekLayer: 'LRO_LOLA_ClrShade_Global_128ppd_v04',
    isSingleFile: false,
    tileFolder: `${TEXTURE_BASE}tiles/lola_clr_shade`
  },
  {
    id: 'lola_hillshade',
    name: 'Relieve LOLA (Hillshade)',
    shortName: 'Relieve',
    icon: '⛰️',
    description: 'Modelo de sombras de relieve derivado del modelo digital de elevación (DEM) LOLA. Resalta la morfología de bordes de cráteres, crestas y paredes escarpadas.',
    source: 'NASA GSFC / LRO Project',
    resolution: 'Vista previa 1024×512; el hillshade LOLA completo está en Moon Trek',
    trekLayer: 'LRO_LOLA_Shade_Global_128ppd_v04',
    isSingleFile: false,
    tileFolder: `${TEXTURE_BASE}tiles/lola_hillshade`
  },
  {
    id: 'lola_slope',
    name: 'Mapa de Pendientes LOLA',
    shortName: 'Pendientes',
    icon: '⚠️',
    description: 'Clasificación de pendientes topográficas calculadas con LOLA. Fundamental para evaluar estabilidad del tren de aterrizaje y riesgo de vuelco (<8° seguro, >15° crítico).',
    source: 'NASA Solar System Treks / LOLA Team',
    resolution: 'Vista previa 1024×512; el mapa de pendientes LOLA 16 ppd está en Moon Trek',
    trekLayer: 'LRO_LOLA_ClrSlope_Global_16ppd',
    isSingleFile: false,
    tileFolder: `${TEXTURE_BASE}tiles/lola_slope`
  }
];

export class LunarTextureManager {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = new Map();
    this.currentLayerId = 'lroc';
    this.displacementTexture = null;
    this.onLoadCallbacks = [];
  }

  /**
   * Loads the LOLA Digital Elevation Model used for 3D vertex displacement.
   */
  async loadDisplacementTexture() {
    if (this.displacementTexture) return this.displacementTexture;

    return new Promise((resolve) => {
      this.textureLoader.load(
        `${TEXTURE_BASE}ldem_displacement_1k.jpg`,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.colorSpace = THREE.NoColorSpace;
          this.displacementTexture = tex;
          resolve(tex);
        },
        undefined,
        (err) => {
          console.warn('Could not load displacement texture:', err);
          resolve(null);
        }
      );
    });
  }

  /**
   * Loads or stitches a specific layer texture.
   */
  async getLayerTexture(layerId) {
    if (this.textureCache.has(layerId)) {
      return this.textureCache.get(layerId);
    }

    const layerMeta = LUNAR_LAYERS.find((l) => l.id === layerId) || LUNAR_LAYERS[0];

    if (layerMeta.isSingleFile) {
      const tex = await this._loadSingleTexture(layerMeta.url);
      this.textureCache.set(layerId, tex);
      return tex;
    } else {
      const tex = await this._stitchTiles(layerMeta.tileFolder);
      this.textureCache.set(layerId, tex);
      return tex;
    }
  }

  _loadSingleTexture(url) {
    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          resolve(tex);
        },
        undefined,
        (err) => {
          console.error('Error loading texture from:', url, err);
          resolve(null);
        }
      );
    });
  }

  /**
   * Stitches 8 equirectangular tiles (2 rows x 4 columns) into a single 1024x512 CanvasTexture.
   */
  async _stitchTiles(tileFolder) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fill with neutral background first
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tilePromises = [];

    // Zoom level 1: 2 rows (r: 0..1), 4 columns (c: 0..3)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const url = `${tileFolder}/tile_1_${r}_${c}.png`;
        const p = new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.drawImage(img, c * 256, r * 256, 256, 256);
            res();
          };
          img.onerror = () => {
            console.warn(`Tile failed to load: ${url}`);
            res();
          };
          img.src = url;
        });
        tilePromises.push(p);
      }
    }

    await Promise.all(tilePromises);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    return texture;
  }
}
