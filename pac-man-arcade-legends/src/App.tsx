/**
 * Pac-Man Arcade Legends
 * Authentic classic 1980 arcade Pac-Man game with synthesized audio,
 * intelligent ghost AI, CRT cabinet experience, and local leaderboards.
 */

import React, { useState } from 'react';
import { Code2, HelpCircle, Trophy, Volume2, VolumeX } from 'lucide-react';
import { ArcadeCabinet } from './components/ArcadeCabinet';
import { HighScoresModal } from './components/HighScoresModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { InitialsModal } from './components/InitialsModal';
import { SourceCodeModal } from './components/SourceCodeModal';
import { usePacmanGame } from './game/usePacmanGame';

export default function App() {
  const [showSourceCodeModal, setShowSourceCodeModal] = useState<boolean>(false);
  const {
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
    leaderboard,
    showHighScoresModal,
    setShowHighScoresModal,
    showHowToPlayModal,
    setShowHowToPlayModal,
    showInitialsModal,
    setShowInitialsModal,
    submitHighScore,
  } = usePacmanGame();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Top Bar Contract: 3 zones */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="font-arcade text-sm sm:text-base text-yellow-400 hover:text-yellow-300 transition-colors tracking-wider">
          PAC-MAN
        </a>

        {/* Zone 2: Clean navigation / modal triggers */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-mono text-slate-400">
          <button
            type="button"
            onClick={() => setShowHowToPlayModal(true)}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How to Play</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHighScoresModal(true)}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSourceCodeModal(true)}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-amber-400/90"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Source Code</span>
          </button>
        </nav>

        {/* Zone 3: Primary Audio Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>
      </header>

      {/* Main Arcade Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        <ArcadeCabinet
          canvasRef={canvasRef}
          gameState={gameState}
          score={score}
          highScore={highScore}
          lives={lives}
          level={level}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          crtEffect={crtEffect}
          setCrtEffect={setCrtEffect}
          isMuted={isMuted}
          toggleMute={toggleMute}
          startNewGame={startNewGame}
          togglePause={togglePause}
          setDirection={setDirection}
          onOpenHighScores={() => setShowHighScoresModal(true)}
          onOpenHowToPlay={() => setShowHowToPlayModal(true)}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="py-3 px-4 border-t border-slate-900 bg-slate-950 text-center text-xs font-mono text-slate-600">
        <p>Classic 1980 arcade tribute with real-time Web Audio synthesis.</p>
      </footer>

      {/* Modals */}
      <HighScoresModal
        isOpen={showHighScoresModal}
        onClose={() => setShowHighScoresModal(false)}
        scores={leaderboard}
      />

      <HowToPlayModal
        isOpen={showHowToPlayModal}
        onClose={() => setShowHowToPlayModal(false)}
      />

      <InitialsModal
        isOpen={showInitialsModal}
        score={score}
        level={level}
        onSubmit={submitHighScore}
      />

      <SourceCodeModal
        isOpen={showSourceCodeModal}
        onClose={() => setShowSourceCodeModal(false)}
      />
    </div>
  );
}
