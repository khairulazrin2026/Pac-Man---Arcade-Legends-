import React, { useRef } from 'react';
import {
  HelpCircle,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { Direction, GameDifficulty, GameState } from '../types/game';
import { VirtualControls } from './VirtualControls';

interface ArcadeCabinetProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  gameState: GameState;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  difficulty: GameDifficulty;
  setDifficulty: (diff: GameDifficulty) => void;
  crtEffect: boolean;
  setCrtEffect: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMuted: boolean;
  toggleMute: () => void;
  startNewGame: () => void;
  togglePause: () => void;
  setDirection: (dir: Direction) => void;
  onOpenHighScores: () => void;
  onOpenHowToPlay: () => void;
}

export const ArcadeCabinet: React.FC<ArcadeCabinetProps> = ({
  canvasRef,
  gameState,
  score,
  highScore,
  lives,
  level,
  difficulty,
  setDifficulty,
  crtEffect,
  setCrtEffect,
  isMuted,
  toggleMute,
  startNewGame,
  togglePause,
  setDirection,
  onOpenHighScores,
  onOpenHowToPlay,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas Touch / Swipe Steering Handler
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Minimum swipe threshold
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      setDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 md:py-6">
      {/* Arcade Outer Bezel Frame */}
      <div className="relative w-full max-w-[500px] bg-slate-950 border-4 border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl shadow-blue-900/20">
        
        {/* Marquee Header */}
        <div className="relative mb-3 sm:mb-4 rounded-xl overflow-hidden border-2 border-yellow-400/60 bg-black shadow-lg shadow-yellow-500/10">
          <img
            src="/src/assets/images/arcade_marquee_pacman_1791250823603.jpg"
            alt="Pac-Man Arcade Marquee"
            referrerPolicy="no-referrer"
            className="w-full h-16 sm:h-20 object-cover object-center filter brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
          <div className="absolute bottom-1 right-2 flex items-center gap-1.5 text-[9px] font-arcade text-amber-400/80">
            <span>MIDWAY 1980</span>
          </div>
        </div>

        {/* Status Bar / Top Metric Row */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-900/90 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px]">STAGE</span>
            <span className="text-amber-400 font-bold tabular-nums">{level}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px]">LIVES</span>
            <span className="text-yellow-300 font-bold tabular-nums">{'●'.repeat(Math.max(0, lives))}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[10px]">HI-SCORE</span>
            <span className="text-white font-bold tabular-nums">{highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Monitor Screen Frame */}
        <div className="relative w-full flex justify-center bg-black rounded-2xl border-4 border-slate-900 overflow-hidden shadow-inner">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={448}
            height={576}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-full max-w-[448px] aspect-[28/36] block bg-black"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* CRT Scanline & Glare Overlays */}
          {crtEffect && (
            <>
              <div className="absolute inset-0 crt-overlay pointer-events-none" />
              <div className="absolute inset-0 crt-vignette pointer-events-none" />
              <div className="absolute inset-0 crt-glare pointer-events-none" />
            </>
          )}

          {/* Overlay for Title Menu State */}
          {gameState === 'TITLE_MENU' && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-xs">
              <div className="mb-2">
                <span className="text-3xl sm:text-4xl font-arcade text-yellow-400 tracking-wider inline-block filter drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]">
                  PAC-MAN
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-mono tracking-widest uppercase mb-6">
                Arcade Legends Edition
              </p>

              {/* Ghost Lineup */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-t-full bg-red-500 shadow-md shadow-red-500/50" />
                  <span className="text-[9px] font-arcade text-red-400 mt-1.5">BLINKY</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-t-full bg-pink-400 shadow-md shadow-pink-400/50" />
                  <span className="text-[9px] font-arcade text-pink-400 mt-1.5">PINKY</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-t-full bg-cyan-400 shadow-md shadow-cyan-400/50" />
                  <span className="text-[9px] font-arcade text-cyan-400 mt-1.5">INKY</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-5 h-5 rounded-t-full bg-orange-400 shadow-md shadow-orange-400/50" />
                  <span className="text-[9px] font-arcade text-orange-400 mt-1.5">CLYDE</span>
                </div>
              </div>

              {/* Start Game CTA */}
              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-arcade text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-400/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Insert Coin & Start</span>
              </button>

              <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
                <button
                  type="button"
                  onClick={onOpenHowToPlay}
                  className="hover:text-amber-400 underline underline-offset-4 cursor-pointer"
                >
                  How to Play
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={onOpenHighScores}
                  className="hover:text-amber-400 underline underline-offset-4 cursor-pointer"
                >
                  Hall of Fame
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-white backdrop-blur-xs">
              <h3 className="text-xl sm:text-2xl font-arcade text-red-500 mb-2">GAME OVER</h3>
              <p className="text-xs font-mono text-slate-300 mb-1">
                Final Score: <span className="text-yellow-400 font-bold tabular-nums">{score.toLocaleString()}</span>
              </p>
              <p className="text-[11px] font-mono text-slate-400 mb-6">
                Reached Stage: <span className="text-white font-bold">{level}</span>
              </p>
              <button
                type="button"
                onClick={startNewGame}
                className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-arcade text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-400/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Arcade Control Toolbar */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Quick Play Controls */}
          <div className="flex items-center gap-1.5">
            {gameState === 'PLAYING' || gameState === 'PAUSED' ? (
              <button
                type="button"
                onClick={togglePause}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-colors"
                title={gameState === 'PAUSED' ? 'Resume (P)' : 'Pause (P)'}
              >
                {gameState === 'PAUSED' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            ) : null}

            <button
              type="button"
              onClick={startNewGame}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-yellow-400 border border-slate-700 transition-colors"
              title="Restart Round"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              type="button"
              onClick={() => setCrtEffect((prev) => !prev)}
              className={`p-2 rounded-lg border transition-colors ${
                crtEffect
                  ? 'bg-blue-950/80 border-blue-500/60 text-blue-400'
                  : 'bg-slate-900 border-slate-700 text-slate-500'
              }`}
              title="Toggle CRT Scanline Effect"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            {(['CASUAL', 'NORMAL', 'TURBO'] as GameDifficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded transition-colors ${
                  difficulty === d
                    ? 'bg-amber-400 text-black font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d === 'CASUAL' ? 'Slow' : d === 'NORMAL' ? 'Normal' : 'Turbo'}
              </button>
            ))}
          </div>

          {/* Modal Openers */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenHighScores}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 transition-colors"
              title="Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
              title="Guide & Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Virtual On-Screen Joystick / D-Pad for Mobile & Touch */}
        <div className="mt-3 block md:hidden">
          <VirtualControls onDirection={setDirection} />
        </div>
      </div>
    </div>
  );
};
