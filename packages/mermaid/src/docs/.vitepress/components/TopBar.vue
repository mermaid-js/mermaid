<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { namespace } from '../../../../dist/diagrams/state/stateDb';

interface Taglines {
  name: string;
  design: string;
  label: string;
  url: string;
}

const allTaglines: Taglines[] = [
  {
    name: 'A AI Bundle',
    design: '1',
    label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Chart',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_A',
  },
  {
    name: 'B AI Bundle',
    design: '2',
    label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Chart',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_B',
  },
  {
    name: 'C AI Bundle',
    design: '1',
    label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Pro',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_C',
  },
  {
    name: 'D AI Bundle',
    design: '2',
    label: 'Replace ChatGPT Pro, Mermaid.live, and Lucid Chart with Mermaid Pro',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=AIbundle_D',
  },
  {
    name: 'A Teams',
    design: '1',
    label: 'Diagram live with teammates in Mermaid Chart',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_A',
  },
  {
    name: 'B Teams',
    design: '2',
    label: 'Diagram live with teammates in Mermaid Chart',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_B',
  },
  {
    name: 'C Teams',
    design: '1',
    label: 'Diagram live with teammates in Mermaid Pro',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_C',
  },
  {
    name: 'D Teams',
    design: '2',
    label: 'Diagram live with teammates in Mermaid Pro',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=teams_D',
  },
  {
    name: 'A Visual Editor',
    design: '1',
    label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_A',
  },
  {
    name: 'B Visual Editor',
    design: '2',
    label: 'Use the Visual Editor in Mermaid Chart to design and build diagrams',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_B',
  },
  {
    name: 'C Visual Editor',
    design: '1',
    label: 'Use the Visual Editor in Mermaid Pro to design and build diagrams',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_C',
  },
  {
    name: 'D Visual Editor',
    design: '2',
    label: 'Use the Visual Editor in Mermaid Pro to design and build diagrams',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=visual_editor_D',
  },
  {
    name: 'A Whiteboard',
    design: '1',
    label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_A',
  },
  {
    name: 'B Whiteboard',
    design: '2',
    label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_A',
  },
  {
    name: 'C Whiteboard',
    design: '1',
    label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
    url: 'https://www.mermaidchart.com/whiteboard?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_B',
  },
  {
    name: 'D Whiteboard',
    design: '2',
    label: 'Explore the Mermaid Whiteboard from the creators of Mermaid',
    url: 'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=banner_ad&utm_campaign=whiteboard_B',
  },
];

const groups = ['A', 'B', 'C', 'D'];
const selectedGroup = groups[Math.floor(Math.random() * groups.length)];
const taglines = allTaglines.filter((tagline) => tagline.name.startsWith(selectedGroup));

let index = ref(Math.floor(Math.random() * taglines.length));
onMounted(() => {
  setInterval(() => {
    index.value = (index.value + 1) % taglines.length;
  }, 5_000);
});

const currentDesign = computed(() => {
  const designMap: { [key: string]: string } = {
    '1': 'bg-gradient-to-r from-[#bd34fe] to-[#ff3670] ',
    '2': 'bg-[#2E2183]',
  };
  return designMap[taglines[index.value].design];
});

const buttonClass = computed(() => {
  return taglines[index.value].design === '1' ? 'bg-[#2E2183]' : 'bg-[#E0095F]';
});
</script>

<template>
  <div :class="[currentDesign]" class="mb-4 w-full top-bar flex p-2">
    <p class="w-full tracking-wide fade-text">
      <transition name="fade" mode="out-in">
        <a
          :key="index"
          :href="taglines[index].url"
          target="_blank"
          class="unstyled flex justify-center items-center gap-4 text-white tracking-wide plausible-event-name=bannerClick"
        >
          <span class="font-semibold">{{ taglines[index].label }}</span>
          <button :class="['rounded-lg p-1.5 px-4 font-semibold tracking-wide', buttonClass]">
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
