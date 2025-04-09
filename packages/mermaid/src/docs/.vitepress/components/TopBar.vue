<script setup lang="ts">
import { type Ref, ref, onMounted } from 'vue';

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
  {
    label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor',
  },
  {
    label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard',
  },
];

const index: Ref<number> = ref(0);

onMounted(() => {
  index.value = Math.floor(Math.random() * taglines.length);
  setInterval(() => {
    index.value = (index.value + 1) % taglines.length;
  }, 5_000);
});
</script>

<template>
  <div class="mb-4 w-full top-bar flex p-2 bg-[#E0095F]">
    <p class="w-full tracking-wide fade-text text-sm">
      <transition name="fade" mode="out-in">
        <a
          :key="index"
          :href="taglines[index].url"
          target="_blank"
          class="unstyled flex justify-center items-center gap-4 text-white tracking-wide plausible-event-name=bannerClick"
        >
          <span class="font-semibold">{{ taglines[index].label }}</span>
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
