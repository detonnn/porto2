<template>
    <section class="github section" id="github">
        <h2 class="section__title">{{ meta.title }}</h2>
        <span class="section__subtitle">{{ meta.subtitle }}</span>

        <div class="github__container container">
            <div class="github__window term-window">
                <div class="term-window__bar">
                    <div class="term-window__dots"><span></span><span></span><span></span></div>
                    <span class="term-window__title"><i class="uil uil-github"></i> contributions @{{ username }}</span>
                </div>
                <div class="term-window__body gh-body">
                    <p class="github__cmd prompt">
                        <span class="user">ibnu</span><span class="at">@</span><span class="host">github</span><span class="sym">:</span><span class="path">~</span><span class="sym">$</span>
                        <span class="cmd">gh contributions --year last</span>
                    </p>

                    <div v-if="loading" class="gh-skeleton">
                        <div class="gh-skeleton__row" v-for="n in 4" :key="n"></div>
                    </div>

                    <div v-else-if="error" class="github__fallback">
                        <p class="comment">live api unreachable — rendering cached chart</p>
                        <img :src="'https://ghchart.rshah.org/3ee07f/' + username" :alt="username + ' github contribution chart'">
                    </div>

                    <div v-else class="gh-calendar" :class="{ 'gh-calendar--game': gameActive }" :style="gameActive ? gameBgStyle : null">
                        <div class="gh-scroll" :class="{ 'gh-scroll--game': gameActive }" ref="scrollBox">
                            <svg :width="svgWidth" :height="svgHeight" :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="gh-svg">
                                <text
                                    v-for="m in visibleMonthLabels"
                                    :key="'m-' + m.label + m.weekIndex"
                                    :x="m.weekIndex * step"
                                    y="10"
                                    class="gh-month-label"
                                >{{ m.label }}</text>

                                <rect
                                    v-for="cell in flatCells"
                                    :key="cell.key"
                                    :id="cell.id"
                                    :x="cell.x"
                                    :y="cell.y"
                                    :width="cellSize"
                                    :height="cellSize"
                                    :rx="cellRx"
                                    :fill="cell.fill"
                                    class="gh-cell"
                                    @mouseenter="showTooltip(cell, $event)"
                                    @mouseleave="hideTooltip"
                                />
                            </svg>

                            <transition name="gh-game">
                                <canvas
                                    v-if="gameActive"
                                    ref="gameCanvas"
                                    class="gh-game-canvas"
                                    :style="{ width: svgWidth + 'px', height: (svgHeight + 80) + 'px' }"
                                ></canvas>
                            </transition>

                            <div
                                v-if="tooltip.visible"
                                class="gh-tooltip"
                                :class="'gh-tooltip--' + tooltip.align"
                                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
                            >{{ tooltip.text }}</div>
                        </div>

                        <div class="gh-footer">
                            <div class="gh-legend">
                                <span>less</span>
                                <svg v-for="lvl in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]" :key="'lg' + lvl" width="12" height="12">
                                    <rect width="12" height="12" :rx="cellRx" :fill="lvl === 10 ? '#ff0000' : colors['level' + lvl]" :class="lvl === 10 ? 'gh-legend-rainbow' : ''" />
                                </svg>
                                <span>more</span>

                                <div class="gh-gamewrap">
                                    <span class="gh-gamewrap__label">Game Mode</span>
                                    <button class="gh-switch" :class="{ 'gh-switch--on': gameActive }" @click="toggleGame" type="button">
                                        <span class="gh-switch__knob"></span>
                                    </button>
                                    <span v-if="gameActive || gameLevel > 0" class="gh-level">Lv.{{ gameLevel }}</span>
                                    <button v-if="gameLevel > 0" class="gh-reset" @click="resetGameLevel" type="button" title="Reset level ke 0">Reset</button>
                                </div>
                                <div v-if="gameAchievement" class="gh-achievement">{{ gameAchievement }}</div>
                            </div>

                            <a :href="'https://github.com/' + username" target="_blank" class="gh-stats">
                                <span class="gh-user">{{ username }}</span> contributed
                                <span class="gh-total">{{ total.toLocaleString() }}</span> this year on
                                <span class="gh-gh">GitHub</span>
                            </a>
                        </div>
                    </div>

                    <a :href="'https://github.com/' + username" target="_blank" class="button button--flex github__btn">
                        view --profile <i class="uil uil-external-link-alt button__icon"></i>
                    </a>
                    <img src="frontend/assets/img/kitty.gif" alt="" aria-hidden="true" class="gh-kitty" loading="lazy" decoding="async">
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

const DARK_COLORS = {
    level0: '#333333',
    level1: '#0e2f4a',
    level2: '#3a9ad9',
    level3: '#5ab0e6',
    level4: '#7ec8e3',
    level5: '#ffa500',
    level6: '#00cc00',
    level7: '#ff00ff',
    level8: '#ffff00',
    level9: '#00ffff',
    level10: 'rainbow',
}
const LIGHT_COLORS = {
    level0: 'rgba(0,0,0,0.06)',
    level1: '#a3d4f0',
    level2: '#5ab0e6',
    level3: '#3a9ad9',
    level4: '#1e3a5f',
    level5: '#ff8c00',
    level6: '#008000',
    level7: '#cc00cc',
    level8: '#cccc00',
    level9: '#00cccc',
    level10: 'rainbow',
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseDate(str) {
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
}
function formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}
function addDays(date, days) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

export default {
    name: 'Github',
    data() {
        return {
            meta: data.github,
            username: data.profile.username,
            loading: true,
            error: false,
            weeks: [],
            monthLabels: [],
            gridStart: '',
            resolvedEnd: '',
            byDate: {},
            total: 0,
            isLight: false,
            gameActive: false,
            gameLevel: (() => { try { const v = localStorage.getItem('gh_gameLevel'); const n = parseInt(v||'0',10); return Number.isFinite(n) ? Math.min(10, Math.max(0,n)) : 0 } catch(e){ return 0 } })(),
            gameAchievement: '',
            cellSize: 12,
            cellGap: 3,
            tooltip: { visible: false, text: '', align: 'center', x: 0, y: 0 },
            _observer: null,
            _cellLevels: null,
            _rafId: null,
            _sfx: null,
        }
    },
    computed: {
        colors() {
            return this.isLight ? LIGHT_COLORS : DARK_COLORS
        },
        step() {
            return this.cellSize + this.cellGap
        },
        cellRx() {
            return this.cellSize * 0.2
        },
        monthLabelHeight() {
            return this.gameActive ? 0 : 20
        },
        spaceTheme() {
            return this.isLight
                ? { bg: '#ffffff', star: '#000000', ship: '#0369a1' }
                : { bg: '#000000', star: '#ffffff', ship: '#38bdf8' }
        },
        gameBgStyle() {
            return this.isLight
                ? { backgroundColor: '#ffffff', borderColor: '#c4cdda' }
                : { backgroundColor: '#000000', borderColor: '#262626' }
        },
        svgWidth() {
            return this.weeks.length ? this.weeks.length * this.step - this.cellGap : 0
        },
        svgHeight() {
            return this.monthLabelHeight + 7 * this.step - this.cellGap
        },
        visibleMonthLabels() {
            if (this.gameActive) return []
            const byWeek = new Map()
            this.monthLabels.forEach(({ label, weekIndex }) => byWeek.set(weekIndex, label))
            const entries = Array.from(byWeek.entries())
            const valid = []
            for (let i = 0; i < entries.length; i++) {
                const current = entries[i]
                const next = entries[i + 1]
                if (i === 0 && next && next[0] - current[0] < 3) continue
                const last = valid[valid.length - 1]
                if (last && current[0] - last[0] < 3) continue
                valid.push(current)
            }
            return valid.map(([weekIndex, label]) => ({ weekIndex, label }))
        },
        flatCells() {
            const cells = []
            this.weeks.forEach((week, wi) => {
                week.forEach((date, di) => {
                    const entry = date ? this.byDate[date] : undefined
                    const level = entry ? entry.level : 0
                    cells.push({
                        key: wi + '-' + di,
                        id: date ? ('gh-cell-' + date) : undefined,
                        date,
                        count: entry ? entry.count : 0,
                        x: wi * this.step,
                        y: this.monthLabelHeight + di * this.step,
                        fill: this.colors['level' + level],
                    })
                })
            })
            return cells
        },
    },
    mounted() {
        this.checkTheme()
        this._observer = new MutationObserver(this.checkTheme)
        this._observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
        this.fetchContributions()
        window.addEventListener('storage', this.checkStorageLevel)
        window.addEventListener('set-github-level-10', this.forceLevel10)
    },
    beforeUnmount() {
        if (this._observer) this._observer.disconnect()
        this.stopGame()
        window.removeEventListener('storage', this.checkStorageLevel)
        window.removeEventListener('set-github-level-10', this.forceLevel10)
    },
    methods: {
         checkStorageLevel(e) {
             if (e.key === 'gh_gameLevel') {
                 const n = parseInt(e.newValue || '0', 10)
                 if (Number.isFinite(n)) this.gameLevel = Math.min(10, Math.max(0, n))
             }
         },
         forceLevel10() {
             this.gameLevel = 10
             try { localStorage.setItem('gh_gameLevel', '10') } catch(e){}
             this.gameAchievement = `LEVEL 10 UNLOCKED VIA SECRET KEY "BETON"! 🌈`
             if (this.gameActive) {
                 this.stopGame()
                 this.startGame()
             }
         },
         checkTheme() {
             const wasLight = this.isLight
             this.isLight = document.body.classList.contains('light-theme')
             if (wasLight !== this.isLight && this.gameActive) {
                 this.updateGameTheme()
             }
         },
         updateGameTheme() {
              const space = this.spaceTheme
              const canvas = this._gameCanvas
              if (canvas) {
                  const stars = this._stars
                  if (stars) { stars.forEach((s) => { s.color = space.star }) }
              }
              // re-apply cell fill yang lagi di-game (biar warna ikut tema baru)
              if (this._cellLevels) {
                this._cellLevels.forEach((lvl, date) => {
                  const rect = document.getElementById('gh-cell-' + date)
                  if (!rect) return
                  if (lvl === 10) rect.classList.add('gh-cell-rainbow')
                  else { rect.classList.remove('gh-cell-rainbow'); rect.setAttribute('fill', this.colors['level' + lvl]) }
                })
              }
              // update warna pesawat
              if (this._gameCanvas) {
                // players color updated via space.ship on next frame — force now
                // (players array kept di closure, tapi _players ref disimpan?)
              }
          },
        async fetchContributions() {
            this.loading = true
            this.error = false
            // ponytail: reset biar retry nggak duplikat label
            this.weeks = []; this.monthLabels = []
            let ctrl; let tm;
            try {
                ctrl = new AbortController(); tm = setTimeout(() => ctrl.abort(), 5000);
                const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${this.username}?y=last`, { signal: ctrl.signal })
                if (!res.ok) throw new Error('bad response')
                const json = await res.json()
                const days = json.contributions || []
                if (!days.length) throw new Error('no data')

                this.total = (json.total && json.total.lastYear != null)
                    ? json.total.lastYear
                    : days.reduce((acc, d) => acc + (d.count || 0), 0)

                const byDate = {}
                days.forEach((d) => {
                    byDate[d.date] = { level: Math.min(10, Math.max(0, d.level)), count: d.count }
                })
                this.byDate = byDate

                const start = parseDate(days[0].date)
                const end = parseDate(days[days.length - 1].date)
                this.resolvedEnd = formatDate(end)
                this.buildGrid(start, end)
            } catch (e) {
                this.error = true
            } finally {
                if (ctrl) clearTimeout(tm)
                this.loading = false
                this.$nextTick(() => {
                    if (this.$refs.scrollBox) this.$refs.scrollBox.scrollLeft = this.$refs.scrollBox.scrollWidth
                })
            }
        },
        buildGrid(start, end) {
            // weeks start on Sunday, same convention as the old heatmap
            const offset = start.getDay()
            const gridStart = addDays(start, -offset)
            this.gridStart = formatDate(gridStart)

            const weeks = []
            const monthLabels = []
            let current = new Date(gridStart)
            let weekIndex = 0
            let lastMonth = -1

            while (current <= end || (weeks.length && weeks[weeks.length - 1].length < 7)) {
                const week = []
                for (let d = 0; d < 7; d++) {
                    const dateStr = formatDate(current)
                    const inRange = current >= start && current <= end
                    week.push(inRange ? dateStr : null)
                    if (inRange && current.getMonth() !== lastMonth) {
                        lastMonth = current.getMonth()
                        monthLabels.push({ label: MONTH_NAMES[current.getMonth()], weekIndex })
                    }
                    current = addDays(current, 1)
                }
                weeks.push(week)
                weekIndex++
                if (current > end) break
            }

            this.weeks = weeks
            this.monthLabels = monthLabels
        },
        showTooltip(cell, evt) {
            if (!cell.date || this.gameActive) return
            const d = parseDate(cell.date)
            const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
            const count = cell.count || 0
            // position from the cell's real screen rect (not grid-local coords)
            // and pick left/right/center alignment so it never gets clipped
            // by the horizontally-scrolling container near the edges
            const rect = evt.target.getBoundingClientRect()
            const vw = window.innerWidth
            let align = 'center'
            if (rect.left < 80) align = 'left'
            else if (vw - rect.right < 80) align = 'right'
            this.tooltip = {
                visible: true,
                text: count === 0 ? `No contributions on ${label}.` : `${count} contribution${count !== 1 ? 's' : ''} on ${label}.`,
                align,
                x: align === 'left' ? rect.left : align === 'right' ? rect.right : rect.left + rect.width / 2,
                y: rect.top,
            }
        },
        hideTooltip() {
            this.tooltip.visible = false
        },
        toggleGame() {
            this.gameActive = !this.gameActive
            if (this.gameActive) {
                this.gameAchievement = ''
                // prime sfx langsung di handler click (masih dalam transient activation)
                try {
                    ["shoot","level"].forEach((k) => {
                        const a = new Audio('/frontend/assets/audio/' + k + '.MP3');
                        a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{});
                    });
                } catch(e) {}
                this.$nextTick(this.startGame)
            } else {
                this.stopGame()
                this.gameAchievement = ''
            }
        },
        resetGameLevel() {
            this.gameLevel = 0
            this.gameAchievement = ''
            try { localStorage.removeItem('gh_gameLevel') } catch(e){}
            // kalau lagi main, reset papan ke level 0 langsung — smooth + shrink pesawat
            if (this.gameActive && this._cellLevels) {
                this.weeks.forEach((week) => {
                    week.forEach((date) => {
                        if (!date) return
                        const originalLevel = (this.byDate[date] && this.byDate[date].level) || 0
                        this._cellLevels.set(date, originalLevel)
                        const rect = document.getElementById('gh-cell-' + date)
                        if (rect) {
                            rect.classList.remove('gh-cell-rainbow')
                            rect.setAttribute('fill', this.colors['level' + originalLevel])
                            rect.style.opacity = '1'
                            rect.style.pointerEvents = 'auto'
                        }
                    })
                })
                // shrink pesawat balik ke 1 kalau lagi di 2/5
                if (this._players && this._players.length > 1) {
                    const w = this._players[0] ? this._players[0].width : 30
                    // keep array reference biar loop game tetap pakai array yang sama
                    this._players.splice(1)
                    this._players[0].x = (this.svgWidth / 2) - w / 2
                }
            }
        },
        // ── retro space-shooter mode: shoot the contribution cells ──────────
        startGame() {
            const canvas = this.$refs.gameCanvas
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            const width = this.svgWidth
            const height = this.svgHeight + 80
            canvas.width = width
            canvas.height = height

            const step = this.step
            const cellSize = this.cellSize
            const colors = this.colors
            const space = this.spaceTheme

            // ── sound effects: singleton per session, reuse + re-prime biar ga ilang setelah idle ──
            const sfx = {
                shoot: new Audio('/frontend/assets/audio/shoot.MP3'),
                level: new Audio('/frontend/assets/audio/level.MP3'),
            }
            sfx.shoot.volume = 0.35
            sfx.level.volume = 0.55
            sfx.shoot.preload = "none"
            sfx.level.preload = "none"
            // prime now (masih dalam click gesture dari toggleGame)
            Object.values(sfx).forEach((a) => {
                const v = a.volume; a.volume = 0;
                a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = v; }).catch(() => { a.volume = v; });
            });
            const playSfx = (name) => {
                const a = sfx[name]
                if (!a) return
                a.currentTime = 0
                const p = a.play()
                if (p && p.catch) p.catch(() => {
                    const retry = () => { a.currentTime = 0; a.play().catch(()=>{}); };
                    ["click","touchstart","pointerdown"].forEach((ev) =>
                      window.addEventListener(ev, retry, { capture: true, once: true }),
                    );
                })
            }
            this._sfx = sfx

            const cellLevels = new Map()
            this.weeks.forEach((week) => {
                week.forEach((date) => {
                    if (!date) return
                    const original = (this.byDate[date] && this.byDate[date].level) || 0
                    const initial = Math.min(10, original + this.gameLevel)
                    cellLevels.set(date, initial)
                    const rect = document.getElementById('gh-cell-' + date)
                    if (rect) {
                        if (initial === 10) {
                            rect.classList.add('gh-cell-rainbow')
                        } else {
                            rect.classList.remove('gh-cell-rainbow')
                            rect.setAttribute('fill', colors['level' + initial])
                        }
                    }
                })
            })
            this._cellLevels = cellLevels

            let isDouble = this.gameLevel >= 4 && this.gameLevel < 10
            const isFive = this.gameLevel === 10
            let players
            if (isFive) {
                players = [
                    { x: width / 2 - 40, y: height - 25, width: 30, height: 20, speed: 2, direction: 1, color: space.ship },
                    { x: width / 2 + 10, y: height - 25, width: 30, height: 20, speed: 2.6, direction: -1, color: space.ship },
                    { x: width / 2 - 70, y: height - 25, width: 30, height: 20, speed: 1.8, direction: 1, color: space.ship },
                    { x: width / 2 + 40, y: height - 25, width: 30, height: 20, speed: 2.4, direction: -1, color: space.ship },
                    { x: width / 2 - 105, y: height - 25, width: 30, height: 20, speed: 2.2, direction: 1, color: space.ship },
                ]
            } else if (isDouble) {
                players = [
                    { x: width / 2 - 40, y: height - 25, width: 30, height: 20, speed: 2, direction: 1, color: space.ship },
                    { x: width / 2 + 10, y: height - 25, width: 30, height: 20, speed: 2.6, direction: -1, color: space.ship },
                ]
            } else {
                players = [
                    { x: width / 2 - 15, y: height - 25, width: 30, height: 20, speed: 2, direction: 1, color: space.ship }
                ]
            }
            this._players = players
            // keep single var for compat where needed (first player)
            const player = players[0]
            let bullets = []
            let lastShot = 0
            const cooldown = 550

            const shoot = () => {
                const lvl = this.gameLevel
                const count = lvl >= 2 ? 3 : lvl >= 1 ? 2 : 1
                players.forEach(p => {
                    const cx = p.x + p.width / 2 - 1.5
                    if (count === 1) {
                        bullets.push({ x: cx, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                    } else if (count === 2) {
                        bullets.push({ x: cx - 6, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                        bullets.push({ x: cx + 6, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                    } else {
                        bullets.push({ x: cx - 8, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                        bullets.push({ x: cx, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                        bullets.push({ x: cx + 8, y: p.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
                    }
                })
            }

            // ── manual: hover/swipe ngikut kursor, diem di dalam widget tetap manual, keluar baru auto ──
            this._isManual = false
            this._manualTimer = null
            const clampX = (x, w) => Math.max(-w / 2, Math.min(width - w / 2, x))
            const handlePointerMove = (clientX) => {
                const rect = canvas.getBoundingClientRect()
                const scaleX = width / rect.width
                const baseX = (clientX - rect.left) * scaleX
                if (players.length === 1) {
                    players[0].x = clampX(baseX - players[0].width / 2, players[0].width)
                } else {
                    // ponytail: formasi menyebar rata di sekitar kursor — support 2 atau 5 pesawat
                    const spacing = players.length === 5 ? 42 : 50
                    const half = (players.length - 1) / 2
                    players.forEach((p, i) => {
                        const offset = (i - half) * spacing
                        p.x = clampX(baseX + offset - p.width / 2, p.width)
                    })
                }
                this._isManual = true
                clearTimeout(this._manualTimer)
            }
            this._onMouseEnter = () => {
                this._isManual = true
                clearTimeout(this._manualTimer)
            }
            this._onMouseMove = (e) => handlePointerMove(e.clientX)
            this._onTouchMove = (e) => {
                if (e.touches && e.touches[0]) handlePointerMove(e.touches[0].clientX)
                e.preventDefault()
            }
            this._onMouseLeave = () => {
                clearTimeout(this._manualTimer)
                this._manualTimer = setTimeout(() => { this._isManual = false }, 300)
            }
            this._onTouchEnd = () => {
                clearTimeout(this._manualTimer)
                this._manualTimer = setTimeout(() => { this._isManual = false }, 300)
            }
            canvas.addEventListener('mouseenter', this._onMouseEnter)
            canvas.addEventListener('mousemove', this._onMouseMove)
            canvas.addEventListener('mouseleave', this._onMouseLeave)
            canvas.addEventListener('touchmove', this._onTouchMove, { passive: false })
            canvas.addEventListener('touchstart', (e) => {
                this._isManual = true
                clearTimeout(this._manualTimer)
                this._onTouchMove(e)
            }, { passive: false })
            canvas.addEventListener('touchend', this._onTouchEnd)
            canvas.addEventListener('touchcancel', this._onTouchEnd)
            canvas.style.touchAction = 'none'
            const scrollBox = this.$refs.scrollBox
            if (scrollBox) {
                scrollBox.addEventListener('touchmove', this._onTouchMove, { passive: false })
                scrollBox.addEventListener('touchend', this._onTouchEnd)
            }
            this._gameCanvas = canvas

             const stars = Array.from({ length: 140 }).map(() => ({
                 x: Math.random() * width,
                 y: Math.random() * height,
                 speed: Math.random() * 0.4 + 0.1,
                 size: this.isLight ? Math.random() * 1.8 + 1.2 : Math.random() * 1.2 + 0.5,
                 alpha: this.isLight ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5 + 0.1,
                 color: space.star,
             }))
             this._stars = stars

            let particles = []
            const explode = (x, y, color) => {
                for (let i = 0; i < 12; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const speed = Math.random() * 2.5 + 1.2
                    particles.push({
                        x, y,
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        color, size: Math.random() * 2 + 1,
                        alpha: 1, life: 0, maxLife: Math.random() * 15 + 15,
                    })
                }
            }

            const resetBoard = (isLevelUp = false) => {
                if (isLevelUp) {
                    const prevLevel = this.gameLevel
                    this.gameLevel += 1
                    if (this.gameLevel > 10) this.gameLevel = 10
                    try { localStorage.setItem('gh_gameLevel', String(this.gameLevel)) } catch(e){}
                    this.gameAchievement = `Level ${this.gameLevel} — Achievement Unlocked!`
                    playSfx('level')
                    setTimeout(() => { this.gameAchievement = '' }, 2200)
                    // Lv4: spawn pesawat tambahan langsung tanpa refresh
                    if (prevLevel < 4 && this.gameLevel >= 4 && players.length === 1) {
                        isDouble = true
                        players.push({ x: width / 2 + 10, y: height - 25, width: 30, height: 20, speed: 2.6, direction: -1, color: space.ship })
                    }
                    if (this.gameLevel === 10 && players.length < 5) {
                        isDouble = true
                        while (players.length < 5) {
                            const idx = players.length
                            const xOffsets = [-40, 10, -70, 40, -105]
                            const speeds = [2, 2.6, 1.8, 2.4, 2.2]
                            const dirs = [1, -1, 1, -1, 1]
                            players.push({
                                x: width / 2 + xOffsets[idx],
                                y: height - 25,
                                width: 30,
                                height: 20,
                                speed: speeds[idx],
                                direction: dirs[idx],
                                color: space.ship
                            })
                        }
                    }
                }
                this.weeks.forEach((week) => {
                    week.forEach((date) => {
                        if (!date) return
                        const originalLevel = (this.byDate[date] && this.byDate[date].level) || 0
                        const useLevel = isLevelUp ? Math.min(10, originalLevel + this.gameLevel) : originalLevel
                        cellLevels.set(date, useLevel)
                        const rect = document.getElementById('gh-cell-' + date)
                        if (rect) {
                            if (useLevel === 10) {
                                rect.classList.add('gh-cell-rainbow')
                            } else {
                                rect.classList.remove('gh-cell-rainbow')
                                rect.setAttribute('fill', colors['level' + useLevel])
                            }
                            rect.style.opacity = '1'
                            rect.style.pointerEvents = 'auto'
                        }
                    })
                })
            }

            const update = () => {
                let minWi = -1, maxWi = -1
                this.weeks.forEach((week, wi) => {
                    week.forEach((date) => {
                        if (date && (cellLevels.get(date) || 0) > 0) {
                            if (minWi === -1) minWi = wi
                            minWi = Math.min(minWi, wi)
                            maxWi = Math.max(maxWi, wi)
                        }
                    })
                })

                // manual: bebas ke mana aja, auto: cuma di area aktif — untuk double, tiap pesawat beda speed/direction
                const getBounds = (p) => {
                    if (this._isManual) {
                        return { minX: -p.width / 2, maxX: width - p.width / 2 }
                    }
                    let minX = 0, maxX = width - p.width
                    if (minWi !== -1) {
                        minX = minWi * step + cellSize / 2 - p.width / 2 + 1.5
                        maxX = maxWi * step + cellSize / 2 - p.width / 2 + 1.5
                        minX = Math.max(-p.width / 2, minX)
                        maxX = Math.min(width - p.width / 2, maxX)
                        maxX = Math.max(minX, maxX)
                    }
                    return { minX, maxX }
                }
                players.forEach(p => {
                    const { minX, maxX } = getBounds(p)
                    if (!this._isManual) {
                        p.x += p.speed * p.direction
                        if (p.x >= maxX) { p.x = maxX; p.direction = -1 }
                        else if (p.x <= minX) { p.x = minX; p.direction = 1 }
                    }
                    p.x = Math.max(minX, Math.min(maxX, p.x))
                })

                // keep the ship in view — follow tengah formasi (support 1/2/5 pesawat)
                const box = this.$refs.scrollBox
                if (box) {
                    const followX = players.length > 1
                        ? players.reduce((s, p) => s + p.x + p.width / 2, 0) / players.length
                        : players[0].x + players[0].width / 2
                    const target = followX - box.clientWidth / 2
                    box.scrollLeft = Math.max(0, Math.min(target, box.scrollWidth - box.clientWidth))
                }

                const now = Date.now()
                if (now - lastShot >= cooldown) { shoot(); lastShot = now }

                let anyActive = false
                cellLevels.forEach((lvl) => { if (lvl > 0) anyActive = true })
                if (!anyActive) resetBoard(true)

                stars.forEach((s) => { s.y += s.speed; if (s.y > height) { s.y = 0; s.x = Math.random() * width } })
                bullets = bullets.filter((b) => { b.y += b.vy; return b.y > 0 })
                particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life++; p.alpha = 1 - p.life / p.maxLife })
                particles = particles.filter((p) => p.life < p.maxLife)

                // ponytail: spatial hash — cek cuma week di sekitar bullet (hemat 10x)
                bullets.forEach((bullet, bulletIdx) => {
                    const wiCenter = Math.floor((bullet.x + bullet.width/2) / step)
                    for (let wi = Math.max(0, wiCenter-1); wi <= Math.min(this.weeks.length-1, wiCenter+1); wi++) {
                        const week = this.weeks[wi]
                        week.forEach((date, di) => {
                            if (!date) return
                            const currentLevel = cellLevels.get(date) || 0
                            if (currentLevel === 0) return
                            const cellX = wi * step
                            const cellY = this.monthLabelHeight + di * step
                            if (bullet.x < cellX + cellSize && bullet.x + bullet.width > cellX &&
                                bullet.y < cellY + cellSize && bullet.y + bullet.height > cellY) {
                                bullets.splice(bulletIdx, 1)
                                 const newLevel = currentLevel - 1
                                 cellLevels.set(date, newLevel)
                                 const rect = document.getElementById('gh-cell-' + date)
                                 if (rect) {
                                     if (newLevel === 10) {
                                         rect.classList.add('gh-cell-rainbow')
                                     } else {
                                         rect.classList.remove('gh-cell-rainbow')
                                         rect.setAttribute('fill', colors['level' + newLevel])
                                     }
                                 }
                                 explode(cellX + cellSize / 2, cellY + cellSize / 2, currentLevel === 10 ? '#ff0055' : colors['level' + currentLevel])
                                 playSfx('shoot')
                            }
                        })
                    }
                })
            }

             const render = () => {
                 ctx.clearRect(0, 0, width, height)
                 ctx.fillStyle = space.star
                 stars.forEach((s) => { ctx.globalAlpha = s.alpha; ctx.fillRect(s.x, s.y, s.size, s.size) })
                 ctx.globalAlpha = 1
                 bullets.forEach((b) => { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.width, b.height) })
                 particles.forEach((p) => { ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fillRect(p.x, p.y, p.size, p.size) })
                 ctx.globalAlpha = 1

                 players.forEach(p => {
                     ctx.fillStyle = p.color
                     ctx.shadowColor = p.color
                     ctx.shadowBlur = 6
                     ctx.beginPath()
                     ctx.moveTo(p.x + p.width / 2, p.y)
                     ctx.lineTo(p.x + p.width, p.y + p.height)
                     ctx.lineTo(p.x + p.width * 0.7, p.y + p.height * 0.75)
                     ctx.lineTo(p.x + p.width * 0.3, p.y + p.height * 0.75)
                     ctx.lineTo(p.x, p.y + p.height)
                     ctx.closePath()
                     ctx.fill()
                 })
                 ctx.shadowBlur = 0
             }

            let _hidden = false
            const onVis = () => { _hidden = document.hidden }
            document.addEventListener('visibilitychange', onVis)
            this._onVisGame = onVis
            const loop = () => {
                if (_hidden || document.hidden) { this._rafId = requestAnimationFrame(loop); return }
                update()
                render()
                if (this.gameActive) this._rafId = requestAnimationFrame(loop)
            }
            this._rafId = requestAnimationFrame(loop)
        },
         stopGame() {
              if (this._onVisGame) document.removeEventListener('visibilitychange', this._onVisGame)
              this._onVisGame = null
              if (this._rafId) cancelAnimationFrame(this._rafId)
              this._rafId = null
              if (this._manualTimer) clearTimeout(this._manualTimer)
             this._isManual = false
             this._manualTimer = null
             this._stars = null
             const canvas = this._gameCanvas
             if (canvas) {
                 if (this._onMouseEnter) canvas.removeEventListener('mouseenter', this._onMouseEnter)
                 if (this._onMouseMove) canvas.removeEventListener('mousemove', this._onMouseMove)
                 if (this._onMouseLeave) canvas.removeEventListener('mouseleave', this._onMouseLeave)
                 if (this._onTouchMove) {
                     canvas.removeEventListener('touchmove', this._onTouchMove)
                     canvas.removeEventListener('touchstart', this._onTouchMove)
                     canvas.removeEventListener('touchend', this._onTouchEnd)
                     canvas.removeEventListener('touchcancel', this._onTouchEnd)
                 }
                 canvas.style.touchAction = ''
             }
             const box = this.$refs.scrollBox
             if (box) {
                 if (this._onTouchMove) box.removeEventListener('touchmove', this._onTouchMove)
                 if (this._onTouchEnd) box.removeEventListener('touchend', this._onTouchEnd)
             }
             this._gameCanvas = null
             this._onMouseEnter = null
             this._onMouseMove = null
             this._onMouseLeave = null
             this._onTouchMove = null
             this._onTouchEnd = null
             if (this._sfx) {
                 Object.values(this._sfx).forEach((a) => { a.pause(); a.currentTime = 0 })
                 this._sfx = null
             }
             this.weeks.forEach((week) => {
                  week.forEach((date) => {
                      if (!date) return
                      const rect = document.getElementById('gh-cell-' + date)
                      if (rect) {
                          rect.classList.remove('gh-cell-rainbow')
                          rect.style.opacity = '1'
                          rect.style.pointerEvents = 'auto'
                          const lvl = (this.byDate[date] && this.byDate[date].level) || 0
                          rect.setAttribute('fill', this.colors['level' + lvl])
                      }
                  })
              })
              this._cellLevels = null
              this._players = null
         },
    },
}
</script>

<style scoped>
.gh-body { position: relative; padding-bottom: 56px; overflow: hidden; }
.gh-skeleton__row { height: 12px; margin-bottom: 6px; border-radius: 4px; background: var(--bg-elev); opacity: .5; animation: gh-pulse 1.4s ease-in-out infinite; }
@keyframes gh-pulse { 0%, 100% { opacity: .35; } 50% { opacity: .7; } }

.gh-calendar {
    width: fit-content;
    max-width: 100%;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: background-color .65s cubic-bezier(0.22, 1, 0.36, 1), border-color .65s cubic-bezier(0.22, 1, 0.36, 1), box-shadow .65s cubic-bezier(0.22, 1, 0.36, 1);
}
.gh-scroll {
    position: relative;
    overflow-x: auto;
    overflow-y: visible; /* was clipping the ship: overflow-x:auto alone makes overflow-y implicitly 'auto' too */
    scrollbar-width: none;
    padding-bottom: 0;
    transition: padding-bottom .65s cubic-bezier(0.22, 1, 0.36, 1);
}
.gh-scroll--game { padding-bottom: 80px; }
.gh-scroll::-webkit-scrollbar { display: none; }
.gh-svg { overflow: visible; transition: opacity .65s cubic-bezier(0.22, 1, 0.36, 1); }
.gh-month-label { font-size: 10px; fill: var(--text-dim); transition: opacity .45s ease; }
.gh-calendar--game .gh-month-label { opacity: 0; }
.gh-cell { transition: opacity .1s ease, fill .45s ease; }
.gh-cell:hover { stroke: var(--text-dim); stroke-width: 1px; }

.gh-game-canvas { position: absolute; top: 0; left: 0; z-index: 2; cursor: crosshair; }
/* ponytail: smooth start/stop — canvas nge-fade + scale biar ga pop instant */
.gh-game-enter-active { transition: opacity .55s cubic-bezier(0.22, 1, 0.36, 1), transform .55s cubic-bezier(0.22, 1, 0.36, 1); }
.gh-game-leave-active { transition: opacity .45s ease, transform .45s ease; }
.gh-game-enter-from { opacity: 0; transform: scale(0.98); }
.gh-game-enter-to { opacity: 1; transform: scale(1); }
.gh-game-leave-from { opacity: 1; transform: scale(1); }
.gh-game-leave-to { opacity: 0; transform: scale(1.02); }

.gh-tooltip {
    position: fixed; z-index: 50; transform: translate(-50%, calc(-100% - 8px));
    background: #24292e; color: #fff; font-size: 11px; font-weight: 600;
    padding: 4px 8px; border-radius: 4px; white-space: nowrap; pointer-events: none;
}
.gh-tooltip--left { transform: translate(0, calc(-100% - 8px)); }
.gh-tooltip--right { transform: translate(-100%, calc(-100% - 8px)); }

.gh-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: .9rem; flex-wrap: wrap; }
.gh-legend { display: flex; align-items: center; gap: 4px; font-size: var(--smaller-font-size); color: var(--text-dim); flex-wrap: wrap; }

.gh-gamewrap { display: flex; align-items: center; gap: 8px; margin-left: 14px; padding-left: 14px; border-left: 1px solid var(--border); flex-wrap: wrap; }
@media (max-width: 480px) {
  .gh-footer { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
  .gh-legend { width: 100%; }
  .gh-gamewrap { margin-left: 0; padding-left: 0; border-left: none; width: 100%; }
  .gh-stats { width: 100%; }
}
.gh-gamewrap__label { font-size: 11px; color: var(--text-dim); }
.gh-switch {
    position: relative; width: 34px; height: 18px; border-radius: 999px;
    border: 1px solid var(--border); background: var(--bg-elev-2);
    box-shadow: 0 0 0 1px rgba(255,255,255,.03) inset;
    cursor: pointer; padding: 2px; transition: background .2s ease, border-color .2s ease;
}
.gh-switch:hover { border-color: var(--text-dim); }
.gh-switch--on { background: var(--green); border-color: var(--green); }
.gh-switch__knob {
    display: block; width: 12px; height: 12px; border-radius: 50%;
    background: var(--text-dim); box-shadow: 0 1px 2px rgba(0,0,0,.4);
    transition: transform .2s ease, background .2s ease;
}
.gh-switch--on .gh-switch__knob { transform: translateX(16px); background: var(--bg); }

.gh-stats { font-size: var(--small-font-size); color: var(--text-dim); text-decoration: none; }
.gh-user { font-weight: 700; color: var(--text); }
.gh-total { font-weight: 700; color: var(--green); }
.gh-gh { font-weight: 600; color: var(--text); text-decoration: underline; }

.gh-level { font-size: 11px; font-weight: 700; color: var(--green); background: var(--bg-elev); border: 1px solid var(--border); padding: 2px 6px; border-radius: 6px; }
.gh-reset { font-size: 11px; color: var(--text-dim); background: transparent; border: 1px solid var(--border); padding: 2px 7px; border-radius: 6px; cursor: pointer; transition: 0.2s; }
.gh-reset:hover { color: var(--text); border-color: var(--text-dim); }
.gh-achievement { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); background: var(--green); color: var(--bg); font-size: 13px; font-weight: 800; padding: 8px 14px; border-radius: 8px; box-shadow: 0 4px 16px var(--shadow-color); z-index: 5; animation: gh-ach-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes gh-ach-pop { 0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
.gh-kitty { position: absolute; right: 12px; bottom: 0; width: 210px; height: auto; pointer-events: none; image-rendering: pixelated; opacity: .95; }
.gh-cell-rainbow, .gh-legend-rainbow {
    animation: gh-rainbow 2s linear infinite !important;
}
@keyframes gh-rainbow {
    0%   { fill: #ff0000; }
    17%  { fill: #ff7700; }
    33%  { fill: #ffff00; }
    50%  { fill: #00ff00; }
    67%  { fill: #0099ff; }
    83%  { fill: #8800ff; }
    100% { fill: #ff0000; }
}
@media (max-width: 768px) { .gh-kitty { right: -6px; } }
@media (max-width: 480px) { .gh-kitty { right: -10px; } }
</style>
