<template>
    <div class="footer-wrap">
        <img src="/frontend/assets/img/wcat.gif" alt="" class="footer__cat reveal" />

        <footer class="footer">
            <div class="footer__pin">
                <div class="footer__sticky">
                    <div class="footer__bg">
                        <div aria-hidden="true" class="footer__glow">
                            <span class="footer__glow-blob footer__glow-blob--a"></span>
                            <span class="footer__glow-blob footer__glow-blob--b"></span>
                        </div>

                        <div class="footer__container container">
                            <div class="footer__col footer__col--brand">
                                <span class="footer__mark">~/{{ footer.title }}</span>
                                <span class="footer__subtitle">{{ footer.subtitle }}</span>
                                <p class="footer__tagline">{{ footer.tagline }}</p>

                                <div class="footer__socials">
                                    <a v-for="(social, i) in footer.socials" :key="i" :href="social.url"
                                        class="footer__social" target="_blank" rel="noopener" :title="social.label">
                                        <i class="uil" :class="social.icon"></i>
                                    </a>
                                </div>
                            </div>

                            <div v-for="(group, gi) in footer.linkGroups" :key="gi" class="footer__col footer__col--links">
                                <h3 class="footer__col-title">{{ group.label }}</h3>
                                <ul class="footer__links">
                                    <li v-for="(link, i) in group.links" :key="i">
                                        <a :href="link.href" class="footer_link">{{ link.label }}</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="footer__bottom container">
                            <p class="footer__copy">&#169; {{ footer.copyright }}</p>
                            <a href="#home" class="footer__top">
                                cd ~/top <i class="uil uil-arrow-up"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Footer',
    data() {
        return { footer: data.footer }
    },
    mounted() {
        this.$nextTick(() => {
            const el = this.$el.querySelector('.footer__cat')
            if (!el) return
            if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return }
            const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)), { threshold: 0.12 })
            io.observe(el)
        })
    }
}
</script>
