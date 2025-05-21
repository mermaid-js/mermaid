<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

interface Feature {
  iconUrl: string;
  featureName: string;
}

const featureColumns = ref<Feature[][]>([
  [
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-public.svg',
      featureName: 'Diagram stored in URL',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-terminal.svg',
      featureName: 'Code editor',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-whiteboard.svg',
      featureName: 'Whiteboard',
    },
  ],
  [
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-folder.svg',
      featureName: 'Storage',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-terminal.svg',
      featureName: 'Code editor',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-ai-diagrams.svg',
      featureName: 'AI diagram generator',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-whiteboard.svg',
      featureName: 'Whiteboard',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-group.svg',
      featureName: 'Teams',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-multi-user-editing.svg',
      featureName: 'Multi-user editing',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-ai-repair.svg',
      featureName: 'AI diagram repair',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-version-history.svg',
      featureName: 'Version history',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-comments.svg',
      featureName: 'Comments',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-presentations.svg',
      featureName: 'Presentations',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-plugins.svg',
      featureName: 'Advanced Plugins',
    },
  ],
  [
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-public.svg',
      featureName: 'Diagram stored in URL',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-terminal.svg',
      featureName: 'Code editor',
    },
    {
      iconUrl: 'https://static.mermaidchart.dev/assets/icon-how-to-reg.svg',
      featureName: 'Open source',
    },
  ],
]);

const isVisible = ref(false);

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    (target.tagName === 'A' && target.textContent?.trim() === 'Try Playground') ||
    (target.tagName === 'SPAN' && target.textContent?.trim() === '💻 Open Editor')
  ) {
    isVisible.value = !isVisible.value;
  }
};

onMounted(() => {
  document.addEventListener('click', handleMouseDown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleMouseDown);
});
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed top-0 left-0 z-20 flex h-screen w-screen backdrop-blur-sm items-center justify-center"
    @click.self="isVisible = false"
  >
    <div v-if="isVisible" class="flex flex-row relative top-[8%] gap-4 p-4">
      <div
        v-for="(column, index) in featureColumns"
        :key="index"
        class="w-80 flex relative flex-col items-center justify-start rounded-lg bg-[#dceef1] p-6 m-6 text-gray-800 shadow-sm"
        :class="index === 1 ? 'bg-white' : 'bg-[#DCEEF1]'"
      >
        <div
          v-if="index === 1"
          class="absolute -top-8 w-full rounded-t-3xl bg-[#E0095F] py-2 flex items-center justify-center shadow-md"
        >
          <p class="text-sm font-semibold text-white">Best for collaboration</p>
        </div>
        <header class="mb-6 text-center space-y-1">
          <p class="text-2xl font-medium capitalize text-[#1E1A2E]">
            {{ ['Playground', 'Free', 'Open Source'][index] }}
          </p>
          <p class="text-sm text-gray-600">
            {{
              [
                'Basic features, no login',
                'Advanced features, free account',
                'Code only, no login',
              ][index]
            }}
          </p>
        </header>
        <a
          :href="
            [
              'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=editor_selection&utm_campaign=playground',
              'https://www.mermaidchart.com/app/sign-up?utm_source=mermaid_js&utm_medium=editor_selection&utm_campaign=mermaid_chart',
              'https://mermaid.live/edit?utm_source=mermaid_live_editor&utm_medium=editor_selection&utm_campaign=open_source',
            ][index]
          "
          target="_blank"
          class="mb-4 flex h-10 w-full items-center justify-center rounded-xl hover:bg-[#272040] hover:text-white"
          :class="index === 1 ? 'bg-[#1e1a2e] text-[#BEDDE3]' : 'bg-[#BEDDE3] text-[#1E1A2E]'"
        >
          Start free
        </a>
        <div id="border-1"></div>
        <ul class="w-full space-y-2">
          <li
            v-for="{ iconUrl, featureName } in column"
            :key="featureName"
            class="flex items-center"
          >
            <img :src="iconUrl" :alt="featureName" class="mr-2 inline-block h-5 w-5" />
            <span>{{ featureName }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style>
#border-1 {
  border-bottom: 1px solid #bedde3;
  width: 100%;
  margin-bottom: 16px;
}
</style>
