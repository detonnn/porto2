// ponytail: single audio-unlock util — replaces clones in main.js / AiAssistant / LiveNotifications
export function unlockAudioContext() {
  try {
    // singleton: sebelumnya bikin AudioContext baru di SETIAP tap (limit browser HP ~4-6, sisanya leak + lag)
    let ctx = window._portoAudioCtx;
    if (ctx && ctx.state !== 'closed') {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    window._portoAudioCtx = ctx;
  } catch {}
}

export function primeAudioElements(audioMap, volume = 0.6) {
  // prime given Audio elements inside a user gesture (transient activation)
  let primed = false;
  const unlock = () => {
    if (primed) {
      if (window._portoAudioCtx?.state === 'suspended') window._portoAudioCtx.resume();
      return;
    }
    unlockAudioContext();
    let pending = Object.values(audioMap).length;
    if (pending === 0) primed = true;
    Object.values(audioMap).forEach((a) => {
      const prev = a.volume;
      a.volume = 0;
      a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = prev; if (--pending === 0) primed = true; }).catch(() => { a.volume = prev; if (--pending === 0) primed = true; });
    });
  };
  return unlock;
}
