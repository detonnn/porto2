<template>
    <header class="header" id="header">
        <nav class="nav container">
            <a href="#" class="nav__logo">Ibnu Dexton</a>

            <div class="nav__menu" id="nav-menu">
                <ul class="nav__list grid">
                    <li class="nav__item">
                        <a href="#home" class="nav__link active-link">
                            <i class="uil uil-estate nav__icon"></i> ~/home
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#about" class="nav__link">
                            <i class="uil uil-user nav__icon"></i> whoami
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#skills" class="nav__link">
                            <i class="uil uil-file-alt nav__icon"></i> stack
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#github" class="nav__link">
                            <i class="uil uil-github-alt nav__icon"></i> activity
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#services" class="nav__link">
                            <i class="uil uil-briefcase-alt nav__icon"></i> services
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#portfolio" class="nav__link">
                            <i class="uil uil-scenery nav__icon"></i> projects
                        </a>
                    </li>
                    <li class="nav__item">
                        <a href="#contact" class="nav__link">
                            <i class="uil uil-message nav__icon"></i> contact
                        </a>
                    </li>
                </ul>
                <i class="uil uil-times nav__close" id="nav-close"></i>
            </div>

            <div class="nav__btns">
                <!-- theme change button -->
                <i class="uil uil-sun change-theme" id="theme-button"></i>
                <div class="nav__toggle" id="nav-toggle">
                    <i class="uil uil-apps"></i>
                </div>
            </div>
        </nav>

        <transition name="now-playing-fade">
            <div class="now-playing" v-if="currentTrack" :class="{ paused: !musicPlaying, 'is-moving': moving }" @click="toggleTrack" :title="musicPlaying ? 'Mute musik' : 'Putar musik'">
                <div class="now-playing__mini"><i class="uil now-playing__icon" :class="musicPlaying ? 'uil-music' : 'uil-volume-mute'"></i></div>
                <div class="now-playing__full">
                    <i class="uil now-playing__icon" :class="musicPlaying ? 'uil-music' : 'uil-volume-mute'"></i>
                    <div class="now-playing__info">
                        <span class="now-playing__title">{{ currentTrack.title }}</span>
                        <span class="now-playing__artist">{{ currentTrack.artist }}</span>
                    </div>
                </div>
            </div>
        </transition>
    </header>
</template>

<script>
import { musicState, toggleMusic } from '../../components/musicPlayer';

export default {
    name: 'Header',
    data() {
        return { moving: false }
    },
    mounted() {
        // ponytail: widget lagu di HP mengecil (icon doang) saat user scroll/swipe, melebar lagi setelah diem ~1.2 detik
        this._idle = null
        this.onMove = () => {
            this.moving = true
            clearTimeout(this._idle)
            this._idle = setTimeout(() => { this.moving = false }, 1200)
        }
        this._evs = ['touchstart', 'touchmove', 'scroll', 'wheel']
        this._evs.forEach(e => window.addEventListener(e, this.onMove, { passive: true }))
    },
    beforeUnmount() {
        clearTimeout(this._idle)
        this._evs.forEach(e => window.removeEventListener(e, this.onMove))
    },
    computed: {
        musicPlaying() {
            return musicState.isPlaying;
        },
        currentTrack() {
            return musicState.currentTrack;
        },
    },
    methods: {
        toggleTrack() {
            toggleMusic();
        },
    },
}
</script>
