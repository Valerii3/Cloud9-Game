import { CONFIG } from './config.js';
import { getCenterMuzzle, getBulletVelocity } from './cannons.js';

const { BULLET_RADIUS, TRAIL_LENGTH } = CONFIG;

export function spawnBullet(state) {
  const muzzle = getCenterMuzzle(state);
  const { vx, vy } = getBulletVelocity(state.turretAngle);
  state.bullets.push({
    x: muzzle.x,
    y: muzzle.y,
    vx,
    vy,
    trail: [{ x: muzzle.x, y: muzzle.y }],
    side: 'center',
  });
  state.muzzleFlash = 1;
}

export function updateBullets(state, dt) {
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > TRAIL_LENGTH) b.trail.shift();
  }
  state.bullets = state.bullets.filter(
    (b) => b.x >= -20 && b.x <= CONFIG.W + 20 && b.y >= -20 && b.y <= CONFIG.H + 20
  );
}

export function drawBullets(ctx, state) {
  for (const b of state.bullets) {
    // Trail
    for (let i = 0; i < b.trail.length; i++) {
      const t = b.trail[i];
      const alpha = (i + 1) / (b.trail.length + 1) * 0.5;
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, BULLET_RADIUS * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
