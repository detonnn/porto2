<template>
    <section class="skills section" id="skills">
        <h2 class="section__title">{{ skills.title }}</h2>
        <span class="section__subtitle">{{ skills.subtitle }}</span>

        <div class="skills_container stkC container">
            <StackConveyor :items="items" :eyebrow="skills.eyebrow" :heading="skills.heading"
                :caption="skills.caption" :speed="24" :interval="3200">
                <template #tabs>
                    <div class="stkTabs" role="tablist" aria-label="Stack categories">
                        <button v-for="(g, gi) in skills.groups" :key="gi" type="button" role="tab" class="stkTab"
                            :class="{ on: gi === tab }" :aria-selected="gi === tab" @click="tab = gi">
                            <i class="uil" :class="g.icon"></i>
                            <span>~/{{ g.tab }}</span>
                            <small>{{ g.subtitle }}</small>
                        </button>
                    </div>
                </template>
            </StackConveyor>
        </div>
    </section>
</template>

<script>
import data from '../../data/portfolio.json'
import StackConveyor from '../../components/StackConveyor.vue'

export default {
    name: 'Skills',
    components: { StackConveyor },
    data() {
        return { skills: data.skills, tab: 0 }
    },
    computed: {
        items() {
            const g = this.skills.groups[this.tab]
            return g.items.map((it) => ({
                id: g.tab + '-' + (it.short || it.name),
                name: it.short || it.name,
                description: it.desc,
                icon: it.icon,
            }))
        },
    },
}
</script>

<style>
.skills .skills_container.stkC { max-width: 1100px; }
.stkTabs { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; margin: 1rem 0 .25rem; }
.stkTab { display: inline-flex; align-items: center; gap: .4rem; padding: .45rem .8rem; border-radius: 999px; cursor: pointer; font: inherit; font-size: .8rem; font-weight: 600;
    color: var(--text-dim); background: var(--bg-elev, var(--bg-window)); border: 1px solid var(--border); transition: color .2s, border-color .2s, background .2s; }
.stkTab small { display: none; font-weight: 400; font-size: .68rem; color: var(--text-faint); }
@media (min-width: 768px) { .stkTab small { display: inline; } }
.stkTab:hover { color: var(--text); }
.stkTab.on { color: var(--bg-window); background: var(--text); border-color: var(--text); }
.stkTab.on small { color: var(--bg-window); opacity: .7; }
.stkTab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (min-width: 820px) { .stkTabs { justify-content: flex-start; } }
</style>
