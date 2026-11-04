/* FOX & SERPENT — Main Entry Point
   Initializes all game systems and starts the game loop */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import '../css/style.css';

// Import our modules
import { Engine } from './engine.js';
import { InputHandler } from './input.js';
import { Player } from './player.js';
import { Environment } from './environment.js';
import { AudioManager } from './audio.js';
import { SaveSystem } from './save.js';

// Global game state
const state = {
  initialized: false,
  playing: false,
  paused: false,
  gameOver: false,
  graphicsLevel: 'medium',
  soundEnabled: true,
  health: 100,
  maxHealth: 100,
  treasure: 0,
  score: 0,
  level: 1,
  deltaTime: 0,
  lastTime: 0
};

// Systems
let engine, input, player, environment, audio, save;

// Loading screen elements
const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress');
const loadingText = document.getElementById('loading-text');

// Initialize
async function init() {
  try {
    updateLoading(0, 'Initializing engine...');

    // Create engine
    engine = new Engine('game-container');
    await engine.init();

    updateLoading(15, 'Setting up lighting...');
    engine.setupLighting();

    updateLoading(25, 'Creating environment...');
    environment = new Environment(engine.scene, engine);
    await environment.init();

    updateLoading(40, 'Loading character...');
    player = new Player(engine.scene, engine.camera);
    await player.init();

    updateLoading(55, 'Setting up input...');
    input = new InputHandler(engine.renderer.domElement, player);

    updateLoading(65, 'Initializing audio...');
    audio = new AudioManager();
    await audio.init();

    updateLoading(75, 'Loading save data...');
    save = new SaveSystem();
    save.init();

    updateLoading(90, 'Finalizing...');

    // Hide loading screen
    setTimeout(() => {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        showMainMenu();
      }, 500);
    }, 300);

    updateLoading(100, 'Ready!');

    state.initialized = true;
    window.state = state;

    // Start game loop
    state.lastTime = performance.now();
    requestAnimationFrame(gameLoop);

  } catch (err) {
    console.error('Initialization failed:', err);
    loadingText.textContent = 'Initialization failed: ' + err.message;
    loadingText.style.color = '#ff6b6b';
    const retryBtn = document.getElementById('loading-retry');
    if (retryBtn) retryBtn.classList.remove('hidden');
  }
}

function updateLoading(percent, text) {
  if (loadingProgress) loadingProgress.style.width = percent + '%';
  if (loadingText) loadingText.textContent = text;
}

// Game Loop
function gameLoop(currentTime) {
  if (!state.initialized) return;

  const deltaTime = (currentTime - state.lastTime) / 1000;
  state.deltaTime = Math.min(deltaTime, 0.1);
  state.lastTime = currentTime;

  if (!state.paused && !state.gameOver && state.playing) {
    input.update(state.deltaTime);
    player.update(state.deltaTime);
    environment.update(state.deltaTime);
    audio.update(state.deltaTime);
  }

  engine.render();

  requestAnimationFrame(gameLoop);
}

// Game flow
window.showMainMenu = function() {
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('ui-overlay').style.display = 'flex';
  state.playing = false;
  state.paused = true;
  audio.playMenuMusic();
};

window.startNewGame = function() {
  document.getElementById('main-menu').classList.add('hidden');
  state.playing = true;
  state.paused = false;
  state.gameOver = false;
  state.health = state.maxHealth;
  state.treasure = 0;
  updateHUD();
  environment.resetLevel();
  player.resetPosition();
  audio.playGameMusic();
};

window.loadGame = function() {
  const data = save.load();
  if (data) {
    state.health = data.health || 100;
    state.treasure = data.treasure || 0;
    state.score = data.score || 0;
    updateHUD();
  }
  document.getElementById('main-menu').classList.add('hidden');
  state.playing = true;
  state.paused = false;
  environment.resetLevel();
  player.resetPosition();
  audio.playGameMusic();
};

window.saveGame = function() {
  save.save({
    health: state.health,
    treasure: state.treasure,
    score: state.score,
    level: state.level
  });
  showStatus('Game saved!');
};

window.resumeGame = function() {
  document.getElementById('pause-menu').classList.add('hidden');
  state.paused = false;
};

window.toggleGraphics = function() {
  const levels = ['low', 'medium', 'high', 'ultra'];
  const currentIdx = levels.indexOf(state.graphicsLevel);
  const nextIdx = (currentIdx + 1) % levels.length;
  state.graphicsLevel = levels[nextIdx];
  document.getElementById('graphics-setting').textContent = state.graphicsLevel.charAt(0).toUpperCase() + state.graphicsLevel.slice(1);
  document.getElementById('menu-graphics-setting').textContent = state.graphicsLevel.charAt(0).toUpperCase() + state.graphicsLevel.slice(1);
  environment.setGraphicsLevel(state.graphicsLevel);
  showStatus('Graphics: ' + state.graphicsLevel);
};

window.toggleSound = function() {
  state.soundEnabled = !state.soundEnabled;
  document.getElementById('menu-sound').textContent = state.soundEnabled ? 'On' : 'Off';
  audio.toggleSound(state.soundEnabled);
};

window.showControls = function() {
  showStatus('WASD/Arrows: Move • Mouse: Look • Space: Jump • Click: Attack • E: Interact');
};

window.quitToMenu = function() {
  state.playing = false;
  state.paused = true;
  document.getElementById('pause-menu').classList.add('hidden');
  document.getElementById('game-over-modal').classList.add('hidden');
  showMainMenu();
};

window.restartLevel = function() {
  document.getElementById('game-over-modal').classList.add('hidden');
  startNewGame();
};

window.nextLevel = function() {
  document.getElementById('victory-modal').classList.add('hidden');
  state.level++;
  environment.resetLevel();
  player.resetPosition();
  state.playing = true;
  state.paused = false;
};

window.showGameOver = function(reason) {
  document.getElementById('game-over-reason').textContent = reason || 'Defeated';
  document.getElementById('game-over-modal').classList.remove('hidden');
  state.gameOver = true;
  state.playing = false;
};

window.showVictory = function(text) {
  document.getElementById('victory-text').textContent = text || 'You have prevailed.';
  document.getElementById('victory-modal').classList.remove('hidden');
  state.playing = false;
  state.paused = true;
};

window.showStatus = function(msg) {
  const el = document.getElementById('status-message');
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 3000);
};

function updateHUD() {
  const healthFill = document.getElementById('health-fill');
  if (healthFill) {
    const pct = (state.health / state.maxHealth) * 100;
    healthFill.style.width = Math.max(0, pct) + '%';
  }
  const treasureEl = document.getElementById('treasure-count');
  if (treasureEl) treasureEl.textContent = state.treasure;
}

// Pause on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.playing && !state.gameOver) {
    state.paused = !state.paused;
    document.getElementById('pause-menu').classList.toggle('hidden', !state.paused);
  }
});

// Global error handler — never leave user stuck
window.addEventListener('error', (e) => {
  console.error('Uncaught error:', e.error || e.message);
  const loadingText = document.getElementById('loading-text');
  const retryBtn = document.getElementById('loading-retry');
  if (loadingText && !state.initialized) {
    loadingText.textContent = 'Error: ' + (e.error?.message || e.message);
    loadingText.style.color = '#ff6b6b';
    if (retryBtn) retryBtn.classList.remove('hidden');
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  const loadingText = document.getElementById('loading-text');
  const retryBtn = document.getElementById('loading-retry');
  if (loadingText && !state.initialized) {
    loadingText.textContent = 'Error: ' + (e.reason?.message || String(e.reason));
    loadingText.style.color = '#ff6b6b';
    if (retryBtn) retryBtn.classList.remove('hidden');
  }
});

// Start
init();
