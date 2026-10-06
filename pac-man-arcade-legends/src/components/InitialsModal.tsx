import React, { useState } from 'react';
import { Award } from 'lucide-react';

interface InitialsModalProps {
  isOpen: boolean;
  score: number;
  level: number;
  onSubmit: (initials: string) => void;
}

export const InitialsModal: React.FC<InitialsModalProps> = ({ isOpen, score, level, onSubmit }) => {
  const [initials, setInitials] = useState<string>('PAC');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(initials.slice(0, 3).toUpperCase() || 'AAA');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="initials-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-sm bg-slate-950 border-2 border-amber-400 rounded-xl p-6 shadow-2xl shadow-amber-500/20 text-center text-white">
        <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-3 text-amber-400">
          <Award className="w-6 h-6 stroke-[2]" />
        </div>

        <h2 id="initials-title" className="font-arcade text-sm uppercase tracking-wider text-amber-400 mb-1">
          High Score!
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-4">
          You scored <span className="text-white font-bold">{score.toLocaleString()}</span> on Stage {level}!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="player-initials" className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-2">
              Enter Your Initials (3 Letters)
            </label>
            <input
              id="player-initials"
              type="text"
              maxLength={3}
              autoFocus
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              className="w-36 text-center text-2xl font-arcade tracking-[0.5em] py-2 bg-slate-900 border-2 border-amber-400 rounded-lg text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 uppercase"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-arcade text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-all active:scale-95 uppercase"
            >
              Submit Score
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
