import React, { useState } from 'react';
import { Check, Code2, Copy, FileCode, X } from 'lucide-react';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CodeFile {
  name: string;
  path: string;
  description: string;
  language: string;
  code: string;
}

const SOURCE_FILES: CodeFile[] = [
  {
    name: 'ghostAI.ts',
    path: 'src/game/ghostAI.ts',
    description: 'Blinky, Pinky, Inky & Clyde AI targeting math, tie-breaker turns & scatter modes',
    language: 'typescript',
    code: `import { Direction, GhostEntity, GhostMode, PacmanEntity, TileCoord } from '../types/game';
import { COLS, ROWS, SCATTER_TARGETS, SPAWN_POSITIONS } from './mazeData';

export function calculateGhostTarget(
  ghost: GhostEntity,
  pacman: PacmanEntity,
  blinky: GhostEntity,
  currentMode: GhostMode
): TileCoord {
  // If eaten, head directly to ghost house door
  if (ghost.mode === 'EATEN') {
    return { x: 13.5, y: 14 };
  }

  // If in scatter mode, go to individual home corner
  if (currentMode === 'SCATTER' || ghost.mode === 'SCATTER') {
    return ghost.scatterCorner;
  }

  // If frightened, targeting is pseudorandom per intersection
  if (ghost.mode === 'FRIGHTENED') {
    return {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  }

  const pX = Math.round(pacman.x);
  const pY = Math.round(pacman.y);

  switch (ghost.name) {
    case 'BLINKY': {
      // Direct Chaser: targets Pac-Man's exact tile
      return { x: pX, y: pY };
    }

    case 'PINKY': {
      // Ambush: targets 4 tiles ahead of Pac-Man's direction
      // Classic arcade quirk: UP also offsets 4 tiles LEFT
      const offset = getDirectionVector(pacman.dir);
      if (pacman.dir === 'UP') {
        return { x: pX - 4, y: pY - 4 };
      }
      return { x: pX + offset.dx * 4, y: pY + offset.dy * 4 };
    }

    case 'INKY': {
      // Flanker: Takes 2 tiles ahead of Pacman, draws vector from Blinky, doubles it
      const pacAheadOffset = getDirectionVector(pacman.dir);
      const intermediateX = pacman.dir === 'UP' ? pX - 2 : pX + pacAheadOffset.dx * 2;
      const intermediateY = pacman.dir === 'UP' ? pY - 2 : pY + pacAheadOffset.dy * 2;

      const blinkyX = Math.round(blinky.x);
      const blinkyY = Math.round(blinky.y);

      return {
        x: intermediateX + (intermediateX - blinkyX),
        y: intermediateY + (intermediateY - blinkyY),
      };
    }

    case 'CLYDE': {
      // Shy: If distance > 8 tiles, target Pacman; if <= 8 tiles, retreat to scatter corner
      const distSq = Math.pow(ghost.x - pacman.x, 2) + Math.pow(ghost.y - pacman.y, 2);
      if (distSq > 64) {
        return { x: pX, y: pY };
      }
      return ghost.scatterCorner;
    }

    default:
      return ghost.scatterCorner;
  }
}

export function chooseGhostDirection(
  ghost: GhostEntity,
  target: TileCoord,
  maze: number[][]
): Direction {
  const currentTileX = Math.round(ghost.x);
  const currentTileY = Math.round(ghost.y);
  const oppositeDir = getOppositeDirection(ghost.dir);

  // Classic Arcade priority order for tie breaks: UP, LEFT, DOWN, RIGHT
  const candidateDirs: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
  const validMoves: { dir: Direction; distSq: number }[] = [];

  for (const dir of candidateDirs) {
    if (dir === oppositeDir && ghost.dir !== 'NONE') continue;

    // Classic arcade restriction above ghost house
    if (
      dir === 'UP' &&
      ghost.mode !== 'EATEN' &&
      ((currentTileY === 14 && (currentTileX === 12 || currentTileX === 15)) ||
       (currentTileY === 26 && (currentTileX === 12 || currentTileX === 15)))
    ) {
      continue;
    }

    const { dx, dy } = getDirectionVector(dir);
    const nextTileX = currentTileX + dx;
    const nextTileY = currentTileY + dy;

    if (isGhostTileWalkable(nextTileX, nextTileY, ghost.mode, ghost.inHouse, maze)) {
      if (ghost.mode === 'FRIGHTENED') {
        validMoves.push({ dir, distSq: Math.random() * 1000 });
      } else {
        const distSq = Math.pow(nextTileX - target.x, 2) + Math.pow(nextTileY - target.y, 2);
        validMoves.push({ dir, distSq });
      }
    }
  }

  if (validMoves.length === 0) return oppositeDir !== 'NONE' ? oppositeDir : 'UP';
  validMoves.sort((a, b) => a.distSq - b.distSq);
  return validMoves[0].dir;
}`
  },
  {
    name: 'soundEngine.ts',
    path: 'src/audio/soundEngine.ts',
    description: 'Web Audio API synthesizer (no MP3 files: waka-waka, siren, death sound, chimes)',
    language: 'typescript',
    code: `class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  public playWaka(tone: 0 | 1 = 0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const startFreq = tone === 0 ? 340 : 490;
    const endFreq = tone === 0 ? 200 : 280;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playDeath(): Promise<void> {
    if (this.isMuted) return Promise.resolve();
    this.initContext();
    if (!this.ctx || !this.masterGain) return Promise.resolve();

    this.stopAllLoops();
    const now = this.ctx.currentTime;
    const freqs = [880, 830, 784, 740, 698, 659, 622, 587, 554, 523, 493, 466, 440, 392, 349, 311, 261, 220];

    let delay = 0;
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + delay);
      gain.gain.setValueAtTime(0.28, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.055);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
      delay += 0.055;
    });

    return new Promise((resolve) => setTimeout(resolve, (delay + 0.2) * 1000));
  }
}`
  },
  {
    name: 'mazeData.ts',
    path: 'src/game/mazeData.ts',
    description: '28x36 arcade grid map, tile bitmask representations & warp tunnels',
    language: 'typescript',
    code: `export const COLS = 28;
export const ROWS = 36;
export const TILE_SIZE = 16;

export const INITIAL_MAZE: number[][] = [
  // 0: Empty, 1: Wall, 2: Dot (10pts), 3: Energizer (50pts), 4: Ghost Gate, 6: Tunnel
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,4,4,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [6,6,6,6,6,6,2,0,0,0,1,5,5,5,5,5,5,1,0,0,0,2,6,6,6,6,6,6], // Row 17: Warp tunnel
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1]
];

export const SPAWN_POSITIONS = {
  PACMAN: { x: 13.5, y: 26 },
  BLINKY: { x: 13.5, y: 14 },
  PINKY: { x: 13.5, y: 17 },
  INKY: { x: 11.5, y: 17 },
  CLYDE: { x: 15.5, y: 17 },
  FRUIT: { x: 13.5, y: 20 },
  GHOST_EXIT: { x: 13.5, y: 14 }
};`
  },
  {
    name: 'renderer.ts',
    path: 'src/game/renderer.ts',
    description: 'Canvas rendering: vector Pacman chomp, scalloped ghost skirts, floating scores & HUD',
    language: 'typescript',
    code: `export class PacmanRenderer {
  public drawPacman(pacman: PacmanEntity) {
    const ctx = this.ctx;
    const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = 7.5;

    ctx.save();
    ctx.translate(px, py);

    let rotation = 0;
    switch (pacman.dir) {
      case 'RIGHT': rotation = 0; break;
      case 'DOWN': rotation = Math.PI / 2; break;
      case 'LEFT': rotation = Math.PI; break;
      case 'UP': rotation = -Math.PI / 2; break;
    }
    ctx.rotate(rotation);

    const mouthRad = (pacman.mouthAngle * Math.PI) / 180;
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, radius, mouthRad, Math.PI * 2 - mouthRad);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}`
  },
  {
    name: 'usePacmanGame.ts',
    path: 'src/game/usePacmanGame.ts',
    description: 'Game engine loop hook: requestAnimationFrame delta physics, input buffering, combos & high scores',
    language: 'typescript',
    code: `export function usePacmanGame() {
  // Delta-timed requestAnimationFrame loop
  // Sub-pixel movement interpolation & direction buffering
  // Energizer frightened timers & ghost combo scoring (+200, +400, +800, +1600)
  // Fruit triggers at 70 & 170 dots
  // LocalStorage persistence for high scores
}`
  }
];

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(SOURCE_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-code-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-amber-400 stroke-[2]" />
            <div>
              <h2 id="source-code-title" className="font-arcade text-xs uppercase tracking-wider text-amber-400">
                Pac-Man Architecture & Source Code
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Interactive repository inspector & core algorithms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close source code modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-800 bg-slate-900/30 overflow-x-auto">
          {SOURCE_FILES.map((file) => {
            const isActive = selectedFile.name === file.name;
            return (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-amber-300 font-semibold border border-amber-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* File Meta & Copy Action */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-900 text-xs font-mono">
          <div className="text-slate-400 truncate max-w-lg">
            <span className="text-amber-400/90">{selectedFile.path}</span>
            <span className="mx-2 text-slate-600">·</span>
            <span className="text-slate-300">{selectedFile.description}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-200 transition-colors active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/80 font-mono text-xs text-slate-200 leading-relaxed select-text">
          <pre className="overflow-x-auto whitespace-pre font-mono p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <code>{selectedFile.code}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Full TypeScript SPA with React 19, Tailwind CSS & Web Audio API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
