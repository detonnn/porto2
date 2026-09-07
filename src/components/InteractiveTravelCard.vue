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
    </slot>

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
    };
  },
  computed: {
    cardStyle() {
      return {
        transform: `perspective(1000px) rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg) scale(${this.scale})`,
      };
    },
  },
  methods: {
    handleMouseEnter() {
      this.isHovered = true;
      this.targetScale = 1.03;
      this.startLoop();
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
  box-shadow: 0 14px 32px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--accent-glow);
}

.tilt-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: inherit;
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
