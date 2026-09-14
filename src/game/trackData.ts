import * as THREE from 'three';
import { TrackDef, TrackId, TrackWaypoint } from '../types';

export const TRACK_DEFINITIONS: Record<TrackId, TrackDef> = {
  beach: {
    id: 'beach',
    name: 'Praia Tropical',
    subtitle: 'Sol, Areia & Lagoa Turquesa',
    description: 'Circuito costeiro ensolarado com pontes de madeira sobre o mar, curvas pelas dunas e rampas de salto sob as palmeiras.',
    difficulty: 'Fácil',
    totalLaps: 4,
    theme: 'tropical',
    skyColor: 0x38bdf8,
    fogColor: 0x7dd3fc,
    sunColor: 0xfffae0,
    groundColor: 0xf5d996,
    liquidColor: 0x0284c7,
    liquidName: 'Oceano',
  },
  volcano: {
    id: 'volcano',
    name: 'Vulcão Infernal',
    subtitle: 'Rios de Lava & Rocha Ardente',
    description: 'Circuito perigoso nas encostas de um vulcão ativo. Pontes de pedra sobre lava borbulhante, túneis de magma e curvas fechadas em obsidiana.',
    difficulty: 'Difícil',
    totalLaps: 3,
    theme: 'volcano',
    skyColor: 0x450a0a,
    fogColor: 0x7f1d1d,
    sunColor: 0xf97316,
    groundColor: 0x1c1917,
    liquidColor: 0xe11d48,
    liquidName: 'Lava',
  },
  snow: {
    id: 'snow',
    name: 'Pico da Neve',
    subtitle: 'Glaciares & Pistas Alpinas Geladas',
    description: 'Circuito de alta montanha coberto de neve fofa e lagos gelados. Derrapagens espetaculares entre pinheiros cobertos de gelo.',
    difficulty: 'Médio',
    totalLaps: 3,
    theme: 'snow',
    skyColor: 0xbae6fd,
    fogColor: 0xe0f2fe,
    sunColor: 0xffffff,
    groundColor: 0xf1f5f9,
    liquidColor: 0x38bdf8,
    liquidName: 'Gelo Fino',
  },
};

export const WAYPOINTS_COUNT = 400;

// Track 1: Praia Tropical Control Points
const BEACH_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0.4, 0),        // 0: Partida / Meta na praia
  new THREE.Vector3(60, 0.4, 20),      // 1: Curva ligeira à direita
  new THREE.Vector3(120, 0.5, 60),     // 2: Aproximação da encosta costeira
  new THREE.Vector3(150, 1.4, 120),    // 3: Subida suave
  new THREE.Vector3(130, 2.5, 180),    // 4: Crista com vista para o oceano
  new THREE.Vector3(80, 2.0, 230),     // 5: Descida em direção à ponte de madeira
  new THREE.Vector3(20, 1.5, 270),     // 6: Entrada da ponte sobre a lagoa
  new THREE.Vector3(-60, 1.8, 290),    // 7: Meio da ponte de madeira sobre o mar
  new THREE.Vector3(-140, 1.5, 270),   // 8: Saída da ponte para as dunas
  new THREE.Vector3(-190, 0.8, 210),   // 9: Curva ampla à esquerda junto ao palmeiral
  new THREE.Vector3(-220, 0.5, 140),   // 10: Reta nas dunas
  new THREE.Vector3(-210, 2.2, 70),    // 11: Rampa de salto
  new THREE.Vector3(-180, 0.6, 10),    // 12: Zona de aterragem & chicane
  new THREE.Vector3(-130, 0.4, -40),   // 13: Curva da lagoa
  new THREE.Vector3(-70, 0.4, -60),    // 14: Curva tiki
  new THREE.Vector3(-20, 0.4, -30),    // 15: Reta final
];

// Track 2: Vulcão Infernal Control Points (Aggressive, dramatic elevation changes)
const VOLCANO_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0.6, 0),        // 0: Partida na base de pedra negra
  new THREE.Vector3(50, 0.8, 40),      // 1: Curva rápida pela encosta de rocha
  new THREE.Vector3(90, 2.2, 100),     // 2: Subida íngreme
  new THREE.Vector3(100, 4.5, 170),    // 3: Borda da cratera superior
  new THREE.Vector3(60, 4.8, 230),     // 4: Ponte de pedra sobre o lago de lava
  new THREE.Vector3(-10, 3.5, 260),    // 5: Descida rápida em chicane
  new THREE.Vector3(-80, 2.0, 240),    // 6: Curva fechada em redor de pináculo
  new THREE.Vector3(-130, 1.2, 180),   // 7: Reta de aceleração entre rios de lava
  new THREE.Vector3(-170, 1.0, 100),   // 8: Curva ampla de drift em rocha lisa
  new THREE.Vector3(-160, 2.8, 30),    // 9: Rampa de salto sobre rio de fogo
  new THREE.Vector3(-130, 0.8, -40),   // 10: Aterragem & túnel de magma
  new THREE.Vector3(-70, 0.6, -70),    // 11: Curva dupla em S
  new THREE.Vector3(-20, 0.6, -40),    // 12: Reta da meta
];

// Track 3: Pico da Neve Control Points (High speed sweeps, icy lake, snowy hairpins)
const SNOW_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0.5, 0),        // 0: Partida na vila alpina
  new THREE.Vector3(45, 0.5, 30),      // 1: Curva larga pelo bosque de pinheiros
  new THREE.Vector3(110, 1.0, 80),     // 2: Reta do lago congelado
  new THREE.Vector3(160, 1.2, 150),    // 3: Entrada da subida montanhosa
  new THREE.Vector3(150, 3.0, 220),    // 4: Curva inclinada na crista nevada
  new THREE.Vector3(100, 3.8, 280),    // 5: Pico mais alto com vista para o vale
  new THREE.Vector3(20, 2.8, 300),     // 6: Descida rápida em zigue-zague
  new THREE.Vector3(-60, 1.8, 280),    // 7: Ponte de troncos de montanha
  new THREE.Vector3(-130, 1.2, 230),   // 8: Curva de neve fofa
  new THREE.Vector3(-180, 1.0, 150),   // 9: Grande reta do vale branco
  new THREE.Vector3(-190, 2.4, 70),    // 10: Rampa de salto sobre fissura de gelo
  new THREE.Vector3(-160, 0.8, 0),     // 11: Aterragem e chicane de gelo
  new THREE.Vector3(-100, 0.5, -45),   // 12: Curva rápida à direita
  new THREE.Vector3(-30, 0.5, -30),    // 13: Reta final para a meta
];

export interface TrackDataBundle {
  trackDef: TrackDef;
  curve: THREE.CatmullRomCurve3;
  waypoints: TrackWaypoint[];
  length: number;
  boostPads: { u: number; offset: number }[];
  itemBoxClusters: { u: number; offsets: number[] }[];
  ramps: { u: number; height: number; length: number }[];
  bridgeRange: [number, number]; // waypoint index range for bridge over liquid
}

function buildWaypoints(curve: THREE.CatmullRomCurve3, theme: string): TrackWaypoint[] {
  const waypoints: TrackWaypoint[] = [];
  const sampleCount = WAYPOINTS_COUNT;
  let accumulatedDist = 0;
  let prevPoint = curve.getPointAt(0);

  for (let i = 0; i < sampleCount; i++) {
    const u = i / sampleCount;
    const pt = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

    if (i > 0) {
      accumulatedDist += pt.distanceTo(prevPoint);
    }
    prevPoint = pt;

    // Track width between 14.0 and 17.5 units
    let width = 16.0;
    let bank = 0;

    if (theme === 'tropical') {
      if (u > 0.35 && u < 0.55) {
        width = 14.5; // Ponte de madeira
      } else if (u > 0.65 && u < 0.8) {
        width = 17.0; // Dunas amplas
        bank = 0.04;
      }
    } else if (theme === 'volcano') {
      if (u > 0.30 && u < 0.45) {
        width = 14.0; // Ponte de pedra sobre lava
      } else {
        width = 15.5;
        bank = 0.03;
      }
    } else {
      // Snow
      if (u > 0.40 && u < 0.55) {
        width = 15.0;
        bank = 0.06; // banked turn on snowy peak
      } else {
        width = 16.5;
      }
    }

    waypoints.push({
      x: pt.x,
      y: pt.y,
      z: pt.z,
      width,
      normalX: normal.x,
      normalZ: normal.z,
      tangentX: tangent.x,
      tangentZ: tangent.z,
      bank,
      distanceFromStart: accumulatedDist,
    });
  }

  return waypoints;
}

// Build bundles for each track
const BEACH_CURVE = new THREE.CatmullRomCurve3(BEACH_CONTROL_POINTS, true, 'centripetal');
const VOLCANO_CURVE = new THREE.CatmullRomCurve3(VOLCANO_CONTROL_POINTS, true, 'centripetal');
const SNOW_CURVE = new THREE.CatmullRomCurve3(SNOW_CONTROL_POINTS, true, 'centripetal');

export const TRACK_BUNDLES: Record<TrackId, TrackDataBundle> = {
  beach: {
    trackDef: TRACK_DEFINITIONS.beach,
    curve: BEACH_CURVE,
    waypoints: buildWaypoints(BEACH_CURVE, 'tropical'),
    length: BEACH_CURVE.getLength(),
    boostPads: [
      { u: 0.12, offset: 0 },
      { u: 0.38, offset: -2 },
      { u: 0.68, offset: 2 },
      { u: 0.76, offset: 0 },
      { u: 0.94, offset: 0 },
    ],
    itemBoxClusters: [
      { u: 0.08, offsets: [-4.5, 0, 4.5] },
      { u: 0.28, offsets: [-4, 0, 4] },
      { u: 0.48, offsets: [-3.5, 0, 3.5] },
      { u: 0.65, offsets: [-4.5, 0, 4.5] },
      { u: 0.85, offsets: [-4, 0, 4] },
    ],
    ramps: [
      { u: 0.77, height: 2.3, length: 11 },
    ],
    bridgeRange: [140, 220],
  },
  volcano: {
    trackDef: TRACK_DEFINITIONS.volcano,
    curve: VOLCANO_CURVE,
    waypoints: buildWaypoints(VOLCANO_CURVE, 'volcano'),
    length: VOLCANO_CURVE.getLength(),
    boostPads: [
      { u: 0.10, offset: 0 },
      { u: 0.32, offset: 0 },
      { u: 0.60, offset: -2 },
      { u: 0.74, offset: 0 },
      { u: 0.92, offset: 0 },
    ],
    itemBoxClusters: [
      { u: 0.07, offsets: [-4, 0, 4] },
      { u: 0.25, offsets: [-4, 0, 4] },
      { u: 0.50, offsets: [-3.5, 0, 3.5] },
      { u: 0.70, offsets: [-4, 0, 4] },
      { u: 0.88, offsets: [-4, 0, 4] },
    ],
    ramps: [
      { u: 0.75, height: 2.6, length: 12 },
    ],
    bridgeRange: [120, 180],
  },
  snow: {
    trackDef: TRACK_DEFINITIONS.snow,
    curve: SNOW_CURVE,
    waypoints: buildWaypoints(SNOW_CURVE, 'snow'),
    length: SNOW_CURVE.getLength(),
    boostPads: [
      { u: 0.14, offset: 0 },
      { u: 0.35, offset: 2 },
      { u: 0.62, offset: 0 },
      { u: 0.75, offset: 0 },
      { u: 0.93, offset: 0 },
    ],
    itemBoxClusters: [
      { u: 0.09, offsets: [-4, 0, 4] },
      { u: 0.30, offsets: [-4, 0, 4] },
      { u: 0.52, offsets: [-3.5, 0, 3.5] },
      { u: 0.72, offsets: [-4, 0, 4] },
      { u: 0.88, offsets: [-4, 0, 4] },
    ],
    ramps: [
      { u: 0.76, height: 2.4, length: 11 },
    ],
    bridgeRange: [150, 220],
  },
};

/**
 * Robust forward-biased waypoint locator that prevents back-tracking or crossing loops
 */
export function getClosestWaypoint(
  waypoints: TrackWaypoint[],
  x: number,
  z: number,
  lastKnownIndex: number = -1
): { index: number; distSq: number; progress: number } {
  let bestIdx = 0;
  let minDistSq = Infinity;

  if (lastKnownIndex >= 0) {
    // Forward-oriented search: check small step backward (-3) to forward (+25)
    const windowStart = lastKnownIndex - 3;
    const windowLength = 30;

    for (let i = 0; i < windowLength; i++) {
      const idx = (windowStart + i + WAYPOINTS_COUNT * 2) % WAYPOINTS_COUNT;
      const wp = waypoints[idx];
      const dx = wp.x - x;
      const dz = wp.z - z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        bestIdx = idx;
      }
    }
  } else {
    // Uninitialized: full search
    for (let idx = 0; idx < WAYPOINTS_COUNT; idx++) {
      const wp = waypoints[idx];
      const dx = wp.x - x;
      const dz = wp.z - z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        bestIdx = idx;
      }
    }
  }

  return {
    index: bestIdx,
    distSq: minDistSq,
    progress: bestIdx / WAYPOINTS_COUNT,
  };
}

// Backward compatibility exports for default beach track
export const TRACK_WAYPOINTS = TRACK_BUNDLES.beach.waypoints;
export const TRACK_CURVE = BEACH_CURVE;
export const TRACK_LENGTH = TRACK_BUNDLES.beach.length;
export const BOOST_PAD_LOCATIONS = TRACK_BUNDLES.beach.boostPads;
export const ITEM_BOX_CLUSTERS = TRACK_BUNDLES.beach.itemBoxClusters;
export const RAMP_LOCATIONS = TRACK_BUNDLES.beach.ramps;
