<script setup lang="ts">
import { type Ref, ref, onMounted } from 'vue';

interface Taglines {
  label: string;
  url: string;
}

const allTaglines: { [key: string]: { design: number; taglines: Taglines[] } } = {
  A: {
    design: 1,
    taglines: [
      {
        label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Chart',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_A',
      },
      {
        label: 'Diagram live with teammates in Mermaid Chart',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_A',
      },
      {
        label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_A',
      },
      {
        label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
        url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_A',
      },
    ],
  },
  B: {
    design: 2,
    taglines: [
      {
        label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Chart',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_B',
      },
      {
        label: 'Diagram live with teammates in Mermaid Chart',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_B',
      },
      {
        label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_B',
      },
      {
        label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
        url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_B',
      },
    ],
  },
  C: {
    design: 1,
    taglines: [
      {
        label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Pro',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_C',
      },
      {
        label: 'Diagram live with teammates in Mermaid Pro',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_C',
      },
      {
        label: 'Use the Visual Editor in Mermaid Pro to design and build diagrams',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_C',
      },
      {
        label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
        url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_A',
      },
    ],
  },
  D: {
    design: 2,
    taglines: [
      {
        label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Pro',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_D',
      },
      {
        label: 'Diagram live with teammates in Mermaid Pro',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_D',
      },
      {
        label: 'Use the Visual Editor in Mermaid Pro to design and build diagrams',
        url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_D',
      },
      {
        label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
        url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_B',
      },
    ],
  },
};

// Initialize with default values
const design: Ref<number> = ref(1);
const taglines: Ref<Taglines[]> = ref([]);
const index: Ref<number> = ref(0);

onMounted(() => {
  // Select a random variant on client side
  const variant =
    Object.values(allTaglines)[Math.floor(Math.random() * Object.values(allTaglines).length)];
  design.value = variant.design;
  taglines.value = variant.taglines;
  index.value = Math.floor(Math.random() * taglines.value.length);

  // Set up the interval for cycling through taglines
  setInterval(() => {
    index.value = (index.value + 1) % taglines.value.length;
  }, 5_000);
});
</script>

<template>
  <div
    :class="[design === 1 ? 'bg-gradient-to-r from-[#bd34fe] to-[#ff3670] ' : 'bg-[#E0095F]']"
    class="mb-4 w-full top-bar flex p-2"
  >
    <p class="w-full tracking-wide fade-text text-sm">
      <transition name="fade" mode="out-in">
        <a
          v-if="taglines.length > 0 && taglines[index]"
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
