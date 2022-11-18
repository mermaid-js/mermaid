import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'flowchart';

const detector: DiagramDetector = (txt, config) => {
  // If we have confirmed to only use new flow charts this function should always return false
  // as in not signalling true for a legacy flowchart
  if (config?.flowchart?.defaultRenderer === 'dagre-wrapper') return false;
  return txt.match(/^\s*graph/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./flowDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
