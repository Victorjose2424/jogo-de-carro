import { CharacterDef } from '../types';

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'blaze',
    name: 'Blaze',
    kartName: 'Flame Runner',
    color: '#ef4444', // vibrant red
    accentColor: '#fbbf24', // warm yellow
    helmetColor: '#dc2626',
    speed: 4,
    acceleration: 4,
    handling: 4,
    boostPower: 4,
    description: 'Equilibrado e veloz, ideal para dominar as curvas da praia!'
  },
  {
    id: 'tiki_jack',
    name: 'Tiki Jack',
    kartName: 'Tropical Breaker',
    color: '#059669', // emerald green
    accentColor: '#34d399', // mint
    helmetColor: '#10b981',
    speed: 3,
    acceleration: 5,
    handling: 5,
    boostPower: 3,
    description: 'Mestre do drift com aceleração explosiva e controlo afiado.'
  },
  {
    id: 'roxy_surf',
    name: 'Roxy Surf',
    kartName: 'Sunset Glider',
    color: '#ec4899', // pink
    accentColor: '#38bdf8', // sky cyan
    helmetColor: '#f472b6',
    speed: 5,
    acceleration: 3,
    handling: 3,
    boostPower: 5,
    description: 'Velocidade de ponta incomparável para ultrapassagens nas rectas.'
  },
  {
    id: 'captain_salty',
    name: 'Capitão Salty',
    kartName: 'Lagoon Cruiser',
    color: '#1e3a8a', // deep navy
    accentColor: '#f59e0b', // gold
    helmetColor: '#3b82f6',
    speed: 4,
    acceleration: 3,
    handling: 4,
    boostPower: 5,
    description: 'Kart pesado e robusto que não perde estabilidade nos solavancos.'
  },
  {
    id: 'banana_bob',
    name: 'Banana Bob',
    kartName: 'Jungle Rocket',
    color: '#eab308', // bright yellow
    accentColor: '#f97316', // orange
    helmetColor: '#ca8a04',
    speed: 4,
    acceleration: 5,
    handling: 4,
    boostPower: 3,
    description: 'Ágil e divertido, recupera velocidade em fracções de segundo.'
  },
  {
    id: 'shadow_rex',
    name: 'Shadow Rex',
    kartName: 'Phantom Wave',
    color: '#7c3aed', // purple
    accentColor: '#06b6d4', // neon cyan
    helmetColor: '#6d28d9',
    speed: 5,
    acceleration: 4,
    handling: 3,
    boostPower: 4,
    description: 'Competidor feroz com aerodinâmica agressiva e boost feroz.'
  }
];
