/**
 * Cyber-Bricks Popup Extension Coordinator
 * Manages screen routing, local settings storage, UI events, and hooks the HTML DOM to the Game engine.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Detect view mode (Popup vs Full Tab)
  const urlParams = new URLSearchParams(window.location.search);
  const isTabView = urlParams.get('mode') === 'tab';
  if (isTabView) {
    document.body.classList.add('tab-view');
  }

  // 2. DOM elements selectors
  const panels = {
    menu: document.getElementById('panel-menu'),
    levels: document.getElementById('panel-levels'),
    settings: document.getElementById('panel-settings'),
    howto: document.getElementById('panel-howto'),
    game: document.getElementById('panel-game')
  };

  const menuButtons = {
    play: document.getElementById('btn-play-game'),
    levels: document.getElementById('btn-level-select'),
    howto: document.getElementById('btn-how-to-play'),
    settings: document.getElementById('btn-settings'),
    fullscreen: document.getElementById('btn-fullscreen')
  };

  const backButtons = {
    levels: document.getElementById('btn-levels-back'),
    settings: document.getElementById('btn-settings-back'),
    howto: document.getElementById('btn-howto-back')
  };

  // Settings Panel Inputs
  const settingsInputs = {
    audio: document.getElementById('chk-audio'),
    volume: document.getElementById('rng-volume'),
    volumeLabel: document.getElementById('lbl-volume'),
    shake: document.getElementById('chk-shake'),
    themeMagenta: document.getElementById('btn-theme-magenta'),
    themeAqua: document.getElementById('btn-theme-aqua'),
    themeAmber: document.getElementById('btn-theme-amber'),
    themeEmerald: document.getElementById('btn-theme-emerald')
  };

  // Game HUD selectors
  const hud = {
    score: document.getElementById('hud-score-value'),
    multiplier: document.getElementById('hud-multiplier-value'),
    lives: document.getElementById('hud-lives-container'),
    pause: document.getElementById('btn-hud-pause')
  };

  // Canvas overlays selectors
  const overlays = {
    pause: document.getElementById('overlay-pause'),
    gameover: document.getElementById('overlay-gameover'),
    complete: document.getElementById('overlay-complete')
  };

  const overlayButtons = {
    resume: document.getElementById('btn-resume-game'),
    pauseQuit: document.getElementById('btn-quit-game'),
    restart: document.getElementById('btn-restart-game'),
    gameoverQuit: document.getElementById('btn-gameover-quit'),
    nextLevel: document.getElementById('btn-next-level'),
    completeQuit: document.getElementById('btn-complete-quit')
  };

  // Other DOM components
  const displayHighScore = document.getElementById('display-high-score');
  const levelsGridContainer = document.getElementById('levels-grid-container');
  const canvasElement = document.getElementById('game-canvas');

  // 3. Initialize Game Engine Instance
  const game = new Game(canvasElement, {
    onStateChange: (state) => {
      handleGameStateChange(state);
    },
    onHudUpdate: (stats) => {
      handleHudUpdate(stats);
    }
  });

  // 4. Load saved settings from Chrome storage (with localStorage fallback)
  let userSettings = {
    audioEnabled: true,
    volume: 50,
    shakeEnabled: true,
    theme: 'magenta',
    highScore: 0
  };

  // Helper: Get data from local storage
  async function loadStorageSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['audioEnabled', 'volume', 'shakeEnabled', 'theme', 'cyber_high_score'], (result) => {
          resolve({
            audioEnabled: result.audioEnabled !== undefined ? result.audioEnabled : true,
            volume: result.volume !== undefined ? result.volume : 50,
            shakeEnabled: result.shakeEnabled !== undefined ? result.shakeEnabled : true,
            theme: result.theme !== undefined ? result.theme : 'magenta',
            highScore: result.cyber_high_score !== undefined ? result.cyber_high_score : 0
          });
        });
      });
    } else {
      // Fallback
      return {
        audioEnabled: localStorage.getItem('audioEnabled') !== 'false',
        volume: parseInt(localStorage.getItem('volume') || '50', 10),
        shakeEnabled: localStorage.getItem('shakeEnabled') !== 'false',
        theme: localStorage.getItem('theme') || 'magenta',
        highScore: parseInt(localStorage.getItem('cyber_high_score') || '0', 10)
      };
    }
  }

  // Helper: Save data to local storage
  function saveStorageSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        audioEnabled: userSettings.audioEnabled,
        volume: userSettings.volume,
        shakeEnabled: userSettings.shakeEnabled,
        theme: userSettings.theme
      });
    } else {
      localStorage.setItem('audioEnabled', userSettings.audioEnabled);
      localStorage.setItem('volume', userSettings.volume);
      localStorage.setItem('shakeEnabled', userSettings.shakeEnabled);
      localStorage.setItem('theme', userSettings.theme);
    }
  }

  // Load and apply config
  userSettings = await loadStorageSettings();
  applyLoadedSettings();

  function applyLoadedSettings() {
    // Apply theme to document body
    document.body.className = '';
    document.body.classList.add(`theme-${userSettings.theme}`);
    if (isTabView) {
      document.body.classList.add('tab-view');
    }

    // Set UI settings checkbox states
    settingsInputs.audio.checked = userSettings.audioEnabled;
    settingsInputs.volume.value = userSettings.volume;
    settingsInputs.volumeLabel.textContent = `${userSettings.volume}%`;
    settingsInputs.shake.checked = userSettings.shakeEnabled;

    // Apply active theme tab indicator
    document.querySelectorAll('.theme-opt').forEach(btn => btn.classList.remove('active'));
    const themeBtn = document.getElementById(`btn-theme-${userSettings.theme}`);
    if (themeBtn) themeBtn.classList.add('active');

    // Update settings in synthesizer & game logic
    if (window.soundSynth) {
      window.soundSynth.setEnabled(userSettings.audioEnabled);
      window.soundSynth.setVolume(userSettings.volume / 100);
    }
    game.settings.audioEnabled = userSettings.audioEnabled;
    game.settings.shakeEnabled = userSettings.shakeEnabled;
    game.highScore = userSettings.highScore;

    // Format high score text
    displayHighScore.textContent = String(userSettings.highScore).padStart(6, '0');
  }

  // 5. Panel Routing Navigation
  function switchPanel(targetKey) {
    Object.keys(panels).forEach(key => {
      if (key === targetKey) {
        panels[key].classList.add('active');
      } else {
        panels[key].classList.remove('active');
      }
    });
  }

  // 6. Bind Main Menu Interactions
  menuButtons.play.addEventListener('click', () => {
    // Initiate Web Audio on first tap to prevent browser autoplay block
    if (window.soundSynth) window.soundSynth.init();
    
    switchPanel('game');
    game.startNewGame();
  });

  menuButtons.levels.addEventListener('click', () => {
    populateLevelsGrid();
    switchPanel('levels');
  });

  menuButtons.howto.addEventListener('click', () => {
    switchPanel('howto');
  });

  menuButtons.settings.addEventListener('click', () => {
    switchPanel('settings');
  });

  menuButtons.fullscreen.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime && chrome.runtime.id) {
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?mode=tab') });
    } else {
      window.open(window.location.origin + window.location.pathname + '?mode=tab', '_blank');
    }
  });

  // Bind panel return buttons
  backButtons.levels.addEventListener('click', () => switchPanel('menu'));
  backButtons.howto.addEventListener('click', () => switchPanel('menu'));
  
  backButtons.settings.addEventListener('click', () => {
    saveStorageSettings();
    switchPanel('menu');
  });

  // 7. Bind Config Systems
  settingsInputs.audio.addEventListener('change', (e) => {
    userSettings.audioEnabled = e.target.checked;
    if (window.soundSynth) window.soundSynth.setEnabled(userSettings.audioEnabled);
    game.settings.audioEnabled = userSettings.audioEnabled;
    
    // Play test beep
    if (userSettings.audioEnabled && window.soundSynth) {
      window.soundSynth.playBounce();
    }
  });

  settingsInputs.volume.addEventListener('input', (e) => {
    userSettings.volume = parseInt(e.target.value, 10);
    settingsInputs.volumeLabel.textContent = `${userSettings.volume}%`;
    if (window.soundSynth) window.soundSynth.setVolume(userSettings.volume / 100);
  });

  settingsInputs.shake.addEventListener('change', (e) => {
    userSettings.shakeEnabled = e.target.checked;
    game.settings.shakeEnabled = userSettings.shakeEnabled;
  });

  // Bind Theme selector buttons
  const themes = ['magenta', 'aqua', 'amber', 'emerald'];
  themes.forEach(t => {
    const btn = document.getElementById(`btn-theme-${t}`);
    if (btn) {
      btn.addEventListener('click', () => {
        userSettings.theme = t;
        applyLoadedSettings();
        if (window.soundSynth) window.soundSynth.playBounce();
      });
    }
  });

  // 8. Bind Game HUD Actions & Overlay Interactions
  hud.pause.addEventListener('click', () => {
    if (game.state === 'PLAYING') {
      game.pause();
    }
  });

  overlayButtons.resume.addEventListener('click', () => {
    game.resume();
  });

  overlayButtons.pauseQuit.addEventListener('click', () => {
    game.state = 'MENU';
    displayHighScore.textContent = String(game.highScore).padStart(6, '0');
    switchPanel('menu');
  });

  overlayButtons.restart.addEventListener('click', () => {
    overlays.gameover.classList.remove('active');
    game.startNewGame();
  });

  overlayButtons.gameoverQuit.addEventListener('click', () => {
    overlays.gameover.classList.remove('active');
    game.state = 'MENU';
    displayHighScore.textContent = String(game.highScore).padStart(6, '0');
    switchPanel('menu');
  });

  overlayButtons.nextLevel.addEventListener('click', () => {
    overlays.complete.classList.remove('active');
    game.nextLevel();
  });

  overlayButtons.completeQuit.addEventListener('click', () => {
    overlays.complete.classList.remove('active');
    game.state = 'MENU';
    displayHighScore.textContent = String(game.highScore).padStart(6, '0');
    switchPanel('menu');
  });

  // 9. Manage Game States Transitions
  function handleGameStateChange(state) {
    // Hide all overlays first
    Object.values(overlays).forEach(ol => ol.classList.remove('active'));

    if (state === 'PAUSED') {
      overlays.pause.classList.add('active');
    } else if (state === 'GAMEOVER') {
      document.getElementById('lbl-over-score').textContent = String(game.score).padStart(6, '0');
      document.getElementById('lbl-over-level').textContent = LEVELS[game.levelIndex].name;
      overlays.gameover.classList.add('active');
    } else if (state === 'LEVELCOMPLETE') {
      document.getElementById('lbl-comp-multiplier').textContent = `x${game.multiplier.toFixed(1)}`;
      document.getElementById('lbl-comp-score').textContent = String(game.score).padStart(6, '0');
      overlays.complete.classList.add('active');
    }
  }

  function handleHudUpdate(stats) {
    hud.score.textContent = String(stats.score).padStart(6, '0');
    hud.multiplier.textContent = `x${stats.multiplier.toFixed(1)}`;
    
    // Animate color flash based on combo tier
    if (stats.multiplier >= 4.0) {
      hud.multiplier.className = 'hud-val glow-txt theme-emerald';
    } else if (stats.multiplier >= 2.5) {
      hud.multiplier.className = 'hud-val glow-txt theme-aqua';
    } else {
      hud.multiplier.className = 'hud-val glow-txt';
    }

    // Populate lives hearts
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

  // 10. Generate Level Select Grid Cards
  function populateLevelsGrid() {
    levelsGridContainer.innerHTML = '';
    
    LEVELS.forEach((level, idx) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      
      // Lock level check (must complete preceding level or it's level 0)
      // Since this is a client-side game, we allow users to unlock levels that are lower or equal to max unlocked
      // To keep it simple, let's allow playing any level, but label locked levels based on a mock high-level tracker.
      // Let's actually store 'unlocked_level_index' in storage to persist level unlocks.
      // This is a premium progression feature!
      const maxUnlocked = parseInt(localStorage.getItem('max_unlocked_level') || '0', 10);
      const isLocked = idx > maxUnlocked;

      if (isLocked) {
        card.classList.add('locked');
      }

      const num = document.createElement('span');
      num.className = 'level-num';
      num.textContent = `SECTOR ${String(idx + 1).padStart(2, '0')}`;
      card.appendChild(num);

      const name = document.createElement('span');
      name.className = 'level-name';
      name.textContent = level.name;
      card.appendChild(name);

      // Create a visual grid thumbnail mini-preview
      const preview = document.createElement('div');
      preview.className = 'level-preview';
      
      if (!isLocked) {
        // Draw miniature blocks representation
        const brickLayout = level.grid;
        // Limit preview rows and cols to fit
        const rows = Math.min(4, brickLayout.length);
        const cols = Math.min(8, brickLayout[0].length);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const brickHp = brickLayout[r][c];
            if (brickHp > 0) {
              const previewBrick = document.createElement('span');
              previewBrick.className = 'preview-brick';
              previewBrick.style.backgroundColor = (BRICK_COLORS[brickHp] || BRICK_COLORS[1]).fill;
              preview.appendChild(previewBrick);
            }
          }
        }
      }
      card.appendChild(preview);

      const diff = document.createElement('span');
      diff.className = 'level-difficulty';
      diff.textContent = level.difficulty;
      card.appendChild(diff);

      // Card click action
      card.addEventListener('click', () => {
        if (isLocked) {
          if (window.soundSynth) window.soundSynth.playLifeLost();
          // Shake card
          card.classList.add('shake-effect');
          setTimeout(() => card.classList.remove('shake-effect'), 300);
          return;
        }
        
        if (window.soundSynth) window.soundSynth.init();
        switchPanel('game');
        game.selectLevelAndStart(idx);
      });

      levelsGridContainer.appendChild(card);
    });
  }

  // Level unlock progression helper
  // If a level is cleared, we increment the unlock index in localStorage
  game.callbacks.onLevelClear = (completedIndex) => {
    const currentMax = parseInt(localStorage.getItem('max_unlocked_level') || '0', 10);
    if (completedIndex >= currentMax && completedIndex < LEVELS.length - 1) {
      localStorage.setItem('max_unlocked_level', completedIndex + 1);
    }
  };

  // Overwrite game nextLevel handling to unlock next sector
  const originalNextLevel = game.nextLevel.bind(game);
  game.nextLevel = () => {
    const currentMax = parseInt(localStorage.getItem('max_unlocked_level') || '0', 10);
    if (game.levelIndex >= currentMax && game.levelIndex < LEVELS.length - 1) {
      localStorage.setItem('max_unlocked_level', game.levelIndex + 1);
    }
    originalNextLevel();
  };

  // 11. Animation Render Loop Runner
  let lastTime = performance.now();
  function animationLoop(time) {
    let dt = time - lastTime;
    
    // Prevent huge jumps (e.g. background tab switching back)
    if (dt > 100) dt = 16.6;
    lastTime = time;

    // Process canvas screenshake class (for UI container)
    if (game.shakeDuration > 0) {
      canvasElement.classList.add('shake-effect');
    } else {
      canvasElement.classList.remove('shake-effect');
    }

    game.update(dt);
    game.draw();

    requestAnimationFrame(animationLoop);
  }

  // Boot animation frame loop
  requestAnimationFrame(animationLoop);
});
