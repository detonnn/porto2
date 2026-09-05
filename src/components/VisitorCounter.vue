<template>
  <div class="visitor-badge" :title="`${count ?? 0} total pengunjung`">
    <span class="dot"></span>
    <span class="visitor-badge__count">{{ displayCount }}</span>
    <span class="visitor-badge__label">visitors</span>
  </div>
</template>

<script>
export default {
  name: 'VisitorCounter',
  data() {
    return {
      count: null,
      pollTimer: null,
    };
  },
  computed: {
    displayCount() {
      if (this.count == null) return '—';
      const n = Number(this.count);
      return Number.isFinite(n) ? n.toLocaleString('id-ID') : '—';
    },
  },
  async mounted() {
    await this.registerVisit();
    // polling ringan buat kesan realtime (angka naik kalau ada visitor lain)
    this.pollTimer = setInterval(this.fetchCount, 10000);
  },
  beforeUnmount() {
    clearInterval(this.pollTimer);
  },
  methods: {
    async registerVisit() {
      try {
        const alreadyCounted = localStorage.getItem('porto2_visited');
        if (!alreadyCounted) {
          const res = await fetch('/api/visitors', { method: 'POST' });
          if (!res.ok) throw new Error(`POST /api/visitors failed: ${res.status}`);
          const data = await res.json();
          if (Number.isFinite(Number(data.count))) this.count = Number(data.count);
          // cuma di-mark "udah dihitung" kalau request-nya beneran sukses,
          // biar kalau API sempet error, visit-nya kehitung pas API udah sehat lagi
          localStorage.setItem('porto2_visited', '1');
        } else {
          await this.fetchCount();
        }
      } catch (e) {
        // jangan sampe error di sini nge-break web utamanya
        if (!Number.isFinite(Number(this.count))) this.count = 0;
      }
    },
    async fetchCount() {
      try {
        const res = await fetch('/api/visitors');
        if (!res.ok) return;
        const data = await res.json();
        if (Number.isFinite(Number(data.count))) this.count = Number(data.count);
      } catch (e) {
        // diemin aja, biarin badge tetep nampilin angka terakhir
      }
    },
  },
};
</script>

<style scoped>
.visitor-badge {
  position: fixed;
  /* mobile: taro di pojok kiri BAWAH, karena bagian atas udah penuh
     (hero text & now-playing widget), dan chatbot-widget udah ambil kanan bawah */
  bottom: 16px;
  left: 12px;
  top: auto;
  height: auto;
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  font-size: var(--smaller-font-size);
  color: var(--text-dim);
  padding: .3rem .6rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--bg-elev);
  box-shadow: 0 4px 14px rgba(0,0,0,.35);
  z-index: calc(var(--z-fixed) + 1);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

/* dulu di desktop ini pindah ke top:0/left:1rem sejajar navbar,
   tapi itu numpuk langsung sama .nav__logo (sama-sama nempel di
   left ~1rem). Jadi sekarang biarin tetep di pojok kiri BAWAH
   di semua ukuran layar biar gak nabrak navbar lagi. */

.visitor-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  animation: visitor-pulse 1.6s ease-in-out infinite;
  flex-shrink: 0;
}

.visitor-badge__count {
  color: var(--green);
  font-weight: 700;
}

.visitor-badge__label {
  display: none;
}

@keyframes visitor-pulse {
  50% {
    opacity: .4;
    transform: scale(.8);
  }
}

@media screen and (min-width: 768px) {
  .visitor-badge__label {
    display: inline;
  }
}
</style>
