const nav = typeof navigator !== "undefined" ? navigator : {};
const lowEnd =
  (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
  (nav.deviceMemory && nav.deviceMemory <= 4) ||
  (typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches);

let slow = !!lowEnd; // shared, so one component noticing lag helps the others

export function createFrameGovernor() {
  let prev = 0,
    ema = 0,
    n = 0;
  return {
    get slow() {
      return slow;
    },
    /** Call at the top of each rAF callback. True means: skip this frame. */
    skip(now, lastRendered) {
      if (!slow) {
        // sample only after load jank is over, and ignore hitches / tab sleep
        if (prev && now > 3000 && !document.hidden) {
          const dt = now - prev;
          if (dt < 200) {
            ema = n ? ema + (dt - ema) * 0.1 : dt;
            if (++n >= 60 && ema > 26) slow = true;
          } else {
            n = 0;
          }
        }
        prev = now;
        return false;
      }
      return !!lastRendered && now - lastRendered < 28;
    },
  };
}
