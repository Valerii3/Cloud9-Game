import { CONFIG } from './config.js';
import { getFallSpeedMultiplier } from './difficulty.js';
import { pickSpawnType } from './difficulty.js';

const { LANE_XS, DANGER_LINE_Y, BASE_FALL_SPEED, ITEM_RADIUS } = CONFIG;

export const ITEM_TYPES = {
  NORMAL: 'normal',
  FAST: 'fast',
  HEAVY: 'heavy',
  BOMB: 'bomb',
  GOLD: 'gold',
  SKULL: 'skull',
  SHIELD: 'shield',
  DECOY: 'decoy',
};

function getBaseSpeed(type) {
  switch (type) {
    case ITEM_TYPES.FAST: return BASE_FALL_SPEED * 1.3;
    default: return BASE_FALL_SPEED;
  }
}

export function spawnItem(state) {
  const elapsedSec = state.startTime ? performance.now() / 1000 - state.startTime : 0;
  const type = pickSpawnType(elapsedSec);
  const lane = Math.floor(Math.random() * LANE_XS.length);
  const speedMult = getFallSpeedMultiplier(elapsedSec);
  const baseSpeed = getBaseSpeed(type);
  const vy = baseSpeed * speedMult;

  const item = {
    type,
    x: LANE_XS[lane],
    y: 0,
    vy,
    radius: type === ITEM_TYPES.FAST ? ITEM_RADIUS * 0.8 : ITEM_RADIUS,
    points: type === ITEM_TYPES.NORMAL ? 10 : type === ITEM_TYPES.FAST ? 20 : type === ITEM_TYPES.HEAVY ? 15 : 0,
    hits: type === ITEM_TYPES.HEAVY ? 2 : 1,
  };

  if (type === ITEM_TYPES.BOMB) item.effect = 'clear';
  if (type === ITEM_TYPES.GOLD) item.effect = 'bulletTime';
  if (type === ITEM_TYPES.SKULL) item.effect = 'streakReset';
  if (type === ITEM_TYPES.SHIELD) item.effect = 'shield';
  if (type === ITEM_TYPES.DECOY) item.effect = 'decoy';

  state.items.push(item);
}

export function updateItems(state, dt) {
  const timeScale = state.timeScale ?? 1;
  for (const item of state.items) {
    item.y += (item.vy ?? BASE_FALL_SPEED) * dt * timeScale;
  }
}

export function drawItems(ctx, state) {
  for (const item of state.items) {
    ctx.save();
    ctx.translate(item.x, item.y);
    const r = item.radius;

    switch (item.type) {
      case ITEM_TYPES.NORMAL:
        ctx.fillStyle = '#6cf';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8df';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.FAST:
        ctx.fillStyle = '#f96';
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i * Math.PI / 2) + Math.PI / 4;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#faa';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.HEAVY:
        ctx.fillStyle = '#888';
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 2;
        ctx.strokeRect(-r, -r, r * 2, r * 2);
        break;
      case ITEM_TYPES.BOMB:
        ctx.fillStyle = '#c44';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f66';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.GOLD:
        ctx.fillStyle = '#fc0';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.SKULL:
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, r);
        ctx.lineTo(0, r * 0.5);
        ctx.lineTo(-r, r);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.SHIELD:
        ctx.fillStyle = '#6af';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8cf';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case ITEM_TYPES.DECOY:
        ctx.fillStyle = '#9a6';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bc8';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      default:
        ctx.fillStyle = '#6cf';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }
}

export function checkDangerLine(state) {
  const crossed = state.items.filter((item) => item.y >= DANGER_LINE_Y);
  for (const item of crossed) {
    state.items = state.items.filter((i) => i !== item);
  }
  return crossed.length > 0;
}
