<template>
    <section class="testimonial section" id="testimonial">
        <h2 class="section__title">{{ testimonials.title }}</h2>
        <span class="section__subtitle">{{ testimonials.subtitle }}</span>

        <div class="tcol__wrap" ref="wrap" :class="{ 'is-paused': !inView || !!newId, 'is-highlight': !!newId }">
            <template v-if="ready">
            <div v-for="(col, ci) in columns" :key="ci + '-' + restart" class="tcol">
                <div class="tcol__track" :style="{ animationDuration: (Math.max(col.length, 3) * 4) + 's', '--shift': (-100 / groups(col)) + '%' }">
                    <div v-for="loop in groups(col)" :key="loop" class="tcol__group">
                        <div class="testimonial__content" :class="{ 'is-new': item.id && item.id === newId }" v-for="(item, i) in col" :key="item.id || 'd' + i">
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
        return { testimonials: data.testimonials, live: [], restart: 0, newId: '', ready: false, inView: true, colCount: window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
    },
    mounted() {
        this.onResize = () => { this.colCount = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
        window.addEventListener('resize', this.onResize)
        // ponytail: review asli dari /api/review (gagal fetch = tetap tampil dummy)
        this.onAdded = e => {
            const r = e.detail
            this.live = [r, ...this.live.filter(x => x.id !== r.id)]
            this.restart++ // animasi mulai dari atas lagi biar kartu baru langsung keliatan, gak nunggu loop muter
            this.newId = r.id
            clearTimeout(this._nt)
            this._nt = setTimeout(() => { this.newId = '' }, 5000)
            // simpen sebentar di browser ini: kalo halaman di-reload sebelum cache server segar, review tetep tampil
            try { const a = JSON.parse(localStorage.getItem('porto2_my_reviews') || '[]').filter(x => Date.now() - x.ts < 60000); a.push(r); localStorage.setItem('porto2_my_reviews', JSON.stringify(a.slice(-5))) } catch (err) {}
        }
        window.addEventListener('review:added', this.onAdded)
        // ponytail: render marquee SETELAH fetch selesai (maks 2.5 dtk) biar kartu gak di-render ulang di tengah animasi
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 2500)
        fetch('/api/review', { signal: ctrl.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (Array.isArray(d.reviews)) this.live = d.reviews }).catch(() => {}).finally(() => {
            clearTimeout(t)
            try {
                const ids = new Set(this.live.map(r => r.id))
                const mine = JSON.parse(localStorage.getItem('porto2_my_reviews') || '[]').filter(r => Date.now() - r.ts < 60000 && !ids.has(r.id))
                if (mine.length) this.live = [...mine, ...this.live].sort((a, b) => b.ts - a.ts)
            } catch (err) {}
            this.ready = true
        })
        // pause animasi kalo section lagi gak keliatan, biar main thread gak kebuang
        if ('IntersectionObserver' in window) {
            this._io = new IntersectionObserver(es => { this.inView = es[0].isIntersecting }, { rootMargin: '120px' })
            this._io.observe(this.$refs.wrap)
        }
    },
    beforeUnmount() { window.removeEventListener('resize', this.onResize); window.removeEventListener('review:added', this.onAdded); clearTimeout(this._nt); if (this._io) this._io.disconnect() },
    methods: {
        // ponytail: kolom pendek diulang lebih dari 2x biar tinggi loop >= tinggi area tampil (gak ada ruang kosong di bawah)
        groups(col) { return Math.max(2, Math.ceil(800 / (Math.max(col.length, 1) * 170)) + 1) },
    },
    computed: {
        columns() {
            const n = this.colCount
            const base = this.testimonials.items || []
            const total = this.live.length
            // dummy dibagi bergantian ke tiap kolom; review asli ke-k masuk kolom k % n dan ngehapus 1 dummy paling bawah di kolom yang sama
            // -> jumlah kartu per kolom tetap seimbang (gak ada kolom kosong / kartu dobel)
            const dcols = Array.from({ length: n }, () => [])
            base.forEach((d, i) => dcols[i % n].push(d))
            for (let k = 0; k < total; k++) dcols[k % n].pop()
            return dcols.map((dl, c) => [
                ...this.live.filter((_, i) => (total - 1 - i) % n === c),
                ...dl,
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
    /* tinggi grep fix: konten review (jumlah kartu/panjang teks) gak boleh nggeser section contact di bawahnya */
    height: clamp(480px, 80vh, 740px);
    contain: layout; /* apapun yang happen di dalam marquee, gak boleh jadi anchor scroll halaman */
    overflow-anchor: none;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
    mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
}
.tcol { width: 100%; max-width: 320px; overflow: hidden; }
/* gap track bikin --shift (persentase dari tinggi track) gak pas sama 1 group => loncatan tiap loop; spacing cukup dari padding group */
.tcol__track { display: flex; flex-direction: column; animation: tcol-scroll linear infinite; -webkit-animation: tcol-scroll linear infinite; will-change: transform; }
.tcol__wrap.is-paused .tcol__track { animation-play-state: paused; -webkit-animation-play-state: paused; }
.tcol__group { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 1.25rem; }
@keyframes tcol-scroll { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, var(--shift, -50%), 0); } }
@-webkit-keyframes tcol-scroll { to { -webkit-transform: translateY(var(--shift, -50%)); transform: translateY(var(--shift, -50%)); } }
@media (prefers-reduced-motion: reduce) { .tcol__track { animation-duration: 80s !important; -webkit-animation-duration: 80s !important; } }
/* ponytail: cards reuse global .testimonial__* vars so light/dark follows body.light-theme automatically */
.testimonial__content { margin-bottom: 0; }
.testimonial__content.is-new { animation: tnew 2.4s ease-out 1; }
@keyframes tnew { 0% { box-shadow: 0 0 0 0 rgba(252, 211, 77, 0.6); } 100% { box-shadow: 0 0 0 10px rgba(252, 211, 77, 0); } }
</style>
