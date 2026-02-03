import { CONFIG } from './config.js';

const { BULLET_RADIUS } = CONFIG;

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function checkCollisions(state) {
  const toRemoveBullets = new Set();
  const toRemoveItems = new Set();
  state.hitsThisFrame = state.hitsThisFrame ?? [];

  for (const bullet of state.bullets) {
    for (const item of state.items) {
      if (toRemoveItems.has(item)) continue;
      const d = dist(bullet.x, bullet.y, item.x, item.y);
      if (d < BULLET_RADIUS + item.radius) {
        toRemoveBullets.add(bullet);
        item.hits = (item.hits ?? 1) - 1;
        if (item.hits <= 0) {
          toRemoveItems.add(item);
          const effect = item.effect;
          const points = item.points ?? 0;
          if (effect === 'clear') {
            toRemoveBullets.add(bullet);
            state.items = [];
            state.bullets = state.bullets.filter((b) => !toRemoveBullets.has(b));
            state.screenShakeUntil = performance.now() + 400;
            state.hitsThisFrame.push({ points: 0, effect: 'clear' });
            return;
          }
          if (effect === 'streakReset') {
            state.hitsThisFrame.push({ points: 0, effect: 'streakReset' });
          } else if (effect === 'decoy') {
            const wrongCannon = bullet.side === 'right';
            state.hitsThisFrame.push({ points: 0, effect: 'decoy', wrongCannon });
          } else if (effect === 'shield') {
            state.shields = (state.shields || 0) + 1;
            state.hitsThisFrame.push({ points: 5, effect: 'shield' });
          } else if (effect === 'bulletTime') {
            state.bulletTimeUntil = performance.now() + 2000;
            state.hitsThisFrame.push({ points: 25, effect: 'bulletTime' });
          } else {
            state.hitsThisFrame.push({ points, effect });
          }
        }
        break;
      }
    }
  }

  state.bullets = state.bullets.filter((b) => !toRemoveBullets.has(b));
  state.items = state.items.filter((i) => !toRemoveItems.has(i));
}
