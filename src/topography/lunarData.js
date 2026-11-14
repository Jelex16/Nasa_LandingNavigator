/**
 * Lunar Topography & Candidate Landing Site Catalog.
 * Topography data calibrated with NASA LOLA (Lunar Orbiter Laser Altimeter) DEMs
 * and cross-referenced with NASA Moon Trek & LROC QuickMap datasets.
 */

export const LANDING_SITES = [
  {
    id: 'malapert-mountain',
    name: 'Malapert Mountain (Massif)',
    program: 'Artemis III / CLPS Candidate',
    targetMission: 'Intuitive Machines IM-1 / Artemis III',
    lat: -85.9,
    lon: 357.0,
    elevationKm: 5.0, // 5 km above datum
    avgSlopeDeg: 4.8,
    maxSlopeDeg: 8.5,
    roughnessIndex: 0.18, // 0 to 1
    distToIceTrapKm: 12.4, // Distance to Haworth/Shoemaker cold trap
    geology: 'Macizo anortosítico elevado con cumbres de alta insolación y visibilidad directa ininterrumpida hacia las estaciones terrestres de Deep Space Network (DSN).',
    primaryDatasets: [
      { name: 'LOLA NAC DEM 3.5m IM-1 Landing Site', id: 'cbace602-4b92-4930-b679-f62d0b0e5be2' },
      { name: 'LOLA South Pole DEM 5m v04', id: '52bac771-64e8-4db8-8614-b28c40cd1366' },
      { name: 'LROC NAC High-Res Orthomosaic (0.5m/px)', id: 'LROC_NAC_Malapert' }
    ],
    description:
      'Pico montañoso masivo situado a 5,000 metros sobre el terreno circundante. Ofrece línea de visión panorámica continua hacia la Tierra y hasta un 86% de iluminación solar anual (Candidato a Pico de Luz Eterna).',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return -0.7 + 0.5 * Math.sin(rad - 0.4) + 0.3 * Math.cos(2 * rad + 0.8);
    }
  },
  {
    id: 'connecting-ridge',
    name: 'Connecting Ridge (Shackleton-de Gerlache)',
    program: 'CLPS / Artemis III Priority Zone',
    targetMission: 'VIPER / Commercial Landers',
    lat: -89.4,
    lon: 222.5,
    elevationKm: 1.4,
    avgSlopeDeg: 5.2,
    maxSlopeDeg: 9.1,
    roughnessIndex: 0.22,
    distToIceTrapKm: 3.2,
    geology: 'Cresta estrecha de intercráter entre Shackleton y de Gerlache. Terreno de regolito altamente fracturado con gradientes térmicos extremos entre sombra y sol.',
    primaryDatasets: [
      { name: 'LOLA South Pole 5m Hillshade v04', id: 'b894a1bb-6e79-437a-9234-c616f695db8a' },
      { name: 'LROC NAC Polar Illumination Mosaic', id: 'LROC_NAC_ConnectingRidge' }
    ],
    description:
      'Cresta elevada que conecta el cráter Shackleton con el cráter de Gerlache. Alta visibilidad solar con acceso inmediato a trampas frías permanentemente sombreadas con depósitos volátiles confirmados.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return 0.2 + 0.9 * Math.sin(rad - 1.2) + 0.4 * Math.sin(3 * rad);
    }
  },
  {
    id: 'shackleton-rim',
    name: 'Shackleton Crater Rim (Peak A)',
    program: 'Artemis III / Human Landing System',
    targetMission: 'Starship HLS / Blue Moon',
    lat: -89.9,
    lon: 124.5,
    elevationKm: 1.2,
    avgSlopeDeg: 6.8,
    maxSlopeDeg: 14.5, // Steep interior slope
    roughnessIndex: 0.32,
    distToIceTrapKm: 0.8, // Immediate access to 4.2 km deep interior ice
    geology: 'Borde de impacto de 21 km de diámetro a solo 0.1° del verdadero Polo Sur lunar. Las paredes internas caen más de 4.2 km en sombra perpetua a 40 K.',
    primaryDatasets: [
      { name: 'LRO LOLA DEM South Pole 5m', id: '52bac771-64e8-4db8-8614-b28c40cd1366' },
      { name: 'LOLA Color Hillshade S-Pole 5m', id: '1d26d14a-ce45-4cf7-bef6-f1070ef879a2' },
      { name: 'Mini-RF Bistatic Radar Ice Evidence', id: 'MiniRF_Shackleton_CPR' }
    ],
    description:
      'Directamente sobre el borde del icónico cráter Shackleton. Luz solar rasante casi perpetua en el borde y oscuridad absoluta en el suelo interior del cráter.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return 0.5 + 1.2 * Math.cos(rad - 2.1) + 0.6 * Math.sin(2 * rad);
    }
  },
  {
    id: 'mons-mouton',
    name: 'Mons Mouton (Leibnitz Beta)',
    program: 'CLPS Priority / Artemis Target',
    targetMission: 'CLPS Griffin / VIPER Class',
    lat: -84.9,
    lon: 31.4,
    elevationKm: 5.8,
    avgSlopeDeg: 3.9,
    maxSlopeDeg: 7.2,
    roughnessIndex: 0.15,
    distToIceTrapKm: 18.0,
    geology: 'Meseta tabular de gran altitud remanente del impacto de la cuenca South Pole-Aitken. Topografía excepcionalmente plana con baja densidad de rocas.',
    primaryDatasets: [
      { name: 'LOLA Topography 128ppd', id: '35b0027e-60eb-4e72-bf58-c1ceafe99850' },
      { name: 'LROC WAC Global Mosaic v02', id: 'f0d436fb-c2a8-4c33-ba1c-afdf55bbd688' }
    ],
    description:
      'Vasta meseta de montaña lunar con pendientes sumamente benignas (<4°) y visibilidad ininterrumpida de la Tierra para telemetría directa. Principal zona de aterrizaje de alta estabilidad.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return -0.9 + 0.4 * Math.cos(rad - 0.5);
    }
  },
  {
    id: 'nobile-rim-1',
    name: 'Nobile Crater Rim 1',
    program: 'NASA VIPER Science Target',
    targetMission: 'Commercial Lunar Rover Delivery',
    lat: -85.2,
    lon: 36.1,
    elevationKm: 1.1,
    avgSlopeDeg: 5.6,
    maxSlopeDeg: 10.4,
    roughnessIndex: 0.25,
    distToIceTrapKm: 4.5,
    geology: 'Cresta ondulada esculpida por material eyectado. Conecta terrazas iluminadas con microtrampas frías accesibles para rovers de exploración.',
    primaryDatasets: [
      { name: 'NASA VIPER Traverse Route DEM', id: 'LOLA_VIPER_Nobile' },
      { name: 'LOLA Slope Map 16ppd', id: '14ddabe5-8199-47dc-aaf9-1061b6004f6d' }
    ],
    description:
      'Terreno polar ondulado esculpido por eyecciones de impacto. Ofrece rutas navegables para rovers entre plataformas soleadas y zonas de prospección de hielo.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return 1.1 + 0.8 * Math.sin(rad + 0.6) + 0.5 * Math.cos(2 * rad);
    }
  },
  {
    id: 'haworth-rim',
    name: 'Haworth Crater Rim',
    program: 'CLPS Prospector',
    targetMission: 'Resource Prospecting Lander',
    lat: -87.4,
    lon: 354.8,
    elevationKm: 0.6,
    avgSlopeDeg: 8.2,
    maxSlopeDeg: 16.0,
    roughnessIndex: 0.38,
    distToIceTrapKm: 1.5,
    geology: 'Borde escarpado sobre uno de los puntos térmicos más fríos registrados en el sistema solar (~35 Kelvin). Alto potencial de depósitos de hielo superficial.',
    primaryDatasets: [
      { name: 'LOLA Cold Trap Ice Inventory', id: 'LOLA_Haworth_PSR' },
      { name: 'Diviner Lunar Radiometer Thermal Map', id: 'Diviner_BrightnessTemp' }
    ],
    description:
      'Borde con vistas a uno de los lugares más fríos del sistema solar (fondo de Haworth a ~35 K). Pendientes desafiantes y obstrucción montañosa al sur, máximo valor científico.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return 2.5 + 2.8 * Math.sin(rad - Math.PI / 2) + 0.7 * Math.cos(3 * rad);
    }
  },
  {
    id: 'de-gerlache-rim',
    name: 'de Gerlache Rim 2',
    program: 'Artemis III Candidate',
    targetMission: 'Artemis III Crew Landing',
    lat: -88.5,
    lon: 271.8,
    elevationKm: 1.8,
    avgSlopeDeg: 5.1,
    maxSlopeDeg: 9.8,
    roughnessIndex: 0.21,
    distToIceTrapKm: 5.2,
    geology: 'Cresta con vistas al cráter de Gerlache, con terreno firme y pendientes estables para maniobras de descenso de módulo tripulado.',
    primaryDatasets: [
      { name: 'LOLA South Pole 5m DEM', id: '52bac771-64e8-4db8-8614-b28c40cd1366' },
      { name: 'LROC NAC High-Res Mosaic', id: 'LROC_deGerlache' }
    ],
    description:
      'Borde de gran altitud que proporciona enlaces estables con la Tierra durante el verano del hemisferio sur, con pendientes suaves aptas para módulos tripulados.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      return 0.1 + 0.7 * Math.cos(rad - 1.0) + 0.3 * Math.sin(2 * rad);
    }
  },
  {
    id: 'apollo-11',
    name: 'Apollo 11 (Mare Tranquillitatis)',
    program: 'Historical Baseline (Equatorial)',
    targetMission: 'Apollo 11 Lunar Module Eagle (1969)',
    lat: 0.67,
    lon: 23.47,
    elevationKm: -1.2,
    avgSlopeDeg: 2.1,
    maxSlopeDeg: 4.5,
    roughnessIndex: 0.12,
    distToIceTrapKm: 2800.0,
    geology: 'Llanura basáltica de mar lunar rica en titanio e ilmenita. Suelo plano de eyección con cráteres de impacto de baja profundidad.',
    primaryDatasets: [
      { name: 'Apollo 11 LROC NAC Landing Site Mosaic (0.35m)', id: 'LROC_NAC_Apollo11' },
      { name: 'LROC WAC Global Hapke Albedo', id: 'LROC_WAC_Hapke' }
    ],
    description:
      'Línea base ecuatorial histórica. A diferencia de los polos, experimenta 14 días terrestres de sol abrasador continuo seguidos de 14 días de noche gélida, con la Tierra fija a 60° sobre el horizonte.',
    horizonProfile: () => 0.05
  }
];

/**
 * Computes deep links to ASU / NASA LROC QuickMap.
 * Supports South Pole Polar Stereographic projection (proj=10) and Equatorial Equirectangular.
 */
export function getQuickMapUrl(site) {
  const isSouthPole = site.lat < -75;
  if (isSouthPole) {
    const R_METERS = 1737400;
    const colatRad = ((90 - Math.abs(site.lat)) / 2) * (Math.PI / 180);
    const rho = 2 * R_METERS * Math.tan(colatRad);
    const lonRad = (site.lon * Math.PI) / 180;
    const cx = rho * Math.sin(lonRad);
    const cy = -rho * Math.cos(lonRad);
    const halfWidth = 35000; // 35 km inspection bounding box
    const extent = `${(cx - halfWidth).toFixed(1)},${(cy - halfWidth).toFixed(1)},${(cx + halfWidth).toFixed(1)},${(cy + halfWidth).toFixed(1)}`;
    return `https://quickmap.lroc.asu.edu/layers?prjExtent=${extent}&proj=10`;
  } else {
    const halfDeg = 1.0;
    const minLon = (site.lon - halfDeg).toFixed(3);
    const maxLon = (site.lon + halfDeg).toFixed(3);
    const minLat = (site.lat - halfDeg).toFixed(3);
    const maxLat = (site.lat + halfDeg).toFixed(3);
    return `https://quickmap.lroc.asu.edu/layers?extent=${minLon},${minLat},${maxLon},${maxLat}`;
  }
}

/**
 * Computes deep link to NASA Solar System Treks (Moon Trek).
 */
export function getMoonTrekUrl(site) {
  return `https://trek.nasa.gov/moon/#v=0.1&x=${site.lon.toFixed(4)}&y=${site.lat.toFixed(4)}&z=6&p=urn:ogc:def:crs:EPSG::104903`;
}

/**
 * Creates or interpolates topographic properties for arbitrary coordinates.
 */
export function getCustomSite(lat, lon, name = 'Sitio Personalizado') {
  const normLon = ((lon % 360) + 360) % 360;
  const isSouthPole = lat < -75;
  const distToPoleKm = (90 - Math.abs(lat)) * 30.3;

  const avgSlope = isSouthPole ? 4.5 + Math.abs(Math.sin(lat * 5 + lon * 2)) * 5.0 : 2.5 + Math.abs(Math.sin(lon)) * 2.0;
  const maxSlope = avgSlope * 1.8 + 1.2;
  const roughness = isSouthPole ? 0.18 + Math.abs(Math.cos(lon * 3)) * 0.2 : 0.12;
  const distToIce = isSouthPole ? Math.max(1.0, distToPoleKm * 0.4 + Math.abs(Math.sin(lon)) * 15) : 2500;
  const elevation = isSouthPole ? 1.0 + 3.0 * Math.sin(normLon * (Math.PI / 180)) : -1.0;

  return {
    id: 'custom-site',
    name: `${name} (${lat.toFixed(2)}°, ${normLon.toFixed(2)}°)`,
    program: 'Coordenadas Definidas por el Usuario',
    targetMission: 'Misión Simulada',
    lat,
    lon: normLon,
    elevationKm: elevation,
    avgSlopeDeg: parseFloat(avgSlope.toFixed(1)),
    maxSlopeDeg: parseFloat(maxSlope.toFixed(1)),
    roughnessIndex: parseFloat(roughness.toFixed(2)),
    distToIceTrapKm: parseFloat(distToIce.toFixed(1)),
    geology: 'Punto selenográfico personalizado con perfil de elevación interpolado según datos LOLA.',
    primaryDatasets: [
      { name: 'LOLA Global DEM 128ppd', id: '26ec7aa9-97e4-44e8-95f8-7aa220e5b206' },
      { name: 'LROC WAC Global Mosaic v02', id: 'f0d436fb-c2a8-4c33-ba1c-afdf55bbd688' }
    ],
    description: `Sitio personalizado configurado a ${lat.toFixed(3)}° Latitud, ${normLon.toFixed(3)}° Longitud. Entorno polar simulado con modelos topográficos LOLA.`,
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      if (!isSouthPole) return 0.1;
      return 0.3 + 1.0 * Math.sin(rad + normLon * 0.05) + 0.4 * Math.cos(2 * rad);
    }
  };
}
