import * as THREE from 'three';
import { CharacterDef, KartTypeDef } from '../types';
import { getGantryBannerTexture, getChevronBoardTexture } from './environmentTextures';

export interface KartMeshBundle {
  root: THREE.Group;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  steeringWheel: THREE.Group;
  driverHead: THREE.Group;
  exhaustLeft: THREE.Mesh;
  exhaustRight: THREE.Mesh;
  flameLeft: THREE.Mesh;
  flameRight: THREE.Mesh;
  shieldMesh: THREE.Mesh;
  wheels: THREE.Mesh[];
  wheelRollHubs: THREE.Group[];
  neonGlow?: THREE.Mesh;
}

// Materials Cache to keep performance high
const materialsCache = new Map<string, THREE.Material>();

function getCachedMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
  if (!materialsCache.has(key)) {
    materialsCache.set(key, createFn());
  }
  return materialsCache.get(key)!;
}

/**
 * Creates a high quality stylized cartoon 3D Kart tailored by Character & Kart Type
 */
export function createKartModel(character: CharacterDef, kartType?: KartTypeDef): KartMeshBundle {
  const root = new THREE.Group();
  root.name = `kart_${character.id}_${kartType?.id || 'standard'}`;

  const typeId = kartType?.id || 'cruiser';

  const bodyColor = kartType ? kartType.primaryColor : character.color;
  const accentColor = kartType ? kartType.accentColor : character.accentColor;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.22,
    metalness: 0.2,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.25,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.6,
    metalness: 0.1,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8e2dc,
    metalness: 0.9,
    roughness: 0.1,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111315,
    roughness: 0.85,
    metalness: 0.05,
  });

  // --- MAIN CHASSIS BODY ---
  const chassis = new THREE.Group();

  if (typeId === 'formula') {
    // Formula 1 aerodynamic needle body
    const hullGeo = new THREE.BoxGeometry(1.0, 0.32, 2.6);
    const hull = new THREE.Mesh(hullGeo, bodyMat);
    hull.position.y = 0.28;
    hull.castShadow = true;
    chassis.add(hull);

    // Front low nose
    const noseGeo = new THREE.ConeGeometry(0.5, 1.4, 4);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.26, 1.7);
    nose.scale.set(1.1, 0.35, 0.8);
    nose.castShadow = true;
    chassis.add(nose);

    // Front F1 Wing with Endplates
    const fWingGeo = new THREE.BoxGeometry(2.1, 0.06, 0.45);
    const fWing = new THREE.Mesh(fWingGeo, accentMat);
    fWing.position.set(0, 0.18, 1.95);
    fWing.castShadow = true;
    chassis.add(fWing);

    const endplateGeo = new THREE.BoxGeometry(0.06, 0.24, 0.5);
    const leftEnd = new THREE.Mesh(endplateGeo, darkMat);
    leftEnd.position.set(-1.05, 0.22, 1.95);
    const rightEnd = new THREE.Mesh(endplateGeo, darkMat);
    rightEnd.position.set(1.05, 0.22, 1.95);
    chassis.add(leftEnd, rightEnd);

    // Side air intakes
    const podGeo = new THREE.BoxGeometry(0.28, 0.32, 1.3);
    const leftPod = new THREE.Mesh(podGeo, accentMat);
    leftPod.position.set(-0.68, 0.3, 0.1);
    const rightPod = new THREE.Mesh(podGeo, accentMat);
    rightPod.position.set(0.68, 0.3, 0.1);
    chassis.add(leftPod, rightPod);

  } else if (typeId === 'offroad') {
    // Heavy 4x4 Off-Road Truck / Buggy
    const hullGeo = new THREE.BoxGeometry(1.4, 0.45, 2.3);
    const hull = new THREE.Mesh(hullGeo, bodyMat);
    hull.position.y = 0.45;
    hull.castShadow = true;
    chassis.add(hull);

    // Heavy Steel Bullbar Bumper
    const barGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.0, 10);
    const bar = new THREE.Mesh(barGeo, darkMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.38, 1.6);
    chassis.add(bar);

    // Auxiliary Fog Lights
    const fogLightMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.0,
    });
    const fogGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 8);
    const fogL = new THREE.Mesh(fogGeo, fogLightMat);
    fogL.rotation.x = Math.PI / 2;
    fogL.position.set(-0.4, 0.55, 1.55);
    const fogR = new THREE.Mesh(fogGeo, fogLightMat);
    fogR.rotation.x = Math.PI / 2;
    fogR.position.set(0.4, 0.55, 1.55);
    chassis.add(fogL, fogR);

    // Rollcage Tubes arching over cockpit
    const cageMat = darkMat;
    const cageGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 6);
    const cagePost1 = new THREE.Mesh(cageGeo, cageMat);
    cagePost1.position.set(-0.6, 1.0, 0.2);
    const cagePost2 = new THREE.Mesh(cageGeo, cageMat);
    cagePost2.position.set(0.6, 1.0, 0.2);
    const cageBarTop = new THREE.BoxGeometry(1.3, 0.08, 0.08);
    const cageTop = new THREE.Mesh(cageBarTop, cageMat);
    cageTop.position.set(0, 1.55, 0.2);
    chassis.add(cagePost1, cagePost2, cageTop);

  } else if (typeId === 'phantom') {
    // Futuristic Stealth Drift Kart
    const hullGeo = new THREE.BoxGeometry(1.25, 0.3, 2.4);
    const hull = new THREE.Mesh(hullGeo, darkMat);
    hull.position.y = 0.3;
    hull.castShadow = true;
    chassis.add(hull);

    // Angular wedge nose
    const noseGeo = new THREE.ConeGeometry(0.8, 1.2, 3);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.32, 1.4);
    nose.scale.set(1.0, 0.4, 0.7);
    chassis.add(nose);

    // Underglow neon plane
    const neonGeo = new THREE.PlaneGeometry(1.6, 2.2);
    const neonMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85,
    });
    const neonGlow = new THREE.Mesh(neonGeo, neonMat);
    neonGlow.rotation.x = -Math.PI / 2;
    neonGlow.position.y = 0.08;
    chassis.add(neonGlow);

    // Sharp intake fins
    const finGeo = new THREE.BoxGeometry(0.08, 0.4, 1.2);
    const leftFin = new THREE.Mesh(finGeo, accentMat);
    leftFin.position.set(-0.78, 0.38, 0.2);
    const rightFin = new THREE.Mesh(finGeo, accentMat);
    rightFin.position.set(0.78, 0.38, 0.2);
    chassis.add(leftFin, rightFin);

  } else {
    // Cruiser Clássico (Balanced Sporty Roadster)
    const hullGeo = new THREE.BoxGeometry(1.3, 0.35, 2.4);
    const hull = new THREE.Mesh(hullGeo, bodyMat);
    hull.position.y = 0.35;
    hull.castShadow = true;
    chassis.add(hull);

    const noseGeo = new THREE.ConeGeometry(0.7, 1.2, 5);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.38, 1.4);
    nose.scale.set(1.0, 0.5, 0.6);
    nose.castShadow = true;
    chassis.add(nose);

    const bumperGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.9, 12);
    const frontBumper = new THREE.Mesh(bumperGeo, darkMat);
    frontBumper.rotation.z = Math.PI / 2;
    frontBumper.position.set(0, 0.25, 1.7);
    chassis.add(frontBumper);

    const sidePodGeo = new THREE.BoxGeometry(0.35, 0.35, 1.4);
    const leftPod = new THREE.Mesh(sidePodGeo, accentMat);
    leftPod.position.set(-0.75, 0.38, 0.1);
    const rightPod = new THREE.Mesh(sidePodGeo, accentMat);
    rightPod.position.set(0.75, 0.38, 0.1);
    chassis.add(leftPod, rightPod);
  }

  // Common Headlights
  const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff3a1,
    emissiveIntensity: 0.9,
  });
  const leftLight = new THREE.Mesh(lightGeo, lightMat);
  leftLight.position.set(-0.45, 0.38, 1.6);
  const rightLight = new THREE.Mesh(lightGeo, lightMat);
  rightLight.position.set(0.45, 0.38, 1.6);
  chassis.add(leftLight, rightLight);

  // Cockpit Tub & Seat
  const tubGeo = new THREE.BoxGeometry(0.85, 0.3, 1.2);
  const tub = new THREE.Mesh(tubGeo, darkMat);
  tub.position.set(0, 0.42, -0.1);
  chassis.add(tub);

  const seatBackGeo = new THREE.BoxGeometry(0.75, 0.65, 0.15);
  const seatBack = new THREE.Mesh(seatBackGeo, darkMat);
  seatBack.position.set(0, 0.72, -0.6);
  seatBack.rotation.x = -0.12;
  chassis.add(seatBack);

  // Rear Engine Block
  const engineGeo = new THREE.BoxGeometry(0.9, 0.45, 0.65);
  const engine = new THREE.Mesh(engineGeo, darkMat);
  engine.position.set(0, 0.52, -1.05);
  chassis.add(engine);

  // Dual Chrome Exhaust Pipes
  const pipeGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.45, 10);
  const exhaustLeft = new THREE.Mesh(pipeGeo, chromeMat);
  exhaustLeft.rotation.x = Math.PI / 2;
  exhaustLeft.position.set(-0.3, 0.4, -1.45);

  const exhaustRight = new THREE.Mesh(pipeGeo, chromeMat);
  exhaustRight.rotation.x = Math.PI / 2;
  exhaustRight.position.set(0.3, 0.4, -1.45);
  chassis.add(exhaustLeft, exhaustRight);

  // Boost Flame Meshes
  const flameGeo = new THREE.ConeGeometry(0.2, 0.7, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  
  const flameLeft = new THREE.Mesh(flameGeo, flameMat);
  flameLeft.rotation.x = -Math.PI / 2;
  flameLeft.position.set(-0.3, 0.4, -1.9);
  flameLeft.scale.set(0.001, 0.001, 0.001);

  const flameRight = new THREE.Mesh(flameGeo, flameMat);
  flameRight.rotation.x = -Math.PI / 2;
  flameRight.position.set(0.3, 0.4, -1.9);
  flameRight.scale.set(0.001, 0.001, 0.001);
  chassis.add(flameLeft, flameRight);

  // Rear Spoiler / Wing
  const wingGroup = new THREE.Group();
  const pillarGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
  const pLeft = new THREE.Mesh(pillarGeo, chromeMat);
  pLeft.position.set(-0.45, 0.78, -1.25);
  const pRight = new THREE.Mesh(pillarGeo, chromeMat);
  pRight.position.set(0.45, 0.78, -1.25);
  wingGroup.add(pLeft, pRight);

  const wingWidth = typeId === 'formula' ? 2.0 : 1.6;
  const wingPlaneGeo = new THREE.BoxGeometry(wingWidth, 0.07, 0.38);
  const wingPlane = new THREE.Mesh(wingPlaneGeo, accentMat);
  wingPlane.position.set(0, 1.02, -1.25);
  wingPlane.rotation.x = 0.1;
  wingGroup.add(wingPlane);
  chassis.add(wingGroup);

  root.add(chassis);

  // --- STEERING WHEEL ---
  const steeringGroup = new THREE.Group();
  steeringGroup.position.set(0, 0.68, 0.32);
  steeringGroup.rotation.x = -0.45;

  const columnGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
  const column = new THREE.Mesh(columnGeo, chromeMat);
  column.position.y = 0.12;
  steeringGroup.add(column);

  const rimGeo = new THREE.TorusGeometry(0.2, 0.035, 8, 16);
  const wheelRim = new THREE.Mesh(rimGeo, darkMat);
  wheelRim.position.y = 0.28;
  wheelRim.rotation.x = Math.PI / 2;
  steeringGroup.add(wheelRim);
  root.add(steeringGroup);

  // --- DRIVER CHARACTER MODEL ---
  const driverGroup = new THREE.Group();
  driverGroup.position.set(0, 0, -0.15);

  const torsoGeo = new THREE.BoxGeometry(0.6, 0.55, 0.35);
  const suitMat = new THREE.MeshStandardMaterial({
    color: character.color,
    roughness: 0.35,
  });
  const torso = new THREE.Mesh(torsoGeo, suitMat);
  torso.position.y = 0.55;
  torso.rotation.x = 0.15;
  torso.castShadow = true;
  driverGroup.add(torso);

  // Arms
  const armMat = new THREE.MeshStandardMaterial({ color: character.accentColor });
  const armGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 6);
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.32, 0.6, 0.22);
  leftArm.rotation.set(0.7, 0, 0.3);
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.32, 0.6, 0.22);
  rightArm.rotation.set(0.7, 0, -0.3);
  driverGroup.add(leftArm, rightArm);

  // Head & Helmet
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.95, 0.08);

  const helmetGeo = new THREE.SphereGeometry(0.35, 14, 14);
  const helmetMat = new THREE.MeshStandardMaterial({
    color: character.helmetColor,
    roughness: 0.15,
    metalness: 0.1,
  });
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  const crestGeo = new THREE.BoxGeometry(0.12, 0.08, 0.65);
  const crestMat = new THREE.MeshStandardMaterial({ color: character.accentColor });
  const crest = new THREE.Mesh(crestGeo, crestMat);
  crest.position.y = 0.32;
  headGroup.add(crest);

  const visorGeo = new THREE.BoxGeometry(0.46, 0.22, 0.22);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.05,
    metalness: 0.9,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.26);
  headGroup.add(visor);

  driverGroup.add(headGroup);
  root.add(driverGroup);

  // --- 4 WHEELS WITH REALISTIC ROTATING HUBS & DETAILED RIMS ---
  const wheels: THREE.Mesh[] = [];
  const wheelRollHubs: THREE.Group[] = [];

  function createWheel(isFront: boolean, isLeft: boolean): { wheelRoot: THREE.Group; rollHub: THREE.Group } {
    const wheelRoot = new THREE.Group();
    const rollHub = new THREE.Group();
    rollHub.name = `wheel_roll_${isFront ? 'front' : 'rear'}_${isLeft ? 'left' : 'right'}`;
    wheelRoot.add(rollHub);
    wheelRollHubs.push(rollHub);

    const isOffroad = typeId === 'offroad';
    const isFormula = typeId === 'formula';

    const radius = isOffroad ? (isFront ? 0.38 : 0.44) : isFront ? 0.34 : 0.38;
    const thickness = isOffroad ? 0.38 : isFormula ? 0.26 : isFront ? 0.28 : 0.36;

    // Tire mesh with geometry rotated along X axis (so rotation around X rolls forward)
    const tGeo = new THREE.CylinderGeometry(radius, radius, thickness, 20);
    tGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tGeo, tireMat);
    tire.castShadow = true;
    rollHub.add(tire);
    wheels.push(tire);

    // Rim cylinder geometry rotated along X axis
    const rimGeo = new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, thickness * 1.05, 14);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rollHub.add(rim);

    // Visible rim spokes so wheel spinning in X axis is clearly visible
    const numSpokes = 5;
    for (let s = 0; s < numSpokes; s++) {
      const angle = (s / numSpokes) * Math.PI * 2;
      const spokeGeo = new THREE.BoxGeometry(thickness * 1.08, radius * 0.52, 0.05);
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      spoke.rotation.x = angle;
      rollHub.add(spoke);
    }

    // Outer wheel center cap
    const capGeo = new THREE.SphereGeometry(radius * 0.25, 8, 8);
    const cap = new THREE.Mesh(capGeo, chromeMat);
    cap.position.x = isLeft ? (-thickness / 2 - 0.02) : (thickness / 2 + 0.02);
    rollHub.add(cap);

    return { wheelRoot, rollHub };
  }

  const fl = createWheel(true, true);
  fl.wheelRoot.position.set(-0.85, 0.34, 0.95);
  root.add(fl.wheelRoot);

  const fr = createWheel(true, false);
  fr.wheelRoot.position.set(0.85, 0.34, 0.95);
  root.add(fr.wheelRoot);

  const rl = createWheel(false, true);
  rl.wheelRoot.position.set(-0.9, 0.38, -0.85);
  root.add(rl.wheelRoot);

  const rr = createWheel(false, false);
  rr.wheelRoot.position.set(0.9, 0.38, -0.85);
  root.add(rr.wheelRoot);

  // Shield bubble
  const shieldGeo = new THREE.SphereGeometry(1.9, 20, 20);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0,
    roughness: 0.1,
    metalness: 0.2,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 0.8;
  shieldMesh.visible = false;
  root.add(shieldMesh);

  return {
    root,
    frontLeftWheel: fl.wheelRoot,
    frontRightWheel: fr.wheelRoot,
    rearLeftWheel: rl.wheelRoot,
    rearRightWheel: rr.wheelRoot,
    steeringWheel: steeringGroup,
    driverHead: headGroup,
    exhaustLeft,
    exhaustRight,
    flameLeft,
    flameRight,
    shieldMesh,
    wheels,
    wheelRollHubs,
  };
}

/**
 * Creates Jump Ramp Mesh correctly aligned with track direction:
 * Inclines UP in the direction of +Z (forward) from y=0 at entrance to y=height at lip
 */
export function createRampModel(width: number, height: number, length: number, theme: string): THREE.Group {
  const rampGroup = new THREE.Group();

  const halfW = (width - 1.5) / 2;
  const halfL = length / 2;

  // Build inclined wedge geometry
  // Vertices in local space:
  // 0: Bottom back left  (-halfW, 0, -halfL)
  // 1: Bottom back right ( halfW, 0, -halfL)
  // 2: Bottom front right( halfW, 0,  halfL)
  // 3: Bottom front left (-halfW, 0,  halfL)
  // 4: Top back left     (-halfW, 0.08, -halfL)
  // 5: Top back right    ( halfW, 0.08, -halfL)
  // 6: Top front right   ( halfW, height, halfL)
  // 7: Top front left    (-halfW, height, halfL)

  const positions = new Float32Array([
    // Top Inclined Face (The race surface, inclining UP from -halfL to +halfL)
    -halfW, 0.08, -halfL,
     halfW, 0.08, -halfL,
     halfW, height,  halfL,
    -halfW, 0.08, -halfL,
     halfW, height,  halfL,
    -halfW, height,  halfL,

    // Left Side Wall
    -halfW, 0, -halfL,
    -halfW, 0.08, -halfL,
    -halfW, height, halfL,
    -halfW, 0, -halfL,
    -halfW, height, halfL,
    -halfW, 0, halfL,

    // Right Side Wall
     halfW, 0, -halfL,
     halfW, height, halfL,
     halfW, 0.08, -halfL,
     halfW, 0, -halfL,
     halfW, 0, halfL,
     halfW, height, halfL,

    // Front Vertical Lip (Under the jump drop)
    -halfW, 0, halfL,
    -halfW, height, halfL,
     halfW, height, halfL,
    -halfW, 0, halfL,
     halfW, height, halfL,
     halfW, 0, halfL,
  ]);

  const rampGeo = new THREE.BufferGeometry();
  rampGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rampGeo.computeVertexNormals();

  const rampColor = theme === 'volcano' ? 0x991b1b : theme === 'snow' ? 0x0284c7 : 0xf59e0b;
  const rampMat = new THREE.MeshStandardMaterial({
    color: rampColor,
    roughness: 0.35,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const rampMesh = new THREE.Mesh(rampGeo, rampMat);
  rampMesh.castShadow = true;
  rampMesh.receiveShadow = true;
  rampGroup.add(rampMesh);

  // Add 3 glowing forward chevrons on the inclined surface pointing forward towards +Z
  const chevronMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const numChevrons = 3;
  const slopeAngle = Math.atan2(height, length);

  for (let c = 0; c < numChevrons; c++) {
    const t = 0.25 + c * 0.28; // along ramp
    const zPos = -halfL + t * length;
    const yPos = 0.1 + t * height;

    const barGeo = new THREE.PlaneGeometry(0.5, halfW * 0.9);
    
    // Left chevron arm
    const leftBar = new THREE.Mesh(barGeo, chevronMat);
    leftBar.rotation.x = -Math.PI / 2 + slopeAngle;
    leftBar.rotation.z = Math.PI / 4;
    leftBar.position.set(-halfW * 0.35, yPos + 0.02, zPos);
    
    // Right chevron arm
    const rightBar = new THREE.Mesh(barGeo, chevronMat);
    rightBar.rotation.x = -Math.PI / 2 + slopeAngle;
    rightBar.rotation.z = -Math.PI / 4;
    rightBar.position.set(halfW * 0.35, yPos + 0.02, zPos);

    rampGroup.add(leftBar, rightBar);
  }

  // Side Safety Rails with Hazard Stripes
  const railMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const railGeo = new THREE.BoxGeometry(0.3, 0.8, length);
  
  const leftRail = new THREE.Mesh(railGeo, railMat);
  leftRail.position.set(-halfW - 0.15, height * 0.5 + 0.4, 0);
  leftRail.rotation.x = -slopeAngle;
  leftRail.castShadow = true;

  const rightRail = new THREE.Mesh(railGeo, railMat);
  rightRail.position.set(halfW + 0.15, height * 0.5 + 0.4, 0);
  rightRail.rotation.x = -slopeAngle;
  rightRail.castShadow = true;

  rampGroup.add(leftRail, rightRail);

  return rampGroup;
}

/**
 * Creates ultra-lush 3D Palm Tree with organic curved ringed trunk,
 * double-tier tropical fronds, coconut cluster, and wind sway pivot
 */
export function createPalmTree(): THREE.Group {
  const palm = new THREE.Group();
  palm.name = 'palm_tree';

  const trunkMat = getCachedMaterial('palm_trunk_hd', () => new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.85,
    metalness: 0.05,
  }));
  const ringMat = getCachedMaterial('palm_ring_hd', () => new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
  }));

  // Flared root base
  const rootGeo = new THREE.CylinderGeometry(0.65, 0.9, 0.6, 9);
  const rootMesh = new THREE.Mesh(rootGeo, trunkMat);
  rootMesh.position.y = 0.3;
  rootMesh.castShadow = true;
  palm.add(rootMesh);

  // Segmented curved trunk with ringed bark
  const trunkSteps = 8;
  let currentY = 0.5;
  const curveDir = Math.random() * Math.PI * 2;
  const bendIntensity = 0.07 + Math.random() * 0.05;

  for (let i = 0; i < trunkSteps; i++) {
    const bottomRadius = 0.52 * (1 - i * 0.065);
    const topRadius = 0.48 * (1 - (i + 1) * 0.065);
    const segHeight = 1.15;

    const segGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, segHeight, 9);
    const seg = new THREE.Mesh(segGeo, trunkMat);
    const offsetX = Math.cos(curveDir) * (i * i * bendIntensity);
    const offsetZ = Math.sin(curveDir) * (i * i * bendIntensity);

    seg.position.set(offsetX, currentY + segHeight / 2, offsetZ);
    seg.rotation.z = Math.cos(curveDir) * (i * bendIntensity * 0.85);
    seg.rotation.x = Math.sin(curveDir) * (i * bendIntensity * 0.85);
    seg.castShadow = true;
    seg.receiveShadow = true;
    palm.add(seg);

    // Bark segment ridge ring
    const ringGeo = new THREE.TorusGeometry(bottomRadius * 1.05, 0.05, 6, 12);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(offsetX, currentY + 0.1, offsetZ);
    palm.add(ring);

    currentY += segHeight * 0.92;
  }

  // Crown pivot group (wind breeze can animate this!)
  const crownGroup = new THREE.Group();
  crownGroup.name = 'wind_sway';
  crownGroup.position.set(
    Math.cos(curveDir) * (trunkSteps * trunkSteps * bendIntensity),
    currentY,
    Math.sin(curveDir) * (trunkSteps * trunkSteps * bendIntensity)
  );

  // Coconut cluster (5 coconuts nestled under the crown)
  const coconutMat = getCachedMaterial('coconut_mat_hd', () => new THREE.MeshStandardMaterial({
    color: 0x3b1d07,
    roughness: 0.75,
  }));
  const nutGeo = new THREE.SphereGeometry(0.28, 8, 8);
  for (let c = 0; c < 5; c++) {
    const angle = (c / 5) * Math.PI * 2 + 0.2;
    const nut = new THREE.Mesh(nutGeo, coconutMat);
    nut.scale.set(0.9, 1.15, 0.9);
    nut.position.set(Math.cos(angle) * 0.42, -0.25, Math.sin(angle) * 0.42);
    nut.castShadow = true;
    crownGroup.add(nut);
  }

  // Double-layer tropical fronds:
  // Layer 1: Upper upright arching fronds (vibrant emerald green)
  const leafMatUpper = getCachedMaterial('palm_leaf_upper', () => new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.4,
    metalness: 0.05,
    side: THREE.DoubleSide,
  }));
  // Layer 2: Lower drooping fronds (rich forest green)
  const leafMatLower = getCachedMaterial('palm_leaf_lower', () => new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  }));

  // Upper layer: 7 fronds
  const numUpper = 7;
  for (let f = 0; f < numUpper; f++) {
    const fAngle = (f / numUpper) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.85, 4.8, 6);
    const leaf = new THREE.Mesh(leafGeo, leafMatUpper);
    leaf.scale.set(1.1, 1.0, 0.12);
    leaf.rotation.z = Math.PI / 2 + 0.28;
    leaf.rotation.y = fAngle;
    leaf.position.set(Math.cos(fAngle) * 2.1, 0.35, Math.sin(fAngle) * 2.1);
    leaf.castShadow = true;
    crownGroup.add(leaf);
  }

  // Lower drooping layer: 8 fronds
  const numLower = 8;
  for (let f = 0; f < numLower; f++) {
    const fAngle = (f / numLower) * Math.PI * 2 + 0.4;
    const leafGeo = new THREE.ConeGeometry(0.95, 5.2, 6);
    const leaf = new THREE.Mesh(leafGeo, leafMatLower);
    leaf.scale.set(1.15, 1.0, 0.14);
    leaf.rotation.z = Math.PI / 2 + 0.55; // Droops downward
    leaf.rotation.y = fAngle;
    leaf.position.set(Math.cos(fAngle) * 2.2, -0.2, Math.sin(fAngle) * 2.2);
    leaf.castShadow = true;
    crownGroup.add(leaf);
  }

  palm.add(crownGroup);
  return palm;
}

/**
 * Creates Lush Tropical Undergrowth / Monstera Fern Bush with colorful exotic flower
 */
export function createTropicalBush(): THREE.Group {
  const bush = new THREE.Group();
  bush.name = 'tropical_bush';

  const leafMat = getCachedMaterial('monstera_leaf', () => new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.4,
    side: THREE.DoubleSide,
  }));

  const numLeaves = 6;
  for (let i = 0; i < numLeaves; i++) {
    const angle = (i / numLeaves) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.65, 2.2, 5);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(1.0, 1.0, 0.12);
    leaf.rotation.z = 1.1;
    leaf.rotation.y = angle;
    leaf.position.set(Math.cos(angle) * 0.8, 0.6, Math.sin(angle) * 0.8);
    leaf.castShadow = true;
    bush.add(leaf);
  }

  // Exotic central flower (Hibiscus)
  const flowerMat = getCachedMaterial('hibiscus_flower', () => new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Hot pink/red
    roughness: 0.3,
  }));
  const flowerGeo = new THREE.DodecahedronGeometry(0.35, 1);
  const flower = new THREE.Mesh(flowerGeo, flowerMat);
  flower.position.set(0, 0.95, 0);
  bush.add(flower);

  const stamenGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
  const stamenMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const stamen = new THREE.Mesh(stamenGeo, stamenMat);
  stamen.position.set(0, 1.15, 0);
  bush.add(stamen);

  return bush;
}

/**
 * Creates 3D Tropical Boulder with moss details and sharp faceted contours
 */
export function createTropicalRock(): THREE.Group {
  const group = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(1.6 + Math.random() * 1.3, 1);
  const rockMat = getCachedMaterial('rock_mat_hd', () => new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.82,
    metalness: 0.1,
    flatShading: true,
  }));
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.scale.set(1.1 + Math.random() * 0.4, 0.75 + Math.random() * 0.4, 1.1 + Math.random() * 0.4);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  // Moss patch on top of boulder
  const mossMat = getCachedMaterial('rock_moss', () => new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    roughness: 0.95,
  }));
  const mossGeo = new THREE.DodecahedronGeometry(0.7, 1);
  const moss = new THREE.Mesh(mossGeo, mossMat);
  moss.position.set(0, 0.9, 0);
  moss.scale.set(1.2, 0.4, 1.2);
  group.add(moss);

  return group;
}

/**
 * Creates 3D Volcanic Obsidian Rock with glowing magma veins and heat embers
 */
export function createVolcanicRock(): THREE.Group {
  const group = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(2.0 + Math.random() * 1.6, 1);
  const rockMat = getCachedMaterial('volcano_rock_hd', () => new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.35,
    flatShading: true,
  }));
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.scale.set(1.1 + Math.random() * 0.5, 1.0 + Math.random() * 0.6, 1.1 + Math.random() * 0.5);
  rock.castShadow = true;
  group.add(rock);

  // Glowing molten lava fissures
  const veinGeo = new THREE.SphereGeometry(0.75, 7, 7);
  const veinMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const vein = new THREE.Mesh(veinGeo, veinMat);
  vein.position.set(0.3, 0.5, 0.3);
  group.add(vein);

  const innerLavaGeo = new THREE.SphereGeometry(0.4, 6, 6);
  const innerLavaMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const innerLava = new THREE.Mesh(innerLavaGeo, innerLavaMat);
  innerLava.position.set(0.3, 0.5, 0.3);
  group.add(innerLava);

  return group;
}

/**
 * Creates Volcanic Spire Chimney with glowing molten fissures
 */
export function createVolcanicSpire(): THREE.Group {
  const group = new THREE.Group();
  const spireGeo = new THREE.ConeGeometry(2.8, 16.0, 8);
  const spireMat = getCachedMaterial('spire_mat_hd', () => new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.92,
    flatShading: true,
  }));
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 8.0;
  spire.castShadow = true;
  group.add(spire);

  // Glowing magma crater tip
  const topGeo = new THREE.SphereGeometry(1.2, 8, 8);
  const topMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 15.6;
  group.add(top);

  // Molten rings running along the spire
  const ringGeo = new THREE.TorusGeometry(1.4, 0.12, 6, 12);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 7.0;
  group.add(ring);

  return group;
}

/**
 * Creates Charred Dead Volcanic Tree with smoldering ember branch tips
 */
export function createCharredDeadTree(): THREE.Group {
  const tree = new THREE.Group();
  tree.name = 'charred_tree';

  const woodMat = getCachedMaterial('charred_wood', () => new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.95,
  }));
  const emberMat = getCachedMaterial('ember_tip', () => new THREE.MeshBasicMaterial({
    color: 0xf97316,
  }));

  // Gnarled trunk
  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 5.0, 7);
  const trunk = new THREE.Mesh(trunkGeo, woodMat);
  trunk.position.y = 2.5;
  trunk.rotation.z = 0.12;
  trunk.castShadow = true;
  tree.add(trunk);

  // 4 twisted branches
  const branchConfigs = [
    { len: 2.8, r: 0.22, rotZ: 0.7, rotY: 0.4, y: 3.8 },
    { len: 2.5, r: 0.2, rotZ: -0.8, rotY: 2.1, y: 4.2 },
    { len: 2.2, r: 0.18, rotZ: 0.9, rotY: -1.6, y: 4.5 },
    { len: 1.8, r: 0.15, rotZ: -0.6, rotY: 3.4, y: 4.8 },
  ];

  branchConfigs.forEach(b => {
    const branchGeo = new THREE.CylinderGeometry(b.r * 0.5, b.r, b.len, 5);
    const branch = new THREE.Mesh(branchGeo, woodMat);
    branch.position.y = b.len / 2;
    branch.castShadow = true;

    const branchHolder = new THREE.Group();
    branchHolder.position.y = b.y;
    branchHolder.rotation.y = b.rotY;
    branchHolder.rotation.z = b.rotZ;
    branchHolder.add(branch);

    // Glowing ember on branch tip
    const emberGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const ember = new THREE.Mesh(emberGeo, emberMat);
    ember.position.y = b.len;
    branchHolder.add(ember);

    tree.add(branchHolder);
  });

  return tree;
}

/**
 * Creates Grand Snowy Alpine Pine Tree with 4 multi-branching bough tiers,
 * dense needle foliage, and thick sculpted snow blankets
 */
export function createSnowyPineTree(): THREE.Group {
  const tree = new THREE.Group();
  tree.name = 'snowy_pine';

  const trunkGeo = new THREE.CylinderGeometry(0.38, 0.6, 4.2, 8);
  const trunkMat = getCachedMaterial('pine_trunk_hd', () => new THREE.MeshStandardMaterial({
    color: 0x382214,
    roughness: 0.92,
  }));
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 2.1;
  trunk.castShadow = true;
  tree.add(trunk);

  const pineMat = getCachedMaterial('pine_foliage_hd', () => new THREE.MeshStandardMaterial({
    color: 0x143427,
    roughness: 0.75,
  }));
  const snowMat = getCachedMaterial('snow_blanket_hd', () => new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.65,
    metalness: 0.1,
  }));

  // 4 Rich tiers of foliage with overhang snow caps
  const tiers = [
    { y: 3.0, r: 3.4, h: 2.8 },
    { y: 4.8, r: 2.7, h: 2.5 },
    { y: 6.4, r: 2.0, h: 2.2 },
    { y: 7.8, r: 1.3, h: 1.8 },
  ];

  tiers.forEach(tier => {
    // Pine needle cone tier
    const coneGeo = new THREE.ConeGeometry(tier.r, tier.h, 8);
    const foliage = new THREE.Mesh(coneGeo, pineMat);
    foliage.position.y = tier.y;
    foliage.castShadow = true;
    tree.add(foliage);

    // Sculpted snow blanket resting on the foliage
    const capGeo = new THREE.ConeGeometry(tier.r * 0.96, tier.h * 0.52, 8);
    const snowCap = new THREE.Mesh(capGeo, snowMat);
    snowCap.position.y = tier.y + tier.h * 0.26;
    snowCap.castShadow = true;
    tree.add(snowCap);

    // Fluffy snow overhang puffs along edge
    for (let p = 0; p < 4; p++) {
      const angle = (p / 4) * Math.PI * 2;
      const puffGeo = new THREE.SphereGeometry(tier.r * 0.22, 6, 6);
      const puff = new THREE.Mesh(puffGeo, snowMat);
      puff.position.set(Math.cos(angle) * tier.r * 0.75, tier.y - tier.h * 0.35, Math.sin(angle) * tier.r * 0.75);
      tree.add(puff);
    }
  });

  return tree;
}

/**
 * Creates Frosted Winter Birch / Deciduous Tree with silver bark and frosted branches
 */
export function createFrostedBirch(): THREE.Group {
  const tree = new THREE.Group();
  tree.name = 'frosted_birch';

  const barkMat = getCachedMaterial('birch_bark', () => new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.6,
  }));
  const frostMat = getCachedMaterial('birch_frost', () => new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.3,
  }));

  const trunkGeo = new THREE.CylinderGeometry(0.24, 0.42, 6.0, 7);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = 3.0;
  trunk.castShadow = true;
  tree.add(trunk);

  // Canopy of frosted twigs / snow puff clusters
  const crownPositions = [
    { x: 0, y: 6.2, z: 0, r: 1.6 },
    { x: 0.9, y: 5.5, z: 0.5, r: 1.2 },
    { x: -0.8, y: 5.2, z: -0.6, r: 1.1 },
    { x: 0.3, y: 5.0, z: -0.9, r: 1.0 },
  ];

  crownPositions.forEach(cp => {
    const puffGeo = new THREE.DodecahedronGeometry(cp.r, 1);
    const puff = new THREE.Mesh(puffGeo, frostMat);
    puff.position.set(cp.x, cp.y, cp.z);
    puff.castShadow = true;
    tree.add(puff);
  });

  return tree;
}

/**
 * Creates Ice Crystal / Glacial Spire with sparkling inner core
 */
export function createIceCrystal(): THREE.Group {
  const group = new THREE.Group();
  const iceGeo = new THREE.ConeGeometry(1.3, 5.5, 6);
  const iceMat = getCachedMaterial('ice_crystal_hd', () => new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.3,
    transparent: true,
    opacity: 0.88,
  }));
  const ice = new THREE.Mesh(iceGeo, iceMat);
  ice.position.y = 2.75;
  ice.rotation.z = (Math.random() - 0.5) * 0.25;
  ice.castShadow = true;
  group.add(ice);

  // Glowing crystalline core
  const coreGeo = new THREE.ConeGeometry(0.6, 4.0, 5);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 2.75;
  group.add(core);

  return group;
}

/**
 * Creates Arcade Racing Chevron Warning Board (>>>) on steel poles
 */
export function createDirectionalChevronSign(direction: 'left' | 'right' = 'right'): THREE.Group {
  const group = new THREE.Group();
  group.name = 'chevron_sign';

  const boardMat = new THREE.MeshBasicMaterial({
    map: getChevronBoardTexture(direction),
  });
  const boardGeo = new THREE.PlaneGeometry(6.0, 3.0);
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.y = 4.0;
  group.add(board);

  // Back panel
  const backGeo = new THREE.BoxGeometry(6.1, 3.1, 0.2);
  const metalMat = getCachedMaterial('sign_metal', () => new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
  }));
  const back = new THREE.Mesh(backGeo, metalMat);
  back.position.set(0, 4.0, -0.1);
  group.add(back);

  // Dual steel mounting poles
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.5, 6);
  const leftPole = new THREE.Mesh(poleGeo, metalMat);
  leftPole.position.set(-2.2, 2.25, -0.1);
  const rightPole = new THREE.Mesh(poleGeo, metalMat);
  rightPole.position.set(2.2, 2.25, -0.1);
  group.add(leftPole, rightPole);

  return group;
}

/**
 * Creates Trackside Grandstand with cheering spectator crowd and waving flags
 */
export function createSpectatorGrandstand(theme: string): THREE.Group {
  const grandstand = new THREE.Group();
  grandstand.name = 'grandstand';

  const steelMat = getCachedMaterial('stand_steel', () => new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.5,
  }));
  const seatMat = getCachedMaterial('stand_seat', () => new THREE.MeshStandardMaterial({
    color: theme === 'volcano' ? 0xd97706 : theme === 'snow' ? 0x0284c7 : 0xe11d48,
    roughness: 0.5,
  }));
  const roofMat = getCachedMaterial('stand_roof', () => new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
  }));

  // 3-Tier Seating Bleachers
  for (let tier = 0; tier < 3; tier++) {
    const stepW = 18.0;
    const stepD = 1.6;
    const stepH = 0.9;
    const stepGeo = new THREE.BoxGeometry(stepW, stepH, stepD);
    const step = new THREE.Mesh(stepGeo, seatMat);
    step.position.set(0, (tier + 1) * stepH - stepH / 2, -tier * stepD);
    step.castShadow = true;
    grandstand.add(step);

    // Spectator heads (colorful crowd silhouettes)
    const numFans = 10;
    const fanMat = getCachedMaterial(`fan_mat_${tier}`, () => new THREE.MeshStandardMaterial({
      color: [0xfacc15, 0x38bdf8, 0x4ade80, 0xf43f5e, 0xa855f7][tier % 5],
      roughness: 0.6,
    }));
    for (let f = 0; f < numFans; f++) {
      const fanX = -7.5 + f * 1.6;
      const headGeo = new THREE.SphereGeometry(0.32, 6, 6);
      const head = new THREE.Mesh(headGeo, fanMat);
      head.position.set(fanX, (tier + 1) * stepH + 0.55, -tier * stepD);
      grandstand.add(head);
    }
  }

  // Back wall and side pillars
  const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, 6.5, 6);
  const p1 = new THREE.Mesh(pillarGeo, steelMat);
  p1.position.set(-9.0, 3.25, -4.5);
  const p2 = new THREE.Mesh(pillarGeo, steelMat);
  p2.position.set(9.0, 3.25, -4.5);
  grandstand.add(p1, p2);

  // Angled Canopy Roof
  const roofGeo = new THREE.BoxGeometry(19.0, 0.25, 6.0);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 6.4, -1.8);
  roof.rotation.x = -0.18;
  roof.castShadow = true;
  grandstand.add(roof);

  // Fluttering Pennant Flags on Roof
  const flagMat = getCachedMaterial('pennant_flag', () => new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
  }));
  for (let fl = -2; fl <= 2; fl++) {
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 4);
    const pole = new THREE.Mesh(poleGeo, steelMat);
    pole.position.set(fl * 4.2, 7.2, -1.5);
    grandstand.add(pole);

    const pennantGeo = new THREE.ConeGeometry(0.35, 1.2, 3);
    const pennant = new THREE.Mesh(pennantGeo, flagMat);
    pennant.rotation.z = -Math.PI / 2;
    pennant.position.set(fl * 4.2 + 0.6, 7.6, -1.5);
    grandstand.add(pennant);
  }

  return grandstand;
}

/**
 * Creates Trackside Torch / Lantern with glowing light
 */
export function createTracksideTorch(theme: string): THREE.Group {
  const group = new THREE.Group();

  const postMat = getCachedMaterial('torch_post', () => new THREE.MeshStandardMaterial({
    color: theme === 'tropical' ? 0x78350f : 0x1e293b,
    roughness: 0.8,
  }));
  const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 3.2, 6);
  const pole = new THREE.Mesh(poleGeo, postMat);
  pole.position.y = 1.6;
  pole.castShadow = true;
  group.add(pole);

  // Flame / Crystal Bowl
  const bowlGeo = new THREE.CylinderGeometry(0.32, 0.18, 0.4, 6);
  const bowl = new THREE.Mesh(bowlGeo, postMat);
  bowl.position.y = 3.3;
  group.add(bowl);

  // Glowing Flame / Light
  const flameColor = theme === 'volcano' ? 0xef4444 : theme === 'snow' ? 0x38bdf8 : 0xf97316;
  const flameGeo = new THREE.ConeGeometry(0.25, 0.7, 6);
  const flameMat = new THREE.MeshBasicMaterial({ color: flameColor });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 3.75;
  group.add(flame);

  return group;
}

/**
 * Creates Mystery Item Box (Translucent spinning cube with '?')
 */
export function createItemBoxMesh(): THREE.Group {
  const boxGroup = new THREE.Group();

  const outerGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.2,
    metalness: 0.3,
  });
  const outerBox = new THREE.Mesh(outerGeo, outerMat);
  boxGroup.add(outerBox);

  // Question mark inside
  const qGeo = new THREE.TorusGeometry(0.28, 0.08, 8, 12, Math.PI * 1.5);
  const qMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const qMark = new THREE.Mesh(qGeo, qMat);
  qMark.rotation.z = -Math.PI / 4;
  qMark.position.y = 0.1;
  boxGroup.add(qMark);

  const dotGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const dot = new THREE.Mesh(dotGeo, qMat);
  dot.position.y = -0.26;
  boxGroup.add(dot);

  return boxGroup;
}

/**
 * Creates Boost Speed Pad (Luminous glowing chevron on the track)
 */
export function createBoostPadMesh(): THREE.Group {
  const pad = new THREE.Group();

  const baseGeo = new THREE.PlaneGeometry(5.0, 4.0);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.02;
  pad.add(base);

  // Glowing Chevrons
  const chevronMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  for (let c = -1; c <= 1; c++) {
    const leftBarGeo = new THREE.PlaneGeometry(0.35, 1.6);
    const leftBar = new THREE.Mesh(leftBarGeo, chevronMat);
    leftBar.rotation.x = -Math.PI / 2;
    leftBar.rotation.z = Math.PI / 4;
    leftBar.position.set(-0.6, 0.03, c * 1.1);

    const rightBar = new THREE.Mesh(leftBarGeo, chevronMat);
    rightBar.rotation.x = -Math.PI / 2;
    rightBar.rotation.z = -Math.PI / 4;
    rightBar.position.set(0.6, 0.03, c * 1.1);

    pad.add(leftBar, rightBar);
  }

  return pad;
}

/**
 * Creates High-Definition Start / Finish Gantry Archway with race truss columns,
 * professional textured Grand Prix banner, and 5-light starting gantry
 */
export function createStartFinishGantry(trackName: string = 'BEACH KART GP'): THREE.Group {
  const gantry = new THREE.Group();
  gantry.name = 'start_finish_gantry';

  const trussMat = getCachedMaterial('gantry_truss', () => new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.5,
    metalness: 0.6,
  }));
  const accentMat = getCachedMaterial('gantry_accent', () => new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
    metalness: 0.2,
  }));

  // Dual lattice steel pillars on left & right
  [-9.5, 9.5].forEach(xPos => {
    // Main uprights
    const mainPillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 8.5, 8);
    const mainPillar = new THREE.Mesh(mainPillarGeo, trussMat);
    mainPillar.position.set(xPos, 4.25, 0);
    mainPillar.castShadow = true;
    gantry.add(mainPillar);

    // Concrete base pedestal
    const baseGeo = new THREE.BoxGeometry(1.6, 0.9, 1.6);
    const base = new THREE.Mesh(baseGeo, trussMat);
    base.position.set(xPos, 0.45, 0);
    base.castShadow = true;
    gantry.add(base);

    // Safety yellow hazard stripes base
    const stripeGeo = new THREE.BoxGeometry(1.62, 0.3, 1.62);
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.set(xPos, 0.45, 0);
    gantry.add(stripe);
  });

  // Heavy overhead steel cross-beam truss
  const beamGeo = new THREE.BoxGeometry(20.5, 1.0, 1.2);
  const beam = new THREE.Mesh(beamGeo, trussMat);
  beam.position.set(0, 8.2, 0);
  beam.castShadow = true;
  gantry.add(beam);

  // Large High-Res Printed Grand Prix Banner
  const bannerGeo = new THREE.BoxGeometry(15.0, 2.5, 0.35);
  const bannerMat = new THREE.MeshBasicMaterial({
    map: getGantryBannerTexture(trackName),
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 6.8, 0);
  gantry.add(banner);

  // 5-Light Starting Signal Pod suspended under gantry
  const podGeo = new THREE.BoxGeometry(6.5, 0.9, 0.6);
  const podMat = getCachedMaterial('light_pod', () => new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.4,
  }));
  const pod = new THREE.Mesh(podGeo, podMat);
  pod.position.set(0, 5.0, 0);
  gantry.add(pod);

  // 5 LED Starting Lights (Red & Green)
  for (let l = 0; l < 5; l++) {
    const lx = -2.4 + l * 1.2;
    const bulbGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({
      color: l >= 3 ? 0x22c55e : 0xef4444, // 2 green, 3 red
    });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(lx, 5.0, 0.32);
    gantry.add(bulb);
  }

  return gantry;
}

/**
 * Creates Projectile Mesh (Coconut Torpedo)
 */
export function createProjectileMesh(): THREE.Group {
  const group = new THREE.Group();
  
  const coconutGeo = new THREE.SphereGeometry(0.45, 10, 10);
  const coconutMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.7,
  });
  const ball = new THREE.Mesh(coconutGeo, coconutMat);
  group.add(ball);

  const finGeo = new THREE.ConeGeometry(0.18, 0.4, 4);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.rotation.z = (i * Math.PI) / 2;
    fin.position.set(Math.cos((i * Math.PI) / 2) * 0.4, Math.sin((i * Math.PI) / 2) * 0.4, -0.2);
    group.add(fin);
  }

  const tailGeo = new THREE.ConeGeometry(0.25, 0.8, 8);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.rotation.x = -Math.PI / 2;
  tail.position.z = -0.55;
  group.add(tail);

  return group;
}

/**
 * Creates Trap Mesh (Yellow Banana Peel)
 */
export function createTrapMesh(): THREE.Group {
  const group = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
  });

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const peelGeo = new THREE.ConeGeometry(0.2, 0.7, 5);
    const peel = new THREE.Mesh(peelGeo, skinMat);
    peel.rotation.z = Math.PI / 2 - 0.2;
    peel.rotation.y = angle;
    peel.position.set(Math.cos(angle) * 0.35, 0.08, Math.sin(angle) * 0.35);
    group.add(peel);
  }

  const stemGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 6);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.25;
  group.add(stem);

  return group;
}
