<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Taglines {
  label: string;
  url: string;
}

const taglines: Taglines[] = [
  {
    label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=visual_editor',
  },
  {
    label: 'Diagram live with teammates in Mermaid Chart',
    url: 'https://www.mermaidchart.com/landing?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=teams',
  },
  {
    label: 'Skip the rough draft with Mermaid AI in Mermaid Chart',
    url: 'https://www.mermaidchart.com/mermaid-ai?utm_source=mermaid_live_editor&utm_medium=banner_ad&utm_campaign=mermaid_ai',
  },
];

let index = ref(Math.floor(Math.random() * taglines.length));
onMounted(() => {
  setInterval(() => {
    index.value = (index.value + 1) % taglines.length;
  }, 60_000);
});
</script>

<template>
  <div class="mb-4 w-full top-bar bg-gradient-to-r from-[#bd34fe] to-[#ff3670] flex p-1">
    <p class="w-full tracking-wide fade-text">
      <transition name="fade" mode="out-in">
        <a
          :key="index"
          href="{{ taglines[index].url }}"
          target="_blank"
          class="unstyled flex justify-center items-center gap-4 tracking-wide plausible-event-name=bannerClick"
        >
          <span class="text-primary-50 font-semibold">{{ taglines[index].label }}</span>
          <button
            class="rounded bg-[#111113] p-1 px-2 text-sm font-semibold tracking-wide text-white"
          >
            Try it now
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
