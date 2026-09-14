import * as THREE from 'three';
import {
  KartItem,
  ItemType,
  RacerState,
  ItemBox,
  ActiveProjectile,
  ActiveTrap,
} from '../types';
import { createProjectileMesh, createTrapMesh } from './models';
import { soundEngine } from '../audio/soundEngine';

export const ITEM_DEFS: Record<ItemType, { name: string; icon: string; color: string }> = {
  turbo: { name: 'Super Turbo', icon: '🚀', color: '#f97316' },
  missile: { name: 'Coco Míssil', icon: '🥥', color: '#84cc16' },
  shield: { name: 'Escudo Bolha', icon: '🛡️', color: '#06b6d4' },
  trap: { name: 'Casca Banana', icon: '🍌', color: '#eab308' },
  star: { name: 'Estrela Praia', icon: '⭐', color: '#ec4899' },
};

export const AVAILABLE_ITEMS: ItemType[] = ['turbo', 'missile', 'shield', 'trap', 'star'];

export function getRandomItem(): KartItem {
  const type = AVAILABLE_ITEMS[Math.floor(Math.random() * AVAILABLE_ITEMS.length)];
  const def = ITEM_DEFS[type];
  return {
    id: Math.random().toString(36).substring(2, 9),
    type,
    name: def.name,
    icon: def.icon,
    color: def.color,
  };
}

export function checkItemBoxPickups(
  racers: RacerState[],
  boxes: ItemBox[],
  scene: THREE.Scene
) {
  for (const racer of racers) {
    // Check if racer has at least one empty slot (slots 0, 1, 2 for Q, E, R)
    const emptySlotIdx = racer.items.findIndex(item => item === null);
    if (emptySlotIdx === -1) continue;

    for (const box of boxes) {
      if (!box.active) continue;

      const dx = racer.x - box.x;
      const dy = racer.y - box.y;
      const dz = racer.z - box.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 6.5) { // Pickup radius ~2.5 units
        box.active = false;
        box.respawnTimer = 4.0; // 4 seconds respawn

        const newItem = getRandomItem();
        racer.items[emptySlotIdx] = newItem;

        if (racer.isPlayer) {
          soundEngine.playItemPickup();
        }
        break;
      }
    }
  }
}

export function activateItem(
  racer: RacerState,
  slotIndex: number,
  allRacers: RacerState[],
  projectiles: ActiveProjectile[],
  traps: ActiveTrap[],
  scene: THREE.Scene
) {
  const item = racer.items[slotIndex];
  if (!item) return;

  // Consume item
  racer.items[slotIndex] = null;

  if (racer.isPlayer) {
    soundEngine.playItemUse(item.type);
  }

  switch (item.type) {
    case 'turbo': {
      racer.boostTimeRemaining = 2.8;
      racer.boostFuel = Math.min(100, racer.boostFuel + 30);
      break;
    }

    case 'shield': {
      racer.shieldTimeRemaining = 6.0;
      break;
    }

    case 'star': {
      racer.boostTimeRemaining = 3.5;
      racer.shieldTimeRemaining = 5.0;
      racer.boostFuel = 100;
      break;
    }

    case 'missile': {
      // Find closest racer ahead
      let bestTarget: RacerState | undefined;
      let minDistance = 250;

      for (const other of allRacers) {
        if (other.id === racer.id) continue;
        const dx = other.x - racer.x;
        const dz = other.z - racer.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        // Dot product to ensure they are ahead
        const forwardX = Math.sin(racer.rotationY);
        const forwardZ = Math.cos(racer.rotationY);
        const dot = dx * forwardX + dz * forwardZ;

        if (dot > 0 && dist < minDistance) {
          minDistance = dist;
          bestTarget = other;
        }
      }

      const projMesh = createProjectileMesh();
      projMesh.position.set(racer.x, racer.y + 0.6, racer.z);
      scene.add(projMesh);

      const forwardSpeed = 55;
      projectiles.push({
        id: Math.random().toString(36).substring(2, 9),
        ownerId: racer.id,
        x: racer.x,
        y: racer.y + 0.6,
        z: racer.z,
        vx: Math.sin(racer.rotationY) * forwardSpeed,
        vy: 0,
        vz: Math.cos(racer.rotationY) * forwardSpeed,
        targetId: bestTarget?.id,
        mesh: projMesh,
        lifetime: 4.5,
      });
      break;
    }

    case 'trap': {
      // Drop trap behind the kart
      const dropDistance = 2.5;
      const trapX = racer.x - Math.sin(racer.rotationY) * dropDistance;
      const trapZ = racer.z - Math.cos(racer.rotationY) * dropDistance;

      const trapMesh = createTrapMesh();
      trapMesh.position.set(trapX, racer.y + 0.1, trapZ);
      scene.add(trapMesh);

      traps.push({
        id: Math.random().toString(36).substring(2, 9),
        ownerId: racer.id,
        x: trapX,
        y: racer.y,
        z: trapZ,
        mesh: trapMesh,
        lifetime: 25.0,
      });
      break;
    }
  }
}

export function updateProjectilesAndTraps(
  projectiles: ActiveProjectile[],
  traps: ActiveTrap[],
  racers: RacerState[],
  scene: THREE.Scene,
  dt: number
) {
  // 1. Update active projectiles
  for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
    const p = projectiles[pIdx];
    p.lifetime -= dt;

    // Homing adjustment towards target
    if (p.targetId) {
      const target = racers.find(r => r.id === p.targetId);
      if (target) {
        const dx = target.x - p.x;
        const dz = target.z - p.z;
        const targetAngle = Math.atan2(dx, dz);
        const currentAngle = Math.atan2(p.vx, p.vz);
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const turnRate = 2.5 * dt;
        const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnRate);
        const speed = Math.sqrt(p.vx * p.vx + p.vz * p.vz);
        p.vx = Math.sin(newAngle) * speed;
        p.vz = Math.cos(newAngle) * speed;
      }
    }

    p.x += p.vx * dt;
    p.z += p.vz * dt;

    if (p.mesh) {
      p.mesh.position.set(p.x, p.y, p.z);
      p.mesh.rotation.y = Math.atan2(p.vx, p.vz);
      p.mesh.rotation.z += dt * 8; // spin
    }

    // Check hit against racers
    let hit = false;
    for (const racer of racers) {
      // Don't hit owner in first 0.4 seconds
      if (racer.id === p.ownerId && p.lifetime > 4.1) continue;

      const dx = racer.x - p.x;
      const dz = racer.z - p.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < 4.0) {
        hit = true;
        // Check shield
        if (racer.shieldTimeRemaining > 0) {
          racer.shieldTimeRemaining = 0; // shield consumed
          if (racer.isPlayer) soundEngine.playCollision();
        } else {
          // Spin out!
          racer.spinOutTimeRemaining = 1.3;
          if (racer.isPlayer) soundEngine.playSpinOut();
        }
        break;
      }
    }

    if (hit || p.lifetime <= 0) {
      if (p.mesh) scene.remove(p.mesh);
      projectiles.splice(pIdx, 1);
    }
  }

  // 2. Update active traps (bananas)
  for (let tIdx = traps.length - 1; tIdx >= 0; tIdx--) {
    const trap = traps[tIdx];
    trap.lifetime -= dt;

    // Check hit against racers
    let hit = false;
    for (const racer of racers) {
      // Don't hit owner for first 1.5s after dropping
      if (racer.id === trap.ownerId && trap.lifetime > 23.5) continue;

      const dx = racer.x - trap.x;
      const dz = racer.z - trap.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < 3.2) {
        hit = true;
        if (racer.shieldTimeRemaining > 0) {
          racer.shieldTimeRemaining = 0;
          if (racer.isPlayer) soundEngine.playCollision();
        } else {
          racer.spinOutTimeRemaining = 1.4;
          if (racer.isPlayer) soundEngine.playSpinOut();
        }
        break;
      }
    }

    if (hit || trap.lifetime <= 0) {
      if (trap.mesh) scene.remove(trap.mesh);
      traps.splice(tIdx, 1);
    }
  }
}
