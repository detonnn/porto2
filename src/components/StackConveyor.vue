<template>
  <section ref="sectionRef" class="stk" :data-active="active ?? ''" :data-open="openIndex ?? ''">
    <div class="stk-wrap" :class="{ wide }">
    <div class="stk-side">
    <div v-if="eyebrow || heading" class="stk-head">
      <p v-if="eyebrow" class="stk-eyebrow">{{ eyebrow }}</p>
      <h2 v-if="heading" class="stk-heading">{{ heading }}</h2>
    </div>
    <slot name="tabs" />
    <div v-if="wide" class="stk-caption" aria-live="polite">
      <p :class="{ strong: current }">
        <template v-if="current">{{ current.name }}</template>
        <template v-else>{{ caption }}</template>
      </p>
      <p v-if="current && current.description" class="sub">{{ current.description }}</p>
    </div>
    </div>
    <div class="stk-main">

    <div
      ref="stageRef" class="stk-stage" :class="{ swap }" role="group" :aria-label="heading || 'Tech stack belt'"
      :style="{ height: (geo ? geo.height : 260) + 'px' }"
      @pointerdown="onPointerDown" @pointermove="onPointerMove"
      @pointerup="finishPointer($event, false)" @pointercancel="finishPointer($event, true)"
      @pointerleave="onPointerLeave" @keydown="onKeyDown" @focusout="onBlur"
    >
      <div v-if="geo" class="stk-counter" aria-hidden="true"
        :style="{ top: counterTop + 'px', height: Math.max(0, geo.ym - counterTop) + 'px' }" />
      <div ref="beltRef" class="stk-belt" aria-hidden="true">
        <svg v-if="geo && paths" :width="geo.width" :height="geo.height" :viewBox="`0 0 ${geo.width} ${geo.height}`" focusable="false">
          <defs>
            <linearGradient :id="uid + '-side'" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style="stop-color: var(--stk-belt-side)" />
              <stop offset="1" style="stop-color: var(--stk-belt-side-low)" />
            </linearGradient>
            <radialGradient :id="uid + '-glow'">
              <stop offset="0" style="stop-color: var(--stk-glow)" />
              <stop offset="1" style="stop-color: var(--stk-glow)" stop-opacity="0" />
            </radialGradient>
            <linearGradient :id="uid + '-island'" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style="stop-color: var(--stk-island)" />
              <stop offset="1" style="stop-color: var(--stk-island-low)" />
            </linearGradient>
          </defs>
          <ellipse :cx="geo.width / 2" :cy="geo.height - geo.d * 0.1" :rx="geo.width * 0.46" :ry="geo.d * 0.3" :fill="`url(#${uid}-glow)`" />
          <path :d="paths.outer" :transform="`translate(0 ${(geo.side + geo.d * 0.07).toFixed(1)})`" style="fill: var(--stk-drop)" />
          <path :d="paths.outer + paths.inner" fill-rule="evenodd" :transform="`translate(0 ${geo.side.toFixed(1)})`" :style="{ fill: `url(#${uid}-side)` }" />
          <path :d="paths.outer + paths.inner" fill-rule="evenodd" style="fill: var(--stk-belt)" />
          <path ref="seamRef" fill="none" style="stroke: var(--stk-seam)" :stroke-width="Math.max(1, geo.d * 0.013)" stroke-linecap="round" />
          <path ref="glintRef" fill="none" style="stroke: var(--stk-glint)" :stroke-width="Math.max(0.8, geo.d * 0.009)" stroke-linecap="round" />
          <path :d="paths.outer" fill="none" style="stroke: var(--stk-rail)" :stroke-width="Math.max(2, geo.d * 0.026)" />
          <path :d="paths.inner" fill="none" style="stroke: var(--stk-rail)" :stroke-width="Math.max(1.6, geo.d * 0.02)" />
          <path :d="paths.island" style="fill: var(--stk-island-wall)" />
          <path :d="paths.island" :transform="`translate(0 ${(-geo.side * 0.6).toFixed(1)})`" :style="{ fill: `url(#${uid}-island)` }" />
        </svg>
      </div>

      <button
        v-for="(item, i) in list" v-show="!!geo" :key="item.key" :ref="(el) => (plates[i] = el)" type="button"
        class="stk-plate" :data-dish="i" :data-active="active === i || undefined"
        :tabindex="i === roving ? 0 : -1" :aria-label="item.name"
        aria-haspopup="dialog" :aria-current="active === i || undefined"
        :style="plateStyle(i)" @focus="onFocus(i)" @click="onClick($event, i)"
      >
        <span class="stk-shadow" :ref="(el) => (shadows[i] = el)" aria-hidden="true" />
        <span class="stk-lift" :ref="(el) => (lifts[i] = el)">
          <span class="stk-disc" aria-hidden="true">
            <svg class="stk-logo" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet"><path :d="icons[item.icon]" /></svg>
          </span>
          <span class="stk-shade" :ref="(el) => (shades[i] = el)" aria-hidden="true" />
          <span class="stk-anchor" :ref="(el) => (anchors[i] = el)" aria-hidden="true">
            <span class="stk-chip" :class="{ on: active === i && lifted !== i }">
              {{ item.name }}
            </span>
          </span>
        </span>
      </button>
    </div>

    <div v-if="base.length > 1" class="stk-controls">
      <button type="button" class="stk-ctl" aria-label="Previous plate" @click="go((active ?? sim.center) - 1, false)">
        <svg viewBox="0 0 16 16"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
      </button>
      <button type="button" class="stk-ctl" :aria-pressed="paused" aria-label="Pause belt" @click="togglePause">
        <svg v-if="paused" viewBox="0 0 16 16" class="fill"><path d="M5 3.4v9.2a.6.6 0 0 0 .9.5l7.4-4.6a.6.6 0 0 0 0-1L5.9 2.9a.6.6 0 0 0-.9.5Z" /></svg>
        <svg v-else viewBox="0 0 16 16" class="fill"><rect x="4" y="3" width="2.6" height="10" rx="0.8" /><rect x="9.4" y="3" width="2.6" height="10" rx="0.8" /></svg>
      </button>
      <button type="button" class="stk-ctl" aria-label="Next plate" @click="go((active ?? sim.center) + 1, false)">
        <svg viewBox="0 0 16 16"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
      </button>
    </div>

    <div v-if="!wide" class="stk-caption" aria-live="polite">
      <p :class="{ strong: current }">
        <template v-if="current">{{ current.name }}</template>
        <template v-else>{{ caption }}</template>
      </p>
      <p v-if="current && current.description" class="sub">{{ current.description }}</p>
    </div>

    </div>
    </div>

    <Teleport to="body">
      <div v-if="openIndex !== null && list[openIndex]" ref="dialogRef" class="stk-dialog" role="dialog" aria-modal="true" @keydown="onDialogKey">
        <div class="stk-backdrop" :class="{ on: shown }" @click="dismiss" />
        <div class="stk-card">
          <div class="stk-card-bg" :class="{ on: shown }" />
          <button ref="closeRef" type="button" class="stk-close" :class="{ on: shown }" @click="dismiss">Close &times;</button>
          <div ref="figureRef" class="stk-figure">
            <span class="stk-fig-shadow" />
            <span class="stk-fig-plate">
              <svg viewBox="0 0 24 24"><path :d="icons[list[openIndex].icon]" /></svg>
            </span>
          </div>
          <div class="stk-info" :class="{ on: shown }">
            <p class="stk-idx">{{ pad(openIndex % base.length + 1) }} / {{ pad(base.length) }}</p>
            <h3 class="stk-title">{{ list[openIndex].name }}</h3>
            <p v-if="list[openIndex].description" class="stk-desc">{{ list[openIndex].description }}</p>
            <div class="stk-foot">
              <button type="button" class="stk-cta" @click="goProjects">View projects &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import icons from '../data/stackIcons'

const props = defineProps({
  items: { type: Array, required: true }, // { id, name, price, description, details, icon }
  eyebrow: String,
  heading: String,
  caption: String,
  speed: { type: Number, default: 26 },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 3000 },
})

const SPACING = 1.35, CURVE = 0.95, BAND = 1.22, TILT = 0.8, SLAT = 0.34
const LIFT_Y = -6, LIFT_SCALE = 0.08, BACK_SHADE = 0.15, CHIP_ROOM = 34
const HOLD = 1400, RUN = 0, SEEK = 1, DRAG = 2
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const pad = (n) => String(n).padStart(2, '0')
const coarse = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches

// short lists get repeated so the belt always looks full
const PLATES = 8 // same for every tab, so the belt keeps its shape when tabs change
const shownItems = ref(props.items) // lags props.items by one fade-out, see the watcher
const base = computed(() => shownItems.value)
const list = computed(() => {
  const src = shownItems.value
  if (!src.length) return []
  return Array.from({ length: PLATES }, (_, i) => ({ ...src[i % src.length], key: src[i % src.length].id + '-' + i }))
})
const count = computed(() => list.value.length)

const uid = 'stk' + Math.random().toString(36).slice(2, 8)
const sectionRef = ref(null), stageRef = ref(null), beltRef = ref(null)
const seamRef = ref(null), glintRef = ref(null), dialogRef = ref(null), figureRef = ref(null), closeRef = ref(null)
const plates = [], lifts = [], shades = [], shadows = [], anchors = []
const size = reactive({ section: 0, stage: 0 })
const active = ref(null)
const paused = ref(false)
const openIndex = ref(null)
const lifted = ref(null)
const center = ref(0)
const shown = ref(false)
const swap = ref(false)
const sim = {
  offset: 0, v: 0, mode: RUN, target: 0, lift: [], vlift: [], z: [], lane: [], raf: 0, last: 0,
  visible: true, init: false, touched: false, l: 0, center: -1, px: 0, py: 0, inside: false, lock: false, lockX: 0, lockY: 0,
}
const pointer = { id: -1, index: -1, x: 0, y: 0, moved: false, lane: 1, start: 0, lastX: 0, lastT: 0, v: 0 }
let pendingOpen = -1, returnFocus = null, autoActive = null, autoLast = null, playing = props.autoplay
let autoTimer = 0, closing = false, anim = null

/* ---------- geometry ---------- */
function along(g, u) {
  const { s, r } = g
  let t = ((u % g.l) + g.l) % g.l
  if (t < s) return { x: s / 2 - t, z: r, nx: 0, nz: 1, tx: -1, tz: 0 }
  t -= s
  const arc = Math.PI * r
  if (t < arc) {
    const f = t / r, sin = Math.sin(f), cos = Math.cos(f)
    return { x: -s / 2 - r * sin, z: r * cos, nx: -sin, nz: cos, tx: -cos, tz: -sin }
  }
  t -= arc
  if (t < s) return { x: -s / 2 + t, z: -r, nx: 0, nz: -1, tx: 1, tz: 0 }
  t -= s
  const f = Math.min(Math.PI, t / r), sin = Math.sin(f), cos = Math.cos(f)
  return { x: s / 2 + r * sin, z: -r * cos, nx: sin, nz: -cos, tx: cos, tz: sin }
}
function project(g, x, z) {
  const k = g.a + g.b * z
  return { x: g.cx + x * k, y: g.ym + TILT * (g.a * z + (g.b * z * z) / 2), k }
}
function makeGeo(width, n, d, kb) {
  const l = Math.max(1, n) * SPACING * d
  const r = Math.min(CURVE * d, l / (2 * Math.PI))
  const s = Math.max(0, (l - 2 * Math.PI * r) / 2)
  const g = { width, height: 0, d, r, s, l, pitch: l / Math.max(1, n), n: Math.max(1, n), kb, cx: width / 2, ym: 0, a: (1 + kb) / 2, b: (1 - kb) / (2 * r), band: BAND * d, slats: Math.max(10, Math.round(l / (SLAT * d))), side: Math.max(3, d * 0.07), edgeTop: 0 }
  let top = Infinity, bottom = -Infinity, edge = Infinity
  for (let j = 0; j < 120; j++) {
    const p = along(g, (j / 120) * l)
    const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2)
    const plate = project(g, p.x, p.z)
    const half = (plate.k * d * TILT) / 2
    edge = Math.min(edge, rim.y)
    top = Math.min(top, rim.y, plate.y + (LIFT_Y / 100) * half * 2 - half * (1 + LIFT_SCALE) - CHIP_ROOM)
    bottom = Math.max(bottom, rim.y + g.side + d * 0.06, plate.y + half + d * 0.08)
  }
  g.ym = Math.ceil(-top) + 2
  g.height = Math.ceil(bottom - top) + 4
  g.edgeTop = edge + g.ym
  return g
}
function halfSpan(g) {
  let span = 0
  for (let j = 0; j < 120; j++) {
    const p = along(g, (j / 120) * g.l)
    const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2)
    const plate = project(g, p.x, p.z)
    span = Math.max(span, Math.abs(rim.x - g.cx) + 3, Math.abs(plate.x - g.cx) + (plate.k * g.d * (1 + LIFT_SCALE)) / 2)
  }
  return span
}
function edgePath(g, offset) {
  let d = ''
  for (let j = 0; j < 168; j++) {
    const p = along(g, (j / 168) * g.l)
    const q = project(g, p.x + p.nx * offset, p.z + p.nz * offset)
    d += `${j ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`
  }
  return d + 'Z'
}
function slatPath(g, offset, shift) {
  const half = g.band * 0.46, pitch = g.l / g.slats, bulge = pitch * 0.2
  let d = ''
  for (let j = 0; j < g.slats; j++) {
    const p = along(g, offset + shift + j * pitch)
    const a = project(g, p.x - p.nx * half, p.z - p.nz * half)
    const b = project(g, p.x + p.nx * half, p.z + p.nz * half)
    const m = project(g, p.x + p.tx * bulge, p.z + p.tz * bulge)
    d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${(2 * m.x - (a.x + b.x) / 2).toFixed(1)} ${(2 * m.y - (a.y + b.y) / 2).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
  }
  return d
}
function pose(g, offset, i) {
  const p = along(g, offset - i * g.pitch)
  const q = project(g, p.x, p.z)
  return { x: q.x, y: q.y, k: q.k, depth: (p.z + g.r) / (2 * g.r) }
}
const centerOf = (g, offset) => ((Math.round((offset - g.s / 2) / g.pitch) % g.n) + g.n) % g.n

const wide = computed(() => size.section >= 820)
const narrow = computed(() => size.section > 0 && size.section < 480)
const kb = computed(() => (narrow.value ? 0.6 : 0.68))
const geo = computed(() => {
  if (!size.stage || !count.value) return null
  const span = halfSpan(makeGeo(1000, count.value, 100, kb.value)) / 100
  const cap = narrow.value ? 150 : clamp(size.section * 0.143, 96, 150)
  const fit = (size.stage - 8) / (2 * span)
  return makeGeo(size.stage, count.value, Math.round(clamp(fit, 44, cap)), kb.value)
})
const paths = computed(() => {
  const g = geo.value
  return g ? { outer: edgePath(g, g.band / 2), inner: edgePath(g, -g.band / 2), island: edgePath(g, -g.band / 2 - g.d * 0.035) } : null
})
const counterTop = computed(() => (geo.value ? Math.max(0, geo.value.edgeTop - geo.value.d * 0.34) : 0))
const current = computed(() => (active.value === null ? null : list.value[active.value] || null))
const roving = computed(() => active.value ?? center.value)

const plateStyle = (i) => (geo.value ? { '--i': i, width: geo.value.d + 'px', height: geo.value.d * TILT + 'px', visibility: lifted.value === i ? 'hidden' : undefined } : null)

/* ---------- painting ---------- */
function paintPlate(i) {
  const g = geo.value, button = plates[i]
  if (!g || !button) return
  const q = pose(g, sim.offset, i)
  const e = sim.lift[i] ?? 0
  button.style.transform = `translate3d(${(q.x - g.d / 2).toFixed(2)}px,${(q.y - (g.d * TILT) / 2).toFixed(2)}px,0) scale(${q.k.toFixed(4)})`
  const z = i === active.value ? 2000 : 100 + Math.round(q.y)
  if (sim.z[i] !== z) { sim.z[i] = z; button.style.zIndex = String(z) }
  const lane = q.depth >= 0.5 ? 'front' : 'back'
  if (sim.lane[i] !== lane) { sim.lane[i] = lane; button.dataset.lane = lane }
  const lift = lifts[i]
  if (lift) lift.style.transform = `translateY(${(LIFT_Y * e).toFixed(3)}%) scale(${(1 + LIFT_SCALE * e).toFixed(4)})`
  const shade = shades[i]
  if (shade) shade.style.opacity = (BACK_SHADE * clamp(1 - q.depth, 0, 1) * (1 - 0.7 * clamp(e, 0, 1))).toFixed(3)
  const sh = shadows[i]
  if (sh) { sh.style.transform = `translate3d(0,${(g.d * TILT * 0.05 * e).toFixed(2)}px,0) scale(${(1 + 0.14 * e).toFixed(3)})`; sh.style.opacity = (1 - 0.5 * clamp(e, 0, 1)).toFixed(3) }
  const an = anchors[i]
  if (an) an.style.transform = `scale(${(1 / (q.k * (1 + LIFT_SCALE * e))).toFixed(4)})`
}
function paintBelt() {
  const g = geo.value
  if (!g) return
  seamRef.value?.setAttribute('d', slatPath(g, sim.offset, 0))
  glintRef.value?.setAttribute('d', slatPath(g, sim.offset, -Math.max(1.4, g.d * 0.024)))
  const c = centerOf(g, sim.offset)
  if (c !== sim.center) { sim.center = c; center.value = c }
}
function paintAll() { for (let i = 0; i < count.value; i++) paintPlate(i); paintBelt() }

function hitTest(px, py) {
  const g = geo.value
  if (!g) return null
  let best = null, bestY = -Infinity
  for (let i = 0; i < count.value; i++) {
    const q = pose(g, sim.offset, i)
    const e = clamp(sim.lift[i] ?? 0, 0, 1.2)
    const grow = (1 + LIFT_SCALE * e) * (i === active.value ? 1.1 : 1)
    const rx = (g.d * q.k * grow) / 2, ry = (g.d * TILT * q.k * grow) / 2
    const dx = (px - q.x) / rx
    const dy = (py - (q.y + (LIFT_Y / 100) * g.d * TILT * q.k * e)) / ry
    if (dx * dx + dy * dy > 1) continue
    if (i === active.value) return i
    if (q.y > bestY) { best = i; bestY = q.y }
  }
  return best
}

/* ---------- simulation ---------- */
function tick(now) {
  const g = geo.value
  sim.raf = 0
  if (!g || !sim.visible) { sim.last = 0; return }
  if (coarse && sim.last && now - sim.last < 30) { sim.raf = requestAnimationFrame(tick); return } // ~30fps on touch devices
  const dt = sim.last ? clamp((now - sim.last) / 1000, 0, 0.25) : 1 / 60
  sim.last = now
  const steps = Math.max(1, Math.ceil(dt / 0.017)), h = dt / steps
  const stopped = paused.value || active.value !== null || openIndex.value !== null
  const cruise = Math.max(0, props.speed)
  for (let step = 0; step < steps; step++) {
    if (sim.mode === SEEK) {
      const w = 5.6
      sim.v += (w * w * (sim.target - sim.offset) - 2 * w * sim.v) * h
      sim.offset += sim.v * h
      if (Math.abs(sim.target - sim.offset) < 0.3 && Math.abs(sim.v) < 4) { sim.offset = sim.target; sim.v = 0; sim.mode = RUN }
    } else if (sim.mode === RUN) {
      if (stopped) { sim.v *= Math.exp(-7.2 * h); if (Math.abs(sim.v) < 0.02) sim.v = 0 }
      else {
        let e = sim.v - cruise
        if (Math.abs(e) > Math.max(6, cruise * 0.5)) e = Math.sign(e) * Math.max(0, Math.abs(e) * Math.exp(-2.4 * h) - 90 * h)
        else e *= Math.exp(-3.4 * h)
        sim.v = cruise + (Math.abs(e) < 0.01 ? 0 : e)
      }
      sim.offset += sim.v * h
    }
    for (let i = 0; i < count.value; i++) {
      const goal = i === active.value ? 1 : 0
      const x = sim.lift[i] ?? 0
      const v = (sim.vlift[i] ?? 0) + (330 * (goal - x) - 23 * (sim.vlift[i] ?? 0)) * h
      sim.lift[i] = x + v * h
      sim.vlift[i] = v
    }
  }
  let busy = sim.mode !== RUN || sim.v !== 0 || (!stopped && cruise > 0)
  for (let i = 0; i < count.value; i++) {
    const goal = i === active.value ? 1 : 0
    if (Math.abs(goal - (sim.lift[i] ?? 0)) < 0.002 && Math.abs(sim.vlift[i] ?? 0) < 0.02) { sim.lift[i] = goal; sim.vlift[i] = 0 }
    else busy = true
  }
  if (sim.inside && !sim.lock && sim.mode === RUN && openIndex.value === null && pointer.id < 0 && Math.abs(sim.v) > 0.3) {
    const hit = hitTest(sim.px, sim.py)
    if (hit !== null && hit !== active.value) hover(hit)
  }
  paintAll()
  if (busy) sim.raf = requestAnimationFrame(tick)
  else sim.last = 0
}
function kick() { if (sim.raf || !sim.visible) return; sim.last = 0; sim.raf = requestAnimationFrame(tick) }
function setActive(n) { if (active.value === n) return; active.value = n; kick() }
function stop() {
  playing = false
  sim.touched = true
  if (sim.mode === SEEK) sim.mode = RUN
  if (autoActive !== null) { const a = autoActive; autoActive = null; if (active.value === a) setActive(null) }
}
function seekTo(index) {
  const g = geo.value
  if (!g) return
  const base = g.s / 2 + index * g.pitch
  sim.target = base + Math.round((sim.offset - base) / g.l) * g.l
  sim.mode = SEEK
  kick()
}
const focusVisible = () => !!stageRef.value?.querySelector('.stk-plate:focus-visible')
function hover(hit) {
  const cur = active.value
  if (hit === cur) { if (hit !== null && autoActive === hit) { autoActive = null; playing = false } return }
  if (hit !== null) { stop(); setActive(hit); return }
  if (cur !== null && cur !== autoActive && !focusVisible()) setActive(null)
}
function go(index, focus) {
  if (!count.value) return
  const next = ((index % count.value) + count.value) % count.value
  stop()
  if (focus) plates[next]?.focus({ preventScroll: true })
  setActive(next)
  seekTo(next)
}
function togglePause() {
  stop()
  paused.value = !paused.value
  if (!paused.value && active.value !== null && !focusVisible() && !sim.inside) setActive(null)
  kick()
}

/* ---------- pointer / keyboard ---------- */
const local = (e) => { const b = stageRef.value?.getBoundingClientRect(); return { x: e.clientX - (b?.left ?? 0), y: e.clientY - (b?.top ?? 0) } }
function onPointerDown(e) {
  const g = geo.value
  if (e.button !== 0 || !g) return
  const at = local(e)
  const hit = hitTest(at.x, at.y)
  pendingOpen = -1
  Object.assign(pointer, { id: e.pointerId, index: hit ?? -1, x: e.clientX, y: e.clientY, moved: false, start: sim.offset, lane: at.y >= g.ym ? 1 : -1, lastX: e.clientX, lastT: e.timeStamp, v: 0 })
}
function onPointerMove(e) {
  const g = geo.value, stage = stageRef.value
  if (!stage || !g) return
  const at = local(e)
  if (e.pointerType === 'mouse') { sim.px = at.x; sim.py = at.y; sim.inside = true }
  if (pointer.id === e.pointerId) {
    const dx = e.clientX - pointer.x
    if (!pointer.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - pointer.y)) {
      pointer.moved = true
      stop(); setActive(null)
      sim.mode = DRAG
      if (stage.isConnected) stage.setPointerCapture(e.pointerId)
    }
    if (pointer.moved) {
      const v = (e.clientX - pointer.lastX) / Math.max(1, e.timeStamp - pointer.lastT)
      pointer.v = pointer.v * 0.6 + v * 0.4
      pointer.lastX = e.clientX; pointer.lastT = e.timeStamp
      const scale = pointer.lane > 0 ? 1 : 1 / g.kb
      sim.offset = pointer.start - pointer.lane * dx * scale
      sim.v = -pointer.lane * pointer.v * 1000 * scale
      kick()
    }
    return
  }
  if (e.pointerType !== 'mouse' || openIndex.value !== null) return
  if (sim.lock) { if (Math.hypot(at.x - sim.lockX, at.y - sim.lockY) < 4) return; sim.lock = false }
  hover(hitTest(at.x, at.y))
}
function finishPointer(e, cancelled) {
  if (pointer.id !== e.pointerId) return
  const stage = stageRef.value
  if (stage?.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId)
  const p = { ...pointer }
  pointer.id = -1
  if (sim.mode === DRAG) {
    sim.mode = RUN
    sim.v = clamp(sim.v * Math.exp(-Math.max(0, e.timeStamp - p.lastT) / 70), -1400, 1400)
    if (e.pointerType === 'mouse') { const at = local(e); sim.lock = true; sim.lockX = at.x; sim.lockY = at.y }
    kick()
    return
  }
  if (cancelled || p.moved) return
  const touch = e.pointerType !== 'mouse'
  if (p.index < 0) { if (touch && active.value !== null) { stop(); setActive(null) } return }
  stop()
  if (touch && active.value !== p.index) setActive(p.index)
  else pendingOpen = p.index
}
function onPointerLeave(e) {
  if (e.pointerType !== 'mouse') return
  sim.inside = false; sim.lock = false
  const cur = active.value
  if (pointer.id < 0 && openIndex.value === null && cur !== null && cur !== autoActive && !focusVisible()) setActive(null)
}
function onBlur(e) {
  const next = e.relatedTarget
  if ((next && stageRef.value?.contains(next)) || openIndex.value !== null || sim.inside) return
  const cur = active.value
  if (cur !== null && cur !== autoActive) setActive(null)
}
function onFocus(i) { if (pointer.id < 0) { stop(); setActive(i) } }
function onKeyDown(e) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key) || !count.value) return
  e.preventDefault()
  const own = e.target.closest?.('[data-dish]')?.getAttribute('data-dish')
  const from = own != null ? Number(own) : (active.value ?? center.value)
  go(e.key === 'Home' ? 0 : e.key === 'End' ? count.value - 1 : from + (e.key === 'ArrowRight' ? 1 : -1), true)
}
function onClick(e, i) { const pend = pendingOpen; pendingOpen = -1; if (e.detail === 0 || pend === i) openDialog(i) }

/* ---------- dialog ---------- */
function openDialog(i) {
  stop(); setActive(i)
  sim.v = 0; sim.mode = RUN
  paintBelt()
  closing = false
  shown.value = false
  openIndex.value = i
  lifted.value = i
  nextTick(() => {
    const figure = figureRef.value
    const from = lifts[i]?.getBoundingClientRect()
    closeRef.value?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    if (figure && from && from.width > 0) {
      const to = figure.getBoundingClientRect()
      const sx = from.width / to.width, sy = from.height / to.height
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      const rise = Math.min(120, Math.abs(dy) * 0.3 + 40)
      anim = figure.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: `translate(${dx * 0.42}px, ${dy * 0.42 - rise}px) scale(${((sx + 1) / 2) * 1.05}, ${((sy + 1) / 2) * 1.05}) rotate(${dx > 0 ? -6 : 6}deg)`, offset: 0.5 },
        { transform: 'none' },
      ], { duration: 680, easing: 'cubic-bezier(.22,.85,.3,1)' })
    }
    requestAnimationFrame(() => { shown.value = true })
  })
}
function finishClose() {
  anim?.cancel(); anim = null
  document.body.style.overflow = ''
  lifted.value = null
  returnFocus = openIndex.value
  openIndex.value = null
  shown.value = false
  nextTick(() => { if (returnFocus !== null) plates[returnFocus]?.focus({ preventScroll: true }); returnFocus = null })
  kick()
}
function dismiss() {
  if (closing) return
  closing = true
  shown.value = false
  const figure = figureRef.value, to = lifts[openIndex.value]?.getBoundingClientRect()
  if (!figure || !to || to.width === 0) { finishClose(); return }
  const from = figure.getBoundingClientRect()
  const sx = to.width / from.width, sy = to.height / from.height
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const a = figure.animate([
    { transform: 'none' },
    { transform: `translate(${dx * 0.58}px, ${dy * 0.58 - 36}px) scale(${(sx + 1) / 2}, ${(sy + 1) / 2})`, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
  ], { duration: 540, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' })
  a.onfinish = finishClose
}
function onDialogKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); dismiss(); return }
  if (e.key !== 'Tab') return
  const c = [...(dialogRef.value?.querySelectorAll('button') ?? [])]
  if (!c.length) return
  const first = c[0], last = c[c.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
function onDocKey(e) { if (openIndex.value !== null && e.key === 'Escape' && !dialogRef.value?.contains(e.target)) { e.preventDefault(); dismiss() } }
function goProjects() {
  dismiss()
  setTimeout(() => { document.querySelector('.nav__menu a[href="#portfolio"]')?.click() }, 600)
}

/* ---------- lifecycle ---------- */
let ro = null, io = null, mraf = 0
const onVis = () => updateVisible()
let inView = true
function updateVisible() {
  const v = inView && !document.hidden
  if (v === sim.visible) return
  sim.visible = v
  if (v) kick()
  else if (sim.raf) { cancelAnimationFrame(sim.raf); sim.raf = 0; sim.last = 0 }
}
function startAuto() {
  window.clearTimeout(autoTimer)
  if (!playing || paused.value || openIndex.value !== null || !count.value || !geo.value) return
  const show = () => {
    const g = geo.value
    if (!g || !playing) return
    const index = autoLast === null ? centerOf(g, sim.offset + props.speed * 0.25) : (autoLast + 1) % count.value
    autoLast = index; autoActive = index
    setActive(index); seekTo(index)
    autoTimer = window.setTimeout(() => {
      if (autoActive === index) { autoActive = null; if (active.value === index) setActive(null) }
      autoTimer = window.setTimeout(show, Math.max(300, props.interval - HOLD))
    }, HOLD)
  }
  autoTimer = window.setTimeout(show, autoLast === null ? 1600 : Math.max(300, props.interval - HOLD))
}

onMounted(() => {
  const apply = () => {
    mraf = 0
    const sec = Math.round(sectionRef.value?.clientWidth || 0)
    const stg = Math.round(stageRef.value?.clientWidth || 0)
    if (sec !== size.section) size.section = sec
    if (stg !== size.stage) size.stage = stg
  }
  // defer to the next frame: resizing inside the observer callback is what triggers "ResizeObserver loop" errors
  const measure = () => { if (!mraf) mraf = requestAnimationFrame(apply) }
  apply()
  ro = new ResizeObserver(measure)
  ro.observe(sectionRef.value); ro.observe(stageRef.value)
  io = new IntersectionObserver((en) => { inView = en.some((x) => x.isIntersecting); updateVisible() })
  io.observe(sectionRef.value)
  document.addEventListener('visibilitychange', onVis)
  document.addEventListener('keydown', onDocKey)
})
onBeforeUnmount(() => {
  ro?.disconnect(); io?.disconnect(); if (mraf) cancelAnimationFrame(mraf)
  document.removeEventListener('visibilitychange', onVis)
  document.removeEventListener('keydown', onDocKey)
  if (sim.raf) cancelAnimationFrame(sim.raf)
  window.clearTimeout(autoTimer); window.clearTimeout(swapTimer)
  if (openIndex.value !== null) document.body.style.overflow = ''
})

watch(geo, (g) => {
  if (!g) return
  if (!sim.init) {
    sim.init = true
    sim.offset = g.s / 2 - Math.min(props.speed * 1.62, g.pitch * 0.45)
    sim.v = paused.value ? 0 : props.speed
  } else if (sim.l > 0 && sim.l !== g.l) {
    const f = g.l / sim.l
    sim.offset *= f; sim.target *= f
  }
  sim.l = g.l; sim.z = []; sim.lane = []
  nextTick(() => { paintAll(); kick(); startAuto() })
}, { flush: 'post' })
// tab switch: the belt stays mounted. Plates shrink out, the content swaps while they are hidden, then they grow back in with a small stagger.
let swapTimer = 0
watch(() => props.items, () => {
  window.clearTimeout(swapTimer)
  window.clearTimeout(autoTimer)
  active.value = null; autoActive = null
  swap.value = true
  swapTimer = window.setTimeout(() => {
    if (openIndex.value !== null) { document.body.style.overflow = ''; lifted.value = null; openIndex.value = null; shown.value = false; closing = false }
    autoLast = null; playing = props.autoplay
    shownItems.value = props.items
    sim.lift = []; sim.vlift = []; sim.z = []; sim.lane = []
    nextTick(() => {
      paintAll(); kick(); startAuto()
      requestAnimationFrame(() => requestAnimationFrame(() => { swap.value = false }))
    })
  }, 200)
})
watch([active, paused, openIndex], () => { kick(); startAuto() })
</script>

<style>
/* theme: everything derives from the site's own variables; plates stay plain black/white */
body {
  --stk-plate: #ececec; --stk-plate-hi: #ffffff; --stk-plate-lo: #bdbdbd; --stk-plate-edge: #cfcfcf; --stk-plate-line: #b5b5b5; --stk-ink: #0a0a0a;
  --stk-drop: rgba(255,255,255,.07); --stk-glow: rgba(255,255,255,.14); --stk-belt-side-low: color-mix(in oklab, var(--text) 5%, var(--bg-window));
  --stk-belt: color-mix(in oklab, var(--text) 24%, var(--bg-window));
  --stk-seam: rgba(255,255,255,.2); --stk-glint: rgba(255,255,255,.07);
  --stk-belt-side: color-mix(in oklab, var(--text) 15%, var(--bg-window));
  --stk-rail: color-mix(in oklab, var(--text-dim) 80%, var(--bg-window));
  --stk-island: color-mix(in oklab, var(--text) 15%, var(--bg-window));
  --stk-island-low: color-mix(in oklab, var(--text) 9%, var(--bg-window));
  --stk-island-wall: color-mix(in oklab, var(--text) 7%, var(--bg-window));
}
body.light-theme, html.light-theme body {
  --stk-plate: #141414; --stk-plate-hi: #3c3c3c; --stk-plate-lo: #050505; --stk-plate-edge: #000; --stk-plate-line: #4a4a4a; --stk-ink: #f5f5f5;
  --stk-drop: rgba(0,0,0,.22); --stk-glow: rgba(0,0,0,.16); --stk-belt-side-low: color-mix(in oklab, var(--text) 52%, var(--bg-window));
  --stk-seam: rgba(0,0,0,.4); --stk-glint: rgba(255,255,255,.14);
  --stk-belt: color-mix(in oklab, var(--text) 24%, var(--bg-window));
  --stk-belt-side: color-mix(in oklab, var(--text) 38%, var(--bg-window));
  --stk-island: color-mix(in oklab, var(--text) 9%, var(--bg-window));
  --stk-island-low: color-mix(in oklab, var(--text) 16%, var(--bg-window));
  --stk-island-wall: color-mix(in oklab, var(--text) 28%, var(--bg-window));
}
.stk { position: relative; width: 100%; overflow: hidden; color: var(--text); font-family: var(--body-font); }
.stk-wrap { display: block; }
.stk-wrap.wide { display: grid; grid-template-columns: minmax(0, 20rem) minmax(0, 1fr); gap: 2.5rem; align-items: center; }
.stk-side { min-width: 0; }
.stk-main { min-width: 0; }
.stk-wrap.wide .stk-head { align-items: flex-start; text-align: left; padding: 0; }
.stk-wrap.wide .stk-caption { margin: 1rem 0 0; text-align: left; padding: 0; min-height: 4.5rem; }
.stk-head { display: flex; flex-direction: column; align-items: center; gap: .5rem; text-align: center; padding: 0 .5rem; }
.stk-eyebrow { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--text-dim); margin: 0; }
.stk-heading { font-size: clamp(1.2rem, 3.4vw, 1.75rem); font-weight: 600; letter-spacing: -.01em; text-wrap: balance; margin: 0; color: var(--text); }
.stk-stage { position: relative; width: 100%; touch-action: pan-y; user-select: none; -webkit-user-select: none; overflow-x: clip; margin-top: .5rem; }
.stk-counter { position: absolute; left: 0; right: 0; pointer-events: none;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--text) 9%, transparent) 0 1px, transparent 1px, color-mix(in oklab, var(--text) 5%, transparent) 40%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, #000 18%, #000 82%, transparent); mask-image: linear-gradient(to right, transparent, #000 18%, #000 82%, transparent); }
.stk-belt { position: absolute; inset: 0; pointer-events: none; }
.stk-belt svg { position: absolute; left: 0; top: 0; overflow: visible; }
.stk-plate { position: absolute; left: 0; top: 0; padding: 0; margin: 0; border: 0; background: none; border-radius: 50%; cursor: pointer; outline: none; will-change: transform; -webkit-tap-highlight-color: transparent; }
.stk-plate { transition: opacity .35s calc(var(--i, 0) * 35ms); }
.stk-stage.swap .stk-plate { opacity: 0; transition: opacity .2s ease; }
.stk-stage.swap .stk-disc { transform: scale(.8); transition: transform .2s ease, border-color .25s; }
.stk-plate:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.stk-shadow { position: absolute; inset: 14% 2% -10% 2%; border-radius: 50%; pointer-events: none; background: radial-gradient(closest-side, rgba(0,0,0,.5), rgba(0,0,0,0)); }
.stk-lift { position: absolute; inset: 0; }
.stk-disc { position: absolute; inset: 3%; border-radius: 50%; border: 2px solid var(--stk-plate-edge); transition: border-color .25s, transform .45s cubic-bezier(.2,1.25,.4,1) calc(var(--i, 0) * 35ms);
  background: radial-gradient(ellipse at 32% 22%, var(--stk-plate-hi) 0%, var(--stk-plate) 46%, var(--stk-plate-lo) 100%);
  box-shadow: 0 5px 0 var(--stk-plate-lo), 0 7px 10px rgba(0,0,0,.4), inset 0 2px 1px rgba(255,255,255,.35), inset 0 0 0 6px var(--stk-plate), inset 0 0 0 7px var(--stk-plate-line); }
.stk-disc::after { content: ''; position: absolute; inset: 17%; border-radius: 50%; border: 1px solid var(--stk-plate-line);
  background: radial-gradient(ellipse at 68% 78%, var(--stk-plate-hi) 0%, var(--stk-plate) 55%, var(--stk-plate-lo) 130%); box-shadow: inset 0 3px 5px rgba(0,0,0,.28), inset 0 -1px 1px rgba(255,255,255,.18); }
.stk-plate[data-active] .stk-disc { border-color: var(--accent); }
.stk-logo { z-index: 1; position: absolute; left: 50%; top: 50%; width: 46%; height: 46%; transform: translate(-50%, -50%); fill: var(--stk-ink); }
.stk-shade { position: absolute; inset: 3%; border-radius: 50%; background: #000; opacity: 0; pointer-events: none; }
.stk-anchor { position: absolute; left: 50%; top: 0; width: 0; height: 0; pointer-events: none; }
.stk-chip { position: absolute; left: 0; bottom: 7px; transform: translate(-50%, 4px); display: inline-flex; gap: 6px; align-items: center; white-space: nowrap; padding: 5px 10px; border-radius: 999px;
  background: var(--bg-elev, var(--bg-window)); color: var(--text); border: 1px solid var(--border); font-size: 11px; font-weight: 600; line-height: 1; opacity: 0; transition: opacity .3s, transform .3s; box-shadow: 0 6px 16px -6px rgba(0,0,0,.45); }
.stk-chip em { font-style: normal; font-weight: 500; color: var(--text-dim); }
.stk-chip.on { opacity: 1; transform: translate(-50%, 0); }
.stk-controls { display: flex; justify-content: center; gap: 6px; margin-top: 4px; position: relative; z-index: 10; }
.stk-ctl { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; background: var(--bg-elev, var(--bg-window)); color: var(--text-dim); border: 1px solid var(--border); transition: color .2s; }
.stk-ctl:hover { color: var(--text); }
.stk-ctl:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.stk-ctl svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.stk-ctl svg.fill { fill: currentColor; stroke: none; }
.stk-caption { margin: .5rem auto 0; max-width: 28rem; padding: 0 .5rem; text-align: center; min-height: 3.6rem; }
.stk-caption p { margin: 0; font-size: .85rem; color: var(--text-dim); }
.stk-caption p.strong { color: var(--text); font-weight: 600; }
.stk-caption p.strong span { font-weight: 400; color: var(--text-dim); }
.stk-caption .sub { margin-top: 2px; font-size: .78rem; line-height: 1.4; }

.stk-dialog { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 1rem; color: var(--text); font-family: var(--body-font); }
.stk-backdrop { position: absolute; inset: 0; background: color-mix(in oklab, var(--bg-window) 82%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); opacity: 0; transition: opacity .3s; }
.stk-backdrop.on { opacity: 1; }
.stk-card { position: relative; display: grid; gap: 1.5rem; width: 100%; max-width: 52rem; padding: 1.25rem; align-items: center; }
@media (min-width: 640px) { .stk-card { grid-template-columns: minmax(0, 1fr) minmax(0, 19rem); gap: 2.5rem; padding: 2rem; } }
.stk-card-bg { position: absolute; inset: 0; border-radius: 1.25rem; background: var(--bg-window); border: 1px solid var(--border); box-shadow: 0 30px 80px -20px rgba(0,0,0,.6); opacity: 0; transform: scale(.97); transition: opacity .3s, transform .3s; }
.stk-card-bg.on { opacity: 1; transform: none; }
.stk-close { position: absolute; top: .75rem; right: .75rem; z-index: 2; background: none; border: 0; color: var(--text-dim); font: inherit; font-size: 12px; padding: 6px 12px; border-radius: 999px; cursor: pointer; opacity: 0; transition: opacity .3s, color .2s; }
.stk-close.on { opacity: 1; }
.stk-close:hover { color: var(--text); }
.stk-close:focus-visible, .stk-cta:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.stk-figure { position: relative; margin: 0 auto; aspect-ratio: 1; width: 100%; max-width: min(42vh, 20rem); }
.stk-fig-shadow { position: absolute; inset: 14% 8% -4% 8%; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,.55), rgba(0,0,0,0)); }
.stk-fig-plate { position: absolute; inset: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid var(--stk-plate-edge);
  background: radial-gradient(ellipse at 32% 22%, var(--stk-plate-hi) 0%, var(--stk-plate) 46%, var(--stk-plate-lo) 100%);
  box-shadow: 0 10px 0 var(--stk-plate-lo), 0 16px 26px rgba(0,0,0,.45), inset 0 3px 2px rgba(255,255,255,.35), inset 0 0 0 10px var(--stk-plate), inset 0 0 0 11px var(--stk-plate-line); }
.stk-fig-plate::after { content: ''; position: absolute; inset: 17%; border-radius: 50%; border: 1px solid var(--stk-plate-line);
  background: radial-gradient(ellipse at 68% 78%, var(--stk-plate-hi) 0%, var(--stk-plate) 55%, var(--stk-plate-lo) 130%); box-shadow: inset 0 5px 9px rgba(0,0,0,.3); }
.stk-fig-plate svg { width: 42%; height: 42%; fill: var(--stk-ink); position: relative; z-index: 1; }
.stk-info { position: relative; display: flex; flex-direction: column; gap: .75rem; text-align: center; opacity: 0; transform: translateY(8px); transition: opacity .5s .15s, transform .5s .15s; }
@media (min-width: 640px) { .stk-info { text-align: left; } }
.stk-info.on { opacity: 1; transform: none; }
.stk-idx { margin: 0; font-size: 11px; letter-spacing: .2em; color: var(--text-dim); }
.stk-title { margin: 0; font-size: clamp(1.4rem, 4vw, 1.9rem); font-weight: 600; letter-spacing: -.01em; color: var(--text); }
.stk-desc { margin: 0; font-size: .85rem; line-height: 1.6; color: var(--text-dim); }
.stk-tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
@media (min-width: 640px) { .stk-tags { justify-content: flex-start; } }
.stk-tags li { font-size: 12px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--border); color: var(--text-dim); }
.stk-foot { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: center; margin-top: .5rem; }
@media (min-width: 640px) { .stk-foot { justify-content: flex-start; } }
.stk-level { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--text); }
.stk-cta { font: inherit; font-size: .85rem; font-weight: 600; padding: .6rem 1.2rem; border-radius: 999px; border: 0; cursor: pointer; background: var(--text); color: var(--bg-window); transition: transform .2s; }
.stk-cta:hover { transform: translateY(-1px); }
</style>
