import { renderToSvg } from '@zenuml/core';
import { getConfig, log } from './mermaidUtils.js';

const regexp = /^\s*zenuml/;

export const calculateSvgSizeAttrs = (
  width: number,
  height: number,
  useMaxWidth: boolean
): Map<string, string> => {
  const attrs = new Map<string, string>();

  if (useMaxWidth) {
    attrs.set('width', '100%');
    attrs.set('style', `max-width: ${width}px;`);
  } else {
    attrs.set('width', String(width));
    attrs.set('height', String(height));
  }

  return attrs;
};

/**
 * Resolves the root document and SVG element, handling sandbox mode.
 * Follows the same pattern as mermaid's selectSvgElement utility.
 */
const selectSvgElement = (id: string): SVGSVGElement | null => {
  const { securityLevel } = getConfig();
  let root: Document = document;

  if (securityLevel === 'sandbox') {
    const sandboxElement = document.querySelector<HTMLIFrameElement>(`#i${id}`);
    root = sandboxElement?.contentDocument ?? document;
  }

  return root.querySelector<SVGSVGElement>(`#${id}`);
};

const configureSvgSize = (
  svgEl: SVGSVGElement,
  width: number,
  height: number,
  useMaxWidth: boolean
) => {
  const attrs = calculateSvgSizeAttrs(width, height, useMaxWidth);

  svgEl.removeAttribute('height');
  svgEl.style.removeProperty('max-width');

  for (const [attr, value] of attrs) {
    svgEl.setAttribute(attr, value);
  }
};

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
  const config = getConfig();
  const useMaxWidth = config.sequence?.useMaxWidth ?? true;

  const svgEl = selectSvgElement(id);

  if (!svgEl) {
    log.error('Cannot find svg element');
    return Promise.resolve();
  }

  const result = renderToSvg(code);

  configureSvgSize(svgEl, result.width, result.height, useMaxWidth);
  svgEl.setAttribute('viewBox', result.viewBox);
  svgEl.innerHTML = result.innerSvg;

  return Promise.resolve();
};

export default {
  draw,
};
