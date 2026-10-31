<template>
    <section class="about section" id="about">
        <h2 class="section__title">{{ about.title }}</h2>
        <span class="section__subtitle">{{ about.subtitle }}</span>

        <div class="about__container container grid">
        <div class="about__pic">
            <interactive-travel-card
              title="Ibnu"
              subtitle="Full Stack Developer"
              :imageUrl="about.image"
              :revealImageUrl="about.revealImage"
            />
        </div>

            <div class="about__data term-window">
                <div class="term-window__bar">
                    <span class="term-window__title"><i class="uil uil-file-alt"></i> {{ about.windowTitle }}</span>
                </div>
                <div class="term-window__body">
                    <p class="about__prompt prompt">
                        <span class="user">ibnu</span><span class="at">@</span><span class="host">portfolio</span><span class="sym">:</span><span class="path">~</span><span class="sym">$</span>
                        <span class="cmd">cat {{ about.windowTitle }}</span>
                    </p>

                    <p class="about__description">{{ about.description }}</p>

                    <div class="about__info">
                        <div v-for="(stat, i) in about.stats" :key="i">
                            <span class="about__info-title">{{ stat.value }}</span>
                            <span class="about__info-name">{{ stat.label }}</span>
                        </div>
                    </div>

                        <div class="about__buttons">
                        <a download="" :href="about.cv" class="shiny-btn">
                            <span class="shiny-btn__shimmer"></span>
                            <span class="shiny-btn__label">wget resume.pdf <i class="uil uil-download-alt"></i></span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>


<script>
import data from '../../data/portfolio.json'
import InteractiveTravelCard from '../../components/InteractiveTravelCard.vue'

export default {
    name: 'About',
    components: { InteractiveTravelCard },
    data() {
        return { about: data.about }
    }
};
</script>

<style scoped>
.shiny-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;padding:.65rem 1.5rem;border-radius:8px;font-size:var(--small-font-size,.85rem);font-weight:var(--font-medium,500);text-transform:uppercase;letter-spacing:.5px;text-decoration:none;cursor:pointer;transition:all .3s ease;background:var(--bg-window);border:1px solid var(--border);color:var(--green);box-shadow:0 4px 15px rgba(0,0,0,.2)}
.shiny-btn:hover{border-color:var(--green);box-shadow:0 0 20px var(--accent-glow);transform:translateY(-2px)}
.shiny-btn__label{position:relative;z-index:10;display:inline-flex;align-items:center;gap:.5rem}
.shiny-btn__shimmer{position:absolute;top:0;left:-100%;width:50%;height:100%;background:linear-gradient(90deg,transparent,var(--shine-color,rgba(255,255,255,.35)),transparent);transform:skewX(-20deg);animation:shine 5s infinite}
@keyframes shine{0%{left:-100%}20%{left:200%}100%{left:200%}}
</style>
