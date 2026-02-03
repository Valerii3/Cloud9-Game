const STORAGE_KEY = 'cloud9_leaderboard';
const MAX_ENTRIES = 5;

export function getLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX_ENTRIES) : [];
  } catch (_) {
    return [];
  }
}

export function saveScore(score) {
  const list = getLeaderboard();
  list.push(Math.max(0, Math.floor(score)));
  list.sort((a, b) => b - a);
  const top = list.slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
  } catch (_) {}
  return top;
}
