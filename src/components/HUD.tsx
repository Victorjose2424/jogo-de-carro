import React from 'react';
import { RacerState, GameSettings, RaceMode, TrackDataBundle } from '../types';
import { WAYPOINTS_COUNT } from '../game/trackData';
import { Zap, Shield, Flame, Gauge, Volume2, VolumeX, Pause, Timer, Skull, Trophy } from 'lucide-react';

interface HUDProps {
  player: RacerState;
  racers: RacerState[];
  totalLaps: number;
  countdown: number | null;
  mode: RaceMode;
  trackBundle: TrackDataBundle;
  eliminationTimer?: number;
  lastEliminatedName?: string | null;
  bestLapTime?: number | null;
  settings: GameSettings;
  onUseItem: (slotIndex: number) => void;
  onToggleSound: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  racers,
  totalLaps,
  countdown,
  mode,
  trackBundle,
  eliminationTimer,
  lastEliminatedName,
  bestLapTime,
  settings,
  onUseItem,
  onToggleSound,
  onPause,
}) => {
  const speedDisplay = Math.round(Math.abs(player.speed));
  const isBoosting = player.boostFuel < 95 && player.speed > 105;
  const isSpinning = player.spinOutTimeRemaining > 0;

  // Active (non-eliminated) racers count
  const activeRacers = racers.filter(r => !r.isEliminated);

  // Circular Speedometer SVG math
  const maxSpeedGauge = 180;
  const speedFrac = Math.min(speedDisplay / maxSpeedGauge, 1.0);
  const radius = 48;
  const circumference = 2 * Math.PI * radius * 0.75;
  const strokeDashoffset = circumference * (1 - speedFrac);

  // Current lap timer calculation
  const now = performance.now();
  const currentLapSecs = player.currentLapStartTime ? (now - player.currentLapStartTime) / 1000 : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Position ranking badge color
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-amber-400 to-yellow-500 text-yellow-950 border-amber-300';
      case 2: return 'from-slate-200 to-slate-400 text-slate-900 border-slate-300';
      case 3: return 'from-amber-600 to-amber-700 text-amber-100 border-amber-500';
      default: return 'from-cyan-600 to-blue-700 text-white border-cyan-400';
    }
  };

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans z-20">
      {/* Speed Lines effect when boosting */}
      {player.boostTimeRemaining > 0 && (
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(56,189,248,0.3)_100%)] animate-pulse" />
      )}

      {/* Red vignette flash on spin out */}
      {isSpinning && (
        <div className="absolute inset-0 pointer-events-none bg-red-600/30 animate-ping" />
      )}

      {/* --- TOP-LEFT: RACER POSITION / TIME TRIAL BADGE --- */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {mode !== 'TIME_TRIAL' ? (
            <div
              id="hud-position-badge"
              className={`flex items-baseline px-4 py-2 rounded-2xl bg-gradient-to-br ${getRankColor(
                player.rank
              )} border-2 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-300 transform scale-105`}
            >
              <span className="text-4xl sm:text-5xl font-black italic tracking-tighter drop-shadow">
                {player.rank}
              </span>
              <span className="text-xl sm:text-2xl font-bold opacity-80 ml-0.5">
                /{activeRacers.length}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black italic text-lg sm:text-xl border-2 border-amber-300 shadow-xl">
              <Timer className="w-5 h-5" />
              <span>TIME TRIAL</span>
            </div>
          )}

          {/* Player & Kart Badge */}
          <div className="hidden sm:flex flex-col bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                {player.character.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-bold">
                {player.kartType?.name || 'Cruiser'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300">{trackBundle.trackDef.name}</span>
          </div>
        </div>

        {/* Time Trial Timers */}
        {mode === 'TIME_TRIAL' && (
          <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-white/15 text-white shadow-lg flex flex-col gap-1 w-fit">
            <div className="flex items-center justify-between gap-4 text-xs font-bold">
              <span className="text-slate-400">Tempo Volta:</span>
              <span className="text-amber-400 font-mono text-sm">{formatTime(currentLapSecs)}</span>
            </div>
            {bestLapTime !== null && bestLapTime !== undefined && (
              <div className="flex items-center justify-between gap-4 text-xs font-bold border-t border-white/10 pt-1">
                <span className="text-slate-400">Melhor Volta:</span>
                <span className="text-emerald-400 font-mono text-sm">{formatTime(bestLapTime)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- TOP-CENTER: COUNTDOWN & ELIMINATOR TIMER --- */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="text-center animate-bounce">
            <span
              className={`text-8xl sm:text-9xl font-black italic tracking-wider drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] ${
                countdown === 0 ? 'text-emerald-400 scale-125' : 'text-amber-400'
              }`}
            >
              {countdown === 0 ? 'GO!' : countdown}
            </span>
            {countdown === 0 && (
              <p className="text-2xl font-black uppercase text-white tracking-widest mt-2 drop-shadow-md">
                ACELERA!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Eliminator Mode Banner */}
      {mode === 'ELIMINATOR' && eliminationTimer !== undefined && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div
            className={`flex items-center gap-2 px-5 py-2 rounded-2xl backdrop-blur-md border-2 shadow-xl ${
              eliminationTimer <= 5
                ? 'bg-red-600/90 border-red-400 text-white animate-pulse'
                : 'bg-slate-900/90 border-amber-400 text-amber-300'
            }`}
          >
            <Skull className="w-5 h-5 text-red-400" />
            <span className="text-xs font-black uppercase tracking-wider">ELIMINAÇÃO EM:</span>
            <span className="text-2xl font-black font-mono tracking-tight ml-1">
              {Math.ceil(eliminationTimer)}s
            </span>
          </div>

          {lastEliminatedName && (
            <div className="mt-1.5 px-3 py-0.5 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-[11px] font-bold animate-bounce">
              ☠️ {lastEliminatedName} foi eliminado!
            </div>
          )}
        </div>
      )}

      {/* --- TOP-RIGHT: LAP COUNTER & SETTINGS BUTTONS --- */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
        {/* Sound toggle */}
        <button
          id="hud-sound-toggle"
          onClick={onToggleSound}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-white/15 text-white/90 hover:text-cyan-400 hover:bg-slate-800 transition shadow-lg cursor-pointer"
          title="Alternar Som"
        >
          {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
        </button>

        {/* Pause Button */}
        <button
          id="hud-pause-btn"
          onClick={onPause}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-white/15 text-white/90 hover:text-cyan-400 hover:bg-slate-800 transition shadow-lg cursor-pointer"
          title="Pausa (ESC)"
        >
          <Pause className="w-5 h-5" />
        </button>

        {/* Lap Badge */}
        <div
          id="hud-lap-badge"
          className="flex items-center px-4 py-2.5 rounded-2xl bg-slate-900/90 border-2 border-cyan-400/80 text-white shadow-xl shadow-black/40 backdrop-blur-md"
        >
          <span className="text-xs sm:text-sm font-bold text-cyan-400 uppercase tracking-widest mr-2">
            Volta
          </span>
          <span className="text-2xl sm:text-3xl font-black italic tracking-tight text-white">
            {Math.min(player.currentLap, totalLaps)}
          </span>
          <span className="text-lg sm:text-xl font-bold text-white/60 ml-0.5">
            /{totalLaps}
          </span>
        </div>
      </div>

      {/* --- MINIMAP RADAR (TOP RIGHT UNDER LAP BADGE) --- */}
      {settings.showMinimap && (
        <div
          id="hud-minimap"
          className="absolute top-20 right-4 w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-950/75 border border-white/20 backdrop-blur-md shadow-2xl p-2 hidden sm:block overflow-hidden"
        >
          <div className="relative w-full h-full">
            {/* Dynamic Track Circuit SVG */}
            <svg viewBox="-260 -90 440 420" className="w-full h-full opacity-60">
              <path
                d={
                  trackBundle.trackDef.theme === 'volcano'
                    ? "M 0 0 C 70 50, 110 150, 80 220 C 30 260, -70 250, -120 200 C -170 140, -160 40, -120 -30 C -80 -60, -20 -30, 0 0 Z"
                    : trackBundle.trackDef.theme === 'snow'
                    ? "M 0 0 C 60 40, 150 100, 140 200 C 120 270, 20 290, -60 270 C -140 240, -190 150, -180 80 C -150 10, -80 -40, 0 0 Z"
                    : "M 0 0 C 80 30, 160 120, 130 180 C 100 230, 20 270, -60 290 C -140 270, -210 210, -220 140 C -220 70, -180 10, -130 -40 C -70 -60, -20 -30, 0 0 Z"
                }
                fill="none"
                stroke={trackBundle.trackDef.theme === 'volcano' ? '#f97316' : trackBundle.trackDef.theme === 'snow' ? '#38bdf8' : '#38bdf8'}
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Racers dots */}
            {racers.map(r => {
              if (r.isEliminated) return null;
              const leftPercent = ((r.x + 250) / 440) * 100;
              const topPercent = ((r.z + 80) / 400) * 100;
              const isP = r.isPlayer;

              return (
                <div
                  key={r.id}
                  className={`absolute rounded-full transition-all duration-100 ${
                    isP
                      ? 'w-3.5 h-3.5 bg-yellow-400 border-2 border-white ring-2 ring-yellow-400/50 shadow-md z-10'
                      : 'w-2 h-2 bg-red-400 border border-white/80'
                  }`}
                  style={{
                    left: `${Math.max(4, Math.min(96, leftPercent))}%`,
                    top: `${Math.max(4, Math.min(96, topPercent))}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={r.name}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* --- RIGHT EDGE: BOOST ENERGY BAR --- */}
      <div className="absolute right-4 bottom-32 sm:bottom-40 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1 text-amber-400 font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow">
          <Flame className="w-4 h-4 fill-amber-400 animate-pulse text-amber-400" />
          <span>BOOST</span>
        </div>

        {/* Vertical Boost Bar */}
        <div
          id="hud-boost-bar-container"
          className="relative w-7 sm:w-8 h-36 sm:h-44 bg-slate-950/80 rounded-2xl border-2 border-amber-400/60 p-1 backdrop-blur-md shadow-2xl flex flex-col justify-end overflow-hidden"
        >
          <div
            id="hud-boost-fill"
            className={`w-full rounded-xl transition-all duration-100 bg-gradient-to-t ${
              player.boostFuel > 30
                ? 'from-amber-600 via-yellow-400 to-orange-400'
                : 'from-red-600 to-red-400 animate-pulse'
            }`}
            style={{ height: `${player.boostFuel}%` }}
          />

          <div className="absolute inset-x-0 top-1/4 h-0.5 bg-white/20" />
          <div className="absolute inset-x-0 top-2/4 h-0.5 bg-white/20" />
          <div className="absolute inset-x-0 top-3/4 h-0.5 bg-white/20" />
        </div>

        <span className="text-[10px] font-bold text-white/70 bg-black/60 px-1.5 py-0.5 rounded uppercase">
          Shift
        </span>
      </div>

      {/* --- BOTTOM-LEFT: ITEM SLOTS (Q, E, R) --- */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <ItemSlotCard
            slotKey="Q"
            label="Item 1"
            item={player.items[0]}
            onClick={() => onUseItem(0)}
          />
          <ItemSlotCard
            slotKey="E"
            label="Item 2"
            item={player.items[1]}
            onClick={() => onUseItem(1)}
          />
          <ItemSlotCard
            slotKey="R"
            label="Item 3"
            item={player.items[2]}
            onClick={() => onUseItem(2)}
          />
        </div>

        {player.shieldTimeRemaining > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/80 backdrop-blur-md border border-cyan-300 text-white shadow-lg text-xs font-bold animate-pulse w-fit">
            <Shield className="w-4 h-4 text-white" />
            <span>ESCUDO ATIVO: {player.shieldTimeRemaining.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* --- BOTTOM-RIGHT: CIRCULAR SPEEDOMETER --- */}
      <div className="absolute bottom-4 right-4 flex items-center pointer-events-auto">
        <div
          id="hud-speedometer"
          className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-950/85 border-2 border-cyan-400/40 shadow-2xl backdrop-blur-md flex items-center justify-center"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={0}
              strokeLinecap="round"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke={speedDisplay > 130 ? '#f59e0b' : '#38bdf8'}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>

          <div className="flex flex-col items-center justify-center z-10 text-center">
            <span
              className={`text-3xl sm:text-4xl font-black italic tracking-tighter leading-none ${
                speedDisplay > 130 ? 'text-amber-400 animate-pulse' : 'text-white'
              }`}
            >
              {speedDisplay}
            </span>
            <span className="text-xs sm:text-sm font-bold text-cyan-400 tracking-wider uppercase mt-0.5">
              km/h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Item slot component
interface ItemSlotProps {
  slotKey: string;
  label: string;
  item: any;
  onClick: () => void;
}

const ItemSlotCard: React.FC<ItemSlotProps> = ({ slotKey, label, item, onClick }) => {
  return (
    <button
      id={`hud-item-slot-${slotKey.toLowerCase()}`}
      onClick={onClick}
      disabled={!item}
      className={`relative group w-16 sm:w-20 h-16 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center p-1.5 transition-all duration-200 shadow-xl backdrop-blur-md cursor-pointer ${
        item
          ? 'bg-slate-900/90 border-amber-400 text-white hover:scale-105 hover:border-yellow-300 active:scale-95'
          : 'bg-slate-950/60 border-white/15 text-white/30 cursor-default'
      }`}
    >
      <span className="absolute -top-2 left-2 px-1.5 py-0.2 rounded bg-cyan-500 text-[10px] font-black text-slate-950 uppercase shadow">
        {slotKey}
      </span>

      {item ? (
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-2xl sm:text-3xl">{item.icon}</span>
          <span className="text-[10px] font-bold text-amber-300 truncate max-w-[64px] mt-0.5">
            {item.name}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-white/40">{label}</span>
          <span className="text-[10px] text-white/20 mt-1">Vazio</span>
        </div>
      )}
    </button>
  );
};
