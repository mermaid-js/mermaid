<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, onMounted, type Ref, ref } from 'vue';

interface Taglines {
  label: string;
  campaign: string;
  button: string;
  params?: Record<string, string>;
}

const taglines: Taglines[] = [
  {
    label: 'Try Mermaid Advanced Editor — OSS users get 10% off with code JS26',
    campaign: 'oss_coupon',
    button: 'Get started',
    params: { coupon: 'arDfyFT8' },
  },
];

const isRotationEnabled = false;
const index: Ref<number> = ref(0);
const isPaused: Ref<boolean> = ref(false);
const isMermaidAi: Ref<boolean> = ref(false);
const route = useRoute();

const isHomePage = computed(() => {
  return route.path === '/';
});

const urlFor = (tagline: Taglines) => {
  const params = new URLSearchParams({
    utm_medium: 'banner_ad',
    utm_campaign: tagline.campaign,
    utm_source: isMermaidAi.value ? 'ai_open_source' : 'mermaid_js',
    ...tagline.params,
  });
  return `https://mermaid.ai/app/user/billing/checkout?${params.toString()}`;
};

onMounted(() => {
  isMermaidAi.value = window.location.hostname.endsWith('mermaid.ai');
  index.value = Math.floor(Math.random() * taglines.length);

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
  <!--
    The bar is rendered on the server and every tagline is stacked in the same grid cell, so the
    bar is as tall as its longest tagline from the start: neither showing the bar nor switching
    taglines moves the page below it.
  -->
  <div
    class="mb-4 w-full top-bar flex p-2 bg-[#E0095F]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <p class="w-full grid tracking-wide fade-text" :class="isHomePage ? 'text-lg' : 'text-sm'">
      <a
        v-for="(tagline, i) in taglines"
        :key="tagline.campaign"
        :href="urlFor(tagline)"
        target="_blank"
        class="tagline unstyled flex justify-center items-center gap-4 no-tooltip text-white tracking-wide plausible-event-name=bannerClick"
        :class="{ 'tagline-hidden': i !== index }"
      >
        <span class="font-semibold">{{ tagline.label }}</span>
        <button
          class="bg-[#1E1A2E] shrink-0 rounded-lg p-1.5 px-4 font-semibold tracking-wide"
          :class="isHomePage ? 'text-lg' : 'text-sm'"
        >
          {{ tagline.button }}
        </button>
      </a>
    </p>
  </div>
</template>

<style>
.top-bar .tagline {
  grid-area: 1 / 1;
  transition:
    opacity 1s,
    visibility 1s;
}
.top-bar .tagline-hidden {
  opacity: 0;
  visibility: hidden;
}
</style>
