
// Audio unlock on first interaction + playback helper
let audioUnlocked = false;

function unlockAudioContext() {
  if (audioUnlocked) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  audioUnlocked = true;
  ['click', 'touchstart', 'keydown'].forEach(e =>
    window.removeEventListener(e, unlockAudioContext, { capture: true })
  );
}

['click', 'touchstart', 'keydown'].forEach(e =>
  window.addEventListener(e, unlockAudioContext, { capture: true, once: true })
);

function playAudio(fileName, volume = 0.5) {
  const audio = new Audio(`/frontend/assets/audio/${fileName}`);
  audio.volume = volume;
  audio.play().catch(() => {});
}
