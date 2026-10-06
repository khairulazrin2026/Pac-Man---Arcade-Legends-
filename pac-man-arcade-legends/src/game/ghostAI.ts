import { Direction, GhostEntity, GhostMode, PacmanEntity, TileCoord } from '../types/game';
import { COLS, ROWS, SCATTER_TARGETS, SPAWN_POSITIONS } from './mazeData';

/**
 * Returns opposite direction
 */
export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'UP': return 'DOWN';
    case 'DOWN': return 'UP';
    case 'LEFT': return 'RIGHT';
    case 'RIGHT': return 'LEFT';
    default: return 'NONE';
  }
}

/**
 * Direction step vector in tile coordinates
 */
export function getDirectionVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'UP': return { dx: 0, dy: -1 };
    case 'DOWN': return { dx: 0, dy: 1 };
    case 'LEFT': return { dx: -1, dy: 0 };
    case 'RIGHT': return { dx: 1, dy: 0 };
    default: return { dx: 0, dy: 0 };
  }
}

/**
 * Calculates authentic ghost target tile based on personality and mode
 */
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
      // Classic arcade reproduction: UP also offsets 4 tiles LEFT
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

      const vecX = intermediateX - blinkyX;
      const vecY = intermediateY - blinkyY;

      return {
        x: intermediateX + vecX,
        y: intermediateY + vecY,
      };
    }

    case 'CLYDE': {
      // Shy / Cowardly: If distance > 8 tiles, target Pacman; if <= 8 tiles, retreat to scatter corner
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

/**
 * Checks if a tile is walkable for a ghost
 */
export function isGhostTileWalkable(
  tileX: number,
  tileY: number,
  ghostMode: GhostMode,
  inHouse: boolean,
  maze: number[][]
): boolean {
  // Wrap-around tunnels
  if (tileY === 17 && (tileX < 0 || tileX >= COLS)) {
    return true;
  }

  if (tileX < 0 || tileX >= COLS || tileY < 0 || tileY >= ROWS) {
    return false;
  }

  const tile = maze[tileY][tileX];

  // Walls are impassable
  if (tile === 1) return false;

  // Ghost house door
  if (tile === 4) {
    // Walkable only when entering as eyes or exiting house
    return inHouse || ghostMode === 'EATEN';
  }

  // Ghost house interior
  if (tile === 5) {
    return inHouse || ghostMode === 'EATEN';
  }

  return true;
}

/**
 * Determines next turn at an intersection using arcade distance minimization and tie-breakers
 */
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
    // Ghosts cannot reverse 180 degrees under normal pathfinding
    if (dir === oppositeDir && ghost.dir !== 'NONE') {
      continue;
    }

    // Classic arcade rule: Ghosts cannot turn UP in specific intersection zones above the ghost house
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
        // Random move during frightened mode
        validMoves.push({ dir, distSq: Math.random() * 1000 });
      } else {
        const distSq = Math.pow(nextTileX - target.x, 2) + Math.pow(nextTileY - target.y, 2);
        validMoves.push({ dir, distSq });
      }
    }
  }

  if (validMoves.length === 0) {
    // Fallback: reverse if trapped
    return oppositeDir !== 'NONE' ? oppositeDir : 'UP';
  }

  // Sort by smallest distance to target (preserves arcade tie-break order)
  validMoves.sort((a, b) => a.distSq - b.distSq);
  return validMoves[0].dir;
}

/**
 * Initial Ghost states generator
 */
export function createInitialGhosts(): GhostEntity[] {
  return [
    {
      name: 'BLINKY',
      color: '#EF4444', // Red
      x: SPAWN_POSITIONS.BLINKY.x,
      y: SPAWN_POSITIONS.BLINKY.y,
      dir: 'LEFT',
      target: SCATTER_TARGETS.BLINKY,
      mode: 'SCATTER',
      inHouse: false,
      houseExitTimer: 0,
      frightenedTimer: 0,
      frightenedFlash: false,
      speed: 0.85,
      scatterCorner: SCATTER_TARGETS.BLINKY,
      eatenScore: 200,
    },
    {
      name: 'PINKY',
      color: '#F472B6', // Pink
      x: SPAWN_POSITIONS.PINKY.x,
      y: SPAWN_POSITIONS.PINKY.y,
      dir: 'UP',
      target: SCATTER_TARGETS.PINKY,
      mode: 'SCATTER',
      inHouse: true,
      houseExitTimer: 1.5, // Exits soon
      frightenedTimer: 0,
      frightenedFlash: false,
      speed: 0.82,
      scatterCorner: SCATTER_TARGETS.PINKY,
      eatenScore: 200,
    },
    {
      name: 'INKY',
      color: '#38BDF8', // Cyan
      x: SPAWN_POSITIONS.INKY.x,
      y: SPAWN_POSITIONS.INKY.y,
      dir: 'UP',
      target: SCATTER_TARGETS.INKY,
      mode: 'SCATTER',
      inHouse: true,
      houseExitTimer: 5.0, // Exits after dots or timeout
      frightenedTimer: 0,
      frightenedFlash: false,
      speed: 0.80,
      scatterCorner: SCATTER_TARGETS.INKY,
      eatenScore: 200,
    },
    {
      name: 'CLYDE',
      color: '#FB923C', // Orange
      x: SPAWN_POSITIONS.CLYDE.x,
      y: SPAWN_POSITIONS.CLYDE.y,
      dir: 'UP',
      target: SCATTER_TARGETS.CLYDE,
      mode: 'SCATTER',
      inHouse: true,
      houseExitTimer: 9.0, // Exits last
      frightenedTimer: 0,
      frightenedFlash: false,
      speed: 0.78,
      scatterCorner: SCATTER_TARGETS.CLYDE,
      eatenScore: 200,
    },
  ];
}
