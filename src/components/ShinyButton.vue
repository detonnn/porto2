<template>
  <a
    v-bind="$attrs"
    class="shiny-btn"
  >
    <!-- Background shimmer line -->
    <span class="shiny-btn__shimmer"></span>
    <!-- Button Label -->
    <span class="shiny-btn__label">
      <slot />
    </span>
  </a>
</template>

<script>
export default {
  name: 'ShinyButton'
}
</script>

<style scoped>
.shiny-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0.65rem 1.5rem;
  border-radius: 8px;
  font-size: var(--small-font-size, 0.85rem);
  font-weight: var(--font-medium, 500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-window);
  border: 1px solid var(--border);
  color: var(--green);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.shiny-btn:hover {
  border-color: var(--green);
  box-shadow: 0 0 20px var(--accent-glow);
  transform: translateY(-2px);
}

.shiny-btn__label {
  position: relative;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.shiny-btn__shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  transform: skewX(-20deg);
  animation: shine 5s infinite;
}

@keyframes shine {
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
</style>
