import { FloatingText, FruitEntity, GhostEntity, PacmanEntity } from '../types/game';
import { COLS, ROWS, TILE_SIZE } from './mazeData';

/**
 * Draws the Pac-Man maze, entities, HUD, and effects on HTML5 Canvas
 */
export class PacmanRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.width = COLS * TILE_SIZE;
    this.height = ROWS * TILE_SIZE;
  }

  public clear() {
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draws maze walls, pellets, energizers, and ghost door
   */
  public drawMaze(
    maze: number[][],
    energizerVisible: boolean,
    isLevelClearFlashing: boolean,
    wallColor: string = '#2563EB'
  ) {
    const ctx = this.ctx;
    const finalWallColor = isLevelClearFlashing ? '#FFFFFF' : wallColor;

    ctx.save();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = maze[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === 1) {
          // Wall rendering: smooth filled tiles with inner outline
          ctx.fillStyle = finalWallColor;
          ctx.strokeStyle = '#1D4ED8';
          ctx.lineWidth = 1;

          // Connect adjacent walls cleanly
          const up = r > 0 && maze[r - 1][c] === 1;
          const down = r < ROWS - 1 && maze[r + 1][c] === 1;
          const left = c > 0 && maze[r][c - 1] === 1;
          const right = c < COLS - 1 && maze[r][c + 1] === 1;

          // Base block
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Wall bridge connectors
          if (up) ctx.fillRect(x + 2, y, TILE_SIZE - 4, 3);
          if (down) ctx.fillRect(x + 2, y + TILE_SIZE - 3, TILE_SIZE - 4, 3);
          if (left) ctx.fillRect(x, y + 2, 3, TILE_SIZE - 4);
          if (right) ctx.fillRect(x + TILE_SIZE - 3, y + 2, 3, TILE_SIZE - 4);

          // Inner dark core for classic neon tube look
          if (!isLevelClearFlashing) {
            ctx.fillStyle = '#050B14';
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            if (up) ctx.fillRect(x + 4, y, TILE_SIZE - 8, 4);
            if (down) ctx.fillRect(x + 4, y + TILE_SIZE - 4, TILE_SIZE - 8, 4);
            if (left) ctx.fillRect(x, y + 4, 4, TILE_SIZE - 8);
            if (right) ctx.fillRect(x + TILE_SIZE - 4, y + 4, 4, TILE_SIZE - 8);
          }
        } else if (tile === 2) {
          // Normal Pellet (10 pts)
          ctx.fillStyle = '#FED7AA'; // Peach / warm ivory
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 3) {
          // Energizer / Power Pellet (50 pts, blinking)
          if (energizerVisible) {
            ctx.fillStyle = '#FEF08A'; // Bright glowing yellow
            ctx.shadowColor = '#FBBF24';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        } else if (tile === 4) {
          // Ghost House Door
          ctx.fillStyle = '#F472B6'; // Classic arcade pink bar
          ctx.fillRect(x, y + 6, TILE_SIZE, 4);
        }
      }
    }

    ctx.restore();
  }

  /**
   * Draws Pac-Man with mouth chomp or death disintegration
   */
  public drawPacman(pacman: PacmanEntity) {
    const ctx = this.ctx;
    const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    const radius = 7.5;

    ctx.save();
    ctx.translate(px, py);

    if (pacman.isDead) {
      // Death animation: expanding wedge until fully gone
      const angle = pacman.deathProgress * Math.PI;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, radius * (1 - pacman.deathProgress * 0.5)), -Math.PI / 2 + angle, -Math.PI / 2 - angle + Math.PI * 2);
      ctx.lineTo(0, 0);
      ctx.fill();

      // Little death particle pop if near completion
      if (pacman.deathProgress > 0.8) {
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(-2, -6, 4, 2);
        ctx.fillRect(-6, -2, 2, 4);
        ctx.fillRect(4, -2, 2, 4);
        ctx.fillRect(-2, 4, 4, 2);
      }
      ctx.restore();
      return;
    }

    // Determine rotation angle based on direction
    let rotation = 0;
    switch (pacman.dir) {
      case 'RIGHT': rotation = 0; break;
      case 'DOWN': rotation = Math.PI / 2; break;
      case 'LEFT': rotation = Math.PI; break;
      case 'UP': rotation = -Math.PI / 2; break;
      default: rotation = 0;
    }

    ctx.rotate(rotation);

    // Mouth wedge angle
    const mouthRad = (pacman.mouthAngle * Math.PI) / 180;

    ctx.fillStyle = '#FACC15'; // Vibrant Pac-Man yellow
    ctx.shadowColor = 'rgba(250, 204, 21, 0.4)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    ctx.arc(0, 0, radius, mouthRad, Math.PI * 2 - mouthRad);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Draws a Ghost (Body, eyes, pupils, skirt animation, frightened mode)
   */
  public drawGhost(ghost: GhostEntity, tick: number) {
    const ctx = this.ctx;
    const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
    const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
    const r = 7.5;

    ctx.save();
    ctx.translate(gx, gy);

    // If Eaten: draw only floating eyes and pupils
    if (ghost.mode === 'EATEN') {
      this.drawGhostEyes(ghost.dir);
      ctx.restore();
      return;
    }

    // Determine body color
    let bodyColor = ghost.color;
    if (ghost.mode === 'FRIGHTENED') {
      if (ghost.frightenedFlash && Math.floor(tick / 10) % 2 === 0) {
        bodyColor = '#FFFFFF'; // Flashing white
      } else {
        bodyColor = '#1D4ED8'; // Dark cobalt blue
      }
    }

    // Draw Ghost Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    // Top dome
    ctx.arc(0, -2, r, Math.PI, 0, false);
    // Right side
    ctx.lineTo(r, 6);

    // Animated wavy skirt (3 scalloped ripples)
    const wave = Math.sin(tick * 0.2) * 1.5;
    ctx.lineTo(r * 0.66, 4 + wave);
    ctx.lineTo(r * 0.33, 6);
    ctx.lineTo(0, 4 - wave);
    ctx.lineTo(-r * 0.33, 6);
    ctx.lineTo(-r * 0.66, 4 + wave);
    ctx.lineTo(-r, 6);

    // Left side back to dome
    ctx.lineTo(-r, -2);
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (ghost.mode === 'FRIGHTENED') {
      // Frightened face (small eyes and squiggly mouth)
      const isWhite = bodyColor === '#FFFFFF';
      ctx.fillStyle = isWhite ? '#DC2626' : '#FED7AA';

      // Small dots for frightened eyes
      ctx.fillRect(-4, -3, 2.5, 2.5);
      ctx.fillRect(2, -3, 2.5, 2.5);

      // Squiggly mouth
      ctx.strokeStyle = isWhite ? '#DC2626' : '#FED7AA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-3, 3.5);
      ctx.lineTo(-1, 2);
      ctx.lineTo(1, 3.5);
      ctx.lineTo(3, 2);
      ctx.lineTo(5, 3.5);
      ctx.stroke();
    } else {
      // Normal expressive eyes with pupils tracking movement
      this.drawGhostEyes(ghost.dir);
    }

    ctx.restore();
  }

  /**
   * Helper to draw ghost eyes and pupils looking towards moving direction
   */
  private drawGhostEyes(dir: string) {
    const ctx = this.ctx;

    // Pupil offset based on direction
    let ox = 0;
    let oy = 0;
    switch (dir) {
      case 'LEFT': ox = -1.8; oy = 0; break;
      case 'RIGHT': ox = 1.8; oy = 0; break;
      case 'UP': ox = 0; oy = -1.8; break;
      case 'DOWN': ox = 0; oy = 1.8; break;
    }

    // Left eye white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(-3.5, -2, 2.8, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right eye white
    ctx.beginPath();
    ctx.ellipse(3.5, -2, 2.8, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (dark blue)
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.arc(-3.5 + ox, -2 + oy, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(3.5 + ox, -2 + oy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Draws Bonus Fruit Sprite
   */
  public drawFruit(fruit: FruitEntity) {
    if (!fruit.active) return;
    const ctx = this.ctx;
    const fx = fruit.x * TILE_SIZE + TILE_SIZE / 2;
    const fy = fruit.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(fx, fy);

    switch (fruit.type) {
      case 'CHERRY':
        // Two red cherries with brown stem and green leaf
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.arc(-3, 3, 3.5, 0, Math.PI * 2);
        ctx.arc(3.5, 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Stems
        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 1);
        ctx.quadraticCurveTo(-1, -5, 2, -6);
        ctx.moveTo(3.5, 0);
        ctx.quadraticCurveTo(3, -4, 2, -6);
        ctx.stroke();
        // Leaf
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(2, -7, 4, 2);
        break;

      case 'STRAWBERRY':
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.lineTo(4, -2);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();
        // Seeds
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-2, 0, 1, 1);
        ctx.fillRect(1, 1, 1, 1);
        // Green top
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(-4, -4, 8, 2);
        break;

      case 'ORANGE':
      case 'APPLE':
        ctx.fillStyle = fruit.type === 'ORANGE' ? '#F97316' : '#EF4444';
        ctx.beginPath();
        ctx.arc(0, 1, 5, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(-1, -6, 2, 3);
        break;

      case 'MELON':
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.ellipse(0, 1, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Stem
        ctx.fillStyle = '#86EFAC';
        ctx.fillRect(-1, -5, 2, 2);
        break;

      case 'GALAXIAN':
        // Flagship icon
        ctx.fillStyle = '#EAB308';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5, 4);
        ctx.lineTo(0, 2);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
        // Wings
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(-5, 1, 2, 3);
        ctx.fillRect(3, 1, 2, 3);
        break;

      case 'BELL':
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(0, -1, 4, Math.PI, 0);
        ctx.lineTo(5, 4);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
        // Clapper
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-1, 4, 2, 2);
        break;

      case 'KEY':
        ctx.fillStyle = '#38BDF8';
        // Key head
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -3, 3, 0, Math.PI * 2);
        ctx.stroke();
        // Shaft & teeth
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-1, 0, 2, 7);
        ctx.fillRect(1, 2, 3, 2);
        ctx.fillRect(1, 5, 2, 2);
        break;
    }

    ctx.restore();
  }

  /**
   * Floating points text (+200, +400, +800, etc.)
   */
  public drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    texts.forEach((item) => {
      const alpha = Math.max(0, item.life / item.maxLife);
      ctx.fillStyle = item.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(item.text, item.x * TILE_SIZE + TILE_SIZE / 2, item.y * TILE_SIZE + TILE_SIZE / 2);
    });

    ctx.restore();
  }

  /**
   * Top HUD (1UP, Score, HIGH SCORE)
   */
  public drawHUD(score: number, highScore: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';

    // 1UP
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('1UP', 24, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(score.toString().padStart(2, ' '), 24, 30);

    // HIGH SCORE
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', (COLS * TILE_SIZE) / 2, 16);
    ctx.fillText(highScore.toString(), (COLS * TILE_SIZE) / 2, 30);

    ctx.restore();
  }

  /**
   * Bottom HUD: Remaining Lives icons & level fruits
   */
  public drawFooter(lives: number, level: number) {
    const ctx = this.ctx;
    const y = (ROWS - 1.5) * TILE_SIZE;

    ctx.save();

    // Draw Pacman icons for remaining lives (up to 5)
    for (let i = 0; i < Math.min(lives, 5); i++) {
      const x = (2 + i * 2) * TILE_SIZE;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0.25 * Math.PI, 1.75 * Math.PI);
      ctx.lineTo(x, y);
      ctx.fill();
    }

    // Draw Level Fruits icons on bottom right
    const fruitIcons: FruitEntity['type'][] = [
      'CHERRY', 'STRAWBERRY', 'ORANGE', 'APPLE', 'MELON', 'GALAXIAN', 'BELL', 'KEY'
    ];
    const displayFruit = fruitIcons[Math.min(level - 1, fruitIcons.length - 1)];

    const rightX = (COLS - 3) * TILE_SIZE;
    this.drawFruit({
      type: displayFruit,
      points: 100,
      active: true,
      x: (COLS - 3),
      y: (ROWS - 1.8),
      timer: 0,
      duration: 0
    });

    ctx.restore();
  }

  /**
   * Overlay Arcade text ("READY!", "GAME OVER", "PAUSED")
   */
  public drawOverlayText(text: string, color: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;

    // Centered directly below ghost house door (Row 20)
    const cx = (COLS * TILE_SIZE) / 2;
    const cy = 20 * TILE_SIZE;

    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
