<template>
    <section class="testimonial section" id="testimonial">
        <h2 class="section__title">{{ testimonials.title }}</h2>
        <span class="section__subtitle">{{ testimonials.subtitle }}</span>

        <div class="tcol__wrap" ref="wrap" :class="{ 'is-paused': !inView }">
            <template v-if="ready">
            <div v-for="(col, ci) in columns" :key="ci" class="tcol">
                <div class="tcol__track" :style="{ animationDuration: (Math.max(col.length, 3) * 4) + 's' }">
                    <div v-for="loop in 2" :key="loop" class="tcol__group">
                        <div class="testimonial__content" v-for="(item, i) in col" :key="item.id || 'd' + i">
                            <div class="testimonial__data">
                                <div class="testimonial__header">
                                    <img :src="item.image" class="testimonial__img" alt="" decoding="async">
                                    <div>
                                        <h3 class="testimonial__name">{{ item.name }}</h3>
                                        <span class="testimonial__client">{{ item.role }}</span>
                                    </div>
                                </div>
                                <div>
                                    <i class="uil uil-star testimonial__icon-star" v-for="n in item.rating" :key="n"></i>
                                </div>
                            </div>
                            <p class="testimonial__description">{{ item.text }}</p>
                        </div>
                    </div>
                </div>
            </div>
            </template>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Testimonial',
    data() {
        return { testimonials: data.testimonials, live: [], ready: false, inView: true, colCount: window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
    },
    mounted() {
        this.onResize = () => { this.colCount = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
        window.addEventListener('resize', this.onResize)
        // ponytail: review asli dari /api/review (gagal fetch = tetap tampil dummy)
        this.onAdded = e => { this.live = [e.detail, ...this.live.filter(r => r.id !== e.detail.id)] }
        window.addEventListener('review:added', this.onAdded)
        // ponytail: render marquee SETELAH fetch selesai (maks 2.5 dtk) biar kartu gak di-render ulang di tengah animasi
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 2500)
        fetch('/api/review', { signal: ctrl.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (Array.isArray(d.reviews)) this.live = d.reviews }).catch(() => {}).finally(() => { clearTimeout(t); this.ready = true })
        // pause animasi kalo section lagi gak keliatan, biar main thread gak kebuang
        if ('IntersectionObserver' in window) {
            this._io = new IntersectionObserver(es => { this.inView = es[0].isIntersecting }, { rootMargin: '120px' })
            this._io.observe(this.$refs.wrap)
        }
    },
    beforeUnmount() { window.removeEventListener('resize', this.onResize); window.removeEventListener('review:added', this.onAdded); if (this._io) this._io.disconnect() },
    computed: {
        columns() {
            const n = this.colCount
            const base = this.testimonials.items || []
            const per = Math.ceil(base.length / n)
            // review asli: posisi kolom tetap (dari yang terlama), jadi review baru gak mindahin kartu lain
            const total = this.live.length
            return Array.from({ length: n }, (_, ci) => [
                ...this.live.filter((_, i) => (total - 1 - i) % n === ci),
                ...base.slice(ci * per, ci * per + per),
            ])
        }
    }
}
</script>

<style scoped>
.tcol__wrap {
    display: flex;
    justify-content: center;
    gap: 1.25rem;
    max-height: 740px;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
    mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}
.tcol { width: 100%; max-width: 320px; overflow: hidden; }
.tcol__wrap { min-height: 480px; }
.tcol__track { display: flex; flex-direction: column; gap: 1.25rem; animation: tcol-scroll linear infinite; -webkit-animation: tcol-scroll linear infinite; will-change: transform; }
.tcol__wrap.is-paused .tcol__track { animation-play-state: paused; -webkit-animation-play-state: paused; }
.tcol__group { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 1.25rem; }
@keyframes tcol-scroll { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -50%, 0); } }
@-webkit-keyframes tcol-scroll { to { -webkit-transform: translateY(-50%); transform: translateY(-50%); } }
@media (prefers-reduced-motion: reduce) { .tcol__track { animation-duration: 80s !important; -webkit-animation-duration: 80s !important; } }
/* ponytail: cards reuse global .testimonial__* vars so light/dark follows body.light-theme automatically */
.testimonial__content { margin-bottom: 0; }
</style>
