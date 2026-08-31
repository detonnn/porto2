<template>
    <section class="testimonial section">
        <h2 class="section__title">{{ testimonials.title }}</h2>
        <span class="section__subtitle">{{ testimonials.subtitle }}</span>

        <p style="text-align:center;color:var(--text-faint);font-size:var(--smaller-font-size);margin-bottom:.6rem">swipe to the right <i class="uil uil-arrow-right"></i></p>
        <div class="testimonial__container container swiper">
            <div class="swiper-wrapper">
                <div class="testimonial__content swiper-slide" v-for="(item, i) in testimonials.items" :key="i">
                    <div class="testimonial__data">
                        <div class="testimonial__header">
                            <img :src="item.image" class="testimonial__img" alt="">

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
            <div class="swiper-pagination swiper-pagination-testimonial"></div>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Testimonial',
    data() {
        return { testimonials: data.testimonials }
    },
    mounted() {
        this.$nextTick(() => {
            const els = this.$el.querySelectorAll('.section__title,.section__subtitle,.testimonial__content,.testimonial__container')
            els.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (Math.min(i, 6) * 80) + 'ms' })
            if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return }
            const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)), { threshold: 0.12 })
            els.forEach(el => io.observe(el))
            els.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('is-visible') })
        })
    }
}
</script>
