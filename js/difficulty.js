import { CONFIG } from './config.js';

const BASE_SPAWN_MS = CONFIG.SPAWN_INTERVAL_MS ?? 1200;
const FALL_SPEED_MULT_PER_10S = 1.1;
const SPAWN_FASTER_FACTOR = 0.92;

export function getFallSpeedMultiplier(elapsedSec) {
  const steps = Math.floor(elapsedSec / 10);
  return Math.pow(FALL_SPEED_MULT_PER_10S, steps);
}

export function getSpawnIntervalMs(elapsedSec) {
  const steps = Math.floor(elapsedSec / 20);
  return Math.max(400, BASE_SPAWN_MS * Math.pow(SPAWN_FASTER_FACTOR, steps));
}

const NORMAL = 'normal';
const FAST = 'fast';
const HEAVY = 'heavy';
const BOMB = 'bomb';
const GOLD = 'gold';
const SKULL = 'skull';
const SHIELD = 'shield';
const DECOY = 'decoy';

/** Returns array of { type, weight }. Before 45s only normal/fast/heavy. After 45s add bomb, gold, skull, shield, decoy. */
export function getSpawnWeights(elapsedSec) {
  const base = [
    { type: NORMAL, weight: 50 },
    { type: FAST, weight: 25 },
    { type: HEAVY, weight: 25 },
  ];
  if (elapsedSec < 45) return base;
  return [
    { type: NORMAL, weight: 35 },
    { type: FAST, weight: 15 },
    { type: HEAVY, weight: 15 },
    { type: BOMB, weight: 8 },
    { type: GOLD, weight: 8 },
    { type: SKULL, weight: 8 },
    { type: SHIELD, weight: 6 },
    { type: DECOY, weight: 5 },
  ];
}

export function pickSpawnType(elapsedSec) {
  const weights = getSpawnWeights(elapsedSec);
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const { type, weight } of weights) {
    r -= weight;
    if (r <= 0) return type;
  }
  return weights[0].type;
}
