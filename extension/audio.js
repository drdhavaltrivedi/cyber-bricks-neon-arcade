/**
 * Cyber-Bricks Sound Synthesizer
 * Uses Web Audio API to programmatically generate retro synth sound effects.
 * Avoids the need for external audio files, making the extension super lightweight and offline-friendly.
 */
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.volume = 0.5; // 0.0 to 1.0
    this.enabled = true;
    this.noiseBuffer = null;
  }

  /**
   * Initializes the AudioContext (must be triggered by a user interaction like a click).
   */
  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      
      this.noiseBuffer = this.createNoiseBuffer();
      this.updateVolume();
    } catch (error) {
      console.error("Web Audio API is not supported in this browser context:", error);
    }
  }

  /**
   * Generates white noise buffer used for explosion sound effects.
   */
  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.4; // 0.4 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  updateVolume() {
    if (this.masterGain && this.ctx) {
      // Smoothly transition volume setting
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.updateVolume();
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    this.updateVolume();
  }

  /**
   * Plays a simple retro sine beep when the ball bounces off walls.
   */
  playBounce() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, this.ctx.currentTime); // Middle C-ish
    
    // Quick frequency bend
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  /**
   * Plays a lower, punchier triangle note when the ball bounces off the paddle.
   */
  playPaddleBounce() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  /**
   * Plays a dual sound (synthesized explosion + pitch drop) when a brick is shattered.
   */
  playBrickBreak(isSpecial = false) {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    
    // 1. Synthesized tone drop
    const osc = this.ctx.createOscillator();
    const gainTone = this.ctx.createGain();
    
    osc.type = isSpecial ? 'square' : 'triangle';
    const startFreq = isSpecial ? 500 : 380;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gainTone.gain.setValueAtTime(isSpecial ? 0.35 : 0.25, now);
    gainTone.gain.exponentialRampToValueAtTime(0.005, now + 0.16);

    osc.connect(gainTone);
    gainTone.connect(this.masterGain);
    
    osc.start();
    osc.stop(now + 0.17);

    // 2. White noise burst for the crunchy explosion
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isSpecial ? 1200 : 700, now);
      filter.Q.setValueAtTime(3.0, now);

      const gainNoise = this.ctx.createGain();
      gainNoise.gain.setValueAtTime(isSpecial ? 0.25 : 0.15, now);
      gainNoise.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

      noiseSource.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(this.masterGain);

      noiseSource.start();
      noiseSource.stop(now + 0.22);
    }
  }

  /**
   * Plays a classic downward pitch-sweep laser sound.
   */
  playLaser() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.13);

    // Add highpass filter to make it sound laser-y rather than just buzzing
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  /**
   * Plays an upbeat, ascending major arpeggio when a powerup is caught.
   */
  playPowerup() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const noteDuration = 0.06;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteDuration);

      gain.gain.setValueAtTime(0, now + idx * noteDuration);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * noteDuration + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx + 1.2) * noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * noteDuration);
      osc.stop(now + (idx + 1.5) * noteDuration);
    });
  }

  /**
   * Plays a warning warning sound when lives are lost.
   */
  playLifeLost() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const notes = [220, 180]; // A3, F#3
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.25, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.13);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.14);
    });
  }

  /**
   * Plays a dramatic, descending game over tune.
   */
  playGameOver() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    const duration = 0.8;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(50, now + duration);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    // Apply lowpass sweep to make it sound like it's powering down
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(100, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(now + duration + 0.05);
  }

  /**
   * Plays a triumphant, fast arpeggio when a level is completed.
   */
  playLevelComplete() {
    this.init();
    if (!this.ctx || !this.enabled) return;

    const now = this.ctx.currentTime;
    // Major chord sweep C5 -> E5 -> G5 -> C6 -> E6 -> G6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const step = 0.05;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);

      gain.gain.setValueAtTime(0, now + idx * step);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * step + 0.01);
      
      // Sustain the last note longer
      const dec = (idx === notes.length - 1) ? 0.35 : 0.08;
      gain.gain.exponentialRampToValueAtTime(0.005, now + idx * step + dec);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * step);
      osc.stop(now + idx * step + dec + 0.02);
    });
  }
}

// Make globally available
window.soundSynth = new SoundSynth();
