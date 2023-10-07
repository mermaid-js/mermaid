import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import Mermaid from './Mermaid.vue';
// @ts-ignore
import Contributors from '../components/Contributors.vue';
// @ts-ignore
import HomePage from '../components/HomePage.vue';
// @ts-ignore
import TopBar from '../components/TopBar.vue';

import { getRedirect } from './redirect.js';

import { h } from 'vue';

import Theme from 'vitepress/theme';
import '../style/main.css';
import 'uno.css';

export default {
  ...DefaultTheme,
  Layout() {
    return h(Theme.Layout, null, {
      'home-hero-before': () => h(TopBar),
      'home-features-after': () => h(HomePage),
    });
  },
  enhanceApp({ app, router }) {
    // register global components
    app.component('Mermaid', Mermaid);
    app.component('Contributors', Contributors);
    router.onBeforeRouteChange = (to) => {
      try {
        const newPath = getRedirect(to);
        if (newPath) {
          console.log(`Redirecting to ${newPath} from ${window.location}`);
          // router.go isn't loading the ID properly.
          window.location.href = `/${newPath}`;
        }
      } catch (e) {}
    };
  },
};
