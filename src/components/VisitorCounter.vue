<template>
  <div class="visitor-badge" :title="`${count ?? 0} total pengunjung`">
    <span class="visitor-badge__label">Visited by</span>
    <span class="visitor-badge__count">{{ displayCount }}</span>
    <span class="visitor-badge__label">people</span>
  </div>
</template>ub

<script>
export default {
  name: "VisitorCounter",
  data() {
    return {
      count: null,
      pollTimer: null,
    };
  },
  computed: {
    displayCount() {
      if (this.count == null) return "—";
      const n = Number(this.count);
      return Number.isFinite(n) ? n.toLocaleString("id-ID") : "—";
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
        const alreadyCounted = localStorage.getItem("porto2_visited");
        if (!alreadyCounted) {
          const res = await fetch("/api/visitors", { method: "POST" });
          if (!res.ok)
            throw new Error(`POST /api/visitors failed: ${res.status}`);
          const data = await res.json();
          if (Number.isFinite(Number(data.count)))
            this.count = Number(data.count);
          // cuma di-mark "udah dihitung" kalau request-nya beneran sukses,
          // biar kalau API sempet error, visit-nya kehitung pas API udah sehat lagi
          localStorage.setItem("porto2_visited", "1");
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
        const res = await fetch("/api/visitors");
        if (!res.ok) return;
        const data = await res.json();
        if (Number.isFinite(Number(data.count)))
          this.count = Number(data.count);
      } catch (e) {
        // diemin aja, biarin badge tetep nampilin angka terakhir
      }
    },
  },
};
</script>

<style scoped>
.visitor-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--smaller-font-size);
  color: var(--text-faint);
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  user-select: none;
  white-space: nowrap;
}

.visitor-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 6px var(--green);
  flex-shrink: 0;
}

.visitor-badge__count {
  color: var(--green);
  font-weight: 700;
}

.visitor-badge__label {
  display: inline;
}
</style>
