<template>
    <section class="home section" id="home" ref="homeSection">
        <div class="home__container container grid">
            <div class="home__content grid">
                <div class="home__social">
                    <a v-for="(social, i) in profile.socials" :key="i" :href="social.url"
                        class="home__social-icon" target="_blank" rel="noopener">
                        <i class="uil" :class="social.icon"></i>
                    </a>
                </div>

                <div class="home__data">
                    <div class="home__hero-row">
                        <div class="hero-term term-window">
                            <div class="term-window__bar">
                                <div class="term-window__dots"><span></span><span></span><span></span></div>
                                <span class="term-window__title"><i class="uil uil-shell"></i> {{ profile.terminalTitle }}</span>
                            </div>
                            <div class="term-window__body hero-term__body">
                                <p class="hero-line"><span class="prompt"><span class="user">visitor</span><span class="at">@</span><span class="host">portfolio</span><span class="sym">:</span><span class="path">~</span><span class="sym">$</span></span> <span id="hero-cmd" class="cmd" :data-cmd="profile.heroCommand"></span><span class="cursor" id="hero-cursor"></span></p>
                                <div class="hero-output" id="hero-output" style="display:none">
                                    <h1 class="home__title">Hi, I'm
                                        <span class="accent hero-name-hover">
                                            <span class="name-short">
                                                <span class="name-word" v-for="(word, wi) in shortNameWords" :key="'s-' + wi">
                                                    <span
                                                        v-for="(ch, ci) in word"
                                                        :key="'s-' + wi + '-' + ci"
                                                        class="name-letter"
                                                        :style="{ transitionDelay: letterDelay(shortNameWords, wi, ci) + 's' }"
                                                    >{{ ch }}</span>
                                                    <span v-if="wi < shortNameWords.length - 1">&nbsp;</span>
                                                </span>
                                            </span>
                                            <span class="name-full" aria-hidden="true">
                                                <span class="name-word" v-for="(word, wi) in fullNameWords" :key="'f-' + wi">
                                                    <span
                                                        v-for="(ch, ci) in word"
                                                        :key="'f-' + wi + '-' + ci"
                                                        class="name-letter"
                                                        :style="{ transitionDelay: letterDelay(fullNameWords, wi, ci) + 's' }"
                                                    >{{ ch }}</span>
                                                    <span v-if="wi < fullNameWords.length - 1">&nbsp;</span>
                                                </span>
                                            </span>
                                        </span>
                                    </h1>
                                    <h3 class="home__subtitle">
                                        <span class="sym">&gt;</span> <span class="role" id="typed-role" :data-roles="rolesJson"></span><span class="cursor"></span>
                                    </h3>
                                    <p class="home__description">{{ profile.description }}</p>
                                </div>
                                <div class="home__cat" aria-hidden="true">
                                    <img src="frontend/assets/img/cat.gif" alt="" loading="lazy" decoding="async" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <a href="#contact" ref="targetRef" class="button button--flex">
                        ./contact.sh <i class="uil uil-message button__icon"></i>
                    </a>
                </div>
            </div>

            <div class="home__scroll">
                <a href="#about" class="home__scroll-button button--flex">
                    <i class="uil uil-mouse-alt home__scroll-mouse"></i>
                    <span class="home__scroll-name">scroll --down</span>
                    <i class="uil uil-arrow-down home__scroll-arrow"></i>
                </a>
            </div>
        </div>
        <canvas ref="canvasRef" class="home__arrow-canvas" aria-hidden="true"></canvas>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Home',
    data() {
        return { profile: data.profile }
    },
    computed: {
        rolesJson() {
            return JSON.stringify(this.profile.roles)
        },
        shortNameWords() {
            return this.splitWords(this.profile.name)
        },
        fullNameWords() {
            return this.splitWords(this.profile.fullName || this.profile.name)
        }
    },
    methods: {
        splitWords(text) {
            return text.split(' ').map(w => w.split(''))
        },
        letterDelay(words, wi, ci) {
            let idx = 0
            for (let w = 0; w < wi; w++) idx += words[w].length
            idx += ci
            // ponytail: base 0.06 biar huruf pertama (I) gak pop instant, ikut wave
            return (idx * 0.028 + 0.06).toFixed(3)
        },
        parseRgb(colorString) {
            if (!colorString) return null
            const m = colorString.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
            return m ? { r: +m[1], g: +m[2], b: +m[3] } : null
        },
    },
    mounted() {
        const canvas = this.$refs.canvasRef
        const target = this.$refs.targetRef
        const home = this.$refs.homeSection
        if (!canvas || !target || !home) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let mouse = { x: null, y: null }
        let isInsideHome = false
        let rafId = null
        const stroke = { r: 255, g: 255, b: 255 }

        const resolveColor = () => {
            // pakai --text / --green biar sinkron sama terminal.css light/dark
            const probe = document.createElement('div')
            probe.style.display = 'none'
            document.body.appendChild(probe)
            probe.style.color = 'var(--text)'
            let c = this.parseRgb(getComputedStyle(probe).color)
            if (c) Object.assign(stroke, c)
            else {
                const dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('light-theme') === false
                // fallback: dark=putih, light=hitam kebiruan
                Object.assign(stroke, dark ? { r: 230, g: 235, b: 245 } : { r: 31, g: 42, b: 58 })
            }
            probe.remove()
        }
        resolveColor()
        const mo = new MutationObserver(resolveColor)
        mo.observe(document.documentElement, { attributes: true })
        mo.observe(document.body, { attributes: true })

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (!isInsideHome || mouse.x === null || mouse.y === null) return
            const rect = target.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const x0 = mouse.x, y0 = mouse.y
            const a = Math.atan2(cy - y0, cx - x0)
            const x1 = cx - Math.cos(a) * (rect.width / 2 + 12)
            const y1 = cy - Math.sin(a) * (rect.height / 2 + 12)
            const midX = (x0 + x1) / 2
            const midY = (y0 + y1) / 2
            const dist = Math.hypot(x1 - x0, y1 - y0)
            if (dist < 30) return
            const offset = Math.min(200, dist * 0.5)
            const t = Math.max(-1, Math.min(1, (y0 - y1) / 200))
            const cX = midX
            const cY = midY + offset * t
            const opacity = Math.min(1, (dist - Math.max(rect.width, rect.height) / 2) / 500)
            if (opacity <= 0.02) return
            ctx.strokeStyle = `rgba(${stroke.r},${stroke.g},${stroke.b},${opacity})`
            ctx.lineWidth = 2
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.quadraticCurveTo(cX, cY, x1, y1)
            ctx.setLineDash([10, 5])
            ctx.stroke()
            ctx.restore()
            const angle = Math.atan2(y1 - cY, x1 - cX)
            const head = 10 * (ctx.lineWidth / 1.5)
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x1 - head * Math.cos(angle - Math.PI / 6), y1 - head * Math.sin(angle - Math.PI / 6))
            ctx.moveTo(x1, y1)
            ctx.lineTo(x1 - head * Math.cos(angle + Math.PI / 6), y1 - head * Math.sin(angle + Math.PI / 6))
            ctx.stroke()
        }

        // ponytail: event-driven draw, tanpa RAF loop tiap frame — hemat CPU
        const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        let ticking = false
        const scheduleDraw = () => {
            if (ticking || document.hidden) return
            ticking = true
            rafId = requestAnimationFrame(() => { ticking = false; draw() })
        }
        const onVis = () => { if (document.hidden) { isInsideHome = false; mouse = { x: null, y: null }; ctx.clearRect(0,0,canvas.width,canvas.height) } }
        document.addEventListener('visibilitychange', onVis)

        const onMove = (e) => {
            if (isCoarse) return
            const r = home.getBoundingClientRect()
            isInsideHome = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
            if (isInsideHome) { mouse = { x: e.clientX, y: e.clientY }; scheduleDraw() }
            else { mouse = { x: null, y: null }; ctx.clearRect(0,0,canvas.width,canvas.height) }
        }
        const onLeave = () => { isInsideHome = false; mouse = { x: null, y: null }; ctx.clearRect(0,0,canvas.width,canvas.height) }

        // throttle mousemove 30fps di mobile sudah via isCoarse guard, desktop rAF throttle
        window.addEventListener('mousemove', onMove, { passive: true })
        window.addEventListener('resize', resize)
        home.addEventListener('mouseleave', onLeave)
        // kalau pointer masuk navbar (fixed header) arrow otomatis hilang karena isInsideHome=false, tapi jaga-jaga:
        const header = document.getElementById('header')
        if (header) header.addEventListener('mouseenter', onLeave)

        this._arrowCleanup = () => {
            if (rafId) cancelAnimationFrame(rafId)
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('resize', resize)
            document.removeEventListener('visibilitychange', onVis)
            home.removeEventListener('mouseleave', onLeave)
            if (header) header.removeEventListener('mouseenter', onLeave)
            mo.disconnect()
        }
    },
    beforeUnmount() {
        if (this._arrowCleanup) this._arrowCleanup()
    }
};
</script>

<style scoped>
.home.section { position: relative; }
.home__arrow-canvas {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 5;
}
@media (pointer: coarse) {
    .home__arrow-canvas { display: none; }
}
</style>
