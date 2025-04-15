import { select } from 'd3';

export const getDiagramElement = (id, securityLevel) => {
  let sandboxElement;
  if (securityLevel === 'sandbox') {
    sandboxElement = select('#i' + id);
  }
  const root =
    securityLevel === 'sandbox'
      ? select(sandboxElement.nodes()[0].contentDocument.body)
      : select('body');

  const svg = root.select(`[id="${id}"]`);

  // Run the renderer. This is what draws the final graph.

  return svg;
};
