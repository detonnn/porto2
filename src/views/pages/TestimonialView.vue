<template>
    <section class="testimonial section" id="testimonial">
        <h2 class="section__title">{{ testimonials.title }}</h2>
        <span class="section__subtitle">{{ testimonials.subtitle }}</span>

        <div class="tcol__wrap">
            <div v-for="(col, ci) in columns" :key="ci" class="tcol">
                <div class="tcol__track" :style="{ animationDuration: (col.length * 4) + 's' }">
                    <div v-for="loop in 2" :key="loop" class="tcol__group">
                        <div class="testimonial__content" v-for="(item, i) in col" :key="i">
                            <div class="testimonial__data">
                                <div class="testimonial__header">
                                    <img :src="item.image" class="testimonial__img" alt="" loading="lazy">
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
        return { testimonials: data.testimonials, colCount: window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
    },
    mounted() {
        this.onResize = () => { this.colCount = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3 }
        window.addEventListener('resize', this.onResize)
    },
    beforeUnmount() { window.removeEventListener('resize', this.onResize) },
    computed: {
        columns() {
            const items = this.testimonials.items || []
            const per = Math.ceil(items.length / this.colCount)
            return Array.from({ length: this.colCount }, (_, i) => items.slice(i * per, i * per + per))
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
.tcol__track { display: flex; flex-direction: column; gap: 1.25rem; animation: tcol-scroll linear infinite; }
.tcol__group { display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 1.25rem; }
@keyframes tcol-scroll { to { transform: translateY(-50%); } }
@media (prefers-reduced-motion: reduce) { .tcol__track { animation: none; } }
/* ponytail: cards reuse global .testimonial__* vars so light/dark follows body.light-theme automatically */
.testimonial__content { margin-bottom: 0; }
</style>
