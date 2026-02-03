import { CONFIG } from './config.js';
import { getSpawnIntervalMs, getFallSpeedMultiplier } from './difficulty.js';
import { drawCannons, drawAimPreview, updateCannonFromMouse } from './cannons.js';
import { spawnBullet, updateBullets, drawBullets } from './bullets.js';
import { spawnItem, updateItems, drawItems, checkDangerLine } from './items.js';
import { checkCollisions } from './collision.js';
import { drawBackground, drawParticles, getScreenShakeOffset, drawHitFlash, drawComboMeter, updateParticles, drawNeonText } from './effects.js';
import { getLeaderboard, saveScore } from './leaderboard.js';
import { playShoot, playHit, playMiss, playLoss, playBomb, playBulletTime, startBackgroundMusic } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');

function fillLeaderboardList(listEl, scores) {
  if (!listEl) return;
  const list = Array.isArray(scores) ? scores : getLeaderboard();
  listEl.innerHTML = list.length
    ? list.map((score, i) => `<li>${i + 1}. ${score.toLocaleString()}</li>`).join('')
    : '<li>No scores yet</li>';
}

const backgroundImage = new Image();
backgroundImage.src = 'img/background.png';

function createState() {
  return {
    turretAngle: 90,
    bullets: [],
    items: [],
    muzzleFlash: 0,
    lastSpawnTime: 0,
    started: false,
    gameOver: false,
    fallSpeed: CONFIG.BASE_FALL_SPEED,
    timeScale: 1,
    // Phase 2 will use these
    lives: 3,
    score: 0,
    streak: 0,
    justHit: false,
    lastHitScore: 0,
    missThisFrame: false,
    popupText: '',
    popupUntil: 0,
    startTime: 0,
    shields: 0,
    bulletTimeUntil: 0,
    screenShakeUntil: 0,
    gameOverScoreSaved: false,
  };
}

let state = createState();

function resize() {
  const container = document.getElementById('game-container');
  const scale = Math.min(container.clientWidth / CONFIG.W, container.clientHeight / CONFIG.H);
  canvas.style.width = CONFIG.W * scale + 'px';
  canvas.style.height = CONFIG.H * scale + 'px';
}

function handleInput() {
  const keyAngleStep = 3;
  if (state.gameOver) return;

  if (state.keys?.KeyA) state.turretAngle = Math.max(CONFIG.TURRET_ANGLE_MIN, state.turretAngle - keyAngleStep);
  if (state.keys?.KeyD) state.turretAngle = Math.min(CONFIG.TURRET_ANGLE_MAX, state.turretAngle + keyAngleStep);

  if (state.keys?.KeyS || state.keys?.Space) {
    if (!state.shootHeld) {
      spawnBullet(state);
      playShoot();
    }
    state.shootHeld = true;
  } else {
    state.shootHeld = false;
  }
}

let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (!state.started) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (state.gameOver) {
    draw(state);
    requestAnimationFrame(gameLoop);
    return;
  }

  handleInput();

  const now = performance.now() / 1000;
  const elapsedSec = state.startTime ? now - state.startTime : 0;
  const spawnIntervalSec = getSpawnIntervalMs(elapsedSec) / 1000;
  if (now - state.lastSpawnTime >= spawnIntervalSec) {
    spawnItem(state);
    state.lastSpawnTime = now;
  }

  state.fallSpeed = CONFIG.BASE_FALL_SPEED * getFallSpeedMultiplier(elapsedSec);
  state.timeScale = state.bulletTimeUntil > performance.now() ? 0.3 : 1;

  state.hitsThisFrame = [];
  const timeScale = state.timeScale;
  updateItems(state, dt * timeScale);
  updateBullets(state, dt * timeScale);
  checkCollisions(state);

  state.missThisFrame = false;
  if (checkDangerLine(state)) {
    state.missThisFrame = true;
    if (state.shields > 0) {
      state.shields--;
    } else {
      state.lives--;
      playLoss();
      if (state.lives <= 0) state.gameOver = true;
    }
    state.streak = 0;
  }

  if ((state.hitsThisFrame || []).length > 0) {
    state.hitFlashUntil = performance.now() + 120;
  }
  for (const hit of state.hitsThisFrame || []) {
    if (hit.effect === 'clear') {
      playBomb();
      continue;
    }
    if (hit.effect === 'streakReset') {
      state.streak = 0;
      state.popupText = 'Streak broken!';
      state.popupUntil = performance.now() + 600;
      continue;
    }
    if (hit.effect === 'decoy' && hit.wrongCannon) {
      state.streak = 0;
      state.popupText = 'Wrong shot!';
      state.popupUntil = performance.now() + 600;
      continue;
    }
    if (hit.effect === 'bulletTime') playBulletTime();
    state.streak++;
    const mult = 1 + Math.floor(state.streak / 5);
    state.score += (hit.points ?? 10) * mult;
    if (state.streak > 0 && state.streak % 5 === 0) {
      state.popupText = 'Perfect!';
      state.popupUntil = performance.now() + 800;
    }
  }
  if (state.missThisFrame) {
    state.popupText = 'Miss!';
    state.popupUntil = performance.now() + 800;
    playMiss();
  }
  if ((state.hitsThisFrame || []).length > 0 && !state.missThisFrame) {
    playHit();
  }

  state.muzzleFlash = Math.max(0, (state.muzzleFlash ?? 0) - 0.25);
  updateParticles(state);

  draw(state);
  requestAnimationFrame(gameLoop);
}

function draw(state) {
  const w = CONFIG.W;
  const h = CONFIG.H;

  if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    ctx.drawImage(backgroundImage, 0, 0, w, h);
  } else {
    drawBackground(ctx);
    drawParticles(ctx);
  }

  const shake = getScreenShakeOffset(state);
  ctx.save();
  ctx.translate(shake.x, shake.y);

  drawItems(ctx, state);
  drawBullets(ctx, state);
  drawCannons(ctx, state);
  drawAimPreview(ctx, state);

  ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.DANGER_LINE_Y);
  ctx.lineTo(w, CONFIG.DANGER_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();

  drawHitFlash(ctx, state);
  drawComboMeter(ctx, state);

  const rightX = CONFIG.W - 24;
  const livesStr = '♥'.repeat(state.lives ?? 3);
  drawNeonText(ctx, livesStr, 20, 32, '900 22px Orbitron, sans-serif', 'left', true);
  if ((state.shields ?? 0) > 0) {
    drawNeonText(ctx, '🛡 ' + state.shields, 20, 58, '900 20px Orbitron, sans-serif', 'left', true);
  }
  if (state.started && !state.gameOver && state.startTime) {
    const sec = Math.floor(performance.now() / 1000 - state.startTime);
    drawNeonText(ctx, sec + 's', CONFIG.W / 2, 32, '900 22px Orbitron, sans-serif', 'center', true);
  }
  drawNeonText(ctx, 'SCORE ' + (state.score ?? 0).toLocaleString(), rightX, 32, '900 22px Orbitron, sans-serif', 'right', false);
  const mult = 1 + Math.floor((state.streak ?? 0) / 5);
  drawNeonText(ctx, 'x' + mult, rightX, 58, '900 20px Orbitron, sans-serif', 'right', true);
  const topScores = getLeaderboard();
  const topFont = '700 14px Orbitron, sans-serif';
  for (let i = 0; i < topScores.length; i++) {
    drawNeonText(ctx, (i + 1) + '. ' + topScores[i].toLocaleString(), rightX, 84 + i * 18, topFont, 'right', true);
  }
  if (state.popupUntil > performance.now() && state.popupText) {
    ctx.save();
    ctx.font = 'bold 36px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = state.popupText === 'Miss!' ? 'rgba(255, 80, 80, 0.9)' : 'rgba(255, 200, 80, 0.9)';
    ctx.fillStyle = state.popupText === 'Miss!' ? '#f66' : '#ffd700';
    ctx.fillText(state.popupText, CONFIG.W / 2, CONFIG.H / 2 - 80);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.shadowBlur = 0;
  }

  if (state.gameOver) {
    if (!state.gameOverScoreSaved) {
      state.gameOverScoreSaved = true;
      saveScore(state.score);
      gameOverOverlay.classList.remove('hidden');
      const scoreEl = document.getElementById('game-over-score');
      if (scoreEl) scoreEl.textContent = 'SCORE ' + state.score.toLocaleString();
      fillLeaderboardList(document.getElementById('game-over-leaderboard-list'));
    }
  }
}

window.addEventListener('resize', resize);

state.keys = {};
window.addEventListener('keydown', (e) => {
  if (!state.started && e.code !== 'F5') {
    state.started = true;
    state.startTime = performance.now() / 1000;
    startOverlay.classList.add('hidden');
    state.lastSpawnTime = performance.now() / 1000;
    startBackgroundMusic();
  }
  state.keys[e.code] = true;
  if (state.gameOver && (e.code === 'Space' || e.code === 'Enter')) {
    gameOverOverlay.classList.add('hidden');
    state = createState();
    state.started = true;
    state.startTime = performance.now() / 1000;
    state.lastSpawnTime = performance.now() / 1000;
  }
  if (['KeyA', 'KeyD', 'KeyS', 'Space'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => {
  state.keys[e.code] = false;
});

window.addEventListener('mousemove', (e) => {
  if (state.started && !state.gameOver) updateCannonFromMouse(state, e.clientX, e.clientY);
});

window.addEventListener('mousedown', (e) => {
  if (!state.started) {
    state.started = true;
    state.startTime = performance.now() / 1000;
    startOverlay.classList.add('hidden');
    state.lastSpawnTime = performance.now() / 1000;
    startBackgroundMusic();
    return;
  }
  if (state.gameOver) {
    gameOverOverlay.classList.add('hidden');
    state = createState();
    state.started = true;
    state.startTime = performance.now() / 1000;
    state.lastSpawnTime = performance.now() / 1000;
    return;
  }
  spawnBullet(state);
  playShoot();
});

window.addEventListener('mouseup', () => {});

fillLeaderboardList(document.getElementById('start-leaderboard-list'));
resize();
requestAnimationFrame(gameLoop);
