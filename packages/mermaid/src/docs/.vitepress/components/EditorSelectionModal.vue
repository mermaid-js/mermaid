<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { trackPlausibleEvent } from '../theme/plausible.js';

interface Feature {
  iconUrl: string;
  featureName: string;
}

const mermaidPlusFeatures: Feature[] = [
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

const isVisible = ref(false);

const close = () => {
  isVisible.value = false;
};

const handleStartTrial = () => {
  void trackPlausibleEvent('editor-pick', { props: { choice: 'mermaid-plus' } });
  close();
  window.open(
    'https://mermaid.ai/app/sign-up?utm_source=mermaid_js&utm_medium=2_editor_selection&utm_campaign=start_plus&redirect=%2Fapp%2Fuser%2Fbilling%2Fcheckout%3FisFromMermaid%3Dtrue%26tier%3Dplus',
    '_blank'
  );
};

const handleStartFree = () => {
  void trackPlausibleEvent('editor-pick', { props: { choice: 'open-source' } });
  close();
  window.open('https://mermaid.live/edit', '_blank');
};

const handleContinueToNewHome = () => {
  void trackPlausibleEvent('editor-pick', { props: { choice: 'new-home' } });
  close();
  window.open('https://mermaid.ai/live/edit', '_blank');
};

const handleMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (
    (target.tagName === 'A' && target.textContent?.trim() === 'Try Editor') ||
    (target.tagName === 'SPAN' && target.textContent?.trim() === '💻 Open Editor')
  ) {
    e.preventDefault();
    isVisible.value = !isVisible.value;
    void trackPlausibleEvent('editorSelectionModalOpen');
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
    class="fixed top-0 left-0 z-50 flex h-screen w-screen backdrop-blur-sm items-center justify-center bg-[#8585A4]/40"
    @click.self="close"
  >
    <div
      class="flex max-w-2xl flex-col gap-6 bg-[#FFF1F2] p-6 rounded-3xl shadow overflow-y-auto max-h-full"
    >
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-2xl font-semibold text-[#1E1A2E]">Choose your editor</h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Mermaid Plus Card -->
        <div
          class="relative flex flex-col overflow-hidden rounded-xl border-2 border-[#E0095F] bg-white shadow"
        >
          <div class="bg-[#E0095F] px-6 py-2 text-center text-sm font-semibold text-white">
            Recommended
          </div>

          <div class="flex flex-col gap-4 p-6">
            <div>
              <h3 class="text-xl font-bold text-[#1E1A2E]">Mermaid Plus</h3>
              <p class="text-sm text-[#6B7280]">Unlock AI, storage and collaboration</p>
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex justify-center">
                <span
                  class="rounded-full bg-[#FCE7F3] px-3 py-0.5 text-xs font-semibold text-[#BE185D]"
                >
                  10% off with code JS26
                </span>
              </div>

              <button
                class="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 bg-[#E0095F] text-white hover:bg-[#B0134A] shadow-sm h-9 px-4 py-2 cursor-pointer"
                @click="handleStartTrial"
              >
                Start free trial
              </button>
            </div>

            <ul class="space-y-3 text-sm text-[#1E1A2E]">
              <li
                v-for="{ iconUrl, featureName } in mermaidPlusFeatures"
                :key="featureName"
                class="flex items-center gap-2"
              >
                <img :src="iconUrl" :alt="featureName" class="size-4 shrink-0 opacity-60" />
                {{ featureName }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Open Source Card -->
        <div class="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 shadow">
          <div class="flex flex-col pt-9">
            <h3 class="text-xl font-bold text-[#1E1A2E]">Open Source</h3>
            <p class="text-sm text-[#6B7280]">Code only, no login, always free</p>
          </div>

          <div class="flex flex-col gap-2">
            <p class="mt-2 text-sm text-[#6B7280]">Mermaid has a new home</p>
            <button
              class="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 border-solid border border-[#E0095F] bg-white text-[#1E1A2E] hover:bg-[#E0095F] hover:text-white shadow-sm h-9 px-4 py-2 cursor-pointer"
              @click="handleContinueToNewHome"
            >
              Continue to mermaid.ai/live
              <svg class="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>
            <button
              class="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 border-solid border border-[#E5E7EB] bg-white text-[#1E1A2E] hover:bg-[#E0095F] hover:text-white shadow-md h-9 px-4 py-2 cursor-pointer"
              @click="handleStartFree"
            >
              Stay on mermaid.live
            </button>
          </div>

          <ul class="space-y-3 text-sm text-[#1E1A2E]">
            <li
              v-for="{ iconUrl, featureName } in openSourceFeatures"
              :key="featureName"
              class="flex items-center gap-2"
            >
              <img :src="iconUrl" :alt="featureName" class="size-4 shrink-0 opacity-60" />
              {{ featureName }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Privacy Policy Link -->
      <div class="text-center">
        <a
          href="https://mermaid.ai/privacy-policy"
          target="_blank"
          class="text-sm text-[#1E1A2E] underline hover:text-[#E0095F]"
        >
          mermaid.ai Privacy Policy
        </a>
      </div>
    </div>
  </div>
</template>
