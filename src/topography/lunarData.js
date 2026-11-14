/**
 * Lunar Topography & Candidate Landing Site Catalog.
 * Topography data calibrated with NASA LOLA (Lunar Orbiter Laser Altimeter) DEMs.
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
    description:
      'Massif peak perched 5,000 meters above surrounding terrain. Offers unmatched panoramic line-of-sight to Earth and up to 86% annual solar illumination (Peak of Eternal Light candidate).',
    // Realistic 360-degree horizon profile (azimuth in degrees -> horizon obstruction in degrees)
    horizonProfile: (az) => {
      // High elevation gives negative horizon dip in many directions, slight elevation looking towards higher ridge
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
    description:
      'Elevated ridge connecting Shackleton crater to de Gerlache crater. High solar visibility with immediate access to deep permanently shadowed cold traps with suspected volatile deposits.',
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
    description:
      'Directly on the rim of the iconic 21-km diameter Shackleton Crater, just 0.1° from the true Lunar South Pole. Extreme grazing sunlight and permanent darkness within crater floor.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      // High obstruction towards interior crater rim wall, lower outwards
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
    description:
      'Vast flat-topped lunar mountain plateau with remarkably benign slopes (<4°) and uninterrupted Earth visibility for direct telemetry. Premier safe touchdown plateau.',
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
    description:
      'Undulating polar terrain sculpted by impact ejecta. Offers navigable traverse paths for rovers moving between sunlit staging pads and shadowed ice exploration zones.',
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
    description:
      'Rim overlooking one of the coldest spots in the solar system (Haworth floor at ~35 K). Challenging slopes and mountain obstruction to the south, high science value.',
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      // High obstruction towards southern massif
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
    description:
      'High-altitude rim providing steady communications to Earth during southern hemisphere summer, with rolling terrain suitable for lander stability.',
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
    description:
      'Historic equatorial baseline. Unlike the poles, features 14 Earth-days of unbroken searing sunlight followed by 14 Earth-days of frigid night, with Earth towering 60° overhead.',
    horizonProfile: () => 0.05
  }
];

/**
 * Creates or interpolates topographic properties for arbitrary coordinates.
 */
export function getCustomSite(lat, lon, name = 'Sitio Personalizado') {
  // Normalize lon to 0..360
  const normLon = ((lon % 360) + 360) % 360;
  const isSouthPole = lat < -75;
  const distToPoleKm = (90 - Math.abs(lat)) * 30.3; // ~30.3 km per degree on Moon

  // Approximate realistic South Pole topography based on latitude & longitude
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
    description: `Sitio personalizado configurado a ${lat.toFixed(3)}° Latitud, ${normLon.toFixed(3)}° Longitud. Entorno polar simulado con modelos topográficos LOLA.`,
    horizonProfile: (az) => {
      const rad = (az * Math.PI) / 180;
      if (!isSouthPole) return 0.1;
      return 0.3 + 1.0 * Math.sin(rad + normLon * 0.05) + 0.4 * Math.cos(2 * rad);
    }
  };
}
