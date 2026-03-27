import { getConfig, log } from './mermaidUtils.js';
import { renderToSvg } from '@zenuml/core';

const regexp = /^\s*zenuml/;

/**
 * Draws a ZenUML diagram in the SVG element with id: id based on the
 * graph definition in text, using native SVG rendering.
 *
 * @param text - The text of the diagram
 * @param id - The id of the diagram which will be used as a DOM element id
 */
export const draw = function (text: string, id: string): Promise<void> {
  log.info('draw with ZenUML native SVG renderer');

  const code = text.replace(regexp, '');
  const { securityLevel } = getConfig();

  // Handle root and Document for when rendering in sandbox mode
  let sandboxElement: HTMLIFrameElement | null = null;
  if (securityLevel === 'sandbox') {
    sandboxElement = document.getElementById('i' + id) as HTMLIFrameElement;
  }

  const root = securityLevel === 'sandbox' ? sandboxElement?.contentWindow?.document : document;
  const svgEl = root?.querySelector(`svg#${id}`) as SVGSVGElement | null;

  if (!root || !svgEl) {
    log.error('Cannot find root or svg element');
    return Promise.resolve();
  }

  const result = renderToSvg(code);

  svgEl.setAttribute('width', String(result.width));
  svgEl.setAttribute('height', String(result.height));
  svgEl.setAttribute('viewBox', result.viewBox);
  svgEl.innerHTML = result.innerSvg;

  return Promise.resolve();
};

export default {
  draw,
};
