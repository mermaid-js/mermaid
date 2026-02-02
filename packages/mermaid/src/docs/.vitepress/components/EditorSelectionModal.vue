<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

interface Feature {
  iconUrl: string;
  featureName: string;
}

interface EditorColumn {
  title: string;
  description: string;
  redBarText?: string;
  redirectUrl?: string;
  buttonText?: string;
  highlighted?: boolean;
  proTrialUrl?: string;
  proTrialButtonText?: string;
  features: Feature[];
  isButtonMargined?: boolean;
}

const mermaidChartFeatures: Feature[] = [
  { iconUrl: '/icons/whiteboard.svg', featureName: 'Visual editor' },
  { iconUrl: '/icons/ai-diagram.svg', featureName: '300 AI credits' },
  { iconUrl: '/icons/folder.svg', featureName: 'Unlimited diagram storage' },
  { iconUrl: '/icons/presentation.svg', featureName: 'Limitless diagram size' },
  { iconUrl: '/icons/comment.svg', featureName: 'View & comment collaboration' },
];

const openSourceFeatures: Feature[] = [
  { iconUrl: '/icons/public.svg', featureName: 'Diagram stored in URL' },
  { iconUrl: '/icons/terminal.svg', featureName: 'Code editor' },
  { iconUrl: '/icons/open-source.svg', featureName: 'Open source' },
  { iconUrl: '/icons/version-history.svg', featureName: 'Version history' },
];

const editorColumns: EditorColumn[] = [
  {
    title: 'Mermaid Plus',
    description: 'Unlock AI, storage and collaboration',
    highlighted: true,
    redBarText: 'Recommended',
    proTrialButtonText: 'Start free trial',
    proTrialUrl:
      'https://www.mermaidchart.com/app/sign-up?utm_source=mermaid_js&utm_medium=2_editor_selection&utm_campaign=start_plus&redirect=%2Fapp%2Fuser%2Fbilling%2Fcheckout%3FisFromMermaid%3Dtrue%26tier%3Dplus',
    features: mermaidChartFeatures,
  },
  {
    title: 'Open Source',
    description: 'Code only, no login',
    buttonText: 'Start free',
    redirectUrl: 'https://mermaid.live/edit',
    features: openSourceFeatures,
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
    class="fixed top-0 left-0 z-50 flex h-screen w-screen backdrop-blur-sm items-center justify-center bg-[#8585A4]/40 plausible-event-name=editorSelectionModalOpen"
    @click.self="isVisible = false"
  >
    <div
      class="flex flex-col sm:flex-row rounded-3xl shadow relative gap-5 pt-10 sm:pt-20 pb-10 px-4 sm:px-10 bg-[#F1F8FA] overflow-y-auto max-h-full"
    >
      <div
        v-for="column in editorColumns"
        :key="column.title"
        class="sm:w-96 flex relative flex-col justify-start items-center p-6 sm:p-8 text-gray-800 shadow w-full"
        :class="
          column.highlighted ? 'bg-white rounded-b-3xl mt-10 sm:mt-0' : 'bg-[#DCEEF1] rounded-3xl'
        "
      >
        <div
          v-if="column.highlighted"
          class="absolute -top-10 w-full rounded-t-3xl bg-[#E0095F] py-2 flex justify-center"
        >
          <p class="text-lg font-semibold text-white">{{ column.redBarText }}</p>
        </div>

        <header class="mb-6 w-full text-start space-y-1">
          <p class="text-2xl font-medium text-[#1E1A2E]">{{ column.title }}</p>
          <p class="text-sm text-gray-600">{{ column.description }}</p>
        </header>

        <a
          v-if="column.redirectUrl"
          :href="column.redirectUrl"
          target="_blank"
          class="flex h-10 w-full bg-[#BEDDE3] hover:bg-[#5CA3B4] text-[#1E1A2E] items-center justify-center rounded-xl hover:text-white hover:shadow-md"
          :class="column.isButtonMargined ? 'mb-[88px]' : ' mb-6'"
        >
          {{ column.buttonText }}
        </a>

        <a
          v-if="column.proTrialUrl"
          :href="column.proTrialUrl"
          target="_blank"
          class="mb-6 flex h-10 w-full text-white items-center justify-center rounded-xl bg-[#E0095F] hover:bg-[#B0134A]"
        >
          {{ column.proTrialButtonText || 'Start Pro trial' }}
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
