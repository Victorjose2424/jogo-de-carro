export type GameState = 'MENU' | 'CHARACTER_SELECT' | 'COUNTDOWN' | 'RACING' | 'FINISHED' | 'PAUSED';

export type ItemType = 'turbo' | 'missile' | 'shield' | 'trap' | 'star';

export type TrackId = 'beach' | 'volcano' | 'snow';

export type RaceMode = 'NORMAL' | 'TIME_TRIAL' | 'ELIMINATOR';

export type KartTypeId = 'cruiser' | 'formula' | 'offroad' | 'phantom';

export interface KartTypeDef {
  id: KartTypeId;
  name: string;
  subtitle: string;
  description: string;
  speed: number;        // 1 to 5
  acceleration: number; // 1 to 5
  handling: number;     // 1 to 5
  boostPower: number;   // 1 to 5
  weight: 'Leve' | 'Médio' | 'Pesado';
  primaryColor: string;
  accentColor: string;
}

export interface TrackDef {
  id: TrackId;
  name: string;
  subtitle: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  totalLaps: number;
  theme: 'tropical' | 'volcano' | 'snow';
  skyColor: number;
  fogColor: number;
  sunColor: number;
  groundColor: number;
  liquidColor: number;
  liquidName: string;
}

export interface KartItem {
  id: string;
  type: ItemType;
  name: string;
  icon: string;
  color: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  kartName: string;
  color: string;
  accentColor: string;
  helmetColor: string;
  speed: number;       // 1 to 5
  acceleration: number; // 1 to 5
  handling: number;    // 1 to 5
  boostPower: number;  // 1 to 5
  description: string;
}

export interface RacerState {
  id: string;
  name: string;
  isPlayer: boolean;
  character: CharacterDef;
  kartType: KartTypeDef;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotationY: number;
  steerAngle: number;
  speed: number; // in km/h
  driftDirection: -1 | 0 | 1;
  driftTime: number;
  driftBoostLevel: number; // 0, 1 (blue), 2 (orange)
  boostTimeRemaining: number;
  shieldTimeRemaining: number;
  spinOutTimeRemaining: number;
  boostFuel: number; // 0 to 100
  currentLap: number;
  lapProgress: number; // 0 to 1 along circuit
  totalDistance: number;
  rank: number;
  items: (KartItem | null)[]; // 3 slots (Q, E, R)
  isGrounded: boolean;
  meshGroup?: any;
  lapTimes: number[];
  currentLapStartTime: number;
  lastKnownWpIndex: number;
  isEliminated?: boolean;
}

export interface TrackWaypoint {
  x: number;
  y: number;
  z: number;
  width: number;
  normalX: number;
  normalZ: number;
  tangentX: number;
  tangentZ: number;
  bank?: number;
  distanceFromStart: number;
}

export interface ItemBox {
  id: number;
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnTimer: number;
  mesh?: any;
}

export interface ActiveProjectile {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetId?: string;
  mesh?: any;
  lifetime: number;
}

export interface ActiveTrap {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  z: number;
  mesh?: any;
  lifetime: number;
}

export interface ParticleEffect {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  quality: 'low' | 'medium' | 'high';
  showMinimap: boolean;
  touchControls: boolean;
  driftMarksEnabled: boolean;
}

export interface TrackDataBundle {
  trackDef: TrackDef;
  waypoints: TrackWaypoint[];
  curve: any;
  length: number;
  boostPads: { u: number; offset: number }[];
  itemBoxClusters: { u: number; offsets: number[] }[];
  ramps: { u: number; height: number; length: number }[];
  bridgeRange: [number, number];
}
