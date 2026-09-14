import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { GameSettings } from '../types';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onGoToMenu: () => void;
  settings: GameSettings;
  onToggleSound: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onGoToMenu,
  settings,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm bg-slate-900/95 border-2 border-cyan-400/40 rounded-3xl p-6 shadow-2xl text-white text-center">
        <h2 className="text-3xl font-black italic text-cyan-400 mb-1">JOGO EM PAUSA</h2>
        <p className="text-xs text-slate-400 mb-6">Pressiona ESC para continuar a correr</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 cursor-pointer transition shadow-lg shadow-cyan-500/30"
          >
            <Play className="w-5 h-5 fill-current" />
            Continuar Corrida
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 cursor-pointer transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar Corrida
          </button>

          <button
            onClick={onToggleSound}
            className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-white/10 cursor-pointer transition"
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            {settings.soundEnabled ? 'Silenciar Som' : 'Activar Som'}
          </button>

          <button
            onClick={onGoToMenu}
            className="w-full py-3 px-6 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-sm flex items-center justify-center gap-2 border border-red-500/30 cursor-pointer transition"
          >
            <Home className="w-4 h-4" />
            Sair para o Menu
          </button>
        </div>
      </div>
    </div>
  );
};
