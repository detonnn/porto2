<template>
  <div
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :style="cardStyle"
    :class="[
      'relative h-[26rem] w-80 rounded-2xl bg-transparent shadow-2xl border border-border/30 transition-transform duration-100 ease-out',
      className
    ]"
  >
    <div
      style="transform: translateZ(50px); transform-style: preserve-3d;"
      class="absolute inset-4 grid h-[calc(100%-2rem)] w-[calc(100%-2rem)] grid-rows-[1fr_auto] rounded-xl shadow-lg"
    >
      <!-- Background Image -->
      <img
        :src="imageUrl"
        :alt="`${title}, ${subtitle}`"
        class="absolute inset-0 h-full w-full rounded-xl object-cover"
      />
      
      <!-- Darkening overlay -->
      <div class="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      <!-- Card Content -->
      <div class="relative flex flex-col justify-between rounded-xl p-4 text-white">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h2 style="transform: translateZ(50px)" class="text-2xl font-bold">
              {{ title }}
            </h2>
            <p style="transform: translateZ(40px)" class="text-sm font-light text-white/80">
              {{ subtitle }}
            </p>
          </div>
          <a
            :href="href"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`Learn more about ${title}`"
            style="transform: translateZ(60px)"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-inset ring-white/30 transition-all hover:scale-110 hover:rotate-[2.5deg] hover:bg-white/30"
          >
            <i class="uil uil-arrow-up-right text-lg text-white"></i>
          </a>
        </div>

        <!-- Footer Button -->
        <button
          @click="onActionClick"
          style="transform: translateZ(40px)"
          class="w-full rounded-lg py-3 text-center font-semibold text-white transition-all hover:scale-105 active:scale-95 bg-white/10 backdrop-blur-md ring-1 ring-inset ring-white/20 hover:bg-white/20"
        >
          {{ actionText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InteractiveTravelCard",
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    imageUrl: { type: String, required: true },
    actionText: { type: String, required: true },
    href: { type: String, default: "#" },
    onActionClick: { type: Function, default: () => {} },
    className: { type: String, default: "" },
  },
  data() {
    return {
      rotateX: 0,
      rotateY: 0,
    };
  },
  computed: {
    cardStyle() {
      return {
        transform: `perspective(1000px) rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg)`,
        transformStyle: "preserve-3d",
      };
    },
  },
  methods: {
    handleMouseMove(e) {
      const rect = this.$refs.cardRef.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseXVal = e.clientX - rect.left;
      const mouseYVal = e.clientY - rect.top;
      const xPct = mouseXVal / width - 0.5;
      const yPct = mouseYVal / height - 0.5;

      this.rotateX = yPct * -21;
      this.rotateY = xPct * 21;
    },
    handleMouseLeave() {
      this.rotateX = 0;
      this.rotateY = 0;
    },
  },
};
</script>
