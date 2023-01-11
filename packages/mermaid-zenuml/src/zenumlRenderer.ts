// @ts-nocheck TODO: fix file
import { getConfig, log } from './mermaidUtils';
import ZenUml from '@zenuml/core';
import { regexp } from './detector';

// Create a Zen UML container outside the svg first for rendering, otherwise the Zen UML diagram cannot be rendered properly
function createTemporaryZenumlContainer(id: string) {
  const container = document.createElement('div');
  container.id = `container-${id}`;
  container.style.display = 'flex';
  container.innerHTML = `<div id="zenUMLApp-${id}"></div>`;
  const app = container.querySelector(`#zenUMLApp-${id}`) as HTMLElement;
  return { container, app };
}

// Create a foreignObject to wrap the Zen UML container in the svg
function createForeignObject(id) {
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreignObject.setAttribute('x', 0);
  foreignObject.setAttribute('y', 0);
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  const { container, app } = createTemporaryZenumlContainer(id);
  foreignObject.appendChild(container);
  return { foreignObject, container, app };
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

  const { foreignObject, container, app } = createForeignObject(id);
  svgContainer.appendChild(foreignObject);

  const zenuml = new ZenUml(app);
  // default is a theme name. More themes to be added and will be configurable in the future
  await zenuml.render(text, 'theme-mermaid');

  const { width, height } = window.getComputedStyle(container);
  log.debug('zenuml diagram size', width, height);
  svgContainer.setAttribute('style', `width: ${width}; height: ${height};`);
};

export default {
  draw,
};
