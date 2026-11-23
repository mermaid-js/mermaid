<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, onMounted, type Ref, ref } from 'vue';
import { getTopBarBanner, type TopBarBanner } from '../theme/topBarBanner.js';

const banner: Ref<TopBarBanner | undefined> = ref();
const route = useRoute();

const isHomePage = computed(() => {
  return route.path === '/';
});

const getUtmSource = () => {
  const isMermaidAi = window?.location.hostname.endsWith('mermaid.ai');
  return isMermaidAi ? 'ai_open_source' : 'mermaid_js';
};

onMounted(() => {
  banner.value = getTopBarBanner(new Date(), getUtmSource());
});
</script>

<template>
  <div v-if="banner" class="mb-4 w-full top-bar flex p-2 bg-[#E0095F]">
    <p class="w-full tracking-wide" :class="isHomePage ? 'text-lg' : 'text-sm'">
      <a
        :href="banner.href"
        target="_blank"
        class="unstyled flex justify-center items-center gap-4 no-tooltip text-white tracking-wide plausible-event-name=bannerClick"
      >
        <span class="font-semibold">{{ banner.label }}</span>
        <span
          class="bg-[#1E1A2E] shrink-0 rounded-lg p-1.5 px-4 font-semibold tracking-wide"
          :class="isHomePage ? 'text-lg' : 'text-sm'"
        >
          {{ banner.button }}
        </span>
      </a>
    </p>
  </div>
</template>
