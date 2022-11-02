// @ts-nocheck TODO: fix file
import { getConfig } from './mermaidUtils';
import { VueSequence } from 'vue-sequence';
import { regexp } from './detector';
import 'vue-sequence/dist/vue-sequence.css';

const { Vue, Vuex } = VueSequence;

function loadCss(root: Document, url: string) {
  const link = root.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  root.getElementsByTagName('head')[0].appendChild(link);
}

/**
 * Draws a Zen UML in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 */
export const draw = function (text: string, id: string) {
  text = text.replace(regexp, '');
  const { securityLevel } = getConfig();
  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement: HTMLIFrameElement | null = null;
  if (securityLevel === 'sandbox') {
    sandboxElement = document.getElementById('i' + id) as HTMLIFrameElement;
  }

  const root = securityLevel === 'sandbox' ? sandboxElement?.contentWindow?.document : document;

  const svgContainer = root?.querySelector(`svg#${id}`);

  if (!root || !svgContainer) {
    return;
  }

  loadCss(root, './style.css');

  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreignObject.setAttribute('x', 0);
  foreignObject.setAttribute('y', 0);
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  svgContainer?.appendChild(foreignObject);

  // Create a Zen UML container outside of the svg first, otherwise the Zen UML diagram cannot be rendered properly
  const container = document.createElement('div');
  container.innerHTML = '<div id="app"></div>';
  container.style.display = 'none';
  const app = container.querySelector('#app') as HTMLElement;
  document.body.appendChild(container);

  Vue.use(Vuex);
  const store = new Vuex.Store(VueSequence.Store());
  store.dispatch('updateCode', { code: text });

  new Vue({
    el: app,
    store,
    render: (h) => {
      return h(VueSequence.DiagramFrame);
    },
  });

  // The vue-sequence component is rendered in the Zen UML container, so we need to move the output dom to the svg container
  setTimeout(() => {
    const x = document.querySelector('.zenuml');
    const y = document.querySelector('foreignObject');
    const z = document.querySelector(`svg#${id}`);
    y?.appendChild(x);
    const { width, height } = window.getComputedStyle(x);
    z?.setAttribute('style', `width: ${width}; height: ${height};`);
    app.style = 'display: block';
  }, 1000);

  /*
    Alternative: export dom to svg in data url format and set it as the src of the image

    setTimeout(function () {
      document.querySelector('.frame')?.parentElement.__vue__.toSvg().then((dataUrl: string) => {
      log.info(dataUrl);
      const img = new Image();
      img.src = dataUrl;
      diagram.appendChild(img);
    });
  }, 1000); */
};

export default {
  draw,
};
