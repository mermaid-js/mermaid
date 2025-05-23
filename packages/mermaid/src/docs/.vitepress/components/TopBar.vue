<script setup lang="ts">
import { onMounted, type Ref, ref } from 'vue';

interface Taglines {
  label: string;
  url: string;
}

const taglines: Taglines[] = [
  {
    label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Chart',
    url: 'https://www.mermaidchart.com/mermaid-ai?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=aibundle',
  },
  {
    label: 'Diagram live with teammates in Mermaid Chart',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=team_collaboration',
  },
];

const randomTagLines: Taglines[] = [
  {
    label: "Customize your layout and design in Mermaid Chart's whiteboard!",
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard',
  },
  {
    label: "Customize your layout and design in Mermaid Chart's visual editor!",
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor',
  },
  {
    label: "Customize your layout and design with Mermaid Chart's GUI!",
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=gui',
  },
  {
    label: 'Customize your layout and design in Mermaid Chart!',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_whiteboard_gui',
  },
];

const index: Ref<number> = ref(0);
const currentBannerSet: Ref<Taglines[]> = ref(taglines);
const isPaused: Ref<boolean> = ref(false);

onMounted(() => {
  const newIndex = Math.floor(Math.random() * randomTagLines.length);
  currentBannerSet.value = [...taglines, randomTagLines[newIndex]];
  index.value = Math.floor(Math.random() * currentBannerSet.value.length);
  setInterval(() => {
    if (isPaused.value) {
      return;
    }
    index.value = (index.value + 1) % currentBannerSet.value.length;
  }, 5_000);
});
</script>

<template>
  <div
    class="mb-4 w-full top-bar flex p-2 bg-[#E0095F]"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <p class="w-full tracking-wide fade-text text-sm">
      <transition name="fade" mode="out-in">
        <a
          :key="index"
          :href="currentBannerSet[index].url"
          target="_blank"
          class="unstyled flex justify-center items-center gap-4 text-white no-tooltip tracking-wide plausible-event-name=bannerClick"
        >
          <span class="font-semibold">{{ currentBannerSet[index].label }}</span>
          <button class="bg-[#1E1A2E] shrink-0 rounded-lg p-1.5 px-4 font-semibold tracking-wide">
            Try now
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
