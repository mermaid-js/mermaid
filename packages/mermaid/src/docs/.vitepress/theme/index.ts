import DefaultTheme from 'vitepress/theme';
import './custom.css';
// @ts-ignore
import Mermaid from './Mermaid.vue';
import { getRedirect } from './redirect';

export default {
  ...DefaultTheme,
  enhanceApp({ app, router }) {
    // register global components
    app.component('Mermaid', Mermaid);
    router.onBeforeRouteChange = (to) => {
      if (router.route.path !== '/') {
        return;
      }
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
} as typeof DefaultTheme;
