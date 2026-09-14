import * as THREE from 'three';
import { TrackDataBundle, ItemBox, RacerState } from '../types';
import { WAYPOINTS_COUNT } from './trackData';
import {
  createPalmTree,
  createTropicalRock,
  createVolcanicRock,
  createVolcanicSpire,
  createSnowyPineTree,
  createIceCrystal,
  createItemBoxMesh,
  createBoostPadMesh,
  createStartFinishGantry,
  createRampModel,
} from './models';

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
  const terrainGeo = new THREE.PlaneGeometry(1000, 1000, 48, 48);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    let h = 0;
    if (theme === 'volcano') {
      h = Math.sin(vx * 0.015) * Math.cos(vy * 0.015) * 3.5 + Math.sin(vx * 0.03) * 1.5;
    } else if (theme === 'snow') {
      h = Math.sin(vx * 0.012) * Math.cos(vy * 0.012) * 2.8 + Math.cos(vy * 0.02) * 2.0;
    } else {
      h = Math.sin(vx * 0.02) * Math.cos(vy * 0.02) * 1.8 + Math.sin(vx * 0.008) * 3.0;
    }
    posAttr.setZ(i, Math.max(h - 1.0, -0.4));
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

    const vCoord = i * 0.15;
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

    // Outer curb edges
    const curbW = 1.0;
    const curbLeftOutX = leftX + wp.normalX * curbW;
    const curbLeftOutZ = leftZ + wp.normalZ * curbW;
    const curbRightOutX = rightX - wp.normalX * curbW;
    const curbRightOutZ = rightZ - wp.normalZ * curbW;

    const baseCurbIdx = i * 4;
    curbVertices.push(leftX, leftY + 0.08, leftZ);
    curbVertices.push(curbLeftOutX, leftY + 0.04, curbLeftOutZ);
    curbVertices.push(rightX, rightY + 0.08, rightZ);
    curbVertices.push(curbRightOutX, rightY + 0.04, curbRightOutZ);

    const isRed = Math.floor(i / 2) % 2 === 0;
    let cr = isRed ? 0.95 : 0.95;
    let cg = isRed ? 0.18 : 0.95;
    let cb = isRed ? 0.18 : 0.95;

    if (theme === 'snow') {
      cr = isRed ? 0.2 : 0.95;
      cg = isRed ? 0.6 : 0.95;
      cb = isRed ? 0.95 : 0.95;
    } else if (theme === 'volcano') {
      cr = isRed ? 0.95 : 0.95;
      cg = isRed ? 0.35 : 0.75;
      cb = isRed ? 0.05 : 0.1;
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

  // Road geometry
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();

  const roadColor = theme === 'volcano' ? 0x262626 : theme === 'snow' ? 0x475569 : 0x334155;
  const roadMat = new THREE.MeshStandardMaterial({
    color: roadColor,
    roughness: 0.6,
    metalness: 0.1,
  });
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // Curb geometry
  const curbGeo = new THREE.BufferGeometry();
  curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbVertices, 3));
  curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
  curbGeo.setIndex(curbIndices);
  curbGeo.computeVertexNormals();

  const curbMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.5,
  });
  const curbMesh = new THREE.Mesh(curbGeo, curbMat);
  curbMesh.receiveShadow = true;
  scene.add(curbMesh);

  // Bridge Section Over Liquid
  const [bStart, bEnd] = trackBundle.bridgeRange;
  const bridgeGroup = new THREE.Group();
  const plankColor = theme === 'volcano' ? 0x3f3f46 : theme === 'snow' ? 0x713f12 : 0x78350f;
  const plankMat = new THREE.MeshStandardMaterial({ color: plankColor, roughness: 0.8 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });

  for (let i = bStart; i <= bEnd; i += 2) {
    const wp = waypoints[i];
    const nextWp = waypoints[(i + 1) % WAYPOINTS_COUNT];
    const angleY = Math.atan2(nextWp.x - wp.x, nextWp.z - wp.z);

    const plankGeo = new THREE.BoxGeometry(wp.width + 1.2, 0.25, 1.4);
    const plank = new THREE.Mesh(plankGeo, plankMat);
    plank.position.set(wp.x, wp.y + 0.08, wp.z);
    plank.rotation.y = angleY + Math.PI / 2;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);

    // Railing posts
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6);
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(wp.x + wp.normalX * (wp.width / 2 + 0.4), wp.y + 0.7, wp.z + wp.normalZ * (wp.width / 2 + 0.4));
    bridgeGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(wp.x - wp.normalX * (wp.width / 2 + 0.4), wp.y + 0.7, wp.z - wp.normalZ * (wp.width / 2 + 0.4));
    bridgeGroup.add(rightPost);

    // Pilings
    if (i % 6 === 0) {
      const pilingGeo = new THREE.CylinderGeometry(0.4, 0.45, 6.0, 8);
      const leftPiling = new THREE.Mesh(pilingGeo, postMat);
      leftPiling.position.set(wp.x + wp.normalX * (wp.width / 2), wp.y - 1.8, wp.z + wp.normalZ * (wp.width / 2));
      const rightPiling = new THREE.Mesh(pilingGeo, postMat);
      rightPiling.position.set(wp.x - wp.normalX * (wp.width / 2), wp.y - 1.8, wp.z - wp.normalZ * (wp.width / 2));
      bridgeGroup.add(leftPiling, rightPiling);
    }
  }
  scene.add(bridgeGroup);

  // Start / Finish Gantry
  const startWp = waypoints[0];
  const nextWp = waypoints[1];
  const gantry = createStartFinishGantry(trackDef.name.toUpperCase());
  gantry.position.set(startWp.x, startWp.y, startWp.z);
  gantry.rotation.y = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z);
  scene.add(gantry);

  // Checkered Start Line On Track
  const lineGeo = new THREE.PlaneGeometry(startWp.width, 2.5);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const startLine = new THREE.Mesh(lineGeo, lineMat);
  startLine.rotation.x = -Math.PI / 2;
  startLine.rotation.z = Math.atan2(nextWp.x - startWp.x, nextWp.z - startWp.z) + Math.PI / 2;
  startLine.position.set(startWp.x, startWp.y + 0.08, startWp.z);
  scene.add(startLine);

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

  // Themed Environment Props
  const sceneryGroup = new THREE.Group();

  if (theme === 'volcano') {
    // Volcanic spires and obsidian boulders
    for (let i = 0; i < 45; i++) {
      const spire = createVolcanicSpire();
      const wpIdx = (i * 9 + 4) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 6 + Math.random() * 25;
      spire.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(spire);
    }
    for (let r = 0; r < 50; r++) {
      const rock = createVolcanicRock();
      const wpIdx = (r * 7 + 2) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = r % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 3 + Math.random() * 16;
      rock.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y - 0.2, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(rock);
    }
  } else if (theme === 'snow') {
    // Snowy pine trees and ice crystals
    for (let i = 0; i < 80; i++) {
      const tree = createSnowyPineTree();
      const wpIdx = (i * 5 + 3) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.5 + Math.random() * 22;
      const s = 0.8 + Math.random() * 0.5;
      tree.scale.set(s, s, s);
      tree.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(tree);
    }
    for (let c = 0; c < 35; c++) {
      const crystal = createIceCrystal();
      const wpIdx = (c * 11 + 6) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = c % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 3 + Math.random() * 14;
      crystal.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(crystal);
    }
  } else {
    // Tropical Beach: Palm trees and rocks
    for (let i = 0; i < 85; i++) {
      const palm = createPalmTree();
      const wpIdx = (i * 4 + 2) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = i % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 4.5 + Math.random() * 18;
      const scale = 0.85 + Math.random() * 0.45;
      palm.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y, 0), wp.z + wp.normalZ * dist * side);
      palm.scale.set(scale, scale, scale);
      palm.rotation.y = Math.random() * Math.PI * 2;
      sceneryGroup.add(palm);
    }
    for (let r = 0; r < 40; r++) {
      const rock = createTropicalRock();
      const wpIdx = (r * 9 + 5) % WAYPOINTS_COUNT;
      const wp = waypoints[wpIdx];
      const side = r % 2 === 0 ? 1 : -1;
      const dist = wp.width / 2 + 2.5 + Math.random() * 12;
      rock.position.set(wp.x + wp.normalX * dist * side, Math.max(wp.y - 0.3, 0), wp.z + wp.normalZ * dist * side);
      sceneryGroup.add(rock);
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
