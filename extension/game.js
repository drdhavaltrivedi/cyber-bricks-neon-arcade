/**
 * Cyber-Bricks Core Game Engine
 * Handles gameplay, physics, rendering, particles, power-ups, levels, and collision detection.
 */

const LEVELS = [
  {
    name: "NEON GRID",
    difficulty: "EASY",
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]
    ]
  },
  {
    name: "CYBER INVADER",
    difficulty: "MEDIUM",
    grid: [
      [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 2, 0, 2, 2, 0, 2, 2, 0],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 0, 3, 3, 3, 3, 3, 3, 0, 3],
      [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0]
    ]
  },
  {
    name: "HELIX PROTOCOL",
    difficulty: "HARD",
    grid: [
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
      [3, 0, 2, 2, 2, 2, 2, 2, 0, 3],
      [3, 0, 2, 0, 0, 0, 0, 2, 0, 3],
      [3, 0, 2, 0, 1, 1, 0, 2, 0, 3],
      [3, 0, 0, 0, 0, 0, 0, 0, 0, 3]
    ]
  },
  {
    name: "SHIELD MATRIX",
    difficulty: "EXPERT",
    grid: [
      [2, 0, 2, 0, 2, 2, 0, 2, 0, 2],
      [0, 2, 0, 2, 0, 0, 2, 0, 2, 0],
      [3, 3, 0, 3, 3, 3, 3, 0, 3, 3],
      [0, 0, 3, 0, 0, 0, 0, 3, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    name: "CORE FIREWALL",
    difficulty: "CYBER-HELL",
    grid: [
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [2, 2, 2, 2, 0, 0, 2, 2, 2, 2],
      [0, 0, 3, 3, 3, 3, 3, 3, 0, 0],
      [1, 1, 0, 0, 1, 1, 0, 0, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ]
  }
];

// Color definitions based on brick health
const BRICK_COLORS = {
  1: { fill: "#ff007f", glow: "#ff007f", border: "#ffb3d9", score: 100 }, // Magenta
  2: { fill: "#00f0ff", glow: "#00f0ff", border: "#b3f7ff", score: 150 }, // Aqua
  3: { fill: "#ff9900", glow: "#ff9900", border: "#ffe6cc", score: 200 }, // Amber
  4: { fill: "#e0e0e0", glow: "#ffffff", border: "#ffffff", score: 300 }  // Metallic Core (requires 4 hits)
};

const POWERUP_TYPES = {
  MULTI:  { color: "#ff00ff", label: "M", glow: "#ff00ff", name: "MULTI-BALL" },
  LASER:  { color: "#ff0000", label: "L", glow: "#ff0000", name: "LASER PADDLE" },
  WIDE:   { color: "#00ff00", label: "W", glow: "#00ff00", name: "PADDLE FLUX" },
  SHIELD: { color: "#00ffff", label: "S", glow: "#00ffff", name: "NET SHIELD" },
  SLOW:   { color: "#ffff00", label: "T", glow: "#ffff00", name: "TEMPORAL SLOW" }
};

class Game {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};

    // Basic canvas configurations
    this.width = canvas.width;
    this.height = canvas.height;

    // Settings
    this.settings = {
      shakeEnabled: true,
      audioEnabled: true
    };

    // Game Core State
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER, LEVELCOMPLETE
    this.score = 0;
    this.highScore = 0;
    this.levelIndex = 0;
    this.lives = 3;
    
    // Streaks / Multipliers
    this.streakCount = 0;
    this.multiplier = 1.0;

    // Entities
    this.paddle = null;
    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.alerts = []; // floating score numbers or powerup notifications

    // Interaction Inputs
    this.keys = {};
    this.mouse = { x: this.width / 2 };

    // Screen Shake state
    this.shakeDuration = 0;
    this.shakeMagnitude = 0;

    // Setup input listeners
    this.initInputs();
  }

  /**
   * Key and Mouse Listeners
   */
  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
      
      // Pause actions
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'PLAYING') {
          this.pause();
        } else if (this.state === 'PAUSED') {
          this.resume();
        }
      }
      
      // Launch Ball on space
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); // Stop page scroll
        this.triggerSpaceAction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });

    // Tracking mouse/touch on canvas wrapper for responsive controls
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Calculate coordinates relative to canvas internal scaling
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * this.width;
    });

    // Touch Support
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * this.width;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.state === 'PLAYING' && e.touches.length > 0) {
        this.triggerSpaceAction();
      }
    });
  }

  triggerSpaceAction() {
    // Launch attached balls
    let launched = false;
    this.balls.forEach(ball => {
      if (ball.attached) {
        ball.attached = false;
        ball.vy = -ball.speed;
        ball.vx = (Math.random() * 2 - 1) * 2; // slight angle
        launched = true;
      }
    });

    // Shoot lasers if active
    if (this.paddle && this.paddle.laserDuration > 0) {
      this.fireLasers();
    }
  }

  /**
   * Initializes or loads a specific Level index
   */
  loadLevel(idx) {
    this.levelIndex = Math.min(LEVELS.length - 1, Math.max(0, idx));
    const levelData = LEVELS[this.levelIndex];
    
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.alerts = [];

    // Reset paddle modifiers
    this.initPaddle();

    // Reset ball
    this.balls = [];
    this.resetBall();

    // Map brick structure
    const layout = levelData.grid;
    const rows = layout.length;
    const cols = layout[0].length;
    
    const spacing = 6;
    const topMargin = 50;
    const bottomMargin = 220; // safe space for paddle
    
    // Auto-calculate brick size dynamically to fit canvas bounds
    const availableWidth = this.width - (cols + 1) * spacing;
    const brickW = availableWidth / cols;
    const brickH = 18;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = layout[r][c];
        if (hp > 0) {
          const bx = spacing + c * (brickW + spacing);
          const by = topMargin + r * (brickH + spacing);
          this.bricks.push({
            id: `b-${r}-${c}`,
            x: bx,
            y: by,
            w: brickW,
            h: brickH,
            maxHp: hp,
            hp: hp,
            colorData: BRICK_COLORS[hp] || BRICK_COLORS[1]
          });
        }
      }
    }

    this.streakCount = 0;
    this.multiplier = 1.0;
    this.updateHud();
  }

  initPaddle() {
    this.paddle = {
      x: this.width / 2 - 45,
      y: this.height - 24,
      w: 90,
      h: 12,
      baseW: 90,
      speed: 8,
      laserDuration: 0,
      stickyDuration: 0,
      shieldActive: false,
      lastLaserShot: 0
    };
  }

  resetBall() {
    this.balls = [{
      x: this.width / 2,
      y: this.height - 38,
      r: 6,
      vx: 0,
      vy: 0,
      speed: 4.8,
      baseSpeed: 4.8,
      attached: true,
      trail: [],
      maxTrailLength: 12,
      isSuper: false // if super ball, tears through bricks without bouncing
    }];
  }

  /**
   * Action triggers
   */
  startNewGame() {
    this.score = 0;
    this.lives = 3;
    this.state = 'PLAYING';
    this.loadLevel(0);
    if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
  }

  selectLevelAndStart(idx) {
    this.score = 0;
    this.lives = 3;
    this.state = 'PLAYING';
    this.loadLevel(idx);
    if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
    }
  }

  pause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
    }
  }

  triggerScreenShake(magnitude, duration) {
    if (this.settings.shakeEnabled) {
      this.shakeMagnitude = magnitude;
      this.shakeDuration = duration;
    }
  }

  /**
   * Fire Laser beams
   */
  fireLasers() {
    const now = Date.now();
    // Throttle lasers to once every 250ms
    if (now - this.paddle.lastLaserShot < 250) return;
    this.paddle.lastLaserShot = now;

    // Play laser sound
    if (window.soundSynth) window.soundSynth.playLaser();

    // Spawns two lasers at the left and right edge of the paddle
    const laserSpeed = 6;
    this.lasers.push({
      x: this.paddle.x + 4,
      y: this.paddle.y - 8,
      w: 3,
      h: 10,
      vy: -laserSpeed
    });
    this.lasers.push({
      x: this.paddle.x + this.paddle.w - 7,
      y: this.paddle.y - 8,
      w: 3,
      h: 10,
      vy: -laserSpeed
    });
  }

  /**
   * Activate a power-up effect
   */
  activatePowerup(type) {
    if (!this.paddle) return;
    
    // Add floating feedback alert
    this.addFloatingAlert(POWERUP_TYPES[type].name, this.paddle.x + this.paddle.w/2, this.paddle.y - 15, POWERUP_TYPES[type].color);

    if (window.soundSynth) window.soundSynth.playPowerup();

    switch (type) {
      case 'MULTI':
        // Spawn 2 extra balls from the location of the first active ball
        if (this.balls.length > 0) {
          const mainBall = this.balls[0];
          for (let i = 0; i < 2; i++) {
            const angle = (Math.random() * 2 - 1) * 0.5; // slight left/right offsets
            this.balls.push({
              x: mainBall.x,
              y: mainBall.y,
              r: mainBall.r,
              vx: mainBall.speed * Math.sin(angle + (i === 0 ? -0.4 : 0.4)),
              vy: -Math.abs(mainBall.speed * Math.cos(angle + (i === 0 ? -0.4 : 0.4))),
              speed: mainBall.speed,
              baseSpeed: mainBall.baseSpeed,
              attached: false,
              trail: [],
              maxTrailLength: 12,
              isSuper: false
            });
          }
        }
        break;

      case 'LASER':
        this.paddle.laserDuration = 8000; // 8 seconds of shooting power
        break;

      case 'WIDE':
        this.paddle.w = this.paddle.baseW * 1.5;
        // Keep paddle bounded on scaling up
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));
        
        // Reset timer if already wide
        clearTimeout(this.wideTimer);
        this.wideTimer = setTimeout(() => {
          if (this.paddle) this.paddle.w = this.paddle.baseW;
        }, 10000); // 10 seconds duration
        break;

      case 'SHIELD':
        this.paddle.shieldActive = true;
        break;

      case 'SLOW':
        // Slow down all current and future balls for 8 seconds
        this.balls.forEach(ball => {
          ball.speed = ball.baseSpeed * 0.65;
          // Recalculate velocities with new speed
          const angle = Math.atan2(ball.vx, ball.vy);
          ball.vx = ball.speed * Math.sin(angle);
          ball.vy = ball.speed * Math.cos(angle);
        });

        clearTimeout(this.slowTimer);
        this.slowTimer = setTimeout(() => {
          this.balls.forEach(ball => {
            ball.speed = ball.baseSpeed;
            const angle = Math.atan2(ball.vx, ball.vy);
            ball.vx = ball.speed * Math.sin(angle);
            ball.vy = ball.speed * Math.cos(angle);
          });
        }, 8000); // 8 seconds slow motion
        break;
    }
  }

  /**
   * Spawns particle blast on brick shatter
   */
  spawnParticles(x, y, color) {
    const count = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        color: color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  addFloatingAlert(text, x, y, color) {
    this.alerts.push({
      text: text,
      x: x,
      y: y,
      vy: -0.8,
      color: color || '#fff',
      alpha: 1.0,
      life: 1.0,
      decay: 0.025
    });
  }

  /**
   * Main game physics step
   */
  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Handle screen shake timer decrement
    if (this.shakeDuration > 0) {
      this.shakeDuration -= 16; // rough ms step
    }

    // 1. Move Paddle via keyboard inputs
    let paddleMove = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      paddleMove = -this.paddle.speed;
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      paddleMove = this.paddle.speed;
    }

    if (paddleMove !== 0) {
      this.paddle.x += paddleMove;
    } else {
      // Direct tracking of mouse/touch pointer (smooth damping)
      const targetX = this.mouse.x - this.paddle.w / 2;
      this.paddle.x += (targetX - this.paddle.x) * 0.25;
    }

    // Constrain paddle to canvas screen boundaries
    this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.w, this.paddle.x));

    // Decrement powerup timers
    if (this.paddle.laserDuration > 0) {
      this.paddle.laserDuration -= 16;
    }

    // 2. Update Lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.y += laser.vy;

      // Check collision with bricks
      let hit = false;
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const brick = this.bricks[j];
        if (laser.x > brick.x && laser.x < brick.x + brick.w &&
            laser.y > brick.y && laser.y < brick.y + brick.h) {
          
          this.damageBrick(brick, j);
          hit = true;
          break;
        }
      }

      if (hit || laser.y < 0) {
        this.lasers.splice(i, 1);
      }
    }

    // 3. Update Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.y += pu.vy;

      // Check collision with Paddle
      if (pu.y + pu.r > this.paddle.y && pu.y - pu.r < this.paddle.y + this.paddle.h &&
          pu.x + pu.r > this.paddle.x && pu.x - pu.r < this.paddle.x + this.paddle.w) {
        
        this.activatePowerup(pu.type);
        this.powerups.splice(i, 1);
        continue;
      }

      // Fall off bottom screen
      if (pu.y - pu.r > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    // 4. Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      // Store trail history
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > ball.maxTrailLength) {
        ball.trail.shift();
      }

      if (ball.attached) {
        // Keep ball centered on paddle if not launched
        ball.x = this.paddle.x + this.paddle.w / 2;
        ball.y = this.paddle.y - ball.r - 2;
        continue;
      }

      // Physical move
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Bounce off walls
      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx = -ball.vx;
        if (window.soundSynth) window.soundSynth.playBounce();
      } else if (ball.x + ball.r > this.width) {
        ball.x = this.width - ball.r;
        ball.vx = -ball.vx;
        if (window.soundSynth) window.soundSynth.playBounce();
      }

      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy = -ball.vy;
        if (window.soundSynth) window.soundSynth.playBounce();
      }

      // Ball falls off bottom floor
      if (ball.y + ball.r > this.height) {
        if (this.paddle.shieldActive) {
          // Bounce off bottom shield barrier
          ball.y = this.height - ball.r - 8;
          ball.vy = -Math.abs(ball.vy);
          this.paddle.shieldActive = false; // consume shield
          this.triggerScreenShake(8, 200);
          if (window.soundSynth) window.soundSynth.playPaddleBounce();
          this.addFloatingAlert("SHIELD BROKEN", this.width / 2, this.height - 25, "#00ffff");
        } else {
          // Remove this ball
          this.balls.splice(i, 1);
          
          // Check if all balls are lost
          if (this.balls.length === 0) {
            this.handleLifeLost();
            return;
          }
          continue;
        }
      }

      // Paddle bounce logic
      if (ball.vy > 0 &&
          ball.y + ball.r >= this.paddle.y &&
          ball.y - ball.r <= this.paddle.y + this.paddle.h &&
          ball.x >= this.paddle.x &&
          ball.x <= this.paddle.x + this.paddle.w) {
        
        // Push ball out of paddle bounding box to prevent glitchy sticking
        ball.y = this.paddle.y - ball.r;
        
        // Deflection angle mapping: where on paddle did it land?
        const paddleCenter = this.paddle.x + this.paddle.w / 2;
        let relativeHit = (ball.x - paddleCenter) / (this.paddle.w / 2);
        relativeHit = Math.max(-1.0, Math.min(1.0, relativeHit)); // clamp

        // Map relative offset to max 65 degree bounce angle
        const maxAngle = 65 * (Math.PI / 180); 
        const bounceAngle = relativeHit * maxAngle;

        // Apply new velocity vector
        ball.vx = ball.speed * Math.sin(bounceAngle);
        ball.vy = -ball.speed * Math.cos(bounceAngle);

        if (window.soundSynth) window.soundSynth.playPaddleBounce();
        this.triggerScreenShake(3, 100);
      }

      // Ball to Brick collision
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const brick = this.bricks[j];
        if (this.checkBallBrickCollision(ball, brick)) {
          // Damage and destroy handling
          this.damageBrick(brick, j);

          // Reverse ball velocity based on hit side (if not super ball)
          if (!ball.isSuper) {
            this.resolveBallBrickBounce(ball, brick);
          }

          // Streak combo builder
          this.streakCount++;
          if (this.streakCount > 0 && this.streakCount % 4 === 0) {
            this.multiplier = Math.min(5.0, this.multiplier + 0.5);
            this.updateHud();
            this.addFloatingAlert(`COMBO x${this.multiplier}`, ball.x, brick.y - 10, varColorForMultiplier(this.multiplier));
          }
          break; // only hit one brick per frame
        }
      }
    }

    // 5. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.r -= 0.05;

      if (p.alpha <= 0 || p.r <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 6. Update Floating Alerts
    for (let i = this.alerts.length - 1; i >= 0; i--) {
      const alert = this.alerts[i];
      alert.y += alert.vy;
      alert.alpha -= alert.decay;

      if (alert.alpha <= 0) {
        this.alerts.splice(i, 1);
      }
    }

    // Win condition check
    if (this.bricks.length === 0) {
      this.handleLevelClear();
    }
  }

  /**
   * Applies damage to a brick
   */
  damageBrick(brick, index) {
    brick.hp--;
    
    // Screen shake trigger on hit
    this.triggerScreenShake(5, 120);

    if (brick.hp <= 0) {
      // Remove brick
      this.bricks.splice(index, 1);
      this.spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, brick.colorData.fill);
      
      // Calculate score points with combo multiplier
      const pointsEarned = Math.floor(brick.colorData.score * this.multiplier);
      this.score += pointsEarned;
      this.updateHud();

      // Add float score alert
      this.addFloatingAlert(`+${pointsEarned}`, brick.x + brick.w/2 - 10, brick.y, brick.colorData.fill);

      if (window.soundSynth) window.soundSynth.playBrickBreak(brick.maxHp > 2);

      // Random Powerup drop (18% probability)
      if (Math.random() < 0.18) {
        this.spawnPowerup(brick.x + brick.w/2, brick.y + brick.h);
      }
    } else {
      // Color shifts darker as health drops
      brick.colorData = BRICK_COLORS[brick.hp] || brick.colorData;
      this.spawnParticles(brick.x + brick.w/2, brick.y + brick.h/2, "#ffffff");
      if (window.soundSynth) window.soundSynth.playBounce();
    }
  }

  spawnPowerup(x, y) {
    const types = Object.keys(POWERUP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      type: randomType,
      x: x,
      y: y,
      r: 10,
      vy: 1.8
    });
  }

  /**
   * Checks collision overlaps between circular Ball and rectangle Brick
   */
  checkBallBrickCollision(ball, brick) {
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
    
    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (ball.r * ball.r);
  }

  /**
   * Decides which side the ball collided to flip correct coordinate vector
   */
  resolveBallBrickBounce(ball, brick) {
    // Find absolute bounds overlaps
    const leftDist = Math.abs((brick.x) - ball.x);
    const rightDist = Math.abs((brick.x + brick.w) - ball.x);
    const topDist = Math.abs((brick.y) - ball.y);
    const bottomDist = Math.abs((brick.y + brick.h) - ball.y);

    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

    if (minDist === topDist) {
      ball.y = brick.y - ball.r;
      ball.vy = -Math.abs(ball.vy);
    } else if (minDist === bottomDist) {
      ball.y = brick.y + brick.h + ball.r;
      ball.vy = Math.abs(ball.vy);
    } else if (minDist === leftDist) {
      ball.x = brick.x - ball.r;
      ball.vx = -Math.abs(ball.vx);
    } else {
      ball.x = brick.x + brick.w + ball.r;
      ball.vx = Math.abs(ball.vx);
    }
  }

  /**
   * Game states transitions
   */
  handleLifeLost() {
    this.lives--;
    this.streakCount = 0;
    this.multiplier = 1.0;
    this.updateHud();

    this.triggerScreenShake(12, 350);

    if (this.lives > 0) {
      if (window.soundSynth) window.soundSynth.playLifeLost();
      this.resetBall();
    } else {
      this.state = 'GAMEOVER';
      if (window.soundSynth) window.soundSynth.playGameOver();
      
      // Persist High Scores
      if (this.score > this.highScore) {
        this.highScore = this.score;
        this.saveHighScore();
      }

      if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
    }
  }

  handleLevelClear() {
    this.state = 'LEVELCOMPLETE';
    if (window.soundSynth) window.soundSynth.playLevelComplete();
    
    // Add completion bonus multiplier
    const levelBonus = 1000 * (this.levelIndex + 1);
    this.score += levelBonus;
    this.updateHud();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
  }

  nextLevel() {
    if (this.levelIndex < LEVELS.length - 1) {
      this.state = 'PLAYING';
      this.loadLevel(this.levelIndex + 1);
      if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
    } else {
      // Completed last level! Loop back to start or call finished
      this.state = 'GAMEOVER';
      if (this.callbacks.onStateChange) this.callbacks.onStateChange(this.state);
    }
  }

  /**
   * Persists High scores locally
   */
  saveHighScore() {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'cyber_high_score': this.highScore });
    } else {
      localStorage.setItem('cyber_high_score', this.highScore);
    }
  }

  /**
   * Syncs scores and lives display to popup DOM HUD
   */
  updateHud() {
    if (this.callbacks.onHudUpdate) {
      this.callbacks.onHudUpdate({
        score: this.score,
        lives: this.lives,
        multiplier: this.multiplier,
        levelName: LEVELS[this.levelIndex].name
      });
    }
  }

  /**
   * Core draw/render frames
   */
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply Screenshake translation matrix
    this.ctx.save();
    if (this.shakeDuration > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeMagnitude;
      const shakeY = (Math.random() - 0.5) * this.shakeMagnitude;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Draw glowing background grid lines
    this.drawGridBackground();

    // 2. Draw Net Shield if active
    if (this.paddle && this.paddle.shieldActive) {
      this.ctx.strokeStyle = '#00ffff';
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = '#00ffff';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.height - 4);
      this.ctx.lineTo(this.width, this.height - 4);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset
    }

    // 3. Draw Bricks
    this.bricks.forEach(brick => {
      this.drawBrick(brick);
    });

    // 4. Draw Lasers
    this.lasers.forEach(laser => {
      this.ctx.fillStyle = '#ff003c';
      this.ctx.shadowColor = '#ff003c';
      this.ctx.shadowBlur = 8;
      this.ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      this.ctx.shadowBlur = 0;
    });

    // 5. Draw Power-ups
    this.powerups.forEach(pu => {
      this.drawPowerup(pu);
    });

    // 6. Draw Ball Trails & Balls
    this.balls.forEach(ball => {
      this.drawBall(ball);
    });

    // 7. Draw Paddle
    if (this.paddle) {
      this.drawPaddle();
    }

    // 8. Draw Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0; // reset alpha

    // 9. Draw Floating score / notification alerts
    this.alerts.forEach(alert => {
      this.ctx.font = 'bold 11px Orbitron';
      this.ctx.fillStyle = alert.color;
      this.ctx.globalAlpha = alert.alpha;
      this.ctx.fillText(alert.text, alert.x, alert.y);
    });
    this.ctx.globalAlpha = 1.0;

    // Restore screen matrix
    this.ctx.restore();
  }

  drawGridBackground() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    const gridSize = 30;
    
    this.ctx.beginPath();
    // vertical
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    // horizontal
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();
  }

  drawBrick(brick) {
    this.ctx.save();
    
    // Glowing neon shadow
    this.ctx.shadowColor = brick.colorData.glow;
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = brick.colorData.fill;
    
    // Draw brick body
    const radius = 3;
    this.ctx.beginPath();
    this.ctx.roundRect(brick.x, brick.y, brick.w, brick.h, radius);
    this.ctx.fill();

    // inner light gradient stroke
    this.ctx.shadowBlur = 0; // disable shadow for stroke
    this.ctx.strokeStyle = brick.colorData.border;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.roundRect(brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2, radius);
    this.ctx.stroke();

    // Health damage overlays (cracks for HP matrix)
    if (brick.maxHp > 1 && brick.hp < brick.maxHp) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      // Draw simulated crack lines depending on hp remaining
      if (brick.hp === 1) {
        this.ctx.moveTo(brick.x + 5, brick.y + 3);
        this.ctx.lineTo(brick.x + brick.w - 8, brick.y + brick.h - 4);
        this.ctx.moveTo(brick.x + brick.w/2, brick.y + 3);
        this.ctx.lineTo(brick.x + brick.w/3, brick.y + brick.h - 3);
      } else {
        this.ctx.moveTo(brick.x + 8, brick.y + 4);
        this.ctx.lineTo(brick.x + brick.w - 12, brick.y + brick.h - 5);
      }
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawBall(ball) {
    this.ctx.save();

    // Draw ball motion trail
    if (!ball.attached && ball.trail.length > 0) {
      ball.trail.forEach((pos, idx) => {
        const opacity = (idx / ball.trail.length) * 0.15;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = opacity;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, ball.r * (0.4 + (idx / ball.trail.length) * 0.6), 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

    this.ctx.globalAlpha = 1.0;
    
    // Draw ball body
    this.ctx.shadowColor = '#ffff00';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  drawPaddle() {
    this.ctx.save();

    const p = this.paddle;
    const radius = 5;

    // Glowing border shadow
    // Set color based on power-up states
    let color = '#00a8ff';
    let glow = '#00f0ff';
    if (p.laserDuration > 0) {
      color = '#ff003c';
      glow = '#ff003c';
    } else if (p.w > p.baseW) {
      color = '#00ff66';
      glow = '#00ff66';
    }

    this.ctx.shadowColor = glow;
    this.ctx.shadowBlur = 12;
    this.ctx.fillStyle = color;

    // Draw paddle base round rectangle
    this.ctx.beginPath();
    this.ctx.roundRect(p.x, p.y, p.w, p.h, radius);
    this.ctx.fill();

    // Add metallic/glassy gradient highlight inside
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.roundRect(p.x + 2, p.y + 2, p.w - 4, p.h / 3, radius - 1);
    this.ctx.fill();

    // Draw active cannon nozzles on edges if laser powerup is loaded
    if (p.laserDuration > 0) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(p.x + 3, p.y - 4, 5, 4);
      this.ctx.fillRect(p.x + p.w - 8, p.y - 4, 5, 4);
    }

    this.ctx.restore();
  }

  drawPowerup(pu) {
    this.ctx.save();

    const config = POWERUP_TYPES[pu.type];
    
    // Draw outer glowing halo
    this.ctx.shadowColor = config.glow;
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = config.color;
    
    this.ctx.beginPath();
    this.ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw letter symbol inside orb
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 9px Orbitron';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(config.label, pu.x, pu.y + 1);

    this.ctx.restore();
  }
}

// Utility function to get streak/combo colors
function varColorForMultiplier(mult) {
  if (mult >= 4.0) return '#ffff00'; // Super streak! Yellow
  if (mult >= 2.5) return '#00f0ff'; // Medium streak! Cyan
  return '#ff007f'; // Start streak. Magenta
}

// Make globally available
window.Game = Game;
