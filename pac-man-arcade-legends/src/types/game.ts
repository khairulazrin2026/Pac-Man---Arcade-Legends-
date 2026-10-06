export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type GameState =
  | 'TITLE_MENU'
  | 'READY_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'PACMAN_DYING'
  | 'GHOST_EATEN_PAUSE'
  | 'LEVEL_CLEARED'
  | 'GAME_OVER';

export type GhostName = 'BLINKY' | 'PINKY' | 'INKY' | 'CLYDE';

export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';

export interface TileCoord {
  x: number; // Column index (0 to 27)
  y: number; // Row index (0 to 35)
}

export interface Position {
  x: number; // Sub-pixel coordinate in tile units (e.g. 13.5)
  y: number; // Sub-pixel coordinate in tile units
}

export interface PacmanEntity {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  mouthAngle: number;
  mouthClosing: boolean;
  lives: number;
  isDead: boolean;
  deathProgress: number; // 0 to 1 for death animation
}

export interface GhostEntity {
  name: GhostName;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  target: TileCoord;
  mode: GhostMode;
  inHouse: boolean;
  houseExitTimer: number;
  frightenedTimer: number;
  frightenedFlash: boolean;
  speed: number;
  scatterCorner: TileCoord;
  eatenScore: number;
}

export interface FruitEntity {
  type: 'CHERRY' | 'STRAWBERRY' | 'ORANGE' | 'APPLE' | 'MELON' | 'GALAXIAN' | 'BELL' | 'KEY';
  points: number;
  active: boolean;
  x: number;
  y: number;
  timer: number;
  duration: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number; // Remaining frames
  maxLife: number;
}

export interface HighScoreEntry {
  rank?: number;
  initials: string;
  score: number;
  level: number;
  date: string;
}

export type GameDifficulty = 'CASUAL' | 'NORMAL' | 'TURBO';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type GameState =
  | 'TITLE_MENU'
  | 'READY_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'PACMAN_DYING'
  | 'GHOST_EATEN_PAUSE'
  | 'LEVEL_CLEARED'
  | 'GAME_OVER';

export type GhostName = 'BLINKY' | 'PINKY' | 'INKY' | 'CLYDE';

export type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';

export interface TileCoord {
  x: number; // Column index (0 to 27)
  y: number; // Row index (0 to 35)
}

export interface Position {
  x: number; // Sub-pixel coordinate in tile units (e.g. 13.5)
  y: number; // Sub-pixel coordinate in tile units
}

export interface PacmanEntity {
  x: number;
  y: number;
  dir: Direction;
  nextDir: Direction;
  speed: number;
  mouthAngle: number;
  mouthClosing: boolean;
  lives: number;
  isDead: boolean;
  deathProgress: number; // 0 to 1 for death animation
}

export interface GhostEntity {
  name: GhostName;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  target: TileCoord;
  mode: GhostMode;
  inHouse: boolean;
  houseExitTimer: number;
  frightenedTimer: number;
  frightenedFlash: boolean;
  speed: number;
  scatterCorner: TileCoord;
  eatenScore: number;
}

export interface FruitEntity {
  type: 'CHERRY' | 'STRAWBERRY' | 'ORANGE' | 'APPLE' | 'MELON' | 'GALAXIAN' | 'BELL' | 'KEY';
  points: number;
  active: boolean;
  x: number;
  y: number;
  timer: number;
  duration: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number; // Remaining frames
  maxLife: number;
}

export interface HighScoreEntry {
  rank?: number;
  initials: string;
  score: number;
  level: number;
  date: string;
}

export type GameDifficulty = 'CASUAL' | 'NORMAL' | 'TURBO';
