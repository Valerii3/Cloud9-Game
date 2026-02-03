let ctx = null;

const bgMusic = typeof document !== 'undefined' && document.createElement('audio');
if (bgMusic) {
  bgMusic.src = 'audio/arcade-music.mp3';
  bgMusic.loop = true;
  bgMusic.volume = 0.4;
}

const hitSound = typeof document !== 'undefined' && document.createElement('audio');
if (hitSound) {
  hitSound.src = 'audio/hit.wav';
  hitSound.volume = 0.5;
}

const lossSound = typeof document !== 'undefined' && document.createElement('audio');
if (lossSound) {
  lossSound.src = 'audio/loss.wav';
  lossSound.volume = 0.5;
}

export function startBackgroundMusic() {
  if (bgMusic) {
    bgMusic.play().catch(() => {});
  }
}

export function stopBackgroundMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

function getContext() {
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  } catch (_) {
    return null;
  }
}

export function playShoot() {
  const ac = getContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.frequency.setValueAtTime(220, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.05);
  gain.gain.setValueAtTime(0.08, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.05);
}

export function playHit() {
  if (hitSound) {
    hitSound.currentTime = 0;
    hitSound.play().catch(() => {});
  }
}

export function playLoss() {
  if (lossSound) {
    lossSound.currentTime = 0;
    lossSound.play().catch(() => {});
  }
}

export function playMiss() {
  const ac = getContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.frequency.setValueAtTime(120, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.15);
  gain.gain.setValueAtTime(0.1, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.15);
}

export function playBomb() {
  const ac = getContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.frequency.setValueAtTime(80, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, ac.currentTime + 0.2);
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.2);
}

export function playBulletTime() {
  const ac = getContext();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.frequency.setValueAtTime(880, ac.currentTime);
  gain.gain.setValueAtTime(0.04, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.1);
}
