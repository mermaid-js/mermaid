import type {
  DiagramDetector,
  DiagramLoader,
  ExternalDiagramDefinition,
} from '../../diagram-api/types.js';

const id = 'class';

const detector: DiagramDetector = (txt, config) => {
  // If we have configured to use dagre-wrapper then we should never return true in this function
  if (config?.class?.defaultRenderer === 'dagre-wrapper') {
    return false;
  }
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return /^\s*classDiagram/.test(txt);
};

const loader: DiagramLoader = async () => {
  const { diagram } = await import('./classDiagram.js');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
