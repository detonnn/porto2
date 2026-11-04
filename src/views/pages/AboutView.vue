<template>
    <section ref="section" class="about section" id="about">
        <h2 class="section__title">{{ about.title }}</h2>
        <span class="section__subtitle">{{ about.subtitle }}</span>

        <div class="about__container container grid">
        <div ref="slot" class="about__lanyard">
            <!-- rig is pulled up to the section top, so the strap hangs from the edge under the navbar -->
            <div
              class="about__lanyard-rig"
              :class="{ 'about__lanyard-rig--dark': !theme.light }"
              :style="{ top: -rig.up + 'px', left: rig.left + 'px', width: rig.width + 'px', '--fade-start': rig.fade + 'px' }"
            >
                <lanyard-badge
                  :active="inView"
                  :height="rig.height + 'px'"
                  :layout-height="rig.layoutH"
                  :anchor-x="rig.anchorX"
                  :anchor-spread="rig.spread"
                  :card-width="cardWidth"
                  :card-ratio="idRatio"
                  :strap-text="about.title"
                  strap-label="IBNU DEXTON"
                  name="Ibnu Dexton"
                  role="Software Engineer"
                  :strap-color="theme.strapColor"
                  :ink-color="theme.inkColor"
                  :card-color="theme.cardColor"
                  :display-font="theme.font"
                  :script-font="theme.font"
                  :flip-button="false"
                >
                    <template #front>
                        <div class="about__id">
                            <img
                              :src="idImage"
                              alt="Identity card Ibnu Dexton"
                              draggable="false"
                              data-pin-nopin="true"
                              data-pin-no-hover="true"
                              :style="{ width: cardWidth * idRatio + 'px', height: cardWidth + 'px' }"
                            />
                        </div>
                    </template>
                    <template #back>
                        <div class="about__photo">
                            <img :src="about.revealImage" alt="Ibnu Dexton" draggable="false" data-pin-nopin="true" data-pin-no-hover="true" />
                            <span class="about__photo-shine"></span>
                        </div>
                    </template>
                </lanyard-badge>
            </div>
        </div>

            <div ref="dataBox" class="about__data term-window">
                <div class="term-window__bar">
                    <span class="term-window__title"><i class="uil uil-file-alt"></i> {{ about.windowTitle }}</span>
                </div>
                <div class="term-window__body">
                    <p class="about__prompt prompt">
                        <span class="user">ibnu</span><span class="at">@</span><span class="host">portfolio</span><span class="sym">:</span><span class="path">~</span><span class="sym">$</span>
                        <span ref="cmdEl" class="cmd">cat {{ about.windowTitle }}</span>
                    </p>

                    <p ref="descEl" class="about__description">{{ about.description }}</p>

                    <div class="about__info">
                        <div v-for="(stat, i) in about.stats" :key="i">
                            <span class="about__info-title">{{ stat.value }}</span>
                            <span class="about__info-name">{{ stat.label }}</span>
                        </div>
                    </div>

                        <div class="about__buttons">
                        <a download="" :href="about.cv" class="shiny-btn">
                            <span class="shiny-btn__shimmer"></span>
                            <span class="shiny-btn__label">wget resume.pdf <i class="uil uil-download-alt"></i></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>


<script>
import data from '../../data/portfolio.json'
import LanyardBadge from '../../components/LanyardBadge.vue'

const cssVar = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).replace(/\s+/g, ' ').trim()
    return v || fallback
}

// lanyard colours follow the dark/light toggle (main.js puts .light-theme on html + body)
const readTheme = () => {
    const font = cssVar('--body-font', 'ui-monospace, monospace')
    if (document.body.classList.contains('light-theme')) {
        return {
            font,
            light: true,
            strapColor: cssVar('--text', '#1f2a3a'),
            inkColor: cssVar('--text-faint', '#9aa6b8'),
            cardColor: cssVar('--bg-window', '#f6f8fb'),
        }
    }
    return {
        font,
        light: false,
        strapColor: cssVar('--text', '#c7d2e0'),
        inkColor: '#2b3340',
        cardColor: cssVar('--text', '#c7d2e0'),
    }
}

export default {
    name: 'About',
    components: { LanyardBadge },
    data() {
        return {
            about: data.about,
            idImage: 'frontend/assets/img/identity-card.jpg',
            idRatio: 1306 / 752, // identity-card.jpg is landscape; the badge is that shape turned upright
            inView: false,
            cardWidth: 270,
            rig: { up: 0, height: 560, layoutH: 560, left: 0, width: 0, anchorX: 0, spread: 0, fade: 0 },
            theme: { light: false, font: 'monospace', strapColor: '#181b20', inkColor: '#6b7a92', cardColor: '#c7d2e0' },
        }
    },
    mounted() {
        this.theme = readTheme()
        this.measure()

        // badge only runs while the section is open; re-entering replays the swing-in
        this.io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting || e.intersectionRatio === 0) this.inView = false
            else if (!this.inView && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= window.innerHeight * 0.5)) this.inView = true
        }, { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] })
        this.io.observe(this.$refs.section)

        // section top -> card column top changes with viewport, so measure again on resize
        this.ro = new ResizeObserver(() => this.measure())
        this.ro.observe(this.$refs.section)
        this.ro.observe(this.$refs.slot)

        // about.md prompt + description: cut-reveal, replayed every time the card is visited
        this._gen = 0
        this.shown = false
        this.prepText()
        this.io2 = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && e.intersectionRatio >= 0.3) { if (!this.shown) this.playText() }
            else if (!e.isIntersecting && this.shown) this.prepText()
        }, { threshold: [0, 0.3] })
        this.io2.observe(this.$refs.dataBox)

        this.mo = new MutationObserver(() => { this.theme = readTheme() })
        this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        this.mo.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    },
    beforeUnmount() {
        if (this.io) this.io.disconnect()
        if (this.io2) this.io2.disconnect()
        if (this.ro) this.ro.disconnect()
        if (this.mo) this.mo.disconnect()
    },
    methods: {
        textParts() {
            return [
                { el: this.$refs.cmdEl, text: 'cat ' + this.about.windowTitle, o: { stagger: 0.03, from: 'first', plain: true } },
                // spreads out from the middle, so letters leave to the left and to the right
                { el: this.$refs.descEl, text: this.about.description, o: { stagger: 0.012, from: 'center', delay: 0.25, plain: true } },
            ]
        },
        // hidden but fully laid out, so the card (and the lanyard that measures it) never changes height
        prepText() {
            this._gen++
            this.shown = false
            if (!window.cutBuild) return
            this.textParts().forEach(({ el, text, o }) => { if (el) window.cutBuild(el, text, o) })
        },
        playText() {
            this.shown = true
            this._gen++
            if (!window.cutIn) return
            this.textParts().forEach(({ el, text, o }) => { if (el) window.cutIn(el, text, o) })
        },
        measure() {
            const sec = this.$refs.section
            const slot = this.$refs.slot
            if (!sec || !slot) return
            const slotR = slot.getBoundingClientRect()
            const gap = Math.max(0, Math.round(slotR.top - sec.getBoundingClientRect().top))
            const slotW = slot.offsetWidth
            const slotH = Math.round(slot.offsetHeight)
            const mobile = window.innerWidth < 768
            const cw = Math.max(190, Math.min(mobile ? 220 : 250, Math.floor(slotW - 24)))
            // same numbers the badge uses (see LanyardBadge build()), so the layout below matches it
            const sw = Math.max(14, Math.round(cw * 0.1))
            const block = sw * 2.2 + Math.max(7, Math.round(cw * 0.036)) * 2 + Math.round(cw * 0.1) + Math.round(cw * this.idRatio) + 28
            const EXTRA = 170 // rope hidden above the section top (calmer swing, never drawn)
            const SHOW = 130 // rope we want visible between section top and buckle
            // hang the card a bit lower than the about.md card when it is tall, inside the section padding
            const drop = Math.min(120, Math.max(0, Math.ceil(SHOW + block - gap - slotH)))
            const up = gap + EXTRA
            const layoutH = up + slotH + drop
            this.cardWidth = cw
            // the badge root spans the whole viewport width (+ room below), so it can be dragged freely;
            // the rope still hangs from above the card column
            this.rig = {
                up,
                layoutH,
                height: layoutH + 320,
                left: -Math.round(slotR.left),
                width: document.documentElement.clientWidth,
                anchorX: Math.round(slotR.left + slotW / 2),
                spread: Math.round(Math.min(slotW * 0.16, cw * 0.55)),
                fade: EXTRA, // section top, in rig coordinates: nothing is drawn above it (keeps the hero clear)
            }
        },
    },
};
</script>

<style scoped>
.shiny-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;padding:.65rem 1.5rem;border-radius:8px;font-size:var(--small-font-size,.85rem);font-weight:var(--font-medium,500);text-transform:uppercase;letter-spacing:.5px;text-decoration:none;cursor:pointer;transition:all .3s ease;background:var(--bg-window);border:1px solid var(--border);color:var(--green);box-shadow:0 4px 15px rgba(0,0,0,.2)}
.shiny-btn:hover{border-color:var(--green);box-shadow:0 0 20px var(--accent-glow);transform:translateY(-2px)}
.shiny-btn__label{position:relative;z-index:10;display:inline-flex;align-items:center;gap:.5rem}
.shiny-btn__shimmer{position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,var(--shine-color,rgba(255,255,255,.35)),transparent);transform:skewX(-20deg);animation:shine 5s infinite}
@keyframes shine{0%{left:-100%}20%{left:200%}100%{left:200%}}
.about__lanyard{position:relative;width:100%;min-height:420px;justify-self:center}
.about__lanyard-rig{position:absolute;z-index:50;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,transparent var(--fade-start),#000 calc(var(--fade-start) + 40px));mask-image:linear-gradient(to bottom,transparent var(--fade-start),#000 calc(var(--fade-start) + 40px))}
.about__lanyard-rig :deep([role="button"]){pointer-events:auto}
/* dark mode: a black drop shadow is invisible on a black page, so use a soft light rim + glow instead */
.about__lanyard-rig--dark :deep(.lyd__face){box-shadow:0 0 0 1px rgba(255,255,255,.16),0 0 26px 2px rgba(199,210,224,.26),0 22px 44px -10px rgba(0,0,0,.7)}
@media screen and (max-width:767px){.about__lanyard{min-height:460px}}
.about__id{position:relative;width:100%;height:100%;overflow:hidden;background:#f3f4f6}
.about__id img{position:absolute;top:50%;left:50%;max-width:none;object-fit:contain;transform:translate(-50%,-50%) rotate(-90deg);pointer-events:none;user-select:none;-webkit-user-drag:none}
.about__photo{position:relative;width:100%;height:100%;overflow:hidden}
.about__photo img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 22%;pointer-events:none;user-select:none;-webkit-user-drag:none}
.about__photo-shine{position:absolute;top:0;left:-100%;width:50%;height:100%;pointer-events:none;background:linear-gradient(90deg,transparent,var(--shine-color,rgba(255,255,255,.35)),transparent);transform:skewX(-20deg);animation:badgeShine 5s infinite}
@keyframes badgeShine{0%{left:-100%}20%{left:200%}100%{left:200%}}
</style>
