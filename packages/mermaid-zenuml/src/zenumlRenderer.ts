// @ts-nocheck TODO: fix file
import { getConfig, log } from './mermaidUtils';
import ZenUml from 'vue-sequence';
import { regexp } from './detector';
import 'vue-sequence/dist/vue-sequence.css';

// Load Zen UML CSS
function loadCss(root: Document, url: string) {
  // Avoid loading the same CSS multiple times
  if (root.querySelector(`link[href="${url}"]`)) {
    return;
  }

  const link = root.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = url;
  root.getElementsByTagName('head')[0].appendChild(link);
}

// Create a Zen UML container outside of the svg first for rendering, otherwise the Zen UML diagram cannot be rendered properly
function createTemporaryZenumlContainer() {
  const container = document.createElement('div');
  container.innerHTML = '<div id="app"></div>';
  container.style.display = 'none';
  const app = container.querySelector('#app') as HTMLElement;
  return { container, app };
}

// Create a foreignObject to wrap the Zen UML container in the svg
function createForeignObject() {
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreignObject.setAttribute('x', 0);
  foreignObject.setAttribute('y', 0);
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  return foreignObject;
}

/**
 * Draws a Zen UML in the tag with id: id based on the graph definition in text.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id¨
 */
export const draw = async function (text: string, id: string) {
  log.info('draw with Zen UML renderer', ZenUml);

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
    log.error('Cannot find root or svgContainer');
    return;
  }

  loadCss(root, './style.css');

  const foreignObject = createForeignObject();
  svgContainer.appendChild(foreignObject);

  const { container, app } = createTemporaryZenumlContainer();
  document.body.appendChild(container);

  const zenuml = new ZenUml(app);
  await zenuml.render(text, 'default');

  const zenUml = document.querySelector('.zenuml');
  log.info(zenUml, foreignObject);
  const zenumlClone = zenUml.cloneNode(true);
  foreignObject.appendChild(zenumlClone);
  const { width, height } = window.getComputedStyle(zenumlClone);
  log.debug('zenuml size', width, height);
  svgContainer.setAttribute('style', `width: ${width}; height: ${height};`);
  container.remove();
};

export default {
  draw,
};
