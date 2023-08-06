import { select } from 'd3';
import { getConfig } from '../config.js';
import type { HTML, SVG } from '../diagram-api/types.js';

/**
 * Selects the SVG element using {@link id}.
 *
 * @param id - The diagram ID.
 * @returns The selected {@link SVG} element using {@link id}.
 */
export const selectSvgElement = (id: string): SVG => {
  const { securityLevel } = getConfig();
  // handle root and document for when rendering in sandbox mode
  let root: HTML = select('body');
  if (securityLevel === 'sandbox') {
    const sandboxElement: HTML = select(`#i${id}`);
    const doc: Document = sandboxElement.node()?.contentDocument ?? document;
    root = select(doc.body as HTMLIFrameElement);
  }
  const svg: SVG = root.select(`#${id}`);
  return svg;
};
