import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Flame, Disc } from 'lucide-react';

interface TouchControlsProps {
  onInputState: (key: string, pressed: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputState }) => {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});

  const setKey = (code: string, pressed: boolean) => {
    setActiveKeys(prev => {
      if (prev[code] === pressed) return prev;
      return { ...prev, [code]: pressed };
    });
    onInputState(code, pressed);
  };

  const createTouchHandler = (code: string) => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        setKey(code, true);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        setKey(code, false);
      },
      onTouchCancel: (e: React.TouchEvent) => {
        e.preventDefault();
        setKey(code, false);
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.preventDefault();
        setKey(code, true);
      },
      onMouseUp: (e: React.MouseEvent) => {
        e.preventDefault();
        setKey(code, false);
      },
      onMouseLeave: (e: React.MouseEvent) => {
        e.preventDefault();
        setKey(code, false);
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
      },
    };
  };

  return (
    <div
      id="touch-controls-overlay"
      className="fixed inset-x-0 bottom-0 pointer-events-none select-none z-30 p-3 sm:p-5 pb-5 sm:pb-6 flex justify-between items-end"
      style={{ touchAction: 'none' }}
    >
      {/* =========================================================================
          ESQUERDA: Botões de virar à Esquerda (←) e Direita (→) lado a lado
          ========================================================================= */}
      <div id="touch-controls-left" className="flex flex-row items-center gap-2.5 sm:gap-4 pointer-events-auto">
        {/* Botão Virar à Esquerda (←) */}
        <button
          id="btn-touch-steer-left"
          type="button"
          {...createTouchHandler('KeyA')}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
            activeKeys['KeyA']
              ? 'bg-cyan-500 border-white text-slate-950 shadow-cyan-500/50 scale-95'
              : 'bg-slate-950/85 border-cyan-400/60 text-cyan-300 hover:border-cyan-300'
          }`}
          aria-label="Virar à Esquerda"
        >
          <ArrowLeft className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">ESQ</span>
        </button>

        {/* Botão Virar à Direita (→) */}
        <button
          id="btn-touch-steer-right"
          type="button"
          {...createTouchHandler('KeyD')}
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
            activeKeys['KeyD']
              ? 'bg-cyan-500 border-white text-slate-950 shadow-cyan-500/50 scale-95'
              : 'bg-slate-950/85 border-cyan-400/60 text-cyan-300 hover:border-cyan-300'
          }`}
          aria-label="Virar à Direita"
        >
          <ArrowRight className="w-9 h-9 sm:w-10 sm:h-10 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-wider uppercase mt-0.5">DIR</span>
        </button>
      </div>

      {/* =========================================================================
          DIREITA: Acelerar (↑) por cima de Travar (↓) perfeitamente alinhados na vertical
          com botões auxiliares de Drift e Turbo
          ========================================================================= */}
      <div id="touch-controls-right" className="flex flex-row items-end gap-2.5 sm:gap-4 pointer-events-auto">
        {/* Coluna Auxiliar: Boost / Turbo e Drift */}
        <div className="flex flex-col gap-2 sm:gap-2.5 items-center">
          {/* Botão Turbo / Boost */}
          <button
            id="btn-touch-boost"
            type="button"
            {...createTouchHandler('ShiftLeft')}
            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
              activeKeys['ShiftLeft']
                ? 'bg-orange-500 border-white text-slate-950 shadow-orange-500/50 scale-95'
                : 'bg-slate-950/85 border-orange-500/60 text-orange-400 hover:border-orange-400'
            }`}
            aria-label="Turbo Boost"
          >
            <Flame className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase">TURBO</span>
          </button>

          {/* Botão Drift / Derrapagem */}
          <button
            id="btn-touch-drift"
            type="button"
            {...createTouchHandler('Space')}
            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
              activeKeys['Space']
                ? 'bg-amber-400 border-white text-slate-950 shadow-amber-400/50 scale-95'
                : 'bg-slate-950/85 border-amber-400/60 text-amber-300 hover:border-amber-300'
            }`}
            aria-label="Derrapagem Drift"
          >
            <Disc className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase">DRIFT</span>
          </button>
        </div>

        {/* Coluna Principal de Condução: ACELERAR por CIMA de TRAVAR perfeitamente alinhados na vertical */}
        <div className="flex flex-col gap-2.5 sm:gap-3 items-center">
          {/* Botão de Acelerar (↑ / Frente) - CIMA */}
          <button
            id="btn-touch-accelerate"
            type="button"
            {...createTouchHandler('KeyW')}
            className={`w-20 h-22 sm:w-24 sm:h-24 rounded-2xl border-3 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
              activeKeys['KeyW']
                ? 'bg-emerald-400 border-white text-slate-950 shadow-emerald-400/60 scale-95'
                : 'bg-emerald-600/95 border-emerald-300 text-white hover:bg-emerald-500'
            }`}
            aria-label="Acelerar / Frente"
          >
            <ArrowUp className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5">ACELERAR</span>
          </button>

          {/* Botão de Travar / Marcha-atrás (↓ / Trás) - BAIXO */}
          <button
            id="btn-touch-brake"
            type="button"
            {...createTouchHandler('KeyS')}
            className={`w-20 h-16 sm:w-24 sm:h-18 rounded-2xl border-3 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-75 active:scale-95 ${
              activeKeys['KeyS']
                ? 'bg-rose-400 border-white text-slate-950 shadow-rose-400/60 scale-95'
                : 'bg-rose-700/90 border-rose-400 text-white hover:bg-rose-600'
            }`}
            aria-label="Travar / Marcha-atrás"
          >
            <ArrowDown className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider mt-0.5">TRAVÃO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
