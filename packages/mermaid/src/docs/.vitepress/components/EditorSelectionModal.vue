<script setup lang="ts">
import { onMounted, onUnmounted, ref, type Component } from 'vue';
import AtlassianIcon from '~icons/logos/atlassian';
import AmazonIcon from '~icons/logos/aws';
import GoogleIcon from '~icons/logos/google';
import MicrosoftIcon from '~icons/logos/microsoft';
import { trackPlausibleEvent } from '../theme/plausible.js';

interface Feature {
  title: string;
  description: string;
}

const features: Feature[] = [
  { title: 'AI diagram generation', description: 'Describe what you need, AI builds it' },
  { title: 'Visual drag-and-drop editor', description: 'Edit diagrams without writing code' },
  { title: 'Unlimited diagram storage', description: 'Save and organize all your diagrams' },
  { title: 'Team collaboration', description: 'Share, comment, and edit together in real-time' },
];

const trustedLogos: { name: string; icon: Component }[] = [
  { name: 'Google', icon: GoogleIcon },
  { name: 'Microsoft', icon: MicrosoftIcon },
  { name: 'Atlassian', icon: AtlassianIcon },
  { name: 'Amazon', icon: AmazonIcon },
];

const isVisible = ref(false);

const close = () => {
  isVisible.value = false;
};

const handleStartTrial = () => {
  void trackPlausibleEvent('editor-pick', { props: { choice: 'mermaid-plus' } });
  close();
  window.open(
    'https://mermaid.ai/app/sign-up?utm_source=mermaid_js&utm_medium=editorSelection&utm_campaign=live_2026&redirect=%2Fapp%2Fuser%2Fbilling%2Fcheckout%3FisFromMermaid%3Dtrue%26tier%3Dplus',
    '_blank'
  );
};

const handleStayOnLive = () => {
  void trackPlausibleEvent('editor-pick', { props: { choice: 'open-source' } });
  close();
  window.open('https://mermaid.live/edit', '_blank');
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
    class="fixed top-0 left-0 z-50 flex h-screen w-screen items-center justify-center bg-[#8585A4]/40 backdrop-blur-sm"
    @click.self="close"
  >
    <div
      class="flex max-h-full w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-3xl bg-white p-8 shadow"
    >
      <!-- Header -->
      <div class="flex flex-col items-start gap-2">
        <img src="/favicon.svg" alt="Mermaid" class="size-10 rounded-lg" />
        <h2 class="pt-2 text-2xl font-bold text-[#1E1A2E]">Try the full Mermaid experience</h2>
        <p class="text-xs font-light text-[#6B7280]">
          Free forever, with Plus features free for 7 days.
        </p>
      </div>

      <!-- Features -->
      <ul class="mt-2 flex flex-col gap-3">
        <li
          v-for="feature in features"
          :key="feature.title"
          class="flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3"
        >
          <span class="size-2 shrink-0 rounded-full bg-[#E0095F]" />
          <div class="flex flex-col gap-0.5">
            <p class="text-xs text-[#1E1A2E]">{{ feature.title }}</p>
            <p class="text-xs font-light text-[#6B7280]">{{ feature.description }}</p>
          </div>
        </li>
      </ul>

      <!-- Actions -->
      <div class="mt-2 flex items-center gap-3">
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#E0095F] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B0134A] focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          @click="handleStartTrial"
        >
          Start free trial
        </button>
        <button
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-solid border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1E1A2E] shadow-sm transition-colors hover:bg-[#E0095F] hover:text-white focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          @click="handleStayOnLive"
        >
          Go to mermaid.live
        </button>
      </div>

      <!-- Trusted by -->
      <div class="mt-3 flex flex-col items-start gap-4">
        <p class="text-xs text-[#1E1A2E]">Trusted by 5M people and over 200k companies</p>
        <div class="flex w-full items-center justify-between gap-2">
          <component
            :is="logo.icon"
            v-for="logo in trustedLogos"
            :key="logo.name"
            class="h-6 w-auto grayscale"
            :aria-label="logo.name"
          />
        </div>
      </div>

      <!-- Privacy Policy Link -->
      <div class="mt-2 text-center">
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
