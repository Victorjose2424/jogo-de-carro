import React, { useEffect } from 'react';
import { RacerState, RaceMode, TrackDef } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, Flag, Timer, Skull } from 'lucide-react';

interface RaceResultsProps {
  racers: RacerState[];
  trackDef: TrackDef;
  mode: RaceMode;
  onRestartRace: () => void;
  onGoToMenu: () => void;
}

export const RaceResults: React.FC<RaceResultsProps> = ({
  racers,
  trackDef,
  mode,
  onRestartRace,
  onGoToMenu,
}) => {
  const sortedRacers = [...racers].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;
    return a.rank - b.rank;
  });

  const player = racers.find(r => r.isPlayer);
  const playerWon = player?.rank === 1 && !player?.isEliminated;
  const playerPodium = player && player.rank <= 3 && !player?.isEliminated;

  useEffect(() => {
    if (playerPodium || playerWon) {
      try {
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#38bdf8', '#ef4444', '#10b981', '#ffffff'],
        });
      } catch (e) {}
    }
  }, [playerPodium, playerWon]);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-center">
        
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mb-3">
          {mode === 'TIME_TRIAL' ? (
            <Timer className="w-8 h-8 text-amber-400" />
          ) : mode === 'ELIMINATOR' ? (
            <Skull className="w-8 h-8 text-amber-400" />
          ) : (
            <Trophy className="w-8 h-8 text-amber-400" />
          )}
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block">
          {trackDef.name} • {mode === 'NORMAL' ? 'Grande Prémio' : mode === 'TIME_TRIAL' ? 'Contra-Relógio' : 'Eliminatória'}
        </span>

        <h2 className="text-3xl sm:text-5xl font-black italic tracking-tight text-white mt-1 mb-2">
          {playerWon
            ? '🏆 VITÓRIA RETUMBANTE!'
            : player?.isEliminated
            ? '☠️ FOSTE ELIMINADO!'
            : playerPodium
            ? '🥈 NO PÓDIO!'
            : 'CORRIDA CONCLUÍDA!'}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-5">
          {mode === 'TIME_TRIAL'
            ? 'Sessão de Contra-Relógio concluída com sucesso!'
            : mode === 'ELIMINATOR' && playerWon
            ? 'Sobreviveste a todas as eliminações e venceste como último piloto na pista!'
            : `Terminaste na posição ${player?.rank}º lugar de ${racers.length} participantes.`}
        </p>

        {/* Final Standings List */}
        <div className="flex flex-col gap-2 mb-6 max-h-72 overflow-y-auto pr-1">
          {sortedRacers.map(r => {
            const isP = r.isPlayer;
            return (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${
                  isP
                    ? 'bg-amber-500/20 border-amber-400 shadow-md scale-101'
                    : 'bg-slate-950/50 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      r.isEliminated
                        ? 'bg-red-950 text-red-400'
                        : r.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : r.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : r.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {r.isEliminated ? '☠️' : `${r.rank}º`}
                  </span>

                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: r.character.color }}
                  />

                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      {r.name}
                      {isP && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-[10px] font-black text-slate-950">
                          TU
                        </span>
                      )}
                      {r.isEliminated && (
                        <span className="text-[10px] text-red-400 font-bold uppercase">
                          (Eliminado)
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {r.character.kartName} • {r.kartType?.name || 'Cruiser'}
                    </span>
                  </div>
                </div>

                {/* Best Lap Time */}
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {r.lapTimes.length > 0
                      ? `${Math.min(...r.lapTimes).toFixed(2)}s`
                      : '--'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Melhor Volta</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRestartRace}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
          >
            <RotateCcw className="w-5 h-5" />
            Correr Novamente
          </button>
          <button
            onClick={onGoToMenu}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-base flex items-center justify-center gap-2 border border-white/10 cursor-pointer transition"
          >
            <Home className="w-5 h-5" />
            Menu Principal
          </button>
        </div>
      </div>
    </div>
  );
};
