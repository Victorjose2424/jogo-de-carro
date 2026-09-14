import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Flame, Disc } from 'lucide-react';

interface TouchControlsProps {
  onInputState: (key: string, pressed: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputState }) => {
  const handleTouch = (key: string, isDown: boolean) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputState(key, isDown);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-20 flex justify-between p-4 pb-6 sm:hidden">
      {/* Left Steer Buttons */}
      <div className="flex gap-2 pointer-events-auto items-end">
        <button
          onTouchStart={handleTouch('KeyA', true)}
          onTouchEnd={handleTouch('KeyA', false)}
          onMouseDown={handleTouch('KeyA', true)}
          onMouseUp={handleTouch('KeyA', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500 border-2 border-cyan-400/50 text-white active:text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>
        <button
          onTouchStart={handleTouch('KeyD', true)}
          onTouchEnd={handleTouch('KeyD', false)}
          onMouseDown={handleTouch('KeyD', true)}
          onMouseUp={handleTouch('KeyD', false)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-500 border-2 border-cyan-400/50 text-white active:text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex gap-2 pointer-events-auto items-end">
        <div className="flex flex-col gap-2">
          {/* Drift */}
          <button
            onTouchStart={handleTouch('Space', true)}
            onTouchEnd={handleTouch('Space', false)}
            onMouseDown={handleTouch('Space', true)}
            onMouseUp={handleTouch('Space', false)}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-amber-400 border-2 border-amber-400/50 text-white active:text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md text-xs font-black"
          >
            <Disc className="w-6 h-6" />
          </button>
          {/* Reverse / Brake */}
          <button
            onTouchStart={handleTouch('KeyS', true)}
            onTouchEnd={handleTouch('KeyS', false)}
            onMouseDown={handleTouch('KeyS', true)}
            onMouseUp={handleTouch('KeyS', false)}
            className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-red-500 border-2 border-red-500/50 text-white active:text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {/* Boost */}
          <button
            onTouchStart={handleTouch('ShiftLeft', true)}
            onTouchEnd={handleTouch('ShiftLeft', false)}
            onMouseDown={handleTouch('ShiftLeft', true)}
            onMouseUp={handleTouch('ShiftLeft', false)}
            className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-orange-500 border-2 border-orange-400/50 text-amber-400 active:text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md"
          >
            <Flame className="w-8 h-8" />
          </button>
          {/* Gas */}
          <button
            onTouchStart={handleTouch('KeyW', true)}
            onTouchEnd={handleTouch('KeyW', false)}
            onMouseDown={handleTouch('KeyW', true)}
            onMouseUp={handleTouch('KeyW', false)}
            className="w-16 h-16 rounded-2xl bg-emerald-500 active:bg-emerald-400 border-2 border-emerald-300 text-slate-950 flex items-center justify-center shadow-2xl backdrop-blur-md"
          >
            <ArrowUp className="w-8 h-8 font-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
