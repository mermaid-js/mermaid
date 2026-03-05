<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, onMounted, type Ref, ref } from 'vue';

interface Taglines {
  label: string;
  campaign: string;
  button: string;
}

const taglines: Taglines[] = [
  {
    label: 'Use code NEWYEAR for 10% off Mermaid Advanced Editor (limited time)',
    campaign: 'variant_a',
    button: 'Try now',
  },
  {
    label: 'Limited time: 10% off Mermaid Advanced Editor with code NEWYEAR',
    campaign: 'variant_b',
    button: 'Claim Discount',
  },
  {
    label: 'Try Mermaid Advanced Editor — get 10% off with code NEWYEAR',
    campaign: 'variant_c',
    button: 'Get started',
  },
];

const isRotationEnabled = false;
const index: Ref<number> = ref(0);
const isPaused: Ref<boolean> = ref(false);
const isInitialized: Ref<boolean> = ref(false);
const route = useRoute();

const isHomePage = computed(() => {
  return route.path === '/';
});

const currentUrl = computed(() => {
  const isMermaidAi = window?.location.hostname.endsWith('mermaid.ai');
  const params = new URLSearchParams({
    utm_medium: 'banner_ad',
    utm_campaign: taglines[index.value].campaign,
    utm_source: isMermaidAi ? 'ai_open_source' : 'mermaid_js',
  });
  return `https://mermaid.ai/?${params.toString()}`;
});

onMounted(() => {
  index.value = Math.floor(Math.random() * taglines.length);
  isInitialized.value = true;

  if (isRotationEnabled) {
    setInterval(() => {
      if (isPaused.value) {
        return;
      }
      index.value = (index.value + 1) % taglines.length;
    }, 5_000);
  }
});
</script>

<template>
  <div
    v-if="isInitialized"
    class="mb-4 w-full top-bar flex p-2 bg-[#E0095F]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <p class="w-full tracking-wide fade-text" :class="isHomePage ? 'text-lg' : 'text-sm'">
      <transition name="fade" mode="out-in">
        <a
          :key="index"
          :href="currentUrl"
          target="_blank"
          class="unstyled flex justify-center items-center gap-4 no-tooltip text-white tracking-wide plausible-event-name=bannerClick"
        >
          <span class="font-semibold">{{ taglines[index].label }}</span>
          <button
            class="bg-[#1E1A2E] shrink-0 rounded-lg p-1.5 px-4 font-semibold tracking-wide"
            :class="isHomePage ? 'text-lg' : 'text-sm'"
          >
            {{ taglines[index].button }}
          </button>
        </a>
      </transition>
    </p>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
