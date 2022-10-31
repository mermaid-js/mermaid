// @ts-nocheck TODO: fix file
import { getConfig } from './mermaidUtils';
import { VueSequence } from 'vue-sequence';
import { regexp } from './detector';

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

  const diagram = root?.querySelector(`#d${id}`);

  if (!root || !diagram) {
    return;
  }

  loadCss(root, './zenuml.css');

  Vue.use(Vuex);
  const store = new Vuex.Store(VueSequence.Store());
  store.dispatch('updateCode', { code: text });
  new Vue({
    el: diagram,
    store,
    render: (h) => h(VueSequence.DiagramFrame),
  });
};

export default {
  draw,
};
