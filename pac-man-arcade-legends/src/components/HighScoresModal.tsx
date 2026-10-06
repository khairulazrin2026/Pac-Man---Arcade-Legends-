import React from 'react';
import { Trophy, X } from 'lucide-react';
import { HighScoreEntry } from '../types/game';

interface HighScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: HighScoreEntry[];
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ isOpen, onClose, scores }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="highscores-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-950 border border-amber-400/40 rounded-xl p-6 shadow-2xl shadow-amber-500/10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy className="w-5 h-5 stroke-[2]" />
            <h2 id="highscores-title" className="font-arcade text-sm uppercase tracking-wider text-amber-400">
              Hall of Fame
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close high scores modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scores Table */}
        <div className="py-4">
          <div className="grid grid-cols-12 text-xs font-mono uppercase text-slate-400 pb-2 border-b border-slate-800/80">
            <span className="col-span-2">Rank</span>
            <span className="col-span-3">Player</span>
            <span className="col-span-4 text-right">Score</span>
            <span className="col-span-3 text-right">Stage</span>
          </div>

          <div className="divide-y divide-slate-900/60 mt-2 max-h-72 overflow-y-auto pr-1">
            {scores.map((entry, index) => {
              const rankColor =
                index === 0
                  ? 'text-amber-400 font-bold'
                  : index === 1
                  ? 'text-slate-200 font-semibold'
                  : index === 2
                  ? 'text-amber-600 font-semibold'
                  : 'text-slate-400';

              return (
                <div
                  key={`${entry.initials}_${entry.score}_${index}`}
                  className="grid grid-cols-12 items-center py-2.5 text-xs font-arcade"
                >
                  <span className={`col-span-2 font-mono text-sm ${rankColor}`}>
                    #{index + 1}
                  </span>
                  <span className="col-span-3 text-amber-300 tracking-widest font-bold">
                    {entry.initials}
                  </span>
                  <span className="col-span-4 text-right font-mono tabular-nums text-white">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="col-span-3 text-right text-slate-400 font-mono">
                    LV {entry.level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap active:scale-95"
          >
            Back to Arcade
          </button>
        </div>
      </div>
    </div>
  );
};
