import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../audio/soundEngine';
import {
  Direction,
  FloatingText,
  FruitEntity,
  GameDifficulty,
  GameState,
  GhostEntity,
  GhostMode,
  HighScoreEntry,
  PacmanEntity,
} from '../types/game';
import {
  calculateGhostTarget,
  chooseGhostDirection,
  createInitialGhosts,
  getDirectionVector,
  getOppositeDirection,
  isGhostTileWalkable,
} from './ghostAI';
import {
  cloneMaze,
  COLS,
  INITIAL_MAZE,
  ROWS,
  SPAWN_POSITIONS,
  TOTAL_PELLETS,
  TUNNEL_LEFT_MAX_COL,
  TUNNEL_RIGHT_MIN_COL,
  TUNNEL_ROW,
} from './mazeData';
import { PacmanRenderer } from './renderer';

const FRUIT_SPECS: Record<number, { type: FruitEntity['type']; points: number }> = {
  1: { type: 'CHERRY', points: 100 },
  2: { type: 'STRAWBERRY', points: 300 },
  3: { type: 'ORANGE', points: 500 },
  4: { type: 'ORANGE', points: 500 },
  5: { type: 'APPLE', points: 700 },
  6: { type: 'APPLE', points: 700 },
  7: { type: 'MELON', points: 1000 },
  8: { type: 'MELON', points: 1000 },
  9: { type: 'GALAXIAN', points: 2000 },
  10: { type: 'GALAXIAN', points: 2000 },
  11: { type: 'BELL', points: 3000 },
  12: { type: 'BELL', points: 3000 },
};

export function usePacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High Scores
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('pacman_high_score');
    return saved ? parseInt(saved, 10) : 10000;
  });

  const [leaderboard, setLeaderboard] = useState<HighScoreEntry[]>(() => {
    const saved = localStorage.getItem('pacman_leaderboard');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      { initials: 'PAC', score: 18450, level: 5, date: '1980-05-22' },
      { initials: 'TOR', score: 14200, level: 4, date: '1980-05-22' },
      { initials: 'NAM', score: 10800, level: 3, date: '1980-05-22' },
      { initials: 'MID', score: 8500, level: 2, date: '1980-05-22' },
      { initials: 'ARC', score: 6200, level: 1, date: '1980-05-22' },
    ];
  });

  // Game Settings & UI State
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [level, setLevel] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('NORMAL');
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [showHighScoresModal, setShowHighScoresModal] = useState<boolean>(false);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState<boolean>(false);
  const [showInitialsModal, setShowInitialsModal] = useState<boolean>(false);

  // References for mutable game loop state to avoid React re-render thrashing
  const mazeRef = useRef<number[][]>(cloneMaze());
  const pelletsRemainingRef = useRef<number>(TOTAL_PELLETS);
  const pelletsEatenThisRoundRef = useRef<number>(0);

  const pacmanRef = useRef<PacmanEntity>({
    x: SPAWN_POSITIONS.PACMAN.x,
    y: SPAWN_POSITIONS.PACMAN.y,
    dir: 'LEFT',
    nextDir: 'LEFT',
    speed: 0.11,
    mouthAngle: 30,
    mouthClosing: true,
    lives: 3,
    isDead: false,
    deathProgress: 0,
  });

  const ghostsRef = useRef<GhostEntity[]>(createInitialGhosts());
  const ghostComboIndexRef = useRef<number>(0);

  const fruitRef = useRef<FruitEntity>({
    type: 'CHERRY',
    points: 100,
    active: false,
    x: SPAWN_POSITIONS.FRUIT.x,
    y: SPAWN_POSITIONS.FRUIT.y,
    timer: 0,
    duration: 9000,
  });

  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Wave mode timers (Scatter vs Chase)
  const globalModeRef = useRef<GhostMode>('SCATTER');
  const waveTimerRef = useRef<number>(0);
  const waveIndexRef = useRef<number>(0);

  // Flashing & visual ticks
  const tickRef = useRef<number>(0);
  const energizerVisibleRef = useRef<boolean>(true);
  const levelClearFlashingRef = useRef<boolean>(false);
  const extraLifeAwardedRef = useRef<boolean>(false);

  // Animation frame ID
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const freezeFramesRef = useRef<number>(0);

  // Difficulty base speed multiplier
  const getSpeedMultiplier = useCallback(() => {
    switch (difficulty) {
      case 'CASUAL': return 0.85;
      case 'TURBO': return 1.25;
      default: return 1.0;
    }
  }, [difficulty]);

  /**
   * Resets entities for round start or after Pac-Man death
   */
  const resetEntitiesPositions = useCallback(() => {
    pacmanRef.current = {
      x: SPAWN_POSITIONS.PACMAN.x,
      y: SPAWN_POSITIONS.PACMAN.y,
      dir: 'LEFT',
      nextDir: 'LEFT',
      speed: 0.11 * getSpeedMultiplier(),
      mouthAngle: 30,
      mouthClosing: true,
      lives: pacmanRef.current.lives,
      isDead: false,
      deathProgress: 0,
    };

    ghostsRef.current = createInitialGhosts();
    ghostComboIndexRef.current = 0;
    globalModeRef.current = 'SCATTER';
    waveTimerRef.current = 0;
    waveIndexRef.current = 0;
  }, [getSpeedMultiplier]);

  /**
   * Resets entire game for a fresh playthrough
   */
  const startNewGame = useCallback(async () => {
    soundEngine.stopAllLoops();
    mazeRef.current = cloneMaze();
    pelletsRemainingRef.current = TOTAL_PELLETS;
    pelletsEatenThisRoundRef.current = 0;
    floatingTextsRef.current = [];
    fruitRef.current.active = false;
    extraLifeAwardedRef.current = false;

    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState('READY_INTRO');

    pacmanRef.current.lives = 3;
    resetEntitiesPositions();

    // Play iconic intro jingle
    await soundEngine.playIntro();

    setGameState('PLAYING');
    soundEngine.startSiren(0);
  }, [resetEntitiesPositions]);

  /**
   * Level cleared transition
   */
  const handleLevelCleared = useCallback(async () => {
    setGameState('LEVEL_CLEARED');
    soundEngine.stopAllLoops();
    levelClearFlashingRef.current = true;

    // Flash maze
    for (let i = 0; i < 6; i++) {
      levelClearFlashingRef.current = i % 2 === 0;
      await new Promise((r) => setTimeout(r, 200));
    }
    levelClearFlashingRef.current = false;

    // Advance Level
    setLevel((prevLevel) => {
      const nextLevel = prevLevel + 1;
      mazeRef.current = cloneMaze();
      pelletsRemainingRef.current = TOTAL_PELLETS;
      pelletsEatenThisRoundRef.current = 0;
      resetEntitiesPositions();

      // Configure next fruit
      const fruitSpec = FRUIT_SPECS[Math.min(nextLevel, 12)] || { type: 'KEY', points: 5000 };
      fruitRef.current = {
        type: fruitSpec.type,
        points: fruitSpec.points,
        active: false,
        x: SPAWN_POSITIONS.FRUIT.x,
        y: SPAWN_POSITIONS.FRUIT.y,
        timer: 0,
        duration: 9000,
      };

      setGameState('PLAYING');
      soundEngine.startSiren(Math.min(nextLevel - 1, 4));
      return nextLevel;
    });
  }, [resetEntitiesPositions]);

  /**
   * Checks if user entered a new top score
   */
  const handleGameOver = useCallback((finalScore: number, finalLevel: number) => {
    setGameState('GAME_OVER');
    soundEngine.stopAllLoops();

    // Check if score qualifies for leaderboard
    const isTopScore = leaderboard.length < 5 || finalScore > leaderboard[leaderboard.length - 1].score;
    if (isTopScore && finalScore > 0) {
      setShowInitialsModal(true);
    }
  }, [leaderboard]);

  /**
   * Add high score with player initials
   */
  const submitHighScore = useCallback((initials: string) => {
    const newEntry: HighScoreEntry = {
      initials: initials.toUpperCase().slice(0, 3) || 'AAA',
      score,
      level,
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updated);
    localStorage.setItem('pacman_leaderboard', JSON.stringify(updated));

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('pacman_high_score', String(score));
    }

    setShowInitialsModal(false);
  }, [leaderboard, score, level, highScore]);

  /**
   * Pac-Man dying sequence
   */
  const triggerPacmanDeath = useCallback(async () => {
    setGameState('PACMAN_DYING');
    soundEngine.stopAllLoops();
    pacmanRef.current.isDead = true;
    pacmanRef.current.deathProgress = 0;

    // Small freeze pause
    await new Promise((r) => setTimeout(r, 350));

    // Play synthesized death sound
    soundEngine.playDeath();

    // Animate death progress
    const startTime = performance.now();
    const duration = 1200;
    while (performance.now() - startTime < duration) {
      const progress = (performance.now() - startTime) / duration;
      pacmanRef.current.deathProgress = Math.min(1, progress);
      await new Promise((r) => requestAnimationFrame(r));
    }

    pacmanRef.current.deathProgress = 1;
    await new Promise((r) => setTimeout(r, 400));

    const remainingLives = pacmanRef.current.lives - 1;
    pacmanRef.current.lives = remainingLives;
    setLives(remainingLives);

    if (remainingLives <= 0) {
      handleGameOver(score, level);
    } else {
      resetEntitiesPositions();
      setGameState('PLAYING');
      soundEngine.startSiren(Math.min(level - 1, 4));
    }
  }, [score, level, handleGameOver, resetEntitiesPositions]);

  /**
   * Handle Pacman direction request (Keyboard / Virtual D-pad / Swipe)
   */
  const setDirection = useCallback((dir: Direction) => {
    if (gameState !== 'PLAYING') return;

    const pac = pacmanRef.current;
    pac.nextDir = dir;

    // Immediate 180-degree turn without waiting for intersection alignment
    if (dir === getOppositeDirection(pac.dir)) {
      pac.dir = dir;
    }
  }, [gameState]);

  /**
   * Toggle Pause
   */
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      soundEngine.stopAllLoops();
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      soundEngine.startSiren(Math.min(level - 1, 4));
    }
  }, [gameState, level]);

  /**
   * Sound toggle
   */
  const toggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  /**
   * Main Game Engine Update Step
   */
  const updateGame = useCallback((deltaTime: number) => {
    if (gameState !== 'PLAYING') return;

    if (freezeFramesRef.current > 0) {
      freezeFramesRef.current--;
      return;
    }

    tickRef.current++;
    const tick = tickRef.current;
    const pac = pacmanRef.current;
    const ghosts = ghostsRef.current;
    const maze = mazeRef.current;
    const speedMult = getSpeedMultiplier();

    // 1. Energizer Flashing Cadence
    if (tick % 16 === 0) {
      energizerVisibleRef.current = !energizerVisibleRef.current;
    }

    // 2. Mode Timer (Scatter vs Chase wave transitions)
    waveTimerRef.current += deltaTime;
    const waveTimes = [
      { mode: 'SCATTER' as GhostMode, dur: 7000 },
      { mode: 'CHASE' as GhostMode, dur: 20000 },
      { mode: 'SCATTER' as GhostMode, dur: 7000 },
      { mode: 'CHASE' as GhostMode, dur: 20000 },
      { mode: 'SCATTER' as GhostMode, dur: 5000 },
      { mode: 'CHASE' as GhostMode, dur: 20000 },
      { mode: 'SCATTER' as GhostMode, dur: 5000 },
      { mode: 'CHASE' as GhostMode, dur: Infinity },
    ];
    const currentWave = waveTimes[waveIndexRef.current] || waveTimes[waveTimes.length - 1];
    if (waveTimerRef.current >= currentWave.dur && waveIndexRef.current < waveTimes.length - 1) {
      waveIndexRef.current++;
      waveTimerRef.current = 0;
      globalModeRef.current = waveTimes[waveIndexRef.current].mode;
      // When global mode shifts, non-frightened/non-eaten ghosts reverse direction
      ghosts.forEach((g) => {
        if (g.mode !== 'FRIGHTENED' && g.mode !== 'EATEN') {
          g.mode = globalModeRef.current;
          g.dir = getOppositeDirection(g.dir);
        }
      });
    }

    // 3. Update Pac-Man Movement
    const pacSpeed = 0.11 * speedMult;

    // Check pre-queued direction turn
    if (pac.nextDir !== pac.dir && pac.nextDir !== 'NONE') {
      const nextVec = getDirectionVector(pac.nextDir);
      const isOpposite = pac.nextDir === getOppositeDirection(pac.dir);

      if (isOpposite) {
        pac.dir = pac.nextDir;
      } else {
        // Can turn if aligned with tile center
        const alignX = Math.abs(pac.x - Math.round(pac.x)) < 0.22;
        const alignY = Math.abs(pac.y - Math.round(pac.y)) < 0.22;

        if (alignX && alignY) {
          const targetTileX = Math.round(pac.x) + nextVec.dx;
          const targetTileY = Math.round(pac.y) + nextVec.dy;

          if (isGhostTileWalkable(targetTileX, targetTileY, 'CHASE', false, maze)) {
            pac.x = Math.round(pac.x);
            pac.y = Math.round(pac.y);
            pac.dir = pac.nextDir;
          }
        }
      }
    }

    // Move in current direction
    const curVec = getDirectionVector(pac.dir);
    if (pac.dir !== 'NONE') {
      const nextX = pac.x + curVec.dx * pacSpeed;
      const nextY = pac.y + curVec.dy * pacSpeed;

      // Handle Tunnel Wrap-around
      if (Math.round(pac.y) === TUNNEL_ROW) {
        if (nextX < -0.5) {
          pac.x = COLS - 0.5;
        } else if (nextX > COLS - 0.5) {
          pac.x = -0.5;
        } else {
          pac.x = nextX;
        }
      } else {
        const checkTileX = curVec.dx > 0 ? Math.floor(nextX + 0.95) : Math.ceil(nextX - 0.95);
        const checkTileY = curVec.dy > 0 ? Math.floor(nextY + 0.95) : Math.ceil(nextY - 0.95);

        if (isGhostTileWalkable(checkTileX, checkTileY, 'CHASE', false, maze)) {
          pac.x = nextX;
          pac.y = nextY;

          // Animate mouth chomp
          if (pac.mouthClosing) {
            pac.mouthAngle -= 4;
            if (pac.mouthAngle <= 2) pac.mouthClosing = false;
          } else {
            pac.mouthAngle += 4;
            if (pac.mouthAngle >= 42) pac.mouthClosing = true;
          }
        } else {
          // Snap directly against wall
          pac.x = Math.round(pac.x);
          pac.y = Math.round(pac.y);
        }
      }
    }

    // 4. Pellet and Energizer Consumption
    const pTileX = Math.round(pac.x);
    const pTileY = Math.round(pac.y);

    if (pTileX >= 0 && pTileX < COLS && pTileY >= 0 && pTileY < ROWS) {
      const tile = maze[pTileY][pTileX];

      if (tile === 2) {
        // Normal Pellet
        maze[pTileY][pTileX] = 0;
        pelletsRemainingRef.current--;
        pelletsEatenThisRoundRef.current++;
        setScore((s) => {
          const next = s + 10;
          if (next >= 10000 && !extraLifeAwardedRef.current) {
            extraLifeAwardedRef.current = true;
            soundEngine.playExtraLife();
            setLives((l) => l + 1);
          }
          return next;
        });
        soundEngine.playWaka((tick % 2) as 0 | 1);

        // Check fruit spawn triggers
        const eaten = pelletsEatenThisRoundRef.current;
        if (eaten === 70 || eaten === 170) {
          fruitRef.current.active = true;
          fruitRef.current.timer = 0;
        }

        // Check Level Win
        if (pelletsRemainingRef.current <= 0) {
          handleLevelCleared();
          return;
        }
      } else if (tile === 3) {
        // Energizer / Power Pellet
        maze[pTileY][pTileX] = 0;
        pelletsRemainingRef.current--;
        pelletsEatenThisRoundRef.current++;
        setScore((s) => {
          const next = s + 50;
          if (next >= 10000 && !extraLifeAwardedRef.current) {
            extraLifeAwardedRef.current = true;
            soundEngine.playExtraLife();
            setLives((l) => l + 1);
          }
          return next;
        });

        soundEngine.playWaka(1);
        soundEngine.startFrightenedSiren();

        // Turn all ghosts frightened (unless already eaten)
        ghostComboIndexRef.current = 0;
        // Frightened duration scales by level (starts at 6.5s, decreases by 0.5s down to 2s)
        const frightenedDur = Math.max(2000, 6500 - (level - 1) * 500);

        ghosts.forEach((g) => {
          if (g.mode !== 'EATEN') {
            g.mode = 'FRIGHTENED';
            g.frightenedTimer = frightenedDur;
            g.frightenedFlash = false;
            g.dir = getOppositeDirection(g.dir);
          }
        });

        if (pelletsRemainingRef.current <= 0) {
          handleLevelCleared();
          return;
        }
      }
    }

    // 5. Update Fruit
    const fruit = fruitRef.current;
    if (fruit.active) {
      fruit.timer += deltaTime;
      if (fruit.timer >= fruit.duration) {
        fruit.active = false;
      } else {
        // Pacman eats fruit
        const distFruit = Math.hypot(pac.x - fruit.x, pac.y - fruit.y);
        if (distFruit < 0.6) {
          fruit.active = false;
          soundEngine.playEatFruit();
          setScore((s) => s + fruit.points);
          floatingTextsRef.current.push({
            id: `fruit_${Date.now()}`,
            text: `+${fruit.points}`,
            x: fruit.x,
            y: fruit.y,
            color: '#F472B6',
            life: 60,
            maxLife: 60,
          });
        }
      }
    }

    // 6. Update Floating Texts
    floatingTextsRef.current = floatingTextsRef.current
      .map((t) => ({ ...t, y: t.y - 0.015, life: t.life - 1 }))
      .filter((t) => t.life > 0);

    // 7. Update Ghosts
    const blinky = ghosts[0];
    let anyFrightened = false;

    ghosts.forEach((ghost) => {
      // Frightened timer countdown
      if (ghost.mode === 'FRIGHTENED') {
        anyFrightened = true;
        ghost.frightenedTimer -= deltaTime;
        if (ghost.frightenedTimer <= 2200) {
          ghost.frightenedFlash = true;
        }
        if (ghost.frightenedTimer <= 0) {
          ghost.mode = globalModeRef.current;
          ghost.frightenedFlash = false;
        }
      }

      // Ghost House Release
      if (ghost.inHouse) {
        ghost.houseExitTimer -= deltaTime / 1000;
        if (ghost.houseExitTimer <= 0) {
          // Move towards exit door
          if (Math.abs(ghost.x - SPAWN_POSITIONS.GHOST_EXIT.x) > 0.1) {
            ghost.x += ghost.x < SPAWN_POSITIONS.GHOST_EXIT.x ? 0.05 : -0.05;
          } else if (ghost.y > SPAWN_POSITIONS.GHOST_EXIT.y) {
            ghost.y -= 0.06;
          } else {
            ghost.inHouse = false;
            ghost.y = SPAWN_POSITIONS.GHOST_EXIT.y;
            ghost.dir = 'LEFT';
          }
        }
        return; // Stays inside or climbing out
      }

      // Eaten eyes returning home check
      if (ghost.mode === 'EATEN') {
        const distToDoor = Math.hypot(ghost.x - SPAWN_POSITIONS.GHOST_EXIT.x, ghost.y - SPAWN_POSITIONS.GHOST_EXIT.y);
        if (distToDoor < 0.4) {
          ghost.mode = globalModeRef.current;
          ghost.inHouse = false;
          ghost.dir = 'LEFT';
        }
      }

      // Ghost Speed adjustment
      let gSpeed = 0.09 * speedMult;
      if (ghost.mode === 'EATEN') {
        gSpeed = 0.20 * speedMult; // Super fast eyes
      } else if (ghost.mode === 'FRIGHTENED') {
        gSpeed = 0.055 * speedMult; // Slow frightened speed
      } else if (
        Math.round(ghost.y) === TUNNEL_ROW &&
        (ghost.x < TUNNEL_LEFT_MAX_COL || ghost.x > TUNNEL_RIGHT_MIN_COL)
      ) {
        gSpeed = 0.045 * speedMult; // Tunnel slowdown
      } else if (ghost.name === 'BLINKY' && pelletsRemainingRef.current < 20) {
        gSpeed = 0.105 * speedMult; // Cruise Elroy speed boost!
      }

      // Intersection navigation & target calculation
      const isNearTileCenter =
        Math.abs(ghost.x - Math.round(ghost.x)) < 0.12 &&
        Math.abs(ghost.y - Math.round(ghost.y)) < 0.12;

      if (isNearTileCenter) {
        ghost.target = calculateGhostTarget(ghost, pac, blinky, globalModeRef.current);
        const nextTurn = chooseGhostDirection(ghost, ghost.target, maze);
        ghost.dir = nextTurn;
      }

      // Move ghost
      const gVec = getDirectionVector(ghost.dir);
      const nextGx = ghost.x + gVec.dx * gSpeed;
      const nextGy = ghost.y + gVec.dy * gSpeed;

      // Ghost Tunnel Wrap-around
      if (Math.round(ghost.y) === TUNNEL_ROW) {
        if (nextGx < -0.5) ghost.x = COLS - 0.5;
        else if (nextGx > COLS - 0.5) ghost.x = -0.5;
        else ghost.x = nextGx;
      } else {
        ghost.x = nextGx;
        ghost.y = nextGy;
      }

      // 8. Collision Detection: Pac-Man vs Ghost
      const distToPacman = Math.hypot(pac.x - ghost.x, pac.y - ghost.y);
      if (distToPacman < 0.65) {
        if (ghost.mode === 'FRIGHTENED') {
          // Eat Ghost!
          ghost.mode = 'EATEN';
          const combo = ghostComboIndexRef.current;
          const pointsEarned = 200 * Math.pow(2, combo); // 200, 400, 800, 1600
          ghostComboIndexRef.current = Math.min(3, combo + 1);

          soundEngine.playEatGhost(combo);
          setScore((s) => s + pointsEarned);

          floatingTextsRef.current.push({
            id: `ghost_${ghost.name}_${Date.now()}`,
            text: `+${pointsEarned}`,
            x: ghost.x,
            y: ghost.y,
            color: '#38BDF8',
            life: 50,
            maxLife: 50,
          });

          // Arcade freeze frame
          freezeFramesRef.current = 18;
        } else if (ghost.mode === 'CHASE' || ghost.mode === 'SCATTER') {
          // Pac-Man caught by ghost
          triggerPacmanDeath();
        }
      }
    });

    // Sound siren management
    if (!anyFrightened && gameState === 'PLAYING') {
      soundEngine.stopFrightenedSiren();
      soundEngine.startSiren(Math.min(level - 1, 4));
    }
  }, [gameState, getSpeedMultiplier, level, handleLevelCleared, triggerPacmanDeath]);

  /**
   * Main Render Loop
   */
  useEffect(() => {
    let animId: number;

    const renderLoop = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
      const deltaTime = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      // Update game physics
      updateGame(deltaTime);

      // Render frame to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const renderer = new PacmanRenderer(ctx);
          renderer.clear();

          // 1. Draw Maze
          renderer.drawMaze(
            mazeRef.current,
            energizerVisibleRef.current,
            levelClearFlashingRef.current
          );

          // 2. Draw Fruit
          renderer.drawFruit(fruitRef.current);

          // 3. Draw Pac-Man
          renderer.drawPacman(pacmanRef.current);

          // 4. Draw Ghosts
          ghostsRef.current.forEach((g) => renderer.drawGhost(g, tickRef.current));

          // 5. Draw Floating Texts
          renderer.drawFloatingTexts(floatingTextsRef.current);

          // 6. Draw HUD
          renderer.drawHUD(score, highScore);

          // 7. Draw Footer (Lives & Level Fruit)
          renderer.drawFooter(lives, level);

          // 8. Overlays for Game States
          if (gameState === 'READY_INTRO') {
            renderer.drawOverlayText('READY!', '#FACC15');
          } else if (gameState === 'PAUSED') {
            renderer.drawOverlayText('PAUSED', '#38BDF8');
          } else if (gameState === 'GAME_OVER') {
            renderer.drawOverlayText('GAME OVER', '#EF4444');
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    animFrameIdRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [updateGame, score, highScore, lives, level, gameState]);

  /**
   * Keyboard Controls Listener
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scroll on arrow keys / space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection, togglePause, toggleMute]);

  return {
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
  };
}
