/**
 * Lanyard physics, ported 1:1 from the React LanyardBadge (types dropped).
 * Pt = { x, y, px, py, w }   Link = [i, j, rest]   Spin = { a, v }
 */

/** Verlet step. `w` is inverse mass; 0 pins a point in place. */
export function integrate(pts, dt, gravity, damping) {
  for (const p of pts) {
    if (!p.w) continue
    const vx = (p.x - p.px) * damping
    const vy = (p.y - p.py) * damping
    p.px = p.x
    p.py = p.y
    p.x += vx
    p.y += vy + gravity * dt * dt
  }
}

/** Relax distance constraints, heavier points moving less. */
export function solve(pts, links, iterations) {
  for (let k = 0; k < iterations; k++) {
    for (const [i, j, rest] of links) {
      const a = pts[i]
      const b = pts[j]
      const ws = a.w + b.w
      if (!ws) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1e-6
      const f = (d - rest) / (d * ws)
      a.x += dx * f * a.w
      a.y += dy * f * a.w
      b.x -= dx * f * b.w
      b.y -= dy * f * b.w
    }
  }
}

/**
 * The card's turn on the ring. The strap's own twist is the spring pulling it
 * back to `target`; `drive` is whatever is twisting it right now.
 */
export function spinStep(s, target, dt, drive) {
  s.v += (-(s.a - target) * 18 - s.v * 3.2 + drive) * dt
  s.a += s.v * dt
}

/** How far the card swings from hanging straight down, in radians. Right is positive. */
export function swingAngle(top, bottom) {
  return Math.atan2(bottom.x - top.x, bottom.y - top.y)
}
