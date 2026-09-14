import * as THREE from 'three';
import { CharacterDef, KartTypeDef } from '../types';

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

  // --- 4 WHEELS WITH DETAILED RIMS ---
  const wheels: THREE.Mesh[] = [];

  function createWheel(isFront: boolean): { wheelRoot: THREE.Group; tireMesh: THREE.Mesh } {
    const wheelRoot = new THREE.Group();
    const isOffroad = typeId === 'offroad';
    const isFormula = typeId === 'formula';

    const radius = isOffroad ? (isFront ? 0.38 : 0.44) : isFront ? 0.34 : 0.38;
    const thickness = isOffroad ? 0.38 : isFormula ? 0.26 : isFront ? 0.28 : 0.36;

    const tGeo = new THREE.CylinderGeometry(radius, radius, thickness, 16);
    const tire = new THREE.Mesh(tGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelRoot.add(tire);
    wheels.push(tire);

    const rimGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, thickness * 1.05, 12);
    const rim = new THREE.Mesh(rimGeo, accentMat);
    rim.rotation.z = Math.PI / 2;
    wheelRoot.add(rim);

    const capGeo = new THREE.SphereGeometry(radius * 0.25, 8, 8);
    const cap = new THREE.Mesh(capGeo, chromeMat);
    cap.position.x = isFront ? 0.15 : 0.19;
    wheelRoot.add(cap);

    return { wheelRoot, tireMesh: tire };
  }

  const fl = createWheel(true);
  fl.wheelRoot.position.set(-0.85, 0.34, 0.95);
  root.add(fl.wheelRoot);

  const fr = createWheel(true);
  fr.wheelRoot.position.set(0.85, 0.34, 0.95);
  root.add(fr.wheelRoot);

  const rl = createWheel(false);
  rl.wheelRoot.position.set(-0.9, 0.38, -0.85);
  root.add(rl.wheelRoot);

  const rr = createWheel(false);
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
 * Creates lush 3D Palm Tree with curved trunk and coconuts
 */
export function createPalmTree(): THREE.Group {
  const palm = new THREE.Group();
  palm.name = 'palm_tree';

  const trunkMat = getCachedMaterial('palm_trunk', () => new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.9,
  }));

  const trunkSteps = 7;
  let currentY = 0;
  const curveDir = Math.random() * Math.PI * 2;
  const bendIntensity = 0.08 + Math.random() * 0.06;

  for (let i = 0; i < trunkSteps; i++) {
    const bottomRadius = 0.45 * (1 - i * 0.08);
    const topRadius = 0.42 * (1 - (i + 1) * 0.08);
    const segHeight = 1.1;

    const segGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, segHeight, 8);
    const seg = new THREE.Mesh(segGeo, trunkMat);
    seg.position.set(
      Math.cos(curveDir) * (i * i * bendIntensity),
      currentY + segHeight / 2,
      Math.sin(curveDir) * (i * i * bendIntensity)
    );
    seg.rotation.z = Math.cos(curveDir) * (i * bendIntensity * 0.7);
    seg.rotation.x = Math.sin(curveDir) * (i * bendIntensity * 0.7);
    seg.castShadow = true;
    seg.receiveShadow = true;
    palm.add(seg);

    currentY += segHeight * 0.95;
  }

  const crownGroup = new THREE.Group();
  crownGroup.position.set(
    Math.cos(curveDir) * (trunkSteps * trunkSteps * bendIntensity),
    currentY,
    Math.sin(curveDir) * (trunkSteps * trunkSteps * bendIntensity)
  );

  const coconutMat = getCachedMaterial('coconut_mat', () => new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.8,
  }));
  const nutGeo = new THREE.SphereGeometry(0.24, 7, 7);
  for (let c = 0; c < 4; c++) {
    const angle = (c / 4) * Math.PI * 2;
    const nut = new THREE.Mesh(nutGeo, coconutMat);
    nut.position.set(Math.cos(angle) * 0.35, -0.2, Math.sin(angle) * 0.35);
    crownGroup.add(nut);
  }

  const leafMat = getCachedMaterial('palm_leaf', () => new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.4,
    side: THREE.DoubleSide,
  }));

  const numFronds = 9;
  for (let f = 0; f < numFronds; f++) {
    const fAngle = (f / numFronds) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.7, 4.0, 5);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.scale.set(1.0, 1.0, 0.15);
    leaf.rotation.z = Math.PI / 2 + 0.35;
    leaf.rotation.y = fAngle;
    leaf.position.set(Math.cos(fAngle) * 1.8, -0.4, Math.sin(fAngle) * 1.8);
    leaf.castShadow = true;
    crownGroup.add(leaf);
  }

  palm.add(crownGroup);
  return palm;
}

/**
 * Creates 3D Tropical Boulder
 */
export function createTropicalRock(): THREE.Mesh {
  const rockGeo = new THREE.DodecahedronGeometry(1.6 + Math.random() * 1.2, 1);
  const rockMat = getCachedMaterial('rock_mat', () => new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.85,
    metalness: 0.1,
    flatShading: true,
  }));
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.scale.set(1.0 + Math.random() * 0.4, 0.7 + Math.random() * 0.4, 1.0 + Math.random() * 0.4);
  rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

/**
 * Creates 3D Volcanic Obsidian Rock with glowing cracks
 */
export function createVolcanicRock(): THREE.Group {
  const group = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(1.8 + Math.random() * 1.5, 1);
  const rockMat = getCachedMaterial('volcano_rock', () => new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.9,
    metalness: 0.3,
    flatShading: true,
  }));
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.scale.set(1.0 + Math.random() * 0.5, 1.0 + Math.random() * 0.6, 1.0 + Math.random() * 0.5);
  rock.castShadow = true;
  group.add(rock);

  // Glowing magma vein
  if (Math.random() > 0.4) {
    const veinGeo = new THREE.SphereGeometry(0.6, 6, 6);
    const veinMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.position.set(0, 0.4, 0);
    group.add(vein);
  }

  return group;
}

/**
 * Creates Volcanic Spire Chimney with glowing tip
 */
export function createVolcanicSpire(): THREE.Group {
  const group = new THREE.Group();
  const spireGeo = new THREE.ConeGeometry(2.5, 14.0, 7);
  const spireMat = getCachedMaterial('spire_mat', () => new THREE.MeshStandardMaterial({
    color: 0x292524,
    roughness: 0.95,
    flatShading: true,
  }));
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 7.0;
  spire.castShadow = true;
  group.add(spire);

  // Glowing lava top
  const topGeo = new THREE.SphereGeometry(1.0, 8, 8);
  const topMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const top = new THREE.Mesh(topGeo, topMat);
  top.position.y = 13.8;
  group.add(top);

  return group;
}

/**
 * Creates Snowy Pine Tree with white snow cap tiers
 */
export function createSnowyPineTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3.5, 7);
  const trunkMat = getCachedMaterial('pine_trunk', () => new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
  }));
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.75;
  trunk.castShadow = true;
  tree.add(trunk);

  const pineMat = getCachedMaterial('pine_foliage', () => new THREE.MeshStandardMaterial({
    color: 0x1e3a2f,
    roughness: 0.7,
  }));
  const snowMat = getCachedMaterial('snow_cap', () => new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.8,
  }));

  const tiers = [
    { y: 3.2, r: 2.8, h: 2.5 },
    { y: 4.8, r: 2.2, h: 2.2 },
    { y: 6.2, r: 1.5, h: 1.8 },
  ];

  tiers.forEach(tier => {
    const coneGeo = new THREE.ConeGeometry(tier.r, tier.h, 7);
    const foliage = new THREE.Mesh(coneGeo, pineMat);
    foliage.position.y = tier.y;
    foliage.castShadow = true;
    tree.add(foliage);

    const capGeo = new THREE.ConeGeometry(tier.r * 0.95, tier.h * 0.45, 7);
    const snowCap = new THREE.Mesh(capGeo, snowMat);
    snowCap.position.y = tier.y + tier.h * 0.28;
    tree.add(snowCap);
  });

  return tree;
}

/**
 * Creates Ice Crystal / Glacial Spire
 */
export function createIceCrystal(): THREE.Mesh {
  const iceGeo = new THREE.ConeGeometry(1.2, 5.0, 5);
  const iceMat = getCachedMaterial('ice_crystal', () => new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85,
  }));
  const ice = new THREE.Mesh(iceGeo, iceMat);
  ice.position.y = 2.5;
  ice.rotation.z = (Math.random() - 0.5) * 0.3;
  ice.castShadow = true;
  return ice;
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
 * Creates Start / Finish Gantry Archway
 */
export function createStartFinishGantry(trackName: string = 'BEACH KART GP'): THREE.Group {
  const gantry = new THREE.Group();

  const woodMat = getCachedMaterial('gantry_wood', () => new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.7,
  }));

  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 7.5, 10);
  const leftPillar = new THREE.Mesh(pillarGeo, woodMat);
  leftPillar.position.set(-9.5, 3.75, 0);
  leftPillar.castShadow = true;

  const rightPillar = new THREE.Mesh(pillarGeo, woodMat);
  rightPillar.position.set(9.5, 3.75, 0);
  rightPillar.castShadow = true;
  gantry.add(leftPillar, rightPillar);

  const beamGeo = new THREE.BoxGeometry(21.0, 0.8, 0.8);
  const beam = new THREE.Mesh(beamGeo, woodMat);
  beam.position.set(0, 7.2, 0);
  beam.castShadow = true;
  gantry.add(beam);

  const signGeo = new THREE.BoxGeometry(14.0, 1.8, 0.3);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 6.2, 0);
  gantry.add(sign);

  const bannerGeo = new THREE.BoxGeometry(14.0, 0.5, 0.32);
  const bannerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 5.2, 0);
  gantry.add(banner);

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
