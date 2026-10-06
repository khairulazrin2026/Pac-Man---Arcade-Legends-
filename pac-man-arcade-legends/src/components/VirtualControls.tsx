import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { Direction } from '../types/game';

interface VirtualControlsProps {
  onDirection: (dir: Direction) => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ onDirection }) => {
  return (
    <div className="flex flex-col items-center justify-center select-none pt-2 pb-1">
      <div className="grid grid-cols-3 gap-2 w-48 sm:w-56">
        {/* Top Row */}
        <div />
        <button
          type="button"
          aria-label="Move Up"
          onClick={() => onDirection('UP')}
          className="h-14 sm:h-16 flex items-center justify-center bg-slate-900 border-2 border-amber-400/80 rounded-xl text-amber-400 active:bg-amber-400 active:text-black shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
        >
          <ArrowUp className="w-8 h-8 stroke-[2.5]" />
        </button>
        <div />

        {/* Middle Row */}
        <button
          type="button"
          aria-label="Move Left"
          onClick={() => onDirection('LEFT')}
          className="h-14 sm:h-16 flex items-center justify-center bg-slate-900 border-2 border-amber-400/80 rounded-xl text-amber-400 active:bg-amber-400 active:text-black shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-8 h-8 stroke-[2.5]" />
        </button>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-amber-400/60" />
          </div>
        </div>
        <button
          type="button"
          aria-label="Move Right"
          onClick={() => onDirection('RIGHT')}
          className="h-14 sm:h-16 flex items-center justify-center bg-slate-900 border-2 border-amber-400/80 rounded-xl text-amber-400 active:bg-amber-400 active:text-black shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
        >
          <ArrowRight className="w-8 h-8 stroke-[2.5]" />
        </button>

        {/* Bottom Row */}
        <div />
        <button
          type="button"
          aria-label="Move Down"
          onClick={() => onDirection('DOWN')}
          className="h-14 sm:h-16 flex items-center justify-center bg-slate-900 border-2 border-amber-400/80 rounded-xl text-amber-400 active:bg-amber-400 active:text-black shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
        >
          <ArrowDown className="w-8 h-8 stroke-[2.5]" />
        </button>
        <div />
      </div>
      <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-wide uppercase">
        Tap or swipe on canvas to steer
      </p>
    </div>
  );
};
