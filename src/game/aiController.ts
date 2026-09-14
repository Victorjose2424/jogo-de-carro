import { RacerState, ActiveTrap, TrackDataBundle } from '../types';
import { WAYPOINTS_COUNT, getClosestWaypoint } from './trackData';
import { KartInput, updateKartPhysics } from './physics';

interface AIDriverBrain {
  preferredOffset: number;
  aggression: number;
  boostTimer: number;
  itemTimer: number;
}

const aiBrains = new Map<string, AIDriverBrain>();

export function getOrCreateAIBrain(racerId: string): AIDriverBrain {
  if (!aiBrains.has(racerId)) {
    // Safe lane offsets positioned comfortably within track asphalt
    const offsets = [-1.8, -0.9, 0, 0.9, 1.8];
    const hash = racerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const chosenOffset = offsets[hash % offsets.length];

    aiBrains.set(racerId, {
      preferredOffset: chosenOffset,
      aggression: 0.6 + (hash % 5) * 0.08,
      boostTimer: 3.5 + Math.random() * 4,
      itemTimer: 2.0 + Math.random() * 4,
    });
  }
  return aiBrains.get(racerId)!;
}

export function updateAIRacer(
  racer: RacerState,
  _allRacers: RacerState[],
  traps: ActiveTrap[],
  trackBundle: TrackDataBundle,
  useItemCallback: (racer: RacerState, slotIndex: number) => void,
  dt: number
) {
  if (racer.isEliminated) return;

  const brain = getOrCreateAIBrain(racer.id);
  const delta = Math.min(dt, 0.05);
  const waypoints = trackBundle.waypoints;

  // 1. Current track waypoint & position
  const wpInfo = getClosestWaypoint(waypoints, racer.x, racer.z, racer.lastKnownWpIndex);
  racer.lastKnownWpIndex = wpInfo.index;
  const currentIdx = wpInfo.index;
  const currentWp = waypoints[currentIdx];

  // 2. Measure current lateral deviation from road center
  const dxToCenter = racer.x - currentWp.x;
  const dzToCenter = racer.z - currentWp.z;
  const currentLateralOffset = dxToCenter * currentWp.normalX + dzToCenter * currentWp.normalZ;
  const halfWidth = currentWp.width / 2;
  const isOffRoad = Math.abs(currentLateralOffset) > halfWidth * 0.68;

  // 3. Adaptive lookahead distance (waypoints ahead scaled with vehicle speed)
  // Low speed: 5 waypoints (~11m); High speed: 10 waypoints (~22m)
  const lookAheadSteps = Math.round(5 + Math.min(6, (racer.speed / 110) * 5));
  const targetIdx = (currentIdx + lookAheadSteps) % WAYPOINTS_COUNT;
  const targetWp = waypoints[targetIdx];

  // 4. Target lane position (centerline if off-track or recovering)
  let targetLateralOffset = brain.preferredOffset;
  if (isOffRoad) {
    targetLateralOffset = 0; // aggressively target center of asphalt
  } else {
    // Avoid nearby banana traps while staying safely inside lane boundaries
    for (const trap of traps) {
      const dx = trap.x - racer.x;
      const dz = trap.z - racer.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < 100) {
        targetLateralOffset = currentLateralOffset > 0 ? -1.6 : 1.6;
        break;
      }
    }
  }

  // 5. Target 3D coordinates on track surface
  const targetX = targetWp.x + targetWp.normalX * targetLateralOffset;
  const targetZ = targetWp.z + targetWp.normalZ * targetLateralOffset;

  // Direction vector to target
  const toTargetX = targetX - racer.x;
  const toTargetZ = targetZ - racer.z;
  const targetAngle = Math.atan2(toTargetX, toTargetZ);

  // 6. Heading error check
  let angleDiff = targetAngle - racer.rotationY;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Verify alignment with track forward direction
  const headingX = Math.sin(racer.rotationY);
  const headingZ = Math.cos(racer.rotationY);
  const trackTangentDot = headingX * currentWp.tangentX + headingZ * currentWp.tangentZ;

  // If AI spun out or facing backwards, force turn back along track tangent
  if (trackTangentDot < 0.25) {
    const forwardAngle = Math.atan2(currentWp.tangentX, currentWp.tangentZ);
    angleDiff = forwardAngle - racer.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  }

  // 7. Corner sharpness anticipation & intelligent speed control
  const wpAheadMid = waypoints[(currentIdx + 8) % WAYPOINTS_COUNT];
  const wpAheadFar = waypoints[(currentIdx + 16) % WAYPOINTS_COUNT];

  const dotMid = currentWp.tangentX * wpAheadMid.tangentX + currentWp.tangentZ * wpAheadMid.tangentZ;
  const dotFar = currentWp.tangentX * wpAheadFar.tangentX + currentWp.tangentZ * wpAheadFar.tangentZ;

  // Sharp turn: dot < 0.82; Moderate curve: dot < 0.94
  const isSharpTurn = dotMid < 0.84 || dotFar < 0.68;
  const isModerateTurn = dotMid < 0.95 || dotFar < 0.85;

  let targetSpeed = 104 + brain.aggression * 14;
  if (isOffRoad) {
    targetSpeed = 55; // Slow down to regain traction and re-enter track
  } else if (isSharpTurn) {
    targetSpeed = 64; // Brake for tight hairpin corner
  } else if (isModerateTurn) {
    targetSpeed = 82; // Controlled speed on winding curves
  }

  const shouldBrake = racer.speed > targetSpeed + 5;
  const shouldAccelerate = racer.speed < targetSpeed;

  // 8. Smooth analog steering (proportional control with damping - eliminates fishtailing)
  let steerVal = Math.max(-1.0, Math.min(1.0, angleDiff * 2.5));

  // If off-track, add inward steering bias to quickly return to asphalt
  if (isOffRoad) {
    const returnForce = currentLateralOffset > 0 ? -0.45 : 0.45;
    steerVal = Math.max(-1.0, Math.min(1.0, steerVal + returnForce));
  }

  const input: KartInput = {
    forward: shouldAccelerate,
    backward: shouldBrake,
    left: steerVal < -0.12,
    right: steerVal > 0.12,
    drift: isSharpTurn && racer.speed > 55,
    boost: false,
    steer: steerVal,
  };

  // 9. Boost usage on straights
  brain.boostTimer -= delta;
  if (brain.boostTimer <= 0) {
    if (Math.abs(angleDiff) < 0.12 && !isSharpTurn && !isModerateTurn && racer.boostFuel > 35) {
      input.boost = true;
      brain.boostTimer = 4.0 + Math.random() * 4.0;
    }
  }

  // 10. Item usage logic
  brain.itemTimer -= delta;
  if (brain.itemTimer <= 0) {
    brain.itemTimer = 2.5 + Math.random() * 3.5;
    for (let slot = 0; slot < racer.items.length; slot++) {
      const item = racer.items[slot];
      if (item) {
        useItemCallback(racer, slot);
        break;
      }
    }
  }

  // 11. Run vehicle physics simulation
  updateKartPhysics(racer, input, trackBundle, delta, false);
}
