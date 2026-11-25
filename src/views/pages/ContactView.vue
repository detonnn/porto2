<template>
    <section class="contact section" id="contact">
        <h2 class="section__title">{{ contact.title }}</h2>
        <span class="section__subtitle">{{ contact.subtitle }}</span>

        <div class="contact__container container grid">
            <div>
                <component v-for="(info, i) in contact.items" :key="i" :is="contactHref(info) ? 'a' : 'div'" class="contact__information" :href="contactHref(info) || undefined" :target="contactHref(info) ? '_blank' : undefined" :rel="contactHref(info) ? 'noopener' : undefined" style="text-decoration:none;color:inherit">
                    <i class="uil contact__icon" :class="info.icon"></i>
                    <div>
                        <h3 class="contact__title">{{ info.title }}</h3>
                        <span class="contact__subtitle" style="word-break:break-word;overflow-wrap:anywhere">{{ info.value }}</span>
                    </div>
                </component>
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
                    <img src="/frontend/assets/img/star.gif" alt="" loading="lazy" decoding="async" :style="{position:'absolute',right:'8px',top:'8px',width:'38px',pointerEvents:'none',zIndex:1,opacity:msgFocus?0:1,transition:'opacity .35s ease'}" />
                    <label for="" class="contact__label">message *</label>
                    <textarea v-model.trim="form.message" @focus="msgFocus=true" @blur="msgFocus=false" cols="0" rows="7" class="contact__input" placeholder="echo 'your message here...'" required></textarea>
                </div>

                <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;opacity:0;height:0;width:0">
                <div class="contact__rating" role="radiogroup" aria-label="Rate your experience" @mouseleave="hover = 0">
                    <span class="contact__rating-label">rating *</span>
                    <button v-for="n in 5" :key="n" type="button" class="contact__star" :class="{ on: n <= (hover || form.rating), pop: popStar === n }" role="radio" :aria-checked="n === form.rating" :aria-label="`Rate ${n} out of 5`" @mouseenter="hover = n" @click="setRating(n)">★</button>
                </div>

                <div>
                    <button type="submit" class="button button--flex" :disabled="sending" :class="{ 'button--error': showError, 'shake': shake }" :style="showError ? 'background:var(--red,#ff5a5a);border-color:var(--red,#ff5a5a);color:#fff' : ''">
                        {{ sent ? '✓ delivered' : sending ? 'sending…' : showError ? '✗ fill all fields!' : 'send --message' }}
                        <i class="uil button__icon" :class="sent ? 'uil-check' : showError ? 'uil-exclamation-triangle' : 'uil-message'"></i>
                    </button>
                    <p v-if="error" style="margin-top:.6rem;color:var(--red,#ff5a5a);font-size:var(--small-font-size)">{{ error }}</p>
                    <p v-if="sent" style="margin-top:.6rem;color:var(--green);font-size:var(--small-font-size)">✓ Review terkirim — makasih! Udah muncul di reviews.log</p>
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
        return { contact: data.contact, form: { name: '', email: '', message: '', rating: 0, website: '' }, hover: 0, popStar: 0, sending: false, sent: false, error: '', showError: false, shake: false, msgFocus: false }
    },
    computed: {
        canSend() { return this.form.name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email) && this.form.message }
    },
    mounted() {
        this.$nextTick(() => {
            const els = this.$el.querySelectorAll('.section__title,.section__subtitle,.contact__information,.contact__content,.button')
            els.forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (Math.min(i, 6) * 80) + 'ms' })
            if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-visible')); return }
            this._contactIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)), { threshold: 0.12 })
            els.forEach(el => this._contactIO.observe(el))
            els.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add('is-visible') })
        })
    },
    beforeUnmount() {
        if (this._contactIO) this._contactIO.disconnect()
    },
    methods: {
        contactHref(info) {
            if (info.href) return info.href
            if (info.icon.includes('envelope') || info.title.toLowerCase().includes('email')) return 'mailto:' + info.value
            if (info.icon.includes('github')) return info.href || '#'
            return null
        },
        setRating(n) {
            this.form.rating = n; this.popStar = n
            setTimeout(() => { this.popStar = 0 }, 300)
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
            if (!this.form.rating) return this.triggerError('⚠ Kasih bintang dulu — rating required.')
            this.error = ''; this.showError = false; this.sending = true
            // ponytail: POST ke /api/review -> Upstash + email ke owner, lalu langsung muncul di reviews.log
            fetch('/api/review', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': (() => { try { return localStorage.getItem('porto2_admin') || '' } catch (e) { return '' } })() }, body: JSON.stringify(this.form) })
                .then(async r => {
                    const d = await r.json().catch(() => ({}))
                    if (r.status === 429) return this.triggerError(`⚠ Tunggu ${Math.ceil((d.retryAfter || 3600) / 60)} menit lagi buat kirim review berikutnya.`)
                    if (!r.ok) return this.triggerError('⚠ ' + (d.error || 'Gagal kirim, coba lagi.'))
                    if (d.review) window.dispatchEvent(new CustomEvent('review:added', { detail: d.review }))
                    // kalo bagian review lagi gak keliatan (misal di HP), scroll ke sana biar kartunya langsung kelihatan
                    setTimeout(() => {
                        const el = document.getElementById('testimonial')
                        if (!el) return
                        const r = el.getBoundingClientRect(), vh = window.innerHeight
                        if (r.bottom > vh * 0.3 && r.top < vh * 0.7) return
                        if (window.lenis && typeof window.lenis.scrollTo === 'function') window.lenis.scrollTo(el, { offset: -70, duration: 1.1 })
                        else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }, 500)
                    this.sent = true; this.form = { name: '', email: '', message: '', rating: 0, website: '' }
                    setTimeout(() => { this.sent = false }, 4000)
                })
                .catch(() => this.triggerError('⚠ Koneksi bermasalah, coba lagi.'))
                .finally(() => { this.sending = false })
        }
    }
}
</script>

<style scoped>
.contact__rating { display: flex; align-items: center; gap: .15rem; }
.contact__rating-label { font-size: var(--small-font-size); margin-right: .5rem; opacity: .8; }
.contact__star { background: none; border: 0; padding: .1rem .15rem; font-size: 1.7rem; line-height: 1; cursor: pointer; color: var(--text-color-light, #8a8f98); transition: color .15s, transform .15s; }
.contact__star.on { color: #fcd34d; }
.contact__star.pop { animation: star-pop .28s ease-out; }
@keyframes star-pop { 50% { transform: scale(1.35); } }
</style>
