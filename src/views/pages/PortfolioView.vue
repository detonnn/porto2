<template>
  <section class="portfolio section" id="portfolio">
    <h2 class="section__title">{{ portfolio.title }}</h2>
    <span class="section__subtitle">{{ portfolio.subtitle }}</span>

    <div class="portofolio__container container">
      <div class="swipe-deck">
        <div
          v-for="(card, stackIndex) in visibleCards"
          :key="card._idx"
          class="swipe-card"
          :class="{ 'swipe-card--top': stackIndex === 0 }"
          :style="cardStyle(stackIndex)"
          @pointerdown="stackIndex === 0 && onPointerDown($event)"
        >
          <img
            :src="card.image"
            :alt="card.title"
            class="swipe-card__img"
            draggable="false"
          />

          <div
            class="swipe-card__data"
            :style="{ pointerEvents: dragging ? 'none' : 'auto' }"
          >
            <h3 class="portofolio__title">{{ card.title }}</h3>
            <p class="portofolio__description">{{ card.description }}</p>
            <a
              :href="card.url"
              target="_blank"
              rel="noopener"
              class="button button--flex button--small portofolio__button"
            >
              Demo
              <i class="uil uil-arrow-right button__icon"></i>
            </a>
          </div>

          <div
            v-if="stackIndex === 0"
            class="swipe-card__stamp swipe-card__stamp--next"
            :style="{ opacity: nextOpacity }"
          >
            NEXT
          </div>
          <div
            v-if="stackIndex === 0"
            class="swipe-card__stamp swipe-card__stamp--back"
            :style="{ opacity: backOpacity }"
          >
            BACK
          </div>
        </div>
      </div>
    </div>

    <div class="swipe-controls">
      <button
        type="button"
        class="swipe-btn"
        aria-label="Previous project"
        @click="triggerThrow('right')"
      >
        <i class="uil uil-angle-left-b swiper-portofolio-icon"></i>
      </button>

      <div class="swipe-dots">
        <span
          v-for="(item, i) in portfolio.items"
          :key="i"
          class="swipe-dot"
          :class="{ 'swipe-dot--active': i === activeIndex }"
        ></span>
      </div>

      <button
        type="button"
        class="swipe-btn"
        aria-label="Next project"
        @click="triggerThrow('left')"
      >
        <i class="uil uil-angle-right-b swiper-portofolio-icon"></i>
      </button>
    </div>
  </section>
</template>

<script>
import data from "../../data/portfolio.json";

export default {
  name: "Portfolio",
  data() {
    return {
      portfolio: data.portfolio,
      queue: data.portfolio.items.map((item, i) => ({ ...item, _idx: i })),
      dragging: false,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      throwing: null, // 'left' | 'right' | 'down' | null
      threshold: 110,
    };
  },
  computed: {
    visibleCards() {
      // top 3 cards of the deck, in stack order
      const n = Math.min(3, this.queue.length);
      return this.queue.slice(0, n);
    },
    activeIndex() {
      return this.queue[0] ? this.queue[0]._idx : 0;
    },
    nextOpacity() {
      if (this.throwing) return 0;
      return Math.min(Math.max(-this.deltaX / this.threshold, 0), 1);
    },
    backOpacity() {
      if (this.throwing) return 0;
      return Math.min(Math.max(this.deltaX / this.threshold, 0), 1);
    },
  },
  methods: {
    cardStyle(stackIndex) {
      if (stackIndex === 0) {
        let dx = 0,
          dy = 0,
          rotate = 0,
          opacity = 1,
          transition = "none";
        if (this.throwing) {
          if (this.throwing === "down") {
            // tombol < >: kartu jatuh lurus ke bawah, tanpa miring
            dy = 560;
            rotate = 0;
          } else {
            dx = this.throwing === "left" ? -520 : 520;
            rotate = this.throwing === "left" ? -18 : 18;
          }
          opacity = 0;
          transition = "transform 0.35s ease, opacity 0.35s ease";
        } else if (this.dragging) {
          dx = this.deltaX;
          dy = this.deltaY * 0.15;
          rotate = this.deltaX / 18;
          transition = "none";
        } else {
          transition = "transform 0.25s ease";
        }
        return {
          transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rotate}deg)`,
          opacity,
          transition,
          zIndex: 10,
          cursor: this.dragging ? "grabbing" : "grab",
        };
      }
      // stacked cards behind the top one — static, no transition (avoids weird cross-screen animation)
      const scale = 1 - stackIndex * 0.04;
      const offsetY = stackIndex * 10;
      return {
        transform: `translate3d(0, ${offsetY}px, 0) scale(${scale})`,
        opacity: 1 - stackIndex * 0.3,
        transition: "none",
        zIndex: 10 - stackIndex,
      };
    },
    onPointerDown(e) {
      // tekan mulai dari link/tombol = klik, bukan drag kartu
      if (e.target.closest("a, button")) return;
      this.dragging = true;
      this.throwing = null;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.deltaX = 0;
      this.deltaY = 0;
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointercancel", this.onPointerUp);
    },
    onPointerMove(e) {
      if (!this.dragging) return;
      this.deltaX = e.clientX - this.startX;
      this.deltaY = e.clientY - this.startY;
    },
    onPointerUp() {
      if (!this.dragging) return;
      this.dragging = false;
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerUp);

      if (this.deltaX <= -this.threshold) {
        this.commitThrow("left");
      } else if (this.deltaX >= this.threshold) {
        this.commitThrow("right");
      } else {
        // snap back
        this.deltaX = 0;
        this.deltaY = 0;
      }
    },
    triggerThrow(direction) {
      if (this.throwing || this.dragging) return;
      // arrow kanan = next (forward), kiri = back — sebelumnya kebalik
      this.commitThrowDown(direction === "right");
    },
    commitThrowDown(forward) {
      this.throwing = "down";
      setTimeout(() => {
        if (forward) {
          // forward: front card goes to the back of the deck
          this.queue.push(this.queue.shift());
        } else {
          // backward: last card comes back to the front
          this.queue.unshift(this.queue.pop());
        }
        this.throwing = null;
        this.deltaX = 0;
        this.deltaY = 0;
      }, 350);
    },
    commitThrow(direction) {
      this.throwing = direction;
      setTimeout(() => {
        if (direction === "left") {
          // forward: front card goes to the back of the deck
          this.queue.push(this.queue.shift());
        } else {
          // backward: last card comes back to the front
          this.queue.unshift(this.queue.pop());
        }
        this.throwing = null;
        this.deltaX = 0;
        this.deltaY = 0;
      }, 350);
    },
  },
};
</script>

<style scoped>
.swipe-deck {
  position: relative;
  width: 100%;
  max-width: 1000px;
  height: 440px;
  margin: 0 auto;
  touch-action: pan-y;
}

.swipe-card {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  background: var(--bg-window);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  will-change: transform, opacity;
  user-select: none;
  box-shadow: 0 18px 50px var(--shadow-color);
}

.swipe-card--top {
  cursor: grab;
}

.swipe-card__img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-bottom: 1px solid var(--border);
  filter: grayscale(0.2);
  pointer-events: none;
}

.swipe-card__data {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 0.6rem;
  overflow: hidden;
}

.swipe-card__data .portofolio__title {
  font-size: 1.35rem;
  line-height: 1.3;
}

.swipe-card__data .portofolio__description {
  font-size: 0.95rem;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.swipe-card__stamp {
  position: absolute;
  top: 1.2rem;
  padding: 0.2rem 0.7rem;
  border: 3px solid;
  border-radius: 6px;
  font-weight: var(--font-semi-bold);
  font-size: var(--small-font-size);
  letter-spacing: 0.08em;
  pointer-events: none;
}

.swipe-card__stamp--next {
  right: 1rem;
  color: var(--green);
  border-color: var(--green);
  transform: rotate(12deg);
}

.swipe-card__stamp--back {
  left: 1rem;
  color: var(--red);
  border-color: var(--red);
  transform: rotate(-12deg);
}

.swipe-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.2rem;
}

.swipe-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.swipe-dots {
  display: flex;
  gap: 0.4rem;
}

.swipe-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-dim);
}

.swipe-dot--active {
  background: var(--green);
}

@media screen and (min-width: 768px) {
  .swipe-deck {
    height: 460px;
  }
  .swipe-card {
    grid-template-columns: 1.15fr 1fr;
    align-items: stretch;
  }
  .swipe-card__img {
    height: 100%;
    min-height: 460px;
    border-bottom: none;
    border-right: 1px solid var(--border);
  }
  .swipe-card__data {
    padding: 2.5rem 2.2rem;
  }
  .swipe-card__data .portofolio__description {
    line-clamp: 6;
    -webkit-line-clamp: 6;
  }
}
</style>
