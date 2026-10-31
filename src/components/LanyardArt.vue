<template>
  <svg
    v-if="type === 'ornament'"
    viewBox="-100 -100 200 200"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    aria-hidden="true"
  >
    <circle r="96" />
    <circle r="86" />
    <circle r="60" />
    <circle r="25" />
    <ellipse
      v-for="a in ring"
      :key="a"
      cx="0"
      cy="-73"
      rx="6.5"
      ry="12"
      :transform="'rotate(' + a + ')'"
    />
    <circle
      v-for="a in ring"
      :key="'d' + a"
      cx="0"
      cy="-91"
      r="1.8"
      fill="currentColor"
      :transform="'rotate(' + (a + 11.25) + ')'"
    />
    <path
      v-for="i in 8"
      :key="'p' + i"
      d="M0 -25 C 12 -38, 10 -50, 0 -58 C -10 -50, -12 -38, 0 -25"
      :transform="'rotate(' + (i - 1) * 45 + ')'"
    />
    <circle r="6" fill="currentColor" />
  </svg>
  <svg
    v-else
    viewBox="0 0 20 200"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    aria-hidden="true"
  >
    <path
      d="M10 4 L10 196 M3 18 L10 4 L17 18 M4 182 L10 170 L16 182 M4 194 L10 182 L16 194"
    />
  </svg>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'ornament' },
})

const ring = Array.from({ length: 16 }, (_, i) => i * 22.5)
</script>
