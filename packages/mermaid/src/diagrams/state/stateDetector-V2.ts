import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'stateDiagram';

const detector: DiagramDetector = (txt, config) => {
  if (/^\s*stateDiagram-v2/.test(txt)) {
    return true;
  }
  if (/^\s*stateDiagram/.test(txt) && config?.state?.defaultRenderer === 'dagre-wrapper') {
    return true;
  }
  return false;
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./stateDiagram-v2.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
