import type { DiagramDetector, ExternalDiagramDefinition } from '../../diagram-api/types';

const id = 'class';

const detector: DiagramDetector = (txt, config) => {
  // If we have configured to use dagre-wrapper then we should never return true in this function
  if (config?.class?.defaultRenderer === 'dagre-wrapper') {
    return false;
  }
  // We have not opted to use the new renderer so we should return true if we detect a class diagram
  return txt.match(/^\s*classDiagram/) !== null;
};

const loader = async () => {
  const { diagram } = await import('./classDiagram');
  return { id, diagram };
};

const plugin: ExternalDiagramDefinition = {
  id,
  detector,
  loader,
};

export default plugin;
