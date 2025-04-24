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
import { ref, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);
const currentTarget = ref<HTMLElement | null>(null);
const tooltipStyle = ref({});

const showTooltip = (target: HTMLElement) => {
  currentTarget.value = target;
  const rect = target.getBoundingClientRect();
  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top}px`,
  };
  isVisible.value = true;
};

const hideTooltip = () => {
  currentTarget.value = null;
  isVisible.value = false;
};

const handleMouseOver = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    target.matches('a[href*="mermaidchart.com"]') ||
    target.matches('button[onclick*="mermaidchart.com"]')
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
  padding: 0.3rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  pointer-events: none;
  z-index: 1000;
  text-align: center;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  transform: translate(-50%, -90%);
  margin-top: -0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.mermaid-chart-tooltip.visible {
  opacity: 1;
  transform: translate(-50%, -100%);
}
</style>
