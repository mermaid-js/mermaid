import type { DiagramDetector } from '../../diagram-api/types.js';
import type { ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'flowchart-v2';

const detector: DiagramDetector = (txt, config) => {
  if (
    config?.flowchart?.defaultRenderer === 'dagre-d3' ||
    config?.flowchart?.defaultRenderer === 'elk'
  ) {
    return false;
  }

  // If we have configured to use dagre-wrapper then we should return true in this function for graph code thus making it use the new flowchart diagram
  if (txt.match(/^\s*graph/) !== null && config?.flowchart?.defaultRenderer === 'dagre-wrapper') {
    return true;
  }
  return txt.match(/^\s*flowchart/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./flowDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
