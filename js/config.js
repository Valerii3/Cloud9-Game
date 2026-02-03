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
  LEFT_CANNON_PIVOT: { x: MARGIN, y: H - MARGIN },
  RIGHT_CANNON_PIVOT: { x: W - MARGIN, y: H - MARGIN },
  // Cannon angle limits (degrees): left 0=up, 90=right; right 90=right, 180=up
  LEFT_ANGLE_MIN: 0,
  LEFT_ANGLE_MAX: 90,
  RIGHT_ANGLE_MIN: 90,
  RIGHT_ANGLE_MAX: 180,
  ITEM_RADIUS: 32,
  CANNON_IMG_WIDTH: 64,
  CANNON_IMG_HEIGHT: 80,
};
