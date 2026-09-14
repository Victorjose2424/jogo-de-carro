import * as THREE from 'three';
import { TrackDataBundle, ItemBox, RacerState } from '../types';
import { WAYPOINTS_COUNT, getClosestWaypoint } from './trackData';
import {
  createPalmTree,
  createTropicalBush,
  createTropicalRock,
  createVolcanicRock,
  createVolcanicSpire,
  createCharredDeadTree,
  createSnowyPineTree,
  createFrostedBirch,
  createIceCrystal,
  createItemBoxMesh,
  createBoostPadMesh,
  createStartFinishGantry,
  createSpectatorGrandstand,
  createDirectionalChevronSign,
  createTracksideTorch,
  createRampModel,
} from './models';
import {
  getProceduralRoadTexture,
  getCheckeredFinishLineTexture,
  getBridgePlankTexture,
} from './environmentTextures';

export interface SceneBundle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  itemBoxes: ItemBox[];
  boostPads: THREE.Group[];
  updateEnvironment: (dt: number, time: number, racers: RacerState[]) => void;
  dispose: () => void;
}

// Skid mark segment interface
interface SkidMark {
  mesh: THREE.Mesh;
  opacity: number;
}

export function initThreeScene(
  container: HTMLDivElement,
  trackBundle: TrackDataBundle
): SceneBundle {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const trackDef = trackBundle.trackDef;
  const waypoints = trackBundle.waypoints;
  const theme = trackDef.theme;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(trackDef.skyColor);
  scene.fog = new THREE.FogExp2(trackDef.fogColor, theme === 'volcano' ? 0.0042 : 0.0032);

  // Camera
  const camera = new THREE.PerspectiveCamera(65, width / height, 0.3, 1300);
  camera.position.set(0, 10, -20);

  // High Quality WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = theme === 'volcano' ? 1.15 : 1.05;
  container.appendChild(renderer.domElement);

  // Lighting Configuration per Track Theme
  const ambientLight = new THREE.HemisphereLight(
    theme === 'volcano' ? 0xff7733 : theme === 'snow' ? 0xe0f2fe : 0xfff7ed,
    theme === 'volcano' ? 0x450a0a : theme === 'snow' ? 0x38bdf8 : 0x0284c7,
    theme === 'volcano' ? 0.9 : 0.8
  );
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(trackDef.sunColor, theme === 'volcano' ? 1.8 : 1.5);
  sunLight.position.set(160, 240, 120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 650;
  sunLight.shadow.camera.left = -200;
  sunLight.shadow.camera.right = 200;
  sunLight.shadow.camera.top = 200;
  sunLight.shadow.camera.bottom = -200;
  sunLight.shadow.bias = -0.0003;
  sunLight.shadow.radius = 2.0;
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(trackDef.liquidColor, theme === 'volcano' ? 0.6 : 0.4);
  fillLight.position.set(-120, 90, -120);
  scene.add(fillLight);

  // Stylized Radiant Sun Disc
  const sunDiscGeo = new THREE.SphereGeometry(22, 16, 16);
  const sunDiscMat = new THREE.MeshBasicMaterial({
    color: theme === 'volcano' ? 0xff4500 : theme === 'snow' ? 0xfffbeb : 0xfef08a,
  });
  const sunDisc = new THREE.Mesh(sunDiscGeo, sunDiscMat);
  sunDisc.position.set(320, 480, 240);
  scene.add(sunDisc);

  // Low-Poly Volumetric Drifting Clouds
  const cloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: theme === 'volcano' ? 0x475569 : 0xffffff,
    roughness: 0.95,
    flatShading: true,
  });
  const cloudList: THREE.Group[] = [];

  for (let c = 0; c < 22; c++) {
    const cloud = new THREE.Group();
    const numPuffs = 5 + Math.floor(Math.random() * 4);
    for (let p = 0; p < numPuffs; p++) {
      const puffR = 6.0 + Math.random() * 7.0;
      const puffGeo = new THREE.SphereGeometry(puffR, 7, 6);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (p - numPuffs / 2) * 8.0 + (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      puff.scale.y = 0.65;
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() - 0.5) * 900,
      95 + Math.random() * 55,
      (Math.random() - 0.5) * 900
    );
    cloudsGroup.add(cloud);
    cloudList.push(cloud);
  }
  scene.add(cloudsGroup);

  // Weather Atmosphere Particles (Snowflakes or Volcano Embers)
  let weatherParticleGeo: THREE.BufferGeometry | null = null;
  let weatherParticles: THREE.Points | null = null;
  let weatherPositions: Float32Array | null = null;
  const WEATHER_COUNT = theme === 'snow' ? 400 : theme === 'volcano' ? 180 : 0;

  if (WEATHER_COUNT > 0) {
    weatherParticleGeo = new THREE.BufferGeometry();
    weatherPositions = new Float32Array(WEATHER_COUNT * 3);

    for (let p = 0; p < WEATHER_COUNT; p++) {
      weatherPositions[p * 3] = (Math.random() - 0.5) * 500;
      weatherPositions[p * 3 + 1] = Math.random() * 60;
      weatherPositions[p * 3 + 2] = (Math.random() - 0.5) * 500;
    }

    weatherParticleGeo.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: theme === 'snow' ? 0xffffff : 0xf97316,
      size: theme === 'snow' ? 0.9 : 1.4,
      transparent: true,
      opacity: theme === 'snow' ? 0.85 : 0.9,
    });
    weatherParticles = new THREE.Points(weatherParticleGeo, pMat);
    scene.add(weatherParticles);
  }

  // Themed Liquid Plane (Ocean, Molten Lava, or Frozen Lake)
  const liquidGeo = new THREE.PlaneGeometry(1800, 1800, 32, 32);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: trackDef.liquidColor,
    roughness: theme === 'volcano' ? 0.4 : theme === 'snow' ? 0.15 : 0.1,
    metalness: theme === 'snow' ? 0.3 : 0.1,
    emissive: theme === 'volcano' ? 0xd97706 : 0x000000,
    emissiveIntensity: theme === 'volcano' ? 0.6 : 0,
    transparent: true,
    opacity: theme === 'snow' ? 0.92 : 0.88,
  });
  const liquidPlane = new THREE.Mesh(liquidGeo, liquidMat);
  liquidPlane.rotation.x = -Math.PI / 2;
  liquidPlane.position.y = -0.2;
  liquidPlane.receiveShadow = true;
  scene.add(liquidPlane);

  // Themed Terrain Plane
  const [bStart, bEnd] = trackBundle.bridgeRange;
  const terrainGeo = new THREE.PlaneGeometry(1000, 1000, 64, 64);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const worldX = vx;
    const worldZ = -vy;

    let naturalH = 0;
    if (theme === 'volcano') {
      naturalH = Math.sin(vx * 0.015) * Math.cos(vy * 0.015) * 3.5 + Math.sin(vx * 0.03) * 1.5;
    } else if (theme === 'snow') {
      naturalH = Math.sin(vx * 0.012) * Math.cos(vy * 0.012) * 2.8 + Math.cos(vy * 0.02) * 2.0;
    } else {
      naturalH = Math.sin(vx * 0.02) * Math.cos(vy * 0.02) * 1.8 + Math.sin(vx * 0.008) * 3.0;
    }
    const baseTerrainH = Math.max(naturalH - 1.0, -0.3);

    // Sculpt terrain to fit cleanly beneath track waypoints without protruding
    const wpInfo = getClosestWaypoint(waypoints, worldX, worldZ);
    const wp = waypoints[wpInfo.index];
    const distToTrack = Math.sqrt(wpInfo.distSq);
    const halfW = wp.width / 2;
    const isBridgeSection = wpInfo.index >= bStart && wpInfo.index <= bEnd;

    let finalH = baseTerrainH;
    if (isBridgeSection) {
      if (distToTrack < halfW + 12.0) {
        finalH = -0.55; // lowered below water plane (-0.2)
      } else if (distToTrack < halfW + 28.0) {
        const t = (distToTrack - (halfW + 12.0)) / 16.0;
        finalH = -0.55 * (1 - t) + baseTerrainH * t;
      }
    } else {
      const roadBedH = wp.y - 0.25;
      if (distToTrack <= halfW + 2.0) {
        finalH = roadBedH;
      } else if (distToTrack <= halfW + 24.0) {
        const t = (distToTrack - (halfW + 2.0)) / 22.0;
        finalH = roadBedH * (1 - t) + baseTerrainH * t;
      }
    }

    posAttr.setZ(i, finalH);
  }
  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    color: trackDef.groundColor,
    roughness: 0.95,
    metalness: theme === 'volcano' ? 0.2 : 0.0,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0.0;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Themed Distant Mountain Peaks
  const mountainsGroup = new THREE.Group();
  const mountainColor = theme === 'volcano' ? 0x1c1917 : theme === 'snow' ? 0xf8fafc : 0x1e3a2f;
  const mountainMat = new THREE.MeshStandardMaterial({
    color: mountainColor,
    roughness: 0.9,
    flatShading: true,
  });
  const mountainConfigs = [
    { x: 380, z: 250, r: 140, h: 140 },
    { x: 450, z: 50, r: 170, h: 160 },
    { x: 320, z: -220, r: 150, h: 130 },
    { x: 100, z: -420, r: 160, h: 150 },
    { x: -350, z: -380, r: 180, h: 170 },
  ];
  mountainConfigs.forEach(m => {
    const cone = new THREE.ConeGeometry(m.r, m.h, 8);
    const mMesh = new THREE.Mesh(cone, mountainMat);
    mMesh.position.set(m.x, m.h / 2 - 10, m.z);
    mMesh.receiveShadow = true;
    mountainsGroup.add(mMesh);
  });
  scene.add(mountainsGroup);

  // --- PROCEDURAL 3D TRACK MESH ---
  const roadVertices: number[] = [];
  const roadIndices: number[] = [];
  const roadUVs: number[] = [];

  const curbVertices: number[] = [];
  const curbIndices: number[] = [];
  const curbColors: number[] = [];

  for (let i = 0; i <= WAYPOINTS_COUNT; i++) {
    const idx = i % WAYPOINTS_COUNT;
    const wp = waypoints[idx];
    const halfW = wp.width / 2;

    const leftX = wp.x + wp.normalX * halfW;
    const leftZ = wp.z + wp.normalZ * halfW;
    const rightX = wp.x - wp.normalX * halfW;
    const rightZ = wp.z - wp.normalZ * halfW;

    const leftY = wp.y + (wp.bank || 0) * halfW;
    const rightY = wp.y - (wp.bank || 0) * halfW;

    roadVertices.push(leftX, leftY + 0.05, leftZ);
    roadVertices.push(rightX, rightY + 0.05, rightZ);

    const vCoord = i * 0.12;
    roadUVs.push(0, vCoord);
    roadUVs.push(1, vCoord);

    if (i < WAYPOINTS_COUNT) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      roadIndices.push(v0, v2, v1);
      roadIndices.push(v1, v2, v3);
    }

    // Outer curb edges with 3D beveled rumble profile
    const curbW = 1.1;
    const curbLeftOutX = leftX + wp.normalX * curbW;
    const curbLeftOutZ = leftZ + wp.normalZ * curbW;
    const curbRightOutX = rightX - wp.normalX * curbW;
    const curbRightOutZ = rightZ - wp.normalZ * curbW;

    const baseCurbIdx = i * 4;
    curbVertices.push(leftX, leftY + 0.10, leftZ);
    curbVertices.push(curbLeftOutX, leftY + 0.03, curbLeftOutZ);
    curbVertices.push(rightX, rightY + 0.10, rightZ);
    curbVertices.push(curbRightOutX, rightY + 0.03, curbRightOutZ);

    const isRed = Math.floor(i / 2) % 2 === 0;
    let cr = isRed ? 0.95 : 0.95;
    let cg = isRed ? 0.18 : 0.95;
    let cb = isRed ? 0.18 : 0.95;

    if (theme === 'snow') {
      cr = isRed ? 0.15 : 0.95;
      cg = isRed ? 0.65 : 0.95;
      cb = isRed ? 0.98 : 0.95;
    } else if (theme === 'volcano') {
      cr = isRed ? 0.98 : 0.85;
      cg = isRed ? 0.35 : 0.55;
      cb = isRed ? 0.05 : 0.15;
    }

    for (let c = 0; c < 4; c++) {
      curbColors.push(cr, cg, cb);
    }

    if (i < WAYPOINTS_COUNT) {
      const c0 = baseCurbIdx;
      const c1 = baseCurbIdx + 1;
      const c2 = baseCurbIdx + 4;
      const c3 = baseCurbIdx + 5;
      curbIndices.push(c0, c2, c1);
      curbIndices.push(c1, c2, c3);

      const r0 = baseCurbIdx + 2;
      const r1 = baseCurbIdx + 3;
      const r2 = baseCurbIdx + 6;
      const r3 = baseCurbIdx + 7;
      curbIndices.push(r0, r1, r2);
      curbIndices.push(r1, r3, r2);
    }
  }

  // High-Definition Road Geometry & Material
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadTexture = getProceduralRoadTexture(theme);
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: theme === 'snow' ? 0.7 : 0.65,
    metalness: 0.1,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // Beveled Curb Geometry
  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVertices, 3));
  curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.1,
  });
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.receiveShadow = true;
  scene.add(curbMesh);

  // Upgraded Bridge Section Over Liquid
  const bridgeGroup = new THREE.Group();
  const plankTexture = getBridgePlankTexture(theme);
  const plankMat = new THREE.MeshStandardMaterial({
    map: plankTexture,
    roughness: 0.75,
    metalness: 0.15,
  });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
  const handrailMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

  for (let i = bStart; i <= bEnd; i += 2) {
    const wp = waypoints[i];
    const nextWp = waypoints[(i + 1) % WAYPOINTS_COUNT];
    const angleY = Math.atan2(nextWp.x - wp.x, nextWp.z - wp.z);

    const plankGeo = new THREE.BoxGeometry(wp.width + 1.4, 0.28, 1.4);
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(wp.x, wp.y + 0.08, wp.z);
    plank.rotation.y = angleY + Math.PI / 2;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);

    // Railing posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.5, 6);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(wp.x + wp.normalX * (wp.width / 2 + 0.45), wp.y + 0.75, wp.z + wp.normalZ * (wp.width / 2 + 0.45));
    bridgeGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(wp.x - wp.normalX * (wp.width / 2 + 0.45), wp.y + 0.75, wp.z - wp.normalZ * (wp.width / 2 + 0.45));
    bridgeGroup.add(rightPost);

    // Top Handrail segment connecting posts
    const railGeo = new THREE.BoxGeometry(0.16, 0.16, 2.3);
    const leftRail = new THREE.Mesh(railGeo, handrailMat);
    leftRail.position.set(wp.x + wp.normalX * (wp.width / 2 + 0.45), wp.y + 1.45, wp.z + wp.normalZ * (wp.width / 2 + 0.45));
    leftRail.rotation.y = angleY;
    bridgeGroup.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, handrailMat);
    rightRail.position.set(wp.x - wp.normalX * (wp.width / 2 + 0.45), wp.y + 1.45, wp.z - wp.normalZ * (wp.width / 2 + 0.45));
    rightRail.rotation.y = angleY;
    bridgeGroup.add(rightRail);

    // Heavy pilings sunk into waterbed
    if (i % 6 === 0) {
      const pilingGeo = new THREE.CylinderGeometry(0.4, 0.45, 7.0, 8);
      const leftPiling = new THREE.Mesh(pilingGeo, postMat);
      leftPiling.position.set(wp.x + wp.normalX * (wp.width / 2), wp.y - 2.0, wp.z + wp.normalZ * (wp.width / 2));
      const rightPiling = new THREE.Mesh(pilingGeo, postMat);
      rightPiling.position.set(wp.x - wp.normalX * (wp.width / 2), wp.y - 2.0, wp.z - wp.normalZ * (wp.width / 2));
      bridgeGroup.add(leftPiling, rightPiling);
    }

    // Bridge illumination torches/lanterns
    if (i % 8 === 0) {
      const torch = createTracksideTorch(theme);
      torch.position.set(wp.x + wp.normalX * (wp.width / 2 + 0.45), wp.y + 1.5, wp.z + wp.normalZ * (wp.width / 2 + 0.45));
      bridgeGroup.add(torch);
    }
  }
  scene.add(bridgeGroup);

  // Start / Finish Gantry with Starting Signal Lights
  const startWp = waypoints[0];
  const nextWp = waypoints[1];
  const gantry = createStartFinishGantry(trackDef.name.toUpperCase());
  gantry.position.set(startWp.x, startWp.y, startWp.z);
  gantry.rotation.y = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);
  scene.add(gantry);

  // High-Definition Checkered Start / Finish Line On Track
  const lineGeo = new THREE.PlaneGeometry(startWp.width, 3.2);
  const lineMat = new THREE.MeshBasicMaterial({
    map: getCheckeredFinishLineTexture(),
    transparent: true,
  });
  const startLine = new THREE.Mesh(lineGeo, lineMat);
  startLine.rotation.x = -Math.PI / 2;
  startLine.rotation.z = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z) + Math.PI / 2;
  startLine.position.set(startWp.x, startWp.y + 0.08, startWp.z);
  scene.add(startLine);

  // Spectator Grandstands on Left and Right of Start/Finish Straight
  const trackHeading = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);
  const leftGrandstand = createSpectatorGrandstand(theme);
  leftGrandstand.position.set(
    startWp.x + startWp.normalX * (startWp.width / 2 + 7.5),
    startWp.y,
    startWp.z + startWp.normalZ * (startWp.width / 2 + 7.5)
  );
  leftGrandstand.rotation.y = trackHeading + Math.PI / 2;
  scene.add(leftGrandstand);

  const rightGrandstand = createSpectatorGrandstand(theme);
  rightGrandstand.position.set(
    startWp.x - startWp.normalX * (startWp.width / 2 + 7.5),
    startWp.y,
    startWp.z - startWp.normalZ * (startWp.width / 2 + 7.5)
  );
  rightGrandstand.rotation.y = trackHeading - Math.PI / 2;
  scene.add(rightGrandstand);

  // Directional Chevron Warning Signs at Sharp Curves
  for (let i = 8; i < WAYPOINTS_COUNT - 8; i += 5) {
    const wp = waypoints[i];
    const wpAhead = waypoints[(i + 5) % WAYPOINTS_COUNT];
    // Cross product of 2D tangents determines turn direction and sharpness
    const cross = wp.tangentX * wpAhead.tangentZ - wp.tangentZ * wpAhead.tangentX;
    if (Math.abs(cross) > 0.32) {
      const isRightTurn = cross > 0;
      const chevron = createDirectionalChevronSign(isRightTurn ? 'right' : 'left');
      // Place on outer shoulder of turn
      const side = isRightTurn ? 1 : -1;
      const dist = wp.width / 2 + 2.8;
      chevron.position.set(
        wp.x + wp.normalX * dist * side,
        wp.y,
        wp.z + wp.normalZ * dist * side
      );
      chevron.rotation.y = Math.atan2(wp.tangentX, wp.tangentZ) + (isRightTurn ? -0.35 : 0.35);
      scene.add(chevron);
    }
  }

  // Speed Boost Pads
  const boostPads: THREE.Group[] = [];
  trackBundle.boostPads.forEach(loc => {
    const pad = createBoostPadMesh();
    const wpIdx = Math.floor(loc.u * WAYPOINTS_COUNT);
    const wp = waypoints[wpIdx];
    const nWp = waypoints[(wpIdx + 1) % WAYPOINTS_COUNT];
    
    pad.position.set(
      wp.x + wp.normalX * loc.offset,
      wp.y + 0.06,
      wp.z + wp.normalZ * loc.offset
    );
    pad.rotation.y = Math.atan2(nWp.x - wp.x, nWp.z - wp.z);
    scene.add(pad);
    boostPads.push(pad);
  });

  // Jump Ramps (Correctly aligned with track tangent and slope)
  trackBundle.ramps.forEach(ramp => {
    const wpIdx = Math.floor(ramp.u * WAYPOINTS_COUNT);
    const wp = waypoints[wpIdx];
    const rampMesh = createRampModel(wp.width, ramp.height, ramp.length, theme);

    rampMesh.position.set(wp.x, wp.y, wp.z);
    // Align with track tangent vector forward: Math.atan2(tangentX, tangentZ)
    rampMesh.rotation.y = Math.atan2(wp.tangentX, wp.tangentZ);
    scene.add(rampMesh);
  });

  // Mystery Item Boxes
  const itemBoxes: ItemBox[] = [];
  let boxIdCounter = 0;

  trackBundle.itemBoxClusters.forEach(cluster => {
    const wpIdx = Math.floor(cluster.u * WAYPOINTS_COUNT);
    const wp = waypoints[wpIdx];

    cluster.offsets.forEach(off => {
      const boxMesh = createItemBoxMesh();
      const bx = wp.x + wp.normalX * off;
      const by = wp.y + 1.2;
      const bz = wp.z + wp.normalZ * off;

      boxMesh.position.set(bx, by, bz);
      scene.add(boxMesh);

      itemBoxes.push({
        id: boxIdCounter++,
        x: bx,
        y: by,
        z: bz,
        active: true,
        respawnTimer: 0,
        mesh: boxMesh,
      });
    });
  });

  // Themed Environment Props with High Quality Vegetation & Scenery
  const sceneryGroup = new THREE.Group();
  const treesWithSway: THREE.Object3D[] = [];

  if (theme === 'volcano') {
    // Volcanic spires with glowing molten fissures
    for (let i = 0; i < 45; i++) {
      const spire = createVolcanicSpire();
      const wpIdx = (i * 9 + 4) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 6 + Math.random() * 25;
      spire.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(spire);
    }
    // Charred dead trees with smoldering embers
    for (let t = 0; t < 45; t++) {
      const deadTree = createCharredDeadTree();
      const wpIdx = (t * 7 + 1) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = t % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.5 + Math.random() * 18;
      const s = 0.85 + Math.random() * 0.4;
      deadTree.scale.set(s, s, s);
      deadTree.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(deadTree);
      treesWithSway.push(deadTree);
    }
    // Obsidian boulders with magma veins
    for (let r = 0; r < 50; r++) {
      const rock = createVolcanicRock();
      const wpIdx = (r * 7 + 2) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = r % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 3 + Math.random() * 16;
      rock.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y - 0.2, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(rock);
    }
    // Trackside lava torches
    for (let tr = 0; tr < 25; tr++) {
      const torch = createTracksideTorch('volcano');
      const wpIdx = (tr * 16 + 8) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = tr % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 1.8;
      torch.position.set(wp.x + wp.normalX * dist * side, wp.y, wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(torch);
    }
  } else if (theme === 'snow') {
    // Grand Snowy Alpine Pine Trees
    for (let i = 0; i < 80; i++) {
      const tree = createSnowyPineTree();
      const wpIdx = (i * 5 + 3) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.5 + Math.random() * 22;
      const s = 0.85 + Math.random() * 0.55;
      tree.scale.set(s, s, s);
      tree.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(tree);
      treesWithSway.push(tree);
    }
    // Frosted Silver Birch Trees
    for (let b = 0; b < 35; b++) {
      const birch = createFrostedBirch();
      const wpIdx = (b * 11 + 5) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = b % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.0 + Math.random() * 16;
      const s = 0.8 + Math.random() * 0.4;
      birch.scale.set(s, s, s);
      birch.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(birch);
      treesWithSway.push(birch);
    }
    // Sparkling Glacial Ice Crystals
    for (let c = 0; c < 35; c++) {
      const crystal = createIceCrystal();
      const wpIdx = (c * 11 + 6) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = c % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 3 + Math.random() * 14;
      crystal.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(crystal);
    }
    // Trackside snow lanterns
    for (let tr = 0; tr < 25; tr++) {
      const lantern = createTracksideTorch('snow');
      const wpIdx = (tr * 16 + 8) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = tr % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 1.8;
      lantern.position.set(wp.x + wp.normalX * dist * side, wp.y, wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(lantern);
    }
  } else {
    // Tropical Beach: Curved Lush Palm Trees with double-tier fronds and coconuts
    for (let i = 0; i < 90; i++) {
      const palm = createPalmTree();
      const wpIdx = (i * 4 + 2) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.5 + Math.random() * 20;
      const scale = 0.85 + Math.random() * 0.5;
      palm.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      palm.scale.set(scale, scale, scale);
      palm.rotation.y = Math.random() * Math.PI * 2;
      sceneryGroup.add(palm);
      treesWithSway.push(palm);
    }
    // Lush Tropical Flower Bushes (Monstera foliage with vibrant hibiscus flowers)
    for (let fb = 0; fb < 50; fb++) {
      const bush = createTropicalBush();
      const wpIdx = (fb * 7 + 3) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = fb % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 2.5 + Math.random() * 10;
      const s = 0.85 + Math.random() * 0.4;
      bush.scale.set(s, s, s);
      bush.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(bush);
    }
    // Mossy Tropical Boulders
    for (let r = 0; r < 40; r++) {
      const rock = createTropicalRock();
      const wpIdx = (r * 9 + 5) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = r % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 2.5 + Math.random() * 12;
      rock.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y - 0.3, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(rock);
    }
    // Trackside Tiki Torches
    for (let tr = 0; tr < 25; tr++) {
      const tiki = createTracksideTorch('tropical');
      const wpIdx = (tr * 16 + 8) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = tr % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 1.8;
      tiki.position.set(wp.x + wp.normalX * dist * side, wp.y, wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(tiki);
    }
  }
  scene.add(sceneryGroup);

  // --- DRIFT SKID MARKS SYSTEM ---
  const skidMarks: SkidMark[] = [];
  const MAX_SKID_MARKS = 180;
  const skidMat = new THREE.MeshBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const skidQuadGeo = new THREE.PlaneGeometry(0.35, 1.2);

  function spawnSkidMark(x: number, y: number, z: number, rotationY: number) {
    if (skidMarks.length >= MAX_SKID_MARKS) {
      const old = skidMarks.shift();
      if (old) {
        scene.remove(old.mesh);
      }
    }
    const mesh = new THREE.Mesh(skidQuadGeo, skidMat.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -rotationY;
    mesh.position.set(x, y + 0.06, z);
    scene.add(mesh);
    skidMarks.push({ mesh, opacity: 0.55 });
  }

  // --- DRIFT SPARK PARTICLES POOL ---
  const sparksGroup = new THREE.Group();
  scene.add(sparksGroup);

  interface SparkParticle {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    color: number;
  }
  const sparkParticles: SparkParticle[] = [];
  const sparkGeo = new THREE.SphereGeometry(0.12, 6, 6);

  function spawnSparks(x: number, y: number, z: number, color: number) {
    if (sparkParticles.length > 80) return;
    const count = 3;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(sparkGeo, mat);
      mesh.position.set(x, y, z);
      sparksGroup.add(mesh);

      sparkParticles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: 1.5 + Math.random() * 3,
        vz: (Math.random() - 0.5) * 4,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.2,
        color,
      });
    }
  }

  // Resize handler
  const handleResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', handleResize);

  let skidThrottle = 0;

  // Environment animation loop
  const updateEnvironment = (dt: number, time: number, racers: RacerState[]) => {
    // Gentle liquid movement
    if (theme === 'tropical') {
      liquidPlane.position.y = -0.2 + Math.sin(time * 1.5) * 0.08;
    } else if (theme === 'volcano') {
      liquidPlane.position.y = -0.2 + Math.sin(time * 2.5) * 0.12;
      (liquidMat as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + Math.sin(time * 3.0) * 0.2;
    }

    // Drifting Volumetric Clouds Across the Sky
    cloudList.forEach(cloud => {
      cloud.position.x += dt * 3.2;
      if (cloud.position.x > 480) {
        cloud.position.x = -480;
      }
    });

    // Natural Sinusoidal Wind Sway on Trees and Palms
    treesWithSway.forEach(tree => {
      const swayZ = Math.sin(time * 2.0 + tree.position.x * 0.12 + tree.position.z * 0.08) * 0.045;
      const swayX = Math.cos(time * 1.6 + tree.position.z * 0.12) * 0.03;
      tree.rotation.z = swayZ;
      tree.rotation.x = swayX;
    });

    // Weather Particles Simulation (Snowfall or Floating Lava Embers)
    if (weatherParticles && weatherPositions && weatherParticleGeo) {
      const count = weatherPositions.length / 3;
      for (let p = 0; p < count; p++) {
        if (theme === 'snow') {
          weatherPositions[p * 3 + 1] -= dt * 11; // snow falls down
          weatherPositions[p * 3] += Math.sin(time * 1.4 + p) * dt * 3.0; // gentle wind gust
          if (weatherPositions[p * 3 + 1] < 0) {
            weatherPositions[p * 3 + 1] = 58;
            weatherPositions[p * 3] = (Math.random() - 0.5) * 500;
            weatherPositions[p * 3 + 2] = (Math.random() - 0.5) * 500;
          }
        } else if (theme === 'volcano') {
          weatherPositions[p * 3 + 1] += dt * 7.5; // fiery embers rise into sky
          weatherPositions[p * 3] += Math.sin(time * 2.2 + p) * dt * 2.2;
          if (weatherPositions[p * 3 + 1] > 58) {
            weatherPositions[p * 3 + 1] = 0;
            weatherPositions[p * 3] = (Math.random() - 0.5) * 500;
            weatherPositions[p * 3 + 2] = (Math.random() - 0.5) * 500;
          }
        }
      }
      weatherParticleGeo.attributes.position.needsUpdate = true;
    }

    // Animate item boxes
    itemBoxes.forEach(box => {
      if (box.mesh) {
        if (box.active) {
          box.mesh.visible = true;
          box.mesh.rotation.y += dt * 2.2;
          box.mesh.position.y = box.y + Math.sin(time * 3.0 + box.id) * 0.15;
        } else {
          box.mesh.visible = false;
          box.respawnTimer -= dt;
          if (box.respawnTimer <= 0) {
            box.active = true;
          }
        }
      }
    });

    // Animate boost pads
    boostPads.forEach((pad, idx) => {
      const pulse = 0.85 + Math.sin(time * 8.0 + idx) * 0.15;
      pad.scale.set(1, 1, pulse);
    });

    // Spawn Skid Marks & Sparks for Drifting Racers
    skidThrottle += dt;
    const shouldSpawnSkid = skidThrottle >= 0.06;
    if (shouldSpawnSkid) {
      skidThrottle = 0;
    }

    racers.forEach(racer => {
      if (racer.isEliminated) return;

      const isDrifting = racer.driftDirection !== 0;
      const isHardTurn = Math.abs(racer.steerAngle) > 0.35 && racer.speed > 55;

      if ((isDrifting || isHardTurn) && racer.isGrounded) {
        if (shouldSpawnSkid) {
          // Left and right rear wheel contact spots
          const cosR = Math.cos(racer.rotationY);
          const sinR = Math.sin(racer.rotationY);

          // Left wheel spot
          const lwx = racer.x - cosR * 0.85 - sinR * 0.85;
          const lwz = racer.z + sinR * 0.85 - cosR * 0.85;
          spawnSkidMark(lwx, racer.y, lwz, racer.rotationY);

          // Right wheel spot
          const rwx = racer.x + cosR * 0.85 - sinR * 0.85;
          const rwz = racer.z - sinR * 0.85 - cosR * 0.85;
          spawnSkidMark(rwx, racer.y, rwz, racer.rotationY);
        }

        // Spawn drift sparks if mini-turbo level is active
        if (isDrifting && racer.driftBoostLevel > 0) {
          const sparkColor = racer.driftBoostLevel === 2 ? 0xf97316 : 0x38bdf8;
          spawnSparks(racer.x, racer.y + 0.25, racer.z, sparkColor);
        }
      }
    });

    // Fade old skid marks
    for (let i = skidMarks.length - 1; i >= 0; i--) {
      const mark = skidMarks[i];
      mark.opacity -= dt * 0.04; // Gradually fade over ~12s
      if (mark.opacity <= 0.05) {
        scene.remove(mark.mesh);
        skidMarks.splice(i, 1);
      } else {
        (mark.mesh.material as THREE.MeshBasicMaterial).opacity = mark.opacity;
      }
    }

    // Update spark particles
    for (let i = sparkParticles.length - 1; i >= 0; i--) {
      const p = sparkParticles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        sparksGroup.remove(p.mesh);
        sparkParticles.splice(i, 1);
      } else {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.vy -= 9.8 * dt; // Gravity
        const scale = 1 - p.life / p.maxLife;
        p.mesh.scale.set(scale, scale, scale);
      }
    }
  };

  const dispose = () => {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentElement) {
      renderer.domElement.parentElement.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    itemBoxes,
    boostPads,
    updateEnvironment,
    dispose,
  };
}
