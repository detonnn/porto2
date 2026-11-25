<template>
    <section class="testimonial section" id="testimonial">
        <h2 class="section__title">{{ testimonials.title }}</h2>
        <span class="section__subtitle">{{ testimonials.subtitle }}</span>

        <div class="tcol__wrap">
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
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Testimonial',
    data() {
        return { testimonials: data.testimonials, live: [], colCount: window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
    },
    mounted() {
        this.onResize = () => { this.colCount = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
        window.addEventListener('resize', this.onResize)
        // ponytail: review asli dari /api/review (gagal fetch = tetap tampil dummy)
        this.onAdded = e => { this.live = [e.detail, ...this.live.filter(r => r.id !== e.detail.id)] }
        window.addEventListener('review:added', this.onAdded)
        fetch('/api/review').then(r => r.ok ? r.json() : Promise.reject()).then(d => { if (Array.isArray(d.reviews)) this.live = d.reviews }).catch(() => {})
    },
    beforeUnmount() { window.removeEventListener('resize', this.onResize); window.removeEventListener('review:added', this.onAdded) },
    computed: {
        columns() {
            const items = [...this.live, ...(this.testimonials.items || [])]
            // bagi bergantian biar review baru nyebar ke semua kolom, bukan numpuk di kiri
            return Array.from({ length: this.colCount }, (_, ci) => items.filter((_, i) => i % this.colCount === ci))
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
.tcol__track { display: flex; flex-direction: column; gap: 1.25rem; animation: tcol-scroll linear infinite; -webkit-animation: tcol-scroll linear infinite; will-change: transform; }
.tcol__group { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 1.25rem; }
@keyframes tcol-scroll { to { transform: translateY(-50%); } }
@-webkit-keyframes tcol-scroll { to { -webkit-transform: translateY(-50%); transform: translateY(-50%); } }
@media (prefers-reduced-motion: reduce) { .tcol__track { animation-duration: 80s !important; -webkit-animation-duration: 80s !important; } }
/* ponytail: cards reuse global .testimonial__* vars so light/dark follows body.light-theme automatically */
.testimonial__content { margin-bottom: 0; contain: layout paint; }
.tcol__track { backface-visibility: hidden; transform: translateZ(0); }
</style>
