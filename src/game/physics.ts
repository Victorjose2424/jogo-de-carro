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
  const rampConfig = trackBundle.ramps[0];
  const rampWpIndex = Math.floor(rampConfig.u * WAYPOINTS_COUNT);

  // Check spin-out status
  if (racer.spinOutTimeRemaining > 0) {
    racer.spinOutTimeRemaining -= delta;
    racer.rotationY += delta * 12; // Spin around
    racer.speed = Math.max(0, racer.speed - 80 * delta);
    racer.vx *= 0.92;
    racer.vz *= 0.92;
    racer.x += racer.vx * delta;
    racer.z += racer.vz * delta;
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
  const barrierLimit = halfWidth + 2.0;
  if (Math.abs(lateralOffset) > barrierLimit) {
    const sign = lateralOffset > 0 ? 1 : -1;
    racer.x = currentWp.x + currentWp.normalX * (halfWidth + 1.2) * sign;
    racer.z = currentWp.z + currentWp.normalZ * (halfWidth + 1.2) * sign;
    racer.speed *= 0.7;
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

  let steerDelta = 0;
  if (input.left) {
    steerDelta -= turnSpeed * delta; // Turn left in Three.js coordinates
    racer.steerAngle = Math.max(-0.45, racer.steerAngle - delta * 4.0);
  } else if (input.right) {
    steerDelta += turnSpeed * delta; // Turn right
    racer.steerAngle = Math.min(0.45, racer.steerAngle + delta * 4.0);
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

  // --- ELEVATION, RAMP & SOLID GROUND CLAMPING ---
  // Baseline ground elevation from waypoint and banking
  const baseRoadY = currentWp.y + (currentWp.bank || 0) * lateralOffset;
  const minSolidFloor = Math.max(0.35, baseRoadY);
  let targetGroundY = minSolidFloor;

  // Check if driving up the Jump Ramp
  const wpDistToRamp = Math.abs(wpInfo.index - rampWpIndex);
  const isNearRamp = (wpDistToRamp <= 3 || Math.abs(wpInfo.index + WAYPOINTS_COUNT - rampWpIndex) <= 3) && Math.abs(lateralOffset) < (halfWidth - 1.0);

  if (isNearRamp) {
    // Calculate ramp longitudinal progression (0 at base to 1 at tip)
    const rampWp = waypoints[rampWpIndex];
    const toRampX = racer.x - rampWp.x;
    const toRampZ = racer.z - rampWp.z;
    const longitudinalDist = toRampX * rampWp.tangentX + toRampZ * rampWp.tangentZ;
    const halfL = rampConfig.length / 2;
    const rampProgress = Math.max(0, Math.min(1, (longitudinalDist + halfL) / rampConfig.length));

    targetGroundY = baseRoadY + rampProgress * rampConfig.height;

    // Launch at lip of ramp
    if (rampProgress > 0.88 && racer.speed > 45 && racer.isGrounded) {
      racer.vy = 8.5 + (racer.speed / 130) * 2.5; // Jump launch!
      racer.isGrounded = false;
      racer.speed += 12; // Extra ramp jump boost
      if (isPlayer) {
        soundEngine.playBoost();
      }
    }
  }

  // Airborne / Gravity physics
  if (racer.y > targetGroundY + 0.15) {
    racer.vy -= 22 * delta; // Falling
    racer.isGrounded = false;
  } else {
    // Snap to solid floor
    racer.y = targetGroundY;
    racer.vy = 0;
    racer.isGrounded = true;
  }

  // Position integration
  racer.x += racer.vx * delta;
  racer.y += racer.vy * delta;
  racer.z += racer.vz * delta;

  // Hard floor protection: karts CANNOT sink into sand, ocean or void
  if (racer.y < 0.35) {
    racer.y = 0.35;
    racer.vy = 0;
  }

  // Rescue if deep in water / off bridge into void
  const [bStart, bEnd] = trackBundle.bridgeRange;
  const isOnBridgeSection = wpInfo.index >= bStart && wpInfo.index <= bEnd;
  const hasFallenOff = (isOnBridgeSection && Math.abs(lateralOffset) > halfWidth + 3.0) || racer.y < 0.2;

  if (hasFallenOff) {
    // Gentle recovery back onto the track
    racer.x = currentWp.x;
    racer.z = currentWp.z;
    racer.y = currentWp.y + 0.8;
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

/**
 * Handle kart-to-kart collision detection and impulse resolution
 */
export function resolveKartCollisions(racers: RacerState[]) {
  const KART_RADIUS = 1.35;
  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const a = racers[i];
      const b = racers[j];
      if (a.isEliminated || b.isEliminated) continue;

      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distSq = dx * dx + dz * dz;
      const minDist = KART_RADIUS * 2;

      if (distSq < minDist * minDist && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Separate karts
        a.x -= nx * overlap * 0.5;
        a.z -= nz * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.z += nz * overlap * 0.5;

        // Bump impulse
        const relativeSpeed = (a.speed - b.speed) * 0.3;
        a.speed -= relativeSpeed;
        b.speed += relativeSpeed;

        if (a.isPlayer || b.isPlayer) {
          soundEngine.playCollision();
        }
      }
    }
  }
}
