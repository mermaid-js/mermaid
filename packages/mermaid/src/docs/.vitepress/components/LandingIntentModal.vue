<script setup lang="ts">
import { onMounted, ref, type Component } from 'vue';
import DocsIcon from '~icons/material-symbols/docs-outline-rounded';
import ChevronIcon from '~icons/material-symbols/chevron-right-rounded';
import CodeIcon from '~icons/material-symbols/code-blocks-outline';
import EditIcon from '~icons/material-symbols/rebase-edit-outline-rounded';
import {
  landingPopUpStorageKey,
  markLandingPopUpSeen,
  type LandingPopUpChoice,
  shouldShowLandingPopUp,
} from '../landingPopUp.js';
import { trackPlausibleEvent } from '../theme/plausible.js';

const isVisible = ref(false);

type LandingOption = {
  choice: Exclude<LandingPopUpChoice, 'skip'>;
  title: string;
  description: string;
  cta: string;
  rowClass: string;
  icon: Component;
};

const links: Record<Exclude<LandingPopUpChoice, 'skip'>, string> = {
  'full-editor':
    'https://mermaid.ai/app/sign_up?utm_source=mermaid_js&utm_medium=landing_pop_up&utm_campaign=editor_v1',
  'browse-docs':
    'https://mermaid.ai/open-source/intro/index.html?utm_source=mermaid_js&utm_medium=landing_pop_up&utm_campaign=docs_v1',
  'live-editor': 'https://mermaid.live',
};

const options: LandingOption[] = [
  {
    choice: 'full-editor',
    title: "Mermaid's full editor",
    description: 'Render existing diagrams or build with AI, code, drag-and-drop, or voice.',
    cta: 'Start free',
    rowClass: 'border-[#f84594]',
    icon: EditIcon,
  },
  {
    choice: 'browse-docs',
    title: 'Browse the docs',
    description: 'Mermaid syntax reference, diagram guides, and contributor docs.',
    cta: 'Read docs',
    rowClass: 'border-[#2b2542]',
    icon: DocsIcon,
  },
  {
    choice: 'live-editor',
    title: 'Code in the live editor',
    description: 'Write Mermaid syntax with live preview — no account needed.',
    cta: 'Mermaid live',
    rowClass: 'border-[#2b2542]',
    icon: CodeIcon,
  },
];

const rememberSeen = () => {
  markLandingPopUpSeen((value) => {
    window.localStorage.setItem(landingPopUpStorageKey, value);
  });
};

const handleChoice = (choice: LandingPopUpChoice) => {
  void trackPlausibleEvent('landingPopUp', { props: { choice } });
  isVisible.value = false;
  rememberSeen();

  if (choice === 'skip') {
    return;
  }

  window.location.href = links[choice];
};

onMounted(() => {
  const visible = shouldShowLandingPopUp({
    hostname: window.location.hostname,
    referrer: document.referrer,
    getLastSeen: () => window.localStorage.getItem(landingPopUpStorageKey),
  });

  if (!visible) {
    return;
  }

  isVisible.value = true;
});
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-[#070916]/70 p-4"
    @click.self="handleChoice('skip')"
  >
    <div
      class="w-full max-w-[654px] rounded-2xl border border-[#374151] bg-[#1a1625] p-8 text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)]"
    >
      <div class="flex flex-col items-center text-center">
        <img
          src="/favicon.svg"
          alt="Mermaid"
          class="h-[41px] w-[41px] rounded-[8px]"
        />
        <div class="h-2 w-px" />
        <h2 class="mt-2 text-2xl font-bold text-white">What are you looking for?</h2>
        <p class="mt-1 text-xs font-light text-[#f5f5f5]">
          Choose the right tool for what you need
        </p>
      </div>

      <div class="mt-5 grid gap-3">
        <button
          v-for="option in options"
          :key="option.choice"
          class="flex items-center gap-3 overflow-hidden rounded-lg border bg-transparent py-[14px] pl-3 pr-2 text-left transition-colors hover:border-[#f84594] hover:bg-[#211c31] hover:shadow-[0_0_0_1px_#f84594]"
          :class="option.rowClass"
          @click="handleChoice(option.choice)"
        >
          <div class="flex h-5 w-5 shrink-0 items-center justify-center text-[#f5f5f5]">
            <component :is="option.icon" class="h-5 w-5" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="text-[14px] font-medium text-white">{{ option.title }}</div>
            <p class="mt-0.5 text-xs font-light leading-[1.2] text-[#9ca3af]">
              {{ option.description }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3 pl-2">
            <span class="rounded-full bg-[#332a54] px-3 py-1 text-xs leading-4 text-white">
              {{ option.cta }}
            </span>
            <ChevronIcon class="h-[11px] w-[11px] text-[#6b7280]" />
          </div>
        </button>
      </div>

      <div class="mt-6 text-center text-xs text-[#6b7280]">
        <button class="underline" @click="handleChoice('skip')">
          Just exploring, skip for now
        </button>
        <p class="mt-3">The full editor is part of mermaid.ai. Start free today.</p>
      </div>
    </div>
  </div>
</template>
