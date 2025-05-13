<template>
  <div
    v-if="isVisible"
    class="mermaid-chart-tooltip"
    :class="{ visible: isVisible }"
    :style="tooltipStyle"
  >
    <span class="mdi mdi-open-in-new"></span>
    Opens in MermaidChart.com
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const isVisible = ref(false);
const currentTarget = ref<HTMLElement | null>(null);
const tooltipStyle = ref({});
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const showTooltip = (target: HTMLElement) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  showTimer = setTimeout(() => {
    currentTarget.value = target;
    const rect = target.getBoundingClientRect();
    tooltipStyle.value = {
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.bottom}px`,
    };
    isVisible.value = true;
  }, 400);
};

const hideTooltip = () => {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }

  hideTimer = setTimeout(() => {
    currentTarget.value = null;
    isVisible.value = false;
  }, 100);
};

const handleMouseOver = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target.matches('a[href*="try_playground"]') ||
    target.matches('button[onclick*="try_playground"]')
  ) {
    showTooltip(target);
  }
};

const handleMouseOut = (e: MouseEvent) => {
  if (!currentTarget.value?.contains(e.relatedTarget as HTMLElement)) {
    hideTooltip();
  }
};

onMounted(() => {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
});

onUnmounted(() => {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
});
</script>

<style>
.mermaid-chart-tooltip {
  position: fixed;
  background: black;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.65rem;
  font-weight: 400;
  pointer-events: none;
  z-index: 1000;
  text-align: center;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  transform: translate(-50%, 0);
  margin-top: -0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.mermaid-chart-tooltip.visible {
  opacity: 1;
  transform: translate(-50%, 30%);
}
</style>
