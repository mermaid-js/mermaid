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
