<template>
    <section class="contact section" id="contact">
        <h2 class="section__title">{{ contact.title }}</h2>
        <span class="section__subtitle">{{ contact.subtitle }}</span>

        <div class="contact__container container grid">
            <div>
                <a v-for="(info, i) in contact.items" :key="i" class="contact__information" :href="contactHref(info)" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
                    <i class="uil contact__icon" :class="info.icon"></i>
                    <div>
                        <h3 class="contact__title">{{ info.title }}</h3>
                        <span class="contact__subtitle">{{ info.value }}</span>
                    </div>
                </a>
            </div>

            <form class="contact__form grid" @submit.prevent="send" novalidate>
                <div class="contact__inputs grid">
                    <div class="contact__content">
                        <label for="" class="contact__label">name *</label>
                        <input v-model.trim="form.name" type="text" class="contact__input" placeholder="your_name" required>
                    </div>
                    <div class="contact__content">
                        <label for="" class="contact__label">email *</label>
                        <input v-model.trim="form.email" type="email" class="contact__input" placeholder="you@domain.com" required>
                    </div>
                </div>
                <div class="contact__content" style="position:relative">
                    <img src="/frontend/assets/img/star.gif" alt="" :style="{position:'absolute',right:'8px',top:'8px',width:'38px',pointerEvents:'none',zIndex:1,opacity:msgFocus?0:1,transition:'opacity .35s ease'}" />
                    <label for="" class="contact__label">message *</label>
                    <textarea v-model.trim="form.message" @focus="msgFocus=true" @blur="msgFocus=false" cols="0" rows="7" class="contact__input" placeholder="echo 'your message here...'" required></textarea>
                </div>

                <div>
                    <button type="submit" class="button button--flex" :disabled="sending" :class="{ 'button--error': showError, 'shake': shake }" :style="showError ? 'background:var(--red,#ff5a5a);border-color:var(--red,#ff5a5a);color:#fff' : ''">
                        {{ sent ? '✓ delivered' : sending ? 'sending…' : showError ? '✗ fill all fields!' : 'send --message' }}
                        <i class="uil button__icon" :class="sent ? 'uil-check' : showError ? 'uil-exclamation-triangle' : 'uil-message'"></i>
                    </button>
                    <p v-if="error" style="margin-top:.6rem;color:var(--red,#ff5a5a);font-size:var(--small-font-size)">{{ error }}</p>
                    <p v-if="sent" style="margin-top:.6rem;color:var(--green);font-size:var(--small-font-size)">✓ Membuka aplikasi email — tinggal tekan kirim ke ibnudexton@gmail.com</p>
                </div>
            </form>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Contact',
    data() {
        return { contact: data.contact, form: { name: '', email: '', message: '' }, sending: false, sent: false, error: '', showError: false, shake: false, msgFocus: false }
    },
    computed: {
        canSend() { return this.form.name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email) && this.form.message }
    },
    mounted() {
        this.$nextTick(() => {
            const els = this.$el.querySelectorAll('.section__title,.section__subtitle,.contact__information,.contact__content,.button')
            els.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (Math.min(i, 6) * 80) + 'ms' })
            if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return }
            const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)), { threshold: 0.12 })
            els.forEach(el => io.observe(el))
            els.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('is-visible') })
        })
    },
    methods: {
        contactHref(info) {
            if (info.href) return info.href
            if (info.icon.includes('envelope') || info.title.toLowerCase().includes('email')) return 'mailto:' + info.value
            return '#'
        },
        triggerError(msg) {
            this.error = msg; this.showError = true; this.shake = true
            setTimeout(() => this.shake = false, 400)
            setTimeout(() => { this.showError = false; this.error = '' }, 2500)
        },
        send() {
            if (this.sending || this.sent) return
            if (!this.form.name) return this.triggerError('⚠ Harap isi kolom contact terlebih dahulu — name required.')
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) return this.triggerError('⚠ Harap isi kolom contact terlebih dahulu — valid email required.')
            if (!this.form.message) return this.triggerError('⚠ Harap isi kolom contact terlebih dahulu — message required.')
            this.error = ''; this.showError = false; this.sending = true
            // ponytail: belum ada backend — buka mailto biar pesan beneran kekirim
            const subject = encodeURIComponent('Portfolio contact dari ' + this.form.name)
            const body = encodeURIComponent(this.form.message + '\n\n— ' + this.form.name + ' (' + this.form.email + ')')
            window.location.href = `mailto:ibnudexton@gmail.com?subject=${subject}&body=${body}`
            setTimeout(() => { this.sending = false; this.sent = true; this.form = { name: '', email: '', message: '' }; setTimeout(() => this.sent = false, 4000) }, 900)
        }
    }
}
</script>