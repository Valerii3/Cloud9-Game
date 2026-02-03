import { CONFIG } from './config.js';
import { getSpawnIntervalMs, getFallSpeedMultiplier } from './difficulty.js';
import { drawCannons, drawAimPreview, updateCannonFromMouse, getLeftMuzzle, getRightMuzzle, whichCannonFromMouse } from './cannons.js';
import { spawnBullet, updateBullets, drawBullets } from './bullets.js';
import { spawnItem, updateItems, drawItems, checkDangerLine } from './items.js';
import { checkCollisions } from './collision.js';
import { drawBackground, drawParticles, getScreenShakeOffset, drawHitFlash, drawComboMeter, updateParticles } from './effects.js';
import { playShoot, playHit, playMiss, playBomb, playBulletTime } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('start-overlay');

const backgroundImage = new Image();
backgroundImage.src = 'img/background.png';

function createState() {
  return {
    leftAngle: 45,
    rightAngle: 135,
    bullets: [],
    items: [],
    muzzleFlashLeft: 0,
    muzzleFlashRight: 0,
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

  if (state.keys?.KeyA) state.leftAngle = Math.max(CONFIG.LEFT_ANGLE_MIN, state.leftAngle - keyAngleStep);
  if (state.keys?.KeyD) state.leftAngle = Math.min(CONFIG.LEFT_ANGLE_MAX, state.leftAngle + keyAngleStep);
  if (state.keys?.KeyJ) state.rightAngle = Math.max(CONFIG.RIGHT_ANGLE_MIN, state.rightAngle - keyAngleStep);
  if (state.keys?.KeyL) state.rightAngle = Math.min(CONFIG.RIGHT_ANGLE_MAX, state.rightAngle + keyAngleStep);

  if (state.keys?.KeyS) {
    if (!state.shootLeftHeld) {
      spawnBullet(state, 'left');
      playShoot();
    }
    state.shootLeftHeld = true;
  } else {
    state.shootLeftHeld = false;
  }
  if (state.keys?.KeyK) {
    if (!state.shootRightHeld) {
      spawnBullet(state, 'right');
      playShoot();
    }
    state.shootRightHeld = true;
  } else {
    state.shootRightHeld = false;
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

  state.muzzleFlashLeft = Math.max(0, (state.muzzleFlashLeft ?? 0) - 0.25);
  state.muzzleFlashRight = Math.max(0, (state.muzzleFlashRight ?? 0) - 0.25);
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

  ctx.fillStyle = '#fff';
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('Score: ' + (state.score ?? 0), 20, 32);
  const mult = 1 + Math.floor((state.streak ?? 0) / 5);
  ctx.fillText('x' + mult, 20, 58);
  const livesStr = '♥'.repeat(state.lives ?? 3);
  ctx.fillText(livesStr, 20, 84);
  if ((state.shields ?? 0) > 0) {
    ctx.fillText('🛡' + state.shields, 20, 110);
  }
  if (state.started && !state.gameOver && state.startTime) {
    const sec = Math.floor(performance.now() / 1000 - state.startTime);
    ctx.fillText(sec + 's', CONFIG.W - 60, 32);
  }
  if (state.popupUntil > performance.now() && state.popupText) {
    ctx.save();
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = state.popupText === 'Miss!' ? '#f66' : '#ffd700';
    ctx.fillText(state.popupText, CONFIG.W / 2, CONFIG.H / 2 - 80);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', w / 2, h / 2 - 20);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('Score: ' + state.score, w / 2, h / 2 + 20);
    ctx.fillText('Space or click to restart', w / 2, h / 2 + 55);
    ctx.textAlign = 'left';
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
  }
  state.keys[e.code] = true;
  if (state.gameOver && (e.code === 'Space' || e.code === 'Enter')) {
    state = createState();
    state.started = true;
    state.startTime = performance.now() / 1000;
    state.lastSpawnTime = performance.now() / 1000;
  }
  if (['KeyA', 'KeyD', 'KeyS', 'KeyJ', 'KeyK', 'KeyL'].includes(e.code)) e.preventDefault();
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
    return;
  }
  if (state.gameOver) {
    state = createState();
    state.started = true;
    state.startTime = performance.now() / 1000;
    state.lastSpawnTime = performance.now() / 1000;
    return;
  }
  const side = whichCannonFromMouse(e.clientX);
  spawnBullet(state, side);
  playShoot();
});

window.addEventListener('mouseup', () => {});

resize();
requestAnimationFrame(gameLoop);
