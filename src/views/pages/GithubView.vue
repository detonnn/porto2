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

                            <canvas
                                v-if="gameActive"
                                ref="gameCanvas"
                                class="gh-game-canvas"
                                :style="{ width: svgWidth + 'px', height: (svgHeight + 80) + 'px' }"
                            ></canvas>

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
                                <svg v-for="lvl in [0, 1, 2, 3, 4]" :key="'lg' + lvl" width="12" height="12">
                                    <rect width="12" height="12" :rx="cellRx" :fill="colors['level' + lvl]" />
                                </svg>
                                <span>more</span>

                                <div class="gh-gamewrap">
                                    <span class="gh-gamewrap__label">Game Mode</span>
                                    <button class="gh-switch" :class="{ 'gh-switch--on': gameActive }" @click="toggleGame" type="button">
                                        <span class="gh-switch__knob"></span>
                                    </button>
                                </div>
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

// ── palette lifted from terminal.css so the calendar matches the site's
//    existing dark / light theme instead of GitHub's default green ──
const DARK_COLORS = {
    level0: 'rgba(255,255,255,0.05)',
    level1: '#0e2f4a',
    level2: '#3a9ad9',
    level3: '#5ab0e6',
    level4: '#7ec8e3',
}
const LIGHT_COLORS = {
    level0: 'rgba(0,0,0,0.06)',
    level1: '#a3d4f0',
    level2: '#5ab0e6',
    level3: '#3a9ad9',
    level4: '#1e3a5f',
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
            cellSize: 12,
            cellGap: 3,
            tooltip: { visible: false, text: '', align: 'center', x: 0, y: 0 },
            _observer: null,
            _cellLevels: null,
            _rafId: null,
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
                ? { bg: '#e9edf3', star: '#5a6678', ship: '#0369a1' }
                : { bg: '#000000', star: '#ffffff', ship: '#38bdf8' }
        },
        gameBgStyle() {
            return this.isLight
                ? { backgroundColor: '#e9edf3', borderColor: '#c4cdda' }
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
    },
    beforeUnmount() {
        if (this._observer) this._observer.disconnect()
        this.stopGame()
    },
    methods: {
        checkTheme() {
            this.isLight = document.body.classList.contains('light-theme')
        },
        async fetchContributions() {
            this.loading = true
            this.error = false
            try {
                const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${this.username}?y=last`)
                if (!res.ok) throw new Error('bad response')
                const json = await res.json()
                const days = json.contributions || []
                if (!days.length) throw new Error('no data')

                this.total = (json.total && json.total.lastYear != null)
                    ? json.total.lastYear
                    : days.reduce((acc, d) => acc + (d.count || 0), 0)

                const byDate = {}
                days.forEach((d) => {
                    byDate[d.date] = { level: Math.min(4, Math.max(0, d.level)), count: d.count }
                })
                this.byDate = byDate

                const start = parseDate(days[0].date)
                const end = parseDate(days[days.length - 1].date)
                this.resolvedEnd = formatDate(end)
                this.buildGrid(start, end)
            } catch (e) {
                this.error = true
            } finally {
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
                this.$nextTick(this.startGame)
            } else {
                this.stopGame()
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

            const cellLevels = new Map()
            this.weeks.forEach((week) => {
                week.forEach((date) => {
                    if (!date) return
                    const initial = (this.byDate[date] && this.byDate[date].level) || 0
                    cellLevels.set(date, initial)
                    // level-0 cells stay visible (their fill is already near-transparent)
                    // so the board still reads as a grid instead of empty black space —
                    // they're just not targets: no collision check hits a level-0 cell.
                })
            })
            this._cellLevels = cellLevels

            const step = this.step
            const cellSize = this.cellSize
            const colors = this.colors
            const space = this.spaceTheme

            const player = { x: width / 2 - 15, y: height - 25, width: 30, height: 20, speed: 2, direction: 1 }
            let bullets = []
            let lastShot = 0
            const cooldown = 550

            const shoot = () => {
                bullets.push({ x: player.x + player.width / 2 - 1.5, y: player.y - 4, vy: -6, width: 3, height: 8, color: '#fbbf24' })
            }

            const stars = Array.from({ length: 140 }).map(() => ({
                x: Math.random() * width,
                y: Math.random() * height,
                speed: Math.random() * 0.4 + 0.1,
                size: Math.random() * 1.2 + 0.5,
                alpha: Math.random() * 0.5 + 0.1,
            }))

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

            const resetBoard = () => {
                this.weeks.forEach((week) => {
                    week.forEach((date) => {
                        if (!date) return
                        const originalLevel = (this.byDate[date] && this.byDate[date].level) || 0
                        cellLevels.set(date, originalLevel)
                        const rect = document.getElementById('gh-cell-' + date)
                        if (rect) {
                            rect.setAttribute('fill', colors['level' + originalLevel])
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

                let minX = 0, maxX = width - player.width
                if (minWi !== -1) {
                    minX = minWi * step
                    maxX = Math.max(minX, Math.min(width - player.width, (maxWi + 1) * step - player.width))
                }
                player.x = Math.max(minX, Math.min(maxX, player.x))
                player.x += player.speed * player.direction
                if (player.x >= maxX) { player.x = maxX; player.direction = -1 }
                else if (player.x <= minX) { player.x = minX; player.direction = 1 }

                // keep the ship in view — the calendar is wider than the
                // viewport (auto-scrolled to recent months), so follow it
                const box = this.$refs.scrollBox
                if (box) {
                    const target = player.x + player.width / 2 - box.clientWidth / 2
                    box.scrollLeft = Math.max(0, Math.min(target, box.scrollWidth - box.clientWidth))
                }

                const now = Date.now()
                if (now - lastShot >= cooldown) { shoot(); lastShot = now }

                let anyActive = false
                cellLevels.forEach((lvl) => { if (lvl > 0) anyActive = true })
                if (!anyActive) resetBoard()

                stars.forEach((s) => { s.y += s.speed; if (s.y > height) { s.y = 0; s.x = Math.random() * width } })
                bullets = bullets.filter((b) => { b.y += b.vy; return b.y > 0 })
                particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life++; p.alpha = 1 - p.life / p.maxLife })
                particles = particles.filter((p) => p.life < p.maxLife)

                bullets.forEach((bullet, bulletIdx) => {
                    this.weeks.forEach((week, wi) => {
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
                                if (rect) rect.setAttribute('fill', colors['level' + newLevel])
                                explode(cellX + cellSize / 2, cellY + cellSize / 2, colors['level' + currentLevel])
                            }
                        })
                    })
                })
            }

            const render = () => {
                // transparent clear — canvas only draws stars/bullets/ship on top;
                // the SVG contribution grid stays visible underneath (it's a
                // separate DOM element, canvas must never paint an opaque
                // background over it or the targets vanish from view)
                ctx.clearRect(0, 0, width, height)
                ctx.fillStyle = space.star
                stars.forEach((s) => { ctx.globalAlpha = s.alpha; ctx.fillRect(s.x, s.y, s.size, s.size) })
                ctx.globalAlpha = 1
                bullets.forEach((b) => { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.width, b.height) })
                particles.forEach((p) => { ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha; ctx.fillRect(p.x, p.y, p.size, p.size) })
                ctx.globalAlpha = 1

                ctx.fillStyle = space.ship
                ctx.shadowColor = space.ship
                ctx.shadowBlur = 6
                ctx.beginPath()
                ctx.moveTo(player.x + player.width / 2, player.y)
                ctx.lineTo(player.x + player.width, player.y + player.height)
                ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.75)
                ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.75)
                ctx.lineTo(player.x, player.y + player.height)
                ctx.closePath()
                ctx.fill()
                ctx.shadowBlur = 0
            }

            const loop = () => {
                update()
                render()
                if (this.gameActive) this._rafId = requestAnimationFrame(loop)
            }
            this._rafId = requestAnimationFrame(loop)
        },
        stopGame() {
            if (this._rafId) cancelAnimationFrame(this._rafId)
            this._rafId = null
            // restore original colors/opacity on every cell
            this.weeks.forEach((week) => {
                week.forEach((date) => {
                    if (!date) return
                    const rect = document.getElementById('gh-cell-' + date)
                    if (rect) {
                        rect.style.opacity = '1'
                        rect.style.pointerEvents = 'auto'
                        const lvl = (this.byDate[date] && this.byDate[date].level) || 0
                        rect.setAttribute('fill', this.colors['level' + lvl])
                    }
                })
            })
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
    transition: background-color .4s ease, border-color .4s ease;
}
.gh-scroll {
    position: relative;
    overflow-x: auto;
    overflow-y: visible; /* was clipping the ship: overflow-x:auto alone makes overflow-y implicitly 'auto' too */
    scrollbar-width: none;
    padding-bottom: 0;
    transition: padding-bottom .4s ease;
}
.gh-scroll--game { padding-bottom: 80px; }
.gh-scroll::-webkit-scrollbar { display: none; }
.gh-svg { overflow: visible; }
.gh-month-label { font-size: 10px; fill: var(--text-dim); }
.gh-cell { transition: opacity .1s ease; }
.gh-cell:hover { stroke: var(--text-dim); stroke-width: 1px; }

.gh-game-canvas { position: absolute; top: 0; left: 0; z-index: 2; cursor: crosshair; }

.gh-tooltip {
    position: fixed; z-index: 50; transform: translate(-50%, calc(-100% - 8px));
    background: #24292e; color: #fff; font-size: 11px; font-weight: 600;
    padding: 4px 8px; border-radius: 4px; white-space: nowrap; pointer-events: none;
}
.gh-tooltip--left { transform: translate(0, calc(-100% - 8px)); }
.gh-tooltip--right { transform: translate(-100%, calc(-100% - 8px)); }

.gh-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: .9rem; flex-wrap: wrap; }
.gh-legend { display: flex; align-items: center; gap: 4px; font-size: var(--smaller-font-size); color: var(--text-dim); }

.gh-gamewrap { display: flex; align-items: center; gap: 8px; margin-left: 14px; padding-left: 14px; border-left: 1px solid var(--border); }
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

.gh-kitty { position: absolute; right: 12px; bottom: 0; width: 210px; height: auto; pointer-events: none; image-rendering: pixelated; opacity: .95; }
@media (max-width: 768px) { .gh-kitty { right: -6px; } }
@media (max-width: 480px) { .gh-kitty { right: -10px; } }
</style>
