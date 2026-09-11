<template>
  <div
    ref="cardRef"
    class="tilt-card"
    :class="className"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :style="cardStyle"
  >
    <slot>
      <img
        :src="imageUrl"
        :alt="`${title}, ${subtitle}`"
        class="tilt-card__img"
      />
      <img
        v-if="revealImageUrl"
        :src="revealImageUrl"
        alt=""
        aria-hidden="true"
        class="tilt-card__img tilt-card__img--reveal"
        :class="{ 'is-revealed': isRevealed }"
      />
      <div v-if="revealImageUrl" class="tilt-card__pixels" aria-hidden="true">
        <span
          v-for="i in pixelCount"
          :key="i"
          class="tilt-card__pixel"
          :class="{ 'is-visible': pixelsVisible }"
          :style="pixelStyle(i - 1)"
        ></span>
      </div>
    </slot>

    <div class="tilt-card__shimmer"></div>

    <div class="tilt-card__spotlight" :style="{ opacity: isHovered ? 1 : 0 }">
      <div
        class="tilt-card__spotlight-glow"
        :style="{ left: spotlightPos.x + '%', top: spotlightPos.y + '%' }"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InteractiveTravelCard",
  props: {
    imageUrl: { type: String, required: false },
    revealImageUrl: { type: String, required: false, default: "" },
    gridSize: { type: Number, default: 15 },
    pixelColor: { type: String, default: "#ffffff" },
    stepDuration: { type: Number, default: 0.3 },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    className: { type: String, default: "" },
  },
  data() {
    return {
      rotateX: 0,
      rotateY: 0,
      targetX: 0,
      targetY: 0,
      scale: 1,
      targetScale: 1,
      raf: null,
      spotlightPos: { x: 50, y: 50 },
      isHovered: false,
      isRevealed: false,
      pixelsVisible: false,
      pixelDelays: [],
    };
  },
  created() {
    this.revealTimeouts = [];
    this.revealGeneration = 0;
  },
  computed: {
    cardStyle() {
      return {
        transform: `perspective(1000px) rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg) scale(${this.scale})`,
      };
    },
    pixelCount() {
      return this.gridSize * this.gridSize;
    },
  },
  methods: {
    pixelStyle(index) {
      const size = 100 / this.gridSize;
      const row = Math.floor(index / this.gridSize);
      const col = index % this.gridSize;
      return {
        backgroundColor: this.pixelColor,
        width: `${size}%`,
        height: `${size}%`,
        left: `${col * size}%`,
        top: `${row * size}%`,
        transitionDelay: `${this.pixelDelays[index] || 0}s`,
      };
    },
    shuffledDelays() {
      const n = this.pixelCount;
      const order = [...Array(n).keys()];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const step = this.stepDuration / n;
      const delays = new Array(n).fill(0);
      order.forEach((originalIndex, position) => {
        delays[originalIndex] = position * step;
      });
      return delays;
    },
    clearRevealTimeouts() {
      this.revealTimeouts.forEach(clearTimeout);
      this.revealTimeouts = [];
    },
    runReveal(activate) {
      if (!this.revealImageUrl) return;
      this.clearRevealTimeouts();
      const gen = ++this.revealGeneration;
      this.pixelDelays = this.shuffledDelays();
      requestAnimationFrame(() => {
        if (gen === this.revealGeneration) this.pixelsVisible = true;
      });
      this.revealTimeouts.push(
        setTimeout(() => {
          if (gen !== this.revealGeneration) return;
          this.isRevealed = activate;
          this.pixelsVisible = false;
        }, this.stepDuration * 1000),
      );
    },
    handleMouseEnter() {
      this.isHovered = true;
      this.targetScale = 1.03;
      this.startLoop();
      this.runReveal(true);
    },
    handleMouseMove(e) {
      const rect = this.$refs.cardRef.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      this.targetY = xPct * 14;
      this.targetX = yPct * -14;
      this.spotlightPos = {
        x: (xPct + 0.5) * 100,
        y: (yPct + 0.5) * 100,
      };
      this.startLoop();
    },
    handleMouseLeave() {
      this.targetX = 0;
      this.targetY = 0;
      this.targetScale = 1;
      this.isHovered = false;
      this.startLoop();
      this.runReveal(false);
    },
    startLoop() {
      if (this.raf) return;
      const step = () => {
        this.rotateX += (this.targetX - this.rotateX) * 0.12;
        this.rotateY += (this.targetY - this.rotateY) * 0.12;
        this.scale += (this.targetScale - this.scale) * 0.12;
        const done =
          Math.abs(this.targetX - this.rotateX) < 0.05 &&
          Math.abs(this.targetY - this.rotateY) < 0.05 &&
          Math.abs(this.targetScale - this.scale) < 0.001;
        if (done) {
          this.rotateX = this.targetX;
          this.rotateY = this.targetY;
          this.scale = this.targetScale;
          this.raf = null;
          return;
        }
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    },
  },
  beforeUnmount() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.clearRevealTimeouts();
  },
};
</script>

<style scoped>
.tilt-card {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  will-change: transform;
  transition: box-shadow 0.3s;
}

.tilt-card:hover {
  box-shadow: 0 14px 32px -10px rgba(0, 0, 0, 0.35),
    0 0 0 1px var(--accent-glow);
}

.tilt-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: inherit;
  transition: filter 0.4s ease;
}

.tilt-card:hover .tilt-card__img {
  filter: none;
}

.tilt-card__img--reveal {
  position: absolute;
  inset: 0;
  opacity: 0;
  z-index: 2;
  transition: opacity 0.15s ease;
}

.tilt-card__img--reveal.is-revealed {
  opacity: 1;
}

.tilt-card__pixels {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.tilt-card__pixel {
  position: absolute;
  opacity: 0;
  transition: opacity 0s;
}

.tilt-card__pixel.is-visible {
  opacity: 1;
}

.tilt-card__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    var(--shine-color, rgba(255, 255, 255, 0.35)),
    transparent
  );
  transform: skewX(-20deg);
  animation: cardShine 5s infinite;
}

@keyframes cardShine {
  0% {
    left: -100%;
  }
  20% {
    left: 200%;
  }
  100% {
    left: 200%;
  }
}

.tilt-card__spotlight {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s;
}

.tilt-card__spotlight-glow {
  position: absolute;
  width: 200%;
  height: 200%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 40%);
}
</style>
