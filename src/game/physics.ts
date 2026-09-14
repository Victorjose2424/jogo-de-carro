import { RacerState, TrackWaypoint, TrackDataBundle } from '../types';
import { WAYPOINTS_COUNT, getClosestWaypoint } from './trackData';
import { soundEngine } from '../audio/soundEngine';

export interface KartInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  boost: boolean;
  steer?: number; // Optional analog steer value (-1.0 to +1.0)
}

function projectOnSegment(
  px: number,
  pz: number,
  a: TrackWaypoint,
  b: TrackWaypoint
): { t: number; distSq: number; projX: number; projZ: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 0.0001) {
    const distSq = (px - a.x) * (px - a.x) + (pz - a.z) * (pz - a.z);
    return { t: 0, distSq, projX: a.x, projZ: a.z };
  }
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / lenSq));
  const projX = a.x + t * dx;
  const projZ = a.z + t * dz;
  const distSq = (px - projX) * (px - projX) + (pz - projZ) * (pz - projZ);
  return { t, distSq, projX, projZ };
}

/**
 * Exact ground floor elevation calculator with continuous spline-segment interpolation.
 * Completely eliminates vertical stepping/jitter and delivers butter-smooth tracking.
 */
export function getExactGroundElevation(
  x: number,
  z: number,
  trackBundle: TrackDataBundle,
  _lastKnownWpIndex?: number
): number {
  const waypoints = trackBundle.waypoints;
  const count = waypoints.length;

  // 1. Find closest waypoint
  const wpInfo = getClosestWaypoint(waypoints, x, z);
  const centerIdx = wpInfo.index;

  // 2. Continuous spline segment projection between adjacent waypoints
  const prevIdx = (centerIdx - 1 + count) % count;
  const nextIdx = (centerIdx + 1) % count;

  const seg1 = projectOnSegment(x, z, waypoints[prevIdx], waypoints[centerIdx]);
  const seg2 = projectOnSegment(x, z, waypoints[centerIdx], waypoints[nextIdx]);

  let wpA = waypoints[prevIdx];
  let wpB = waypoints[centerIdx];
  let t = seg1.t;
  let projX = seg1.projX;
  let projZ = seg1.projZ;

  if (seg2.distSq < seg1.distSq) {
    wpA = waypoints[centerIdx];
    wpB = waypoints[nextIdx];
    t = seg2.t;
    projX = seg2.projX;
    projZ = seg2.projZ;
  }

  // Continuous interpolated road baseline properties
  const centerY = wpA.y + t * (wpB.y - wpA.y);
  const bank = (wpA.bank || 0) + t * ((wpB.bank || 0) - (wpA.bank || 0));
  const width = wpA.width + t * (wpB.width - wpA.width);
  const halfWidth = width / 2;

  // Continuous interpolated normal
  let normX = wpA.normalX + t * (wpB.normalX - wpA.normalX);
  let normZ = wpA.normalZ + t * (wpB.normalZ - wpA.normalZ);
  const normLen = Math.sqrt(normX * normX + normZ * normZ) || 1;
  normX /= normLen;
  normZ /= normLen;

  // Continuous lateral offset from track centerline
  const lateralOffset = (x - projX) * normX + (z - projZ) * normZ;

  // Road surface is elevated slightly above waypoint baseline so tires rest on the asphalt
  let roadFloor = centerY + bank * lateralOffset + 0.16;

  // 3. Bridge surface check (wooden planks over ocean/lava/canyon)
  const [bStart, bEnd] = trackBundle.bridgeRange;
  const isBridge = centerIdx >= bStart && centerIdx <= bEnd;
  if (isBridge) {
    roadFloor = Math.max(roadFloor, centerY + 0.25);
  }

  // 4. Jump Ramp surface check
  if (trackBundle.ramps && trackBundle.ramps.length > 0) {
    for (const ramp of trackBundle.ramps) {
      const rampWpIdx = Math.floor(ramp.u * WAYPOINTS_COUNT);
      const rampWp = waypoints[rampWpIdx];
      const toRampX = x - rampWp.x;
      const toRampZ = z - rampWp.z;
      const longDist = toRampX * rampWp.tangentX + toRampZ * rampWp.tangentZ;
      const latDist = toRampX * rampWp.normalX + toRampZ * rampWp.normalZ;

      const halfLength = ramp.length / 2;
      if (Math.abs(latDist) <= halfWidth - 0.5 && longDist >= -halfLength && longDist <= halfLength) {
        const rampProgress = Math.max(0, Math.min(1, (longDist + halfLength) / ramp.length));
        const rampFloor = rampWp.y + rampProgress * ramp.height + 0.20;
        roadFloor = Math.max(roadFloor, rampFloor);
      }
    }
  }

  // Ground elevation:
  // On the road surface or curbs
  const distFromCenter = Math.abs(lateralOffset);
  if (distFromCenter <= halfWidth + 1.2) {
    return Math.max(0.40, roadFloor);
  }

  // Track shoulder / grass / sand slopes gently down from the road edge
  const extraDist = distFromCenter - (halfWidth + 1.2);
  const shoulderDrop = Math.min(1.2, extraDist * 0.08);
  const groundFloor = roadFloor - shoulderDrop;

  return Math.max(0.40, groundFloor);
}

export function updateKartPhysics(
  racer: RacerState,
  input: KartInput,
  trackBundle: TrackDataBundle,
  dt: number,
  isPlayer: boolean = false
) {
  const delta = Math.min(dt, 0.05);
  const waypoints = trackBundle.waypoints;

  // Check spin-out status
  if (racer.spinOutTimeRemaining > 0) {
    racer.spinOutTimeRemaining -= delta;
    racer.rotationY += delta * 12; // Spin around
    racer.speed = Math.max(0, racer.speed - 80 * delta);
    racer.vx *= 0.92;
    racer.vz *= 0.92;
    racer.x += racer.vx * delta;
    racer.z += racer.vz * delta;

    // Strict solid floor clamping during spinout
    const spinFloor = getExactGroundElevation(racer.x, racer.z, trackBundle, racer.lastKnownWpIndex);
    racer.y = spinFloor;
    racer.vy = 0;
    racer.isGrounded = true;
    return;
  }

  // Update effect timers
  if (racer.boostTimeRemaining > 0) {
    racer.boostTimeRemaining -= delta;
  }
  if (racer.shieldTimeRemaining > 0) {
    racer.shieldTimeRemaining -= delta;
  }

  // Combined character + kart stats
  const charStats = racer.character;
  const kartStats = racer.kartType;
  const statSpeed = (charStats.speed + (kartStats?.speed ?? 3)) / 2;
  const statAccel = (charStats.acceleration + (kartStats?.acceleration ?? 3)) / 2;
  const statHandling = (charStats.handling + (kartStats?.handling ?? 3)) / 2;
  const statBoost = (charStats.boostPower + (kartStats?.boostPower ?? 3)) / 2;

  // Track waypoint tracking (forward-biased search prevents disorientation)
  const wpInfo = getClosestWaypoint(waypoints, racer.x, racer.z, racer.lastKnownWpIndex);
  racer.lastKnownWpIndex = wpInfo.index;
  const currentWp = waypoints[wpInfo.index];

  // Lateral distance from track centerline
  const dxToCenter = racer.x - currentWp.x;
  const dzToCenter = racer.z - currentWp.z;
  const lateralOffset = dxToCenter * currentWp.normalX + dzToCenter * currentWp.normalZ;
  const halfWidth = currentWp.width / 2;
  const isOffRoad = Math.abs(lateralOffset) > halfWidth;

  // Track barrier collision: soft bounce back inside if hitting outer boundary
  const [bStart, bEnd] = trackBundle.bridgeRange;
  const isOnBridgeSection = wpInfo.index >= bStart && wpInfo.index <= bEnd;
  const barrierLimit = isOnBridgeSection ? halfWidth - 0.4 : halfWidth + 1.2;
  if (Math.abs(lateralOffset) > barrierLimit) {
    const sign = lateralOffset > 0 ? 1 : -1;
    // Push the kart back cleanly INSIDE the drivable road surface
    const safeOffset = isOnBridgeSection ? halfWidth - 0.7 : halfWidth - 0.8;
    racer.x = currentWp.x + currentWp.normalX * safeOffset * sign;
    racer.z = currentWp.z + currentWp.normalZ * safeOffset * sign;
    racer.speed *= 0.82;

    // Deflect heading to steer back along the track
    const trackAngle = Math.atan2(currentWp.tangentX, currentWp.tangentZ);
    let diff = trackAngle - racer.rotationY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    racer.rotationY += diff * 0.4;

    if (isPlayer) {
      soundEngine.playCollision();
    }
  }

  // Boost activation
  const isBoostingFuel = input.boost && racer.boostFuel > 5;
  const hasItemBoost = racer.boostTimeRemaining > 0;
  const isBoosting = isBoostingFuel || hasItemBoost;

  if (isBoostingFuel) {
    racer.boostFuel = Math.max(0, racer.boostFuel - 28 * delta);
    if (isPlayer && Math.random() < 0.15) {
      soundEngine.playBoost();
    }
  } else {
    racer.boostFuel = Math.min(100, racer.boostFuel + 9 * delta);
  }

  // Top speed calculation
  const baseTopSpeed = 92 + statSpeed * 5; // 97 to 117 km/h
  let maxSpeed = baseTopSpeed;

  if (isBoosting) {
    maxSpeed = baseTopSpeed + 38 + statBoost * 4; // 139 to 167 km/h
  } else if (isOffRoad) {
    // Off-road kart suffers much less penalty
    const offRoadPenalty = kartStats?.id === 'offroad' ? 20 : 50;
    maxSpeed = Math.max(45, baseTopSpeed - offRoadPenalty);
  }

  // Acceleration & Braking
  const accelRate = (18 + statAccel * 5) * (isBoosting ? 1.8 : 1.0);
  const brakeRate = 38;
  const friction = isOffRoad ? 26 : 12;

  if (input.forward) {
    if (racer.speed < maxSpeed) {
      racer.speed += accelRate * delta;
    } else {
      racer.speed -= friction * delta;
    }
  } else if (input.backward) {
    if (racer.speed > 0) {
      racer.speed -= brakeRate * delta;
    } else {
      racer.speed = Math.max(-25, racer.speed - accelRate * 0.5 * delta); // Reverse
    }
  } else {
    // Coasting
    if (racer.speed > 0) {
      racer.speed = Math.max(0, racer.speed - friction * delta);
    } else if (racer.speed < 0) {
      racer.speed = Math.min(0, racer.speed + friction * delta);
    }
  }

  // Drift Mechanics (Spacebar)
  const isDrifting = input.drift && (input.left || input.right) && racer.speed > 32;
  if (isDrifting) {
    if (racer.driftDirection === 0) {
      racer.driftDirection = input.left ? 1 : -1;
      racer.driftTime = 0;
    }
    racer.driftTime += delta;

    // Mini-turbo charge threshold: faster for drift phantom
    const chargeMultiplier = kartStats?.id === 'phantom' ? 1.4 : 1.0;
    const effectiveDriftTime = racer.driftTime * chargeMultiplier;

    if (effectiveDriftTime > 1.4) {
      racer.driftBoostLevel = 2; // Orange mini-turbo
    } else if (effectiveDriftTime > 0.6) {
      racer.driftBoostLevel = 1; // Blue mini-turbo
    }

    if (isPlayer && Math.random() < 0.22) {
      soundEngine.playDriftScreech();
    }
  } else {
    // Release drift boost
    if (racer.driftDirection !== 0) {
      if (racer.driftBoostLevel > 0) {
        const turboDuration = racer.driftBoostLevel === 2 ? 1.4 : 0.8;
        racer.boostTimeRemaining = turboDuration;
        if (isPlayer) {
          soundEngine.playBoost();
        }
      }
      racer.driftDirection = 0;
      racer.driftTime = 0;
      racer.driftBoostLevel = 0;
    }
  }

  // Steering
  let turnSpeed = 1.8 + statHandling * 0.28;
  if (isDrifting) {
    turnSpeed *= 1.35;
  }

  let steerVal = 0;
  if (input.steer !== undefined) {
    steerVal = Math.max(-1, Math.min(1, input.steer));
  } else if (input.left) {
    steerVal = -1;
  } else if (input.right) {
    steerVal = 1;
  }

  let steerDelta = steerVal * turnSpeed * delta;
  if (Math.abs(steerVal) > 0.05) {
    racer.steerAngle = Math.max(-0.45, Math.min(0.45, racer.steerAngle + steerVal * delta * 4.0));
  } else {
    racer.steerAngle *= 0.78; // return to center
  }

  if (racer.speed < 0) {
    steerDelta = -steerDelta; // Invert in reverse
  }

  racer.rotationY += steerDelta;

  // Velocity calculation
  const speedUnitsPerSec = racer.speed * 0.278;
  racer.vx = Math.sin(racer.rotationY) * speedUnitsPerSec;
  racer.vz = Math.cos(racer.rotationY) * speedUnitsPerSec;

  // --- SOLID FLOOR CLAMPING & VERTICAL PHYSICS ---
  // Integrate horizontal motion in X & Z
  racer.x += racer.vx * delta;
  racer.z += racer.vz * delta;

  // Calculate exact ground elevation beneath the kart
  const solidFloorY = getExactGroundElevation(racer.x, racer.z, trackBundle, racer.lastKnownWpIndex);

  // Jump Ramp launch check
  if (trackBundle.ramps && trackBundle.ramps.length > 0) {
    for (const ramp of trackBundle.ramps) {
      const rampWpIdx = Math.floor(ramp.u * WAYPOINTS_COUNT);
      const rampWp = waypoints[rampWpIdx];
      const toRampX = racer.x - rampWp.x;
      const toRampZ = racer.z - rampWp.z;
      const longDist = toRampX * rampWp.tangentX + toRampZ * rampWp.tangentZ;
      const latDist = toRampX * rampWp.normalX + toRampZ * rampWp.normalZ;

      if (
        Math.abs(latDist) <= halfWidth - 0.5 &&
        longDist >= ramp.length * 0.35 &&
        longDist <= ramp.length * 0.55 &&
        racer.isGrounded &&
        racer.speed > 42
      ) {
        racer.vy = 8.8 + (racer.speed / 130) * 3.2; // Launch off lip!
        racer.isGrounded = false;
        racer.speed += 14; // Ramp boost
        if (isPlayer) {
          soundEngine.playBoost();
        }
      }
    }
  }

  // Vertical physics with rigorous ground clamping: karts CANNOT sink into the floor
  if (racer.vy > 0 || racer.y > solidFloorY + 0.12) {
    // Airborne / Jumping
    racer.vy -= 26 * delta; // Gravity pull
    racer.y += racer.vy * delta;

    // Solid floor catch: snap precisely to floor if kart reaches or goes below it
    if (racer.y <= solidFloorY) {
      racer.y = solidFloorY;
      racer.vy = 0;
      racer.isGrounded = true;
    } else {
      racer.isGrounded = false;
    }
  } else {
    // Firmly grounded: smooth suspension damping prevents micro-bumps
    const yDiff = solidFloorY - racer.y;
    if (Math.abs(yDiff) < 0.18) {
      racer.y += yDiff * Math.min(1, delta * 30);
    } else {
      racer.y = solidFloorY;
    }
    racer.vy = 0;
    racer.isGrounded = true;
  }

  // Absolute fail-safe: Y is strictly clamped to solidFloorY
  if (racer.y < solidFloorY) {
    racer.y = solidFloorY;
    racer.vy = 0;
    racer.isGrounded = true;
  }

  // Rescue if off bridge into liquid
  const hasFallenOff = isOnBridgeSection && Math.abs(lateralOffset) > halfWidth + 1.0;

  if (hasFallenOff) {
    // Gentle recovery back onto the track
    racer.x = currentWp.x;
    racer.z = currentWp.z;
    racer.y = currentWp.y + 0.25;
    racer.vy = 0;
    racer.speed = Math.min(racer.speed, 35);
    racer.rotationY = Math.atan2(currentWp.tangentX, currentWp.tangentZ);
    if (isPlayer) {
      soundEngine.playCollision();
    }
  }

  // Check Boost Pads
  for (const padLoc of trackBundle.boostPads) {
    const padWpIdx = Math.floor(padLoc.u * WAYPOINTS_COUNT);
    if (Math.abs(wpInfo.index - padWpIdx) <= 2 && Math.abs(lateralOffset) < 3.5) {
      if (racer.boostTimeRemaining < 0.8) {
        racer.boostTimeRemaining = 1.6;
        if (isPlayer) {
          soundEngine.playBoost();
        }
      }
      break;
    }
  }

  // Lap Progress and Lap Counter
  const newProgress = wpInfo.index / WAYPOINTS_COUNT;
  if (racer.lapProgress > 0.85 && newProgress < 0.15) {
    racer.currentLap += 1;
    const now = performance.now();
    const lapTime = (now - racer.currentLapStartTime) / 1000;
    racer.lapTimes.push(lapTime);
    racer.currentLapStartTime = now;
  }
  racer.lapProgress = newProgress;
  racer.totalDistance = (racer.currentLap - 1) * WAYPOINTS_COUNT + wpInfo.index;

  // Engine sound update
  if (isPlayer) {
    soundEngine.updateEnginePitch(Math.abs(racer.speed), input.forward, isBoosting);
  }
}

let lastCollisionSoundTime = 0;

/**
 * Handle kart-to-kart collision detection and impulse resolution
 */
export function resolveKartCollisions(racers: RacerState[]) {
  const KART_RADIUS = 1.35;
  const now = performance.now();
  let shouldPlaySound = false;

  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const a = racers[i];
      const b = racers[j];
      if (a.isEliminated || b.isEliminated) continue;

      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distSq = dx * dx + dz * dz;
      const minDist = KART_RADIUS * 2;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Controlled smooth separation without violent teleporting
        const pushDist = Math.min(overlap * 0.42, 0.3);
        a.x -= nx * pushDist;
        a.z -= nz * pushDist;
        b.x += nx * pushDist;
        b.z += nz * pushDist;

        // Bump impulse with damping to avoid chaotic ping-ponging
        const relSpeed = (a.speed - b.speed) * 0.22;
        const impulse = Math.max(-12, Math.min(12, relSpeed));
        a.speed -= impulse;
        b.speed += impulse;

        if ((a.isPlayer || b.isPlayer) && (now - lastCollisionSoundTime > 320)) {
          shouldPlaySound = true;
        }
      }
    }
  }

  if (shouldPlaySound) {
    lastCollisionSoundTime = now;
    soundEngine.playCollision();
  }
}
