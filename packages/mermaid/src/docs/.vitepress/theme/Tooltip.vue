<template>
  <div
    class="mermaid-chart-tooltip"
    :class="{ showing: isVisible, hiding: !isVisible }"
    :style="tooltipStyle"
  >
    <span class="mdi mdi-open-in-new"></span>
    Opens in mermaid.ai
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

const isVisible = ref(false);
const currentTarget = ref<HTMLElement | null>(null);
const tooltipStyle = ref({});

const showTooltip = (target: HTMLElement) => {
  currentTarget.value = target;
  const rect = target.getBoundingClientRect();
  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.bottom}px`,
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
    (target.matches('a[href*="mermaid.ai"]') || target.matches('button[onclick*="mermaid.ai"]')) &&
    !target.matches('.no-tooltip') &&
    !target.matches('.VPSocialLink')
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
  font-size: 0.75rem;
  font-weight: 400;
  pointer-events: none;
  z-index: 1000;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  margin-top: -0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.mermaid-chart-tooltip.showing {
  animation: tooltipFadeIn 0.3s ease 0.4s forwards;
}

.mermaid-chart-tooltip.hiding {
  animation: tooltipFadeOut 0.3s ease forwards;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 5px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
}

@keyframes tooltipFadeOut {
  from {
    opacity: 1;
    transform: translate(-50%, 10px);
  }
  to {
    opacity: 0;
    transform: translate(-50%, 5px);
  }
}
</style>
