import React from 'react';
import { BookOpen, Gamepad2, Sparkles, X } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-blue-500/40 rounded-xl p-6 shadow-2xl shadow-blue-500/10 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-yellow-400">
            <BookOpen className="w-5 h-5 stroke-[2]" />
            <h2 id="how-to-play-title" className="font-arcade text-xs uppercase tracking-wider text-yellow-400">
              Arcade Guide & Rules
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-6 text-sm text-slate-300">
          {/* Mission */}
          <div>
            <h3 className="text-xs font-arcade text-amber-400 mb-1">Mission Objective</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Navigate the maze eating all dots and power pellets while avoiding the four ghosts.
              Clear every pellet in the maze to advance to the next level. Extra life awarded at 10,000 points!
            </p>
          </div>

          {/* Ghost Personalities */}
          <div>
            <h3 className="text-xs font-arcade text-blue-400 mb-2.5">Ghost Personalities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-red-500/30 flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-arcade text-[10px] text-red-400">Blinky (Shadow)</div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    Direct pursuer. Targets Pac-Man constantly and speeds up when pellets run low.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-pink-500/30 flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-pink-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-arcade text-[10px] text-pink-400">Pinky (Speedy)</div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    Ambush predictor. Aims 4 tiles ahead of your current direction to cut you off.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-cyan-500/30 flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-arcade text-[10px] text-cyan-400">Inky (Bashful)</div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    Flanker. Combines Pac-Man’s heading with Blinky’s coordinates for surprise traps.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-orange-500/30 flex items-start gap-3">
                <div className="w-4 h-4 rounded-full bg-orange-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-arcade text-[10px] text-orange-400">Clyde (Pokey)</div>
                  <p className="text-[11px] text-slate-400 leading-snug mt-1">
                    Shy wanderer. Attacks from afar, but retreats to his corner if you get within 8 tiles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scoring Table */}
          <div>
            <h3 className="text-xs font-arcade text-amber-400 mb-2">Arcade Scoring</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Dot</div>
                <div className="text-amber-300 font-bold tabular-nums">10 PTS</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Energizer</div>
                <div className="text-amber-300 font-bold tabular-nums">50 PTS</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Ghost Combo</div>
                <div className="text-cyan-400 font-bold tabular-nums">200-1600</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Fruit Bonus</div>
                <div className="text-pink-400 font-bold tabular-nums">100-5000</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div>
            <h3 className="text-xs font-arcade text-emerald-400 mb-2 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4" /> Controls & Shortcuts
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
              <li className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span>Steer Pac-Man</span>
                <span className="text-amber-400">Arrow Keys / WASD / D-Pad</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span>Pause / Resume</span>
                <span className="text-amber-400">P Key</span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-800/60 pb-1">
                <span>Toggle Sound</span>
                <span className="text-amber-400">M Key</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Mobile Play</span>
                <span className="text-amber-400">Swipe or On-Screen D-Pad</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-black bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors whitespace-nowrap active:scale-95"
          >
            Got It, Let's Play
          </button>
        </div>
      </div>
    </div>
  );
};
