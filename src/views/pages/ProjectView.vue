<template>
    <section class="project section">
        <div class="project__bg">
            <div class="project__container container grid">
                <div class="project__data">
                    <h2 class="project__title">{{ project.title }}</h2>
                    <p class="project__description">
                        {{ desc.before }}<span ref="discount" class="project__discount"><span class="project__discount-text">{{ desc.token }}</span><svg class="project__discount-draw" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M 178 14 C 196 40 190 74 150 88 C 100 104 30 94 10 62 C -6 34 30 8 86 6 C 140 4 180 24 186 46" /></svg></span>{{ desc.after }}
                    </p>
                    <a href="#contact" class="button button--flex button--white">
                        {{ project.button }} <i class="uil uil-message project__icon button__icon"></i>
                    </a>
                </div>

                <img :src="project.image" alt="" class="project__img" loading="lazy" decoding="async">
            </div>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Project',
    data() {
        return { project: data.projectCta }
    },
    computed: {
        desc() {
            const token = this.project.description.match(/\d+%/)?.[0] ?? '30%'
            const [before = '', after = ''] = this.project.description.split(token)
            return { token, before, after }
        },
    },
    mounted() {
        const el = this.$refs.discount
        if (!el) return
        const path = el.querySelector('.project__discount-draw path')
        // dash length must match the real path length, else the stroke looks frozen
        if (path) el.style.setProperty('--draw-len', Math.ceil(path.getTotalLength()))
        const reveal = () => el.classList.add('is-drawn')
        if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            reveal()
            return
        }
        // toggle (not one-shot) so the draw replays every time the section comes back
        this._drawIO = new IntersectionObserver(([e]) => el.classList.toggle('is-drawn', e.isIntersecting), { threshold: 0.6 })
        this._drawIO.observe(el)
    },
    beforeUnmount() {
        if (this._drawIO) this._drawIO.disconnect()
    },
}
</script>

<style scoped>
.project__discount {
    position: relative;
    display: inline-block;
    font-weight: var(--font-semi-bold);
    color: var(--green);
    white-space: nowrap;
}
.project__discount-draw {
    position: absolute;
    left: -0.7em;
    top: -0.55em;
    width: calc(100% + 1.4em);
    height: calc(100% + 1.1em);
    overflow: visible;
    pointer-events: none;
}
.project__discount-draw path {
    fill: none;
    stroke: var(--green);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: var(--draw-len, 600);
    stroke-dashoffset: var(--draw-len, 600);
    opacity: 0;
}
.project__discount-text {
    display: inline-block;
    opacity: 0;
    transform: translateY(0.15em);
}
.project__discount.is-drawn .project__discount-draw path {
    animation: project-draw 1.1s cubic-bezier(0.43, 0.13, 0.23, 0.96) forwards;
}
.project__discount.is-drawn .project__discount-text {
    animation: project-draw-text 0.5s ease-out 0.25s forwards;
}
@keyframes project-draw {
    0% { opacity: 0; stroke-dashoffset: var(--draw-len, 600); }
    12% { opacity: 1; }
    100% { opacity: 1; stroke-dashoffset: 0; }
}
@keyframes project-draw-text {
    to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
    .project__discount-draw path { animation: none !important; opacity: 1; stroke-dashoffset: 0; }
    .project__discount-text { animation: none !important; opacity: 1; transform: none; }
}
</style>
