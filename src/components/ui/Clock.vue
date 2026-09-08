<template>
  <div class="clock-container">
    <div class="digit-wrapper">
      <transition name="slide" mode="out-in">
        <span :key="hours" class="digit">{{ hours.toString().padStart(2, '0') }}</span>
      </transition>
    </div>
    <span class="separator">:</span>
    <div class="digit-wrapper">
      <transition name="slide" mode="out-in">
        <span :key="minutes" class="digit">{{ minutes.toString().padStart(2, '0') }}</span>
      </transition>
    </div>
    <span class="separator">:</span>
    <div class="digit-wrapper">
      <transition name="slide" mode="out-in">
        <span :key="seconds" class="digit">{{ seconds.toString().padStart(2, '0') }}</span>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Clock',
  data() {
    return {
      hours: new Date().getHours(),
      minutes: new Date().getMinutes(),
      seconds: new Date().getSeconds(),
    };
  },
  mounted() {
    this.interval = setInterval(() => {
      const now = new Date();
      this.hours = now.getHours();
      this.minutes = now.getMinutes();
      this.seconds = now.getSeconds();
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.interval);
  },
};
</script>

<style scoped>
.clock-container {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  font-family: ui-monospace, monospace;
}

.digit-wrapper {
  position: relative;
  display: inline-block;
  overflow: hidden;
  height: 1.2em;
}

.digit {
  display: inline-block;
  font-variant-numeric: tabular-nums;
}

.separator {
  color: #71717a;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-enter-from {
  transform: translateY(-100%);
}

.slide-leave-to {
  transform: translateY(100%);
}
</style>
