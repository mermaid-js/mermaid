/* eslint-disable no-console */
import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore Type not available
import Mermaid from './Mermaid.vue';
// @ts-ignore Type not available
import Contributors from '../components/Contributors.vue';
// @ts-ignore Type not available
import HomePage from '../components/HomePage.vue';
// @ts-ignore Type not available
import TopBar from '../components/TopBar.vue';
import { getRedirect } from './redirect.js';
// @ts-ignore Type not available
import 'uno.css';
import type { EnhanceAppContext } from 'vitepress';
import Theme from 'vitepress/theme';
import { h } from 'vue';
import '../style/main.css';

// Add tooltips to Mermaid Chart buttons
const addMermaidChartTooltips = () => {
  const tooltipStyle = document.createElement('style');
  tooltipStyle.textContent = `
    .mermaid-chart-tooltip {
      position: absolute;
      background: black;
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      pointer-events: none;
      z-index: 1000;
      max-width: 20rem;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: translateY(-90%);
      margin-top: -0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .mermaid-chart-tooltip.visible {
      opacity: 1;
      transform: translateY(-100%);
    }
    .mermaid-chart-tooltip svg {
      width: 1.25rem;
      height: 1.25rem;
      fill: currentColor;
    }
  `;
  document.head.appendChild(tooltipStyle);

  const tooltip = document.createElement('div');
  tooltip.className = 'mermaid-chart-tooltip';
  document.body.appendChild(tooltip);

  let currentTarget: HTMLElement | null = null;

  const showTooltip = (target: HTMLElement) => {
    currentTarget = target;
    const rect = target.getBoundingClientRect();
    tooltip.innerHTML = `
      <span class="mdi mdi-open-in-new"></span>
      Opens in MermaidChart.com
    `;
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top + 'px';
    tooltip.classList.add('visible');
  };

  const hideTooltip = () => {
    currentTarget = null;
    tooltip.classList.remove('visible');
  };

  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    if (
      target.matches('a[href*="mermaidchart.com"]') ||
      target.matches('button[onclick*="mermaidchart.com"]')
    ) {
      showTooltip(target);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (!currentTarget?.contains(e.relatedTarget as HTMLElement)) {
      hideTooltip();
    }
  });
};

export default {
  ...DefaultTheme,
  Layout() {
    return h(Theme.Layout, null, {
      // Keeping this as comment as it took a lot of time to figure out how to add a component to the top bar.
      'home-hero-before': () => h(TopBar),
      'home-features-after': () => h(HomePage),
      'doc-before': () => h(TopBar),
    });
  },
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global components
    app.component('Mermaid', Mermaid);
    app.component('Contributors', Contributors);

    // Add tooltips after app is mounted
    app.mixin({
      mounted() {
        addMermaidChartTooltips();
      },
    });

    router.onBeforeRouteChange = (to) => {
      try {
        const url = new URL(window.location.origin + to);
        const newPath = getRedirect(url);
        if (newPath) {
          console.log(`Redirecting to ${newPath} from ${window.location.toString()}`);
          // router.go isn't loading the ID properly.
          window.location.href = `/${newPath}`;
        }
      } catch (e) {
        console.error(e);
      }
    };
  },
};
