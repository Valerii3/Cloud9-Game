// Shared constants and derived config
export const W = 1024;
export const H = 768;
export const MARGIN = 48;

export function getLaneXs() {
  const xs = [];
  for (let i = 0; i < 6; i++) {
    xs.push(MARGIN + (i / 5) * (W - 2 * MARGIN));
  }
  return xs;
}

export const CONFIG = {
  W,
  H,
  MARGIN,
  LANE_COUNT: 6,
  LANE_XS: getLaneXs(),
  DANGER_LINE_Y: H * 0.88,
  BULLET_SPEED: 700,
  BULLET_RADIUS: 4,
  TRAIL_LENGTH: 5,
  BASE_FALL_SPEED: 150,
  SPAWN_INTERVAL_MS: 1200,
  CANNON_BARREL_LENGTH: 50,
  CENTER_CANNON_PIVOT: { x: W / 2, y: H - MARGIN },
  // Single turret: 0 = left, 90 = up, 180 = right
  TURRET_ANGLE_MIN: 0,
  TURRET_ANGLE_MAX: 180,
  ITEM_RADIUS: 32,
  CANNON_IMG_WIDTH: 64,
  CANNON_IMG_HEIGHT: 80,
};
