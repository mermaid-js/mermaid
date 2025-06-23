/* eslint-disable no-console */
import DefaultTheme from 'vitepress/theme';
import Contributors from '../components/Contributors.vue';
import EditorSelectionModal from '../components/EditorSelectionModal.vue';
import HomePage from '../components/HomePage.vue';
import TopBar from '../components/TopBar.vue';
import './custom.css';
import Mermaid from './Mermaid.vue';
import { getRedirect } from './redirect.js';
import Tooltip from './Tooltip.vue';
// @ts-ignore Type not available
import 'uno.css';
import type { EnhanceAppContext } from 'vitepress';
import Theme from 'vitepress/theme';
import { h } from 'vue';
import '../style/main.css';

export default {
  ...DefaultTheme,
  Layout() {
    return h(Theme.Layout, null, {
      'home-features-after': () => h(HomePage),
      'home-hero-before': () => h(TopBar),
      'doc-before': () => h(TopBar),
      'layout-bottom': () => h(Tooltip),
      'home-hero-after': () => h(EditorSelectionModal),
    });
  },
  enhanceApp({ app, router }: EnhanceAppContext) {
    // register global components
    app.component('Mermaid', Mermaid);
    app.component('Contributors', Contributors);

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
