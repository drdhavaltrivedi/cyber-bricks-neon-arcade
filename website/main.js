/**
 * Cyber-Bricks Website Promotion Controller
 * Manages scrolling effects, landing page widgets, and boots the live canvas sandbox demo.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Scroll Effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.style.background = 'rgba(6, 4, 10, 0.95)';
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
      navbar.style.background = 'rgba(6, 4, 10, 0.7)';
      navbar.style.boxShadow = 'none';
    }
  });

  // 2. Playable Demo Elements
  const canvasElement = document.getElementById('game-canvas');
  const demoOverlayMenu = document.getElementById('demo-menu-overlay');
  
  const overlays = {
    pause: document.getElementById('overlay-pause'),
    gameover: document.getElementById('overlay-gameover'),
    complete: document.getElementById('overlay-complete')
  };

  const buttons = {
    startDemo: document.getElementById('btn-start-demo'),
    resume: document.getElementById('btn-resume-game'),
    quit: document.getElementById('btn-quit-game'),
    restart: document.getElementById('btn-restart-game'),
    nextLevel: document.getElementById('btn-next-level'),
    hudPause: document.getElementById('btn-hud-pause')
  };

  const hud = {
    score: document.getElementById('hud-score-value'),
    multiplier: document.getElementById('hud-multiplier-value'),
    lives: document.getElementById('hud-lives-container')
  };

  const settingsInputs = {
    audio: document.getElementById('chk-audio'),
    shake: document.getElementById('chk-shake')
  };

  // 3. Initialize Game Engine in Demo sandbox mode
  const game = new Game(canvasElement, {
    onStateChange: (state) => {
      handleDemoStateChange(state);
    },
    onHudUpdate: (stats) => {
      handleDemoHudUpdate(stats);
    }
  });

  // Force default audio/shake settings
  game.settings.audioEnabled = settingsInputs.audio.checked;
  game.settings.shakeEnabled = settingsInputs.shake.checked;
  if (window.soundSynth) {
    window.soundSynth.setEnabled(settingsInputs.audio.checked);
    window.soundSynth.setVolume(0.4); // slightly quieter for webpage ambient sound
  }

  // 4. Bind Settings Controls
  settingsInputs.audio.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    game.settings.audioEnabled = enabled;
    if (window.soundSynth) {
      window.soundSynth.setEnabled(enabled);
      if (enabled) {
        window.soundSynth.init();
        window.soundSynth.playBounce();
      }
    }
  });

  settingsInputs.shake.addEventListener('change', (e) => {
    game.settings.shakeEnabled = e.target.checked;
  });

  // 5. Bind Button Actions
  buttons.startDemo.addEventListener('click', () => {
    // Unlock AudioContext
    if (window.soundSynth) window.soundSynth.init();
    
    demoOverlayMenu.classList.remove('active');
    game.startNewGame();
  });

  buttons.hudPause.addEventListener('click', () => {
    if (game.state === 'PLAYING') {
      game.pause();
    }
  });

  buttons.resume.addEventListener('click', () => {
    game.resume();
  });

  buttons.quit.addEventListener('click', () => {
    overlays.pause.classList.remove('active');
    game.state = 'MENU';
    demoOverlayMenu.classList.add('active');
  });

  buttons.restart.addEventListener('click', () => {
    overlays.gameover.classList.remove('active');
    game.startNewGame();
  });

  buttons.nextLevel.addEventListener('click', () => {
    overlays.complete.classList.remove('active');
    game.nextLevel();
  });

  // 6. Handle Game Callback Interventions
  function handleDemoStateChange(state) {
    // Hide all overlay modals
    Object.values(overlays).forEach(ol => ol.classList.remove('active'));

    if (state === 'PAUSED') {
      overlays.pause.classList.add('active');
    } else if (state === 'GAMEOVER') {
      document.getElementById('lbl-over-score').textContent = String(game.score).padStart(6, '0');
      overlays.gameover.classList.add('active');
    } else if (state === 'LEVELCOMPLETE') {
      document.getElementById('lbl-comp-score').textContent = String(game.score).padStart(6, '0');
      overlays.complete.classList.add('active');
    }
  }

  function handleDemoHudUpdate(stats) {
    hud.score.textContent = String(stats.score).padStart(6, '0');
    hud.multiplier.textContent = `x${stats.multiplier.toFixed(1)}`;

    // Populate hearts indicator UI
    hud.lives.innerHTML = '';
    const maxLives = 3;
    for (let i = 0; i < maxLives; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      if (i < stats.lives) {
        heart.classList.add('active');
      }
      hud.lives.appendChild(heart);
    }
  }

  // 7. Live Sandbox Render Frame Loop
  let lastTime = performance.now();
  function demoLoop(time) {
    let dt = time - lastTime;
    if (dt > 100) dt = 16.6; // Throttle background tabs
    lastTime = time;

    // Apply Screenshake container shake CSS class
    if (game.shakeDuration > 0) {
      canvasElement.classList.add('shake-effect');
    } else {
      canvasElement.classList.remove('shake-effect');
    }

    // Only update and draw if we are in an active game state
    // Draw even when paused/gameover to show particles settling down
    if (game.state !== 'MENU') {
      game.update(dt);
      game.draw();
    } else {
      // Draw grid only for menu background
      const ctx = canvasElement.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      ctx.beginPath();
      for (let x = 0; x < canvasElement.width; x += gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvasElement.height);
      }
      for (let y = 0; y < canvasElement.height; y += gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(canvasElement.width, y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(demoLoop);
  }

  // Run the loop
  requestAnimationFrame(demoLoop);
});
