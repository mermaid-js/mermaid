import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types.js';

const id = 'stateDiagram';

const detector: DiagramDetector = (text, config) => {
  if (text.match(/^\s*stateDiagram-v2/) !== null) {
    return true;
  }
  if (text.match(/^\s*stateDiagram/) && config?.state?.defaultRenderer === 'dagre-wrapper') {
    return true;
  }
  if (text.match(/^\s*stateDiagram/) && config?.state?.defaultRenderer === 'dagre-wrapper') {
    return true;
  }
  return false;
};

const loader = async () => {
  const { diagram } = await import('./stateDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
