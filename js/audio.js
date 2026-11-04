/* FOX & SERPENT — Audio Module
   Web Audio API sound effects and music */

export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.initialized = false;
    this.soundEnabled = true;
    this.musicLoop = null;
    this.currentMusic = null;
  }

  async init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.audioContext.destination);

      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = 0.4;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      console.log('Audio system initialized');
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  }

  ensureContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = enabled ? 0.7 : 0;
    }
    if (enabled) {
      this.ensureContext();
    } else {
      this.stopMusic();
    }
  }

  // Procedural sound synthesis (no external audio files needed)

  playTone(frequency, duration, type = 'sine', gain = 0.1, when = 0) {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();

    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime + when);

    gainNode.gain.setValueAtTime(gain, this.audioContext.currentTime + when);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + when + duration);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(this.audioContext.currentTime + when);
    osc.stop(this.audioContext.currentTime + when + duration);
  }

  playFootstep(surface = 'grass') {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();

    // Footstep: low thud with slight noise
    const osc = this.audioContext.createOscillator();
    const noise = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    noise.connect(gainNode);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start();
    noise.start();
    osc.stop(this.audioContext.currentTime + 0.15);
    noise.stop(this.audioContext.currentTime + 0.15);
  }

  playAttack() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(200, 0.1, 'square', 0.15);
    setTimeout(() => this.playTone(150, 0.1, 'square', 0.1), 50);
  }

  playSwordHit() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(300, 0.1, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 0.2, 'sawtooth', 0.1), 50);
  }

  playShootBow() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    // Bow string release
    const osc = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  playJump() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(400, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.1), 50);
  }

  playLand() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(100, 0.2, 'sine', 0.15);
  }

  playTakeDamage() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(150, 0.3, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 0.3, 'sawtooth', 0.15), 100);
  }

  playTreasure() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(800, 0.2, 'sine', 0.15);
    setTimeout(() => this.playTone(1200, 0.2, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(1600, 0.3, 'sine', 0.1), 200);
  }

  playEnemyHit() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(100, 0.3, 'square', 0.2);
  }

  playEnemyDie() {
    if (!this.initialized || !this.soundEnabled) return;
    this.ensureContext();
    this.playTone(200, 0.4, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.1), 100);
  }

  playMenuMusic() {
    this.playMusicLoop('menu');
  }

  playGameMusic() {
    this.playMusicLoop('game');
  }

  playMusicLoop(type) {
    if (!this.initialized || !this.soundEnabled) return;
    this.stopMusic();

    // Procedural ambient music using oscillator loops
    this.currentMusic = type;
    const baseFreq = type === 'menu' ? 220 : 150;

    // Create a slow, evolving ambient pad
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const osc3 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';

    osc1.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime);
    osc3.frequency.setValueAtTime(baseFreq * 2, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(this.musicGain);

    osc1.start();
    osc2.start();
    osc3.start();

    // Store for stopping
    this.musicLoop = { osc1, osc2, osc3, gainNode };

    // Slowly modulate frequencies for ambient feel
    const modulate = () => {
      if (!this.musicLoop || this.musicLoop !== { osc1, osc2, osc3, gainNode }) return;
      const t = this.audioContext.currentTime;
      osc1.frequency.setValueAtTime(baseFreq + Math.sin(t * 0.5) * 10, t);
      osc2.frequency.setValueAtTime(baseFreq * 1.5 + Math.cos(t * 0.3) * 8, t);
      osc3.frequency.setValueAtTime(baseFreq * 2 + Math.sin(t * 0.7) * 6, t);
      requestAnimationFrame(modulate);
    };
    modulate();
  }

  stopMusic() {
    if (this.musicLoop) {
      this.musicLoop.osc1.stop();
      this.musicLoop.osc2.stop();
      this.musicLoop.osc3.stop();
      this.musicLoop = null;
    }
    this.currentMusic = null;
  }

  update(deltaTime) {
    // Audio listener follows camera
    if (this.audioContext && this.audioContext.listener) {
      // Positional audio could be added here
    }
  }

  dispose() {
    this.stopMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default AudioManager;