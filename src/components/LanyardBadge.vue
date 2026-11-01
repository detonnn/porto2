<template>
  <section ref="rootRef" class="lyd" :class="className" :style="{ height }">
    <canvas ref="canvasRef" class="lyd__canvas" aria-hidden="true"></canvas>

    <div
      ref="cardRef"
      class="lyd__card"
      role="button"
      tabindex="0"
      aria-label="Badge. Drag to swing, press to flip."
      :aria-pressed="showBack"
      :style="cardStyle"
      @keydown="onKeydown"
    >
      <!-- badge clip: hooks the ring, bites the card -->
      <div class="lyd__clip" aria-hidden="true" :style="clipStyle"></div>

      <div ref="innerRef" class="lyd__inner" :style="innerStyle">
        <div class="lyd__face" :style="faceStyle">
          <div class="lyd__content lyd__cut">
          <slot name="front">
            <div class="lyd__fill" :style="{ background: cardColor, color: inkColor }">
              <LanyardArt
                class="lyd__abs"
                :style="{ width: 300 * s + 'px', right: -130 * s + 'px', top: 100 * s + 'px' }"
              />
              <LanyardArt
                class="lyd__abs"
                :style="{ width: 210 * s + 'px', left: -40 * s + 'px', bottom: -70 * s + 'px', opacity: 0.8 }"
              />
              <LanyardArt
                type="arrow"
                class="lyd__abs"
                :style="{
                  width: 14 * s + 'px',
                  height: 250 * s + 'px',
                  left: 26 * s + 'px',
                  top: 110 * s + 'px',
                  transform: 'rotate(-14deg)',
                }"
              />
              <div
                class="lyd__abs"
                :style="{ left: 22 * s + 'px', top: 34 * s + 'px', right: 22 * s + 'px' }"
              >
                <div
                  :style="{
                    fontFamily: displayFont,
                    fontWeight: 700,
                    fontSize: 25 * s + 'px',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    letterSpacing: '0.01em',
                  }"
                >
                  {{ title }}
                </div>
                <div
                  :style="{
                    fontSize: 6.5 * s + 'px',
                    marginTop: 6 * s + 'px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    opacity: 0.85,
                  }"
                >
                  {{ subtitle }}
                </div>
              </div>
            </div>
          </slot>
          </div>
          <div class="lyd__slot" aria-hidden="true" :style="slotStyle"></div>
          <div class="lyd__shade lyd__cut" aria-hidden="true"></div>
        </div>

        <div class="lyd__face" :style="[faceStyle, { transform: 'rotateY(180deg)' }]">
          <div class="lyd__content lyd__cut">
          <slot name="back">
            <div class="lyd__fill" :style="{ background: cardColor }">
              <LanyardArt
                class="lyd__abs"
                :style="{
                  width: 150 * s + 'px',
                  right: -30 * s + 'px',
                  top: 30 * s + 'px',
                  color: inkColor,
                  opacity: 0.6,
                }"
              />
              <div
                class="lyd__abs"
                :style="{ left: 22 * s + 'px', top: 70 * s + 'px', color: strapColor }"
              >
                <LanyardArt :style="{ width: 26 * s + 'px', color: inkColor }" />
                <div
                  :style="{
                    width: 16 * s + 'px',
                    height: 2 * s + 'px',
                    background: strapColor,
                    margin: 14 * s + 'px 0 ' + 8 * s + 'px',
                  }"
                ></div>
                <div
                  :style="{
                    fontFamily: displayFont,
                    fontWeight: 700,
                    fontSize: 17 * s + 'px',
                    lineHeight: 1.05,
                    textTransform: 'uppercase',
                  }"
                >
                  {{ name }}
                </div>
                <div
                  :style="{
                    fontSize: 7 * s + 'px',
                    marginTop: 3 * s + 'px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    opacity: 0.7,
                  }"
                >
                  {{ role }}
                </div>
              </div>
              <div
                class="lyd__abs"
                :style="{
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '44%',
                  overflow: 'hidden',
                  background: strapColor,
                  borderTopLeftRadius: 40 * s + 'px',
                  color: cardColor,
                }"
              >
                <LanyardArt
                  class="lyd__abs"
                  :style="{ width: 230 * s + 'px', left: -20 * s + 'px', top: -40 * s + 'px', opacity: 0.85 }"
                />
                <LanyardArt
                  type="arrow"
                  class="lyd__abs"
                  :style="{
                    width: 12 * s + 'px',
                    height: 220 * s + 'px',
                    left: 150 * s + 'px',
                    top: -40 * s + 'px',
                    transform: 'rotate(62deg)',
                  }"
                />
              </div>
            </div>
          </slot>
          </div>
          <div class="lyd__slot" aria-hidden="true" :style="slotStyle"></div>
          <div class="lyd__shade lyd__cut" aria-hidden="true"></div>
        </div>
      </div>
    </div>

    <button
      v-if="flipButton"
      type="button"
      class="lyd__flip"
      :aria-pressed="showBack"
      @click="doFlip"
    >
      {{ showBack ? 'Show front' : 'Show back' }}
    </button>
  </section>
</template>

<script setup>
/**
 * Lanyard Badge (Vue 3 port of the React component).
 * Physics (utils/lanyardPhysics.js) and strap texture (utils/lanyardStrap.js)
 * are unchanged. The old useEffect is `mountBadge()` below; `active` decides
 * when it runs, so nothing simulates while the section is offscreen.
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import LanyardArt from './LanyardArt.vue'
import { integrate, solve, spinStep, swingAngle } from '../utils/lanyardPhysics'
import { makeStrap } from '../utils/lanyardStrap'

const props = defineProps({
  title: { type: String, default: 'The Future Is Handmade' },
  subtitle: { type: String, default: 'Design Week · Vol. 2 · 2026' },
  name: { type: String, default: 'Alex Morgan' },
  role: { type: String, default: 'Documentation' },
  strapText: { type: String, default: 'the future is handmade' },
  strapLabel: { type: String, default: 'DESIGN WEEK 2026' },
  strapColor: { type: String, default: '#141312' },
  inkColor: { type: String, default: '#b59a6c' },
  cardColor: { type: String, default: '#e8dfcc' },
  flipButton: { type: Boolean, default: true },
  cardWidth: { type: Number, default: 240 },
  /** Card height / width. 1.5 = the original 3:2 portrait. */
  cardRatio: { type: Number, default: 1.5 },
  /** Root height. A definite length, never a percentage. */
  height: { type: String, default: '100svh' },
  className: { type: String, default: '' },
  /** Physics runs only while true. Turning it on replays the entrance swing. */
  active: { type: Boolean, default: true },
  /** x of the rope anchors inside the root. 0 = centred. */
  anchorX: { type: Number, default: 0 },
  /** Half the distance between the two anchors. 0 = derived from the root width. */
  anchorSpread: { type: Number, default: 0 },
  /** Height used to place the resting badge. 0 = the root height (lets the root be bigger than the layout, so the badge can be dragged freely). */
  layoutHeight: { type: Number, default: 0 },
  displayFont: {
    type: String,
    default: '"Oswald", "Bebas Neue", "Arial Narrow", Impact, sans-serif',
  },
  scriptFont: {
    type: String,
    default: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive',
  },
})

const rootRef = ref(null)
const canvasRef = ref(null)
const cardRef = ref(null)
const innerRef = ref(null)

const reduced = ref(
  typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
)
const showBack = ref(false)

const cw = computed(() => props.cardWidth)
const ch = computed(() => Math.round(props.cardWidth * props.cardRatio))
const ringR = computed(() => Math.max(7, Math.round(props.cardWidth * 0.036)))
const clipH = computed(() => Math.round(props.cardWidth * 0.1))
const s = computed(() => props.cardWidth / 240) // built-in faces are laid out at 240px

const cardStyle = computed(() => ({
  width: cw.value + 'px',
  height: ch.value + ringR.value + clipH.value + 'px',
}))
const clipStyle = computed(() => ({
  width: cw.value * 0.075 + 'px',
  height: clipH.value + cw.value * 0.05 + 'px',
  borderRadius: cw.value * 0.02 + 'px',
}))
const innerStyle = computed(() => ({
  top: ringR.value + clipH.value * 0.6 + 'px',
  height: ch.value + 'px',
}))
// real punched hole: the slot shape is cut out of the card so the page shows through
const faceStyle = computed(() => {
  const w = +(cw.value * 0.2).toFixed(2)
  const h = +(cw.value * 0.035).toFixed(2)
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='" + w + "' height='" + h + "'>" +
    "<rect width='" + w + "' height='" + h + "' rx='" + h / 2 + "' fill='black'/></svg>"
  return {
    borderRadius: cw.value * 0.06 + 'px',
    '--slot-mask': 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")',
    '--slot-t': cw.value * 0.05 + 'px',
  }
})
const slotStyle = computed(() => ({
  top: cw.value * 0.05 + 'px',
  width: cw.value * 0.2 + 'px',
  height: cw.value * 0.035 + 'px',
}))

const lookKey = computed(() =>
  [props.strapText, props.strapLabel, props.strapColor, props.inkColor].join('|'),
)

let teardown = null
let relook = null
let rebuild = null
let flipFn = () => {}

function doFlip() {
  flipFn()
}
function onKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    flipFn()
  }
}

function mountBadge() {
  const root = rootRef.value
  const canvas = canvasRef.value
  const card = cardRef.value
  const inner = innerRef.value
  const ctx = canvas && canvas.getContext('2d')
  if (!root || !canvas || !card || !inner || !ctx) return null

  const cwv = cw.value
  const chv = ch.value
  const ring = ringR.value
  const clip = clipH.value
  const isReduced = reduced.value

  const sw = Math.max(14, Math.round(cwv * 0.1)) // strap width
  const lowLen = sw * 2.2 // buckle to ring
  const arm = ring * 2 + clip + chv * 0.55 // ring to the card's centre of mass
  const N = 14

  let pts = []
  let links = []
  let left = []
  let right = []
  let low = []
  let iB = 0
  let iT = 0
  let iC = 0
  let strandRest = 1
  let dpr = 1
  let W = 1
  let H = 1
  let strapTex = null
  let plainTex = null
  // theme change: old textures stay under the new ones while they fade in
  let prevStrap = null
  let prevPlain = null
  let fadeStart = 0
  const FADE_MS = 500
  let fade = 1
  const spin = { a: 0, v: 0 }
  let spinTarget = showBack.value ? Math.PI : 0
  spin.a = spinTarget

  const STEP = 1 / 120
  const GRAVITY = 2400
  const ITER = 18

  const add = (x, y, w) => {
    pts.push({ x, y, px: x, py: y, w })
    return pts.length - 1
  }
  const strand = (from, to, n, slack) => {
    const a = pts[from]
    const b = pts[to]
    const rest = (Math.hypot(b.x - a.x, b.y - a.y) * slack) / n
    const ids = [from]
    for (let i = 1; i < n; i++)
      ids.push(add(a.x + ((b.x - a.x) * i) / n, a.y + ((b.y - a.y) * i) / n, 1))
    ids.push(to)
    for (let i = 0; i < n; i++) links.push([ids[i], ids[i + 1], rest])
    return { ids, rest }
  }

  const strapOpts = () => ({
    color: props.strapColor,
    ink: props.inkColor,
    text: props.strapText,
    label: props.strapLabel,
    displayFont: props.displayFont,
    scriptFont: props.scriptFont,
  })
  const makeTextures = () => {
    strapTex = makeStrap(strandRest * N + 4, sw, dpr, strapOpts())
    plainTex = makeStrap(lowLen + 4, sw * 0.8, dpr, { ...strapOpts(), plain: true })
  }
  // theme / font change: repaint the strap only, keep the swing going
  relook = () => {
    const op = strapTex
    const pp = plainTex
    makeTextures()
    if (op && pp) {
      prevStrap = op
      prevPlain = pp
      fadeStart = performance.now()
      fade = 0
    }
  }

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.max(1, root.clientWidth)
    H = Math.max(1, root.clientHeight)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)

    pts = []
    links = []
    const cx = props.anchorX > 0 ? props.anchorX : W / 2
    const spread = props.anchorSpread > 0 ? props.anchorSpread : Math.min(W * 0.16, cwv * 0.55)
    const top = -sw * 2
    const HL = props.layoutHeight > 0 ? props.layoutHeight : H
    // hang the buckle so the whole card fits, but never above a sixth of the frame
    const bY = Math.max(HL * 0.16, Math.min(HL * 0.42, HL - (lowLen + ring * 2 + clip + chv) - 28))

    const aL = add(cx - spread, top, 0)
    iB = add(cx, bY, 1.4)
    const l = strand(aL, iB, N, 1.03)
    const aR = add(cx + spread, top, 0)
    const r = strand(aR, iB, N, 1.03)
    iT = add(cx, bY + lowLen, 0.8)
    const lo = strand(iB, iT, 3, 1)
    iC = add(cx, bY + lowLen + arm, 0.25)
    links.push([iT, iC, arm])
    left = l.ids
    right = r.ids
    low = lo.ids
    strandRest = l.rest

    makeTextures()

    if (isReduced) {
      for (let i = 0; i < 900; i++) {
        integrate(pts, STEP, GRAVITY, 0.98)
        solve(pts, links, ITER)
      }
    } else {
      // enter mid-swing, as if someone just let go of it
      pts[iC].x += cwv * 0.55
      pts[iC].px = pts[iC].x - 2
      spin.v = 5
    }
  }

  // ---- drawing ---------------------------------------------------------
  const ribbon = (ids, tex, prev, rest, light) => {
    const Wt = tex.width
    for (let i = 0; i < ids.length - 1; i++) {
      const a = pts[ids[i]]
      const b = pts[ids[i + 1]]
      const dx = (b.x - a.x) * dpr
      const dy = (b.y - a.y) * dpr
      const len = Math.hypot(dx, dy) || 1e-6
      const tx = dx / len
      const ty = dy / len
      // glyph tops face +n; this pairing keeps the print readable, not mirrored
      const nx = ty
      const ny = -tx
      const v0 = i * rest * dpr
      const dv = rest * dpr
      const k = len / dv
      ctx.setTransform(
        nx,
        ny,
        tx * k,
        ty * k,
        a.x * dpr - (nx * Wt) / 2 - tx * k * v0,
        a.y * dpr - (ny * Wt) / 2 - ty * k * v0,
      )
      // +1.5 overlaps the next slice, so bends never show a hairline seam
      const src = Math.min(dv + 1.5, tex.height - v0)
      if (src > 0) {
        const old = fade < 1 && prev && prev.width === tex.width && prev.height === tex.height
        if (old) ctx.drawImage(prev, 0, v0, Wt, src, 0, v0, Wt, src)
        ctx.globalAlpha = old ? fade : 1
        ctx.drawImage(tex, 0, v0, Wt, src, 0, v0, Wt, src)
        ctx.globalAlpha = 1
      }
      // a strand turned away from the light reads darker, which sells the 3D
      const shade = 0.22 * (1 - Math.max(0, nx * light))
      ctx.fillStyle = 'rgba(0,0,0,' + shade.toFixed(3) + ')'
      ctx.fillRect(0, v0, Wt, dv + 1)
    }
  }

  const metal = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1)
    g.addColorStop(0, '#f4efe4')
    g.addColorStop(0.45, '#b9b0a0')
    g.addColorStop(0.55, '#8f8778')
    g.addColorStop(1, '#ece6da')
    return g
  }

  const draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!strapTex || !plainTex) return
    ctx.imageSmoothingEnabled = true
    if (fade < 1) {
      const t = Math.min(1, (performance.now() - fadeStart) / FADE_MS)
      fade = t * t * (3 - 2 * t) // smoothstep
      if (t >= 1) {
        fade = 1
        prevStrap = null
        prevPlain = null
      }
    }
    ribbon(left, strapTex, prevStrap, strandRest, -1)
    ribbon(right, strapTex, prevStrap, strandRest, 1)
    ribbon(low, plainTex, prevPlain, (lowLen * 1) / 3, 0)

    // side-release buckle, turned to follow the short strap
    const B = pts[iB]
    const T = pts[iT]
    const ang = Math.atan2(T.x - B.x, T.y - B.y)
    const u = sw / 20
    ctx.setTransform(dpr, 0, 0, dpr, B.x * dpr, B.y * dpr)
    ctx.rotate(-ang)
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 6 * dpr
    ctx.shadowOffsetY = 2 * dpr
    ctx.fillStyle = metal(-16 * u, 0, 16 * u, 0)
    ctx.beginPath()
    ctx.roundRect(-15 * u, -14 * u, 30 * u, 17 * u, 3 * u)
    ctx.fill()
    ctx.beginPath()
    ctx.roundRect(-11 * u, 1 * u, 22 * u, 15 * u, [2 * u, 2 * u, 6 * u, 6 * u])
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = 'rgba(40,36,30,0.55)'
    ctx.fillRect(-10 * u, -9 * u, 20 * u, 2.2 * u)
    ctx.fillRect(-5 * u, 6 * u, 10 * u, 3 * u)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 0.8 * u
    ctx.beginPath()
    ctx.moveTo(-13 * u, -12.5 * u)
    ctx.lineTo(13 * u, -12.5 * u)
    ctx.stroke()

    // split ring
    ctx.setTransform(dpr, 0, 0, dpr, T.x * dpr, (T.y + ring * 0.8) * dpr)
    ctx.lineWidth = Math.max(2.5, ring * 0.38)
    ctx.strokeStyle = metal(-ring, -ring, ring, ring)
    ctx.beginPath()
    ctx.arc(0, 0, ring, 0, Math.PI * 2)
    ctx.stroke()
  }

  const place = () => {
    const T = pts[iT]
    const C = pts[iC]
    const swing = swingAngle(T, C)
    card.style.transform =
      'translate3d(' +
      (T.x - cwv / 2).toFixed(2) +
      'px,' +
      (T.y + ring).toFixed(2) +
      'px,0) rotate(' +
      (-swing).toFixed(4) +
      'rad)'
    inner.style.transform = 'perspective(1100px) rotateY(' + spin.a.toFixed(4) + 'rad)'
    const edge = 1 - Math.abs(Math.cos(spin.a))
    inner.style.setProperty('--lyd-dim', (edge * 0.5).toFixed(3))
    inner.style.setProperty('--lyd-shine', (50 + Math.sin(spin.a) * 70 + swing * 90).toFixed(1) + '%')
  }

  // ---- interaction -----------------------------------------------------
  let drag = null
  const local = (e) => {
    const r = root.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }
  const flip = () => {
    spinTarget = spinTarget === 0 ? Math.PI : 0
    showBack.value = spinTarget !== 0
  }
  flipFn = flip
  const onDown = (e) => {
    if (e.button > 0) return
    const [x, y] = local(e)
    const T = pts[iT]
    drag = { id: e.pointerId, ox: T.x - x, oy: T.y - y, tx: T.x, ty: T.y, sx: x, sy: y, moved: false }
    pts[iT].w = 0
    card.setPointerCapture(e.pointerId)
    card.style.cursor = 'grabbing'
  }
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    const [x, y] = local(e)
    drag.tx = x + drag.ox
    drag.ty = y + drag.oy
    if (Math.hypot(x - drag.sx, y - drag.sy) > 5) drag.moved = true
  }
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return
    if (!drag.moved) flip()
    drag = null
    pts[iT].w = 0.8
    card.style.cursor = 'grab'
  }
  card.addEventListener('pointerdown', onDown)
  card.addEventListener('pointermove', onMove)
  card.addEventListener('pointerup', onUp)
  card.addEventListener('pointercancel', onUp)

  // ---- loop --------------------------------------------------------------
  let raf = 0
  let acc = 0
  let last = performance.now()
  let t = 0
  const tick = (now) => {
    acc += Math.min(0.05, (now - last) / 1000)
    last = now
    let steps = 0
    while (acc >= STEP && steps < 8) {
      acc -= STEP
      steps++
      t += STEP
      if (drag) {
        const T = pts[iT]
        T.px = T.x
        T.py = T.y
        T.x += (drag.tx - T.x) * 0.35
        T.y += (drag.ty - T.y) * 0.35
      }
      const C = pts[iC]
      if (!isReduced && !drag) {
        // a draught in the room, so the badge is never perfectly still
        C.x += (22 * Math.sin(t * 0.7) + 12 * Math.sin(t * 1.9)) * STEP * STEP
      }
      integrate(pts, STEP, GRAVITY, 0.992)
      solve(pts, links, ITER)
      const vx = (C.x - C.px) / STEP
      spinStep(spin, spinTarget, STEP, vx * 0.03 + (isReduced ? 0 : 0.6 * Math.sin(t * 0.5)))
    }
    draw()
    place()
    raf = requestAnimationFrame(tick)
  }
  build()
  draw()
  place()
  raf = requestAnimationFrame(tick)

  rebuild = () => {
    build()
    draw()
    place()
  }
  const observer = new ResizeObserver(() => {
    if (Math.abs(root.clientWidth - W) < 1 && Math.abs(root.clientHeight - H) < 1) return
    rebuild()
  })
  observer.observe(root)

  return () => {
    cancelAnimationFrame(raf)
    observer.disconnect()
    card.removeEventListener('pointerdown', onDown)
    card.removeEventListener('pointermove', onMove)
    card.removeEventListener('pointerup', onUp)
    card.removeEventListener('pointercancel', onUp)
  }
}

function stop() {
  if (teardown) teardown()
  teardown = null
  relook = null
  rebuild = null
}
function start() {
  stop()
  teardown = mountBadge()
}
function sync() {
  if (props.active) start()
  else stop()
}

watch([() => props.active, reduced, cw, ch], sync, { flush: 'post' })
watch([() => props.anchorX, () => props.anchorSpread, () => props.layoutHeight], () => {
  if (rebuild) rebuild()
})
watch(lookKey, () => {
  if (relook) relook()
})

let mq = null
const onMotionChange = (e) => {
  reduced.value = e.matches
}

onMounted(() => {
  mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', onMotionChange)
  sync()
  // canvas text needs the real font, repaint the strap once it is loaded
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (relook) relook()
    })
  }
})

onBeforeUnmount(() => {
  stop()
  if (mq) mq.removeEventListener('change', onMotionChange)
})
</script>

<style scoped>
.lyd {
  position: relative;
  width: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
.lyd__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  display: block;
  pointer-events: none;
}
.lyd__card {
  position: absolute;
  left: 0;
  top: 0;
  outline: none;
  transform-origin: 50% 0;
  cursor: grab;
  touch-action: none;
  will-change: transform;
}
.lyd__card:focus-visible {
  box-shadow: 0 0 0 2px var(--accent, #fff);
  border-radius: 6px;
}
.lyd__clip {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #f4efe4, #a8a090 50%, #ece6da);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  z-index: 2;
}
.lyd__inner {
  position: absolute;
  left: 0;
  right: 0;
  transform-style: preserve-3d;
}
.lyd__face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.2);
}
.lyd__fill {
  position: relative;
  width: 100%;
  height: 100%;
}
.lyd__abs {
  position: absolute;
  max-width: none;
}
.lyd__content {
  position: absolute;
  inset: 0;
}
.lyd__cut {
  -webkit-mask-image: var(--slot-mask), linear-gradient(#000, #000);
  mask-image: var(--slot-mask), linear-gradient(#000, #000);
  -webkit-mask-position: 50% var(--slot-t), 0 0;
  mask-position: 50% var(--slot-t), 0 0;
  -webkit-mask-repeat: no-repeat, no-repeat;
  mask-repeat: no-repeat, no-repeat;
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
/* only the rim of the hole: the middle is see-through */
.lyd__slot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 999px;
  background: transparent;
  box-shadow: inset 0 1.5px 2px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.22);
  z-index: 6;
}
.lyd__shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 7;
  background: linear-gradient(
      105deg,
      transparent 35%,
      rgba(255, 255, 255, 0.28) 50%,
      transparent 65%
    )
    var(--lyd-shine, 50%) 0 / 250% 100% no-repeat,
    rgba(0, 0, 0, var(--lyd-dim, 0));
}
.lyd__flip {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--border, #2e2e2e);
  background: var(--bg-window, #000);
  color: var(--text, #fff);
  font-family: var(--body-font, monospace);
  font-size: var(--small-font-size, 0.8rem);
  cursor: pointer;
}
@media (prefers-reduced-motion: reduce) {
  .lyd__flip {
    transition: none;
  }
}
</style>
