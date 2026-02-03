import { CONFIG } from './config.js';

const { LEFT_CANNON_PIVOT, RIGHT_CANNON_PIVOT, CANNON_BARREL_LENGTH, CANNON_IMG_WIDTH, CANNON_IMG_HEIGHT } = CONFIG;

export const leftCannonImg = new Image();
leftCannonImg.src = 'img/Alarmbot.png';
export const rightCannonImg = new Image();
rightCannonImg.src = 'img/Boom Bot.png';

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

const MUZZLE_OFFSET = CANNON_IMG_HEIGHT;

function getMuzzlePos(pivot, angleDeg, isLeft) {
  let dx, dy;
  if (isLeft) {
    const rad = degToRad(angleDeg);
    dx = Math.sin(rad) * MUZZLE_OFFSET;
    dy = -Math.cos(rad) * MUZZLE_OFFSET;
  } else {
    const rad = Math.PI + ((angleDeg - 90) * Math.PI) / 180;
    dx = Math.cos(rad) * MUZZLE_OFFSET;
    dy = Math.sin(rad) * MUZZLE_OFFSET;
  }
  return {
    x: pivot.x + dx,
    y: pivot.y + dy,
  };
}

export function getLeftMuzzle(state) {
  return getMuzzlePos(LEFT_CANNON_PIVOT, state.leftAngle, true);
}

export function getRightMuzzle(state) {
  return getMuzzlePos(RIGHT_CANNON_PIVOT, state.rightAngle, false);
}

export function getBulletVelocity(angleDeg, isLeft) {
  let vx, vy;
  if (isLeft) {
    const rad = degToRad(angleDeg);
    vx = Math.sin(rad) * CONFIG.BULLET_SPEED;
    vy = -Math.cos(rad) * CONFIG.BULLET_SPEED;
  } else {
    const rad = Math.PI + ((angleDeg - 90) * Math.PI) / 180;
    vx = Math.cos(rad) * CONFIG.BULLET_SPEED;
    vy = Math.sin(rad) * CONFIG.BULLET_SPEED;
  }
  return { vx, vy };
}

function drawCannonImage(ctx, img, pivot, angleDeg, isLeft, muzzleFlash) {
  if (!img.complete || img.naturalWidth === 0) return false;
  const rad = isLeft
    ? degToRad(angleDeg)
    : Math.PI + ((angleDeg - 90) * Math.PI) / 180;
  const w = CANNON_IMG_WIDTH;
  const h = CANNON_IMG_HEIGHT;
  ctx.save();
  ctx.translate(pivot.x, pivot.y);
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

function drawCannonFallback(ctx, pivot, angleDeg, muzzleFlash, isLeft) {
  const rad = isLeft
    ? degToRad(angleDeg)
    : Math.PI + ((angleDeg - 90) * Math.PI) / 180;
  const dx = isLeft
    ? Math.sin(rad) * CANNON_BARREL_LENGTH
    : Math.cos(rad) * CANNON_BARREL_LENGTH;
  const dy = isLeft
    ? -Math.cos(rad) * CANNON_BARREL_LENGTH
    : Math.sin(rad) * CANNON_BARREL_LENGTH;
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(rad);
  ctx.fillStyle = '#555';
  ctx.fillRect(0, -6, CANNON_BARREL_LENGTH, 12);
  ctx.strokeStyle = '#777';
  ctx.strokeRect(0, -6, CANNON_BARREL_LENGTH, 12);
  ctx.restore();
  if (muzzleFlash > 0) {
    const alpha = muzzleFlash;
    ctx.save();
    ctx.translate(pivot.x + dx, pivot.y + dy);
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
  const leftDrawn = drawCannonImage(ctx, leftCannonImg, LEFT_CANNON_PIVOT, state.leftAngle, true, state.muzzleFlashLeft);
  if (!leftDrawn) drawCannonFallback(ctx, LEFT_CANNON_PIVOT, state.leftAngle, state.muzzleFlashLeft, true);
  const rightDrawn = drawCannonImage(ctx, rightCannonImg, RIGHT_CANNON_PIVOT, state.rightAngle, false, state.muzzleFlashRight);
  if (!rightDrawn) drawCannonFallback(ctx, RIGHT_CANNON_PIVOT, state.rightAngle, state.muzzleFlashRight, false);
}

export function drawAimPreview(ctx, state) {
  const drawLine = (pivot, angleDeg, isLeft) => {
    const rad = isLeft
      ? degToRad(angleDeg)
      : Math.PI + ((angleDeg - 90) * Math.PI) / 180;
    const len = 120;
    const dx = isLeft ? Math.sin(rad) * len : Math.cos(rad) * len;
    const dy = isLeft ? -Math.cos(rad) * len : Math.sin(rad) * len;
    const mult = 1 + Math.floor((state.streak ?? 0) / 5);
    const hot = mult >= 3;
    const leftColor = hot ? 'rgba(255, 200, 80, 0.7)' : 'rgba(100, 200, 255, 0.5)';
    const rightColor = hot ? 'rgba(255, 180, 60, 0.7)' : 'rgba(255, 150, 100, 0.5)';
    ctx.strokeStyle = isLeft ? leftColor : rightColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(pivot.x + dx, pivot.y + dy);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  drawLine(LEFT_CANNON_PIVOT, state.leftAngle, true);
  drawLine(RIGHT_CANNON_PIVOT, state.rightAngle, false);
}

export function updateCannonFromMouse(state, mouseX, mouseY) {
  const scaleX = CONFIG.W / (window.innerWidth || 1);
  const scaleY = CONFIG.H / (window.innerHeight || 1);
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (window.innerWidth - CONFIG.W / scale) / 2;
  const offsetY = (window.innerHeight - CONFIG.H / scale) / 2;
  const x = (mouseX - offsetX) * scale;
  const y = (mouseY - offsetY) * scale;

  const midX = CONFIG.W / 2;
  if (x < midX) {
    const dx = x - LEFT_CANNON_PIVOT.x;
    const dy = y - LEFT_CANNON_PIVOT.y;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    state.leftAngle = Math.max(CONFIG.LEFT_ANGLE_MIN, Math.min(CONFIG.LEFT_ANGLE_MAX, angle));
  } else {
    const dx = x - RIGHT_CANNON_PIVOT.x;
    const dy = y - RIGHT_CANNON_PIVOT.y;
    const rad = Math.atan2(dx, dy);
    let angle = 90 + (rad * 180) / Math.PI;
    state.rightAngle = Math.max(CONFIG.RIGHT_ANGLE_MIN, Math.min(CONFIG.RIGHT_ANGLE_MAX, angle));
  }
}

export function whichCannonFromMouse(mouseX) {
  const midX = window.innerWidth / 2;
  return mouseX < midX ? 'left' : 'right';
}
