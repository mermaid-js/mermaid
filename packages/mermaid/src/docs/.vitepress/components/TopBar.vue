<script setup lang="ts">
import { useRoute } from 'vitepress';
import { computed, onMounted, onUnmounted, type Ref, ref } from 'vue';
import { trackPlausibleEvent } from '../theme/plausible.js';
import {
  createProductHuntBannerDismissals,
  getProductHuntBanner,
  getProductHuntBannerPhase,
  type ProductHuntBannerPhase,
} from '../theme/productHuntBanner.js';

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
const isInitialized: Ref<boolean> = ref(false);
const route = useRoute();

const isHomePage = computed(() => {
  return route.path === '/';
});

const getUtmSource = () => {
  const isMermaidAi = window?.location.hostname.endsWith('mermaid.ai');
  return isMermaidAi ? 'ai_open_source' : 'mermaid_js';
};

const currentUrl = computed(() => {
  const params = new URLSearchParams({
    utm_medium: 'banner_ad',
    utm_campaign: taglines[index.value].campaign,
    utm_source: getUtmSource(),
    ...taglines[index.value].params,
  });
  return `https://mermaid.ai/app/user/billing/checkout?${params.toString()}`;
});

// The Mermaid Flow Product Hunt banner temporarily replaces the regular one:
// pre-launch until the launch starts, then the launch banner for launch day.
const PRODUCT_HUNT_PHASE_CHECK_INTERVAL_MS = 30_000;
const productHuntPhase: Ref<ProductHuntBannerPhase | undefined> = ref();
const productHuntDismissals = createProductHuntBannerDismissals(() => localStorage);
let productHuntPhaseInterval: ReturnType<typeof setInterval> | undefined;

const productHuntBanner = computed(() => {
  return productHuntPhase.value
    ? getProductHuntBanner(productHuntPhase.value, getUtmSource())
    : undefined;
});

const updateProductHuntPhase = () => {
  const phase = getProductHuntBannerPhase(new Date());
  productHuntPhase.value = phase && !productHuntDismissals.isDismissed(phase) ? phase : undefined;
};

const trackProductHuntBanner = (event: 'bannerClick' | 'bannerClose') => {
  if (!productHuntPhase.value) {
    return;
  }
  void trackPlausibleEvent(event, {
    props: { banner: `product-hunt-${productHuntPhase.value}` },
  });
};

const closeProductHuntBanner = () => {
  if (!productHuntPhase.value) {
    return;
  }
  trackProductHuntBanner('bannerClose');
  productHuntDismissals.dismiss(productHuntPhase.value);
  productHuntPhase.value = undefined;
};

onUnmounted(() => {
  clearInterval(productHuntPhaseInterval);
});

onMounted(() => {
  index.value = Math.floor(Math.random() * taglines.length);
  isInitialized.value = true;

  updateProductHuntPhase();
  // Swap pre-launch for launch (and back to the regular banner) on pages left open.
  productHuntPhaseInterval = setInterval(
    updateProductHuntPhase,
    PRODUCT_HUNT_PHASE_CHECK_INTERVAL_MS
  );

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
    v-if="productHuntBanner"
    class="mb-4 w-full top-bar flex items-center p-2 bg-[#ff6154]"
    data-testid="product-hunt-banner"
    :data-phase="productHuntPhase"
  >
    <p class="w-full tracking-wide" :class="isHomePage ? 'text-lg' : 'text-sm'">
      <a
        :href="productHuntBanner.href"
        target="_blank"
        rel="noopener"
        class="unstyled flex justify-center items-center gap-4 no-tooltip text-white tracking-wide"
        @click="trackProductHuntBanner('bannerClick')"
      >
        <span>
          <span class="font-semibold">{{ productHuntBanner.headline }}</span>
          <span class="hidden lg:inline">&nbsp;{{ productHuntBanner.tagline }}</span>
        </span>
        <span
          class="bg-white text-[#ff6154] shrink-0 rounded-lg p-1.5 px-4 font-semibold tracking-wide"
        >
          {{ productHuntBanner.button }} →
        </span>
      </a>
    </p>
    <button
      type="button"
      aria-label="Dismiss banner"
      title="Dismiss banner"
      class="shrink-0 px-2 text-white text-xl leading-none"
      @click="closeProductHuntBanner"
    >
      ×
    </button>
  </div>
  <div
    v-else-if="isInitialized"
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
