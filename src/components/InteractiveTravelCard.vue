<template>
  <div
    ref="cardRef"
    class="tilt-card"
    :class="className"
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
      raf: null,
    };
  },
  computed: {
    cardStyle() {
      return {
        transform: `perspective(1000px) rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg)`,
      };
    },
  },
  methods: {
    handleMouseMove(e) {
      const rect = this.$refs.cardRef.getBoundingClientRect();
      const xPct = (e.clientX - rect.left) / rect.width - 0.5;
      const yPct = (e.clientY - rect.top) / rect.height - 0.5;
      this.targetY = xPct * 14;
      this.targetX = yPct * -14;
      this.startLoop();
    },
    handleMouseLeave() {
      this.targetX = 0;
      this.targetY = 0;
      this.startLoop();
    },
    startLoop() {
      if (this.raf) return;
      const step = () => {
        this.rotateX += (this.targetX - this.rotateX) * 0.12;
        this.rotateY += (this.targetY - this.rotateY) * 0.12;
        const done =
          Math.abs(this.targetX - this.rotateX) < 0.05 &&
          Math.abs(this.targetY - this.rotateY) < 0.05;
        if (done) {
          this.rotateX = this.targetX;
          this.rotateY = this.targetY;
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
  border-radius: 1rem;
  overflow: hidden;
  will-change: transform;
}

.tilt-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: inherit;
}
</style>
