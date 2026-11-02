// Pure helpers + drawings for the DoodleCrew wordmark scene (ported from the React template).

export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

export const layoutWord = (advances, tracking, fontSize) => {
  const x = []
  const w = []
  let at = 0
  const gap = (Number.isFinite(tracking) ? tracking : 0) * fontSize
  for (let i = 0; i < advances.length; i++) {
    const a = Number.isFinite(advances[i]) && advances[i] > 0 ? advances[i] : 0
    x.push(at)
    w.push(a)
    at += a + (i < advances.length - 1 ? gap : 0)
  }
  return { x, w, width: Math.max(0, at) }
}

export const seatPoint = (seat, letterX, letterW, cap, offset, scale) => {
  const x = letterX + letterW * (0.5 + (Number.isFinite(offset) ? offset : 0))
  if (seat === 'top') return { x, y: -cap }
  if (seat === 'behind') return { x, y: -cap + 30 * scale }
  return { x, y: 0 }
}

export const lookAt = (ex, ey, tx, ty, max, reach) => {
  const dx = tx - ex
  const dy = ty - ey
  const d = Math.hypot(dx, dy)
  if (!Number.isFinite(d) || d < 1e-6 || max <= 0) return { x: 0, y: 0 }
  const k = (max * Math.min(1, d / Math.max(1e-6, reach))) / d
  return { x: dx * k, y: dy * k }
}

export const stepFloater = (f, dt, t, w, h, px, py, radius, rand) => {
  const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05)
  const m = 40
  if (f.pop > 0) {
    f.pop -= step
    if (f.pop <= 0) {
      f.pop = 0
      f.x = rand() * w
      f.y = -m
      f.vx = 0
      f.vy = f.fall
    }
    return f
  }
  const sway = Math.sin(t * 0.7 + f.phase) * 14
  if (Number.isFinite(px) && Number.isFinite(py) && radius > 0) {
    const dx = f.x - px
    const dy = f.y - py
    const d = Math.hypot(dx, dy)
    if (d < radius && d > 0.01) {
      const k = (1 - d / radius) * (1 - d / radius) * 2400
      f.vx += (dx / d) * k * step
      f.vy += (dy / d) * k * step
      f.vr += (dx > 0 ? 1 : -1) * k * 0.004 * step
    }
  }
  const ease = Math.min(1, step * 2.4)
  f.vx += (sway - f.vx) * ease
  f.vy += (f.fall - f.vy) * ease
  f.vr += (Math.sin(f.phase * 3) * 18 - f.vr) * Math.min(1, step * 0.8)
  f.x += f.vx * step
  f.y += f.vy * step
  f.rot = (f.rot + f.vr * step) % 360
  if (f.y > h + m) {
    f.y = -m
    f.x = rand() * w
  } else if (f.y < -m * 3) {
    f.y = h + m
  }
  if (f.x < -m) f.x = w + m
  else if (f.x > w + m) f.x = -m
  return f
}

// Storyboard timing in ms from the moment the footer comes into view.
export const timeline = (letters, crew) => {
  const L = Math.max(0, Math.floor(letters) || 0)
  const C = Math.max(0, Math.floor(crew) || 0)
  const letter = (i) => 160 + i * 80
  const crewStart = letter(Math.max(0, L - 1)) + 420
  const member = (j) => crewStart + j * 130
  const doodles = crewStart + Math.max(0, C - 1) * 130 * 0.5
  return { ground: 60, letter, crewStart, member, doodles }
}

export const ACCENT = {
  flame: '#ff7a1a', flameCore: '#ffd23f', gold: '#ffd23f', heart: '#ff5c7a',
  bread: '#f2c48d', leaf: '#5fb247',
}

// Each kind is drawn in its own units: base centre at (0,0), up is negative, ~144 units per cap height.
export const ART = {
  yeti: {
    k: 1,
    box: { l: -72, r: 60, t: -140, b: 6 },
    seat: 'front',
    eyes: [
      { x: -15, y: -86, r: 8, pupil: 3.6, max: 3.6 },
      { x: 13, y: -88, r: 8, pupil: 3.6, max: 3.6 },
    ],
    body: (h) => `
      <ellipse class="dcf-shadow" cx="0" cy="2" rx="54" ry="5"/>
      <path d="M-40 -92 C-62 -92 -70 -76 -68 -56 L-66 -30 C-64 -18 -54 -16 -44 -20 Z"/>
      <path d="M-40 -92 C-62 -92 -70 -76 -68 -56 L-66 -30 C-64 -18 -54 -16 -44 -20 Z" fill="${h}" stroke="none"/>
      <path class="n" d="M-67 -64 C-58 -59 -50 -59 -43 -64"/>
      <path d="M-30 -104 C-40 -112 -44 -124 -40 -138 C-32 -129 -22 -122 -13 -114 Z"/>
      <path d="M18 -114 C26 -124 36 -130 47 -133 C45 -120 41 -110 32 -101 Z"/>
      <path class="n" d="M-38 -124 L-28 -119 M39 -125 L33 -116"/>
      <path d="M-44 -2 C-54 -28 -54 -66 -42 -90 C-32 -110 -14 -118 2 -118 C22 -118 40 -108 48 -88 C58 -64 58 -28 48 -2 C30 4 -26 4 -44 -2 Z"/>
      <path d="M40 -96 C54 -66 54 -30 46 -4 C40 -2 34 -1 30 0 C40 -30 42 -64 33 -101 Z" fill="${h}" stroke="none"/>
      <path class="n" d="M-7 -117 C-5 -126 1 -128 3 -120 C5 -127 11 -126 11 -116"/>
      <path class="n thin" d="M-14 -24 l-3 4 M8 -40 l3 4 M14 -46 l3 3 M20 -30 l3 3"/>
      <path class="n" d="M-48 -62 C-22 -50 10 -32 49 -26 M-50 -52 C-24 -40 8 -22 49 -16"/>
      <rect x="-12" y="-46" width="15" height="13" rx="2.5" transform="rotate(26 -4.5 -39.5)"/>
      <path d="M-46 -60 C-62 -50 -63 -29 -51 -19 C-45 -15 -38 -19 -40 -28 C-43 -36 -40 -46 -36 -52"/>
      <path d="M46 -58 C61 -46 61 -26 51 -18 C45 -14 38 -18 40 -26 C43 -34 41 -44 37 -50"/>
      <path d="M-37 -2 C-41 -14 -23 -19 -16 -7 C-14 0 -26 4 -37 -2 Z"/>
      <path d="M37 -2 C41 -14 23 -19 16 -7 C14 0 26 4 37 -2 Z"/>
      <path class="n thin" d="M-30 -4 l1 -4 M-24 -3 l1 -4 M30 -4 l-1 -4 M24 -3 l-1 -4"/>
      <path class="n" d="M-23 -98 L-9 -96 M6 -98 L20 -100"/>
      <path class="n" d="M-12 -70 C-6 -64 6 -64 12 -71"/>
      <path d="M3 -66.5 L5.5 -60 L8 -67.5 Z"/>`,
  },
  kid: {
    k: 1.28,
    box: { l: -30, r: 30, t: -88, b: 42 },
    seat: 'top',
    eyes: [
      { x: -6, y: -58, r: 0, pupil: 2.5, max: 1.8 },
      { x: 6.5, y: -58, r: 0, pupil: 2.5, max: 1.8 },
    ],
    body: (h) => `
      <path d="M-15 -6 L-3 -6 C-3 8 -5 20 -6 30 L-15 30 C-15 18 -16 6 -15 -6 Z"/>
      <path d="M3 -6 L15 -6 C17 6 19 16 22 27 L12 30 C10 18 6 6 3 -6 Z"/>
      <path d="M3 -6 L15 -6 C17 6 19 16 22 27 L12 30 C10 18 6 6 3 -6 Z" fill="${h}" stroke="none"/>
      <path class="k" d="M-17 30 C-20 34 -20 40 -14 41 L-2 41 C2 40 0 34 -5 30 Z"/>
      <path class="k" d="M11 29 C8 34 10 40 16 40 L26 38 C29 36 27 30 22 27 Z"/>
      <path d="M-20 -4 C-22 -20 -18 -38 -10 -44 L10 -44 C18 -38 22 -20 20 -4 Z"/>
      <path class="n thick" d="M-19.5 -14 L19.5 -14 M-18.5 -26 L18.5 -26 M-14 -36 L14 -36"/>
      <path class="n" d="M-18 -36 C-28 -28 -30 -14 -26 -5"/>
      <circle cx="-26" cy="-3" r="4"/>
      <path class="n" d="M18 -36 C27 -30 30 -18 28 -7"/>
      <circle cx="28" cy="-4" r="4"/>
      <circle cx="-17" cy="-58" r="4"/>
      <circle cx="17" cy="-58" r="4"/>
      <circle cx="0" cy="-60" r="17"/>
      <path class="n thin" d="M-11 -52 l2 -2 M-8 -52 l2 -2 M8 -52 l2 -2 M11 -52 l2 -2"/>
      <path class="n" d="M-5 -50 C-2 -47 2 -47 5 -50"/>
      <path d="M-15 -70 C-14 -87 14 -87 15 -70 Z"/>
      <path d="M-27 -68 C-16 -75 16 -75 27 -68 C18 -63 -18 -63 -27 -68 Z"/>
      <path class="n thick" d="M-14.5 -74 C-6 -77 6 -77 14.5 -74"/>`,
  },
  bird: {
    k: 1.22,
    box: { l: -34, r: 30, t: -62, b: 2 },
    seat: 'top',
    eyes: [
      { x: 3, y: -30, r: 4.6, pupil: 2.3, max: 2 },
      { x: 12, y: -31, r: 4.6, pupil: 2.3, max: 2 },
    ],
    idle: 'dcf-peck',
    body: (h) => `
      <path class="n" d="M-5 0 L-5 -7 M-9 0 L-1 0 M5 0 L5 -7 M1 0 L9 0"/>
      <path d="M-17 -16 C-26 -18 -31 -14 -33 -9 C-26 -10 -20 -8 -15 -10 Z"/>
      <path d="M-18 -14 C-20 -30 -10 -40 2 -40 C16 -40 22 -28 20 -16 C18 -6 8 -4 0 -4 C-10 -4 -17 -8 -18 -14 Z"/>
      <path d="M-11 -25 C-3 -26 1 -18 -3 -13 C-9 -12 -15 -17 -11 -25 Z" fill="${h}"/>
      <path class="o" d="M19 -30 L29 -27 L19 -23 Z"/>
      <path class="a" d="M-3 -38 L4 -59 L12 -37 Z"/>
      <path class="n thin" d="M-1 -44 L10 -46 M1 -51 L8 -52"/>
      <circle cx="4" cy="-60" r="2.8"/>`,
  },
  cat: {
    k: 1.06,
    box: { l: -30, r: 52, t: -110, b: 4 },
    seat: 'front',
    eyes: [{ x: 10, y: -76, r: 6, pupil: 2.8, max: 2.6 }],
    body: (h) => `
      <ellipse class="dcf-shadow" cx="4" cy="2" rx="32" ry="4"/>
      <g class="dcf-tail">
        <path d="M18 -4 C42 -4 52 -24 46 -44 C44 -51 36 -53 34 -46 C40 -30 34 -16 16 -14 Z"/>
        <path class="n thin" d="M40 -16 l5 4 M45 -30 l6 1 M43 -42 l6 -3"/>
      </g>
      <path d="M-22 0 C-28 -18 -24 -42 -14 -52 L14 -52 C24 -42 28 -18 22 0 C10 3 -10 3 -22 0 Z"/>
      <path d="M14 -46 C24 -36 26 -16 22 0 C18 1 14 2 12 2 C16 -14 16 -32 10 -46 Z" fill="${h}" stroke="none"/>
      <path class="n" d="M-8 -30 L-9 -1 M8 -30 L9 -1"/>
      <path d="M-16 1 C-16 -5 -3 -5 -3 1 Z M3 1 C3 -5 16 -5 16 1 Z"/>
      <path class="a" d="M-18 -55 C-6 -49 6 -49 18 -55 L17 -46 C6 -40 -6 -40 -17 -46 Z"/>
      <path class="a" d="M9 -45 L18 -32 L6 -37 Z"/>
      <path d="M-22 -86 L-25 -107 L-7 -96 Z"/>
      <path d="M8 -96 L23 -108 L22 -86 Z"/>
      <path class="n thin" d="M-20 -92 L-21 -101 M18 -101 L18 -92"/>
      <path d="M-26 -70 C-28 -88 -16 -98 0 -98 C16 -98 28 -88 26 -70 C24 -56 12 -50 0 -50 C-12 -50 -24 -56 -26 -70 Z"/>
      <path class="n thin" d="M-4 -97 L-3 -90 M3 -97 L3 -91"/>
      <path class="n" d="M-26 -80 C-14 -83 4 -87 25 -93"/>
      <ellipse class="k" cx="-10" cy="-76" rx="7.5" ry="6.5"/>
      <path class="k" d="M-2.5 -68 L2.5 -68 L0 -64.5 Z"/>
      <path class="n" d="M0 -64.5 C-1 -60.5 -5 -60.5 -6 -62.5 M0 -64.5 C1 -60.5 5 -60.5 6 -62.5"/>
      <path class="n thin" d="M-15 -66 L-29 -68 M-15 -63 L-28 -59 M15 -66 L29 -68 M15 -63 L28 -59"/>`,
  },
  ghost: {
    k: 1.3,
    box: { l: -26, r: 26, t: -70, b: 0 },
    seat: 'behind',
    eyes: [
      { x: -8, y: -44, r: 6.5, pupil: 3.2, max: 3 },
      { x: 9, y: -44, r: 6.5, pupil: 3.2, max: 3 },
    ],
    idle: 'dcf-bob',
    body: (h) => `
      <path d="M-23 -14 L-23 -40 C-23 -59 -12 -67 0 -67 C12 -67 23 -59 23 -40 L23 -14 C12 -10 -12 -10 -23 -14 Z"/>
      <path d="M13 -61 C21 -54 23 -46 23 -36 L23 -15 L15 -13 L15 -36 C15 -46 15 -54 13 -61 Z" fill="${h}" stroke="none"/>
      <path class="n thin" d="M-16 -56 C-12 -61 -6 -63 -2 -63"/>
      <path class="k" d="M-5 -33 C-3 -27 4 -27 6 -33 Z"/>
      <path class="n thin" d="M-17 -35 l3 -2 M-14 -34 l3 -2 M14 -35 l3 -2 M17 -34 l3 -2"/>`,
    front: () => `
      <path d="M-25 -32 C-27 -38 -21 -42 -17 -38 C-15 -42 -10 -41 -10 -36 L-11 -30 C-15 -28 -22 -28 -25 -32 Z"/>
      <path d="M25 -32 C27 -38 21 -42 17 -38 C15 -42 10 -41 10 -36 L11 -30 C15 -28 22 -28 25 -32 Z"/>`,
  },
  mushroom: {
    k: 1.12,
    box: { l: -27, r: 27, t: -56, b: 4 },
    seat: 'front',
    eyes: [
      { x: -4.5, y: -16, r: 0, pupil: 1.9, max: 1.3 },
      { x: 4.5, y: -16, r: 0, pupil: 1.9, max: 1.3 },
    ],
    idle: 'dcf-sway',
    body: (h) => `
      <ellipse class="dcf-shadow" cx="0" cy="2" rx="18" ry="3"/>
      <path class="n" d="M-10 -15 L-17 -9 M10 -15 L17 -11"/>
      <path d="M-10 0 C-12 -10 -10 -22 -8 -28 L8 -28 C10 -22 12 -10 10 0 C4 2 -4 2 -10 0 Z"/>
      <path d="M5 -27 C9 -20 11 -10 10 0 C8 1 6 1.5 4 1.5 C6 -8 6 -18 2 -27 Z" fill="${h}" stroke="none"/>
      <path class="r" d="M-25 -28 C-27 -45 -12 -55 0 -55 C12 -55 27 -45 25 -28 C14 -23 -14 -23 -25 -28 Z"/>
      <circle cx="-12" cy="-40" r="4.2"/>
      <circle cx="6" cy="-46" r="3.4"/>
      <circle cx="15" cy="-34" r="3"/>
      <circle cx="-2" cy="-33" r="2.4"/>
      <path class="n" d="M-2 -10 C-1 -8 1 -8 2 -10"/>`,
  },
}

// Each doodle in a 32-unit box centred on (0, 0).
export const doodleSvg = (kind) => {
  switch (kind) {
    case 'gem':
      return `<text x="0" y="1" font-size="26" text-anchor="middle" dominant-baseline="central" style="stroke:none">💎</text>`
    case 'note':
      return `<text x="0" y="1" font-size="26" text-anchor="middle" dominant-baseline="central" style="stroke:none">🎵</text>`
    case 'flame':
      return `<path fill="${ACCENT.flame}" d="M0 14 C-9 14 -12 6 -10 0 C-8 -5 -4 -6 -4 -12 C1 -9 3 -5 2 -1 C4 -3 5 -6 5 -8 C10 -3 11 4 8 9 C6 12 3 14 0 14 Z"/><path fill="${ACCENT.flameCore}" d="M0 11.5 C-4 11.5 -6 8 -5 5 C-4 2 -1 1 -1 -3 C2 -1 4 3 3 6 C4 5 5 4 5 3 C7 6 5 11.5 0 11.5 Z"/>`
    case 'sandwich':
      return `<path fill="${ACCENT.bread}" d="M-13 5 L13 5 L12.5 9.5 C4 11 -4 11 -12.5 9.5 Z"/><path fill="${ACCENT.gold}" d="M-12 2 L12 2 L11 5 L5 5 L3 9 L1 5 L-12 5 Z"/><path fill="none" stroke="${ACCENT.leaf}" stroke-width="2.6" d="M-13 1 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0"/><path fill="${ACCENT.bread}" d="M-13 -1 C-14 -8 -10 -11 -6 -10 C-3 -13.5 3 -13.5 6 -10 C10 -11 14 -8 13 -1 Z"/><path fill="none" stroke-width="1.2" d="M-6 -6 l1.5 -1 M0 -8 l1.5 -1 M6 -6 l1.5 -1"/>`
    case 'star':
      return `<path fill="${ACCENT.gold}" d="M0 -13 L3.6 -4.4 L13 -4 L5.8 2.2 L8.2 12 L0 6.6 L-8.2 12 L-5.8 2.2 L-13 -4 L-3.6 -4.4 Z"/>`
    case 'heart':
      return `<path fill="${ACCENT.heart}" d="M0 11 C-6 6 -13 1 -13 -5 C-13 -10 -8 -13 -4 -11 C-2 -10 -1 -8 0 -6 C1 -8 2 -10 4 -11 C8 -13 13 -10 13 -5 C13 1 6 6 0 11 Z"/>`
    case 'bolt':
      return `<path fill="${ACCENT.gold}" d="M3 -14 L-8 2 L-1 2 L-4 14 L8 -3 L1 -3 Z"/>`
    case 'sparkle':
      return `<path fill="#8fdcff" d="M0 -13 C1 -4 4 -1 13 0 C4 1 1 4 0 13 C-1 4 -4 1 -13 0 C-4 -1 -1 -4 0 -13 Z"/>`
    default:
      return ''
  }
}

export const FONT_SIZE = 200
export const DEFAULT_FONT = '"Arial Black", "Inter Display", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'

export const estimate = (word) => ({
  advances: Array.from(word).map((c) => (c === ' ' ? 0.3 : /[IJ1]/.test(c) ? 0.42 : /[MW]/.test(c) ? 0.98 : 0.76) * FONT_SIZE),
  cap: 0.73 * FONT_SIZE,
})

export const measure = (word, family) => {
  if (typeof document === 'undefined') return null
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.font = '900 ' + FONT_SIZE + 'px ' + family
  const chars = Array.from(word)
  const advances = []
  let prev = 0
  for (let i = 0; i < chars.length; i++) {
    const wNow = ctx.measureText(chars.slice(0, i + 1).join('')).width
    advances.push(wNow - prev)
    prev = wNow
  }
  const m = ctx.measureText(word.replace(/\s/g, '') || 'H')
  const cap = m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : 0.73 * FONT_SIZE
  return { advances, cap }
}
