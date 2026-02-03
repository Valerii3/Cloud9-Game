import { CONFIG } from './config.js';

const { W, H } = CONFIG;

let particlePool = [];
const PARTICLE_COUNT = 40;

function ensureParticles() {
  while (particlePool.length < PARTICLE_COUNT) {
    particlePool.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      r: 1 + Math.random() * 2,
    });
  }
}

export function updateParticles(state) {
  ensureParticles();
  for (const p of particlePool) {
    p.x += p.vx * (state.timeScale ?? 1);
    p.y += p.vy * (state.timeScale ?? 1);
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
    p.x = Math.max(0, Math.min(W, p.x));
    p.y = Math.max(0, Math.min(H, p.y));
  }
}

export function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#0f0f1a');
  gradient.addColorStop(0.5, '#0a0a14');
  gradient.addColorStop(1, '#050508');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  for (let d = 0; d < W + H; d += 60) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(0, d);
    ctx.stroke();
  }
}

export function drawParticles(ctx) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (const p of particlePool) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function getScreenShakeOffset(state) {
  if (!state.screenShakeUntil || state.screenShakeUntil < performance.now()) return { x: 0, y: 0 };
  const t = (state.screenShakeUntil - performance.now()) / 400;
  const mag = 4 * t;
  return {
    x: (Math.random() - 0.5) * 2 * mag,
    y: (Math.random() - 0.5) * 2 * mag,
  };
}

export function drawHitFlash(ctx, state) {
  if (!state.hitFlashUntil || state.hitFlashUntil < performance.now()) return;
  const elapsed = state.hitFlashUntil - performance.now();
  const alpha = Math.min(1, elapsed / 50) * 0.25;
  ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawComboMeter(ctx, state) {
  const streak = state.streak ?? 0;
  const segment = 5;
  const fill = (streak % segment) / segment;
  const cx = W - 80;
  const cy = 120;
  const r = 30;
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.25)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = streak >= segment ? 'rgba(255, 200, 80, 0.9)' : 'rgba(0, 255, 255, 0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fill);
  ctx.stroke();
  const mult = 1 + Math.floor(streak / segment);
  drawNeonText(ctx, 'x' + mult, cx, cy + 5, '14px Orbitron, sans-serif', 'center', true);
}

export function drawNeonText(ctx, text, x, y, font, align, small) {
  ctx.font = font || '900 22px Orbitron, sans-serif';
  ctx.textAlign = align || 'left';
  const color = small ? 'rgba(0, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.98)';
  ctx.shadowBlur = small ? 12 : 18;
  ctx.shadowColor = 'rgba(0, 255, 255, 0.9)';
  ctx.fillStyle = color;
  ctx.fillText(String(text), x, y);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.textAlign = 'left';
}
