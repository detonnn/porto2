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
                                <github-game v-if="gameActive" :weeks="weeks" :byDate="byDate" :colors="colors" :step="step" :cellSize="cellSize" :monthLabelHeight="monthLabelHeight" :svgWidth="svgWidth" :svgHeight="svgHeight" :isLight="isLight" :gameLevel="gameLevel" @level-up="onGameLevelUp" @achievement="gameAchievement=$event" />
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
import { defineAsyncComponent } from 'vue'
import data from '../../data/portfolio.json'
const GithubGame = defineAsyncComponent(() => import('../../components/GithubGame.vue'))

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
    components: { GithubGame },
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
          },
          checkTheme() {
              this.isLight = document.body.classList.contains('light-theme')
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
                try {
                    ["shoot","level"].forEach((k) => {
                        const a = new Audio('/frontend/assets/audio/' + k + '.MP3');
                        a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(()=>{});
                    });
                } catch(e) {}
            } else {
                this.gameAchievement = ''
                this.weeks.forEach((week) => week.forEach((date) => {
                    if (!date) return
                    const rect = document.getElementById('gh-cell-' + date)
                    if (rect) {
                        rect.classList.remove('gh-cell-rainbow')
                        rect.style.opacity = '1'
                        rect.style.pointerEvents = 'auto'
                        const lvl = (this.byDate[date] && this.byDate[date].level) || 0
                        rect.setAttribute('fill', this.colors['level' + lvl])
                    }
                }))
            }
        },
        onGameLevelUp(n) {
            this.gameLevel = n
            try { localStorage.setItem('gh_gameLevel', String(n)) } catch(e){}
        },
        resetGameLevel() {
            this.gameLevel = 0
            this.gameAchievement = ''
            try { localStorage.removeItem('gh_gameLevel') } catch(e){}
            if (this.gameActive) {
                this.weeks.forEach((week) => week.forEach((date) => {
                    if (!date) return
                    const lvl = (this.byDate[date] && this.byDate[date].level) || 0
                    const rect = document.getElementById('gh-cell-' + date)
                    if (rect) {
                        rect.classList.remove('gh-cell-rainbow')
                        rect.setAttribute('fill', this.colors['level' + lvl])
                        rect.style.opacity = '1'
                        rect.style.pointerEvents = 'auto'
                    }
                }))
            }
        },
        // ponytail: game extracted to GithubGame.vue

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
