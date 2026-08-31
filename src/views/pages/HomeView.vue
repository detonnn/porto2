<template>
    <section class="home section" id="home">
        <div class="home__container container grid">
            <div class="home__content grid">
                <div class="home__social">
                    <a v-for="(social, i) in profile.socials" :key="i" :href="social.url"
                        class="home__social-icon" target="_blank" rel="noopener">
                        <i class="uil" :class="social.icon"></i>
                    </a>
                </div>

                <div class="home__data">
                    <div class="home__hero-row">
                        <div class="hero-term term-window">
                            <div class="term-window__bar">
                                <div class="term-window__dots"><span></span><span></span><span></span></div>
                                <span class="term-window__title"><i class="uil uil-shell"></i> {{ profile.terminalTitle }}</span>
                            </div>
                            <div class="term-window__body hero-term__body">
                                <p class="hero-line"><span class="prompt"><span class="user">visitor</span><span class="at">@</span><span class="host">portfolio</span><span class="sym">:</span><span class="path">~</span><span class="sym">$</span></span> <span id="hero-cmd" class="cmd" :data-cmd="profile.heroCommand"></span><span class="cursor" id="hero-cursor"></span></p>
                                <div class="hero-output" id="hero-output" style="display:none">
                                    <h1 class="home__title">Hi, I'm
                                        <span class="accent hero-name-hover">
                                            <span class="name-short">
                                                <span class="name-word" v-for="(word, wi) in shortNameWords" :key="'s-' + wi">
                                                    <span
                                                        v-for="(ch, ci) in word"
                                                        :key="'s-' + wi + '-' + ci"
                                                        class="name-letter"
                                                        :style="{ transitionDelay: letterDelay(shortNameWords, wi, ci) + 's' }"
                                                    >{{ ch }}</span>
                                                    <span v-if="wi < shortNameWords.length - 1">&nbsp;</span>
                                                </span>
                                            </span>
                                            <span class="name-full" aria-hidden="true">
                                                <span class="name-word" v-for="(word, wi) in fullNameWords" :key="'f-' + wi">
                                                    <span
                                                        v-for="(ch, ci) in word"
                                                        :key="'f-' + wi + '-' + ci"
                                                        class="name-letter"
                                                        :style="{ transitionDelay: letterDelay(fullNameWords, wi, ci) + 's' }"
                                                    >{{ ch }}</span>
                                                    <span v-if="wi < fullNameWords.length - 1">&nbsp;</span>
                                                </span>
                                            </span>
                                        </span>
                                    </h1>
                                    <h3 class="home__subtitle">
                                        <span class="sym">&gt;</span> <span class="role" id="typed-role" :data-roles="rolesJson"></span><span class="cursor"></span>
                                    </h3>
                                    <p class="home__description">{{ profile.description }}</p>
                                </div>
                                <div class="home__cat" aria-hidden="true">
                                    <img src="frontend/assets/img/cat.gif" alt="" loading="lazy" decoding="async" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <a href="#contact" class="button button--flex">
                        ./contact.sh <i class="uil uil-message button__icon"></i>
                    </a>
                </div>
            </div>

            <div class="home__scroll">
                <a href="#about" class="home__scroll-button button--flex">
                    <i class="uil uil-mouse-alt home__scroll-mouse"></i>
                    <span class="home__scroll-name">scroll --down</span>
                    <i class="uil uil-arrow-down home__scroll-arrow"></i>
                </a>
            </div>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'

export default {
    name: 'Home',
    data() {
        return { profile: data.profile }
    },
    computed: {
        rolesJson() {
            return JSON.stringify(this.profile.roles)
        },
        shortNameWords() {
            return this.splitWords(this.profile.name)
        },
        fullNameWords() {
            return this.splitWords(this.profile.fullName || this.profile.name)
        }
    },
    methods: {
        splitWords(text) {
            return text.split(' ').map(w => w.split(''))
        },
        letterDelay(words, wi, ci) {
            let idx = 0
            for (let w = 0; w < wi; w++) idx += words[w].length
            idx += ci
            return (idx * 0.028).toFixed(3)
        }
    }
};
</script>
