import { CONFIG } from './config.js';

const { CENTER_CANNON_PIVOT, CANNON_BARREL_LENGTH, CANNON_IMG_WIDTH, CANNON_IMG_HEIGHT } = CONFIG;

export const turretImg = new Image();
turretImg.src = 'img/Alarmbot.png';

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

const MUZZLE_OFFSET = CANNON_IMG_HEIGHT;

// Angle: 0 = left, 90 = up, 180 = right. Direction = (-cos(rad), -sin(rad)).
function getMuzzlePos(angleDeg) {
  const rad = degToRad(angleDeg);
  const dx = -Math.cos(rad) * MUZZLE_OFFSET;
  const dy = -Math.sin(rad) * MUZZLE_OFFSET;
  return {
    x: CENTER_CANNON_PIVOT.x + dx,
    y: CENTER_CANNON_PIVOT.y + dy,
  };
}

export function getCenterMuzzle(state) {
  return getMuzzlePos(state.turretAngle);
}

export function getBulletVelocity(angleDeg) {
  const rad = degToRad(angleDeg);
  const vx = -Math.cos(rad) * CONFIG.BULLET_SPEED;
  const vy = -Math.sin(rad) * CONFIG.BULLET_SPEED;
  return { vx, vy };
}

function drawTurretImage(ctx, img, angleDeg, muzzleFlash) {
  if (!img.complete || img.naturalWidth === 0) return false;
  const rad = degToRad(angleDeg - 90);
  const w = CANNON_IMG_WIDTH;
  const h = CANNON_IMG_HEIGHT;
  ctx.save();
  ctx.translate(CENTER_CANNON_PIVOT.x, CENTER_CANNON_PIVOT.y);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h, w, h);
  if (muzzleFlash > 0) {
    const alpha = muzzleFlash;
    ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, -h + 8);
    ctx.lineTo(-6, -h);
    ctx.lineTo(6, -h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  return true;
}

function drawTurretFallback(ctx, angleDeg, muzzleFlash) {
  const rad = degToRad(angleDeg - 90);
  const dx = -Math.cos(degToRad(angleDeg)) * CANNON_BARREL_LENGTH;
  const dy = -Math.sin(degToRad(angleDeg)) * CANNON_BARREL_LENGTH;
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.arc(CENTER_CANNON_PIVOT.x, CENTER_CANNON_PIVOT.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.translate(CENTER_CANNON_PIVOT.x, CENTER_CANNON_PIVOT.y);
  ctx.rotate(rad);
  ctx.fillStyle = '#555';
  ctx.fillRect(0, -6, CANNON_BARREL_LENGTH, 12);
  ctx.strokeStyle = '#777';
  ctx.strokeRect(0, -6, CANNON_BARREL_LENGTH, 12);
  ctx.restore();
  if (muzzleFlash > 0) {
    const alpha = muzzleFlash;
    ctx.save();
    ctx.translate(CENTER_CANNON_PIVOT.x + dx, CENTER_CANNON_PIVOT.y + dy);
    ctx.rotate(rad);
    ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(CANNON_BARREL_LENGTH + 8, 0);
    ctx.lineTo(CANNON_BARREL_LENGTH + 4, -6);
    ctx.lineTo(CANNON_BARREL_LENGTH + 4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawCannons(ctx, state) {
  const drawn = drawTurretImage(ctx, turretImg, state.turretAngle, state.muzzleFlash ?? 0);
  if (!drawn) drawTurretFallback(ctx, state.turretAngle, state.muzzleFlash ?? 0);
}

export function drawAimPreview(ctx, state) {
  const rad = degToRad(state.turretAngle);
  const len = 120;
  const dx = -Math.cos(rad) * len;
  const dy = -Math.sin(rad) * len;
  const mult = 1 + Math.floor((state.streak ?? 0) / 5);
  const hot = mult >= 3;
  ctx.strokeStyle = hot ? 'rgba(255, 200, 80, 0.7)' : 'rgba(100, 200, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(CENTER_CANNON_PIVOT.x, CENTER_CANNON_PIVOT.y);
  ctx.lineTo(CENTER_CANNON_PIVOT.x + dx, CENTER_CANNON_PIVOT.y + dy);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function updateCannonFromMouse(state, mouseX, mouseY) {
  const scaleX = CONFIG.W / (window.innerWidth || 1);
  const scaleY = CONFIG.H / (window.innerHeight || 1);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (window.innerWidth - CONFIG.W / scale) / 2;
  const offsetY = (window.innerHeight - CONFIG.H / scale) / 2;
  const x = (mouseX - offsetX) * scale;
  const y = (mouseY - offsetY) * scale;

  const dx = x - CENTER_CANNON_PIVOT.x;
  const dy = y - CENTER_CANNON_PIVOT.y;
  // atan2(dx, -dy): 0 when (0,-1), 90 when (1,0), 180 when (0,1) -> we want 0=left(-1,0), 90=up(0,-1), 180=right(1,0)
  // So angle from "up" = atan2(dx, -dy) in rad. In deg: atan2(dx, -dy) * 180/PI. That gives 0 for up, 90 for right, -90 for left.
  // We want 0=left, 90=up, 180=right. So our angle = 90 + atan2(dx, -dy)*180/PI.
  let angle = 90 + (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  state.turretAngle = Math.max(CONFIG.TURRET_ANGLE_MIN, Math.min(CONFIG.TURRET_ANGLE_MAX, angle));
}
