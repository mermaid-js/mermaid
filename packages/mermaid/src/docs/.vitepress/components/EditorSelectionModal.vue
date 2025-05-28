<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

interface Feature {
  iconUrl: string;
  featureName: string;
}

interface EditorColumn {
  title: string;
  description: string;
  redirectUrl: string;
  highlighted?: boolean;
  features: Feature[];
}

const editorColumns: EditorColumn[] = [
  {
    title: 'Playground',
    description: 'Basic features, no login',
    redirectUrl:
      'https://www.mermaidchart.com/play?utm_source=mermaid_js&utm_medium=editor_selection&utm_campaign=playground',
    features: [
      { iconUrl: '/icons/public.svg', featureName: 'Diagram stored in URL' },
      { iconUrl: '/icons/terminal.svg', featureName: 'Code editor' },
      { iconUrl: '/icons/whiteboard.svg', featureName: 'Whiteboard' },
    ],
  },
  {
    title: 'Free',
    description: 'Advanced features, free account',
    redirectUrl:
      'https://www.mermaidchart.com/app/sign-up?utm_source=mermaid_js&utm_medium=editor_selection&utm_campaign=mermaid_chart&redirect=%2Fapp%2Fdiagrams%2Fnew',
    highlighted: true,
    features: [
      { iconUrl: '/icons/folder.svg', featureName: 'Storage' },
      { iconUrl: '/icons/terminal.svg', featureName: 'Code editor' },
      { iconUrl: '/icons/ai-diagram.svg', featureName: 'AI diagram generator' },
      { iconUrl: '/icons/whiteboard.svg', featureName: 'Whiteboard' },
      { iconUrl: '/icons/group.svg', featureName: 'Teams' },
      { iconUrl: '/icons/groups.svg', featureName: 'Multi-user editing' },
      { iconUrl: '/icons/ai-repair.svg', featureName: 'AI diagram repair' },
      { iconUrl: '/icons/version-history.svg', featureName: 'Version history' },
      { iconUrl: '/icons/comment.svg', featureName: 'Comments' },
      { iconUrl: '/icons/presentation.svg', featureName: 'Presentations' },
      { iconUrl: '/icons/plugins.svg', featureName: 'Advanced Plugins' },
    ],
  },
  {
    title: 'Open Source',
    description: 'Code only, no login',
    redirectUrl: 'https://mermaid.live/edit',
    features: [
      { iconUrl: '/icons/public.svg', featureName: 'Diagram stored in URL' },
      { iconUrl: '/icons/terminal.svg', featureName: 'Code editor' },
      { iconUrl: '/icons/open-source.svg', featureName: 'Open source' },
      { iconUrl: '/icons/version-history.svg', featureName: 'Version history' },
    ],
  },
];

const isVisible = ref(false);

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    (target.tagName === 'A' && target.textContent?.trim() === 'Try Editor') ||
    (target.tagName === 'SPAN' && target.textContent?.trim() === '💻 Open Editor')
  ) {
    e.preventDefault();
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
    class="fixed top-0 left-0 z-50 flex h-screen w-screen backdrop-blur-sm items-center justify-center"
    @click.self="isVisible = false"
  >
    <div class="flex flex-row rounded-3xl shadow relative gap-5 pt-20 pb-10 px-10 bg-[#F1F8FA]">
      <div
        v-for="column in editorColumns"
        class="w-80 flex relative flex-col justify-start items-center bg-[#dceef1] p-8 text-gray-800 shadow"
        :class="
          column.highlighted ? 'bg-white rounded-b-3xl shadow-xl' : 'bg-[#DCEEF1] rounded-3xl'
        "
      >
        <div
          v-if="column.highlighted"
          class="absolute -top-10 w-full rounded-t-3xl bg-[#E0095F] py-2 flex justify-center"
        >
          <p class="text-lg font-semibold text-white">Best for collaboration</p>
        </div>
        <header class="mb-6 w-full text-start space-y-1">
          <p class="text-2xl font-medium capitalize text-[#1E1A2E]">
            {{ column.title }}
          </p>
          <p class="text-sm text-gray-600">
            {{ column.description }}
          </p>
        </header>
        <a
          :href="column.redirectUrl"
          target="_blank"
          class="mb-6 flex h-10 w-full items-center justify-center rounded-xl hover:bg-[#272040] hover:text-white hover:shadow-md"
          :class="
            column.highlighted
              ? 'bg-[#1e1a2e] text-[#BEDDE3] hover:text-[#5CA3B4]'
              : 'bg-[#BEDDE3] hover:bg-[#5CA3B4] text-[#1E1A2E]'
          "
        >
          Start free
        </a>
        <div class="h-px w-full bg-[#bedde3] mb-6"></div>
        <ul class="w-full space-y-2">
          <li
            v-for="{ iconUrl, featureName } in column.features"
            :key="featureName"
            class="flex items-center gap-2"
          >
            <img :src="iconUrl" :alt="featureName" class="inline-block size-5" />
            <span>{{ featureName }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
