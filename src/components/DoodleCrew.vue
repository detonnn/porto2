<template>
  <div
    ref="root"
    class="dcf"
    :data-play="play || reduced ? '1' : '0'"
    :data-interactive="interactive ? '1' : '0'"
    :data-tier="tier"
  >
    <div ref="world" class="dcf-world">
      <div class="dcf-stage">
        <svg
          ref="svg"
          class="dcf-svg"
          :viewBox="viewBox"
          role="group"
          :aria-label="word + ' — meet the crew'"
        >
          <defs>
            <pattern :id="uid + '-tx'" width="160" height="90" patternUnits="userSpaceOnUse"><g style="stroke:var(--dcf-bg);fill:var(--dcf-bg)" stroke-linecap="round" v-html="texHtml"></g></pattern>
            <pattern :id="uid + '-hatch'" width="4.6" height="4.6" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
              <line x1="0" y1="0" x2="0" y2="4.6" style="stroke: var(--dcf-ink)" stroke-width="1.25" />
            </pattern>
            <filter v-for="k in 3" :id="uid + '-boil' + (k - 1)" :key="'b' + k" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" :seed="(k - 1) * 7 + 3" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter :id="uid + '-ink'" x="-4%" y="-6%" width="108%" height="112%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="11" result="edge" />
              <feDisplacementMap in="SourceGraphic" in2="edge" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough" />
              <feTurbulence type="fractalNoise" baseFrequency="0.018 0.32" numOctaves="2" seed="4" result="streak" />
              <feColorMatrix in="streak" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 5.6" result="streakA" />
              <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="9" result="speck" />
              <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -24 7.0" result="speckA" />
              <feComposite in="streakA" in2="speckA" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="holes" />
              <feComposite in="rough" in2="holes" operator="out" />
            </filter>
          </defs>

          <g ref="layerA">
            <g v-if="!flush" class="dcf-ground">
              <path class="dcf-draw" pathLength="1" :d="ground.d" :style="{ '--d': tl.ground + 'ms' }" />
              <path class="dcf-tufts dcf-fade" :d="ground.tufts" :style="{ '--d': tl.ground + 500 + 'ms' }" />
              <ellipse
                v-for="(pb, k) in ground.pebbles"
                :key="'pb' + k"
                class="dcf-pebble dcf-fade"
                :cx="pb.x"
                :cy="pb.y"
                :rx="pb.r * 1.5"
                :ry="pb.r"
                :style="{ '--d': tl.ground + 600 + 'ms' }"
              />
            </g>
            <g v-html="crewHtml.behindBody"></g>
          </g>

          <template v-for="(c, i) in chars" :key="'l' + i">
            <g
              v-if="c !== ' '"
              class="dcf-letter"
              :style="{ '--d': tl.letter(i) + 'ms', '--r': ((hash(i * 2.3) - 0.5) * 9).toFixed(2) + 'deg' }"
            >
              <g class="dcf-glyph">
                <text :x="layout.x[i]" y="0" :font-size="FONT_SIZE" font-weight="900" :style="{ fontFamily }" :filter="tier === 'full' ? 'url(#' + uid + '-ink)' : null">{{ c }}</text>
              </g>
              <path
                class="dcf-dust"
                :d="'M' + (layout.x[i] - 6) + ' -6 l-16 -6 M' + (layout.x[i] - 4) + ' -16 l-12 -12 M' + (layout.x[i] + layout.w[i] + 6) + ' -6 l16 -6 M' + (layout.x[i] + layout.w[i] + 4) + ' -16 l12 -12'"
              />
            </g>
          </template>

          <rect
            v-if="tier !== 'full'"
            class="dcf-tex dcf-fade"
            :style="{ '--d': tl.letter(chars.length - 1) + 600 + 'ms' }"
            :x="view.x" :y="-cap - 4" :width="view.w" :height="cap + 8"
            :fill="'url(#' + uid + '-tx)'"
            pointer-events="none"
          />

          <g ref="layerB">
            <g v-html="crewHtml.behindFront + crewHtml.others"></g>
          </g>

          <template v-if="interactive">
            <rect
              v-for="p in placed"
              :key="'hit' + p.i"
              class="dcf-hit"
              :x="p.hit.x"
              :y="p.hit.y"
              :width="p.hit.w"
              :height="p.hit.h"
              rx="12"
              role="button"
              tabindex="0"
              :aria-label="(p.m.name || p.m.kind) + (p.m.says ? ': ' + p.m.says : '')"
              @click="poke(p.i)"
              @keydown.enter.prevent="poke(p.i)"
              @keydown.space.prevent="poke(p.i)"
            />
          </template>
        </svg>

        <div class="dcf-bubbles" aria-live="polite">
          <template v-for="p in placed" :key="'bub' + p.i">
            <div
              v-if="talking === p.i && p.m.says"
              class="dcf-bubble"
              :class="{ 'is-left': p.x > view.x + view.w * 0.72 }"
              :style="{ left: pct(p.x, view.x, view.w), top: pct(p.y + p.art.box.t * p.scale - 6, view.y, view.h) }"
            >{{ p.m.says }}</div>
          </template>
        </div>
      </div>

      <div v-if="doodleList.length" ref="layer" class="dcf-doodles" :style="layerBox" aria-hidden="true">
        <div
          v-for="(d, k) in doodleList"
          :key="'d' + k"
          class="dcf-doodle"
          :data-kind="d.kind"
          :style="{ width: d.size + 'px', height: d.size + 'px', marginLeft: -d.size / 2 + 'px', marginTop: -d.size / 2 + 'px' }"
          @pointerdown="popDoodle(k)"
        >
          <span class="dcf-doodle-in" :style="{ '--d': tl.doodles + k * 70 + 'ms' }">
            <svg viewBox="-16 -16 32 32" :width="d.size" :height="d.size" v-html="d.svg"></svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ART, FONT_SIZE, DEFAULT_FONT, hash, clamp, layoutWord, seatPoint, lookAt,
  stepFloater, timeline, doodleSvg, estimate, measure,
} from '../utils/doodleCrew'

let UID = 0

// 'full' = filters + 60fps; 'lite' = no SVG noise filters, 30fps, fewer doodles. Animations still play on both.
function pickTier() {
  try {
    const n = navigator
    const weak = (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 4) ||
      (n.connection && n.connection.saveData) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return weak || rm ? 'lite' : 'full'
  } catch (e) { return 'lite' }
}

const DEFAULT_CREW = [
  { kind: 'yeti', letter: 0, seat: 'front', offset: -0.32, name: 'Bruno', says: 'Laper nih. Ada cemilan?' },
  { kind: 'bird', letter: 1, seat: 'top', offset: 0.02, name: 'Pip', says: 'Chat aja kak, serius.' },
  { kind: 'mushroom', letter: 2, seat: 'front', offset: 0.12, scale: 0.95, name: 'Morel', says: 'Gw jamur, bukan fun guy.' },
  { kind: 'kid', letter: 3, seat: 'top', offset: -0.05, name: 'Juno', says: 'Di atas sini view terbaik!' },
  { kind: 'ghost', letter: 4, seat: 'behind', offset: -0.05, name: 'Boo', says: 'Bu! ...sori. Halo.' },
  { kind: 'cat', letter: 4, seat: 'front', offset: 0.42, flip: true, name: 'Patch', says: 'Arr. Kursor mantap.' },
]
const DEFAULT_DOODLES = ['gem', 'sandwich', 'star', 'note', 'gem', 'sandwich', 'bolt', 'note', 'sparkle']

export default {
  name: 'DoodleCrew',
  props: {
    wordmark: { type: String, default: 'DXTNN' },
    crew: { type: Array, default: () => DEFAULT_CREW },
    doodles: { type: Array, default: () => DEFAULT_DOODLES },
    doodleCount: { type: Number, default: 18 },
    tracking: { type: Number, default: -0.02 },
    fontFamily: { type: String, default: DEFAULT_FONT },
    interactive: { type: Boolean, default: true },
    // stand directly on the bottom edge (the footer's dashed line) instead of drawing a ground of its own
    flush: { type: Boolean, default: true },
  },
  data() {
    const word = this.wordmark.toUpperCase()
    return {
      uid: 'dcf' + ++UID,
      FONT_SIZE,
      metrics: estimate(word),
      play: false,
      reduced: false,
      tier: pickTier(),
      talking: -1,
      layerBox: { width: '100%', height: '100%' },
    }
  },
  computed: {
    // static scratchy-ink texture for the lite tier: horizontal streaks + specks, drawn once (no feTurbulence)
    texHtml() {
      let o = ''
      for (let k = 0; k < 34; k++) {
        const x = hash(k * 3.1) * 160
        const y = hash(k * 7.3) * 90
        const l = 18 + hash(k * 5.7) * 80
        o += '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x + l).toFixed(1) + '" y2="' + (y + (hash(k * 2.9) - 0.5) * 2).toFixed(1) + '" stroke-width="' + (0.9 + hash(k * 9.1) * 1.8).toFixed(1) + '"/>'
      }
      for (let k = 0; k < 70; k++) {
        o += '<circle cx="' + (hash(k * 4.3) * 160).toFixed(1) + '" cy="' + (hash(k * 6.7) * 90).toFixed(1) + '" r="' + (0.5 + hash(k * 8.9) * 0.7).toFixed(1) + '" stroke="none"/>'
      }
      return o
    },
    word() { return this.wordmark.toUpperCase() },
    chars() { return Array.from(this.word) },
    layout() { return layoutWord(this.metrics.advances, this.tracking, FONT_SIZE) },
    cap() { return this.metrics.cap },
    placed() {
      const out = []
      this.crew.forEach((m, i) => {
        const art = ART[m.kind]
        if (!art || !this.chars.length) return
        const li = clamp(Math.floor(m.letter) || 0, 0, this.chars.length - 1)
        const scale = (this.cap / 144) * art.k * (m.scale != null ? m.scale : 1)
        const seat = m.seat || art.seat
        const p = seatPoint(seat, this.layout.x[li], this.layout.w[li], this.cap, m.offset || 0, scale)
        const flip = m.flip ? -1 : 1
        const bx = flip > 0 ? [art.box.l, art.box.r] : [-art.box.r, -art.box.l]
        const top = art.box.t
        const bottom = seat === 'behind' ? -30 : art.box.b
        out.push({
          i, m, art, seat, scale, flip, x: p.x, y: p.y,
          hit: { x: p.x + bx[0] * scale, y: p.y + top * scale, w: (bx[1] - bx[0]) * scale, h: (bottom - top) * scale },
        })
      })
      return out
    },
    view() {
      let l = 0
      let r = this.layout.width
      let t = -this.cap
      let b = 30
      for (const p of this.placed) {
        const bx = p.flip > 0 ? [p.art.box.l, p.art.box.r] : [-p.art.box.r, -p.art.box.l]
        l = Math.min(l, p.x + bx[0] * p.scale)
        r = Math.max(r, p.x + bx[1] * p.scale)
        t = Math.min(t, p.y + p.art.box.t * p.scale)
        b = Math.max(b, p.y + p.art.box.b * p.scale)
      }
      const pad = 24
      // flush: crew on bottom edge, height from top to baseline (y=0). t is negative, so -t gives positive height
      if (this.flush) return { x: l - pad, y: t - pad, w: r - l + pad * 2, h: -t + pad }
      return { x: l - pad, y: t - pad, w: r - l + pad * 2, h: b - t + pad * 2 }
    },
    viewBox() {
      const v = this.view
      return v.x.toFixed(1) + ' ' + v.y.toFixed(1) + ' ' + v.w.toFixed(1) + ' ' + v.h.toFixed(1)
    },
    tl() { return timeline(this.chars.length, this.placed.length) },
    ground() {
      const view = this.view
      const x0 = view.x + 6
      const x1 = view.x + view.w - 6
      let d = 'M' + x0.toFixed(1) + ' 6'
      const n = 14
      for (let k = 1; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n
        d += ' Q' + (x - (x1 - x0) / n / 2).toFixed(1) + ' ' + (6 + (hash(k * 3.1) - 0.5) * 5).toFixed(1) + ' ' + x.toFixed(1) + ' ' + (6 + (hash(k * 7.7) - 0.5) * 2).toFixed(1)
      }
      let tufts = ''
      for (let k = 0; k < 22; k++) {
        const x = x0 + 20 + hash(k * 11.3) * (x1 - x0 - 40)
        const s = 0.7 + hash(k * 5.9) * 0.6
        tufts += 'M' + x.toFixed(1) + ' 6 l' + (2 * s).toFixed(1) + ' ' + (-9 * s).toFixed(1) + ' M' + (x + 3 * s).toFixed(1) + ' 6 l' + (1 * s).toFixed(1) + ' ' + (-12 * s).toFixed(1) + ' M' + (x + 6 * s).toFixed(1) + ' 6 l' + (-1 * s).toFixed(1) + ' ' + (-7 * s).toFixed(1) + ' '
      }
      const pebbles = Array.from({ length: 9 }, (_, k) => ({ x: x0 + 40 + hash(k * 17.1) * (x1 - x0 - 80), y: 14 + hash(k * 2.3) * 8, r: 2 + hash(k * 9.4) * 2.6 }))
      return { d, tufts, pebbles }
    },
    // The crew is drawn as markup strings; hop/blink/pupils are driven straight on the DOM so this never re-renders per frame.
    crewHtml() {
      const hatch = 'url(#' + this.uid + '-hatch)'
      const one = (p, part) => {
        let inner = ''
        if (part === 'body') {
          inner = p.art.body(hatch)
          p.art.eyes.forEach((eye, e) => {
            inner += '<g data-eb="' + p.i + ',' + e + '">' +
              (eye.r > 0 ? '<circle cx="' + eye.x + '" cy="' + eye.y + '" r="' + eye.r + '"/>' : '') +
              '<g data-ep="' + p.i + ',' + e + '"><circle class="k" cx="' + eye.x + '" cy="' + eye.y + '" r="' + eye.pupil + '"/>' +
              '<circle class="dcf-glint" cx="' + (eye.x + eye.pupil * 0.35) + '" cy="' + (eye.y - eye.pupil * 0.4) + '" r="' + (eye.pupil * 0.32) + '"/></g></g>'
          })
        } else if (p.art.front) {
          inner = p.art.front()
        }
        return '<g transform="translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') scale(' + (p.scale * p.flip).toFixed(4) + ' ' + p.scale.toFixed(4) + ')">' +
          '<g class="dcf-arrive dcf-arrive-' + p.seat + '" style="--d:' + this.tl.member(p.i) + 'ms">' +
          '<g class="dcf-hopper" data-hop="' + p.i + '"><g class="dcf-art' + (p.art.idle ? ' ' + p.art.idle : '') + '" style="--i:' + p.i + '">' + inner + '</g></g></g></g>'
      }
      const behind = this.placed.filter((p) => p.seat === 'behind')
      const rest = this.placed.filter((p) => p.seat !== 'behind')
      return {
        behindBody: behind.map((p) => one(p, 'body')).join(''),
        behindFront: behind.map((p) => one(p, 'front')).join(''),
        others: rest.map((p) => one(p, 'body')).join(''),
      }
    },
    doodleList() {
      const kinds = this.doodles.length ? this.doodles : []
      const n = kinds.length ? clamp(Math.floor(this.doodleCount * (this.tier === 'lite' ? 0.5 : 1)) || 0, 0, 40) : 0
      // limit doodle size to a safe small value (max 28 px) to keep footer compact
      const MAX_DOODLE_SIZE = 28
      return Array.from({ length: n }, (_, k) => {
        const kind = kinds[k % kinds.length]
        const baseSize = 22 + hash(k * 4.7) * 14
        return { kind, size: Math.min(baseSize, MAX_DOODLE_SIZE), svg: doodleSvg(kind) }
      })
    },
  },
  watch: {
    crewHtml() { this.$nextTick(this.collectEyes) },
    doodleList() { this.$nextTick(() => { this.collectDoodles(); this.sizeWorld() }) },
  },
  created() {
    // non-reactive sim state
    this._s = {
      floaters: [], w: 0, h: 0, px: NaN, py: NaN, inside: false, visible: false,
      gaze: [], seed: 1, start: 0,
    }
    this._eyes = {}
    this._doodleEls = []
    this._talkTimer = 0
  },
  mounted() {
    const m = measure(this.word, this.fontFamily)
    if (m) this.metrics = m
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    this._alive = true
    this._refont = () => {
      const mm = measure(this.word, this.fontFamily)
      if (mm && this._alive) this.metrics = mm
    }
    if (fonts) {
      if (fonts.ready) fonts.ready.then(this._refont)
      if (fonts.addEventListener) fonts.addEventListener('loadingdone', this._refont)
    }

    if (window.matchMedia) {
      this._mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      this._mqFn = () => {}
      this._mqFn()
      if (this._mq.addEventListener) this._mq.addEventListener('change', this._mqFn)
    }

    // doodles fall over the whole footer panel (down to the bottom of the crew = the dashed line)
    this._field = this.$el.closest('.footer__bg') || this.$el
    if (this._field === this.$el) this.$el.style.position = 'relative'
    this._field.addEventListener('pointermove', this.onMove)
    this._field.addEventListener('pointerdown', this.onMove)
    this._field.addEventListener('pointerleave', this.onLeave)

    this.$nextTick(() => {
      this.collectEyes()
      this.collectDoodles()
      this.sizeWorld()
    })
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(() => this.sizeWorld())
      this._ro.observe(this.$refs.world)
      if (this._field !== this.$el) this._ro.observe(this._field)
    }

    // the footer is a fixed "reveal" panel, so watch its in-flow wrapper instead of the panel itself
    const target = this.$el.closest('.footer') || this.$el
    if (typeof IntersectionObserver === 'undefined') {
      this._s.visible = true
      this.startPlay()
    } else {
      this._io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          this._s.visible = e.isIntersecting
          if (e.isIntersecting && e.intersectionRatio > 0.3) this.startPlay()
          else if (!e.isIntersecting) this.resetPlay() // left the footer: rewind, so it opens again next visit
        }
      }, { threshold: [0, 0.15, 0.3, 0.5] })
      this._io.observe(target)
    }

    this._last = performance.now()
    this._boilAt = 0
    this._boil = 0
    this._raf = requestAnimationFrame(this.frame)
  },
  beforeUnmount() {
    this._alive = false
    cancelAnimationFrame(this._raf)
    window.clearTimeout(this._talkTimer)
    if (this._field) {
      this._field.removeEventListener('pointermove', this.onMove)
      this._field.removeEventListener('pointerdown', this.onMove)
      this._field.removeEventListener('pointerleave', this.onLeave)
    }
    if (this._io) this._io.disconnect()
    if (this._ro) this._ro.disconnect()
    if (this._mq && this._mq.removeEventListener) this._mq.removeEventListener('change', this._mqFn)
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    if (fonts && fonts.removeEventListener) fonts.removeEventListener('loadingdone', this._refont)
  },
  methods: {
    hash,
    pct(v, base, span) { return (((v - base) / span) * 100).toFixed(3) + '%' },
    startPlay() {
      if (!this.play) {
        this.play = true
        this._s.start = performance.now()
      }
    },
    resetPlay() {
      if (!this.play) return
      this.play = false
      const s = this._s
      s.start = 0
      s.floaters = []
      this.talking = -1
      window.clearTimeout(this._talkTimer)
      const svg = this.$refs.svg
      if (svg) svg.querySelectorAll('.is-hop').forEach((h) => h.classList.remove('is-hop'))
      this.$nextTick(this.sizeWorld) // doodles start over from the top
    },
    collectEyes() {
      const svg = this.$refs.svg
      if (!svg) return
      const eyes = {}
      svg.querySelectorAll('[data-eb]').forEach((el) => {
        const [c, e] = el.getAttribute('data-eb').split(',')
        if (!eyes[c]) eyes[c] = []
        if (!eyes[c][e]) eyes[c][e] = {}
        eyes[c][e].blink = el
      })
      svg.querySelectorAll('[data-ep]').forEach((el) => {
        const [c, e] = el.getAttribute('data-ep').split(',')
        if (!eyes[c]) eyes[c] = []
        if (!eyes[c][e]) eyes[c][e] = {}
        eyes[c][e].pupil = el
      })
      this._eyes = eyes
    },
    collectDoodles() {
      this._doodleEls = Array.from(this.$refs.world.querySelectorAll('.dcf-doodle'))
    },
    sizeWorld() {
      const world = this.$refs.world
      const field = this._field
      if (!world || !field) return
      const s = this._s
      const fr = field.getBoundingClientRect()
      const wr = world.getBoundingClientRect()
      const ow = s.w
      const oh = s.h
      // from the top of the footer panel to the bottom of the crew (the dashed line)
      s.w = field === this.$el ? wr.width : field.clientWidth
      s.h = Math.max(1, wr.bottom - fr.top - (field === this.$el ? 0 : field.clientTop))
      this.layerBox = { width: s.w + 'px', height: s.h + 'px' }
      const r = { width: s.w, height: s.h }
      const list = this.doodleList
      if (s.floaters.length !== list.length || !ow) {
        s.floaters = list.map((d, k) => ({
          x: (0.04 + 0.92 * ((k + hash(k * 9.1) * 0.8) / Math.max(1, list.length))) * r.width,
          y: (0.02 + hash(k * 3.3) * 0.56) * r.height,
          vx: 0, vy: 0,
          rot: (hash(k * 1.7) - 0.5) * 50,
          vr: (hash(k * 6.1) - 0.5) * 30,
          fall: (9 + hash(k * 2.9) * 16) * clamp(r.height / 300, 1, 2.2),
          phase: hash(k * 8.3) * Math.PI * 2,
          pop: 0,
        }))
      } else if (ow && oh) {
        for (const f of s.floaters) {
          f.x *= r.width / ow
          f.y *= r.height / oh
        }
      }
      this.paintDoodles()
    },
    paintDoodles() {
      const s = this._s
      const k = clamp(s.w / 1100, 0.5, 1) * 1.6 // this scene is narrower than a full page, keep doodles readable
      for (let i = 0; i < s.floaters.length; i++) {
        const el = this._doodleEls[i]
        const f = s.floaters[i]
        if (!el || !f) continue
        let sc = Math.min(1.1, k)
        let op = 1
        if (f.pop > 0) {
          const age = 1.4 - f.pop
          sc = sc * (1 + Math.min(1, age / 0.3) * 0.7)
          op = Math.max(0, 1 - age / 0.3)
        }
        // the bottom edge is a barrier: doodles fade out as they reach it
        if (f.y > s.h - 36) op *= Math.max(0, (s.h - 4 - f.y) / 32)
        el.style.transform = 'translate3d(' + f.x.toFixed(1) + 'px,' + f.y.toFixed(1) + 'px,0) rotate(' + f.rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')'
        el.style.opacity = String(op)
      }
    },
    onMove(e) {
      const s = this._s
      s.px = e.clientX
      s.py = e.clientY
      s.inside = true
    },
    onLeave() { this._s.inside = false },
    poke(i) {
      if (!this.interactive) return
      this.talking = i
      const hop = this.$refs.svg.querySelector('[data-hop="' + i + '"]')
      if (hop) {
        hop.classList.remove('is-hop')
        void hop.getBoundingClientRect() // restart the animation
        hop.classList.add('is-hop')
      }
      window.clearTimeout(this._talkTimer)
      this._talkTimer = window.setTimeout(() => {
        this.talking = -1
        const h = this.$refs.svg && this.$refs.svg.querySelector('[data-hop].is-hop')
        if (h) h.classList.remove('is-hop')
      }, 2600)
    },
    popDoodle(k) {
      if (!this.interactive) return
      const f = this._s.floaters[k]
      if (f && f.pop <= 0) {
        f.pop = 1.4
        this.paintDoodles()
      }
    },
    svgPoint(cx, cy) {
      const svg = this.$refs.svg
      const m = svg && svg.getScreenCTM()
      if (!m) return null
      const inv = m.inverse()
      return { x: inv.a * cx + inv.c * cy + inv.e, y: inv.b * cx + inv.d * cy + inv.f }
    },
    rand() {
      const s = this._s
      s.seed = (s.seed * 16807) % 2147483647
      return s.seed / 2147483647
    },
    frame(now) {
      this._raf = requestAnimationFrame(this.frame)
      const s = this._s
      if (!s.visible || document.hidden) {
        this._last = now
        return
      }
      const gap = now - this._last
      if (this.tier === 'lite' && gap < 32) return // ~30fps cap
      const dt = Math.min(0.05, gap / 1000)
      this._last = now
      const t = now / 1000
      const placed = this.placed
      const rand = this.rand

      // eyes
      let target = null
      if (s.inside && this.interactive) target = this.svgPoint(s.px, s.py)
      for (let c = 0; c < placed.length; c++) {
        const p = placed[c]
        let g = s.gaze[c]
        if (!g) {
          g = { tx: 0, ty: 0, next: 0, blinkAt: t + 1 + hash(c * 3.7) * 3, blink: 0, o: [] }
          s.gaze[c] = g
        }
        if (!target && t > g.next) {
          const other = placed[(c + 1 + Math.floor(rand() * Math.max(1, placed.length - 1))) % placed.length]
          if (other && rand() < 0.45) {
            g.tx = other.x
            g.ty = other.y - 60 * other.scale
          } else {
            g.tx = p.x + (rand() - 0.5) * 900
            g.ty = p.y - 80 * p.scale + (rand() - 0.5) * 500
          }
          g.next = t + 1.4 + rand() * 2.6
        }
        if (t > g.blinkAt) {
          g.blink = 0.16
          g.blinkAt = t + 2.2 + rand() * 4
        }
        g.blink = Math.max(0, g.blink - dt)
        const lid = g.blink > 0 ? 0.12 + (Math.abs(g.blink - 0.08) / 0.08) * 0.88 : 1
        const eyes = this._eyes[p.i] || []
        for (let e = 0; e < p.art.eyes.length; e++) {
          const eye = p.art.eyes[e]
          const ref = eyes[e]
          if (!ref) continue
          const ex = p.x + eye.x * p.scale * p.flip
          const ey = p.y + eye.y * p.scale
          const o = lookAt(ex, ey, target ? target.x : g.tx, target ? target.y : g.ty, eye.max, 220)
          const prev = g.o[e] || { x: 0, y: 0 }
          const ease = Math.min(1, dt * (target ? 14 : 6))
          const nx = prev.x + (o.x * p.flip - prev.x) * ease
          const ny = prev.y + (o.y - prev.y) * ease
          g.o[e] = { x: nx, y: ny }
          if (ref.pupil) ref.pupil.setAttribute('transform', 'translate(' + nx.toFixed(2) + ' ' + ny.toFixed(2) + ')')
          if (ref.blink) ref.blink.setAttribute('transform', 'translate(0 ' + (eye.y * (1 - lid)).toFixed(2) + ') scale(1 ' + lid.toFixed(3) + ')')
        }
      }

      // doodles
      if (s.floaters.length) {
        const started = this.play && s.start ? now - s.start > this.tl.doodles || this.reduced : false
        if (started) {
          const r = (this.$refs.layer || this.$refs.world).getBoundingClientRect()
          const px = s.inside && this.interactive ? s.px - r.left : NaN
          const py = s.inside && this.interactive ? s.py - r.top : NaN
          for (const f of s.floaters) stepFloater(f, dt, t, s.w, s.h - 36, px, py, 110, rand)
          this.paintDoodles()
        }
      }

      // line boil: three hand-drawn takes swapped at 8 fps
      if (this.tier === 'full' && now - this._boilAt > 125) {
        this._boilAt = now
        this._boil = (this._boil + 1) % 3
        const f = 'url(#' + this.uid + '-boil' + this._boil + ')'
        if (this.$refs.layerA) this.$refs.layerA.setAttribute('filter', f)
        if (this.$refs.layerB) this.$refs.layerB.setAttribute('filter', f)
      }
    },
  },
}
</script>

<style>
.dcf{--dcf-ink:var(--text,#1f2a3a);--dcf-bg:var(--bg-window,#fff);--dcf-accent:#ff6b2c;width:100%;color:var(--dcf-ink);-webkit-font-smoothing:antialiased}
.dcf *,.dcf *::before,.dcf *::after{box-sizing:border-box}
.dcf svg{max-width:none;overflow:visible}
.dcf :focus-visible{outline:2px dashed var(--dcf-ink);outline-offset:4px;border-radius:6px}
.dcf-world{}
.dcf-stage{position:relative;z-index:1}
.dcf-svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}
.dcf-svg text{fill:var(--dcf-ink)}
.dcf-art{fill:var(--dcf-bg);stroke:var(--dcf-ink);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
.dcf-art .n{fill:none}.dcf-art .k{fill:var(--dcf-ink)}.dcf-art .a{fill:var(--dcf-accent)}.dcf-art .o{fill:#ff9f1c}.dcf-art .r{fill:#ff4d4d}
.dcf-art .thin{stroke-width:1.5}.dcf-art .thick{stroke-width:3.4}
.dcf-art .dcf-glint{fill:var(--dcf-bg);stroke:none}
.dcf-art .dcf-shadow{fill:var(--dcf-ink);stroke:none;opacity:.14}
.dcf-ground path{fill:none;stroke:var(--dcf-ink);stroke-width:2.4;stroke-linecap:round}
.dcf-ground .dcf-tufts{stroke-width:1.8}
.dcf-pebble{fill:var(--dcf-bg);stroke:var(--dcf-ink);stroke-width:1.6}
.dcf-dust{fill:none;stroke:var(--dcf-ink);stroke-width:3;stroke-linecap:round;opacity:0}
.dcf-tex{pointer-events:none}
.dcf-hit{fill:transparent;stroke:none;cursor:pointer;outline:none}
.dcf-hit:focus-visible{stroke:var(--dcf-ink);stroke-width:2.5;stroke-dasharray:6 6}
.dcf-glyph{transform-box:fill-box;transform-origin:50% 100%}
.dcf[data-interactive='1'] .dcf-glyph:hover{animation:dcf-jiggle .6s cubic-bezier(.3,1.5,.5,1)}
.dcf-art.dcf-bob{animation:dcf-bob 3.2s ease-in-out infinite}
.dcf-art.dcf-sway{transform-box:fill-box;transform-origin:50% 100%;animation:dcf-swing 4s ease-in-out infinite}
.dcf-art.dcf-peck{transform-box:fill-box;transform-origin:50% 100%;animation:dcf-peck 5.5s ease-in-out infinite}
.dcf-tail{transform-box:fill-box;transform-origin:0% 100%;animation:dcf-tail 2.8s ease-in-out infinite}
.dcf-hopper{transform-box:fill-box;transform-origin:50% 100%}
.dcf-hopper.is-hop{animation:dcf-hop .62s cubic-bezier(.3,.7,.4,1)}
.dcf-arrive{transform-box:fill-box;transform-origin:50% 100%}
/* bubbles */
.dcf-bubbles{position:absolute;inset:0;pointer-events:none;z-index:2}
.dcf-bubble{position:absolute;transform:translate(-50%,-100%) rotate(-2deg);transform-origin:50% 100%;background:var(--dcf-bg);color:var(--dcf-ink);border:2px solid var(--dcf-ink);border-radius:16px;padding:6px 11px;font-size:12px;font-weight:700;line-height:1.25;white-space:nowrap;box-shadow:3px 3px 0 var(--dcf-ink);animation:dcf-bubble .32s cubic-bezier(.3,1.6,.5,1) both;margin-top:-4px}
.dcf-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;width:14px;height:14px;background:var(--dcf-bg);border-right:2px solid var(--dcf-ink);border-bottom:2px solid var(--dcf-ink);transform:translateX(-50%) rotate(45deg) skew(8deg,8deg)}
.dcf-bubble.is-left{transform:translate(-88%,-100%) rotate(2deg);transform-origin:88% 100%}
.dcf-bubble.is-left::after{left:88%}
/* doodles */
.dcf-doodles{position:absolute;left:0;top:0;pointer-events:none;z-index:2;overflow:hidden}
.dcf-doodle{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;will-change:transform;touch-action:manipulation}
.dcf-doodle-in{display:block;width:100%;height:100%}
.dcf[data-interactive='0'] .dcf-doodle{pointer-events:none}
.dcf-doodle svg{display:block;width:100%;height:100%;stroke:var(--dcf-ink);stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round;filter:drop-shadow(2px 2px 0 color-mix(in oklab,var(--dcf-ink) 18%,transparent))}
.dcf[data-tier='lite'] .dcf-doodle svg{filter:none}
/* storyboard: hidden until play, then each piece runs at its own --d */
.dcf[data-play='0'] .dcf-letter,.dcf[data-play='0'] .dcf-arrive,.dcf[data-play='0'] .dcf-fade,.dcf[data-play='0'] .dcf-doodle-in{opacity:0}
.dcf[data-play='0'] .dcf-draw{stroke-dasharray:1;stroke-dashoffset:1}
.dcf-letter{transform-box:fill-box;transform-origin:50% 100%}
.dcf[data-play='1'] .dcf-letter{animation:dcf-stamp .62s cubic-bezier(.2,.8,.25,1.15) var(--d) both}
.dcf[data-play='1'] .dcf-dust{animation:dcf-dust .5s ease-out calc(var(--d) + .22s) both}
.dcf[data-play='1'] .dcf-draw{stroke-dasharray:1;animation:dcf-draw 1.1s cubic-bezier(.6,0,.3,1) var(--d) both}
.dcf[data-play='1'] .dcf-fade{animation:dcf-fade .6s ease-out var(--d) both}
.dcf[data-play='1'] .dcf-arrive-front{animation:dcf-rise-up .75s cubic-bezier(.3,1.5,.5,1) var(--d) both}
.dcf[data-play='1'] .dcf-arrive-top{animation:dcf-plop .8s cubic-bezier(.3,.9,.4,1) var(--d) both}
.dcf[data-play='1'] .dcf-arrive-behind{animation:dcf-peek .9s cubic-bezier(.3,1.4,.5,1) var(--d) both}
.dcf[data-play='1'] .dcf-doodle-in{animation:dcf-fade .6s ease-out var(--d) both}
@keyframes dcf-stamp{0%{opacity:0;transform:translateY(-34%) scale(1.28) rotate(var(--r))}55%{opacity:1;transform:translateY(2%) scale(.95,1.05) rotate(0deg)}75%{transform:translateY(0) scale(1.04,.95)}100%{opacity:1;transform:none}}
@keyframes dcf-dust{0%{opacity:0;stroke-dasharray:0 40}30%{opacity:.9}100%{opacity:0;stroke-dasharray:14 40;stroke-dashoffset:-16}}
@keyframes dcf-draw{to{stroke-dashoffset:0}}
@keyframes dcf-fade{from{opacity:0}to{opacity:1}}
@keyframes dcf-rise-up{0%{opacity:0;transform:translateY(30%) scale(.7,.3)}45%{opacity:1;transform:translateY(-8%) scale(.92,1.12)}70%{transform:translateY(0) scale(1.08,.92)}100%{opacity:1;transform:none}}
@keyframes dcf-plop{0%{opacity:0;transform:translateY(-90%)}50%{opacity:1;transform:translateY(0) scale(1.1,.86)}68%{transform:translateY(-10%) scale(.96,1.04)}84%{transform:translateY(0) scale(1.03,.97)}100%{opacity:1;transform:none}}
@keyframes dcf-peek{0%{opacity:0;transform:translateY(55%)}60%{opacity:1;transform:translateY(-6%)}100%{opacity:1;transform:none}}
@keyframes dcf-jiggle{0%{transform:none}25%{transform:rotate(-4deg) scale(1.03,.97)}50%{transform:rotate(3deg) translateY(-3%)}75%{transform:rotate(-1.5deg)}100%{transform:none}}
@keyframes dcf-hop{0%{transform:none}18%{transform:scale(1.12,.84)}45%{transform:translateY(-28%) scale(.94,1.08)}72%{transform:translateY(0) scale(1.1,.88)}86%{transform:scale(.97,1.03)}100%{transform:none}}
@keyframes dcf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes dcf-swing{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}
@keyframes dcf-peck{0%,62%,100%{transform:none}66%{transform:rotate(14deg) translateY(2px)}70%{transform:none}74%{transform:rotate(12deg) translateY(2px)}78%{transform:none}}
@keyframes dcf-tail{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-12deg)}}
@keyframes dcf-bubble{from{opacity:0;scale:.6}to{opacity:1;scale:1}}
/* reduced-motion intentionally NOT killing animations: lite tier keeps them cheap */
/* dark mode: only the stars glow */
body:not(.light-theme) .dcf[data-tier='full'] .dcf-doodle[data-kind='star'] svg{filter:drop-shadow(0 0 5px #ffd23f) drop-shadow(0 0 12px rgba(255,210,63,.55))}
</style>
