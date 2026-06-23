<script setup lang="ts">
interface Props {
  count?: number
  height?: string
}

withDefaults(defineProps<Props>(), {
  count: 1,
  height: '100px'
})
</script>

<template>
  <div class="claude-skeleton-container" role="status" aria-live="polite" aria-label="正在加载">
    <div
      v-for="i in count"
      :key="i"
      class="claude-skeleton"
      :style="{ height, marginBottom: i < count ? 'var(--claude-space-2)' : '0' }"
      :aria-hidden="true"
    />
    <span class="claude-sr-only">正在加载内容...</span>
  </div>
</template>

<style scoped>
.claude-skeleton-container {
  width: 100%;
}

.claude-skeleton {
  width: 100%;
  border-radius: var(--claude-radius-comfortable);
  background: linear-gradient(
    90deg,
    var(--claude-warm-sand) 25%,
    var(--claude-border-cream) 50%,
    var(--claude-warm-sand) 75%
  );
  background-size: 200% 100%;
  animation: claude-skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes claude-skeleton-pulse {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .claude-skeleton {
    animation: none;
    background-color: var(--claude-warm-sand);
  }
}
</style>
