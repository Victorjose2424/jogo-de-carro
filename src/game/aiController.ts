import { RacerState, ActiveTrap, TrackDataBundle } from '../types';
import { WAYPOINTS_COUNT, getClosestWaypoint } from './trackData';
import { KartInput, updateKartPhysics } from './physics';

interface AIDriverBrain {
  preferredOffset: number;
  lookAheadSteps: number;
  aggression: number;
  boostTimer: number;
  itemTimer: number;
}

const aiBrains = new Map<string, AIDriverBrain>();

export function getOrCreateAIBrain(racerId: string): AIDriverBrain {
  if (!aiBrains.has(racerId)) {
    const offsets = [-3.0, -1.5, 0, 1.5, 3.0];
    const hash = racerId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const chosenOffset = offsets[hash % offsets.length];

    aiBrains.set(racerId, {
      preferredOffset: chosenOffset,
      lookAheadSteps: 16 + (hash % 6), // 16 to 22 waypoints ahead
      aggression: 0.5 + (hash % 5) * 0.1,
      boostTimer: 3 + Math.random() * 4,
      itemTimer: 2 + Math.random() * 4,
    });
  }
  return aiBrains.get(racerId)!;
}

export function updateAIRacer(
  racer: RacerState,
  allRacers: RacerState[],
  traps: ActiveTrap[],
  trackBundle: TrackDataBundle,
  useItemCallback: (racer: RacerState, slotIndex: number) => void,
  dt: number
) {
  if (racer.isEliminated) return;

  const brain = getOrCreateAIBrain(racer.id);
  const delta = Math.min(dt, 0.05);
  const waypoints = trackBundle.waypoints;

  // Track waypoint tracking
  const wpInfo = getClosestWaypoint(waypoints, racer.x, racer.z, racer.lastKnownWpIndex);
  racer.lastKnownWpIndex = wpInfo.index;
  const currentIdx = wpInfo.index;

  // Target waypoint forward along track
  const targetIdx = (currentIdx + brain.lookAheadSteps) % WAYPOINTS_COUNT;
  const targetWp = waypoints[targetIdx];

  // Desired position on track width
  let lateralTargetOffset = brain.preferredOffset;

  // Dodge nearby banana traps
  for (const trap of traps) {
    const dx = trap.x - racer.x;
    const dz = trap.z - racer.z;
    const distSq = dx * dx + dz * dz;
    if (distSq < 120) {
      lateralTargetOffset = lateralTargetOffset > 0 ? -3.5 : 3.5;
      break;
    }
  }

  // Target coordinates in 3D world space
  const targetX = targetWp.x + targetWp.normalX * lateralTargetOffset;
  const targetZ = targetWp.z + targetWp.normalZ * lateralTargetOffset;

  // Direction vector to target
  const toTargetX = targetX - racer.x;
  const toTargetZ = targetZ - racer.z;
  const targetAngle = Math.atan2(toTargetX, toTargetZ);

  // Check if AI is facing backwards relative to track
  const headingX = Math.sin(racer.rotationY);
  const headingZ = Math.cos(racer.rotationY);
  const trackTangentDot = headingX * targetWp.tangentX + headingZ * targetWp.tangentZ;

  // Angle difference between current heading and target (-PI to PI)
  let angleDiff = targetAngle - racer.rotationY;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // If facing backwards (e.g. after hard collision), force steer to face forward
  if (trackTangentDot < 0) {
    const forwardAngle = Math.atan2(targetWp.tangentX, targetWp.tangentZ);
    angleDiff = forwardAngle - racer.rotationY;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  }

  // Corner curvature check ahead for braking
  const futureIdx = (currentIdx + 25) % WAYPOINTS_COUNT;
  const futureWp = waypoints[futureIdx];
  // Dot product of tangents gives sharpness of upcoming turn
  const tangentDot = targetWp.tangentX * futureWp.tangentX + targetWp.tangentZ * futureWp.tangentZ;
  const isSharpCornerAhead = tangentDot < 0.72;
  const shouldBrake = isSharpCornerAhead && racer.speed > 80;

  // Correct Steering controls:
  // In physics: left subtracts from rotationY, right adds to rotationY.
  // When angleDiff > 0 (target is to the right): turn right!
  // When angleDiff < 0 (target is to the left): turn left!
  const isFarLeft = angleDiff < -0.06;
  const isFarRight = angleDiff > 0.06;

  const input: KartInput = {
    forward: !shouldBrake,
    backward: shouldBrake,
    left: isFarLeft,
    right: isFarRight,
    drift: Math.abs(angleDiff) > 0.38 && racer.speed > 55,
    boost: false,
  };

  // Boost usage on straights
  brain.boostTimer -= delta;
  if (brain.boostTimer <= 0) {
    if (Math.abs(angleDiff) < 0.15 && !isSharpCornerAhead && racer.boostFuel > 40) {
      input.boost = true;
      brain.boostTimer = 4.5 + Math.random() * 5.0;
    }
  }

  // Item usage logic
  brain.itemTimer -= delta;
  if (brain.itemTimer <= 0) {
    brain.itemTimer = 2.5 + Math.random() * 4.0;
    for (let slot = 0; slot < racer.items.length; slot++) {
      const item = racer.items[slot];
      if (item) {
        useItemCallback(racer, slot);
        break;
      }
    }
  }

  // Run vehicle physics simulation
  updateKartPhysics(racer, input, trackBundle, delta, false);
}
