import { select } from 'd3';
import type { MermaidConfig } from '../config.type.js';
import type { SVG } from '../diagram-api/types.js';
import type { D3HtmlSelection } from '../types.js';

export const getDiagramElement = (
  id: string,
  securityLevel: MermaidConfig['securityLevel']
): SVG => {
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select<HTMLIFrameElement, unknown>('#i' + id);
  }
  const root = (
    sandboxElement ? select(sandboxElement.nodes()[0].contentDocument!.body) : select('body')
  ) as D3HtmlSelection<HTMLElement>;

  const svg = root.select<SVGSVGElement>(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.

  return svg;
};
